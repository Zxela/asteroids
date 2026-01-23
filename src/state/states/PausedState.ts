/**
 * Paused State
 *
 * Game state for pause overlay during gameplay.
 * Transitions to Playing on resume, MainMenu on return to menu.
 */

import type { GameState } from '../GameStateMachine'

/**
 * PausedState - Handles pause menu and frozen gameplay.
 *
 * Responsibilities:
 * - Display pause menu
 * - Freeze game systems
 * - Handle resume/quit options
 */
export class PausedState implements GameState {
  readonly name = 'paused' as const

  /**
   * Called when entering the paused state.
   * Show pause menu and freeze game.
   */
  onEnter(): void {
    // Show pause menu - will be implemented in Task 4.4
  }

  /**
   * Update pause state.
   * @param _deltaTime - Time elapsed (game is frozen, minimal updates)
   */
  onUpdate(_deltaTime: number): void {
    // Handle pause menu input - will be implemented in Task 4.4
  }

  /**
   * Called when exiting the paused state.
   * Hide pause menu.
   */
  onExit(): void {
    // Hide pause menu
  }
}
