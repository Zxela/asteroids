/**
 * RespawnSystem - Handles ship destruction and respawn mechanics
 *
 * Monitors player ship health and handles:
 * - Life loss when health reaches 0
 * - Respawn at center with invulnerability
 * - Game over detection when lives reach 0
 * - Event emission for UI and game state updates
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/RespawnSystem
 */

import { Vector3 } from 'three'
import { Health } from '../components/Health'
import { Player } from '../components/Player'
import { Transform } from '../components/Transform'
import { Velocity } from '../components/Velocity'
import { gameConfig } from '../config/gameConfig'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'

// Type assertions for component classes to work with ECS type system
const TransformClass = Transform as unknown as ComponentClass<Transform>
const VelocityClass = Velocity as unknown as ComponentClass<Velocity>
const HealthClass = Health as unknown as ComponentClass<Health>
const PlayerClass = Player as unknown as ComponentClass<Player>

/**
 * Event emitted when player dies (loses all lives).
 */
export interface PlayerDiedEvent {
  type: 'playerDied'
  finalScore: number
  wavesReached: number
}

/**
 * Event emitted when ship is damaged/destroyed.
 */
export interface ShipDamagedEvent {
  type: 'shipDamaged'
  remainingLives: number
  isGameOver: boolean
}

/**
 * Union type for all events emitted by RespawnSystem.
 */
export type RespawnSystemEvent = PlayerDiedEvent | ShipDamagedEvent

/**
 * System for handling ship destruction and respawn mechanics.
 *
 * Monitors entities with Health and Player components for destruction
 * (health <= 0) and handles respawn with invulnerability period.
 *
 * @example
 * ```typescript
 * const respawnSystem = new RespawnSystem()
 * world.registerSystem(respawnSystem)
 *
 * // Each frame in game loop
 * respawnSystem.update(world, deltaTime)
 *
 * // Check for events
 * const events = respawnSystem.getEvents()
 * ```
 */
export class RespawnSystem implements System {
  /** System type identifier */
  readonly systemType = 'respawn' as const

  /** Required components for respawn detection */
  readonly requiredComponents = ['transform', 'health', 'player']

  /** Events emitted during the current frame */
  private events: RespawnSystemEvent[] = []

  /** Respawn invulnerability duration in milliseconds */
  private readonly RESPAWN_INVULNERABILITY_DURATION: number

  /** Respawn position (center of screen) */
  private readonly RESPAWN_POSITION = new Vector3(0, 0, 0)

  /**
   * Create a new RespawnSystem.
   *
   * Uses invulnerability duration from game config (default 3000ms).
   */
  constructor() {
    this.RESPAWN_INVULNERABILITY_DURATION = gameConfig.gameplay.invulnerabilityDuration
  }

  /**
   * Update respawn logic for player ship.
   *
   * Checks for ship destruction (health <= 0) and handles:
   * - Life loss and respawn if lives remain
   * - Game over if no lives remain
   * - Invulnerability timer countdown
   *
   * @param world - The ECS world containing entities
   * @param deltaTime - Time since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    // Clear events from previous frame
    this.events = []

    // Query for ship entities (entities with Transform, Health, and Player components)
    const shipEntities = world.query(TransformClass, HealthClass, PlayerClass)

    // Note: Should only be one player ship
    const shipId = shipEntities[0]

    if (shipId === undefined) {
      return // No player ship
    }

    const health = world.getComponent(shipId, HealthClass)
    const player = world.getComponent(shipId, PlayerClass)
    const transform = world.getComponent(shipId, TransformClass)

    if (!health || !player || !transform) {
      return
    }

    // Check if ship is destroyed (health <= 0)
    if (health.current <= 0) {
      this.handleShipDestroyed(world, shipId, health, player, transform)
      // Don't update invulnerability timer on the same frame as respawn
      return
    }

    // Update invulnerability timer
    this.updateInvulnerabilityTimer(health, deltaTime)
  }

  /**
   * Handle ship destruction event.
   *
   * Decrements lives and either respawns the ship or triggers game over.
   *
   * @param world - The ECS world
   * @param shipId - The ship entity ID
   * @param health - The ship's Health component
   * @param player - The ship's Player component
   * @param transform - The ship's Transform component
   */
  private handleShipDestroyed(
    world: World,
    shipId: EntityId,
    health: Health,
    player: Player,
    transform: Transform
  ): void {
    // Reduce lives
    player.loseLife()

    if (player.lives > 0) {
      // Respawn ship
      this.respawnShip(world, shipId, health, transform)

      // Emit ship damaged event
      const damagedEvent: ShipDamagedEvent = {
        type: 'shipDamaged',
        remainingLives: player.lives,
        isGameOver: false
      }
      this.events.push(damagedEvent)
    } else {
      // Game over - emit both events
      const diedEvent: PlayerDiedEvent = {
        type: 'playerDied',
        finalScore: player.score,
        wavesReached: 1 // Will be set by game state in Phase 4
      }
      this.events.push(diedEvent)

      // Emit ship damaged event for final life loss
      const damagedEvent: ShipDamagedEvent = {
        type: 'shipDamaged',
        remainingLives: 0,
        isGameOver: true
      }
      this.events.push(damagedEvent)
    }
  }

  /**
   * Respawn the ship at center with invulnerability.
   *
   * Resets position to (0,0,0), velocity to zero, health to max,
   * and enables invulnerability for the configured duration.
   *
   * @param world - The ECS world
   * @param shipId - The ship entity ID
   * @param health - The ship's Health component
   * @param transform - The ship's Transform component
   */
  private respawnShip(world: World, shipId: EntityId, health: Health, transform: Transform): void {
    // Reset position to center
    transform.position.copy(this.RESPAWN_POSITION)

    // Reset velocity if component exists
    const velocity = world.getComponent(shipId, VelocityClass)
    if (velocity) {
      velocity.linear.set(0, 0, 0)
      velocity.angular.set(0, 0, 0)
    }

    // Reset health to max
    health.current = health.max

    // Set invulnerability
    health.setInvulnerable(this.RESPAWN_INVULNERABILITY_DURATION)
  }

  /**
   * Update invulnerability timer countdown.
   *
   * Counts down the invulnerability timer and clears invulnerability
   * when the timer expires.
   *
   * @param health - The ship's Health component
   * @param deltaTime - Time since last frame in milliseconds
   */
  private updateInvulnerabilityTimer(health: Health, deltaTime: number): void {
    if (health.invulnerable && health.invulnerabilityTimer > 0) {
      health.invulnerabilityTimer -= deltaTime

      if (health.invulnerabilityTimer <= 0) {
        health.invulnerable = false
        health.invulnerabilityTimer = 0
      }
    }
  }

  /**
   * Get events emitted during the current frame.
   *
   * Events are cleared at the start of each update cycle.
   *
   * @returns Array of respawn-related events
   */
  getEvents(): RespawnSystemEvent[] {
    return this.events
  }
}
