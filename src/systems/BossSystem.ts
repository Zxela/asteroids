/**
 * Boss System
 *
 * Implements boss AI with movement patterns and attack behaviors.
 *
 * Responsibilities:
 * - Query entities with Boss, Transform, Velocity, Health components
 * - Execute attack patterns based on bossType and current attackPattern
 * - Pattern alternation every 3 seconds (using Boss.phaseTimer)
 * - Apply phase-based modifiers (speed, fire rate, damage)
 * - Update Velocity component based on AI calculations
 *
 * Boss Types and Patterns:
 * - Destroyer:
 *   - Charge: Move toward player, attempt collision
 *   - Spray: Strafe around player, fire spread projectiles
 * - Carrier:
 *   - Summon: Stay stationary, spawn asteroid minions
 *   - Retreat: Move away from player, fire homing projectiles
 *
 * Phase Modifiers:
 * - Phase 1: 1.0x (normal)
 * - Phase 2: 1.5x (increased speed and fire rate)
 * - Phase 3: 2.0x (maximum difficulty)
 */

import { Vector3 } from 'three'
import { Health, Player, Transform, Velocity } from '../components'
import { Boss } from '../components/Boss'
import {
  BOSS_AI_CONFIG,
  type PhaseModifier,
  getFirstPattern,
  getNextPattern,
  getPhaseModifier
} from '../config/bossConfig'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'
import type { AttackPattern, BossType } from '../types/components'

// Type assertions for component classes
const BossClass = Boss as unknown as ComponentClass<Boss>
const HealthClass = Health as unknown as ComponentClass<Health>
const TransformClass = Transform as unknown as ComponentClass<Transform>
const VelocityClass = Velocity as unknown as ComponentClass<Velocity>
const PlayerClass = Player as unknown as ComponentClass<Player>

/**
 * Boss pattern changed event.
 */
export interface BossPatternChangedEvent {
  type: 'bossPatternChanged'
  timestamp: number
  data: {
    entityId: EntityId
    bossType: BossType
    previousPattern: AttackPattern
    newPattern: AttackPattern
    phase: number
  }
}

/**
 * Boss projectile fired event.
 */
export interface BossProjectileFiredEvent {
  type: 'bossProjectileFired'
  timestamp: number
  data: {
    entityId: EntityId
    position: Vector3
    direction: Vector3
    projectileCount: number
    isSpread: boolean
  }
}

/**
 * Boss homing projectile fired event.
 */
export interface BossHomingFiredEvent {
  type: 'bossHomingFired'
  timestamp: number
  data: {
    entityId: EntityId
    position: Vector3
    targetId: EntityId
    projectileCount: number
  }
}

/**
 * Boss spawned minion event.
 */
export interface BossSpawnedMinionEvent {
  type: 'bossSpawnedMinion'
  timestamp: number
  data: {
    entityId: EntityId
    position: Vector3
    spawnCount: number
  }
}

/**
 * Union type of all events emitted by BossSystem.
 */
export type BossSystemEvent =
  | BossPatternChangedEvent
  | BossProjectileFiredEvent
  | BossHomingFiredEvent
  | BossSpawnedMinionEvent

/**
 * Internal state tracking for boss entities.
 */
interface BossState {
  /** Fire timer for spray/retreat patterns (milliseconds) */
  fireTimer: number
  /** Spawn timer for summon pattern (milliseconds) */
  spawnTimer: number
  /** Strafe angle for spray pattern (radians) */
  strafeAngle: number
}

/**
 * BossSystem - implements boss AI with movement patterns and attack behaviors.
 *
 * @example
 * ```typescript
 * const bossSystem = new BossSystem()
 * world.registerSystem(bossSystem)
 *
 * // In game loop
 * bossSystem.update(world, deltaTime)
 * const events = bossSystem.getEvents()
 * ```
 */
export class BossSystem implements System {
  private events: BossSystemEvent[] = []
  private bossStates: Map<EntityId, BossState> = new Map()

