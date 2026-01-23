/**
 * Asteroid Entity and Wave System Tests
 *
 * Tests for createAsteroid factory function and WaveSystem.
 * Follows TDD approach - these tests define the expected behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import {
  createAsteroid,
  getAsteroidPoints,
  getAsteroidRadius,
  type AsteroidSize,
} from '../../src/entities/createAsteroid'
import { WaveSystem } from '../../src/systems/WaveSystem'
import {
  Transform,
  Velocity,
  Physics,
  Collider,
  Renderable,
} from '../../src/components'
import { Asteroid } from '../../src/components/Asteroid'
import { gameConfig } from '../../src/config'

describe('Asteroid Creation', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('Large Asteroid', () => {
    it('should create large asteroid with correct transform', () => {
      const position = new Vector3(100, 200, 0)
      const asteroidId = createAsteroid(world, position, 'large')

      const transform = world.getComponent(asteroidId, Transform)

      expect(transform).toBeDefined()
      expect(transform?.position.x).toBe(100)
      expect(transform?.position.y).toBe(200)
      expect(transform?.position.z).toBe(0)
    })

    it('should create large asteroid with correct physics', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const physics = world.getComponent(asteroidId, Physics)

      expect(physics).toBeDefined()
      expect(physics?.mass).toBe(3)
      expect(physics?.wrapScreen).toBe(true)
    })

    it('should create large asteroid with correct collider', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const collider = world.getComponent(asteroidId, Collider)

      expect(collider).toBeDefined()
      expect(collider?.shape).toBe('sphere')
      expect(collider?.radius).toBe(30)
      expect(collider?.layer).toBe('asteroid')
    })

    it('should create large asteroid with correct renderable', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const renderable = world.getComponent(asteroidId, Renderable)

      expect(renderable).toBeDefined()
      expect(renderable?.meshType).toBe('asteroid_large')
      expect(renderable?.material).toBe('standard')
      expect(renderable?.visible).toBe(true)
    })

    it('should have correct point value for large asteroid', () => {
      expect(getAsteroidPoints('large')).toBe(25)
    })

    it('should have correct radius for large asteroid', () => {
      expect(getAsteroidRadius('large')).toBe(30)
    })
  })

  describe('Medium Asteroid', () => {
    it('should create medium asteroid with correct physics', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'medium')

      const physics = world.getComponent(asteroidId, Physics)

      expect(physics?.mass).toBe(2)
    })

    it('should create medium asteroid with correct collider', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'medium')

      const collider = world.getComponent(asteroidId, Collider)

      expect(collider?.radius).toBe(20)
    })

    it('should create medium asteroid with correct renderable', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'medium')

      const renderable = world.getComponent(asteroidId, Renderable)

      expect(renderable?.meshType).toBe('asteroid_medium')
    })

    it('should have correct point value for medium asteroid', () => {
      expect(getAsteroidPoints('medium')).toBe(50)
    })

    it('should have correct radius for medium asteroid', () => {
      expect(getAsteroidRadius('medium')).toBe(20)
    })
  })

  describe('Small Asteroid', () => {
    it('should create small asteroid with correct physics', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const physics = world.getComponent(asteroidId, Physics)

      expect(physics?.mass).toBe(1)
    })

    it('should create small asteroid with correct collider', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const collider = world.getComponent(asteroidId, Collider)

      expect(collider?.radius).toBe(10)
    })

    it('should create small asteroid with correct renderable', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const renderable = world.getComponent(asteroidId, Renderable)

      expect(renderable?.meshType).toBe('asteroid_small')
    })

    it('should have correct point value for small asteroid', () => {
      expect(getAsteroidPoints('small')).toBe(100)
    })

    it('should have correct radius for small asteroid', () => {
      expect(getAsteroidRadius('small')).toBe(10)
    })
  })

  describe('Common Properties', () => {
    it('should have velocity component with non-zero linear velocity', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const velocity = world.getComponent(asteroidId, Velocity)

      expect(velocity).toBeDefined()
      expect(velocity?.linear).toBeDefined()
      // Velocity should not be zero (randomized direction)
      const speed = velocity?.linear.length() ?? 0
      expect(speed).toBeGreaterThan(0)
    })

    it('should have velocity component with angular velocity', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const velocity = world.getComponent(asteroidId, Velocity)

      expect(velocity?.angular).toBeDefined()
    })

    it('should have random velocity direction', () => {
      // Create multiple asteroids and verify they don't all have same velocity
      const asteroid1 = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const asteroid2 = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const asteroid3 = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const vel1 = world.getComponent(asteroid1, Velocity)
      const vel2 = world.getComponent(asteroid2, Velocity)
      const vel3 = world.getComponent(asteroid3, Velocity)

      // Very unlikely for all three to be identical
      const allSame =
        vel1?.linear.x === vel2?.linear.x &&
        vel2?.linear.x === vel3?.linear.x &&
        vel1?.linear.y === vel2?.linear.y &&
        vel2?.linear.y === vel3?.linear.y

      expect(allSame).toBe(false)
    })

    it('should be on asteroid collision layer', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const collider = world.getComponent(asteroidId, Collider)

      expect(collider?.layer).toBe('asteroid')
    })

    it('should collide with projectiles', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const collider = world.getComponent(asteroidId, Collider)

      expect(collider?.mask).toContain('projectile')
    })

    it('should collide with player', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const collider = world.getComponent(asteroidId, Collider)

      expect(collider?.mask).toContain('player')
    })

    it('should wrap at screen edges', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const physics = world.getComponent(asteroidId, Physics)

      expect(physics?.wrapScreen).toBe(true)
    })

    it('should have asteroid component with correct size and points', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const asteroid = world.getComponent(asteroidId, Asteroid)

      expect(asteroid).toBeDefined()
      expect(asteroid?.size).toBe('large')
      expect(asteroid?.points).toBe(25)
    })

    it('should have larger asteroids move slower than smaller ones', () => {
      const largeId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const smallId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const largePhysics = world.getComponent(largeId, Physics)
      const smallPhysics = world.getComponent(smallId, Physics)

      // Large asteroids should have lower max speed
      expect(largePhysics?.maxSpeed).toBeLessThan(smallPhysics?.maxSpeed ?? 0)
    })
  })

  describe('Multiple Asteroids', () => {
    it('should create multiple asteroid entities with unique IDs', () => {
      const asteroid1 = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const asteroid2 = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      expect(asteroid1).not.toBe(asteroid2)
    })

    it('should not share component instances between asteroids', () => {
      const asteroid1 = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const asteroid2 = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const transform1 = world.getComponent(asteroid1, Transform)
      const transform2 = world.getComponent(asteroid2, Transform)

      expect(transform1).not.toBe(transform2)
    })
  })
})

describe('Wave System', () => {
  let world: World
  let waveSystem: WaveSystem

  beforeEach(() => {
    world = new World()
    waveSystem = new WaveSystem()
  })

  describe('Initial State', () => {
    it('should start at wave 1', () => {
      expect(waveSystem.getCurrentWave()).toBe(1)
    })

    it('should not be transitioning initially', () => {
      expect(waveSystem.isWaveTransitioning()).toBe(false)
    })
  })

  describe('Wave Formula', () => {
    it('should calculate 3 asteroids for wave 1', () => {
      // Wave formula: 3 + (wave - 1) * 2
      // Wave 1: 3 + (1-1) * 2 = 3
      expect(waveSystem.calculateAsteroidCount(1)).toBe(3)
    })

    it('should calculate 5 asteroids for wave 2', () => {
      // Wave 2: 3 + (2-1) * 2 = 5
      expect(waveSystem.calculateAsteroidCount(2)).toBe(5)
    })

    it('should calculate 7 asteroids for wave 3', () => {
      // Wave 3: 3 + (3-1) * 2 = 7
      expect(waveSystem.calculateAsteroidCount(3)).toBe(7)
    })

    it('should calculate 11 asteroids for wave 5', () => {
      // Wave 5: 3 + (5-1) * 2 = 11
      expect(waveSystem.calculateAsteroidCount(5)).toBe(11)
    })

    it('should calculate 21 asteroids for wave 10', () => {
      // Wave 10: 3 + (10-1) * 2 = 21
      expect(waveSystem.calculateAsteroidCount(10)).toBe(21)
    })
  })

  describe('Speed Multiplier', () => {
    it('should return 1.0 for wave 1', () => {
      expect(waveSystem.calculateSpeedMultiplier(1)).toBeCloseTo(1.0)
    })

    it('should increase speed for higher waves', () => {
      expect(waveSystem.calculateSpeedMultiplier(5)).toBeGreaterThan(1.0)
    })

    it('should cap speed multiplier at 2.0', () => {
      // Even for very high waves, should not exceed 2.0
      expect(waveSystem.calculateSpeedMultiplier(50)).toBeLessThanOrEqual(2.0)
    })
  })

  describe('Asteroid Spawning', () => {
    it('should spawn asteroids on first update', () => {
      waveSystem.update(world, 16)

      // Query for asteroids
      const asteroids = world.query(Asteroid)
      expect(asteroids.length).toBe(3) // Wave 1 should spawn 3 asteroids
    })

    it('should spawn asteroids from screen edges', () => {
      waveSystem.update(world, 16)

      const asteroids = world.query(Asteroid)
      const screenHalfWidth = 960 // 1920 / 2
      const screenHalfHeight = 540 // 1080 / 2
      const spawnOffset = 50

      // Each asteroid should be spawned at or beyond screen edge
      for (const asteroidId of asteroids) {
        const transform = world.getComponent(asteroidId, Transform)
        const pos = transform?.position

        if (pos) {
          // Position should be outside visible area (at edge + 50 offset)
          const atLeftEdge = pos.x <= -screenHalfWidth
          const atRightEdge = pos.x >= screenHalfWidth
          const atTopEdge = pos.y >= screenHalfHeight
          const atBottomEdge = pos.y <= -screenHalfHeight

          expect(atLeftEdge || atRightEdge || atTopEdge || atBottomEdge).toBe(true)
        }
      }
    })

    it('should spawn only large asteroids in early waves', () => {
      waveSystem.update(world, 16)

      const asteroids = world.query(Asteroid)

      for (const asteroidId of asteroids) {
        const asteroid = world.getComponent(asteroidId, Asteroid)
        expect(asteroid?.size).toBe('large')
      }
    })
  })

  describe('Wave Progression', () => {
    it('should record asteroid destruction', () => {
      waveSystem.update(world, 16)
      waveSystem.recordAsteroidDestruction()

      // Just verify it doesn't throw - internal state tracking
      expect(() => waveSystem.recordAsteroidDestruction()).not.toThrow()
    })

    it('should get remaining asteroids count', () => {
      // Before any spawning
      expect(waveSystem.getAsteroidsRemaining()).toBe(3) // Wave 1 target
    })
  })
})
