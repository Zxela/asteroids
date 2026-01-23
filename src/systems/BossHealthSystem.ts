/**
 * Boss Health System
 *
 * Monitors boss health and manages phase transitions.
 *
 * Responsibilities:
 * - Track boss health and calculate health percentage
 * - Update health bar display
 * - Detect phase transitions at health thresholds
 * - Emit events: bossDamaged, bossPhaseChanged, bossDefeated
 *
 * Phase System:
 * - Phase 1: 100% - 51% health
 * - Phase 2: 50% - 26% health
 * - Phase 3: 25% - 0% health
 */

import { Boss } from '../components/Boss'
import { Health } from '../components/Health'
import { gameConfig } from '../config'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'
import type { BossType } from '../types/components'
import type { BossHealthBar } from '../ui/BossHealthBar'

// Type assertions for component classes
const BossClass = Boss as unknown as ComponentClass<Boss>
const HealthClass = Health as unknown as ComponentClass<Health>

/**
 * Boss phase changed event - emitted when boss enters a new phase.
 */
export interface BossPhaseChangedEvent {
  type: 'bossPhaseChanged'
  timestamp: number
  data: {
    entityId: EntityId
    previousPhase: number
    newPhase: number
    healthPercentage: number
  }
}

/**
 * Boss damaged event - emitted when boss takes damage.
 */
export interface BossDamagedEvent {
  type: 'bossDamaged'
  timestamp: number
  data: {
    entityId: EntityId
    damage: number
    currentHealth: number
    maxHealth: number
    healthPercentage: number
  }
}

/**
 * Boss defeated event - emitted when boss is destroyed.
 */
export interface BossDefeatedEvent {
  type: 'bossDefeated'
  timestamp: number
  data: {
    entityId: EntityId
    bossType: BossType
    wave: number
    bonusScore: number
  }
}

/**
 * Union type of all events emitted by BossHealthSystem.
 */
export type BossHealthEvent = BossDamagedEvent | BossPhaseChangedEvent | BossDefeatedEvent

/**
 * Tracked boss state for detecting changes
 */
interface BossState {
  previousHealth: number
  previousPhase: number
}

/**
 * Boss name display mapping
 */
const BOSS_DISPLAY_NAMES: Record<BossType, string> = {
  destroyer: 'Destroyer',
  carrier: 'Carrier'
}

/**
 * BossHealthSystem - monitors boss health and manages phase transitions.
 *
 * @example
 * ```typescript
 * const healthBar = new BossHealthBar()
 * const bossHealthSystem = new BossHealthSystem(healthBar)
 * world.registerSystem(bossHealthSystem)
 *
 * // Events are collected during update
 * bossHealthSystem.update(world, deltaTime)
 * const events = bossHealthSystem.getEvents()
 * ```
 */
export class BossHealthSystem implements System {
  private healthBar: BossHealthBar
  private events: BossHealthEvent[] = []
  private bossStates: Map<EntityId, BossState> = new Map()
  private currentWave = 5
  private healthBarShown = false

  /**
   * Create a BossHealthSystem.
   *
   * @param healthBar - BossHealthBar UI component for display
   */
  constructor(healthBar: BossHealthBar) {
    this.healthBar = healthBar
  }

  /**
   * Sets the current wave number (for event data).
   *
   * @param wave - Current wave number
   */
  setCurrentWave(wave: number): void {
    this.currentWave = wave
  }

