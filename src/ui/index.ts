/**
 * UI Module
 *
 * User interface components for the game.
 * Includes HUD, menus, and leaderboard display.
 */

export { HUD } from './HUD'
export { GameOverScreen } from './GameOverScreen'
export type {
  LeaderboardStorage as LeaderboardStorageType,
  GameStateMachineInterface
} from './GameOverScreen'
export { MainMenu } from './MainMenu'
export { SettingsPanel } from './SettingsPanel'
export { PauseMenu } from './PauseMenu'
export { Leaderboard, type LeaderboardStorageInterface } from './Leaderboard'
