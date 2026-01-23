/**
 * Playing State
 *
 * Active gameplay state where the game loop runs.
 * Transitions to Paused on pause, GameOver on player death.
 */

import type { GameState } from '../GameStateMachine'

/**
 * PlayingState - Handles active gameplay.
 *
 * Responsibilities:
 * - Run all game systems
 * - Process player input
 * - Update game world
 */
export class PlayingState implements GameState {
  readonly name = 'playing' as const

  /**
   * Called when entering the playing state.
   * Initialize game systems and show HUD.
   */
  onEnter(): void {
    // Start/resume game systems - will be connected to Game class
  }

  /**
   * Update gameplay.
   * @param _deltaTime - Time elapsed since last update
   */
  onUpdate(_deltaTime: number): void {
    // Update all game systems - will be connected to Game class
  }

  /**
   * Called when exiting the playing state.
   * Pause game systems if going to pause, cleanup if going to game over.
   */
  onExit(): void {
    // Pause/stop game systems
  }
}
