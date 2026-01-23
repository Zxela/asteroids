/**
 * State Module
 *
 * Game state machine and state implementations for game flow management.
 * Manages transitions between: Loading -> MainMenu -> Playing -> Paused -> GameOver
 */

// Core state machine
export {
  GameStateMachine,
  type GameState,
  type GameStateName,
  type GameEvent
} from './GameStateMachine'

// State implementations
export { LoadingState } from './states/LoadingState'
export { MainMenuState } from './states/MainMenuState'
export { PlayingState } from './states/PlayingState'
export { PausedState } from './states/PausedState'
export { GameOverState } from './states/GameOverState'
