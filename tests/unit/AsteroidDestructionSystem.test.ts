/**
 * AsteroidDestructionSystem Tests
 *
 * Tests for asteroid destruction and splitting logic.
 * Follows TDD approach - these tests define the expected behavior.
 *
 * @module tests/unit/AsteroidDestructionSystem.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import {
  AsteroidDestructionSystem,
  type AsteroidDestroyedEvent
} from '../../src/systems/AsteroidDestructionSystem'
import { Asteroid, Health, Transform, Velocity, PowerUp, Lifetime } from '../../src/components'
import { createAsteroid } from '../../src/entities/createAsteroid'

describe('AsteroidDestructionSystem', () => {
  let world: World
  let destructionSystem: AsteroidDestructionSystem

  beforeEach(() => {
    world = new World()
    destructionSystem = new AsteroidDestructionSystem()
  })

  describe('Large Asteroid Destruction', () => {
    it('should split large asteroid into medium asteroids', () => {
      // Create large asteroid
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      // Reduce health to zero
      const health = world.getComponent(asteroidId, Health)
      expect(health).toBeDefined()
      health!.current = 0

      destructionSystem.update(world, 16)

      // Large should be gone, 2-3 mediums should exist
      const asteroids = world.query(Asteroid)
      const largeCount = asteroids.filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'large'
      }).length

      const mediumCount = asteroids.filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      }).length

      expect(largeCount).toBe(0)
      expect(mediumCount).toBeGreaterThanOrEqual(2)
      expect(mediumCount).toBeLessThanOrEqual(3)
    })

    it('should spawn 2-3 medium asteroids', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Count medium asteroids
      const mediumAsteroids = world.query(Asteroid).filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      })

      expect(mediumAsteroids.length).toBeGreaterThanOrEqual(2)
      expect(mediumAsteroids.length).toBeLessThanOrEqual(3)
    })

    it('should emit asteroidDestroyed event for large asteroid', () => {
      const asteroidId = createAsteroid(world, new Vector3(10, 20, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events.length).toBeGreaterThan(0)
      expect(events[0].type).toBe('asteroidDestroyed')
      expect(events[0].data.size).toBe('large')
      expect(events[0].data.entityId).toBe(asteroidId)
    })

    it('should emit correct points for large asteroid', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const asteroid = world.getComponent(asteroidId, Asteroid)
      const expectedPoints = asteroid!.points

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events[0].data.points).toBe(expectedPoints)
    })

    it('should destroy the original large asteroid', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Original entity should no longer be alive
      expect(world.isEntityAlive(asteroidId)).toBe(false)
    })
  })

  describe('Medium Asteroid Destruction', () => {
    it('should split medium asteroid into small asteroids', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'medium')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Medium should be gone, 2-3 smalls should exist
      const asteroids = world.query(Asteroid)
      const mediumCount = asteroids.filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      }).length

      const smallCount = asteroids.filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'small'
      }).length

      expect(mediumCount).toBe(0)
      expect(smallCount).toBeGreaterThanOrEqual(2)
      expect(smallCount).toBeLessThanOrEqual(3)
    })

    it('should spawn 2-3 small asteroids', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'medium')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Count small asteroids
      const smallAsteroids = world.query(Asteroid).filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'small'
      })

      expect(smallAsteroids.length).toBeGreaterThanOrEqual(2)
      expect(smallAsteroids.length).toBeLessThanOrEqual(3)
    })

    it('should emit asteroidDestroyed event for medium asteroid', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'medium')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events[0].data.size).toBe('medium')
    })

    it('should emit correct points for medium asteroid', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'medium')

      const asteroid = world.getComponent(asteroidId, Asteroid)
      const expectedPoints = asteroid!.points

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events[0].data.points).toBe(expectedPoints)
    })
  })

  describe('Small Asteroid Destruction', () => {
    it('should destroy small asteroid without spawning children', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      const initialCount = world.query(Asteroid).length

      destructionSystem.update(world, 16)

      const finalCount = world.query(Asteroid).length

      // Small should be gone, no children spawned
      expect(finalCount).toBe(initialCount - 1)
    })

    it('should emit asteroidDestroyed event for small asteroid', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events[0].data.size).toBe('small')
    })

    it('should emit correct points for small asteroid', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const asteroid = world.getComponent(asteroidId, Asteroid)
      const expectedPoints = asteroid!.points

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events[0].data.points).toBe(expectedPoints)
    })

    it('should remove small asteroid from world', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      expect(world.isEntityAlive(asteroidId)).toBe(false)
    })
  })

  describe('Child Asteroid Positioning', () => {
    it('should spawn children around parent position', () => {
      const centerPosition = new Vector3(50, 60, 0)
      const asteroidId = createAsteroid(world, centerPosition, 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Check that children are positioned near center
      const mediumAsteroids = world.query(Transform, Asteroid).filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      })

      for (const childId of mediumAsteroids) {
        const childTransform = world.getComponent(childId, Transform)
        const distance = childTransform!.position.distanceTo(centerPosition)

        // Children should be spawned nearby (within ~10 units)
        expect(distance).toBeLessThan(15)
      }
    })

    it('should offset children to prevent overlap', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Get children positions
      const mediumAsteroids = world.query(Asteroid, Transform).filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      })

      // Need at least 2 children for comparison
      expect(mediumAsteroids.length).toBeGreaterThanOrEqual(2)

      // Check they're not all at the same position
      const positions = mediumAsteroids.map((id) => {
        const t = world.getComponent(id, Transform)
        return t!.position
      })

      const firstPos = positions[0]
      const secondPos = positions[1]

      expect(firstPos.distanceTo(secondPos)).toBeGreaterThan(0.1)
    })

    it('should position children radially', () => {
      const asteroidId = createAsteroid(world, new Vector3(100, 100, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Children should be distributed around the parent position
      const mediumAsteroids = world.query(Asteroid, Transform).filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      })

      // All children should have similar distances from parent center
      const distances = mediumAsteroids.map((id) => {
        const t = world.getComponent(id, Transform)
        return t!.position.distanceTo(new Vector3(100, 100, 0))
      })

      // All distances should be similar (radial positioning)
      const minDistance = Math.min(...distances)
      const maxDistance = Math.max(...distances)
      expect(maxDistance - minDistance).toBeLessThan(5)
    })
  })

  describe('Chain Destruction', () => {
    it('should handle multiple asteroid destructions in one frame', () => {
      const asteroid1 = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const asteroid2 = createAsteroid(world, new Vector3(200, 200, 0), 'large')

      const health1 = world.getComponent(asteroid1, Health)
      const health2 = world.getComponent(asteroid2, Health)

      health1!.current = 0
      health2!.current = 0

      destructionSystem.update(world, 16)

      // Both should be destroyed
      const asteroids = world.query(Asteroid)
      const largeCount = asteroids.filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'large'
      }).length

      expect(largeCount).toBe(0)

      // Should have 4-6 medium asteroids total (2-3 from each)
      const mediumCount = asteroids.filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      }).length

      expect(mediumCount).toBeGreaterThanOrEqual(4)
      expect(mediumCount).toBeLessThanOrEqual(6)
    })

    it('should emit events for all destroyed asteroids', () => {
      const asteroid1 = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const asteroid2 = createAsteroid(world, new Vector3(200, 200, 0), 'medium')
      const asteroid3 = createAsteroid(world, new Vector3(-200, -200, 0), 'small')

      const health1 = world.getComponent(asteroid1, Health)
      const health2 = world.getComponent(asteroid2, Health)
      const health3 = world.getComponent(asteroid3, Health)

      health1!.current = 0
      health2!.current = 0
      health3!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events.length).toBe(3)
    })
  })

  describe('Partial Damage', () => {
    it('should not destroy asteroid with positive health', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 1 // Barely alive

      destructionSystem.update(world, 16)

      // Asteroid should still exist
      expect(world.isEntityAlive(asteroidId)).toBe(true)
    })

    it('should not destroy asteroid with full health', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      destructionSystem.update(world, 16)

      // Asteroid should still exist
      expect(world.isEntityAlive(asteroidId)).toBe(true)
    })

    it('should destroy asteroid with exactly zero health', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      expect(world.isEntityAlive(asteroidId)).toBe(false)
    })

    it('should destroy asteroid with negative health', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const health = world.getComponent(asteroidId, Health)
      health!.current = -10 // Over-damaged

      destructionSystem.update(world, 16)

      expect(world.isEntityAlive(asteroidId)).toBe(false)
    })
  })

  describe('Event Emission', () => {
    it('should emit event with correct position', () => {
      const position = new Vector3(100, 200, 0)
      const asteroidId = createAsteroid(world, position, 'small')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events[0].data.position.x).toBe(100)
      expect(events[0].data.position.y).toBe(200)
      expect(events[0].data.position.z).toBe(0)
    })

    it('should emit one event per destroyed asteroid', () => {
      const asteroid1 = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      const asteroid2 = createAsteroid(world, new Vector3(50, 50, 0), 'small')

      const health1 = world.getComponent(asteroid1, Health)
      const health2 = world.getComponent(asteroid2, Health)

      health1!.current = 0
      health2!.current = 0

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()
      expect(events.length).toBe(2)
    })

    it('should clear events between frames', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      expect(destructionSystem.getEvents().length).toBe(1)

      // Next frame with no destructions
      destructionSystem.update(world, 16)

      expect(destructionSystem.getEvents().length).toBe(0)
    })

    it('should clone position for event to avoid mutation', () => {
      const position = new Vector3(100, 200, 0)
      const asteroidId = createAsteroid(world, position.clone(), 'small')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      const transform = world.getComponent(asteroidId, Transform)

      destructionSystem.update(world, 16)

      const events = destructionSystem.getEvents()

      // Modify original position
      transform!.position.set(999, 999, 999)

      // Event position should not be affected
      expect(events[0].data.position.x).toBe(100)
      expect(events[0].data.position.y).toBe(200)
    })
  })

  describe('Child Asteroid Velocity', () => {
    it('should give child asteroids velocity', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const mediumAsteroids = world.query(Asteroid, Velocity).filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      })

      for (const childId of mediumAsteroids) {
        const velocity = world.getComponent(childId, Velocity)
        expect(velocity).toBeDefined()
        // Children should have some velocity
        const speed = velocity!.linear.length()
        expect(speed).toBeGreaterThan(0)
      }
    })

    it('should spread children outward from destruction point', () => {
      const centerPos = new Vector3(100, 100, 0)
      const asteroidId = createAsteroid(world, centerPos, 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const mediumAsteroids = world.query(Asteroid, Transform, Velocity).filter((id) => {
        const ast = world.getComponent(id, Asteroid)
        return ast?.size === 'medium'
      })

      // Each child should have velocity component in all directions
      // (since children get randomized base velocity + outward boost)
      for (const childId of mediumAsteroids) {
        const velocity = world.getComponent(childId, Velocity)
        // Velocity should have some non-zero magnitude
        const speed = velocity!.linear.length()
        expect(speed).toBeGreaterThan(0)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty world gracefully', () => {
      expect(() => {
        destructionSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle zero delta time', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      expect(() => {
        destructionSystem.update(world, 0)
      }).not.toThrow()

      // Should still destroy
      expect(world.isEntityAlive(asteroidId)).toBe(false)
    })

    it('should handle large delta time', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      expect(() => {
        destructionSystem.update(world, 10000)
      }).not.toThrow()

      expect(world.isEntityAlive(asteroidId)).toBe(false)
    })

    it('should handle asteroid without transform gracefully', () => {
      // Create asteroid and remove its transform
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      world.removeComponent(asteroidId, Transform)

      const health = world.getComponent(asteroidId, Health)
      if (health) {
        health.current = 0
      }

      expect(() => {
        destructionSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle asteroid without health gracefully', () => {
      // Create asteroid and remove its health
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')
      world.removeComponent(asteroidId, Health)

      expect(() => {
        destructionSystem.update(world, 16)
      }).not.toThrow()

      // Should still exist since it can't be destroyed without health
      expect(world.isEntityAlive(asteroidId)).toBe(true)
    })

    it('should handle multiple update calls correctly', () => {
      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'large')

      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)
      expect(world.isEntityAlive(asteroidId)).toBe(false)

      // Second update should not throw
      expect(() => {
        destructionSystem.update(world, 16)
      }).not.toThrow()
    })
  })

  describe('System Type', () => {
    it('should have correct system type', () => {
      expect(destructionSystem.systemType).toBe('asteroidDestruction')
    })
  })

  describe('Power-up Spawning', () => {
    it('should spawn power-up when random value is below spawn chance', () => {
      // Mock Math.random to always return 0.05 (below 0.10 threshold)
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.05)

      const asteroidId = createAsteroid(world, new Vector3(100, 200, 0), 'small')
      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Should have spawned a power-up
      const powerUps = world.query(PowerUp)
      expect(powerUps.length).toBe(1)

      mockRandom.mockRestore()
    })

    it('should not spawn power-up when random value is above spawn chance', () => {
      // Mock Math.random to always return 0.50 (above 0.10 threshold)
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.50)

      const asteroidId = createAsteroid(world, new Vector3(100, 200, 0), 'small')
      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      // Should not have spawned a power-up
      const powerUps = world.query(PowerUp)
      expect(powerUps.length).toBe(0)

      mockRandom.mockRestore()
    })

    it('should spawn power-up at asteroid destruction position', () => {
      // Mock Math.random to always spawn power-up
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01)

      const destroyPosition = new Vector3(150, 250, 0)
      const asteroidId = createAsteroid(world, destroyPosition, 'small')
      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const powerUps = world.query(PowerUp, Transform)
      expect(powerUps.length).toBe(1)

      const powerUpTransform = world.getComponent(powerUps[0], Transform)
      expect(powerUpTransform?.position.x).toBe(150)
      expect(powerUpTransform?.position.y).toBe(250)
      expect(powerUpTransform?.position.z).toBe(0)

      mockRandom.mockRestore()
    })

    it('should spawn power-up with Lifetime component', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01)

      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')
      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const powerUps = world.query(PowerUp, Lifetime)
      expect(powerUps.length).toBe(1)

      const lifetime = world.getComponent(powerUps[0], Lifetime)
      expect(lifetime?.remaining).toBe(3000)

      mockRandom.mockRestore()
    })

    it('should spawn random power-up type', () => {
      // First random call is for spawn chance (0.01 < 0.10 = true)
      // Second random call is for power-up type selection
      let callCount = 0
      const mockRandom = vi.spyOn(Math, 'random').mockImplementation(() => {
        callCount++
        if (callCount === 1) return 0.01 // Spawn chance - always spawn
        return 0.5 // Type selection - should give multiShot
      })

      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')
      const health = world.getComponent(asteroidId, Health)
      health!.current = 0

      destructionSystem.update(world, 16)

      const powerUps = world.query(PowerUp)
      expect(powerUps.length).toBe(1)

      mockRandom.mockRestore()
    })

    it('should not spawn power-up for surviving asteroids', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01)

      const asteroidId = createAsteroid(world, new Vector3(0, 0, 0), 'small')
      // Health > 0, asteroid survives
      const health = world.getComponent(asteroidId, Health)
      health!.current = 5

      destructionSystem.update(world, 16)

      const powerUps = world.query(PowerUp)
      expect(powerUps.length).toBe(0)

      mockRandom.mockRestore()
    })

    it('should potentially spawn power-up for each destroyed asteroid', () => {
      // Mock to always spawn
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01)

      const asteroid1 = createAsteroid(world, new Vector3(0, 0, 0), 'small')
      const asteroid2 = createAsteroid(world, new Vector3(100, 100, 0), 'small')

      const health1 = world.getComponent(asteroid1, Health)
      const health2 = world.getComponent(asteroid2, Health)

      health1!.current = 0
      health2!.current = 0

      destructionSystem.update(world, 16)

      // Both should spawn power-ups since we mocked random to always spawn
      const powerUps = world.query(PowerUp)
      expect(powerUps.length).toBe(2)

      mockRandom.mockRestore()
    })
  })
})
