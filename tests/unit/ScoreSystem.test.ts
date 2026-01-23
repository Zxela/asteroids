/**
 * ScoreSystem Unit Tests
 *
 * Tests for scoring system mechanics:
 * - Score increases on asteroid destruction
 * - Correct points per size (100/50/25 for small/medium/large)
 * - Score persists across multiple frames
 * - scoreChanged events emitted with correct data
 * - Handle no player gracefully
 * - Handle multiple destructions in single frame
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { ScoreSystem } from '../../src/systems/ScoreSystem'
import { Player } from '../../src/components'
import type { AsteroidDestroyedEvent, AsteroidSize } from '../../src/types'

/**
 * Helper to create AsteroidDestroyedEvent
 */
function createAsteroidDestroyedEvent(
  asteroidId: number,
  size: AsteroidSize,
  points: number,
  position: Vector3 = new Vector3(0, 0, 0)
): AsteroidDestroyedEvent {
  return {
    type: 'asteroidDestroyed',
    timestamp: Date.now(),
    data: {
      entityId: asteroidId as unknown as import('../../src/types').EntityId,
      position,
      size,
      points,
      spawnChildren: size !== 'small'
    }
  }
}

describe('ScoreSystem', () => {
  let world: World
  let scoreSystem: ScoreSystem
  let playerId: number

  beforeEach(() => {
    world = new World()
    scoreSystem = new ScoreSystem()

    // Create player entity
    playerId = world.createEntity() as unknown as number
    world.addComponent(playerId, new Player(3)) // 3 lives
  })

  describe('Score Increase', () => {
    it('should increase score on asteroid destruction', () => {
      const player = world.getComponent(playerId, Player)
      const initialScore = player!.score

      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(initialScore + 100)
    })

    it('should accumulate score across multiple destructions in same frame', () => {
      const player = world.getComponent(playerId, Player)
      const initialScore = player!.score

      const events = [
        createAsteroidDestroyedEvent(1, 'small', 100),
        createAsteroidDestroyedEvent(2, 'medium', 50),
        createAsteroidDestroyedEvent(3, 'large', 25)
      ]

      scoreSystem.setAsteroidDestroyedEvents(events)
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(initialScore + 175) // 100 + 50 + 25
    })

    it('should persist score across multiple frames', () => {
      const player = world.getComponent(playerId, Player)

      // First frame: destroy small asteroid
      const event1 = createAsteroidDestroyedEvent(1, 'small', 100)
      scoreSystem.setAsteroidDestroyedEvents([event1])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(100)

      // Second frame: destroy medium asteroid
      const event2 = createAsteroidDestroyedEvent(2, 'medium', 50)
      scoreSystem.setAsteroidDestroyedEvents([event2])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(150)

      // Third frame: no events
      scoreSystem.setAsteroidDestroyedEvents([])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(150) // Score persists
    })
  })

  describe('Point Values', () => {
    it('should award 100 points for small asteroid', () => {
      const player = world.getComponent(playerId, Player)

      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(100)
    })

    it('should award 50 points for medium asteroid', () => {
      const player = world.getComponent(playerId, Player)

      const event = createAsteroidDestroyedEvent(1, 'medium', 50)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(50)
    })

    it('should award 25 points for large asteroid', () => {
      const player = world.getComponent(playerId, Player)

      const event = createAsteroidDestroyedEvent(1, 'large', 25)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(25)
    })
  })

  describe('Event Emission', () => {
    it('should emit scoreChanged event', () => {
      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      const events = scoreSystem.getEvents()
      expect(events.length).toBe(1)
      expect(events[0].type).toBe('scoreChanged')
    })

    it('should include newScore in event', () => {
      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      const events = scoreSystem.getEvents()
      expect(events[0].data.newScore).toBe(100)
    })

    it('should include pointsAwarded in event', () => {
      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      const events = scoreSystem.getEvents()
      expect(events[0].data.delta).toBe(100)
    })

    it('should include previousScore in event', () => {
      const player = world.getComponent(playerId, Player)
      player!.addScore(500) // Set initial score

      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      const events = scoreSystem.getEvents()
      expect(events[0].data.previousScore).toBe(500)
      expect(events[0].data.newScore).toBe(600)
    })

    it('should include reason in event', () => {
      const event = createAsteroidDestroyedEvent(1, 'medium', 50)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      const events = scoreSystem.getEvents()
      expect(events[0].data.reason).toContain('medium')
    })

    it('should emit one event per asteroid destroyed', () => {
      const events = [
        createAsteroidDestroyedEvent(1, 'small', 100),
        createAsteroidDestroyedEvent(2, 'medium', 50),
        createAsteroidDestroyedEvent(3, 'large', 25)
      ]

      scoreSystem.setAsteroidDestroyedEvents(events)
      scoreSystem.update(world, 16)

      const scoreEvents = scoreSystem.getEvents()
      expect(scoreEvents.length).toBe(3)
    })

    it('should clear events at start of each update', () => {
      const event1 = createAsteroidDestroyedEvent(1, 'small', 100)
      scoreSystem.setAsteroidDestroyedEvents([event1])
      scoreSystem.update(world, 16)

      expect(scoreSystem.getEvents().length).toBe(1)

      // Second frame with no events
      scoreSystem.setAsteroidDestroyedEvents([])
      scoreSystem.update(world, 16)

      expect(scoreSystem.getEvents().length).toBe(0)
    })

    it('should have correct cumulative newScore for multiple events in single frame', () => {
      const events = [
        createAsteroidDestroyedEvent(1, 'small', 100),
        createAsteroidDestroyedEvent(2, 'medium', 50)
      ]

      scoreSystem.setAsteroidDestroyedEvents(events)
      scoreSystem.update(world, 16)

      const scoreEvents = scoreSystem.getEvents()
      // First event: 0 -> 100
      expect(scoreEvents[0].data.previousScore).toBe(0)
      expect(scoreEvents[0].data.newScore).toBe(100)
      // Second event: 100 -> 150
      expect(scoreEvents[1].data.previousScore).toBe(100)
      expect(scoreEvents[1].data.newScore).toBe(150)
    })
  })

  describe('Edge Cases', () => {
    it('should handle no player entity gracefully', () => {
      const worldNoPlayer = new World()
      const systemNoPlayer = new ScoreSystem()

      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      systemNoPlayer.setAsteroidDestroyedEvents([event])

      expect(() => {
        systemNoPlayer.update(worldNoPlayer, 16)
      }).not.toThrow()

      // No events emitted when no player
      expect(systemNoPlayer.getEvents().length).toBe(0)
    })

    it('should handle missing player component gracefully', () => {
      world.removeComponent(playerId, Player)

      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])

      expect(() => {
        scoreSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle empty event list', () => {
      const player = world.getComponent(playerId, Player)
      const initialScore = player!.score

      scoreSystem.setAsteroidDestroyedEvents([])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(initialScore)
      expect(scoreSystem.getEvents().length).toBe(0)
    })

    it('should handle zero delta time', () => {
      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])

      expect(() => {
        scoreSystem.update(world, 0)
      }).not.toThrow()

      // Should still process events regardless of deltaTime
      expect(scoreSystem.getEvents().length).toBe(1)
    })

    it('should handle zero points events', () => {
      const player = world.getComponent(playerId, Player)
      const initialScore = player!.score

      const event = createAsteroidDestroyedEvent(1, 'small', 0)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(initialScore)
      // Event should still be emitted even for zero points
      expect(scoreSystem.getEvents().length).toBe(1)
    })

    it('should handle negative points gracefully', () => {
      const player = world.getComponent(playerId, Player)
      player!.addScore(100) // Start at 100

      const event = createAsteroidDestroyedEvent(1, 'small', -50)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      // Score should still change (Player.addScore handles negative values)
      expect(player!.score).toBe(50)
    })

    it('should handle large score values', () => {
      const player = world.getComponent(playerId, Player)
      player!.score = Number.MAX_SAFE_INTEGER - 50

      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])

      expect(() => {
        scoreSystem.update(world, 16)
      }).not.toThrow()

      expect(player!.score).toBeGreaterThan(0)
    })
  })

  describe('System Properties', () => {
    it('should have correct systemType', () => {
      expect(scoreSystem.systemType).toBe('score')
    })
  })

  describe('Multiple Updates', () => {
    it('should not double-process events from previous frame', () => {
      const player = world.getComponent(playerId, Player)

      const event = createAsteroidDestroyedEvent(1, 'small', 100)

      scoreSystem.setAsteroidDestroyedEvents([event])
      scoreSystem.update(world, 16)

      expect(player!.score).toBe(100)

      // Update again without setting new events
      // Events should be cleared and not reprocessed
      scoreSystem.update(world, 16)

      // Score should remain the same (no double counting)
      expect(player!.score).toBe(100)
    })

    it('should handle rapid consecutive updates', () => {
      const player = world.getComponent(playerId, Player)

      for (let i = 0; i < 10; i++) {
        const event = createAsteroidDestroyedEvent(i, 'small', 100)
        scoreSystem.setAsteroidDestroyedEvents([event])
        scoreSystem.update(world, 16)
      }

      expect(player!.score).toBe(1000) // 10 * 100
    })
  })
})
