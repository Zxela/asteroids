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

  /** Velocity damping factor applied each frame (0-1) */
  damping: number

  /** Maximum velocity magnitude (units/second) */
  maxSpeed: number

  /** Whether entity wraps at screen edges (toroidal topology) */
  wrapScreen: boolean

  /**
   * Create a Physics component.
   *
   * @param mass - Entity mass (default: 1)
   * @param damping - Velocity damping (default: 0.99)
   * @param maxSpeed - Maximum speed (default: 300)
   * @param wrapScreen - Enable screen wrapping (default: false)
   */
  constructor(mass = 1, damping = 0.99, maxSpeed = 300, wrapScreen = false) {
    this.mass = mass
    this.damping = damping
    this.maxSpeed = maxSpeed
    this.wrapScreen = wrapScreen
  }
}
