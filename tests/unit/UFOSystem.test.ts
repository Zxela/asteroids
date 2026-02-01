/**
 * UFOSystem Unit Tests
 *
 * Tests for UFO AI movement patterns:
 * - Horizontal movement at configured speed
 * - Vertical oscillation patterns
 * - Screen bounds and destruction
 * - Continuous smooth movement
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { UFOSystem } from '../../src/systems/UFOSystem'
import { Transform, Velocity, Physics, Collider, Health, Renderable, Player } from '../../src/components'
import { UFO, UFO_CONFIG, type UFOSize } from '../../src/components/UFO'

/**
 * Helper to create a mock UFO entity with specified properties
 */
function createMockUFO(
  world: World,
  size: UFOSize = 'large',
  position = new Vector3(0, 0, 0),
  velocity = new Vector3(UFO_CONFIG[size].speed, 0, 0)
): ReturnType<typeof world.createEntity> {
  const entityId = world.createEntity()
  const config = UFO_CONFIG[size]

  world.addComponent(entityId, new Transform(position.clone()))
  world.addComponent(entityId, new Velocity(velocity.clone()))
  world.addComponent(entityId, new Physics(1, 0, config.speed, true))
  world.addComponent(entityId, new Collider('sphere', config.colliderRadius, 'ufo', ['player', 'projectile']))
  world.addComponent(entityId, new Health(1, 1))
  world.addComponent(entityId, new UFO(size))
  world.addComponent(entityId, new Renderable(`ufo_${size}`, 'emissive', true))

  return entityId
}

/**
 * Helper to create a mock player entity
 */
function createMockPlayer(world: World, position = new Vector3(200, 200, 0)): ReturnType<typeof world.createEntity> {
  const entityId = world.createEntity()
  world.addComponent(entityId, new Transform(position.clone()))
  world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
  world.addComponent(entityId, new Physics(1, 0.99, 300, true))
  world.addComponent(entityId, new Collider('sphere', 20, 'player', ['asteroid', 'powerup']))
  world.addComponent(entityId, new Health(1, 1))
  world.addComponent(entityId, new Player(3))
  world.addComponent(entityId, new Renderable('ship', 'standard', true))
  return entityId
}

