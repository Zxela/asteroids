/**
 * Wave System
 *
 * Manages wave progression and asteroid spawning.
 * Spawns asteroids from screen edges with randomized trajectories.
 *
 * Wave formula: 3 + (wave - 1) * 2 asteroids per wave
 * Speed multiplier: min(1 + (wave - 1) * 0.05, 2.0)
 * Boss waves: Every 5 waves (5, 10, 15, ...)
 */

import { Vector3 } from 'three'
import { Asteroid } from '../components/Asteroid'
import { gameConfig } from '../config'
import { componentClass } from '../ecs/types'
import type { System, World } from '../ecs/types'
import { createAsteroid } from '../entities/createAsteroid'
import type { AsteroidSize, BossDefeatedEvent, WaveProgressedEvent } from '../types'
import { randomInt, randomRange } from '../utils/random'

// Type assertion for component class to work with ECS type system
// Runtime behavior is correct; this bridges TypeScript's stricter type checking
const AsteroidClass = componentClass(Asteroid)

const { halfWidth: SCREEN_HALF_WIDTH, halfHeight: SCREEN_HALF_HEIGHT } = gameConfig.worldBounds

/** Distance beyond screen edge where asteroids spawn */
const SPAWN_OFFSET = 50

/**
 * Wave System - manages wave progression and asteroid spawning.
 *
 * The system tracks the current wave, spawns asteroids at the start of each wave,
 * and handles wave transitions when all asteroids are destroyed.
 *
 * @example
 * ```typescript
 * const world = new World()
 * const waveSystem = new WaveSystem()
 * world.registerSystem(waveSystem)
 * // Asteroids will spawn on first update
 * ```
 */
export class WaveSystem implements System {
  private currentWave = 1
  private asteroidsDestroyedThisWave = 0
  private targetAsteroids: number
  private transitionDelay = 0
  private transitioning = false
  private hasSpawnedThisWave = false
  private events: WaveProgressedEvent[] = []
  private bossDefeatedEvents: BossDefeatedEvent[] = []
  private isBossWaveActive = false

  constructor() {
    this.targetAsteroids = this.calculateAsteroidCount(1)
  }

  /**
   * Set boss defeated events from BossHealthSystem.
   * Called each frame with events from the boss health system.
   *
   * @param events - Array of boss defeated events to process
   */
  setBossDefeatedEvents(events: BossDefeatedEvent[]): void {
    this.bossDefeatedEvents = events
  }

  /**
   * Sets whether the current wave is a boss wave.
   * Used to skip asteroid checks during boss encounters.
   *
   * @param active - True if boss wave is active
   */
  setBossWaveActive(active: boolean): void {
    this.isBossWaveActive = active
  }

  /**
   * Updates the wave system each frame.
   *
   * Handles:
   * - Wave transition delay countdown
   * - Initial asteroid spawning
   * - Detecting when all asteroids are destroyed
   * - Boss defeat wave continuation
   *
   * @param world - The ECS world
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    // Process boss defeated events - triggers wave transition
    if (this.bossDefeatedEvents.length > 0) {
      this.handleBossDefeated()
      this.bossDefeatedEvents = []
    }

    // Handle wave transition delay
    if (this.transitioning) {
      this.transitionDelay -= deltaTime
      if (this.transitionDelay <= 0) {
        this.startNextWave(world)
        this.transitioning = false
        this.isBossWaveActive = false
      }
      return
    }

    // Skip asteroid spawning/checking during boss wave
    if (this.isBossWaveActive) {
      return
    }

    // Query asteroid count
    const asteroids = world.query(AsteroidClass)

    // Spawn initial wave asteroids (only on first update of new wave)
    if (!this.hasSpawnedThisWave) {
      this.spawnWaveAsteroids(world)
      this.hasSpawnedThisWave = true
      return
    }

    // Check if all asteroids destroyed
    if (asteroids.length === 0 && this.asteroidsDestroyedThisWave > 0) {
      this.beginWaveTransition()
    }
  }

  /**
   * Handles boss defeat by starting wave transition.
   * Called when a bossDefeated event is received.
   */
  private handleBossDefeated(): void {
    // Start the 3-second wave transition delay
    this.beginWaveTransition()
    // Mark boss wave as no longer active (will be cleared after transition)
  }

  /**
   * Spawns asteroids for the current wave.
   *
   * @param world - The ECS world
   */
  private spawnWaveAsteroids(world: World): void {
    const asteroidCount = this.calculateAsteroidCount(this.currentWave)

    // Spawn asteroids from screen edges with random trajectories
    for (let i = 0; i < asteroidCount; i++) {
      const spawn = this.getRandomScreenEdgeSpawn()
      const size = this.getAsteroidSizeForWave(this.currentWave)

      createAsteroid(world, spawn, size)
    }
  }

