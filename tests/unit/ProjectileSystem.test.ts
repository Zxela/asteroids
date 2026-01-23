/**
 * Projectile System Tests
 *
 * Tests for ProjectileSystem that handles projectile updates including
 * homing logic for missiles that track targets.
 *
 * TDD RED Phase - These tests define expected behavior for ProjectileSystem.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { ProjectileSystem } from '../../src/systems/ProjectileSystem'
import { Transform, Velocity, Projectile, Asteroid } from '../../src/components'
import type { EntityId } from '../../src/ecs/types'

describe('ProjectileSystem', () => {
  let world: World
  let projectileSystem: ProjectileSystem

  beforeEach(() => {
    world = new World()
    projectileSystem = new ProjectileSystem()
  })

  describe('Basic Projectile Update', () => {
    it('should update projectile elapsed time', () => {
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform())
      world.addComponent(projectileId, new Velocity(new Vector3(100, 0, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(10, 1 as EntityId, 3000, 'single'))

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.elapsed).toBe(0)

      projectileSystem.update(world, 100)

      expect(projectile?.elapsed).toBe(100)
    })

    it('should mark expired projectiles for destruction', () => {
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform())
      world.addComponent(projectileId, new Velocity(new Vector3(100, 0, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(10, 1 as EntityId, 100, 'single'))

      // Update past lifetime
      projectileSystem.update(world, 150)

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.isExpired()).toBe(true)
    })
  })

  describe('Homing Projectile Tracking', () => {
    it('should track target entity when homingTarget is set', () => {
      // Create target asteroid
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(200, 0, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create homing projectile targeting the asteroid
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 300, 0), new Vector3())) // Moving up initially
      const projectileComp = new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId)
      world.addComponent(projectileId, projectileComp)

      // Update system
      projectileSystem.update(world, 100)

      // Velocity should have adjusted toward target (asteroid is to the right)
      const velocity = world.getComponent(projectileId, Velocity)
      expect(velocity).toBeDefined()
      // Should have some positive X component now (turning toward target)
      expect(velocity!.linear.x).toBeGreaterThan(0)
    })

    it('should update direction toward target each frame', () => {
      // Create target asteroid
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(100, 100, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create homing projectile
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId))

      const velocity = world.getComponent(projectileId, Velocity)
      const initialDirection = velocity!.linear.clone().normalize()

      // Update multiple frames
      projectileSystem.update(world, 50)
      projectileSystem.update(world, 50)

      const newDirection = velocity!.linear.clone().normalize()

      // Direction should have changed toward target
      expect(newDirection.x).not.toBe(initialDirection.x)
      expect(newDirection.y).not.toBe(initialDirection.y)
    })

    it('should limit turn rate by homing acceleration', () => {
      // Create target asteroid far to the side
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(1000, 0, 0))) // Far right
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create homing projectile moving up
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId))

      // Single frame update
      projectileSystem.update(world, 16) // ~60fps frame

      const velocity = world.getComponent(projectileId, Velocity)

      // Should not have turned completely toward target (limited by acceleration)
      // If instant lock-on, X would be ~300 and Y ~0
      // With limited turning, Y should still be significant
      expect(velocity!.linear.y).toBeGreaterThan(100)
    })

    it('should clear homingTarget when target is destroyed', () => {
      // Create target asteroid
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(200, 0, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create homing projectile
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      const projectileComp = new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId)
      world.addComponent(projectileId, projectileComp)

      // Destroy the target asteroid
      world.destroyEntity(asteroidId)

      // Update system
      projectileSystem.update(world, 100)

      // homingTarget should be cleared
      expect(projectileComp.homingTarget).toBeUndefined()
    })

    it('should continue straight when target is lost', () => {
      // Create target asteroid
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(200, 0, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create homing projectile
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId))

      // First update - should be tracking
      projectileSystem.update(world, 50)

      // Destroy target
      world.destroyEntity(asteroidId)

      // Get velocity before and after
      const velocity = world.getComponent(projectileId, Velocity)
      const velocityBeforeLoss = velocity!.linear.clone()

      // Update after target lost
      projectileSystem.update(world, 50)

      // Velocity direction should remain the same (continuing straight)
      const velocityAfterLoss = velocity!.linear.clone()
      expect(velocityAfterLoss.normalize().x).toBeCloseTo(velocityBeforeLoss.normalize().x, 1)
      expect(velocityAfterLoss.normalize().y).toBeCloseTo(velocityBeforeLoss.normalize().y, 1)
    })

    it('should maintain projectile speed during homing', () => {
      // Create target asteroid
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(200, 200, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create homing projectile at 300 speed
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId))

      const velocity = world.getComponent(projectileId, Velocity)
      const initialSpeed = velocity!.linear.length()

      // Update multiple frames
      projectileSystem.update(world, 100)
      projectileSystem.update(world, 100)

      const finalSpeed = velocity!.linear.length()

      // Speed should remain approximately the same (300 units/s)
      expect(finalSpeed).toBeCloseTo(initialSpeed, 0)
    })
  })

  describe('Non-homing Projectiles', () => {
    it('should not affect non-homing projectiles', () => {
      // Create regular single-shot projectile
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 400, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(10, 1 as EntityId, 3000, 'single'))

      const velocity = world.getComponent(projectileId, Velocity)
      const initialVelocity = velocity!.linear.clone()

      // Update system
      projectileSystem.update(world, 100)

      // Velocity should remain unchanged (no homing)
      expect(velocity!.linear.x).toBe(initialVelocity.x)
      expect(velocity!.linear.y).toBe(initialVelocity.y)
    })

    it('should not track targets for spread projectiles', () => {
      // Create asteroid
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(200, 0, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create spread projectile (should not home even if near asteroid)
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 350, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(5, 1 as EntityId, 3000, 'spread'))

      const velocity = world.getComponent(projectileId, Velocity)
      const initialVelocity = velocity!.linear.clone()

      projectileSystem.update(world, 100)

      // Velocity unchanged (not homing)
      expect(velocity!.linear.x).toBe(initialVelocity.x)
      expect(velocity!.linear.y).toBe(initialVelocity.y)
    })
  })

  describe('Edge Cases', () => {
    it('should handle projectile at same position as target', () => {
      // Create target asteroid at same position
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create homing projectile at same position
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId))

      // Should not throw
      expect(() => projectileSystem.update(world, 100)).not.toThrow()
    })

    it('should handle target behind projectile', () => {
      // Create target asteroid behind and slightly to the side
      // (not exactly opposite to avoid zero-crossing steering issues)
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(50, -200, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create homing projectile moving forward
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      world.addComponent(projectileId, new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId))

      // Update multiple frames - should start to turn around gradually
      for (let i = 0; i < 10; i++) {
        projectileSystem.update(world, 100)
      }

      const velocity = world.getComponent(projectileId, Velocity)
      // Should be turning (Y decreasing or X changing)
      // After turning, the velocity direction should have changed
      expect(velocity!.linear.x).toBeGreaterThan(0) // Should be turning toward the right
    })

    it('should handle multiple homing projectiles', () => {
      // Create single target asteroid
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(200, 0, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      // Create multiple homing projectiles
      const projectile1Id = world.createEntity()
      world.addComponent(projectile1Id, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectile1Id, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      world.addComponent(projectile1Id, new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId))

      const projectile2Id = world.createEntity()
      world.addComponent(projectile2Id, new Transform(new Vector3(0, 100, 0)))
      world.addComponent(projectile2Id, new Velocity(new Vector3(0, 300, 0), new Vector3()))
      world.addComponent(projectile2Id, new Projectile(20, 1 as EntityId, 3000, 'homing', asteroidId))

      // Should not throw
      expect(() => projectileSystem.update(world, 100)).not.toThrow()

      // Both should be tracking
      const velocity1 = world.getComponent(projectile1Id, Velocity)
      const velocity2 = world.getComponent(projectile2Id, Velocity)

      expect(velocity1!.linear.x).toBeGreaterThan(0)
      expect(velocity2!.linear.x).toBeGreaterThan(0)
    })
  })
})
