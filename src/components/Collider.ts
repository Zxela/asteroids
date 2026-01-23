/**
 * Collider Component
 *
 * Collision detection properties including shape, layer, and mask.
 */

import type { Vector3 } from 'three'
import type { ColliderComponent, ColliderShape, CollisionLayer } from '../types/components'

/**
 * Collider component class - defines collision shape and filtering.
 *
 * @example
 * ```typescript
 * // Sphere collider for player
 * const playerCollider = new Collider('sphere', 20, 'player', ['asteroid', 'powerup'])
 *
 * // Box collider for boss
 * const bossCollider = new Collider('box', undefined, 'boss', ['projectile'], new Vector3(50, 30, 20))
 * ```
 */
export class Collider implements ColliderComponent {
  readonly type = 'collider' as const

  /** Collider shape type */
  shape: ColliderShape

  /** Radius for sphere colliders */
  radius?: number

  /** Size for box colliders */
  size?: Vector3

  /** Collision layer this entity belongs to */
  layer: CollisionLayer

  /** Collision layers this entity can collide with */
  mask: CollisionLayer[]

  /**
   * Create a Collider component.
   *
   * @param shape - Collider shape (default: 'sphere')
   * @param radius - Radius for sphere colliders (default: 1)
   * @param layer - Collision layer (default: 'asteroid')
   * @param mask - Layers to collide with (default: empty array)
   * @param size - Size for box colliders (optional)
   */
  constructor(
    shape: ColliderShape = 'sphere',
    radius = 1,
    layer: CollisionLayer = 'asteroid',
    mask: CollisionLayer[] = [],
    size?: Vector3
  ) {
    this.shape = shape
    this.radius = radius
    this.layer = layer
    this.mask = mask
    this.size = size
  }
}