  /**
   * Gets a random spawn position at the screen edge.
   * Asteroids spawn 50 units beyond the visible screen area.
   *
   * @returns Position at screen edge
   */
  private getRandomScreenEdgeSpawn(): Vector3 {
    const edge = randomInt(0, 3) // 0=top, 1=right, 2=bottom, 3=left

    let x: number
    let y: number

    switch (edge) {
      case 0: // Top
        x = randomRange(-SCREEN_HALF_WIDTH, SCREEN_HALF_WIDTH)
        y = SCREEN_HALF_HEIGHT + SPAWN_OFFSET
        break
      case 1: // Right
        x = SCREEN_HALF_WIDTH + SPAWN_OFFSET
        y = randomRange(-SCREEN_HALF_HEIGHT, SCREEN_HALF_HEIGHT)
        break
      case 2: // Bottom
        x = randomRange(-SCREEN_HALF_WIDTH, SCREEN_HALF_WIDTH)
        y = -SCREEN_HALF_HEIGHT - SPAWN_OFFSET
        break
      case 3: // Left
        x = -SCREEN_HALF_WIDTH - SPAWN_OFFSET
        y = randomRange(-SCREEN_HALF_HEIGHT, SCREEN_HALF_HEIGHT)
        break
      default:
        x = 0
        y = SCREEN_HALF_HEIGHT + SPAWN_OFFSET
    }

    return new Vector3(x, y, 0)
  }

  /**
   * Calculates the number of asteroids for a given wave.
   * Formula: 3 + (wave - 1) * 2
   *
   * @param wave - Wave number
   * @returns Number of asteroids to spawn
   */
  calculateAsteroidCount(wave: number): number {
    return gameConfig.wave.baseAsteroidCount + (wave - 1) * gameConfig.wave.asteroidIncrement
  }

  /**
   * Calculates the speed multiplier for a given wave.
   * Formula: min(1 + (wave - 1) * 0.05, 2.0)
   *
   * @param wave - Wave number
   * @returns Speed multiplier (capped at 2.0)
   */
  calculateSpeedMultiplier(wave: number): number {
    const multiplier = 1 + (wave - 1) * (gameConfig.wave.speedMultiplier - 1)
    return Math.min(multiplier, 2.0)
  }

  /**
   * Determines asteroid size based on wave number.
   * Early waves spawn only large asteroids.
   * Later waves mix sizes for variety.
   *
   * @param wave - Current wave number
   * @returns Asteroid size to spawn
   */
  private getAsteroidSizeForWave(wave: number): AsteroidSize {
    // Early waves have only large asteroids
    if (wave <= 3) {
      return 'large'
    }

    // Mid waves mix large and medium
    if (wave <= 6) {
      const rand = Math.random()
      return rand < 0.5 ? 'large' : 'medium'
    }

    // Later waves mix all sizes
    const rand = Math.random()
    if (rand < 0.33) return 'large'
    if (rand < 0.66) return 'medium'
    return 'small'
  }

  /**
   * Begins the wave transition period.
   * There is a delay before the next wave starts.
   */
  private beginWaveTransition(): void {
    this.transitioning = true
    this.transitionDelay = gameConfig.gameplay.waveTransitionDelay
  }

  /**
   * Starts the next wave.
   *
   * @param world - The ECS world
   */
  private startNextWave(_world: World): void {
    const previousWave = this.currentWave
    this.currentWave++
    this.asteroidsDestroyedThisWave = 0
    this.targetAsteroids = this.calculateAsteroidCount(this.currentWave)
    this.hasSpawnedThisWave = false

    // Emit waveProgressed event
    const event: WaveProgressedEvent = {
      type: 'waveProgressed',
      timestamp: Date.now(),
      data: {
        previousWave,
        newWave: this.currentWave,
        asteroidCount: this.targetAsteroids,
        speedMultiplier: this.calculateSpeedMultiplier(this.currentWave),
        isBossWave: this.isBossWave(this.currentWave)
      }
    }
    this.events.push(event)

    // Spawning will happen on next update
  }

  /**
   * Gets the current wave number.
   *
   * @returns Current wave number
   */
  getCurrentWave(): number {
    return this.currentWave
  }

  /**
   * Gets the target asteroid count for the current wave.
   *
   * @returns Number of asteroids to destroy to complete the wave
   */
  getAsteroidsRemaining(): number {
    return this.targetAsteroids
  }

  /**
   * Records an asteroid destruction.
   * Called when an asteroid is destroyed to track wave progress.
   */
  recordAsteroidDestruction(): void {
    this.asteroidsDestroyedThisWave++
  }

  /**
   * Checks if the wave is currently transitioning.
   *
   * @returns True if in wave transition period
   */
  isWaveTransitioning(): boolean {
    return this.transitioning
  }

  /**
   * Checks if a given wave is a boss wave.
   * Boss waves occur at intervals defined in config (every 5 waves by default).
   *
   * @param wave - Wave number to check
   * @returns True if the wave is a boss wave
   */
  isBossWave(wave: number): boolean {
    return wave % gameConfig.wave.bossWaveInterval === 0
  }

  /**
   * Gets the speed multiplier for the current wave.
   *
   * @returns Current speed multiplier
   */
  getSpeedMultiplier(): number {
    return this.calculateSpeedMultiplier(this.currentWave)
  }

  /**
   * Gets and clears all pending events.
   * Events are cleared after being retrieved to prevent double-processing.
   *
   * @returns Array of wave progression events
   */
  getEvents(): WaveProgressedEvent[] {
    const pendingEvents = [...this.events]
    this.events = []
    return pendingEvents
  }
}
