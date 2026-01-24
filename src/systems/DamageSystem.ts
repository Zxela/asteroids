/**
 * DamageSystem - Processes collision events to apply damage
 *
 * Bridges collision detection with damage application by:
 * - Querying CollisionSystem.getCollisions() each frame
 * - Applying projectile damage to asteroids
 * - Applying damage to player ship on asteroid collision
 * - Destroying projectiles after they deal damage
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/DamageSystem
 */

import { Health } from '../components/Health'
import { Projectile } from '../components/Projectile'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'
import type { CollisionSystem } from './CollisionSystem'

// Type assertions for component classes to work with ECS type system
const HealthClass = Health as unknown as ComponentClass<Health>
const ProjectileClass = Projectile as unknown as ComponentClass<Projectile>

/**
 * System for processing collision events and applying damage.
 *
 * Consumes collision events from CollisionSystem and applies appropriate
 * damage based on the collision type (projectile-asteroid or asteroid-player).
 *
 * @example
 * ```typescript
 * const collisionSystem = new CollisionSystem()
 * const damageSystem = new DamageSystem(collisionSystem)
 * world.registerSystem(collisionSystem)
 * world.registerSystem(damageSystem)
 *
 * // Each frame in game loop
 * collisionSystem.update(world, deltaTime)
 * damageSystem.update(world, deltaTime)
 * ```
 */
export class DamageSystem implements System {
  /** System type identifier */
  readonly systemType = 'damage' as const

  /** Required components - damage system doesn't query directly, uses CollisionSystem */
  readonly requiredComponents: string[] = []

  /** Reference to the collision system for getting collision events */
  private collisionSystem: CollisionSystem

  /**
   * Create a new DamageSystem.
   *
   * @param collisionSystem - The CollisionSystem to get collision events from
   */
  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem
  }

  /**
   * Process collision events and apply damage.
   *
   * Iterates through all collisions detected this frame and handles:
   * - Projectile-asteroid collisions: apply projectile damage to asteroid, destroy projectile
   * - Asteroid-player collisions: apply instant kill damage to player if not invulnerable
   *
   * @param world - The ECS world containing entities
   * @param _deltaTime - Time since last frame in milliseconds (unused)
   */
  update(world: World, _deltaTime: number): void {
    const collisions = this.collisionSystem.getCollisions()

    for (const collision of collisions) {
      const { entity1, entity2, layer1, layer2 } = collision

      // Handle projectile-asteroid collisions
      if (
        (layer1 === 'projectile' && layer2 === 'asteroid') ||
        (layer1 === 'asteroid' && layer2 === 'projectile')
      ) {
        const projectileId = layer1 === 'projectile' ? entity1 : entity2
        const asteroidId = layer1 === 'asteroid' ? entity1 : entity2

        this.handleProjectileAsteroidCollision(world, projectileId, asteroidId)
        continue
      }

      // Handle asteroid-player collisions
      if (
        (layer1 === 'asteroid' && layer2 === 'player') ||
        (layer1 === 'player' && layer2 === 'asteroid')
      ) {
        const playerId = layer1 === 'player' ? entity1 : entity2

        this.handleAsteroidPlayerCollision(world, playerId)
      }
    }
  }

  /**
   * Handle projectile-asteroid collision.
   *
   * Applies projectile damage to asteroid's health and destroys the projectile.
   *
   * @param world - The ECS world
   * @param projectileId - The projectile entity ID
   * @param asteroidId - The asteroid entity ID
   */
  private handleProjectileAsteroidCollision(
    world: World,
    projectileId: EntityId,
    asteroidId: EntityId
  ): void {
    // Verify entities are still alive (may have been destroyed by another collision)
    if (!world.isEntityAlive(projectileId) || !world.isEntityAlive(asteroidId)) {
      return
    }

    const projectile = world.getComponent(projectileId, ProjectileClass)
    const asteroidHealth = world.getComponent(asteroidId, HealthClass)

    if (!projectile || !asteroidHealth) {
      return
    }

    // Apply damage to asteroid
    asteroidHealth.takeDamage(projectile.damage)

    // Destroy the projectile
    world.destroyEntity(projectileId)
  }

  /**
   * Handle asteroid-player collision.
   *
   * Applies instant kill damage to player (sets health to 0) if not invulnerable.
   * The RespawnSystem will handle the actual death/respawn logic.
   *
   * @param world - The ECS world
   * @param playerId - The player entity ID
   */
  private handleAsteroidPlayerCollision(world: World, playerId: EntityId): void {
    // Verify entity is still alive
    if (!world.isEntityAlive(playerId)) {
      return
    }

    const playerHealth = world.getComponent(playerId, HealthClass)

    if (!playerHealth) {
      return
    }

    // Check invulnerability - damage is handled inside Health.takeDamage()
    // but we use takeDamage with max health to ensure instant kill
    // Setting health to 0 directly triggers respawn flow
    if (!playerHealth.invulnerable) {
      playerHealth.current = 0
    }
  }
}
