/**
 * UFO System
 *
 * Implements UFO AI with movement patterns and shooting behavior.
 *
 * Responsibilities:
 * - Query entities with UFO, Transform, Velocity, Health components
 * - Execute semi-random movement patterns
 * - Periodically shoot at player (accuracy based on UFO size)
 * - Emit events for projectile creation and UFO destruction
 *
 * UFO Behavior:
 * - Large UFO: Slower, shoots every 2s, 30% accuracy
 * - Small UFO: Faster, shoots every 1.5s, 80% accuracy
 *
 * Movement Pattern:
 * - Primary horizontal movement across screen
 * - Periodic direction changes (every 1-3 seconds)
 * - Screen wrapping enabled
 */

import { Vector3 } from 'three'
import { Health, Player, Transform, Velocity } from '../components'
import { UFO, type UFOSize, UFO_CONFIG } from '../components/UFO'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'
import type { AudioManager } from '../audio/AudioManager'

// Type assertions for component classes
const UFOClass = UFO as unknown as ComponentClass<UFO>
const HealthClass = Health as unknown as ComponentClass<Health>
const TransformClass = Transform as unknown as ComponentClass<Transform>
const VelocityClass = Velocity as unknown as ComponentClass<Velocity>
const PlayerClass = Player as unknown as ComponentClass<Player>

/**
 * UFO projectile fired event.
 */
export interface UFOProjectileFiredEvent {
  type: 'ufoProjectileFired'
  timestamp: number
  data: {
    entityId: EntityId
    position: Vector3
    direction: Vector3
    damage: number
  }
}

/**
 * UFO destroyed event.
 */
export interface UFODestroyedEvent {
  type: 'ufoDestroyed'
  timestamp: number
  data: {
    entityId: EntityId
    position: Vector3
    ufoSize: UFOSize
    points: number
  }
}

/**
 * Union type of all events emitted by UFOSystem.
 */
export type UFOSystemEvent = UFOProjectileFiredEvent | UFODestroyedEvent

/**
 * Internal state tracking for UFO entities.
 */
interface UFOState {
  /** Timer for direction changes (milliseconds) */
  directionChangeTimer: number
  /** Current vertical direction modifier (-1, 0, or 1) */
  verticalDirection: number
}

/** Screen bounds for movement */
const SCREEN_HALF_WIDTH = 960
const SCREEN_HALF_HEIGHT = 540

/** Direction change interval range (milliseconds) */
const MIN_DIRECTION_CHANGE = 1000
const MAX_DIRECTION_CHANGE = 3000

/**
 * UFOSystem - implements UFO AI with movement patterns and shooting behavior.
 *
 * @example
 * ```typescript
 * const ufoSystem = new UFOSystem()
 * world.registerSystem(ufoSystem)
 *
 * // In game loop
 * ufoSystem.update(world, deltaTime)
 * const events = ufoSystem.getEvents()
 * // Handle projectile creation from events
 * ```
 */
export class UFOSystem implements System {
  private events: UFOSystemEvent[] = []
  private ufoStates: Map<EntityId, UFOState> = new Map()
  audioManager: AudioManager | null = null
  activeSoundId: number | null = null
  activeUfoId: EntityId | null = null

