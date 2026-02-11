/**
 * AsteroidDestructionSystem - Handles asteroid destruction and splitting
 *
 * Monitors asteroids for destruction (health <= 0) and handles:
 * - Large asteroids splitting into 2 medium asteroids (classic behavior)
 * - Medium asteroids splitting into 2 small asteroids
 * - Small asteroids being removed (no children)
 * - Power-up spawning with 10% probability on destruction
 * - Event emission for scoring and particle effects
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/AsteroidDestructionSystem
 */

import { Vector3 } from 'three'
import { Asteroid } from '../components/Asteroid'
import { Health } from '../components/Health'
import { Transform } from '../components/Transform'
import { Velocity } from '../components/Velocity'
import { componentClass } from '../ecs/types'
import type { EntityId, System, World } from '../ecs/types'
import { createAsteroid } from '../entities/createAsteroid'
import { createPowerUp, getRandomPowerUpType, shouldSpawnPowerUp } from '../entities/createPowerUp'
import type { AsteroidDestroyedEvent, AsteroidSize, EntityId as EventEntityId } from '../types'

// Type assertions for component classes to work with ECS type system
const TransformClass = componentClass(Transform)
const HealthClass = componentClass(Health)
const AsteroidClass = componentClass(Asteroid)
const VelocityClass = componentClass(Velocity)

// Re-export for consumers that import from this module
export type { AsteroidDestroyedEvent } from '../types'

/**
 * Offset distance for child asteroid spawning (prevents overlap).
 */
const CHILD_SPAWN_OFFSET = 5

/**
 * Additional velocity boost for child asteroids (spreading effect).
 */
const CHILD_VELOCITY_BOOST = 50

/**
 * System for handling asteroid destruction and splitting logic.
 *
 * Processes asteroids with Health component that have reached zero or
 * negative health, spawning child asteroids and emitting events.
 *
 * @example
 * ```typescript
 * const destructionSystem = new AsteroidDestructionSystem()
 * world.registerSystem(destructionSystem)
 *
 * // Each frame in game loop
 * destructionSystem.update(world, deltaTime)
 *
 * // Check for events
 * const events = destructionSystem.getEvents()
 * ```
 */
export class AsteroidDestructionSystem implements System {
  /** System type identifier */
  readonly systemType = 'asteroidDestruction' as const

  /** Required components for destruction detection */
  readonly requiredComponents = ['transform', 'health', 'asteroid']

  /** Events emitted during the current frame */
  private events: AsteroidDestroyedEvent[] = []

  /**
   * Update destruction logic for all asteroids.
   *
   * Checks for asteroids with health <= 0 and handles destruction,
   * spawning child asteroids for large and medium asteroids.
   *
   * @param world - The ECS world containing entities
   * @param _deltaTime - Time since last frame in milliseconds (unused)
   */
  update(world: World, _deltaTime: number): void {
    // Clear events from previous frame
    this.events = []

    // Query for asteroids with health
    const asteroidEntities = world.query(AsteroidClass, HealthClass, TransformClass)

    // Collect asteroids to process (copy to array to avoid mutation during iteration)
    const asteroidsToProcess = [...asteroidEntities]

    for (const asteroidId of asteroidsToProcess) {
      // Verify entity still alive (may have been destroyed in previous iteration)
      if (!world.isEntityAlive(asteroidId)) {
        continue
      }

      const health = world.getComponent(asteroidId, HealthClass)
      const asteroid = world.getComponent(asteroidId, AsteroidClass)
      const transform = world.getComponent(asteroidId, TransformClass)

      // Skip if missing required components
      if (!health || !asteroid || !transform) {
        continue
      }

      // Check if asteroid is destroyed (health <= 0)
      if (health.current <= 0) {
        this.destroyAsteroid(world, asteroidId, asteroid, transform)
      }
    }
  }

  /**
   * Handle asteroid destruction.
   *
   * Emits event, spawns child asteroids if applicable, potentially spawns
   * power-up, and removes entity.
   *
   * @param world - The ECS world
   * @param asteroidId - The asteroid entity ID
   * @param asteroid - The asteroid's Asteroid component
   * @param transform - The asteroid's Transform component
   */
  private destroyAsteroid(
    world: World,
    asteroidId: EntityId,
    asteroid: Asteroid,
    transform: Transform
  ): void {
    const { size, points } = asteroid

    // Emit destruction event (clone position to prevent mutation)
    const spawnChildren = size !== 'small' // Large/Medium spawn children, small don't
    const event: AsteroidDestroyedEvent = {
      type: 'asteroidDestroyed',
      data: {
        entityId: asteroidId as unknown as EventEntityId,
        position: transform.position.clone(),
        size,
        points,
        spawnChildren
      },
      timestamp: Date.now()
    }
    this.events.push(event)

    // Spawn child asteroids based on size
    if (size === 'large') {
      this.spawnChildAsteroids(world, transform.position, 'medium')
    } else if (size === 'medium') {
      this.spawnChildAsteroids(world, transform.position, 'small')
    }
    // Small asteroids don't spawn children

    // Maybe spawn a power-up (10% chance)
    this.maybeSpawnPowerUp(world, transform.position)

    // Remove the asteroid entity from world
    world.destroyEntity(asteroidId)
  }

  /**
   * Attempt to spawn a power-up at the given position.
   *
   * Power-ups have a 10% spawn chance on asteroid destruction.
   * A random power-up type is selected with equal probability (25% each).
   *
   * @param world - The ECS world
   * @param position - Position to spawn the power-up
   */
  private maybeSpawnPowerUp(world: World, position: Vector3): void {
    if (shouldSpawnPowerUp()) {
      const powerUpType = getRandomPowerUpType()
      createPowerUp(world, {
        position: position.clone(),
        powerUpType
      })
    }
  }

  /**
   * Spawn child asteroids around the destruction position.
   *
   * Spawns exactly 2 child asteroids (classic Asteroids behavior)
   * positioned radially around the parent's position to prevent overlap.
   *
   * @param world - The ECS world
   * @param position - Parent asteroid position
   * @param childSize - Size of child asteroids to spawn
   */
  private spawnChildAsteroids(world: World, position: Vector3, childSize: AsteroidSize): void {
    // Classic Asteroids always splits into exactly 2 children
    const count = 2

    for (let i = 0; i < count; i++) {
      // Calculate radial offset angle
      const angle = (i / count) * Math.PI * 2

      // Calculate offset position
      const offsetX = Math.cos(angle) * CHILD_SPAWN_OFFSET
      const offsetY = Math.sin(angle) * CHILD_SPAWN_OFFSET
      const childPosition = position.clone().add(new Vector3(offsetX, offsetY, 0))

      // Create child asteroid
      const childId = createAsteroid(world, childPosition, childSize)

      // Add additional outward velocity for spreading effect
      const velocity = world.getComponent(childId, VelocityClass)
      if (velocity) {
        // Add velocity in the direction of the offset (outward from parent)
        velocity.linear.x += Math.cos(angle) * CHILD_VELOCITY_BOOST
        velocity.linear.y += Math.sin(angle) * CHILD_VELOCITY_BOOST
      }
    }
  }

  /**
   * Get events emitted during the current frame.
   *
   * Events are cleared at the start of each update cycle.
   *
   * @returns Array of asteroid destroyed events
   */
  getEvents(): AsteroidDestroyedEvent[] {
    return this.events
  }
}
