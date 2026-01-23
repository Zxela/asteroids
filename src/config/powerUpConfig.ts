/**
 * Power-up Configuration
 *
 * Configuration for all power-up types including durations and descriptions.
 * Used by PowerUpSystem to determine effect behavior and timing.
 *
 * Effect durations from Design Doc:
 * - Shield: 10000ms (10 seconds)
 * - RapidFire: 15000ms (15 seconds)
 * - MultiShot: 15000ms (15 seconds)
 * - ExtraLife: -1 (permanent, instant effect)
 */

import type { PowerUpType } from '../types/components'

/**
 * Configuration for a single power-up effect.
 */
export interface PowerUpEffectConfig {
  /** Power-up type identifier */
  type: PowerUpType
  /** Duration in milliseconds (-1 for permanent/instant effects) */
  duration: number
  /** Human-readable description of the effect */
  description: string
}

/**
 * Power-up configurations for all types.
 *
 * Values match Design Doc specifications:
 * - Shield: 10s invulnerability
 * - RapidFire: 15s, doubles fire rate (halves cooldown)
 * - MultiShot: 15s, triple projectile spread
 * - ExtraLife: Instant, permanent +1 life
 */
export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpEffectConfig> = {
  shield: {
    type: 'shield',
    duration: 10000,
    description: 'Invulnerability'
  },
  rapidFire: {
    type: 'rapidFire',
    duration: 15000,
    description: 'Double fire rate'
  },
  multiShot: {
    type: 'multiShot',
    duration: 15000,
    description: 'Triple projectile spread'
  },
  extraLife: {
    type: 'extraLife',
    duration: -1,
    description: 'Extra life'
  }
}

/**
 * Get power-up configuration by type.
 *
 * @param powerUpType - The power-up type to get configuration for
 * @returns The power-up configuration
 */
export function getPowerUpConfig(powerUpType: PowerUpType): PowerUpEffectConfig {
  return POWER_UP_CONFIGS[powerUpType]
}