  /**
   * Sets the audio manager for the UFO system.
   *
   * @param audioManager - The AudioManager instance
   */
  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager
  }

  /**
   * Stops the active UFO sound and resets tracking state.
   *
   * @param ufoId - The UFO entity ID
   */
  stopUfoSound(ufoId: EntityId): void {
    if (ufoId === this.activeUfoId && this.audioManager && this.activeSoundId !== null) {
      this.audioManager.stopSound(this.activeSoundId)
      this.activeSoundId = null
      this.activeUfoId = null
    }
  }

  /**
   * Updates the UFO AI each frame.
   *
   * @param world - The ECS world
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    // Query for UFO entities
    const ufos = world.query(UFOClass, TransformClass, VelocityClass, HealthClass)

    // Clean up states for destroyed UFOs
    for (const entityId of this.ufoStates.keys()) {
      if (!ufos.includes(entityId)) {
        this.ufoStates.delete(entityId)
      }
    }

    if (ufos.length === 0) {
      return
    }

    // Find player entity and position
    const players = world.query(PlayerClass, TransformClass)
    let playerPos: Vector3 | null = null

    if (players.length > 0 && players[0] !== undefined) {
      const playerId = players[0]
      const playerTransform = world.getComponent<Transform>(playerId, TransformClass)
      if (playerTransform) {
        playerPos = playerTransform.position.clone()
      }
    }

    // Process each UFO
    for (const ufoId of ufos) {
      const ufo = world.getComponent<UFO>(ufoId, UFOClass)
      const transform = world.getComponent<Transform>(ufoId, TransformClass)
      const velocity = world.getComponent<Velocity>(ufoId, VelocityClass)
      const health = world.getComponent<Health>(ufoId, HealthClass)

      if (!ufo || !transform || !velocity || !health) continue

      // Check if UFO is destroyed
      if (health.current <= 0) {
        this.emitUFODestroyed(ufoId, transform.position.clone(), ufo.ufoSize, ufo.points)
        world.destroyEntity(ufoId)
        this.ufoStates.delete(ufoId)
        continue
      }

      // Initialize state tracking if needed
      let state = this.ufoStates.get(ufoId)
      if (!state) {
        state = {
          directionChangeTimer: this.randomDirectionChangeTime(),
          verticalDirection: 0
        }
        this.ufoStates.set(ufoId, state)

        // Start UFO loop sound for first UFO
        if (this.activeUfoId === null && this.audioManager) {
          this.activeUfoId = ufoId
          const basePitch = ufo.ufoSize === 'small' ? 1.3 : 1.0
          this.activeSoundId = this.audioManager.playSound('ufoLoop', {
            loop: true,
            volume: 0.4,
            rate: basePitch
          })
        }
      }

      // Update movement
      this.updateMovement(ufo, transform, velocity, state, deltaTime)

      // Update doppler pitch modulation
      if (ufoId === this.activeUfoId && this.audioManager && this.activeSoundId !== null) {
        this.updateDopplerEffect(ufo, transform)

        // Update volume based on distance to player
        if (playerPos) {
          this.updateVolumeByDistance(transform, playerPos)
        }
      }

      // Update shooting
      if (playerPos) {
        this.updateShooting(ufoId, ufo, transform, playerPos, deltaTime)
      }

      // Check if UFO has left screen bounds (destroy if too far)
      if (this.isOutOfBounds(transform.position)) {
        world.destroyEntity(ufoId)
        this.ufoStates.delete(ufoId)
      }
    }
  }

  /**
   * Updates doppler pitch effect based on UFO horizontal position.
   */
  private updateDopplerEffect(ufo: UFO, transform: Transform): void {
    if (!this.audioManager || this.activeSoundId === null) return

    // Calculate normalized X position (0.0 at left edge, 1.0 at right edge)
    const normalizedX = (transform.position.x + SCREEN_HALF_WIDTH) / (SCREEN_HALF_WIDTH * 2)

    // Calculate doppler pitch (0.8 to 1.2 range)
    const dopplerPitch = 0.8 + normalizedX * 0.4

    // Apply base pitch multiplier
    const basePitch = ufo.ufoSize === 'small' ? 1.3 : 1.0
    const finalPitch = dopplerPitch * basePitch

    // Update sound rate
    this.audioManager.setSoundRate(this.activeSoundId, finalPitch)
  }

  /**
   * Updates volume based on distance from UFO to player.
   */
  private updateVolumeByDistance(transform: Transform, playerPos: Vector3): void {
    if (!this.audioManager || this.activeSoundId === null) return

    // Calculate distance from UFO to player
    const distance = transform.position.distanceTo(playerPos)

    // Maximum distance is approximately diagonal of screen
    const maxDistance = SCREEN_HALF_WIDTH * 2

    // Calculate volume: 0.6 (close) to 0.2 (far)
    // volume = 0.6 * (1 - distance / maxDistance), with minimum of 0.2
    const volume = Math.max(0.2, 0.6 * (1 - distance / maxDistance))

    // Update sound volume
    this.audioManager.setSoundVolume(this.activeSoundId, volume)
  }

  /**
   * Updates UFO movement with semi-random pattern.
   */
  private updateMovement(
    ufo: UFO,
    transform: Transform,
    velocity: Velocity,
    state: UFOState,
    deltaTime: number
  ): void {
    const config = UFO_CONFIG[ufo.ufoSize]

    // Update direction change timer
    state.directionChangeTimer -= deltaTime

    if (state.directionChangeTimer <= 0) {
      // Change vertical direction randomly
      state.verticalDirection = Math.random() < 0.33 ? -1 : Math.random() < 0.5 ? 1 : 0
      state.directionChangeTimer = this.randomDirectionChangeTime()
    }

    // Maintain horizontal direction (based on current velocity)
    const horizontalDir = velocity.linear.x >= 0 ? 1 : -1

    // Calculate new velocity with vertical variation
    const newDirection = new Vector3(
      horizontalDir,
      state.verticalDirection * 0.3, // Reduced vertical movement
      0
    ).normalize()

    velocity.linear.copy(newDirection.multiplyScalar(config.speed))

    // Keep UFO within vertical bounds
    if (transform.position.y > SCREEN_HALF_HEIGHT * 0.8) {
      state.verticalDirection = -1
    } else if (transform.position.y < -SCREEN_HALF_HEIGHT * 0.8) {
      state.verticalDirection = 1
    }
  }

  /**
   * Updates UFO shooting behavior.
   */
  private updateShooting(
    ufoId: EntityId,
    ufo: UFO,
    transform: Transform,
    playerPos: Vector3,
    deltaTime: number
  ): void {
    const config = UFO_CONFIG[ufo.ufoSize]

    // Update shoot timer
    ufo.shootTimer -= deltaTime

    if (ufo.shootTimer <= 0) {
      // Calculate direction to player with accuracy factor
      const toPlayer = playerPos.clone().sub(transform.position).normalize()

      // Apply accuracy - add random offset based on accuracy
      const accuracyOffset = (1 - config.accuracy) * Math.PI // Max offset angle
      const offsetAngle = (Math.random() - 0.5) * 2 * accuracyOffset

      // Rotate direction by offset angle (2D rotation around Z)
      const cos = Math.cos(offsetAngle)
      const sin = Math.sin(offsetAngle)
      const direction = new Vector3(
        toPlayer.x * cos - toPlayer.y * sin,
        toPlayer.x * sin + toPlayer.y * cos,
        0
      ).normalize()

      // Emit projectile event
      this.emitProjectileFired(ufoId, transform.position.clone(), direction)

      // Reset timer
      ufo.shootTimer = config.shootInterval
    }
  }

  /**
   * Generates a random direction change time.
   */
  private randomDirectionChangeTime(): number {
    return MIN_DIRECTION_CHANGE + Math.random() * (MAX_DIRECTION_CHANGE - MIN_DIRECTION_CHANGE)
  }

  /**
   * Checks if position is too far out of bounds.
   */
  private isOutOfBounds(position: Vector3): boolean {
    const margin = 200 // Extra margin before destroying
    return (
      Math.abs(position.x) > SCREEN_HALF_WIDTH + margin ||
      Math.abs(position.y) > SCREEN_HALF_HEIGHT + margin
    )
  }

  /**
   * Emits a projectile fired event.
   */
  private emitProjectileFired(entityId: EntityId, position: Vector3, direction: Vector3): void {
    const event: UFOProjectileFiredEvent = {
      type: 'ufoProjectileFired',
      timestamp: Date.now(),
      data: {
        entityId,
        position,
        direction,
        damage: 1 // UFO projectiles deal 1 damage (instant kill to player)
      }
    }
    this.events.push(event)
  }

  /**
   * Emits a UFO destroyed event.
   */
  private emitUFODestroyed(
    entityId: EntityId,
    position: Vector3,
    ufoSize: UFOSize,
    points: number
  ): void {
    const event: UFODestroyedEvent = {
      type: 'ufoDestroyed',
      timestamp: Date.now(),
      data: {
        entityId,
        position,
        ufoSize,
        points
      }
    }
    this.events.push(event)
  }

  /**
   * Gets and clears all pending events.
   *
   * @returns Array of UFO system events
   */
  getEvents(): UFOSystemEvent[] {
    const pendingEvents = [...this.events]
    this.events = []
    return pendingEvents
  }
}
