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
  PerformanceConfig
} from './gameConfig'

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
