/**
 * UFO Component
 *
 * UFO-specific properties and AI state management.
 * Tracks UFO size type and shooting behavior.
 *
 * UFO Types:
 * - Large: Slower, less accurate shots, 200 points
 * - Small: Faster, more accurate shots, 1000 points
 */

import type { Component } from '../ecs/types'

/**
 * UFO size type - determines speed, accuracy, and points.
 */
export type UFOSize = 'large' | 'small'

/**
 * UFO component interface definition.
 */
export interface UFOComponent extends Component {
  readonly type: 'ufo'
  ufoSize: UFOSize
  shootTimer: number
  points: number
}

/**
 * UFO configuration by size.
 */
export const UFO_CONFIG = {
  large: {
    speed: 80,
    shootInterval: 2000, // 2 seconds between shots
    accuracy: 0.3, // 30% accuracy (more random)
    points: 200,
    colliderRadius: 25
  },
  small: {
    speed: 120,
    shootInterval: 1500, // 1.5 seconds between shots
    accuracy: 0.8, // 80% accuracy (more precise)
    points: 1000,
    colliderRadius: 15
  }
} as const

/**
 * UFO component class - defines UFO behavior state.
 *
 * @example
 * ```typescript
 * const ufo = new UFO('large')
 * ufo.shootTimer -= deltaTime
 * if (ufo.shootTimer <= 0) {
 *   // Fire at player
 *   ufo.shootTimer = UFO_CONFIG[ufo.ufoSize].shootInterval
 * }
 * ```
 */
export class UFO implements UFOComponent {
  readonly type = 'ufo' as const

  /** Size of UFO (large or small) */
  ufoSize: UFOSize

  /** Timer for shooting at player (milliseconds) */
  shootTimer: number

  /** Points awarded when destroyed */
  points: number

  /**
   * Create a UFO component.
   *
   * @param ufoSize - Size of UFO ('large' or 'small')
   * @param shootTimer - Initial shoot timer (default: from config)
   */
  constructor(ufoSize: UFOSize = 'large', shootTimer?: number) {
    this.ufoSize = ufoSize
    this.shootTimer = shootTimer ?? UFO_CONFIG[ufoSize].shootInterval
    this.points = UFO_CONFIG[ufoSize].points
  }
}
