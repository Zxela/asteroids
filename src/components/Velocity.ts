/**
 * Velocity Component
 *
 * Linear and angular velocity for entity movement.
 */

import { Vector3 } from 'three'
import type { VelocityComponent } from '../types/components'

/**
 * Velocity component class - linear and angular velocity of an entity.
 *
 * @example
 * ```typescript
 * const velocity = new Velocity(
 *   new Vector3(100, 50, 0),  // linear velocity (units/second)
 *   new Vector3(0, 0, Math.PI)  // angular velocity (radians/second)
 * )
 * ```
 */
export class Velocity implements VelocityComponent {
  readonly type = 'velocity' as const

  /** Linear velocity (units/second) */
  linear: Vector3

  /** Angular velocity (radians/second) */
  angular: Vector3

  /**
   * Create a Velocity component.
   *
   * @param linear - Linear velocity (default: zero)
   * @param angular - Angular velocity (default: zero)
   */
  constructor(linear: Vector3 = new Vector3(0, 0, 0), angular: Vector3 = new Vector3(0, 0, 0)) {
    this.linear = linear
    this.angular = angular
  }
}
