/**
 * Game State Type Definitions
 *
 * Types for game flow state management, settings, and persistence.
 */

import type { ActivePowerUp, WeaponType } from './components'

// ============================================
// Game Flow State Machine Types
// ============================================

/**
 * Game flow states - the high-level states of the game.
 */
export type GameFlowState = 'loading' | 'mainMenu' | 'playing' | 'paused' | 'gameOver' | 'victory'

/**
 * Game flow events - triggers for state transitions.
 */
export type GameFlowEvent =
  | 'loadComplete'
  | 'startGame'
  | 'pause'
  | 'resume'
  | 'playerDied'
  | 'bossDefeated'
  | 'returnToMenu'
  | 'restart'

/**
 * State transition definition for FSM.
 */
export interface StateTransition {
  from: GameFlowState
  event: GameFlowEvent
  to: GameFlowState
}

// ============================================
// Game State Data Types
// ============================================

/**
 * Runtime game state data - the current state of the game session.
 */
export interface GameStateData {
  currentWave: number
  score: number
  lives: number
  currentWeapon: WeaponType
  activePowerUps: ActivePowerUp[]
  bossActive: boolean
}

/**
 * Initial/default game state values.
 */
export const DEFAULT_GAME_STATE: Readonly<GameStateData> = {
  currentWave: 1,
  score: 0,
  lives: 3,
  currentWeapon: 'single',
  activePowerUps: [],
  bossActive: false
}

// ============================================
// Game Settings Types
// ============================================

/**
 * User-configurable game settings.
 */
export interface GameSettings {
  sfxVolume: number // 0-1 range
  musicVolume: number // 0-1 range
  enableParticles: boolean
}

/**
 * Default game settings values.
 */
export const DEFAULT_GAME_SETTINGS: Readonly<GameSettings> = {
  sfxVolume: 0.7,
  musicVolume: 0.5,
  enableParticles: true
}

// ============================================
// Leaderboard Types
// ============================================

/**
 * Single leaderboard entry.
 */
export interface LeaderboardEntry {
  name: string
  score: number
  wave: number
  date: string // ISO date string
}

/**
 * Leaderboard data structure.
 */
export interface Leaderboard {
  entries: LeaderboardEntry[]
  maxEntries: number
}

/**
 * Default leaderboard values.
 */
export const DEFAULT_LEADERBOARD: Readonly<Leaderboard> = {
  entries: [],
  maxEntries: 10
}

// ============================================
// Input Types
// ============================================

/**
 * Player input actions.
 */
export type InputAction =
  | 'thrust'
  | 'rotateLeft'
  | 'rotateRight'
  | 'fire'
  | 'pause'
  | 'weaponNext'
  | 'weaponPrev'
  | 'weapon1'
  | 'weapon2'
  | 'weapon3'
  | 'weapon4'

/**
 * Input state for current frame.
 */
export interface InputState {
  /** Set of currently active actions */
  actions: Set<InputAction>
  /** Normalized movement vector (-1 to 1 for each axis) */
  movement: {
    x: number // Rotation: -1 left, +1 right
    y: number // Thrust: 0 none, +1 forward
  }
}

// ============================================
// Performance Metrics Types
// ============================================

/**
 * Runtime performance metrics for monitoring.
 */
export interface PerformanceMetrics {
  fps: number
  drawCalls: number
  entityCount: number
  frameTime: number // Milliseconds
  physicsTime: number // Milliseconds
  renderTime: number // Milliseconds
}

// ============================================
// Logging Types
// ============================================

/**
 * Log level for filtering log output.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Structured log entry.
 */
export interface LogEntry {
  timestamp: number
  level: LogLevel
  system: string
  message: string
  data?: Record<string, unknown>
}
