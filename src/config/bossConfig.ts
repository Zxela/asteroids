/**
 * Boss AI Configuration
 *
 * Configuration for boss attack patterns and phase modifiers.
 *
 * Boss Types:
 * - Destroyer: Aggressive boss with Charge and Spray patterns
 * - Carrier: Support boss with Summon and Retreat patterns
 *
 * Phase Modifiers:
 * - Phase 1 (>50% health): 1.0x multiplier
 * - Phase 2 (26-50% health): 1.5x multiplier
 * - Phase 3 (<=25% health): 2.0x multiplier
 *
 * Pattern Duration: 3000ms (3 seconds) per pattern
 */

import type { AttackPattern, BossType } from '../types/components'

/**
 * Pattern configuration for a boss attack pattern.
 */
export interface PatternConfig {
  /** Pattern duration in milliseconds */
  duration: number
  /** Base movement speed (units/second) */
  speed: number
  /** Description of pattern behavior */
  description: string
}

/**
 * Destroyer Charge pattern configuration.
 */
export interface ChargePatternConfig extends PatternConfig {
  /** Damage multipliers per phase [Phase1, Phase2, Phase3] */
  damageMultipliers: [number, number, number]
}

/**
 * Destroyer Spray pattern configuration.
 */
export interface SprayPatternConfig extends PatternConfig {
  /** Projectile counts per phase [Phase1, Phase2, Phase3] */
  projectileCounts: [number, number, number]
  /** Fire rate in milliseconds per phase [Phase1, Phase2, Phase3] */
  fireRates: [number, number, number]
  /** Spread angle in radians */
  spreadAngle: number
}

/**
 * Carrier Summon pattern configuration.
 */
export interface SummonPatternConfig extends PatternConfig {
  /** Asteroid spawn counts per phase [Phase1, Phase2, Phase3] */
  spawnCounts: [number, number, number]
  /** Spawn rate in milliseconds */
  spawnRate: number
}

/**
 * Carrier Retreat pattern configuration.
 */
export interface RetreatPatternConfig extends PatternConfig {
  /** Homing projectile counts per phase [Phase1, Phase2, Phase3] */
  projectileCounts: [number, number, number]
  /** Fire rate in milliseconds per phase [Phase1, Phase2, Phase3] */
  fireRates: [number, number, number]
}

/**
 * Destroyer boss AI configuration.
 */
export interface DestroyerConfig {
  /** Base movement speed (units/second) */
  baseSpeed: number
  /** Detection range for engaging player */
  detectionRange: number
  /** Attack patterns */
  patterns: {
    charge: ChargePatternConfig
    spray: SprayPatternConfig
  }
  /** Pattern order for alternation */
  patternOrder: ['charge', 'spray']
}

/**
 * Carrier boss AI configuration.
 */
export interface CarrierConfig {
  /** Base movement speed (units/second) */
  baseSpeed: number
  /** Detection range for engaging player */
  detectionRange: number
  /** Attack patterns */
  patterns: {
    summon: SummonPatternConfig
    retreat: RetreatPatternConfig
  }
  /** Pattern order for alternation */
  patternOrder: ['summon', 'retreat']
}

/**
 * Boss AI configuration interface.
 */
export interface BossAIConfig {
  /** Destroyer boss configuration */
  destroyer: DestroyerConfig
  /** Carrier boss configuration */
  carrier: CarrierConfig
  /** Default pattern duration in milliseconds */
  patternDuration: number
  /** Phase modifiers (indexed by phase - 1) */
  phaseModifiers: [PhaseModifier, PhaseModifier, PhaseModifier]
}

/**
 * Phase modifier configuration.
 */
export interface PhaseModifier {
  /** Speed multiplier */
  speedMult: number
  /** Fire rate multiplier (lower = faster) */
  fireRateMult: number
  /** Damage multiplier */
  damageMult: number
}

/**
 * Boss AI configuration with pattern definitions.
 *
 * Destroyer Boss:
 * - Charge: Move toward player at high speed, attempt collision
 * - Spray: Strafe around player while firing spread projectiles
 *
 * Carrier Boss:
 * - Summon: Stay stationary, spawn asteroid minions
 * - Retreat: Move away from player while firing homing projectiles
 *
 * Phase Modifiers:
 * - Phase 1: 1.0x speed, 1.0x fire rate, 1.0x damage
 * - Phase 2: 1.5x speed, 1.5x fire rate, 1.5x damage
 * - Phase 3: 2.0x speed, 2.0x fire rate, 2.0x damage
 */
export const BOSS_AI_CONFIG: BossAIConfig = {
  destroyer: {
    baseSpeed: 100,
    detectionRange: 800,
    patterns: {
      charge: {
        duration: 3000,
        speed: 100,
        description: 'Move toward player, attempt collision',
        damageMultipliers: [1.0, 1.5, 2.0]
      },
      spray: {
        duration: 3000,
        speed: 80,
        description: 'Circle player, fire spread projectiles',
        projectileCounts: [5, 7, 9],
        fireRates: [500, 300, 200],
        spreadAngle: Math.PI / 2 // 90 degrees
      }
    },
    patternOrder: ['charge', 'spray']
  },
  carrier: {
    baseSpeed: 80,
    detectionRange: 800,
    patterns: {
      summon: {
        duration: 3000,
        speed: 0,
        description: 'Stay stationary, spawn asteroid minions',
        spawnCounts: [2, 3, 4],
        spawnRate: 1000
      },
      retreat: {
        duration: 3000,
        speed: 120,
        description: 'Move away from player, fire homing projectiles',
        projectileCounts: [2, 3, 4],
        fireRates: [800, 600, 400]
      }
    },
    patternOrder: ['summon', 'retreat']
  },
  patternDuration: 3000,
  phaseModifiers: [
    { speedMult: 1.0, fireRateMult: 1.0, damageMult: 1.0 }, // Phase 1
    { speedMult: 1.5, fireRateMult: 1.5, damageMult: 1.5 }, // Phase 2
    { speedMult: 2.0, fireRateMult: 2.0, damageMult: 2.0 } // Phase 3
  ]
}

/**
 * Gets the first attack pattern for a boss type.
 *
 * @param bossType - Type of boss
 * @returns First attack pattern name
 */
export function getFirstPattern(bossType: BossType): AttackPattern {
  if (bossType === 'destroyer') {
    return 'charge'
  }
  return 'summon'
}

/**
 * Gets the next attack pattern in the alternation sequence.
 *
 * @param bossType - Type of boss
 * @param currentPattern - Current attack pattern
 * @returns Next attack pattern name
 */
export function getNextPattern(bossType: BossType, currentPattern: AttackPattern): AttackPattern {
  if (bossType === 'destroyer') {
    // Destroyer: charge <-> spray
    if (currentPattern === 'charge') return 'spray'
    if (currentPattern === 'spray') return 'charge'
    return 'charge' // Default for idle or invalid
  }
  // Carrier: summon <-> retreat
  if (currentPattern === 'summon') return 'retreat'
  if (currentPattern === 'retreat') return 'summon'
  return 'summon' // Default for idle or invalid
}

/**
 * Gets the phase modifier for a given phase.
 *
 * @param phase - Boss phase (1, 2, or 3)
 * @returns Phase modifier configuration
 */
export function getPhaseModifier(phase: number): PhaseModifier {
  const index = Math.max(0, Math.min(2, phase - 1)) as 0 | 1 | 2
  return BOSS_AI_CONFIG.phaseModifiers[index]
}
