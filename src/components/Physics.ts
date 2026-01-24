/**
 * Physics Component
 *
 * Physics simulation properties including mass, damping, and speed limits.
 */

import type { PhysicsComponent } from '../types/components'

/**
 * Physics component class - controls physics simulation behavior.
 *
 * @example
 * ```typescript
 * const physics = new Physics(1, 0.99, 300, true)
 * // mass: 1, damping: 0.99, maxSpeed: 300, wrapScreen: true
 * ```
 */
export class Physics implements PhysicsComponent {
  readonly type = 'physics' as const

  /** Entity mass (affects acceleration) */
  mass: number

  /** Linear velocity damping factor (0-1, applied per second) */
  damping: number

  /** Angular velocity damping factor (0-1, applied per second) */
  angularDamping: number

  /** Maximum velocity magnitude (units/second) */
  maxSpeed: number

  /** Whether entity wraps at screen edges (toroidal topology) */
  wrapScreen: boolean

  /**
   * Create a Physics component.
   *
   * @param mass - Entity mass (default: 1)
   * @param damping - Linear velocity damping (default: 0.98)
   * @param maxSpeed - Maximum speed (default: 300)
   * @param wrapScreen - Enable screen wrapping (default: false)
   * @param angularDamping - Angular velocity damping (default: 0.01, high friction for responsive rotation)
   */
  constructor(mass = 1, damping = 0.98, maxSpeed = 300, wrapScreen = false, angularDamping = 0.01) {
    this.mass = mass
    this.damping = damping
    this.angularDamping = angularDamping
    this.maxSpeed = maxSpeed
    this.wrapScreen = wrapScreen
  }
}
