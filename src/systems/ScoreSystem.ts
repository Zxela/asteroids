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

import type { Player } from '../components/Player'
import { gameConfig } from '../config/gameConfig'
import type { System, World } from '../ecs/types'
import type {
  AsteroidDestroyedEvent,
  AsteroidSize,
  BossDefeatedEvent,
  LivesChangedEvent,
  ScoreChangedEvent
} from '../types'
import { getPlayerEntity } from '../utils/ecs-helpers'

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
/**
 * Event type for bonus life awarded.
 */
export interface BonusLifeEvent {
  type: 'bonusLife'
  newLives: number
  scoreThreshold: number
}

export class ScoreSystem implements System {
  /** System type identifier */
  readonly systemType = 'score' as const

  /** Score change events emitted during the current frame */
  private events: ScoreChangedEvent[] = []

  /** Lives change events emitted during the current frame */
  private livesEvents: LivesChangedEvent[] = []

  /** Bonus life events emitted during the current frame */
  private bonusLifeEvents: BonusLifeEvent[] = []

  /** Asteroid destroyed events to process this frame */
  private asteroidDestroyedEvents: AsteroidDestroyedEvent[] = []

  /** Boss defeated events to process this frame */
  private bossDefeatedEvents: BossDefeatedEvent[] = []

  /** Next score threshold for bonus life */
  private nextBonusLifeThreshold: number

  /**
   * Create a new ScoreSystem.
   * Initializes bonus life threshold from config.
   */
  constructor() {
    this.nextBonusLifeThreshold = gameConfig.gameplay.bonusLife.firstThreshold
  }

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
    this.livesEvents = []
    this.bonusLifeEvents = []

    // Find player entity
    const result = getPlayerEntity(world)
    if (!result) {
      // Clear processed events and return
      this.asteroidDestroyedEvents = []
      this.bossDefeatedEvents = []
      return
    }
    const { player } = result

    // Process each asteroid destruction event
    for (const event of this.asteroidDestroyedEvents) {
      const pointsAwarded = event.data.points
      const previousScore = player.score

      // Update player score
      player.addScore(pointsAwarded)

      // Check for bonus life threshold crossing
      this.checkBonusLife(player)

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

      // Check for bonus life threshold crossing
      this.checkBonusLife(player)

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
   * Check if player has crossed a bonus life threshold.
   * Awards a life and advances to next threshold if crossed.
   *
   * @param player - The player component
   */
  private checkBonusLife(player: Player): void {
    // Check if we crossed the threshold
    while (player.score >= this.nextBonusLifeThreshold) {
      const previousLives = player.lives
      player.addLife()

      // Emit bonus life event
      const bonusEvent: BonusLifeEvent = {
        type: 'bonusLife',
        newLives: player.lives,
        scoreThreshold: this.nextBonusLifeThreshold
      }
      this.bonusLifeEvents.push(bonusEvent)

      // Emit lives changed event
      const livesEvent: LivesChangedEvent = {
        type: 'livesChanged',
        timestamp: Date.now(),
        data: {
          previousLives,
          newLives: player.lives,
          delta: 1,
          reason: 'extraLife'
        }
      }
      this.livesEvents.push(livesEvent)

      // Advance to next threshold
      this.nextBonusLifeThreshold += gameConfig.gameplay.bonusLife.subsequentInterval
    }
  }

  /**
   * Get score change events emitted during the current frame.
   *
   * Events are cleared at the start of each update cycle.
   *
   * @returns Array of score change events
   */
  getEvents(): ScoreChangedEvent[] {
    return this.events
  }

  /**
   * Get lives change events emitted during the current frame.
   *
   * @returns Array of lives change events
   */
  getLivesEvents(): LivesChangedEvent[] {
    return this.livesEvents
  }

  /**
   * Get bonus life events emitted during the current frame.
   *
   * @returns Array of bonus life events
   */
  getBonusLifeEvents(): BonusLifeEvent[] {
    return this.bonusLifeEvents
  }

  /**
   * Reset the bonus life threshold (for new game).
   */
  resetBonusLifeThreshold(): void {
    this.nextBonusLifeThreshold = gameConfig.gameplay.bonusLife.firstThreshold
  }
}
