/**
 * Configuration Module
 *
 * Centralized game configuration constants for physics, gameplay, audio, and visual settings.
 * All values match Design Doc specifications for easy reference and tuning.
 */

// ============================================
// Game Configuration Exports
// ============================================
export { gameConfig } from './gameConfig'
export type {
  GameConfig,
  PhysicsConfig,
  GameplayConfig,
  ScoringConfig,
  WaveConfig,
  PowerUpsConfig,
  ShieldPowerUpConfig,
  RapidFirePowerUpConfig,
  MultiShotPowerUpConfig,
  VisualConfig,
  PerformanceConfig,
  WorldBoundsConfig
} from './gameConfig'

// ============================================
// Weapon Configuration Exports
// ============================================
export { WEAPON_CONFIGS, WEAPON_ORDER, getNextWeapon, getPreviousWeapon } from './weaponConfig'
export type { WeaponTypeConfig } from './weaponConfig'

// ============================================
// Audio Configuration Exports
// ============================================
export { audioConfig } from './audioConfig'
export type {
  AudioConfig,
  AudioDefinition,
  SfxConfig,
  MusicConfig
} from './audioConfig'

// ============================================
// Power-up Configuration Exports
// ============================================
export { POWER_UP_CONFIGS, getPowerUpConfig } from './powerUpConfig'
export type { PowerUpEffectConfig } from './powerUpConfig'

// ============================================
// Boss AI Configuration Exports
// ============================================
export {
  BOSS_AI_CONFIG,
  getFirstPattern,
  getNextPattern,
  getPhaseModifier
} from './bossConfig'
export type {
  BossAIConfig,
  PhaseModifier,
  DestroyerConfig,
  CarrierConfig,
  PatternConfig,
  ChargePatternConfig,
  SprayPatternConfig,
  SummonPatternConfig,
  RetreatPatternConfig
} from './bossConfig'
