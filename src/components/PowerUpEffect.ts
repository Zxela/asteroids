/**
 * PowerUpEffect Component
 *
 * Tracks active power-up effects on an entity.
 * Each effect has a type, remaining time, and total duration.
 * Used by PowerUpSystem to manage timed effects.
 */

import type { ActivePowerUp, PowerUpEffectComponent, PowerUpType } from '../types/components'

/**
 * PowerUpEffect component class - manages active power-up effects.
 *
 * @example
 * ```typescript
 * const effects = new PowerUpEffect()
 * effects.addEffect('shield', 10000)
 * effects.addEffect('rapidFire', 15000)
 *
 * // Check if effect is active
 * if (effects.hasEffect('shield')) {
 *   // Apply shield behavior
 * }
 *
 * // Update timers each frame
 * effects.updateTimers(deltaTime)
 * ```
 */
export class PowerUpEffect implements PowerUpEffectComponent {
  readonly type = 'powerUpEffect' as const

  /** Array of active power-up effects */
  effects: ActivePowerUp[]

  /** Storage for original values (e.g., weapon cooldown) to restore on effect expiry */
  private originalValues: Map<string, number>

  /**
   * Create a PowerUpEffect component.
   */
  constructor() {
    this.effects = []
    this.originalValues = new Map()
  }

  /**
   * Add or refresh a power-up effect.
   * If the effect already exists, its timer is refreshed.
   *
   * @param powerUpType - Type of power-up effect
   * @param duration - Duration in milliseconds
   */
  addEffect(powerUpType: PowerUpType, duration: number): void {
    const existingEffect = this.effects.find((e) => e.powerUpType === powerUpType)

    if (existingEffect) {
      // Refresh timer
      existingEffect.remainingTime = duration
      existingEffect.totalDuration = duration
    } else {
      // Add new effect
      this.effects.push({
        powerUpType,
        remainingTime: duration,
        totalDuration: duration
      })
    }
  }

  /**
   * Remove a power-up effect.
   *
   * @param powerUpType - Type of power-up effect to remove
   */
  removeEffect(powerUpType: PowerUpType): void {
    this.effects = this.effects.filter((e) => e.powerUpType !== powerUpType)
  }

  /**
   * Check if an effect is currently active.
   *
   * @param powerUpType - Type of power-up effect
   * @returns True if effect is active
   */
  hasEffect(powerUpType: PowerUpType): boolean {
    return this.effects.some((e) => e.powerUpType === powerUpType)
  }

  /**
   * Get a specific effect by type.
   *
   * @param powerUpType - Type of power-up effect
   * @returns The active effect or undefined
   */
  getEffect(powerUpType: PowerUpType): ActivePowerUp | undefined {
    return this.effects.find((e) => e.powerUpType === powerUpType)
  }

  /**
   * Update all effect timers.
   * Returns array of expired effect types.
   *
   * @param deltaTime - Time elapsed in milliseconds
   * @returns Array of expired power-up types
   */
  updateTimers(deltaTime: number): PowerUpType[] {
    const expired: PowerUpType[] = []

    for (const effect of this.effects) {
      effect.remainingTime -= deltaTime
      if (effect.remainingTime <= 0) {
        expired.push(effect.powerUpType)
      }
    }

    // Remove expired effects
    for (const type of expired) {
      this.removeEffect(type)
    }

    return expired
  }

  /**
   * Store an original value for later restoration.
   *
   * @param key - Key to identify the value (e.g., 'weaponCooldown')
   * @param value - Original value to store
   */
  storeOriginalValue(key: string, value: number): void {
    if (!this.originalValues.has(key)) {
      this.originalValues.set(key, value)
    }
  }

  /**
   * Get a stored original value.
   *
   * @param key - Key to identify the value
   * @returns The stored value or undefined
   */
  getOriginalValue(key: string): number | undefined {
    return this.originalValues.get(key)
  }

  /**
   * Remove a stored original value.
   *
   * @param key - Key to identify the value
   */
  clearOriginalValue(key: string): void {
    this.originalValues.delete(key)
  }
}
