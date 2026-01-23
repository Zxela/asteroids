/**
 * Transform Component
 *
 * Position, rotation, and scale in 3D space.
 * Uses Three.js Vector3 for compatibility with the rendering system.
 */

import { Vector3 } from 'three'
import type { TransformComponent } from '../types/components'

/**
 * Transform component class - position, rotation, and scale of an entity.
 *
 * @example
 * ```typescript
 * const transform = new Transform(
 *   new Vector3(100, 50, 0),  // position
 *   new Vector3(0, 0, Math.PI / 2),  // rotation (Euler angles in radians)
 *   new Vector3(1, 1, 1)  // scale
 * )
 * ```
 */
export class Transform implements TransformComponent {
  readonly type = 'transform' as const

  /** Entity position in world space */
  position: Vector3

  /** Entity rotation as Euler angles (radians) */
  rotation: Vector3

  /** Entity scale */
  scale: Vector3

  /**
   * Create a Transform component.
   *
   * @param position - Position in world space (default: origin)
   * @param rotation - Euler angles in radians (default: no rotation)
   * @param scale - Scale factor (default: 1,1,1)
   */
  constructor(
    position: Vector3 = new Vector3(0, 0, 0),
    rotation: Vector3 = new Vector3(0, 0, 0),
    scale: Vector3 = new Vector3(1, 1, 1)
  ) {
    this.position = position
    this.rotation = rotation
    this.scale = scale
  }
}
