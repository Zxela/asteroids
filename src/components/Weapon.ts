/**
 * Weapon Component
 *
 * Tracks weapon state including cooldown, ammo, and energy for the player's ship.
 * Used by WeaponSystem to determine when firing is allowed and manage weapon switching.
 *
 * Properties:
 * - currentWeapon: Active weapon type (single, spread, laser, homing)
 * - cooldown: Milliseconds between shots for current weapon
 * - lastFiredAt: Timestamp (cumulative system time) of last shot
 * - ammo: Ammo count or 'infinite' for unlimited
 * - energy: Current energy level (for laser weapon)
 * - maxEnergy: Maximum energy capacity
 */

import type { WeaponType } from '../types/components'

/**
 * Weapon component class - weapon state and cooldown management.
 *
 * @example
 * ```typescript
 * const weapon = new Weapon('single', 250)
 * // Single shot with 250ms cooldown
 *
 * if (weapon.canFire(currentTime)) {
 *   weapon.recordFire(currentTime)
 *   // Create projectile...
 * }
 * ```
 */
export class Weapon {
  readonly type = 'weapon' as const

  /** Current weapon type */
  currentWeapon: WeaponType

  /** Cooldown duration in milliseconds */
  cooldown: number

  /** Timestamp of last shot (cumulative system time in ms) */
  lastFiredAt: number

  /** Ammo count or 'infinite' for unlimited */
  ammo: number | 'infinite'

  /** Current energy level (for laser weapon) */
  energy: number

  /** Maximum energy capacity */
  maxEnergy: number

  /**
   * Create a Weapon component.
   *
   * @param currentWeapon - Active weapon type (default: 'single')
   * @param cooldown - Milliseconds between shots (default: 250)
   * @param ammo - Ammo count or 'infinite' (default: 'infinite')
   * @param maxEnergy - Maximum energy capacity (default: 100)
   * @param energy - Starting energy level (default: maxEnergy)
   */
  constructor(
    currentWeapon: WeaponType = 'single',
    cooldown = 250,
    ammo: number | 'infinite' = 'infinite',
    maxEnergy = 100,
    energy?: number
  ) {
    this.currentWeapon = currentWeapon
    this.cooldown = cooldown
    this.lastFiredAt = 0
    this.ammo = ammo
    this.maxEnergy = maxEnergy
    this.energy = energy ?? maxEnergy
  }

  /**
   * Check if the weapon can fire based on cooldown.
   * A weapon that has never been fired (lastFiredAt = 0) can fire immediately
   * if currentTime > 0, otherwise checks cooldown normally.
   *
   * @param currentTime - Current cumulative system time in milliseconds
   * @returns True if cooldown has expired and weapon can fire
   */
  canFire(currentTime: number): boolean {
    // If weapon has never been fired (lastFiredAt = 0), allow immediate firing
    // Note: This assumes game time starts at some small positive value (e.g., first deltaTime)
    if (this.lastFiredAt === 0) {
      return true
    }
    return currentTime - this.lastFiredAt >= this.cooldown
  }

  /**
   * Record that the weapon was fired.
   * Updates lastFiredAt to current time for cooldown tracking.
   *
   * @param currentTime - Current cumulative system time in milliseconds
   */
  recordFire(currentTime: number): void {
    this.lastFiredAt = currentTime
  }

  /**
   * Consume ammo when firing.
   *
   * @param amount - Amount of ammo to consume (default: 1)
   * @returns True if ammo was successfully consumed, false if insufficient
   */
  consumeAmmo(amount = 1): boolean {
    if (this.ammo === 'infinite') {
      return true
    }
    if (this.ammo >= amount) {
      this.ammo -= amount
      return true
    }
    return false
  }

  /**
   * Consume energy when firing (for laser weapon).
   *
   * @param amount - Amount of energy to consume
   * @returns True if energy was successfully consumed, false if insufficient
   */
  consumeEnergy(amount: number): boolean {
    if (this.energy >= amount) {
      this.energy -= amount
      return true
    }
    return false
  }

  /**
   * Add energy (regeneration).
   *
   * @param amount - Amount of energy to add
   */
  addEnergy(amount: number): void {
    this.energy = Math.min(this.energy + amount, this.maxEnergy)
  }

  /**
   * Check if there is sufficient ammo to fire.
   *
   * @param amount - Amount of ammo required (default: 1)
   * @returns True if ammo is infinite or sufficient
   */
  hasAmmo(amount = 1): boolean {
    if (this.ammo === 'infinite') {
      return true
    }
    return this.ammo >= amount
  }
}
