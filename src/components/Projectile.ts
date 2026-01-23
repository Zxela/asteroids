/**
 * Projectile Component
 *
 * Projectile-specific properties including damage, owner, lifetime, and type.
 * Used by the WeaponSystem to track projectile behavior and collision handling.
 */

import type { EntityId } from '../ecs/types'
import type { WeaponType } from '../types/components'

/**
 * Projectile type for factory function.
 * Matches weapon types for consistency.
 */
export type ProjectileType = WeaponType

/**
 * Projectile component class - projectile-specific data.
 *
 * Properties:
 * - damage: Amount of damage dealt on collision
 * - owner: EntityId of the ship that fired this projectile
 * - lifetime: Total lifespan in milliseconds
 * - elapsed: Time elapsed since creation in milliseconds
 * - type: Projectile type (single, spread, laser, homing)
 * - homingTarget: Optional EntityId for homing missiles to track
 *
 * Note: This class does not implement ProjectileComponent interface directly
 * due to EntityId type variance between src/ecs/types and src/types/ecs.
 * It is structurally compatible with the ECS system requirements.
 *
 * @example
 * ```typescript
 * const projectile = new Projectile(10, shipId, 3000, 'single')
 * // damage: 10, lifetime: 3000ms, type: single
 *
 * projectile.updateElapsed(16) // Update with deltaTime
 * if (projectile.isExpired()) { ... }
 * ```
 */
export class Projectile {
  readonly type = 'projectile' as const

  /** Amount of damage dealt on collision */
  damage: number

  /** EntityId of the ship that fired this projectile */
  owner: EntityId

  /** Total lifespan in milliseconds */
  lifetime: number

  /** Time elapsed since creation in milliseconds */
  elapsed: number

  /** Projectile type (single, spread, laser, homing) */
  projectileType: ProjectileType

  /** Optional target EntityId for homing missiles */
  homingTarget?: EntityId

  /**
   * Create a Projectile component.
   *
   * @param damage - Amount of damage dealt on collision (default: 10)
   * @param owner - EntityId of the ship that fired this projectile
   * @param lifetime - Total lifespan in milliseconds (default: 3000)
   * @param projectileType - Projectile type (default: 'single')
   * @param homingTarget - Optional EntityId for homing missiles to track
   */
  constructor(
    damage = 10,
    owner: EntityId = 0 as EntityId,
    lifetime = 3000,
    projectileType: ProjectileType = 'single',
    homingTarget?: EntityId
  ) {
    this.damage = damage
    this.owner = owner
    this.lifetime = lifetime
    this.elapsed = 0
    this.projectileType = projectileType
    this.homingTarget = homingTarget
  }

  /**
   * Check if the projectile has exceeded its lifetime.
   *
   * @returns True if elapsed time >= lifetime
   */
  isExpired(): boolean {
    return this.elapsed >= this.lifetime
  }

  /**
   * Update the elapsed time since projectile creation.
   *
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  updateElapsed(deltaTime: number): void {
    this.elapsed += deltaTime
  }
}
