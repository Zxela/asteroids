/**
 * Main Menu State
 *
 * Game state for displaying the main menu.
 * Transitions to Playing when the player starts the game.
 */

import type { GameState } from '../GameStateMachine'

/**
 * MainMenuState - Handles main menu display and input.
 *
 * Responsibilities:
 * - Display menu UI
 * - Handle menu navigation
 * - Trigger game start
 */
export class MainMenuState implements GameState {
  readonly name = 'mainMenu' as const

  /**
   * Called when entering the main menu state.
   * Show menu UI and enable menu input.
   */
  onEnter(): void {
    // Show main menu UI - will be implemented in Task 4.3
  }

  /**
   * Update menu state.
   * @param _deltaTime - Time elapsed since last update (unused in menu)
   */
  onUpdate(_deltaTime: number): void {
    // Handle menu input - will be implemented in Task 4.3
  }

  /**
   * Called when exiting the main menu state.
   * Hide menu UI.
   */
  onExit(): void {
    // Hide main menu UI
  }
}
