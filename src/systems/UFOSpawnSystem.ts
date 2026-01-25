/**
 * UFO Spawn System
 *
 * Handles periodic UFO spawning during gameplay.
 *
 * Responsibilities:
 * - Track time since last UFO spawn
 * - Spawn UFO every 20-30 seconds (random interval)
 * - Select UFO size based on player score
 * - Limit to one UFO on screen at a time
 *
 * Spawn Rules:
 * - First UFO spawns after 15-20 seconds of gameplay
 * - Subsequent UFOs spawn 20-30 seconds after previous destroyed
 * - UFO size based on score (higher score = more small UFOs)
 * - Only one UFO active at a time
 */

import { Player } from '../components'
import { UFO } from '../components/UFO'
import type { AudioManager } from '../audio/AudioManager'
import type { ComponentClass, System, World } from '../ecs/types'
import { createUFO, getUFOSizeForScore } from '../entities/createUFO'

// Type assertions for component classes
const UFOClass = UFO as unknown as ComponentClass<UFO>
const PlayerClass = Player as unknown as ComponentClass<Player>

/** Minimum time between UFO spawns (milliseconds) */
const MIN_SPAWN_INTERVAL = 20000 // 20 seconds

/** Maximum time between UFO spawns (milliseconds) */
const MAX_SPAWN_INTERVAL = 30000 // 30 seconds

/** Initial delay before first UFO spawn (milliseconds) */
const INITIAL_SPAWN_DELAY_MIN = 15000 // 15 seconds

/** Initial delay before first UFO spawn (milliseconds) */
const INITIAL_SPAWN_DELAY_MAX = 20000 // 20 seconds

/** Warning sound starts this many ms before UFO spawns */
const WARNING_LEAD_TIME = 2000 // 2 seconds before spawn

/** Initial warning beat interval (slowest) */
const WARNING_INITIAL_INTERVAL = 600 // ms

/** Final warning beat interval (fastest, just before spawn) */
const WARNING_FINAL_INTERVAL = 150 // ms

/**
 * UFO spawned event.
 */
export interface UFOSpawnedEvent {
  type: 'ufoSpawned'
  timestamp: number
  data: {
    ufoSize: 'large' | 'small'
  }
}

/**
 * UFOSpawnSystem - handles periodic UFO spawning during gameplay.
 *
 * @example
 * ```typescript
 * const ufoSpawnSystem = new UFOSpawnSystem()
 * world.registerSystem(ufoSpawnSystem)
 *
 * // In game loop
 * ufoSpawnSystem.update(world, deltaTime)
 * const events = ufoSpawnSystem.getEvents()
 * ```
 */
export class UFOSpawnSystem implements System {
  private events: UFOSpawnedEvent[] = []
  private spawnTimer: number
  private audioManager: AudioManager | null = null

  /** Warning state tracking */
  private warningActive = false
  private warningSoundTimer = 0
  private warningElapsed = 0

  constructor(audioManager?: AudioManager | null) {
    // Set initial spawn delay
    this.spawnTimer = this.getInitialDelay()
    this.audioManager = audioManager ?? null
  }

  /**
   * Set the audio manager for warning sounds.
   */
  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager
  }

  /**
   * Updates the spawn timer and spawns UFO when ready.
   *
   * @param world - The ECS world
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    // Check if a UFO already exists
    const existingUFOs = world.query(UFOClass)
    if (existingUFOs.length > 0) {
      // Reset warning state while UFO is active
      this.warningActive = false
      this.warningElapsed = 0
      return
    }

    // Update spawn timer
    this.spawnTimer -= deltaTime

    // Check if we should start warning sounds
    if (this.spawnTimer <= WARNING_LEAD_TIME && !this.warningActive) {
      this.warningActive = true
      this.warningElapsed = 0
      this.warningSoundTimer = 0
      // Play first warning immediately
      this.playWarningSound()
    }

    // Update warning sounds if active
    if (this.warningActive) {
      this.updateWarning(deltaTime)
    }

    if (this.spawnTimer <= 0) {
      // Stop warning sounds
      this.warningActive = false
      this.warningElapsed = 0

      // Get player score for UFO size selection
      const playerScore = this.getPlayerScore(world)

      // Determine UFO size
      const ufoSize = getUFOSizeForScore(playerScore)

      // Spawn UFO
      createUFO(world, { size: ufoSize })

      // Emit spawn event
      this.events.push({
        type: 'ufoSpawned',
        timestamp: Date.now(),
        data: { ufoSize }
      })

      // Reset timer for next spawn
      this.spawnTimer = this.getSpawnInterval()
    }
  }

  /**
   * Update warning sound timing.
   * Beat interval decreases as UFO spawn approaches.
   */
  private updateWarning(deltaTime: number): void {
    this.warningElapsed += deltaTime
    this.warningSoundTimer += deltaTime

    // Calculate current interval (interpolate from slow to fast)
    const progress = Math.min(this.warningElapsed / WARNING_LEAD_TIME, 1)
    const currentInterval =
      WARNING_INITIAL_INTERVAL + (WARNING_FINAL_INTERVAL - WARNING_INITIAL_INTERVAL) * progress

    // Play warning sound at current interval
    if (this.warningSoundTimer >= currentInterval) {
      this.playWarningSound()
      this.warningSoundTimer = 0
    }
  }

  /**
   * Play the UFO warning sound.
   */
  private playWarningSound(): void {
    if (this.audioManager) {
      this.audioManager.playSound('ufoWarning', { volume: 0.6 })
    }
  }

  /**
   * Gets the player's current score.
   */
  private getPlayerScore(world: World): number {
    const players = world.query(PlayerClass)
    if (players.length === 0 || players[0] === undefined) {
      return 0
    }

    const player = world.getComponent<Player>(players[0], PlayerClass)
    return player?.score ?? 0
  }

  /**
   * Calculates initial spawn delay.
   */
  private getInitialDelay(): number {
    return (
      INITIAL_SPAWN_DELAY_MIN + Math.random() * (INITIAL_SPAWN_DELAY_MAX - INITIAL_SPAWN_DELAY_MIN)
    )
  }

  /**
   * Calculates spawn interval for subsequent UFOs.
   */
  private getSpawnInterval(): number {
    return MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL)
  }

  /**
   * Resets the spawn system (for new game).
   */
  reset(): void {
    this.spawnTimer = this.getInitialDelay()
    this.events = []
    this.warningActive = false
    this.warningElapsed = 0
    this.warningSoundTimer = 0
  }

  /**
   * Gets and clears all pending events.
   *
   * @returns Array of UFO spawn events
   */
  getEvents(): UFOSpawnedEvent[] {
    const pendingEvents = [...this.events]
    this.events = []
    return pendingEvents
  }
}
