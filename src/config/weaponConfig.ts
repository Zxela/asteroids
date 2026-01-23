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
 * Values from Design Doc:
 * - single: 250ms cooldown, 500 speed, 1 damage, infinite ammo
 * - spread: 400ms cooldown, 450 speed, 1 damage, 15-degree spread, 3 projectiles
 * - laser: continuous fire, 2 damage/frame, 10 energy/frame, 5 regen/frame, 100 max energy
 * - homing: 300ms cooldown, 300 speed, 2 damage, 10 ammo
 */
export const WEAPON_CONFIGS: Record<WeaponType, WeaponTypeConfig> = {
  single: {
    type: 'single',
    cooldown: 250,
    projectileSpeed: 500,
    damage: 1,
    ammo: 'infinite'
  },
  spread: {
    type: 'spread',
    cooldown: 400,
    projectileSpeed: 450,
    damage: 1,
    ammo: 'infinite',
    spreadAngle: 15,
    projectileCount: 3
  },
  laser: {
    type: 'laser',
    cooldown: 0,
    projectileSpeed: 0,
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
    damage: 2,
    ammo: 10,
    homingAcceleration: 200,
    homingRange: 500
  }
}

/**
 * Get weapon configuration by type.
 *
 * @param weaponType - The weapon type to get configuration for
 * @returns The weapon configuration
 */
export function getWeaponConfig(weaponType: WeaponType): WeaponTypeConfig {
  return WEAPON_CONFIGS[weaponType]
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