  /**
   * Updates the boss AI each frame.
   *
   * @param world - The ECS world
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    // Query for boss entities
    const bosses = world.query(BossClass, TransformClass, VelocityClass, HealthClass)

    if (bosses.length === 0) {
      this.bossStates.clear()
      return
    }

    // Find player entity and position
    const players = world.query(PlayerClass, TransformClass)
    let playerPos: Vector3 | null = null
    let playerId: EntityId | null = null

    if (players.length > 0 && players[0] !== undefined) {
      playerId = players[0]
      const playerTransform = world.getComponent<Transform>(playerId, TransformClass)
      if (playerTransform) {
        playerPos = playerTransform.position.clone()
      }
    }

    // Process each boss
    for (const bossId of bosses) {
      const boss = world.getComponent<Boss>(bossId, BossClass)
      const transform = world.getComponent<Transform>(bossId, TransformClass)
      const velocity = world.getComponent<Velocity>(bossId, VelocityClass)
      const health = world.getComponent<Health>(bossId, HealthClass)

      if (!boss || !transform || !velocity || !health) continue

      // Initialize state tracking if needed
      let state = this.bossStates.get(bossId)
      if (!state) {
        state = {
          fireTimer: 0,
          spawnTimer: 0,
          strafeAngle: 0
        }
        this.bossStates.set(bossId, state)
      }

      // Update pattern timer
      boss.phaseTimer -= deltaTime

      // Check for pattern switch
      if (boss.phaseTimer <= 0) {
        this.switchPattern(bossId, boss)
        boss.phaseTimer = BOSS_AI_CONFIG.patternDuration
      }

      // Handle idle pattern - transition to first attack pattern
      if (boss.attackPattern === 'idle') {
        boss.attackPattern = getFirstPattern(boss.bossType)
        boss.phaseTimer = BOSS_AI_CONFIG.patternDuration
      }

      // No player - don't move boss
      if (!playerPos || playerId === null) {
        velocity.linear.set(0, 0, 0)
        continue
      }

      // Execute current pattern
      this.executePattern(bossId, boss, transform, velocity, state, playerPos, playerId, deltaTime)
    }
  }

  /**
   * Executes the current attack pattern for a boss.
   */
  private executePattern(
    bossId: EntityId,
    boss: Boss,
    transform: Transform,
    velocity: Velocity,
    state: BossState,
    playerPos: Vector3,
    playerId: EntityId,
    deltaTime: number
  ): void {
    const modifiers = this.getPhaseModifiers(boss.phase)

    switch (boss.attackPattern) {
      case 'charge':
        this.executeDestroyerCharge(boss, transform, velocity, playerPos, modifiers)
        break
      case 'spray':
        this.executeDestroyerSpray(
          bossId,
          boss,
          transform,
          velocity,
          state,
          playerPos,
          modifiers,
          deltaTime
        )
        break
      case 'summon':
        this.executeCarrierSummon(bossId, boss, transform, velocity, state, modifiers, deltaTime)
        break
      case 'retreat':
        this.executeCarrierRetreat(
          bossId,
          boss,
          transform,
          velocity,
          state,
          playerPos,
          playerId,
          modifiers,
          deltaTime
        )
        break
      default:
        // Unknown pattern - stop movement
        velocity.linear.set(0, 0, 0)
    }
  }

  /**
   * Executes Destroyer Charge pattern.
   * Moves boss toward player at charge speed.
   */
  private executeDestroyerCharge(
    _boss: Boss,
    transform: Transform,
    velocity: Velocity,
    playerPos: Vector3,
    modifiers: PhaseModifier
  ): void {
    const config = BOSS_AI_CONFIG.destroyer.patterns.charge

    // Calculate direction to player
    const direction = playerPos.clone().sub(transform.position)
    const distance = direction.length()

    // Avoid division by zero when player is at same position
    if (distance < 1) {
      velocity.linear.set(0, 0, 0)
      return
    }

    direction.normalize()

    // Apply charge speed with phase modifier
    const speed = config.speed * modifiers.speedMult
    velocity.linear.copy(direction.multiplyScalar(speed))
  }

  /**
   * Executes Destroyer Spray pattern.
   * Strafes around player while firing spread projectiles.
   */
  private executeDestroyerSpray(
    bossId: EntityId,
    boss: Boss,
    transform: Transform,
    velocity: Velocity,
    state: BossState,
    playerPos: Vector3,
    modifiers: PhaseModifier,
    deltaTime: number
  ): void {
    const config = BOSS_AI_CONFIG.destroyer.patterns.spray

    // Calculate direction to player
    const toPlayer = playerPos.clone().sub(transform.position)
    const distance = toPlayer.length()

    // Avoid division by zero
    if (distance < 1) {
      velocity.linear.set(0, 0, 0)
      return
    }

    toPlayer.normalize()

    // Calculate perpendicular direction for strafing (rotate 90 degrees in XY plane)
    const perpendicular = new Vector3(-toPlayer.y, toPlayer.x, 0).normalize()

    // Update strafe angle for circular motion
    state.strafeAngle += (deltaTime / 1000) * 2 // Complete circle in ~3 seconds

    // Apply strafe velocity
    const speed = config.speed * modifiers.speedMult
    velocity.linear.copy(perpendicular.multiplyScalar(speed))

    // Update fire timer
    state.fireTimer -= deltaTime
    const phaseIndex = Math.max(0, Math.min(2, boss.phase - 1)) as 0 | 1 | 2
    const baseFireRate = config.fireRates[phaseIndex]
    const fireRate = baseFireRate / modifiers.fireRateMult

    if (state.fireTimer <= 0) {
      // Emit projectile event
      const projectileCount = config.projectileCounts[phaseIndex]
      this.emitProjectileFired(
        bossId,
        transform.position.clone(),
        toPlayer.clone(),
        projectileCount,
        true
      )
      state.fireTimer = fireRate
    }
  }

