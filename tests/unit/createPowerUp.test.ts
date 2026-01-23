/**
 * Power-up Entity Factory Tests
 *
 * Tests for createPowerUp factory function and power-up spawning logic.
 * Follows TDD approach - these tests define the expected behavior.
 *
 * @module tests/unit/createPowerUp.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import {
  createPowerUp,
  getRandomPowerUpType,
  shouldSpawnPowerUp,
  POWER_UP_SPAWN_CHANCE,
} from '../../src/entities/createPowerUp'
import {
  Transform,
  Velocity,
  Collider,
  Renderable,
  Lifetime,
  PowerUp,
} from '../../src/components'
import type { PowerUpType } from '../../src/types/components'

describe('Power-up Creation', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('Entity Creation', () => {
    it('should return a valid entity ID', () => {
      const position = new Vector3(100, 200, 0)
      const powerUpId = createPowerUp(world, {
        position,
        powerUpType: 'shield',
      })

      expect(powerUpId).toBeDefined()
      expect(typeof powerUpId).toBe('number')
      expect(world.isEntityAlive(powerUpId)).toBe(true)
    })

    it('should create unique entity IDs for multiple power-ups', () => {
      const powerUp1 = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })
      const powerUp2 = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'rapidFire',
      })

      expect(powerUp1).not.toBe(powerUp2)
    })
  })

  describe('TransformComponent', () => {
    it('should have TransformComponent at correct position', () => {
      const position = new Vector3(150, 250, 0)
      const powerUpId = createPowerUp(world, {
        position,
        powerUpType: 'shield',
      })

      const transform = world.getComponent(powerUpId, Transform)

      expect(transform).toBeDefined()
      expect(transform?.position.x).toBe(150)
      expect(transform?.position.y).toBe(250)
      expect(transform?.position.z).toBe(0)
    })

    it('should clone position to prevent external mutation', () => {
      const position = new Vector3(100, 100, 0)
      const powerUpId = createPowerUp(world, {
        position,
        powerUpType: 'shield',
      })

      // Modify original position
      position.set(999, 999, 999)

      const transform = world.getComponent(powerUpId, Transform)
      expect(transform?.position.x).toBe(100)
      expect(transform?.position.y).toBe(100)
    })

    it('should have default rotation', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const transform = world.getComponent(powerUpId, Transform)
      expect(transform?.rotation).toBeDefined()
    })

    it('should have default scale', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const transform = world.getComponent(powerUpId, Transform)
      expect(transform?.scale.x).toBe(1)
      expect(transform?.scale.y).toBe(1)
      expect(transform?.scale.z).toBe(1)
    })
  })

  describe('VelocityComponent', () => {
    it('should have VelocityComponent with slow drift', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const velocity = world.getComponent(powerUpId, Velocity)

      expect(velocity).toBeDefined()
      expect(velocity?.linear).toBeDefined()
    })

    it('should have slow drift speed (10-30 units/s)', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const velocity = world.getComponent(powerUpId, Velocity)
      const speed = velocity!.linear.length()

      expect(speed).toBeGreaterThanOrEqual(10)
      expect(speed).toBeLessThanOrEqual(30)
    })

    it('should have angular velocity for visual rotation', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const velocity = world.getComponent(powerUpId, Velocity)

      expect(velocity?.angular).toBeDefined()
      // Should have some rotation for visual appeal
      const angularSpeed = velocity!.angular.length()
      expect(angularSpeed).toBeGreaterThan(0)
    })

    it('should allow custom velocity override', () => {
      const customVelocity = new Vector3(5, 5, 0)
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
        velocity: customVelocity,
      })

      const velocity = world.getComponent(powerUpId, Velocity)

      expect(velocity?.linear.x).toBe(5)
      expect(velocity?.linear.y).toBe(5)
    })
  })

  describe('ColliderComponent', () => {
    it('should have ColliderComponent with sphere shape', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const collider = world.getComponent(powerUpId, Collider)

      expect(collider).toBeDefined()
      expect(collider?.shape).toBe('sphere')
    })

    it('should have radius of 10 units', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const collider = world.getComponent(powerUpId, Collider)

      expect(collider?.radius).toBe(10)
    })

    it('should have layer "powerup"', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const collider = world.getComponent(powerUpId, Collider)

      expect(collider?.layer).toBe('powerup')
    })

    it('should have mask containing only "player"', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const collider = world.getComponent(powerUpId, Collider)

      expect(collider?.mask).toEqual(['player'])
    })
  })

  describe('PowerUpComponent', () => {
    it('should have PowerUpComponent with correct type for shield', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const powerUp = world.getComponent(powerUpId, PowerUp)

      expect(powerUp).toBeDefined()
      expect(powerUp?.type).toBe('powerUp')
      expect(powerUp?.powerUpType).toBe('shield')
    })

    it('should have PowerUpComponent with correct type for rapidFire', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'rapidFire',
      })

      const powerUp = world.getComponent(powerUpId, PowerUp)

      expect(powerUp?.powerUpType).toBe('rapidFire')
    })

    it('should have PowerUpComponent with correct type for multiShot', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'multiShot',
      })

      const powerUp = world.getComponent(powerUpId, PowerUp)

      expect(powerUp?.powerUpType).toBe('multiShot')
    })

    it('should have PowerUpComponent with correct type for extraLife', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'extraLife',
      })

      const powerUp = world.getComponent(powerUpId, PowerUp)

      expect(powerUp?.powerUpType).toBe('extraLife')
    })
  })

  describe('RenderableComponent', () => {
    it('should have RenderableComponent with correct meshType for shield', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const renderable = world.getComponent(powerUpId, Renderable)

      expect(renderable).toBeDefined()
      expect(renderable?.meshType).toBe('powerup_shield')
    })

    it('should have RenderableComponent with correct meshType for rapidFire', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'rapidFire',
      })

      const renderable = world.getComponent(powerUpId, Renderable)

      expect(renderable?.meshType).toBe('powerup_rapidfire')
    })

    it('should have RenderableComponent with correct meshType for multiShot', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'multiShot',
      })

      const renderable = world.getComponent(powerUpId, Renderable)

      expect(renderable?.meshType).toBe('powerup_multishot')
    })

    it('should have RenderableComponent with correct meshType for extraLife', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'extraLife',
      })

      const renderable = world.getComponent(powerUpId, Renderable)

      expect(renderable?.meshType).toBe('powerup_extralife')
    })

    it('should have emissive material', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const renderable = world.getComponent(powerUpId, Renderable)

      expect(renderable?.material).toBe('emissive')
    })

    it('should be visible by default', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const renderable = world.getComponent(powerUpId, Renderable)

      expect(renderable?.visible).toBe(true)
    })
  })

  describe('LifetimeComponent', () => {
    it('should have LifetimeComponent with default 3000ms', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
      })

      const lifetime = world.getComponent(powerUpId, Lifetime)

      expect(lifetime).toBeDefined()
      expect(lifetime?.remaining).toBe(3000)
    })

    it('should accept custom lifetime value', () => {
      const powerUpId = createPowerUp(world, {
        position: new Vector3(0, 0, 0),
        powerUpType: 'shield',
        lifetime: 5000,
      })

      const lifetime = world.getComponent(powerUpId, Lifetime)

      expect(lifetime?.remaining).toBe(5000)
    })
  })

  describe('All Power-up Types', () => {
    const powerUpTypes: PowerUpType[] = ['shield', 'rapidFire', 'multiShot', 'extraLife']

    for (const type of powerUpTypes) {
      it(`should create ${type} power-up with all required components`, () => {
        const powerUpId = createPowerUp(world, {
          position: new Vector3(0, 0, 0),
          powerUpType: type,
        })

        expect(world.getComponent(powerUpId, Transform)).toBeDefined()
        expect(world.getComponent(powerUpId, Velocity)).toBeDefined()
        expect(world.getComponent(powerUpId, Collider)).toBeDefined()
        expect(world.getComponent(powerUpId, PowerUp)).toBeDefined()
        expect(world.getComponent(powerUpId, Renderable)).toBeDefined()
        expect(world.getComponent(powerUpId, Lifetime)).toBeDefined()
      })
    }
  })
})

describe('Power-up Spawn Probability', () => {
  it('should have spawn chance constant of 0.10 (10%)', () => {
    expect(POWER_UP_SPAWN_CHANCE).toBe(0.10)
  })

  describe('shouldSpawnPowerUp', () => {
    it('should return true when random value is below spawn chance', () => {
      // Mock Math.random to return 0.05 (below 0.10)
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.05)

      expect(shouldSpawnPowerUp()).toBe(true)

      mockRandom.mockRestore()
    })

    it('should return false when random value is at spawn chance', () => {
      // Mock Math.random to return exactly 0.10
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.10)

      expect(shouldSpawnPowerUp()).toBe(false)

      mockRandom.mockRestore()
    })

    it('should return false when random value is above spawn chance', () => {
      // Mock Math.random to return 0.50 (above 0.10)
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.50)

      expect(shouldSpawnPowerUp()).toBe(false)

      mockRandom.mockRestore()
    })

    it('should return true at boundary (0.0)', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.0)

      expect(shouldSpawnPowerUp()).toBe(true)

      mockRandom.mockRestore()
    })

    it('should return false at high values (0.99)', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.99)

      expect(shouldSpawnPowerUp()).toBe(false)

      mockRandom.mockRestore()
    })
  })
})

describe('Random Power-up Type Selection', () => {
  describe('getRandomPowerUpType', () => {
    it('should return a valid power-up type', () => {
      const validTypes: PowerUpType[] = ['shield', 'rapidFire', 'multiShot', 'extraLife']

      const result = getRandomPowerUpType()

      expect(validTypes).toContain(result)
    })

    it('should return shield when random is 0.0', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.0)

      const result = getRandomPowerUpType()

      expect(result).toBe('shield')

      mockRandom.mockRestore()
    })

    it('should return rapidFire when random is 0.25', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.25)

      const result = getRandomPowerUpType()

      expect(result).toBe('rapidFire')

      mockRandom.mockRestore()
    })

    it('should return multiShot when random is 0.50', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.50)

      const result = getRandomPowerUpType()

      expect(result).toBe('multiShot')

      mockRandom.mockRestore()
    })

    it('should return extraLife when random is 0.75', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.75)

      const result = getRandomPowerUpType()

      expect(result).toBe('extraLife')

      mockRandom.mockRestore()
    })

    it('should return extraLife when random is 0.99 (near 1.0)', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.99)

      const result = getRandomPowerUpType()

      expect(result).toBe('extraLife')

      mockRandom.mockRestore()
    })

    it('should distribute types equally (statistical test)', () => {
      // Run many iterations to verify approximately equal distribution
      const counts: Record<PowerUpType, number> = {
        shield: 0,
        rapidFire: 0,
        multiShot: 0,
        extraLife: 0,
      }

      const iterations = 1000

      for (let i = 0; i < iterations; i++) {
        const type = getRandomPowerUpType()
        counts[type]++
      }

      // Each type should be roughly 25% (allow 10% margin)
      const expectedCount = iterations / 4
      const margin = iterations * 0.10

      expect(counts.shield).toBeGreaterThan(expectedCount - margin)
      expect(counts.shield).toBeLessThan(expectedCount + margin)
      expect(counts.rapidFire).toBeGreaterThan(expectedCount - margin)
      expect(counts.rapidFire).toBeLessThan(expectedCount + margin)
      expect(counts.multiShot).toBeGreaterThan(expectedCount - margin)
      expect(counts.multiShot).toBeLessThan(expectedCount + margin)
      expect(counts.extraLife).toBeGreaterThan(expectedCount - margin)
      expect(counts.extraLife).toBeLessThan(expectedCount + margin)
    })
  })
})
