/**
 * Projectile Entity Factory Tests
 *
 * Tests for createProjectile factory function and Projectile component.
 * Covers all weapon types: single, spread, laser, homing.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { createProjectile, type ProjectileConfig } from '../../src/entities/createProjectile'
import { Transform } from '../../src/components/Transform'
import { Velocity } from '../../src/components/Velocity'
import { Collider } from '../../src/components/Collider'
import { Renderable } from '../../src/components/Renderable'
import { Projectile } from '../../src/components/Projectile'

describe('createProjectile', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('Single Shot Projectile', () => {
    it('should create projectile with correct position', () => {
      const position = new Vector3(10, 20, 0)
      const direction = new Vector3(0, 1, 0)
      const projectileId = createProjectile(world, {
        position,
        direction,
        type: 'single',
        owner: 1 as any
      })

      const transform = world.getComponent(projectileId, Transform)
      expect(transform?.position.x).toBeCloseTo(10, 1)
      expect(transform?.position.y).toBeCloseTo(20, 1)
      expect(transform?.position.z).toBeCloseTo(0, 1)
    })

    it('should create projectile with correct direction velocity', () => {
      const position = new Vector3(0, 0, 0)
      const direction = new Vector3(0, 1, 0).normalize()
      const projectileId = createProjectile(world, {
        position,
        direction,
        type: 'single',
        owner: 1 as any
      })

      const velocity = world.getComponent(projectileId, Velocity)

      // Should move in up direction with speed 400 (default single shot speed)
      expect(velocity?.linear.y).toBeGreaterThan(0)
      expect(Math.abs(velocity?.linear.x ?? 0)).toBeLessThan(0.1)
    })

    it('should apply correct damage for single shot', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      // Single shot default damage is 10
      expect(projectile?.damage).toBe(10)
    })

    it('should have projectile lifetime of 3000ms', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.lifetime).toBe(3000)
      expect(projectile?.elapsed).toBe(0)
    })

    it('should not be expired immediately', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.isExpired()).toBe(false)
    })

    it('should track projectile type as single', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.projectileType).toBe('single')
    })
  })

  describe('Spread Shot Projectile', () => {
    it('should create spread projectile with correct type', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'spread',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.projectileType).toBe('spread')
    })

    it('should apply spread shot damage', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'spread',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      // Spread shot damage is 5 (weaker per projectile)
      expect(projectile?.damage).toBe(5)
    })
  })

  describe('Laser Projectile', () => {
    it('should create laser projectile with correct type', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'laser',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.projectileType).toBe('laser')
    })

    it('should apply laser damage', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'laser',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      // Laser damage is 2 (continuous but weaker per tick)
      expect(projectile?.damage).toBe(2)
    })

    it('should have higher projectile speed for laser', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        type: 'laser',
        owner: 1 as any
      })

      const velocity = world.getComponent(projectileId, Velocity)
      // Laser speed is 600 (faster than single shot)
      expect(velocity?.linear.length()).toBeCloseTo(600, 0)
    })
  })

  describe('Homing Missile', () => {
    it('should create homing missile with target', () => {
      const targetId = 42 as any
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'homing',
        owner: 1 as any,
        homingTarget: targetId
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.projectileType).toBe('homing')
      expect(projectile?.homingTarget).toBe(targetId)
    })

    it('should apply homing missile damage', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'homing',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      // Homing missile damage is 20 (stronger due to limited ammo)
      expect(projectile?.damage).toBe(20)
    })

    it('should have slower speed for homing missiles', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        type: 'homing',
        owner: 1 as any
      })

      const velocity = world.getComponent(projectileId, Velocity)
      // Homing speed is 300 (slower for tracking)
      expect(velocity?.linear.length()).toBeCloseTo(300, 0)
    })

    it('should allow homing missile without target', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'homing',
        owner: 1 as any
        // No homingTarget
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.projectileType).toBe('homing')
      expect(projectile?.homingTarget).toBeUndefined()
    })
  })

  describe('Collider Configuration', () => {
    it('should have projectile collision layer', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const collider = world.getComponent(projectileId, Collider)
      expect(collider?.layer).toBe('projectile')
    })

    it('should collide with asteroids', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const collider = world.getComponent(projectileId, Collider)
      expect(collider?.mask).toContain('asteroid')
    })

    it('should collide with boss', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const collider = world.getComponent(projectileId, Collider)
      expect(collider?.mask).toContain('boss')
    })

    it('should be sphere shape', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const collider = world.getComponent(projectileId, Collider)
      expect(collider?.shape).toBe('sphere')
    })

    it('should have small radius (5)', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const collider = world.getComponent(projectileId, Collider)
      expect(collider?.radius).toBe(5)
    })
  })

  describe('Velocity Configuration', () => {
    it('should set velocity based on weapon speed (single shot = 400)', () => {
      const direction = new Vector3(1, 0, 0)
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction,
        type: 'single',
        owner: 1 as any
      })

      const velocity = world.getComponent(projectileId, Velocity)
      expect(velocity?.linear.length()).toBeCloseTo(400, 0)
    })

    it('should respect custom speed', () => {
      const customSpeed = 500
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any,
        speed: customSpeed
      })

      const velocity = world.getComponent(projectileId, Velocity)
      expect(velocity?.linear.length()).toBeCloseTo(customSpeed, 0)
    })

    it('should have zero angular velocity', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const velocity = world.getComponent(projectileId, Velocity)
      expect(velocity?.angular.length()).toBeLessThan(0.01)
    })

    it('should handle diagonal direction correctly', () => {
      const direction = new Vector3(1, 1, 0).normalize()
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction,
        type: 'single',
        owner: 1 as any
      })

      const velocity = world.getComponent(projectileId, Velocity)
      // Should maintain overall speed of 400
      expect(velocity?.linear.length()).toBeCloseTo(400, 0)
      // Both x and y should be positive and roughly equal
      expect(velocity?.linear.x).toBeGreaterThan(0)
      expect(velocity?.linear.y).toBeGreaterThan(0)
    })
  })

  describe('Custom Configuration', () => {
    it('should accept custom damage', () => {
      const customDamage = 50
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any,
        damage: customDamage
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.damage).toBe(customDamage)
    })

    it('should accept custom lifetime', () => {
      const customLifetime = 5000
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any,
        lifetime: customLifetime
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.lifetime).toBe(customLifetime)
    })
  })

  describe('Owner Tracking', () => {
    it('should track owner entity', () => {
      const ownerId = 99 as any
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: ownerId
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.owner).toBe(ownerId)
    })
  })

  describe('Renderable Configuration', () => {
    it('should have correct mesh type for single shot', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const renderable = world.getComponent(projectileId, Renderable)
      expect(renderable?.meshType).toBe('projectile_default')
    })

    it('should have correct mesh type for spread shot', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'spread',
        owner: 1 as any
      })

      const renderable = world.getComponent(projectileId, Renderable)
      expect(renderable?.meshType).toBe('projectile_spread')
    })

    it('should have correct mesh type for laser', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'laser',
        owner: 1 as any
      })

      const renderable = world.getComponent(projectileId, Renderable)
      expect(renderable?.meshType).toBe('projectile_laser')
    })

    it('should have correct mesh type for homing', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'homing',
        owner: 1 as any
      })

      const renderable = world.getComponent(projectileId, Renderable)
      expect(renderable?.meshType).toBe('projectile_missile')
    })

    it('should have emissive material', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const renderable = world.getComponent(projectileId, Renderable)
      expect(renderable?.material).toBe('emissive')
    })

    it('should be visible by default', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const renderable = world.getComponent(projectileId, Renderable)
      expect(renderable?.visible).toBe(true)
    })
  })

  describe('Boss Projectile', () => {
    it('should create boss projectile with correct type', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'boss',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.projectileType).toBe('boss')
    })

    it('should have bossProjectile collision layer', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'boss',
        owner: 1 as any
      })

      const collider = world.getComponent(projectileId, Collider)
      expect(collider?.layer).toBe('bossProjectile')
    })

    it('should collide with player only', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'boss',
        owner: 1 as any
      })

      const collider = world.getComponent(projectileId, Collider)
      expect(collider?.mask).toContain('player')
      expect(collider?.mask).not.toContain('asteroid')
      expect(collider?.mask).not.toContain('boss')
    })

    it('should have boss projectile speed of 350', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        type: 'boss',
        owner: 1 as any
      })

      const velocity = world.getComponent(projectileId, Velocity)
      expect(velocity?.linear.length()).toBeCloseTo(350, 0)
    })

    it('should have correct mesh type for boss projectile', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'boss',
        owner: 1 as any
      })

      const renderable = world.getComponent(projectileId, Renderable)
      expect(renderable?.meshType).toBe('projectile_boss')
    })

    it('should have emissive material for boss projectile', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'boss',
        owner: 1 as any
      })

      const renderable = world.getComponent(projectileId, Renderable)
      expect(renderable?.material).toBe('emissive')
    })

    it('should accept custom damage for boss projectile (phase scaling)', () => {
      const phaseDamage = 30
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'boss',
        owner: 1 as any,
        damage: phaseDamage
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.damage).toBe(phaseDamage)
    })

    it('should apply default boss projectile damage when not specified', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'boss',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      // Boss projectile default damage is 15
      expect(projectile?.damage).toBe(15)
    })

    it('should support homing target for boss projectile', () => {
      const targetId = 42 as any
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'boss',
        owner: 1 as any,
        homingTarget: targetId
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.homingTarget).toBe(targetId)
    })
  })

  describe('Projectile Component Methods', () => {
    it('should track elapsed time correctly', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.elapsed).toBe(0)

      projectile?.updateElapsed(100)
      expect(projectile?.elapsed).toBe(100)

      projectile?.updateElapsed(500)
      expect(projectile?.elapsed).toBe(600)
    })

    it('should detect expired projectile', () => {
      const projectileId = createProjectile(world, {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0),
        type: 'single',
        owner: 1 as any,
        lifetime: 1000
      })

      const projectile = world.getComponent(projectileId, Projectile)
      expect(projectile?.isExpired()).toBe(false)

      projectile?.updateElapsed(999)
      expect(projectile?.isExpired()).toBe(false)

      projectile?.updateElapsed(1)
      expect(projectile?.isExpired()).toBe(true)
    })
  })
})
