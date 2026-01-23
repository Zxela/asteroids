/**
 * Projectile System
 *
 * Handles projectile updates including lifetime tracking and homing logic.
 * Projectiles with homingTarget set will track their target entity,
 * adjusting their direction each frame with limited turn rate.
 *
 * Homing missiles have:
 * - homingAcceleration: Turn rate limit (200 units/s^2)
 * - Speed maintained at projectile speed
 * - Target cleared if target entity is destroyed
 *
 * Following ADR-0001: ECS architecture for game entity management.
 */

import { Projectile, Transform, Velocity } from '../components'
import { WEAPON_CONFIGS } from '../config/weaponConfig'
import type { ComponentClass, EntityId, World as IWorld, System } from '../ecs/types'

// Type assertions for component classes to work with ECS type system
const TransformClass = Transform as unknown as ComponentClass<Transform>
const VelocityClass = Velocity as unknown as ComponentClass<Velocity>
const ProjectileClass = Projectile as unknown as ComponentClass<Projectile>

/**
 * ProjectileSystem - handles projectile updates and homing logic.
 *
 * Queries for entities with Projectile, Transform, and Velocity components,
 * updates elapsed time, and applies homing forces to tracking projectiles.
 */
export class ProjectileSystem implements System {
  /**
   * Update projectile system - track elapsed time and apply homing forces.
   *
   * @param world - The ECS world instance
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: IWorld, deltaTime: number): void {
    // Query for all projectile entities
    const projectiles = world.query(ProjectileClass, TransformClass, VelocityClass)

    for (const projectileId of projectiles) {
      const projectile = world.getComponent(projectileId, ProjectileClass)
      const transform = world.getComponent(projectileId, TransformClass)
      const velocity = world.getComponent(projectileId, VelocityClass)

      if (!projectile || !transform || !velocity) continue

      // Update elapsed time
      projectile.updateElapsed(deltaTime)

      // Handle homing projectiles
      if (projectile.projectileType === 'homing' && projectile.homingTarget !== undefined) {
        this.applyHomingForce(world, projectileId, projectile, transform, velocity, deltaTime)
      }
    }
  }

  /**
   * Apply homing force to a projectile tracking a target.
   *
   * Uses acceleration-limited turning to create curved flight paths.
   * If target is destroyed, clears homingTarget and projectile continues straight.
   *
   * @param world - The ECS world
   * @param projectileId - Entity ID of the projectile
   * @param projectile - Projectile component
   * @param transform - Transform component
   * @param velocity - Velocity component
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  private applyHomingForce(
    world: IWorld,
    _projectileId: EntityId,
    projectile: Projectile,
    transform: Transform,
    velocity: Velocity,
    deltaTime: number
  ): void {
    const targetId = projectile.homingTarget

    // Check if target still exists
    if (targetId === undefined || !world.isEntityAlive(targetId)) {
      // Target destroyed, clear homing and continue straight
      projectile.homingTarget = undefined
      return
    }

    // Get target position
    const targetTransform = world.getComponent(targetId, TransformClass)
    if (!targetTransform) {
      projectile.homingTarget = undefined
      return
    }

    // Calculate direction to target
    const toTarget = targetTransform.position.clone().sub(transform.position)
    const distanceToTarget = toTarget.length()

    // Avoid division by zero if at same position
    if (distanceToTarget < 0.001) {
      return
    }

    // Normalize to get desired direction
    const desiredDirection = toTarget.normalize()

    // Get current velocity direction and speed
    const currentSpeed = velocity.linear.length()
    const projectileSpeed = WEAPON_CONFIGS.homing.projectileSpeed

    if (currentSpeed < 0.001) {
      // If no speed, just point toward target
      velocity.linear.copy(desiredDirection.clone().multiplyScalar(projectileSpeed))
      return
    }

    const currentDirection = velocity.linear.clone().normalize()

    // Calculate steering vector (how much we want to turn)
    // Use desired - current to get the adjustment needed
    const steering = desiredDirection.clone().sub(currentDirection)

    // Limit steering by homing acceleration * deltaTime (in seconds)
    // This creates gradual turning rather than instant lock-on
    const homingAcceleration = WEAPON_CONFIGS.homing.homingAcceleration ?? 200
    const deltaSeconds = deltaTime / 1000
    const maxSteeringMagnitude = (homingAcceleration * deltaSeconds) / currentSpeed

    const steeringMagnitude = steering.length()

    if (steeringMagnitude > 0.001) {
      if (steeringMagnitude > maxSteeringMagnitude) {
        steering.normalize().multiplyScalar(maxSteeringMagnitude)
      }

      // Apply steering to current direction
      const newDirection = currentDirection.add(steering).normalize()

      // Set velocity to new direction at projectile speed
      velocity.linear.copy(newDirection.multiplyScalar(projectileSpeed))
    }
  }
}
