/**
 * PowerUp Component
 *
 * Identifies power-up type for pickup and effect application.
 * Four types: shield, rapidFire, multiShot, extraLife.
 */

import type { PowerUpComponent, PowerUpType } from '../types/components'

/**
 * PowerUp component class - identifies power-up type for collection.
 *
 * @example
 * ```typescript
 * const shieldPowerUp = new PowerUp('shield')
 * const rapidFirePowerUp = new PowerUp('rapidFire')
 * ```
 */
export class PowerUp implements PowerUpComponent {
  readonly type = 'powerUp' as const

  /** Type of power-up effect */
  powerUpType: PowerUpType

  /**
   * Create a PowerUp component.
   *
   * @param powerUpType - Type of power-up effect
   */
  constructor(powerUpType: PowerUpType) {
    this.powerUpType = powerUpType
  }
}
