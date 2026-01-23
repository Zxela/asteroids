/**
 * WaveSystem Unit Tests
 *
 * Tests for wave progression mechanics:
 * - Wave counter initialization (starts at 1)
 * - Asteroid count formula: 3 + (wave - 1) * 2
 * - Speed multiplier formula: min(1 + (wave - 1) * 0.05, 2.0)
 * - Wave completion detection
 * - Wave transition delay (3 seconds)
 * - Boss wave detection (every 5 waves)
 * - waveProgressed events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { WaveSystem } from '../../src/systems/WaveSystem'
import { Asteroid } from '../../src/components/Asteroid'
import { Transform, Velocity, Physics, Collider, Renderable, Health } from '../../src/components'
import { gameConfig } from '../../src/config'

/**
 * Helper to create mock asteroid entity
 */
function createMockAsteroid(world: World, size: 'large' | 'medium' | 'small' = 'large'): number {
  const entityId = world.createEntity() as unknown as number
  world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
  world.addComponent(entityId, new Velocity(new Vector3(10, 0, 0)))
  world.addComponent(entityId, new Physics(3, 0.99, 100, true))
  world.addComponent(entityId, new Collider('sphere', 30, 'asteroid', ['projectile', 'player']))
  world.addComponent(entityId, new Renderable(`asteroid_${size}`, 'standard', true))
  world.addComponent(entityId, new Asteroid(size, size === 'small' ? 100 : size === 'medium' ? 50 : 25))
  world.addComponent(entityId, new Health(30, 30))
  return entityId
}

