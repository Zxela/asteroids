/**
 * TensionSystem - Classic Asteroids heartbeat tempo system
 *
 * Creates tension through a beat that speeds up as asteroids decrease.
 * Classic Asteroids featured a "thump thump" that got faster as you
 * cleared more asteroids, creating increasing tension.
 *
 * Beat interval formula: max(200ms, 1000ms - (maxAsteroids - currentCount) * 50ms)
 * - More asteroids = slower beat
 * - Fewer asteroids = faster beat (higher tension)
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/TensionSystem
 */

import { Asteroid } from '../components/Asteroid'
import type { AudioManager } from '../audio/AudioManager'
import type { ComponentClass, System, World } from '../ecs/types'

// Type assertion for component class to work with ECS type system
const AsteroidClass = Asteroid as unknown as ComponentClass<Asteroid>

/** Minimum beat interval in milliseconds (fastest tempo) */
const MIN_BEAT_INTERVAL = 200

/** Maximum beat interval in milliseconds (slowest tempo) */
const MAX_BEAT_INTERVAL = 1000

/** Interval decrease per destroyed asteroid */
const INTERVAL_PER_ASTEROID = 50

/** Reference asteroid count for tempo scaling */
const REFERENCE_ASTEROID_COUNT = 16

/**
 * TensionSystem - Creates escalating tension through beat tempo.
 *
 * The classic Asteroids heartbeat that speeds up as you clear asteroids.
 * Creates psychological tension as the player approaches wave completion.
 *
 * @example
 * ```typescript
 * const audioManager = AudioManager.getInstance()
 * const tensionSystem = new TensionSystem(audioManager)
 * world.registerSystem(tensionSystem)
 * ```
 */
export class TensionSystem implements System {
  /** System type identifier */
  readonly systemType = 'tension' as const

  /** Required components (none - this system tracks asteroids globally) */
  readonly requiredComponents: string[] = []

  /** AudioManager for playing beat sounds */
  private audioManager: AudioManager | null

  /** Time accumulator for beat timing */
  private timeSinceLastBeat = 0

  /** Current beat interval based on asteroid count */
  private currentInterval = MAX_BEAT_INTERVAL

  /** Whether the system is active (only during gameplay) */
  private active = true

  /** Alternate beat flag for two-tone heartbeat */
  private beatToggle = false

  /**
   * Create a new TensionSystem.
   *
   * @param audioManager - AudioManager instance for sound playback
   */
  constructor(audioManager: AudioManager | null = null) {
    this.audioManager = audioManager
  }

  /**
   * Update the tension system.
   *
   * Counts asteroids, calculates beat interval, and plays beat sounds
   * at the appropriate tempo.
   *
   * @param world - The ECS world containing entities
   * @param deltaTime - Time since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    if (!this.active) return

    // Count current asteroids
    const asteroids = world.query(AsteroidClass)
    const asteroidCount = asteroids.length

    // If no asteroids, pause the beat (wave transitioning)
    if (asteroidCount === 0) {
      this.timeSinceLastBeat = 0
      return
    }

    // Calculate beat interval based on asteroid count
    // Fewer asteroids = faster beat = more tension
    const destroyedCount = REFERENCE_ASTEROID_COUNT - asteroidCount
    const intervalReduction = Math.max(0, destroyedCount) * INTERVAL_PER_ASTEROID
    this.currentInterval = Math.max(MIN_BEAT_INTERVAL, MAX_BEAT_INTERVAL - intervalReduction)

    // Accumulate time
    this.timeSinceLastBeat += deltaTime

    // Check if it's time for a beat
    if (this.timeSinceLastBeat >= this.currentInterval) {
      this.playBeat()
      this.timeSinceLastBeat = 0
    }
  }

  /**
   * Play the beat sound.
   *
   * Classic Asteroids had two alternating tones for the heartbeat.
   * We alternate pitch slightly to create that effect.
   */
  private playBeat(): void {
    if (!this.audioManager) return

    // Alternate between two slightly different volumes/pitches
    // to create the classic "thump-THUMP" heartbeat effect
    const volume = this.beatToggle ? 0.5 : 0.4
    this.beatToggle = !this.beatToggle

    this.audioManager.playSound('beat', { volume })
  }

  /**
   * Reset the tension system for a new wave.
   * Called when a new wave starts to reset the beat timing.
   */
  resetForNewWave(): void {
    this.timeSinceLastBeat = 0
    this.currentInterval = MAX_BEAT_INTERVAL
    this.beatToggle = false
  }

  /**
   * Set whether the system is active.
   * Should be disabled during menus, paused state, etc.
   *
   * @param active - Whether to enable beat playback
   */
  setActive(active: boolean): void {
    this.active = active
    if (!active) {
      this.timeSinceLastBeat = 0
    }
  }

  /**
   * Get the current beat interval.
   * Useful for debugging or UI display.
   *
   * @returns Current interval in milliseconds
   */
  getCurrentInterval(): number {
    return this.currentInterval
  }

  /**
   * Check if the system is active.
   *
   * @returns True if beat playback is active
   */
  isActive(): boolean {
    return this.active
  }
}
