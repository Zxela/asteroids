/**
 * Game Over State
 *
 * End screen state displayed when the player loses all lives.
 * Transitions to Playing on restart, MainMenu on return to menu.
 */

import type { GameState } from '../GameStateMachine'

/**
 * GameOverState - Handles game over screen display.
 *
 * Responsibilities:
 * - Display final score
 * - Allow name entry for leaderboard
 * - Handle restart/quit options
 */
export class GameOverState implements GameState {
  readonly name = 'gameOver' as const

  /**
   * Called when entering the game over state.
   * Show game over screen with final score.
   */
  onEnter(): void {
    // Show game over screen - will be implemented in Task 4.5
  }

  /**
   * Update game over state.
   * @param _deltaTime - Time elapsed since last update
   */
  onUpdate(_deltaTime: number): void {
    // Handle game over screen input - will be implemented in Task 4.5
  }

  /**
   * Called when exiting the game over state.
   * Hide game over screen and cleanup.
   */
  onExit(): void {
    // Hide game over screen
  }
}
