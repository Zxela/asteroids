/**
 * Boss Entity Factory Tests
 *
 * Tests for createBoss factory function that creates boss entities
 * with all required components properly configured.
 *
 * Boss Types:
 * - Destroyer: Base health 100, aggressive, charge attacks
 * - Carrier: Base health 150, summons minions
 *
 * Health Scaling: base * (1 + (wave - 5) * 0.2)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { World } from '../../src/ecs/World'
import { createBoss, BOSS_CONFIG } from '../../src/entities/createBoss'
import {
  Transform,
  Velocity,
  Physics,
  Collider,
  Health,
  Renderable
} from '../../src/components'
import { Boss } from '../../src/components/Boss'

describe('createBoss', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('Boss Creation', () => {
    it('should create a boss entity with Destroyer type', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      expect(bossId).toBeDefined()
      expect(typeof bossId).toBe('number')
    })

    it('should create a boss entity with Carrier type', () => {
      const bossId = createBoss(world, 'carrier', 10)
      expect(bossId).toBeDefined()
      expect(typeof bossId).toBe('number')
    })

    it('should add all required components to boss', () => {
      const bossId = createBoss(world, 'destroyer', 5)

      expect(world.getComponent(bossId, Transform)).toBeDefined()
      expect(world.getComponent(bossId, Velocity)).toBeDefined()
      expect(world.getComponent(bossId, Physics)).toBeDefined()
      expect(world.getComponent(bossId, Collider)).toBeDefined()
      expect(world.getComponent(bossId, Health)).toBeDefined()
      expect(world.getComponent(bossId, Boss)).toBeDefined()
      expect(world.getComponent(bossId, Renderable)).toBeDefined()
    })
  })

  describe('Transform Configuration', () => {
    it('should position boss at screen center', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const transform = world.getComponent<Transform>(bossId, Transform)

      expect(transform?.position.x).toBe(0)
      expect(transform?.position.y).toBe(0)
      expect(transform?.position.z).toBe(0)
    })

    it('should have no initial rotation', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const transform = world.getComponent<Transform>(bossId, Transform)

      expect(transform?.rotation.x).toBe(0)
      expect(transform?.rotation.y).toBe(0)
      expect(transform?.rotation.z).toBe(0)
    })

    it('should have appropriate scale based on boss type', () => {
      const destroyerId = createBoss(world, 'destroyer', 5)
      const carrierId = createBoss(world, 'carrier', 10)

      const destroyerTransform = world.getComponent<Transform>(destroyerId, Transform)
      const carrierTransform = world.getComponent<Transform>(carrierId, Transform)

      expect(destroyerTransform?.scale.x).toBe(BOSS_CONFIG.destroyer.scale)
      expect(carrierTransform?.scale.x).toBe(BOSS_CONFIG.carrier.scale)
    })
  })

  describe('Velocity Configuration', () => {
    it('should have zero initial velocity (AI controls movement)', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const velocity = world.getComponent<Velocity>(bossId, Velocity)

      expect(velocity?.linear.x).toBe(0)
      expect(velocity?.linear.y).toBe(0)
      expect(velocity?.linear.z).toBe(0)
      expect(velocity?.angular.x).toBe(0)
      expect(velocity?.angular.y).toBe(0)
      expect(velocity?.angular.z).toBe(0)
    })
  })

  describe('Physics Configuration', () => {
    it('should have mass of 10', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const physics = world.getComponent<Physics>(bossId, Physics)

      expect(physics?.mass).toBe(10)
    })

    it('should have damping of 0 (no friction)', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const physics = world.getComponent<Physics>(bossId, Physics)

      expect(physics?.damping).toBe(0)
    })

    it('should have maxSpeed of 150', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const physics = world.getComponent<Physics>(bossId, Physics)

      expect(physics?.maxSpeed).toBe(150)
    })

    it('should have wrapScreen disabled', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const physics = world.getComponent<Physics>(bossId, Physics)

      expect(physics?.wrapScreen).toBe(false)
    })
  })

  describe('Collider Configuration', () => {
    it('should use sphere collision shape', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const collider = world.getComponent<Collider>(bossId, Collider)

      expect(collider?.shape).toBe('sphere')
    })

    it('should have radius of 50', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const collider = world.getComponent<Collider>(bossId, Collider)

      expect(collider?.radius).toBe(50)
    })

    it('should be on boss layer', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const collider = world.getComponent<Collider>(bossId, Collider)

      expect(collider?.layer).toBe('boss')
    })

    it('should collide with player and projectiles', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const collider = world.getComponent<Collider>(bossId, Collider)

      expect(collider?.mask).toContain('player')
      expect(collider?.mask).toContain('projectile')
    })
  })

  describe('Health Configuration', () => {
    it('should have Destroyer base health of 100 at wave 5', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const health = world.getComponent<Health>(bossId, Health)

      // Base health 100, wave 5: 100 * (1 + (5-5) * 0.2) = 100
      expect(health?.max).toBe(100)
      expect(health?.current).toBe(100)
    })

    it('should have Carrier base health of 150 at wave 10', () => {
      const bossId = createBoss(world, 'carrier', 10)
      const health = world.getComponent<Health>(bossId, Health)

      // Base health 150, wave 10: 150 * (1 + (10-5) * 0.2) = 150 * 2 = 300
      expect(health?.max).toBe(300)
      expect(health?.current).toBe(300)
    })

    it('should scale Destroyer health with wave level', () => {
      const bossWave10 = createBoss(world, 'destroyer', 10)
      const health10 = world.getComponent<Health>(bossWave10, Health)

      // Base 100, wave 10: 100 * (1 + (10-5) * 0.2) = 100 * 2 = 200
      expect(health10?.max).toBe(200)
    })

    it('should scale Carrier health with wave level', () => {
      const bossWave15 = createBoss(world, 'carrier', 15)
      const health15 = world.getComponent<Health>(bossWave15, Health)

      // Base 150, wave 15: 150 * (1 + (15-5) * 0.2) = 150 * 3 = 450
      expect(health15?.max).toBe(450)
    })

    it('should not be invulnerable initially', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const health = world.getComponent<Health>(bossId, Health)

      expect(health?.invulnerable).toBe(false)
    })
  })

  describe('Boss Component Configuration', () => {
    it('should have correct boss type for Destroyer', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const boss = world.getComponent<Boss>(bossId, Boss)

      expect(boss?.bossType).toBe('destroyer')
    })

    it('should have correct boss type for Carrier', () => {
      const bossId = createBoss(world, 'carrier', 10)
      const boss = world.getComponent<Boss>(bossId, Boss)

      expect(boss?.bossType).toBe('carrier')
    })

    it('should have initial phase of 1', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const boss = world.getComponent<Boss>(bossId, Boss)

      expect(boss?.phase).toBe(1)
    })

    it('should have phaseTimer of 0', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const boss = world.getComponent<Boss>(bossId, Boss)

      expect(boss?.phaseTimer).toBe(0)
    })

    it('should have initial attackPattern of idle', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const boss = world.getComponent<Boss>(bossId, Boss)

      expect(boss?.attackPattern).toBe('idle')
    })
  })

  describe('Renderable Configuration', () => {
    it('should have correct mesh type for Destroyer', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const renderable = world.getComponent<Renderable>(bossId, Renderable)

      expect(renderable?.meshType).toBe('boss_destroyer')
    })

    it('should have correct mesh type for Carrier', () => {
      const bossId = createBoss(world, 'carrier', 10)
      const renderable = world.getComponent<Renderable>(bossId, Renderable)

      expect(renderable?.meshType).toBe('boss_carrier')
    })

    it('should use emissive material', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const renderable = world.getComponent<Renderable>(bossId, Renderable)

      expect(renderable?.material).toBe('emissive')
    })

    it('should be visible initially', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const renderable = world.getComponent<Renderable>(bossId, Renderable)

      expect(renderable?.visible).toBe(true)
    })
  })

  describe('Health Scaling Edge Cases', () => {
    it('should handle wave 5 correctly (base case)', () => {
      const bossId = createBoss(world, 'destroyer', 5)
      const health = world.getComponent<Health>(bossId, Health)

      // Wave 5: 100 * (1 + (5-5) * 0.2) = 100 * 1 = 100
      expect(health?.max).toBe(100)
    })

    it('should handle wave 100 (high wave)', () => {
      const bossId = createBoss(world, 'destroyer', 100)
      const health = world.getComponent<Health>(bossId, Health)

      // Wave 100: 100 * (1 + (100-5) * 0.2) = 100 * (1 + 19) = 100 * 20 = 2000
      expect(health?.max).toBe(2000)
    })

    it('should ensure Carrier always has more health than Destroyer at same wave', () => {
      const destroyerId = createBoss(world, 'destroyer', 10)
      const carrierId = createBoss(world, 'carrier', 10)

      const destroyerHealth = world.getComponent<Health>(destroyerId, Health)
      const carrierHealth = world.getComponent<Health>(carrierId, Health)

      expect(carrierHealth!.max).toBeGreaterThan(destroyerHealth!.max)
    })
  })

  describe('Multiple Bosses', () => {
    it('should create multiple boss entities with unique IDs', () => {
      const boss1 = createBoss(world, 'destroyer', 5)
      const boss2 = createBoss(world, 'carrier', 10)

      expect(boss1).not.toBe(boss2)
    })

    it('should not share component instances between bosses', () => {
      const boss1 = createBoss(world, 'destroyer', 5)
      const boss2 = createBoss(world, 'carrier', 10)

      const transform1 = world.getComponent<Transform>(boss1, Transform)
      const transform2 = world.getComponent<Transform>(boss2, Transform)

      expect(transform1).not.toBe(transform2)
    })
  })
})