describe('WaveSystem', () => {
  let world: World
  let waveSystem: WaveSystem

  beforeEach(() => {
    world = new World()
    waveSystem = new WaveSystem()
  })

  describe('Wave Counter Initialization', () => {
    it('should start at wave 1', () => {
      expect(waveSystem.getCurrentWave()).toBe(1)
    })

    it('should not start at wave 0', () => {
      expect(waveSystem.getCurrentWave()).not.toBe(0)
    })

    it('should not start at negative wave', () => {
      expect(waveSystem.getCurrentWave()).toBeGreaterThan(0)
    })
  })

  describe('Asteroid Count Calculation', () => {
    it('should calculate 3 asteroids for wave 1', () => {
      expect(waveSystem.calculateAsteroidCount(1)).toBe(3)
    })

    it('should calculate 5 asteroids for wave 2', () => {
      expect(waveSystem.calculateAsteroidCount(2)).toBe(5)
    })

    it('should calculate 7 asteroids for wave 3', () => {
      expect(waveSystem.calculateAsteroidCount(3)).toBe(7)
    })

    it('should calculate 9 asteroids for wave 4', () => {
      expect(waveSystem.calculateAsteroidCount(4)).toBe(9)
    })

    it('should calculate 11 asteroids for wave 5', () => {
      expect(waveSystem.calculateAsteroidCount(5)).toBe(11)
    })

    it('should follow formula 3 + (wave - 1) * 2 for wave 10', () => {
      // 3 + (10 - 1) * 2 = 3 + 18 = 21
      expect(waveSystem.calculateAsteroidCount(10)).toBe(21)
    })

    it('should follow formula for high wave numbers', () => {
      // Wave 20: 3 + (20 - 1) * 2 = 3 + 38 = 41
      expect(waveSystem.calculateAsteroidCount(20)).toBe(41)
    })

    it('should use config values for base count and increment', () => {
      // Verify formula uses config: baseAsteroidCount + (wave - 1) * asteroidIncrement
      const expected = gameConfig.wave.baseAsteroidCount + (5 - 1) * gameConfig.wave.asteroidIncrement
      expect(waveSystem.calculateAsteroidCount(5)).toBe(expected)
    })
  })

  describe('Speed Multiplier Calculation', () => {
    it('should return 1.0x for wave 1', () => {
      expect(waveSystem.calculateSpeedMultiplier(1)).toBe(1.0)
    })

    it('should return 1.05x for wave 2', () => {
      expect(waveSystem.calculateSpeedMultiplier(2)).toBeCloseTo(1.05, 2)
    })

    it('should return 1.10x for wave 3', () => {
      expect(waveSystem.calculateSpeedMultiplier(3)).toBeCloseTo(1.10, 2)
    })

    it('should return 1.15x for wave 4', () => {
      expect(waveSystem.calculateSpeedMultiplier(4)).toBeCloseTo(1.15, 2)
    })

    it('should return 1.20x for wave 5', () => {
      expect(waveSystem.calculateSpeedMultiplier(5)).toBeCloseTo(1.20, 2)
    })

    it('should return 1.45x for wave 10', () => {
      // 1 + (10 - 1) * 0.05 = 1 + 0.45 = 1.45
      expect(waveSystem.calculateSpeedMultiplier(10)).toBeCloseTo(1.45, 2)
    })

    it('should cap at 2.0x for wave 21', () => {
      // 1 + (21 - 1) * 0.05 = 1 + 1.0 = 2.0
      expect(waveSystem.calculateSpeedMultiplier(21)).toBe(2.0)
    })

    it('should cap at 2.0x for wave 25', () => {
      // 1 + (25 - 1) * 0.05 = 1 + 1.2 = 2.2 -> capped to 2.0
      expect(waveSystem.calculateSpeedMultiplier(25)).toBe(2.0)
    })

    it('should cap at 2.0x for very high wave numbers', () => {
      expect(waveSystem.calculateSpeedMultiplier(100)).toBe(2.0)
    })

    it('should not exceed 2.0 multiplier', () => {
      for (let wave = 1; wave <= 50; wave++) {
        expect(waveSystem.calculateSpeedMultiplier(wave)).toBeLessThanOrEqual(2.0)
      }
    })
  })

  describe('Boss Wave Detection', () => {
    it('should detect wave 5 as boss wave', () => {
      expect(waveSystem.isBossWave(5)).toBe(true)
    })

    it('should detect wave 10 as boss wave', () => {
      expect(waveSystem.isBossWave(10)).toBe(true)
    })

    it('should detect wave 15 as boss wave', () => {
      expect(waveSystem.isBossWave(15)).toBe(true)
    })

    it('should detect wave 20 as boss wave', () => {
      expect(waveSystem.isBossWave(20)).toBe(true)
    })

    it('should not detect wave 1 as boss wave', () => {
      expect(waveSystem.isBossWave(1)).toBe(false)
    })

    it('should not detect wave 2 as boss wave', () => {
      expect(waveSystem.isBossWave(2)).toBe(false)
    })

    it('should not detect wave 3 as boss wave', () => {
      expect(waveSystem.isBossWave(3)).toBe(false)
    })

    it('should not detect wave 4 as boss wave', () => {
      expect(waveSystem.isBossWave(4)).toBe(false)
    })

    it('should not detect wave 6 as boss wave', () => {
      expect(waveSystem.isBossWave(6)).toBe(false)
    })

    it('should use config boss wave interval', () => {
      // Boss waves at intervals defined by config (every 5 waves)
      const interval = gameConfig.wave.bossWaveInterval
      expect(waveSystem.isBossWave(interval)).toBe(true)
      expect(waveSystem.isBossWave(interval * 2)).toBe(true)
      expect(waveSystem.isBossWave(interval + 1)).toBe(false)
    })
  })

  describe('Wave Transition', () => {
    it('should not be transitioning initially', () => {
      expect(waveSystem.isWaveTransitioning()).toBe(false)
    })

    it('should report wave transition delay from config', () => {
      expect(gameConfig.gameplay.waveTransitionDelay).toBe(3000)
    })
  })

  describe('Wave Completion and Progression', () => {
    it('should spawn asteroids on first update', () => {
      waveSystem.update(world, 16)

      const asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      expect(asteroids.length).toBe(3) // Wave 1 = 3 asteroids
    })

    it('should record asteroid destruction', () => {
      waveSystem.update(world, 16)
      const initialRemaining = waveSystem.getAsteroidsRemaining()

      waveSystem.recordAsteroidDestruction()

      // Note: getAsteroidsRemaining returns target count, not remaining
      expect(waveSystem.getAsteroidsRemaining()).toBe(initialRemaining)
    })

    it('should begin transition when all asteroids destroyed', () => {
      // First update spawns asteroids
      waveSystem.update(world, 16)

      // Destroy all asteroids
      const asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }

      // Next update should detect cleared wave and begin transition
      waveSystem.update(world, 16)

      expect(waveSystem.isWaveTransitioning()).toBe(true)
    })

    it('should not progress wave until transition delay completes', () => {
      // First update spawns asteroids
      waveSystem.update(world, 16)

      // Destroy all asteroids
      const asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }

      // Begin transition
      waveSystem.update(world, 16)
      expect(waveSystem.getCurrentWave()).toBe(1)

      // Partial transition (1 second)
      waveSystem.update(world, 1000)
      expect(waveSystem.getCurrentWave()).toBe(1)
      expect(waveSystem.isWaveTransitioning()).toBe(true)
    })

    it('should progress to next wave after transition delay', () => {
      // First update spawns asteroids
      waveSystem.update(world, 16)

      // Destroy all asteroids
      const asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }

      // Begin transition
      waveSystem.update(world, 16)

      // Complete transition (3 seconds)
      waveSystem.update(world, 3000)

      expect(waveSystem.getCurrentWave()).toBe(2)
      expect(waveSystem.isWaveTransitioning()).toBe(false)
    })

    it('should spawn more asteroids in wave 2', () => {
      // Complete wave 1
      waveSystem.update(world, 16)
      const wave1Asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of wave1Asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }
      waveSystem.update(world, 16) // Begin transition
      waveSystem.update(world, 3000) // Complete transition

      // Wave 2 should spawn
      waveSystem.update(world, 16)

      const wave2Asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      expect(wave2Asteroids.length).toBe(5) // Wave 2 = 5 asteroids
    })
  })

  describe('Event Emission', () => {
    it('should emit waveProgressed event when wave advances', () => {
      // Complete wave 1
      waveSystem.update(world, 16)
      const wave1Asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of wave1Asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }
      waveSystem.update(world, 16) // Begin transition
      waveSystem.update(world, 3000) // Complete transition

      const events = waveSystem.getEvents()
      expect(events.length).toBe(1)
      expect(events[0].type).toBe('waveProgressed')
    })

    it('should include new wave number in event', () => {
      // Complete wave 1
      waveSystem.update(world, 16)
      const wave1Asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of wave1Asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }
      waveSystem.update(world, 16) // Begin transition
      waveSystem.update(world, 3000) // Complete transition

      const events = waveSystem.getEvents()
      expect(events[0].data.newWave).toBe(2)
    })

    it('should include isBossWave flag in event', () => {
      // Complete waves 1-4 to get to wave 5
      for (let wave = 1; wave <= 4; wave++) {
        waveSystem.update(world, 16)
        const asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
        for (const asteroidId of asteroids) {
          waveSystem.recordAsteroidDestruction()
          world.destroyEntity(asteroidId)
        }
        waveSystem.update(world, 16) // Begin transition
        waveSystem.update(world, 3000) // Complete transition
      }

      const events = waveSystem.getEvents()
      const wave5Event = events[events.length - 1]
      expect(wave5Event.data.isBossWave).toBe(true)
    })

    it('should clear events after getting them', () => {
      // Complete wave 1
      waveSystem.update(world, 16)
      const wave1Asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of wave1Asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }
      waveSystem.update(world, 16) // Begin transition
      waveSystem.update(world, 3000) // Complete transition

      const events1 = waveSystem.getEvents()
      expect(events1.length).toBe(1)

      // Events should be cleared
      const events2 = waveSystem.getEvents()
      expect(events2.length).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero asteroids at start gracefully', () => {
      // Create new system without spawning asteroids
      const freshSystem = new WaveSystem()

      expect(() => {
        freshSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should not allow overlapping wave spawns', () => {
      // First update spawns asteroids
      waveSystem.update(world, 16)

      // Destroy all asteroids
      const asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }

      // Begin transition
      waveSystem.update(world, 16)

      // Multiple updates during transition should not spawn new waves
      waveSystem.update(world, 500)
      waveSystem.update(world, 500)
      waveSystem.update(world, 500)

      expect(waveSystem.getCurrentWave()).toBe(1)
      expect(waveSystem.isWaveTransitioning()).toBe(true)
    })

    it('should handle rapid wave completion gracefully', () => {
      // Complete wave 1 immediately
      waveSystem.update(world, 16)
      let asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }
      waveSystem.update(world, 16)
      waveSystem.update(world, 3000)

      // Complete wave 2 immediately
      waveSystem.update(world, 16)
      asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }
      waveSystem.update(world, 16)
      waveSystem.update(world, 3000)

      expect(waveSystem.getCurrentWave()).toBe(3)
    })

    it('should handle zero delta time', () => {
      expect(() => {
        waveSystem.update(world, 0)
      }).not.toThrow()
    })

    it('should handle very large delta time', () => {
      expect(() => {
        waveSystem.update(world, 100000)
      }).not.toThrow()
    })
  })

  describe('Getters', () => {
    it('should return correct current wave', () => {
      expect(waveSystem.getCurrentWave()).toBe(1)
    })

    it('should return correct asteroids remaining for current wave', () => {
      expect(waveSystem.getAsteroidsRemaining()).toBe(3)
    })

    it('should update asteroids remaining after wave change', () => {
      // Complete wave 1
      waveSystem.update(world, 16)
      const wave1Asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of wave1Asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }
      waveSystem.update(world, 16)
      waveSystem.update(world, 3000)

      expect(waveSystem.getAsteroidsRemaining()).toBe(5) // Wave 2 target
    })
  })

  describe('Speed Multiplier Application', () => {
    it('should return speed multiplier for current wave', () => {
      expect(waveSystem.getSpeedMultiplier()).toBe(1.0)
    })

    it('should update speed multiplier after wave change', () => {
      // Complete wave 1
      waveSystem.update(world, 16)
      const wave1Asteroids = world.query(Asteroid as unknown as import('../../src/ecs/types').ComponentClass<Asteroid>)
      for (const asteroidId of wave1Asteroids) {
        waveSystem.recordAsteroidDestruction()
        world.destroyEntity(asteroidId)
      }
      waveSystem.update(world, 16)
      waveSystem.update(world, 3000)

      expect(waveSystem.getSpeedMultiplier()).toBeCloseTo(1.05, 2)
    })
  })
})
