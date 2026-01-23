/**
 * ScoreSystem - Handles score tracking and updates
 *
 * Listens for asteroidDestroyed events and updates the player score.
 * Points are awarded based on asteroid size: Small (100), Medium (50), Large (25).
 * Emits scoreChanged events for HUD updates.
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/ScoreSystem
 */

import { Player } from '../components/Player'
import type { ComponentClass, System, World } from '../ecs/types'
import type {
  AsteroidDestroyedEvent,
  AsteroidSize,
  BossDefeatedEvent,
  ScoreChangedEvent
} from '../types'

// Type assertion for component class to work with ECS type system
const PlayerClass = Player as unknown as ComponentClass<Player>

/**
 * System for tracking and updating player score.
 *
 * Processes asteroidDestroyed events and adds points to the player score.
 * Emits scoreChanged events that can be consumed by UI systems.
 *
 * @example
 * ```typescript
 * const scoreSystem = new ScoreSystem()
 * world.registerSystem(scoreSystem)
 *
 * // Each frame, pass destroyed asteroid events
 * scoreSystem.setAsteroidDestroyedEvents(destructionEvents)
 * scoreSystem.update(world, deltaTime)
 *
 * // Check for score change events
 * const events = scoreSystem.getEvents()
 * ```
 */
export class ScoreSystem implements System {
  /** System type identifier */
  readonly systemType = 'score' as const

  /** Events emitted during the current frame */
  private events: ScoreChangedEvent[] = []

  /** Asteroid destroyed events to process this frame */
  private asteroidDestroyedEvents: AsteroidDestroyedEvent[] = []

  /** Boss defeated events to process this frame */
  private bossDefeatedEvents: BossDefeatedEvent[] = []

  /**
   * Set asteroid destroyed events from AsteroidDestructionSystem.
   * Called each frame with events from the destruction system.
   *
   * @param events - Array of asteroid destroyed events to process
   */
  setAsteroidDestroyedEvents(events: AsteroidDestroyedEvent[]): void {
    this.asteroidDestroyedEvents = events
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
   * Update score based on asteroid destruction events.
   *
   * Processes each asteroid destroyed event, updates the player score,
   * and emits scoreChanged events.
   *
   * @param world - The ECS world containing entities
   * @param _deltaTime - Time since last frame in milliseconds (unused)
   */
  update(world: World, _deltaTime: number): void {
    // Clear events from previous frame
    this.events = []

    // Query for player entity
    const playerEntities = world.query(PlayerClass)

    if (playerEntities.length === 0) {
      // Clear processed events and return
      this.asteroidDestroyedEvents = []
      this.bossDefeatedEvents = []
      return
    }

    // Get first player (single-player game)
    const playerId = playerEntities[0]
    if (playerId === undefined) {
      // Clear processed events and return
      this.asteroidDestroyedEvents = []
      this.bossDefeatedEvents = []
      return
    }
    const player = world.getComponent(playerId, PlayerClass)

    if (!player) {
      // Clear processed events and return
      this.asteroidDestroyedEvents = []
      this.bossDefeatedEvents = []
      return
    }

    // Process each asteroid destruction event
    for (const event of this.asteroidDestroyedEvents) {
      const pointsAwarded = event.data.points
      const previousScore = player.score

      // Update player score
      player.addScore(pointsAwarded)

      // Emit scoreChanged event
      const scoreEvent: ScoreChangedEvent = {
        type: 'scoreChanged',
        timestamp: Date.now(),
        data: {
          previousScore,
          newScore: player.score,
          delta: pointsAwarded,
          reason: this.getScoreReason(event.data.size)
        }
      }
      this.events.push(scoreEvent)
    }

    // Process each boss defeated event
    for (const event of this.bossDefeatedEvents) {
      const bonusScore = event.data.bonusScore
      const previousScore = player.score

      // Update player score
      player.addScore(bonusScore)

      // Emit scoreChanged event with 'boss' reason
      const scoreEvent: ScoreChangedEvent = {
        type: 'scoreChanged',
        timestamp: Date.now(),
        data: {
          previousScore,
          newScore: player.score,
          delta: bonusScore,
          reason: 'boss'
        }
      }
      this.events.push(scoreEvent)
    }

    // Clear processed events
    this.asteroidDestroyedEvents = []
    this.bossDefeatedEvents = []
  }

  /**
   * Get the reason string for a score change based on asteroid size.
   *
   * @param size - The size of the destroyed asteroid
   * @returns Human-readable reason for the score change
   */
  private getScoreReason(size: AsteroidSize): string {
    switch (size) {
      case 'small':
        return 'Destroyed small asteroid'
      case 'medium':
        return 'Destroyed medium asteroid'
      case 'large':
        return 'Destroyed large asteroid'
      default:
        return 'Asteroid destroyed'
    }
  }

  /**
   * Get events emitted during the current frame.
   *
   * Events are cleared at the start of each update cycle.
   *
   * @returns Array of score change events
   */
  getEvents(): ScoreChangedEvent[] {
    return this.events
  }
}
