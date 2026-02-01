/**
 * DamageSystem - Processes collision events to apply damage
 *
 * Bridges collision detection with damage application by:
 * - Querying CollisionSystem.getCollisions() each frame
 * - Applying projectile damage to asteroids and UFOs
 * - Applying damage to player ship on asteroid/UFO collision
 * - Destroying asteroids on UFO collision (UFO unharmed)
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
   * - Projectile-UFO collisions: apply projectile damage to UFO, destroy projectile
   * - Asteroid-player collisions: apply instant kill damage to player if not invulnerable
   * - UFO-player collisions: apply instant kill damage to player if not invulnerable
   * - UFO-asteroid collisions: destroy asteroid (instant kill), UFO unharmed
   * - UFO projectile-player collisions: apply instant kill damage to player
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

        this.handleProjectileTargetCollision(world, projectileId, asteroidId)
        continue
      }

      // Handle projectile-UFO collisions
      if (
        (layer1 === 'projectile' && layer2 === 'ufo') ||
        (layer1 === 'ufo' && layer2 === 'projectile')
      ) {
        const projectileId = layer1 === 'projectile' ? entity1 : entity2
        const ufoId = layer1 === 'ufo' ? entity1 : entity2

        this.handleProjectileTargetCollision(world, projectileId, ufoId)
        continue
      }

      // Handle asteroid-player collisions
      if (
        (layer1 === 'asteroid' && layer2 === 'player') ||
        (layer1 === 'player' && layer2 === 'asteroid')
      ) {
        const playerId = layer1 === 'player' ? entity1 : entity2
        const asteroidId = layer1 === 'asteroid' ? entity1 : entity2

        this.handleAsteroidPlayerCollision(world, playerId, asteroidId)
        continue
      }

      // Handle UFO-player collisions
      if ((layer1 === 'ufo' && layer2 === 'player') || (layer1 === 'player' && layer2 === 'ufo')) {
        const playerId = layer1 === 'player' ? entity1 : entity2

        this.handleEnemyPlayerCollision(world, playerId)
        continue
      }

      // Handle UFO-asteroid collisions (UFO destroys asteroid, UFO unharmed)
      if (
        (layer1 === 'ufo' && layer2 === 'asteroid') ||
        (layer1 === 'asteroid' && layer2 === 'ufo')
      ) {
        const asteroidId = layer1 === 'asteroid' ? entity1 : entity2
        const ufoId = layer1 === 'ufo' ? entity1 : entity2

        // Only damage the asteroid if both entities are still alive
        if (!world.isEntityAlive(asteroidId) || !world.isEntityAlive(ufoId)) {
          continue
        }

        // Only damage the asteroid, not the UFO
        this.applyDamage(world, asteroidId, 999) // Instant kill
        continue
      }

      // Handle UFO projectile-player collisions
      if (
        (layer1 === 'ufoProjectile' && layer2 === 'player') ||
        (layer1 === 'player' && layer2 === 'ufoProjectile')
      ) {
        const playerId = layer1 === 'player' ? entity1 : entity2
        const projectileId = layer1 === 'ufoProjectile' ? entity1 : entity2

        this.handleEnemyProjectilePlayerCollision(world, playerId, projectileId)
      }
    }
  }

  /**
   * Handle projectile-target collision (asteroid or UFO).
   *
   * Applies projectile damage to target's health and destroys the projectile.
   *
   * @param world - The ECS world
   * @param projectileId - The projectile entity ID
   * @param targetId - The target entity ID (asteroid or UFO)
   */
  private handleProjectileTargetCollision(
    world: World,
    projectileId: EntityId,
    targetId: EntityId
  ): void {
    // Verify entities are still alive (may have been destroyed by another collision)
    if (!world.isEntityAlive(projectileId) || !world.isEntityAlive(targetId)) {
      return
    }

    const projectile = world.getComponent(projectileId, ProjectileClass)
    const targetHealth = world.getComponent(targetId, HealthClass)

    if (!projectile || !targetHealth) {
      return
    }

    // Apply damage to target
    targetHealth.takeDamage(projectile.damage)

    // Destroy the projectile
    world.destroyEntity(projectileId)
  }

  /**
   * Handle asteroid-player collision.
   *
   * Both entities take fatal damage:
   * - Player dies (if not invulnerable)
   * - Asteroid is destroyed (large/medium will split via AsteroidDestructionSystem)
   *
   * @param world - The ECS world
   * @param playerId - The player entity ID
   * @param asteroidId - The asteroid entity ID
   */
  private handleAsteroidPlayerCollision(
    world: World,
    playerId: EntityId,
    asteroidId: EntityId
  ): void {
    // Handle player damage
    if (world.isEntityAlive(playerId)) {
      const playerHealth = world.getComponent(playerId, HealthClass)
      if (playerHealth && !playerHealth.invulnerable) {
        playerHealth.current = 0
      }
    }

    // Handle asteroid damage - set health to 0 to trigger destruction/splitting
    if (world.isEntityAlive(asteroidId)) {
      const asteroidHealth = world.getComponent(asteroidId, HealthClass)
      if (asteroidHealth) {
        asteroidHealth.current = 0
      }
    }
  }

  /**
   * Handle enemy-player collision (UFO).
   *
   * Applies instant kill damage to player (sets health to 0) if not invulnerable.
   * The RespawnSystem will handle the actual death/respawn logic.
   *
   * @param world - The ECS world
   * @param playerId - The player entity ID
   */
  private handleEnemyPlayerCollision(world: World, playerId: EntityId): void {
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

  /**
   * Handle enemy projectile-player collision (UFO projectile).
   *
   * Applies instant kill damage to player and destroys the projectile.
   *
   * @param world - The ECS world
   * @param playerId - The player entity ID
   * @param projectileId - The UFO projectile entity ID
   */
  private handleEnemyProjectilePlayerCollision(
    world: World,
    playerId: EntityId,
    projectileId: EntityId
  ): void {
    // Verify entities are still alive
    if (!world.isEntityAlive(playerId) || !world.isEntityAlive(projectileId)) {
      return
    }

    const playerHealth = world.getComponent(playerId, HealthClass)

    if (!playerHealth) {
      return
    }

    // Apply instant kill damage if not invulnerable
    if (!playerHealth.invulnerable) {
      playerHealth.current = 0
    }

    // Destroy the UFO projectile
    world.destroyEntity(projectileId)
  }

  /**
   * Apply damage to an entity.
   *
   * Helper method to apply damage to any entity with a Health component.
   *
   * @param world - The ECS world
   * @param entityId - The entity to damage
   * @param damage - The amount of damage to apply
   */
  private applyDamage(world: World, entityId: EntityId, damage: number): void {
    // Verify entity is still alive
    if (!world.isEntityAlive(entityId)) {
      return
    }

    const health = world.getComponent(entityId, HealthClass)

    if (!health) {
      return
    }

    // Apply damage
    health.takeDamage(damage)
  }
}
