/**
 * HyperspaceSystem - Classic Asteroids emergency teleport feature
 *
 * Allows the player to teleport to a random location with:
 * - 15% chance of explosion on re-entry (classic risk/reward)
 * - Brief invulnerability on successful warp
 * - Cooldown to prevent spam
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/HyperspaceSystem
 */

import { Health } from '../components/Health'
import { Player } from '../components/Player'
import { Transform } from '../components/Transform'
import { Velocity } from '../components/Velocity'
import { gameConfig } from '../config/gameConfig'
import { componentClass } from '../ecs/types'
import type { EntityId, System, World } from '../ecs/types'
import type { EventEmitter } from '../utils/EventEmitter'
import type { InputSystem } from './InputSystem'

// Type assertions for component classes to work with ECS type system
const TransformClass = componentClass(Transform)
const VelocityClass = componentClass(Velocity)
const HealthClass = componentClass(Health)
const PlayerClass = componentClass(Player)

/**
 * Event emitted when hyperspace is activated.
 */
export interface HyperspaceEvent {
  entityId: EntityId
  fromPosition: { x: number; y: number }
  toPosition: { x: number; y: number }
  success: boolean // false if explosion occurred
}

/**
 * Events emitted by HyperspaceSystem.
 */
interface HyperspaceEvents extends Record<string, unknown> {
  hyperspaceActivated: HyperspaceEvent
}

/**
 * System for handling classic hyperspace teleportation.
 *
 * Classic Asteroids feature: emergency teleport to random location
 * with risk of death on re-entry.
 */
export class HyperspaceSystem implements System {
  /** System type identifier */
  readonly systemType = 'hyperspace' as const

  /** Required components for hyperspace */
  readonly requiredComponents = ['transform', 'health', 'player']

  /** Input system reference */
  private readonly inputSystem: InputSystem

  /** Event emitter for hyperspace events */
  private readonly eventEmitter: EventEmitter<HyperspaceEvents> | null

  /** Cooldown tracking per entity */
  private cooldowns: Map<EntityId, number> = new Map()

  /** Track if hyperspace was pressed last frame to detect edge */
  private wasHyperspacePressed = false

  /** Game bounds for random teleport (match screen wrapping bounds) */
  private readonly BOUNDS = {
    minX: -gameConfig.worldBounds.halfWidth,
    maxX: gameConfig.worldBounds.halfWidth,
    minY: -gameConfig.worldBounds.halfHeight,
    maxY: gameConfig.worldBounds.halfHeight
  }

  /**
   * Create a new HyperspaceSystem.
   *
   * @param inputSystem - The InputSystem to read hyperspace input from
   * @param eventEmitter - Optional EventEmitter for hyperspace events
   */
  constructor(inputSystem: InputSystem, eventEmitter?: EventEmitter<HyperspaceEvents>) {
    this.inputSystem = inputSystem
    this.eventEmitter = eventEmitter ?? null
  }

  /**
   * Update hyperspace logic for player ship.
   *
   * Checks for hyperspace input and handles:
   * - Cooldown management
   * - Random teleportation
   * - Risk of explosion on re-entry
   * - Invulnerability on success
   *
   * @param world - The ECS world containing entities
   * @param deltaTime - Time since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    // Update cooldowns
    for (const [entityId, cooldown] of this.cooldowns) {
      const newCooldown = cooldown - deltaTime
      if (newCooldown <= 0) {
        this.cooldowns.delete(entityId)
      } else {
        this.cooldowns.set(entityId, newCooldown)
      }
    }

    // Check for hyperspace input (edge detection - only trigger on press, not hold)
    const hyperspacePressed = this.inputSystem.hasAction('hyperspace')
    const justPressed = hyperspacePressed && !this.wasHyperspacePressed
    this.wasHyperspacePressed = hyperspacePressed

    if (!justPressed) {
      return
    }

    // Query for player entities
    const playerEntities = world.query(TransformClass, HealthClass, PlayerClass)
    const shipId = playerEntities[0]

    if (shipId === undefined) {
      return // No player ship
    }

    // Check cooldown
    if (this.cooldowns.has(shipId)) {
      return // Still on cooldown
    }

    const transform = world.getComponent(shipId, TransformClass)
    const health = world.getComponent(shipId, HealthClass)
    const velocity = world.getComponent(shipId, VelocityClass)

    if (!transform || !health) {
      return
    }

    // Don't allow hyperspace if already dead
    if (health.current <= 0) {
      return
    }

    // Store original position for event
    const fromPosition = { x: transform.position.x, y: transform.position.y }

    // Generate random destination
    const toPosition = this.getRandomPosition()

    // Set cooldown
    this.cooldowns.set(shipId, gameConfig.gameplay.hyperspace.cooldown)

    // Check for explosion risk
    const explosionRoll = Math.random()
    const success = explosionRoll >= gameConfig.gameplay.hyperspace.explosionRisk

    if (success) {
      // Successful warp
      transform.position.x = toPosition.x
      transform.position.y = toPosition.y

      // Reset velocity (classic behavior)
      if (velocity) {
        velocity.linear.set(0, 0, 0)
        velocity.angular.set(0, 0, 0)
      }

      // Grant brief invulnerability
      health.setInvulnerable(gameConfig.gameplay.hyperspace.invulnerabilityDuration)
    } else {
      // Explosion on re-entry - kill the ship
      health.current = 0
    }

    // Emit event
    if (this.eventEmitter) {
      this.eventEmitter.emit('hyperspaceActivated', {
        entityId: shipId,
        fromPosition,
        toPosition,
        success
      })
    }
  }

  /**
   * Generate a random position within game bounds.
   * Avoids the center area to prevent spawning on top of something.
   */
  private getRandomPosition(): { x: number; y: number } {
    // Generate random position
    let x: number
    let y: number

    // Avoid center area (within 100 units of origin) to reduce unfair spawns
    do {
      x = this.BOUNDS.minX + Math.random() * (this.BOUNDS.maxX - this.BOUNDS.minX)
      y = this.BOUNDS.minY + Math.random() * (this.BOUNDS.maxY - this.BOUNDS.minY)
    } while (Math.abs(x) < 100 && Math.abs(y) < 100)

    return { x, y }
  }

  /**
   * Get remaining cooldown for an entity.
   *
   * @param entityId - The entity to check
   * @returns Remaining cooldown in milliseconds, or 0 if ready
   */
  getCooldown(entityId: EntityId): number {
    return this.cooldowns.get(entityId) ?? 0
  }

  /**
   * Check if hyperspace is available for an entity.
   *
   * @param entityId - The entity to check
   * @returns True if hyperspace can be used
   */
  isAvailable(entityId: EntityId): boolean {
    return !this.cooldowns.has(entityId)
  }
}
