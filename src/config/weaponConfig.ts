/**
 * Weapon Configuration
 *
 * Configuration for all weapon types including cooldowns, damage, energy costs,
 * and weapon-specific parameters like spread angle and projectile count.
 *
 * Used by WeaponSystem to determine firing behavior for each weapon type.
 */

import type { WeaponType } from '../types/components'

/**
 * Extended weapon configuration for all weapon types.
 */
export interface WeaponTypeConfig {
  /** Weapon type identifier */
  type: WeaponType
  /** Cooldown between shots in milliseconds (0 for continuous weapons) */
  cooldown: number
  /** Projectile speed in units/second (0 for instant-hit weapons) */
  projectileSpeed: number
  /** Damage per hit or per frame for continuous weapons */
  damage: number
  /** Ammo type: number for limited ammo, 'infinite' for unlimited */
  ammo: number | 'infinite'
  /** Energy cost per shot/frame (for laser weapon) */
  energyCost?: number
  /** Energy regeneration rate per second (when not firing) */
  energyRegen?: number
  /** Maximum energy capacity */
  maxEnergy?: number
  /** Spread angle in degrees (for spread shot) */
  spreadAngle?: number
  /** Number of projectiles per shot (for spread shot) */
  projectileCount?: number
  /** Homing acceleration in units/s^2 (for homing missiles) */
  homingAcceleration?: number
  /** Maximum range to acquire a homing target (for homing missiles) */
  homingRange?: number
}

/**
 * Weapon configurations for all weapon types.
 *
 * Damage values are balanced against asteroid health (large=30, medium=20, small=10).
 * - single: 10 damage = 1-shot small, 2-shot medium, 3-shot large
 * - spread: 5 damage per projectile, 3 projectiles = 15 damage volley
 * - laser: 2 damage/frame, continuous fire
 * - homing: 20 damage = 1-shot medium, high value per limited ammo
 */
export const WEAPON_CONFIGS: Record<WeaponType, WeaponTypeConfig> = {
  single: {
    type: 'single',
    cooldown: 250,
    projectileSpeed: 400,
    damage: 10,
    ammo: 'infinite'
  },
  spread: {
    type: 'spread',
    cooldown: 400,
    projectileSpeed: 350,
    damage: 5,
    ammo: 'infinite',
    spreadAngle: 15,
    projectileCount: 3
  },
  laser: {
    type: 'laser',
    cooldown: 50,
    projectileSpeed: 600,
    damage: 2,
    ammo: 'infinite',
    energyCost: 10,
    energyRegen: 5,
    maxEnergy: 100
  },
  homing: {
    type: 'homing',
    cooldown: 300,
    projectileSpeed: 300,
    damage: 20,
    ammo: 10,
    homingAcceleration: 200,
    homingRange: 500
  },
  boss: {
    type: 'boss',
    cooldown: 500,
    projectileSpeed: 350,
    damage: 15,
    ammo: 'infinite'
  }
}

/**
 * List of available weapon types in order (for cycling).
 */
export const WEAPON_ORDER: WeaponType[] = ['single', 'spread', 'laser', 'homing']

/**
 * Get the next weapon type in the cycle.
 *
 * @param currentWeapon - Current weapon type
 * @returns Next weapon type in the cycle
 */
export function getNextWeapon(currentWeapon: WeaponType): WeaponType {
  const currentIndex = WEAPON_ORDER.indexOf(currentWeapon)
  const nextIndex = (currentIndex + 1) % WEAPON_ORDER.length
  const nextWeapon = WEAPON_ORDER[nextIndex]
  return nextWeapon ?? 'single'
}

/**
 * Get the previous weapon type in the cycle.
 *
 * @param currentWeapon - Current weapon type
 * @returns Previous weapon type in the cycle
 */
export function getPreviousWeapon(currentWeapon: WeaponType): WeaponType {
  const currentIndex = WEAPON_ORDER.indexOf(currentWeapon)
  const prevIndex = (currentIndex - 1 + WEAPON_ORDER.length) % WEAPON_ORDER.length
  const prevWeapon = WEAPON_ORDER[prevIndex]
  return prevWeapon ?? 'homing'
}
