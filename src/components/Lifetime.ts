/**
 * Lifetime Component
 *
 * Tracks remaining lifetime for entities that should despawn after a duration.
 * Used for power-ups, particles, and other temporary entities.
 */

import type { LifetimeComponent } from '../types/components'

/**
 * Lifetime component class - tracks remaining lifetime of an entity.
 *
 * @example
 * ```typescript
 * // Power-up that despawns after 3 seconds
 * const lifetime = new Lifetime(3000)
 * ```
 */
export class Lifetime implements LifetimeComponent {
  readonly type = 'lifetime' as const

  /** Remaining time in milliseconds before entity despawns */
  remaining: number

  /**
   * Create a Lifetime component.
   *
   * @param remaining - Remaining time in milliseconds (default: 3000)
   */
  constructor(remaining = 3000) {
    this.remaining = remaining
  }
}