  /**
   * Executes Carrier Summon pattern.
   * Stays stationary and spawns asteroid minions.
   */
  private executeCarrierSummon(
    bossId: EntityId,
    boss: Boss,
    transform: Transform,
    velocity: Velocity,
    state: BossState,
    modifiers: PhaseModifier,
    deltaTime: number
  ): void {
    const config = BOSS_AI_CONFIG.carrier.patterns.summon

    // Stay stationary
    velocity.linear.set(0, 0, 0)

    // Update spawn timer
    state.spawnTimer -= deltaTime
    const spawnRate = config.spawnRate / modifiers.fireRateMult

    if (state.spawnTimer <= 0) {
      // Emit spawn event
      const phaseIndex = Math.max(0, Math.min(2, boss.phase - 1)) as 0 | 1 | 2
      const spawnCount = config.spawnCounts[phaseIndex]
      this.emitMinionSpawned(bossId, transform.position.clone(), spawnCount)
      state.spawnTimer = spawnRate
    }
  }

  /**
   * Executes Carrier Retreat pattern.
   * Moves away from player while firing homing projectiles.
   */
  private executeCarrierRetreat(
    bossId: EntityId,
    boss: Boss,
    transform: Transform,
    velocity: Velocity,
    state: BossState,
    playerPos: Vector3,
    playerId: EntityId,
    modifiers: PhaseModifier,
    deltaTime: number
  ): void {
    const config = BOSS_AI_CONFIG.carrier.patterns.retreat

    // Calculate direction away from player
    const awayFromPlayer = transform.position.clone().sub(playerPos)
    const distance = awayFromPlayer.length()

    // Avoid division by zero
    if (distance < 1) {
      velocity.linear.set(0, 0, 0)
    } else {
      awayFromPlayer.normalize()

      // Apply retreat speed with phase modifier
      const speed = config.speed * modifiers.speedMult
      velocity.linear.copy(awayFromPlayer.multiplyScalar(speed))
    }

    // Update fire timer
    state.fireTimer -= deltaTime
    const phaseIndex = Math.max(0, Math.min(2, boss.phase - 1)) as 0 | 1 | 2
    const baseFireRate = config.fireRates[phaseIndex]
    const fireRate = baseFireRate / modifiers.fireRateMult

    if (state.fireTimer <= 0) {
      // Emit homing projectile event
      const projectileCount = config.projectileCounts[phaseIndex]
      this.emitHomingFired(bossId, transform.position.clone(), playerId, projectileCount)
      state.fireTimer = fireRate
    }
  }

  /**
   * Switches to the next attack pattern.
   */
  private switchPattern(bossId: EntityId, boss: Boss): void {
    const previousPattern = boss.attackPattern
    const newPattern = getNextPattern(boss.bossType, previousPattern)

    boss.attackPattern = newPattern

    // Reset state for new pattern
    const state = this.bossStates.get(bossId)
    if (state) {
      state.fireTimer = 0
      state.spawnTimer = 0
    }

    // Emit event
    const event: BossPatternChangedEvent = {
      type: 'bossPatternChanged',
      timestamp: Date.now(),
      data: {
        entityId: bossId,
        bossType: boss.bossType,
        previousPattern,
        newPattern,
        phase: boss.phase
      }
    }
    this.events.push(event)
  }

  /**
   * Returns phase modifiers for the given phase.
   *
   * @param phase - Boss phase (1, 2, or 3)
   * @returns Phase modifier configuration
   */
  getPhaseModifiers(phase: number): PhaseModifier {
    return getPhaseModifier(phase)
  }

  /**
   * Emits a projectile fired event.
   */
  private emitProjectileFired(
    entityId: EntityId,
    position: Vector3,
    direction: Vector3,
    projectileCount: number,
    isSpread: boolean
  ): void {
    const event: BossProjectileFiredEvent = {
      type: 'bossProjectileFired',
      timestamp: Date.now(),
      data: {
        entityId,
        position,
        direction,
        projectileCount,
        isSpread
      }
    }
    this.events.push(event)
  }

  /**
   * Emits a homing projectile fired event.
   */
  private emitHomingFired(
    entityId: EntityId,
    position: Vector3,
    targetId: EntityId,
    projectileCount: number
  ): void {
    const event: BossHomingFiredEvent = {
      type: 'bossHomingFired',
      timestamp: Date.now(),
      data: {
        entityId,
        position,
        targetId,
        projectileCount
      }
    }
    this.events.push(event)
  }

  /**
   * Emits a minion spawned event.
   */
  private emitMinionSpawned(entityId: EntityId, position: Vector3, spawnCount: number): void {
    const event: BossSpawnedMinionEvent = {
      type: 'bossSpawnedMinion',
      timestamp: Date.now(),
      data: {
        entityId,
        position,
        spawnCount
      }
    }
    this.events.push(event)
  }

  /**
   * Gets and clears all pending events.
   *
   * @returns Array of boss system events
   */
  getEvents(): BossSystemEvent[] {
    const pendingEvents = [...this.events]
    this.events = []
    return pendingEvents
  }
}
