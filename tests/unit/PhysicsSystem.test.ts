/**
 * PhysicsSystem Unit Tests
 *
 * Tests for physics system calculations:
 * - Position updates with velocity
 * - Damping velocity reduction (exponential decay)
 * - Max speed enforcement
 * - Screen wrapping at boundaries
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { PhysicsSystem } from '../../src/systems/PhysicsSystem'
import { Transform, Velocity, Physics } from '../../src/components'

describe('PhysicsSystem', () => {
  let world: World
  let physicsSystem: PhysicsSystem

  beforeEach(() => {
    world = new World()
    physicsSystem = new PhysicsSystem()
  })

  describe('Position Updates', () => {
    it('should update position based on velocity', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false)) // damping = 1 means no damping

      physicsSystem.update(world, 1000) // 1 second

      const transform = world.getComponent(entityId, Transform)
      expect(transform?.position.x).toBeCloseTo(100, 0)
    })

    it('should update position in Y direction', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 50, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 1000) // 1 second

      const transform = world.getComponent(entityId, Transform)
      expect(transform?.position.y).toBeCloseTo(50, 0)
    })

    it('should update position in Z direction', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 200)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 1000) // 1 second

      const transform = world.getComponent(entityId, Transform)
      expect(transform?.position.z).toBeCloseTo(200, 0)
    })

    it('should update rotation based on angular velocity', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(
        entityId,
        new Velocity(new Vector3(0, 0, 0), new Vector3(Math.PI, 0, 0))
      )
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 1000) // 1 second

      const transform = world.getComponent(entityId, Transform)
      expect(transform?.rotation.x).toBeCloseTo(Math.PI, 1)
    })

    it('should handle multiple frames correctly', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(60, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      // Simulate 60fps - two frames at 16.67ms each
      physicsSystem.update(world, 500) // 0.5 seconds
      physicsSystem.update(world, 500) // 0.5 seconds

      const transform = world.getComponent(entityId, Transform)
      expect(transform?.position.x).toBeCloseTo(60, 0)
    })

    it('should scale position update with deltaTime', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(120, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      // 16.67ms frame (typical 60fps)
      physicsSystem.update(world, 16.67)

      const transform = world.getComponent(entityId, Transform)
      // 120 units/second * 0.01667 seconds = ~2 units
      expect(transform?.position.x).toBeCloseTo(2, 0)
    })
  })

  describe('Damping', () => {
    it('should reduce velocity over time', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)))
      world.addComponent(entityId, new Physics(1, 0.9, 300, false))

      physicsSystem.update(world, 1000) // 1 second

      const velocity = world.getComponent(entityId, Velocity)
      expect(velocity?.linear.x).toBeLessThan(100)
      expect(velocity?.linear.x).toBeGreaterThan(0)
    })

    it('should apply exponential damping correctly', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Velocity(new Vector3(1000, 0, 0)))
      world.addComponent(entityId, new Physics(1, 0.5, 2000, false)) // high max speed to avoid clamping

      const initialVelocity = 1000
      physicsSystem.update(world, 100) // 0.1 seconds

      const velocity = world.getComponent(entityId, Velocity)
      // Expected: 1000 * (0.5 ^ 0.1) = ~933.03
      const expectedDamping = Math.pow(0.5, 0.1)
      expect(velocity?.linear.x).toBeCloseTo(initialVelocity * expectedDamping, 0)
    })

    it('should reduce angular velocity with angularDamping', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(
        entityId,
        new Velocity(new Vector3(0, 0, 0), new Vector3(10, 0, 0))
      )
      // Pass angularDamping=0.5 to test angular velocity damping
      world.addComponent(entityId, new Physics(1, 0.5, 300, false, 0.5))

      physicsSystem.update(world, 1000) // 1 second

      const velocity = world.getComponent(entityId, Velocity)
      // Expected: 10 * (0.5 ^ 1) = 5 (using angularDamping)
      expect(velocity?.angular.x).toBeCloseTo(5, 0)
    })

    it('should approach zero velocity with strong damping over time', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)))
      world.addComponent(entityId, new Physics(1, 0.1, 300, false))

      // Run for 10 seconds worth of updates
      for (let i = 0; i < 100; i++) {
        physicsSystem.update(world, 100)
      }

      const velocity = world.getComponent(entityId, Velocity)
      expect(velocity?.linear.x).toBeLessThan(0.01)
    })

    it('should not modify velocity when damping is 1', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 1000)

      const velocity = world.getComponent(entityId, Velocity)
      expect(velocity?.linear.x).toBeCloseTo(100, 0)
    })
  })

  describe('Max Speed Enforcement', () => {
    it('should limit linear velocity to max speed', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Velocity(new Vector3(500, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 16.67)

      const velocity = world.getComponent(entityId, Velocity)
      const speed = velocity?.linear.length() ?? 0
      expect(speed).toBeLessThanOrEqual(300)
    })

    it('should limit diagonal velocity magnitude to max speed', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      // Diagonal velocity with magnitude > 300
      world.addComponent(entityId, new Velocity(new Vector3(400, 400, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 16.67)

      const velocity = world.getComponent(entityId, Velocity)
      const speed = velocity?.linear.length() ?? 0
      expect(speed).toBeLessThanOrEqual(300)
    })

    it('should limit angular velocity to max speed', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(
        entityId,
        new Velocity(new Vector3(0, 0, 0), new Vector3(500, 500, 500))
      )
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 16.67)

      const velocity = world.getComponent(entityId, Velocity)
      const angularSpeed = velocity?.angular.length() ?? 0
      // Allow small floating-point tolerance
      expect(angularSpeed).toBeLessThanOrEqual(300.01)
    })

    it('should preserve velocity direction when clamping', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Velocity(new Vector3(600, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 16.67)

      const velocity = world.getComponent(entityId, Velocity)
      // Direction should still be positive X
      expect(velocity?.linear.x).toBeGreaterThan(0)
      expect(velocity?.linear.y).toBeCloseTo(0, 5)
      expect(velocity?.linear.z).toBeCloseTo(0, 5)
    })

    it('should not modify velocity when below max speed', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 16.67)

      const velocity = world.getComponent(entityId, Velocity)
      expect(velocity?.linear.x).toBeCloseTo(100, 0)
    })
  })

  describe('Screen Wrapping', () => {
    it('should wrap x coordinate when exceeding right boundary', () => {
      const entityId = world.createEntity()
      // Position beyond right edge (half width is 960 for 1920 screen)
      world.addComponent(entityId, new Transform(new Vector3(1000, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, true))

      physicsSystem.update(world, 16.67)

      const transform = world.getComponent(entityId, Transform)
      // Should wrap to left side
      expect(transform?.position.x).toBeLessThan(0)
    })

    it('should wrap x coordinate when exceeding left boundary', () => {
      const entityId = world.createEntity()
      // Position beyond left edge
      world.addComponent(entityId, new Transform(new Vector3(-1000, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, true))

      physicsSystem.update(world, 16.67)

      const transform = world.getComponent(entityId, Transform)
      // Should wrap to right side
      expect(transform?.position.x).toBeGreaterThan(0)
    })

    it('should wrap y coordinate when exceeding top boundary', () => {
      const entityId = world.createEntity()
      // Position beyond top edge (half height is 540 for 1080 screen)
      world.addComponent(entityId, new Transform(new Vector3(0, 600, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, true))

      physicsSystem.update(world, 16.67)

      const transform = world.getComponent(entityId, Transform)
      // Should wrap to bottom
      expect(transform?.position.y).toBeLessThan(0)
    })

    it('should wrap y coordinate when exceeding bottom boundary', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, -600, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, true))

      physicsSystem.update(world, 16.67)

      const transform = world.getComponent(entityId, Transform)
      // Should wrap to top
      expect(transform?.position.y).toBeGreaterThan(0)
    })

    it('should wrap z coordinate at boundaries', () => {
      const entityId = world.createEntity()
      // Z wrapping at 500 units (for 2.5D gameplay)
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 600)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, true))

      physicsSystem.update(world, 16.67)

      const transform = world.getComponent(entityId, Transform)
      // Should wrap to negative Z
      expect(transform?.position.z).toBeLessThan(0)
    })

    it('should not wrap when wrapScreen is false', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(1000, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, false)) // wrapScreen = false

      physicsSystem.update(world, 16.67)

      const transform = world.getComponent(entityId, Transform)
      // Should remain at 1000
      expect(transform?.position.x).toBeCloseTo(1000, 0)
    })

    it('should handle entities at exact boundary', () => {
      const entityId = world.createEntity()
      // Exactly at half width boundary
      world.addComponent(entityId, new Transform(new Vector3(960, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 300, true))

      physicsSystem.update(world, 16.67)

      const transform = world.getComponent(entityId, Transform)
      // Should not wrap (boundary is exclusive)
      expect(transform?.position.x).toBeCloseTo(960, 0)
    })
  })

  describe('Multiple Entities', () => {
    it('should process multiple entities independently', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Velocity(new Vector3(100, 0, 0)))
      world.addComponent(entity1, new Physics(1, 1, 300, false))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity2, new Velocity(new Vector3(0, 50, 0)))
      world.addComponent(entity2, new Physics(1, 1, 300, false))

      physicsSystem.update(world, 1000)

      const transform1 = world.getComponent(entity1, Transform)
      const transform2 = world.getComponent(entity2, Transform)

      expect(transform1?.position.x).toBeCloseTo(100, 0)
      expect(transform1?.position.y).toBeCloseTo(0, 0)
      expect(transform2?.position.x).toBeCloseTo(0, 0)
      expect(transform2?.position.y).toBeCloseTo(50, 0)
    })

    it('should only process entities with all required components', () => {
      // Entity with all components
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Velocity(new Vector3(100, 0, 0)))
      world.addComponent(entity1, new Physics(1, 1, 300, false))

      // Entity missing Physics component
      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity2, new Velocity(new Vector3(100, 0, 0)))

      physicsSystem.update(world, 1000)

      const transform1 = world.getComponent(entity1, Transform)
      const transform2 = world.getComponent(entity2, Transform)

      expect(transform1?.position.x).toBeCloseTo(100, 0)
      // Entity2 should not have moved
      expect(transform2?.position.x).toBeCloseTo(0, 0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero velocity', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(100, 100, 100)))
      world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Physics(1, 0.99, 300, false))

      physicsSystem.update(world, 1000)

      const transform = world.getComponent(entityId, Transform)
      expect(transform?.position.x).toBeCloseTo(100, 0)
      expect(transform?.position.y).toBeCloseTo(100, 0)
      expect(transform?.position.z).toBeCloseTo(100, 0)
    })

    it('should handle very small deltaTime', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(1000, 0, 0)))
      world.addComponent(entityId, new Physics(1, 1, 2000, false))

      // 1ms frame
      physicsSystem.update(world, 1)

      const transform = world.getComponent(entityId, Transform)
      // 1000 units/sec * 0.001 sec = 1 unit
      expect(transform?.position.x).toBeCloseTo(1, 0)
    })

    it('should handle zero deltaTime', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)))
      world.addComponent(entityId, new Physics(1, 0.99, 300, false))

      physicsSystem.update(world, 0)

      const transform = world.getComponent(entityId, Transform)
      const velocity = world.getComponent(entityId, Velocity)
      // Position should not change
      expect(transform?.position.x).toBeCloseTo(0, 0)
      // Velocity should not change (damping^0 = 1)
      expect(velocity?.linear.x).toBeCloseTo(100, 0)
    })
  })
})