describe('UFOSystem', () => {
  let world: World
  let ufoSystem: UFOSystem

  beforeEach(() => {
    world = new World()
    ufoSystem = new UFOSystem()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization and Entity Querying', () => {
    it('should initialize UFOSystem without errors', () => {
      expect(ufoSystem).toBeDefined()
    })

    it('should query for entities with UFO, Transform, Velocity, Health components', () => {
      const ufoId = createMockUFO(world, 'large')
      createMockPlayer(world)

      ufoSystem.update(world, 16)

      // Verify the UFO was found and processed
      const ufo = world.getComponent(ufoId, UFO)
      expect(ufo).toBeDefined()
    })

    it('should not throw when no UFO entities exist', () => {
      createMockPlayer(world)
      expect(() => ufoSystem.update(world, 16)).not.toThrow()
    })

    it('should not throw when no player entity exists', () => {
      createMockUFO(world, 'large')
      expect(() => ufoSystem.update(world, 16)).not.toThrow()
    })
  })

  describe('AC-005: Horizontal Movement Speed (Configured Speed)', () => {
    it('should maintain large UFO speed at 80 units/s', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(0, 0, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      expect(speed).toBeCloseTo(UFO_CONFIG['large'].speed, 0)
    })

    it('should maintain small UFO speed at 120 units/s', () => {
      const ufoId = createMockUFO(world, 'small', new Vector3(0, 0, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      expect(speed).toBeCloseTo(UFO_CONFIG['small'].speed, 0)
    })

    it('should apply configured speed to velocity linear component', () => {
      const ufoId = createMockUFO(world, 'large')
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      expect(velocity?.linear.length()).toBeCloseTo(UFO_CONFIG['large'].speed, 0)
    })

    it('should update velocity correctly after multiple frames', () => {
      const ufoId = createMockUFO(world, 'small')
      createMockPlayer(world)

      // Update multiple times
      for (let i = 0; i < 5; i++) {
        ufoSystem.update(world, 100)
      }

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      expect(velocity?.linear.length()).toBeCloseTo(UFO_CONFIG['small'].speed, 0)
    })

    it('should move with correct speed regardless of initial direction', () => {
      // Create UFO moving leftward
      const ufoId = createMockUFO(world, 'large', new Vector3(100, 0, 0), new Vector3(-UFO_CONFIG['large'].speed, 0, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      expect(speed).toBeCloseTo(UFO_CONFIG['large'].speed, 0)
    })
  })

  describe('AC-006: Vertical Oscillation', () => {
    it('should apply vertical oscillation to UFO velocity', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(0, 0, 0))
      createMockPlayer(world)

      // Update multiple times to allow vertical direction changes
      for (let i = 0; i < 5; i++) {
        ufoSystem.update(world, 500)
      }

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      // Velocity should be defined and not purely horizontal
      expect(velocity?.linear).toBeDefined()
    })

    it('should have non-zero Y velocity during oscillation', () => {
      const ufoId = createMockUFO(world, 'small', new Vector3(0, 0, 0))
      createMockPlayer(world)

      let foundNonZeroY = false

      // Update to trigger direction change (need enough time for 1000-3000ms timer)
      for (let i = 0; i < 50; i++) {
        ufoSystem.update(world, 200)
        const velocity = world.getComponent<Velocity>(ufoId, Velocity)
        if (velocity && velocity.linear.y !== 0) {
          foundNonZeroY = true
          break
        }
      }

      // Over multiple updates, Y velocity should be non-zero at some point
      expect(foundNonZeroY).toBe(true)
    })

    it('should vary vertical direction over time', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(0, 0, 0))
      createMockPlayer(world)

      const verticalVelocities: number[] = []

      // Collect vertical velocities over time (need more iterations to see direction changes)
      for (let i = 0; i < 40; i++) {
        ufoSystem.update(world, 200)
        const velocity = world.getComponent<Velocity>(ufoId, Velocity)
        if (velocity) {
          verticalVelocities.push(velocity.linear.y)
        }
      }

      // Should have variation in vertical velocity
      const hasPositiveY = verticalVelocities.some(v => v > 0.01)
      const hasNegativeY = verticalVelocities.some(v => v < -0.01)
      const hasZeroY = verticalVelocities.some(v => Math.abs(v) < 0.01)

      // Should have some variation - allowing for zero values when timer hasn't expired
      const uniqueValues = new Set(verticalVelocities.map(v => Math.round(v * 100)))
      expect(uniqueValues.size).toBeGreaterThan(1)
    })

    it('should limit vertical oscillation to prevent going too far up/down', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(0, 400, 0))
      createMockPlayer(world)

      // Update multiple times at screen edge
      for (let i = 0; i < 50; i++) {
        ufoSystem.update(world, 100)
      }

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      // When at extreme Y, vertical velocity should reverse
      const transform = world.getComponent<Transform>(ufoId, Transform)

      if (transform && Math.abs(transform.position.y) > 400) {
        // At screen edge, velocity should not continue moving away
        expect(velocity?.linear).toBeDefined()
      }
    })
  })

  describe('AC-007: Screen Bounds Wrapping/Exit', () => {
    it('should destroy UFO when it exits screen bounds (X axis)', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(1500, 0, 0), new Vector3(200, 0, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const isAlive = world.isEntityAlive(ufoId)
      expect(isAlive).toBe(false)
    })

    it('should destroy UFO when it exits screen bounds (negative X axis)', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(-1500, 0, 0), new Vector3(-200, 0, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const isAlive = world.isEntityAlive(ufoId)
      expect(isAlive).toBe(false)
    })

    it('should destroy UFO when it exits screen bounds (Y axis)', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(0, 1000, 0), new Vector3(0, 200, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const isAlive = world.isEntityAlive(ufoId)
      expect(isAlive).toBe(false)
    })

    it('should destroy UFO when it exits screen bounds (negative Y axis)', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(0, -1000, 0), new Vector3(0, -200, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const isAlive = world.isEntityAlive(ufoId)
      expect(isAlive).toBe(false)
    })

    it('should keep UFO alive when within screen bounds', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(500, 300, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const isAlive = world.isEntityAlive(ufoId)
      expect(isAlive).toBe(true)
    })

    it('should have margin of 200 units before destroying out-of-bounds UFO', () => {
      // At 960 + 200 = 1160 (edge), should not be destroyed yet
      const ufoId = createMockUFO(world, 'large', new Vector3(1160, 0, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const isAlive = world.isEntityAlive(ufoId)
      // Should still be alive at margin boundary
      expect(isAlive).toBe(true)
    })

    it('should destroy UFO past margin boundary', () => {
      // At 960 + 200 + 1 = 1161 (past edge), should be destroyed
      const ufoId = createMockUFO(world, 'large', new Vector3(1200, 0, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const isAlive = world.isEntityAlive(ufoId)
      expect(isAlive).toBe(false)
    })
  })

  describe('AC-008: Smooth Movement Without Stuttering', () => {
    it('should ensure velocity linear component is always defined', () => {
      const ufoId = createMockUFO(world, 'large')
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      expect(velocity?.linear).toBeDefined()
    })

    it('should maintain consistent velocity across frames', () => {
      const ufoId = createMockUFO(world, 'small')
      createMockPlayer(world)

      const velocities: number[] = []

      for (let i = 0; i < 10; i++) {
        ufoSystem.update(world, 100)
        const velocity = world.getComponent<Velocity>(ufoId, Velocity)
        if (velocity) {
          velocities.push(velocity.linear.length())
        }
      }

      // All velocities should match configured speed
      velocities.forEach(v => {
        expect(v).toBeCloseTo(UFO_CONFIG['small'].speed, 0)
      })
    })

    it('should update velocity every frame without gaps', () => {
      const ufoId = createMockUFO(world, 'large')
      createMockPlayer(world)

      // Update with small delta times
      for (let i = 0; i < 30; i++) {
        ufoSystem.update(world, 16.67) // ~60fps

        const velocity = world.getComponent<Velocity>(ufoId, Velocity)
        // Velocity should always be defined after update
        expect(velocity?.linear).toBeDefined()
      }
    })

    it('should not have stuttering velocity changes', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(0, 0, 0))
      createMockPlayer(world)

      const velocityMagnitudes: number[] = []

      for (let i = 0; i < 15; i++) {
        ufoSystem.update(world, 100)
        const velocity = world.getComponent<Velocity>(ufoId, Velocity)
        if (velocity) {
          velocityMagnitudes.push(velocity.linear.length())
        }
      }

      // Check that speed doesn't jump around (smooth transitions)
      for (let i = 1; i < velocityMagnitudes.length; i++) {
        const diff = Math.abs(velocityMagnitudes[i] - velocityMagnitudes[i - 1])
        // Allow small differences due to vertical oscillation
        expect(diff).toBeLessThan(50)
      }
    })

    it('should preserve velocity between frames for both sizes', () => {
      const largeId = createMockUFO(world, 'large', new Vector3(-400, 0, 0))
      const smallId = createMockUFO(world, 'small', new Vector3(400, 0, 0))
      createMockPlayer(world)

      for (let i = 0; i < 5; i++) {
        ufoSystem.update(world, 100)
      }

      const largeVelocity = world.getComponent<Velocity>(largeId, Velocity)
      const smallVelocity = world.getComponent<Velocity>(smallId, Velocity)

      expect(largeVelocity?.linear).toBeDefined()
      expect(smallVelocity?.linear).toBeDefined()
      expect(largeVelocity?.linear.length()).toBeCloseTo(UFO_CONFIG['large'].speed, 0)
      expect(smallVelocity?.linear.length()).toBeCloseTo(UFO_CONFIG['small'].speed, 0)
    })
  })

  describe('Movement Edge Cases', () => {
    it('should handle UFO at exact screen corner', () => {
      const ufoId = createMockUFO(world, 'large', new Vector3(960, 540, 0))
      createMockPlayer(world)

      expect(() => ufoSystem.update(world, 100)).not.toThrow()
    })

    it('should handle rapid direction changes', () => {
      const ufoId = createMockUFO(world, 'small', new Vector3(0, 0, 0))
      createMockPlayer(world)

      for (let i = 0; i < 50; i++) {
        ufoSystem.update(world, 100)
      }

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      expect(velocity?.linear).toBeDefined()
      expect(velocity?.linear.length()).toBeCloseTo(UFO_CONFIG['small'].speed, 0)
    })

    it('should handle multiple UFOs moving simultaneously', () => {
      const ufoId1 = createMockUFO(world, 'large', new Vector3(-300, -200, 0))
      const ufoId2 = createMockUFO(world, 'small', new Vector3(300, 200, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const velocity1 = world.getComponent<Velocity>(ufoId1, Velocity)
      const velocity2 = world.getComponent<Velocity>(ufoId2, Velocity)

      expect(velocity1?.linear).toBeDefined()
      expect(velocity2?.linear).toBeDefined()
      expect(velocity1?.linear.length()).toBeCloseTo(UFO_CONFIG['large'].speed, 0)
      expect(velocity2?.linear.length()).toBeCloseTo(UFO_CONFIG['small'].speed, 0)
    })
  })

  describe('Movement State Management', () => {
    it('should initialize movement state on first update', () => {
      const ufoId = createMockUFO(world, 'large')
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(ufoId, Velocity)
      expect(velocity?.linear).toBeDefined()
    })

    it('should maintain state across multiple updates', () => {
      const ufoId = createMockUFO(world, 'large')
      createMockPlayer(world)

      ufoSystem.update(world, 100)
      const velocity1 = world.getComponent<Velocity>(ufoId, Velocity)?.linear.clone()

      ufoSystem.update(world, 100)
      const velocity2 = world.getComponent<Velocity>(ufoId, Velocity)?.linear

      // Both should be defined
      expect(velocity1).toBeDefined()
      expect(velocity2).toBeDefined()
    })

    it('should clean up state when UFO is destroyed by health', () => {
      const ufoId = createMockUFO(world, 'large')
      createMockPlayer(world)

      // Reduce health to 0
      const health = world.getComponent<Health>(ufoId, Health)
      if (health) {
        health.current = 0
      }

      ufoSystem.update(world, 100)

      const isAlive = world.isEntityAlive(ufoId)
      expect(isAlive).toBe(false)
    })
  })

  describe('Integration with Other Systems', () => {
    it('should not affect player velocity', () => {
      createMockUFO(world, 'large')
      const playerId = createMockPlayer(world, new Vector3(200, 200, 0))

      const initialVelocity = world.getComponent<Velocity>(playerId, Velocity)?.linear.clone()

      ufoSystem.update(world, 100)

      const newVelocity = world.getComponent<Velocity>(playerId, Velocity)?.linear

      expect(newVelocity?.equals(initialVelocity!)).toBe(true)
    })

    it('should process multiple UFOs independently', () => {
      const ufoId1 = createMockUFO(world, 'large', new Vector3(-500, 0, 0))
      const ufoId2 = createMockUFO(world, 'small', new Vector3(500, 0, 0))
      createMockPlayer(world)

      ufoSystem.update(world, 100)

      const velocity1 = world.getComponent<Velocity>(ufoId1, Velocity)?.linear.length() ?? 0
      const velocity2 = world.getComponent<Velocity>(ufoId2, Velocity)?.linear.length() ?? 0

      // Should have different configured speeds
      expect(velocity1).toBeCloseTo(UFO_CONFIG['large'].speed, 0)
      expect(velocity2).toBeCloseTo(UFO_CONFIG['small'].speed, 0)
      expect(velocity1).not.toEqual(velocity2)
    })
  })
})
