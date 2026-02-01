/**
 * Projectile Entity Factory
 *
 * Creates projectile entities with all required components.
 * Projectiles are launched by the WeaponSystem and destroyed on collision
 * with asteroids or boss entities.
 *
 * Component setup:
 * - Transform: Position, rotation toward direction
 * - Velocity: Speed based on weapon type
 * - Collider: Small sphere, configurable layer and mask
 *   - Player projectiles: "projectile" layer, collides with "asteroid" and "boss"
 *   - Boss projectiles: "bossProjectile" layer, collides with "player"
 * - Renderable: Mesh type based on weapon type, emissive material
 * - Projectile: Damage, owner, lifetime, type, optional homing target
 */

import { Vector3 } from 'three'
import { Collider, Physics, Renderable, Transform, Velocity } from '../components'
import { Projectile } from '../components/Projectile'
import { gameConfig } from '../config'
import type { EntityId, World } from '../ecs/types'
import type { CollisionLayer, MeshType, WeaponType } from '../types/components'

/**
 * Projectile type for factory (same as weapon types).
 */
export type ProjectileType = WeaponType

/**
 * Configuration options for creating a projectile.
 */
export interface ProjectileConfig {
  /** Spawn position in world space */
  position: Vector3
  /** Normalized direction vector for projectile travel */
  direction: Vector3
  /** Projectile/weapon type */
  type: ProjectileType
  /** EntityId of the ship that fired this projectile */
  owner: EntityId
  /** Optional custom damage (overrides weapon default) */
  damage?: number
  /** Optional custom speed (overrides weapon default) */
  speed?: number
  /** Optional custom lifetime in milliseconds (default: 3000) */
  lifetime?: number
  /** Optional target EntityId for homing missiles */
  homingTarget?: EntityId
}

/** Default projectile lifetime in milliseconds */
const DEFAULT_LIFETIME = 3000

/** Projectile collider radius */
const PROJECTILE_RADIUS = 5

/**
 * Maps weapon types to mesh types for rendering.
 */
const MESH_TYPE_MAP: Record<ProjectileType, MeshType> = {
  single: 'projectile_default',
  spread: 'projectile_spread',
  laser: 'projectile_laser',
  homing: 'projectile_missile',
  boss: 'projectile_boss'
}

/**
 * Creates a projectile entity with all required components.
 *
 * The projectile is created at the specified position and moves in the
 * given direction at a speed determined by the weapon type configuration.
 *
 * @param world - The ECS world to create the entity in
 * @param config - Projectile configuration options
 * @returns The EntityId of the newly created projectile
 *
 * @example
 * ```typescript
 * const world = new World()
 * const projectileId = createProjectile(world, {
 *   position: new Vector3(0, 0, 0),
 *   direction: new Vector3(0, 1, 0).normalize(),
 *   type: 'single',
 *   owner: shipId
 * })
 * ```
 */
export function createProjectile(world: World, config: ProjectileConfig): EntityId {
  const projectileId = world.createEntity()

  // Get weapon configuration for this type
  const weaponConfig = gameConfig.weapons[config.type]
  const speed = config.speed ?? weaponConfig.projectileSpeed
  const damage = config.damage ?? weaponConfig.damage
  const lifetime = config.lifetime ?? DEFAULT_LIFETIME

  // Ensure direction is normalized
  const normalizedDirection = config.direction.clone().normalize()

  // Calculate rotation to face direction of travel (2D rotation around Z-axis)
  const rotationZ = Math.atan2(normalizedDirection.y, normalizedDirection.x) - Math.PI / 2

  // Transform: Position at spawn point, rotation toward direction
  world.addComponent(
    projectileId,
    new Transform(config.position.clone(), new Vector3(0, 0, rotationZ), new Vector3(1, 1, 1))
  )

  // Velocity: Direction * speed, no angular velocity
  const linearVelocity = normalizedDirection.multiplyScalar(speed)
  world.addComponent(projectileId, new Velocity(linearVelocity, new Vector3(0, 0, 0)))

  // Physics: No damping (projectiles maintain speed), high max speed, screen wrapping
  // damping = 1.0 means no velocity decay
  world.addComponent(projectileId, new Physics(1, 1.0, speed * 2, true))

  // Collider: Configure based on projectile type
  // Boss projectiles use "bossProjectile" layer and only collide with "player"
  // Player projectiles use "projectile" layer and collide with "asteroid", "boss", and "ufo"
  const isBossProjectile = config.type === 'boss'
  const collisionLayer: CollisionLayer = isBossProjectile ? 'bossProjectile' : 'projectile'
  const collisionMask: CollisionLayer[] = isBossProjectile ? ['player'] : ['asteroid', 'boss', 'ufo']

  world.addComponent(
    projectileId,
    new Collider('sphere', PROJECTILE_RADIUS, collisionLayer, collisionMask)
  )

  // Renderable: Mesh type based on weapon type, emissive material
  world.addComponent(projectileId, new Renderable(MESH_TYPE_MAP[config.type], 'emissive', true))

  // Projectile: Damage, owner, lifetime, type, optional homing target
  world.addComponent(
    projectileId,
    new Projectile(damage, config.owner, lifetime, config.type, config.homingTarget)
  )

  return projectileId
}
