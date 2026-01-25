/**
 * Ship Debris Entity Factory
 *
 * Creates ship debris entities when the player ship is destroyed.
 * Classic Asteroids feature: ship breaks into tumbling line segments.
 *
 * Each debris piece has:
 * - Transform: Position at ship death location, random rotation
 * - Velocity: Random velocity radiating outward, tumbling rotation
 * - Physics: Light mass, high damping for quick fade
 * - Renderable: Ship debris mesh with transparent material
 * - Lifetime: Fades out over 1.5 seconds
 */

import { Vector3 } from 'three'
import { Lifetime, Physics, Renderable, Transform, Velocity } from '../components'
import type { EntityId, World } from '../ecs/types'

/** Number of debris pieces to spawn */
const DEBRIS_COUNT = 5

/** Debris lifetime in milliseconds */
const DEBRIS_LIFETIME = 1500

/** Debris outward velocity range */
const DEBRIS_MIN_SPEED = 30
const DEBRIS_MAX_SPEED = 80

/** Debris tumbling speed range (radians per second) */
const DEBRIS_MIN_TUMBLE = 2
const DEBRIS_MAX_TUMBLE = 8

/** Debris spread radius from center */
const DEBRIS_SPREAD = 5

/**
 * Creates ship debris entities at the specified position.
 *
 * Spawns multiple debris pieces that fly outward with tumbling rotation
 * and fade out over time. Creates the classic Asteroids ship destruction effect.
 *
 * @param world - The ECS world to create entities in
 * @param position - The position where the ship was destroyed
 * @param shipRotation - The ship's rotation at time of death (for debris spread direction)
 * @returns Array of EntityIds for the created debris
 *
 * @example
 * ```typescript
 * // On ship destruction
 * const debrisIds = createShipDebris(world, shipTransform.position, shipTransform.rotation.z)
 * ```
 */
export function createShipDebris(
  world: World,
  position: Vector3,
  shipRotation = 0
): EntityId[] {
  const debrisIds: EntityId[] = []

  for (let i = 0; i < DEBRIS_COUNT; i++) {
    const debrisId = world.createEntity()

    // Calculate outward direction - spread evenly around the ship
    const angle = (i / DEBRIS_COUNT) * Math.PI * 2 + shipRotation + (Math.random() - 0.5) * 0.5

    // Random speed within range
    const speed = DEBRIS_MIN_SPEED + Math.random() * (DEBRIS_MAX_SPEED - DEBRIS_MIN_SPEED)

    // Calculate velocity components
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed

    // Random tumbling speed (positive or negative)
    const tumbleSpeed =
      (DEBRIS_MIN_TUMBLE + Math.random() * (DEBRIS_MAX_TUMBLE - DEBRIS_MIN_TUMBLE)) *
      (Math.random() > 0.5 ? 1 : -1)

    // Offset position slightly from center
    const offsetX = (Math.random() - 0.5) * DEBRIS_SPREAD * 2
    const offsetY = (Math.random() - 0.5) * DEBRIS_SPREAD * 2

    // Transform: Position near ship death location, random initial rotation
    world.addComponent(
      debrisId,
      new Transform(
        new Vector3(position.x + offsetX, position.y + offsetY, position.z),
        new Vector3(0, 0, Math.random() * Math.PI * 2), // Random initial rotation
        new Vector3(1, 1, 1)
      )
    )

    // Velocity: Outward motion with tumbling
    world.addComponent(
      debrisId,
      new Velocity(
        new Vector3(vx, vy, 0),
        new Vector3(0, 0, tumbleSpeed)
      )
    )

    // Physics: Light mass, screen wrap disabled (debris can fly off)
    world.addComponent(
      debrisId,
      new Physics(
        0.1, // Light mass
        0.99, // Slight damping
        200, // Max speed
        false // No screen wrap - debris flies off
      )
    )

    // Renderable: Ship debris mesh with transparent material
    world.addComponent(debrisId, new Renderable('ship_debris', 'transparent', true))

    // Lifetime: Despawn after fade duration
    world.addComponent(debrisId, new Lifetime(DEBRIS_LIFETIME))

    debrisIds.push(debrisId)
  }

  return debrisIds
}

/**
 * Debris lifetime constant exported for use by render system
 * to calculate opacity fade.
 */
export const SHIP_DEBRIS_LIFETIME = DEBRIS_LIFETIME
