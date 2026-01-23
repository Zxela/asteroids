/**
 * Asteroid Component
 *
 * Asteroid-specific properties including size and point value.
 */

import type { AsteroidComponent, AsteroidSize } from '../types/components'

/**
 * Asteroid component class - asteroid-specific data.
 *
 * @example
 * ```typescript
 * const asteroid = new Asteroid('large', 25)
 * // size: large, points: 25
 * ```
 */
export class Asteroid implements AsteroidComponent {
  readonly type = 'asteroid' as const

  /** Asteroid size category */
  size: AsteroidSize

  /** Score points awarded when destroyed */
  points: number

  /**
   * Create an Asteroid component.
   *
   * @param size - Asteroid size ('large', 'medium', 'small')
   * @param points - Point value when destroyed
   */
  constructor(size: AsteroidSize, points: number) {
    this.size = size
    this.points = points
  }
}
