/**
 * Ship Entity Factory
 *
 * Creates the player ship entity with all required components.
 * The ship is positioned at screen center (0, 0, 0) with physics,
 * collision, and rendering properly configured.
 *
 * Component setup:
 * - Transform: Position at origin, no rotation, normal scale
 * - Velocity: Zero initial velocity (both linear and angular)
 * - Physics: Mass 1, damping from config, max speed from config, screen wrap enabled
 * - Collider: Sphere shape, radius 20, player layer, collides with asteroids/boss projectiles/powerups
 * - Health: 1 HP per life (depleted = lose life)
 * - Player: Initial lives from config, score starts at 0
 * - Renderable: Ship mesh type, standard material, visible
 */

import { Vector3 } from 'three'
import { Collider, Health, Physics, Player, Renderable, Transform, Velocity } from '../components'
import { gameConfig } from '../config'
import type { EntityId, World } from '../ecs/types'

/** Screen center X coordinate in world space */
const SCREEN_CENTER_X = 0

/** Screen center Y coordinate in world space */
const SCREEN_CENTER_Y = 0

/** Screen center Z coordinate in world space */
const SCREEN_CENTER_Z = 0

/** Ship collider radius (matches visible ship size) */
const SHIP_COLLIDER_RADIUS = 20

/** Ship mass (baseline value, other entities may differ) */
const SHIP_MASS = 1

/** Ship health per life (depleted triggers respawn) */
const SHIP_HEALTH = 1

/**
 * Creates a player ship entity with all required components.
 *
 * The ship is the main player-controlled entity. It starts at screen center
 * with no initial velocity. Physics properties (damping, max speed) and
 * gameplay properties (initial lives) are sourced from gameConfig.
 *
 * @param world - The ECS world to create the entity in
 * @returns The EntityId of the newly created ship
 *
 * @example
 * ```typescript
 * const world = new World()
 * const shipId = createShip(world)
 * // Ship is now ready with all components configured
 * ```
 */
export function createShip(world: World): EntityId {
  const shipId = world.createEntity()

  // Transform: Position at screen center, no rotation, normal scale
  world.addComponent(
    shipId,
    new Transform(
      new Vector3(SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_CENTER_Z),
      new Vector3(0, 0, 0), // No initial rotation
      new Vector3(1, 1, 1) // Normal scale
    )
  )

  // Velocity: No initial movement
  world.addComponent(
    shipId,
    new Velocity(
      new Vector3(0, 0, 0), // Zero linear velocity
      new Vector3(0, 0, 0) // Zero angular velocity
    )
  )

  // Physics: Ship physics properties from config
  world.addComponent(
    shipId,
    new Physics(
      SHIP_MASS,
      gameConfig.physics.damping,
      gameConfig.physics.shipMaxSpeed,
      true // wrapScreen enabled
    )
  )

  // Collider: Player collision layer, collides with asteroids, boss projectiles, and powerups
  world.addComponent(
    shipId,
    new Collider('sphere', SHIP_COLLIDER_RADIUS, 'player', [
      'asteroid',
      'bossProjectile',
      'powerup'
    ])
  )

  // Health: 1 HP per life (depleted = lose life, triggers respawn)
  world.addComponent(shipId, new Health(SHIP_HEALTH, SHIP_HEALTH))

  // Player: Initial lives from config, score starts at 0
  world.addComponent(shipId, new Player(gameConfig.gameplay.initialLives))

  // Renderable: Ship mesh with standard material, visible by default
  world.addComponent(shipId, new Renderable('ship', 'standard', true))

  return shipId
}
