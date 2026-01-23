/**
 * Loading State
 *
 * Initial game state for asset loading phase.
 * Transitions to MainMenu when loading is complete.
 */

import type { GameState } from '../GameStateMachine'

/**
 * LoadingState - Handles asset loading phase.
 *
 * Responsibilities:
 * - Display loading progress
 * - Track asset loading completion
 * - Signal when ready to transition
 */
export class LoadingState implements GameState {
  readonly name = 'loading' as const

  /**
   * Called when entering the loading state.
   * Initialize loading UI and start asset loading.
   */
  onEnter(): void {
    // Loading UI initialization will be added in Task 4.3
  }

  /**
   * Update loading progress.
   * @param _deltaTime - Time elapsed since last update (unused in loading)
   */
  onUpdate(_deltaTime: number): void {
    // Track loading progress - will be implemented with asset loading
  }

  /**
   * Called when exiting the loading state.
   * Clean up loading UI.
   */
  onExit(): void {
    // Hide loading UI
  }
}
