/**
 * Player Component
 *
 * Player-specific state including lives and score.
 */

import type { PlayerComponent } from '../types/components'

/**
 * Player component class - tracks player lives and score.
 *
 * @example
 * ```typescript
 * const player = new Player(3)  // 3 lives
 * player.addScore(100)  // score becomes 100
 * player.loseLife()  // lives becomes 2
 * ```
 */
export class Player implements PlayerComponent {
  readonly type = 'player' as const

  /** Remaining lives */
  lives: number

  /** Current score */
  score: number

  /**
   * Create a Player component.
   *
   * @param lives - Initial lives (default: 3)
   */
  constructor(lives = 3) {
    this.lives = lives
    this.score = 0
  }

  /**
   * Add points to the player's score.
   *
   * @param points - Points to add
   */
  addScore(points: number): void {
    this.score += points
  }

  /**
   * Decrease player lives by one.
   * Lives cannot go below zero.
   */
  loseLife(): void {
    this.lives = Math.max(0, this.lives - 1)
  }

  /**
   * Add a bonus life to the player.
   */
  addLife(): void {
    this.lives += 1
  }
}