  /**
   * Updates the boss health system each frame.
   *
   * Handles:
   * - Querying for boss entities
   * - Tracking health changes
   * - Detecting phase transitions
   * - Updating health bar
   * - Emitting events
   *
   * @param world - The ECS world
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: World, _deltaTime: number): void {
    // Query for entities with Boss and Health components
    const bosses = world.query(BossClass, HealthClass)

    // No boss present
    if (bosses.length === 0) {
      if (this.healthBarShown) {
        this.healthBar.hide()
        this.healthBarShown = false
        this.bossStates.clear()
      }
      return
    }

    // Process each boss (typically only one at a time)
    for (const bossId of bosses) {
      const health = world.getComponent<Health>(bossId, HealthClass)
      const boss = world.getComponent<Boss>(bossId, BossClass)

      if (!health || !boss) continue

      // Get or initialize state tracking
      let state = this.bossStates.get(bossId)
      if (!state) {
        state = {
          previousHealth: health.current,
          previousPhase: boss.phase
        }
        this.bossStates.set(bossId, state)

        // Show health bar for new boss
        this.healthBar.show(BOSS_DISPLAY_NAMES[boss.bossType])
        this.healthBarShown = true
      }

      // Calculate health percentage
      const healthPercentage = (health.current / health.max) * 100

      // Check if boss was defeated
      if (health.current <= 0) {
        this.emitBossDefeatedEvent(bossId, boss.bossType)
        this.healthBar.hide()
        this.healthBarShown = false
        this.bossStates.delete(bossId)
        continue
      }

      // Check for damage
      if (health.current < state.previousHealth) {
        this.emitBossDamagedEvent(
          bossId,
          state.previousHealth - health.current,
          health.current,
          health.max
        )
      }

      // Check for phase transition
      const newPhase = this.getPhaseFromHealth(health.current, health.max)
      if (newPhase !== boss.phase) {
        const previousPhase = boss.phase
        boss.phase = newPhase
        this.emitPhaseChangeEvent(bossId, previousPhase, newPhase, healthPercentage)
      }

      // Update health bar display
      this.healthBar.update(health.current, health.max)

      // Update tracked state
      state.previousHealth = health.current
      state.previousPhase = boss.phase
    }
  }

  /**
   * Determines the boss phase based on current health percentage.
   *
   * - Phase 1: > 50% health
   * - Phase 2: 26% - 50% health
   * - Phase 3: <= 25% health
   *
   * @param currentHealth - Current health value
   * @param maxHealth - Maximum health value
   * @returns Phase number (1, 2, or 3)
   */
  getPhaseFromHealth(currentHealth: number, maxHealth: number): number {
    const percentage = (currentHealth / maxHealth) * 100

    if (percentage > 50) {
      return 1
    }
    if (percentage > 25) {
      return 2
    }
    return 3
  }

  /**
   * Emits a bossPhaseChanged event.
   *
   * @param bossId - Boss entity ID
   * @param previousPhase - Previous phase number
   * @param newPhase - New phase number
   * @param healthPercentage - Current health percentage
   */
  private emitPhaseChangeEvent(
    bossId: EntityId,
    previousPhase: number,
    newPhase: number,
    healthPercentage: number
  ): void {
    const event: BossPhaseChangedEvent = {
      type: 'bossPhaseChanged',
      timestamp: Date.now(),
      data: {
        entityId: bossId,
        previousPhase,
        newPhase,
        healthPercentage
      }
    }
    this.events.push(event)
  }

  /**
   * Emits a bossDamaged event.
   *
   * @param bossId - Boss entity ID
   * @param damage - Amount of damage taken
   * @param currentHealth - Current health after damage
   * @param maxHealth - Maximum health
   */
  private emitBossDamagedEvent(
    bossId: EntityId,
    damage: number,
    currentHealth: number,
    maxHealth: number
  ): void {
    const event: BossDamagedEvent = {
      type: 'bossDamaged',
      timestamp: Date.now(),
      data: {
        entityId: bossId,
        damage,
        currentHealth,
        maxHealth,
        healthPercentage: (currentHealth / maxHealth) * 100
      }
    }
    this.events.push(event)
  }

  /**
   * Emits a bossDefeated event.
   *
   * @param bossId - Boss entity ID
   * @param bossType - Type of boss defeated
   */
  private emitBossDefeatedEvent(bossId: EntityId, bossType: BossType): void {
    const bonusScore = this.currentWave * gameConfig.gameplay.scoring.bossMultiplier

    const event: BossDefeatedEvent = {
      type: 'bossDefeated',
      timestamp: Date.now(),
      data: {
        entityId: bossId,
        bossType,
        wave: this.currentWave,
        bonusScore
      }
    }
    this.events.push(event)
  }

  /**
   * Gets and clears all pending events.
   * Events are cleared after being retrieved to prevent double-processing.
   *
   * @returns Array of boss health events
   */
  getEvents(): BossHealthEvent[] {
    const pendingEvents = [...this.events]
    this.events = []
    return pendingEvents
  }

  /**
   * Checks if a boss is currently being tracked.
   *
   * @returns True if boss is active
   */
  hasBoss(): boolean {
    return this.healthBarShown
  }
}
