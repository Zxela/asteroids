/**
 * Health Component
 *
 * Entity health and invulnerability state management.
 */

import type { HealthComponent } from '../types/components'

/**
 * Health component class - manages entity health and invulnerability.
 *
 * @example
 * ```typescript
 * const health = new Health(100, 100)
 * health.takeDamage(30)  // current becomes 70
 * health.setInvulnerable(3000)  // invulnerable for 3 seconds
 * ```
 */
export class Health implements HealthComponent {
  readonly type = 'health' as const

  /** Maximum health */
  max: number

  /** Current health */
  current: number

  /** Whether entity is invulnerable to damage */
  invulnerable: boolean

  /** Remaining invulnerability time in milliseconds */
  invulnerabilityTimer: number

  /**
   * Create a Health component.
   *
   * @param max - Maximum health (default: 1)
   * @param current - Current health (default: same as max)
   */
  constructor(max = 1, current?: number) {
    this.max = max
    this.current = current ?? max
    this.invulnerable = false
    this.invulnerabilityTimer = 0
  }

  /**
   * Apply damage to the entity.
   * Damage is ignored if invulnerable.
   *
   * @param amount - Amount of damage to apply
   */
  takeDamage(amount: number): void {
    if (!this.invulnerable) {
      this.current = Math.max(0, this.current - amount)
    }
  }

  /**
   * Make the entity invulnerable for a duration.
   *
   * @param duration - Invulnerability duration in milliseconds
   */
  setInvulnerable(duration: number): void {
    this.invulnerable = true
    this.invulnerabilityTimer = duration
  }
}
