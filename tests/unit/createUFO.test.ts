/**
 * UFO Entity Factory Tests
 *
 * Tests for createUFO factory function that creates UFO entities
 * with all required components properly configured.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { createUFO } from '../../src/entities/createUFO'
import { Transform, Velocity, Physics, Collider, Health, Renderable } from '../../src/components'
import { UFO, UFO_CONFIG } from '../../src/components/UFO'

describe('createUFO', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('UFO Creation', () => {
    it('should create a UFO entity', () => {
      const ufoId = createUFO(world, { size: 'large' })
      expect(ufoId).toBeDefined()
      expect(typeof ufoId).toBe('number')
    })

    it('should add all required components to UFO', () => {
      const ufoId = createUFO(world, { size: 'large' })

      expect(world.getComponent(ufoId, Transform)).toBeDefined()
      expect(world.getComponent(ufoId, Velocity)).toBeDefined()
      expect(world.getComponent(ufoId, Physics)).toBeDefined()
      expect(world.getComponent(ufoId, Collider)).toBeDefined()
      expect(world.getComponent(ufoId, Health)).toBeDefined()
      expect(world.getComponent(ufoId, UFO)).toBeDefined()
      expect(world.getComponent(ufoId, Renderable)).toBeDefined()
    })
  })

  describe('Transform Configuration - Scale Removal', () => {
    it('should set scale to 1.0 for large UFO (no scale multiplier)', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const transform = world.getComponent<Transform>(ufoId, Transform)

      expect(transform?.scale).toEqual(new Vector3(1.0, 1.0, 1.0))
    })

    it('should set scale to 1.0 for small UFO', () => {
      const ufoId = createUFO(world, { size: 'small' })
      const transform = world.getComponent<Transform>(ufoId, Transform)

      expect(transform?.scale).toEqual(new Vector3(1.0, 1.0, 1.0))
    })

    it('should have zero rotation', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const transform = world.getComponent<Transform>(ufoId, Transform)

      expect(transform?.rotation.x).toBe(0)
      expect(transform?.rotation.y).toBe(0)
      expect(transform?.rotation.z).toBe(0)
    })
  })

  describe('Transform with Custom Position', () => {
    it('should respect provided spawn position', () => {
      const customPosition = new Vector3(100, 200, 0)
      const ufoId = createUFO(world, { size: 'large', position: customPosition })
      const transform = world.getComponent<Transform>(ufoId, Transform)

      expect(transform?.position).toEqual(customPosition)
    })
  })

  describe('Velocity Configuration', () => {
    it('should have velocity based on speed and direction', () => {
      const direction = new Vector3(1, 0, 0)
      const ufoId = createUFO(world, { size: 'large', direction })
      const velocity = world.getComponent<Velocity>(ufoId, Velocity)

      const expectedSpeed = UFO_CONFIG.large.speed
      expect(velocity?.linear.x).toBeCloseTo(expectedSpeed, 1)
      expect(velocity?.linear.y).toBeCloseTo(0, 1)
      expect(velocity?.linear.z).toBe(0)
    })

    it('should have zero angular velocity', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const velocity = world.getComponent<Velocity>(ufoId, Velocity)

      expect(velocity?.angular.x).toBe(0)
      expect(velocity?.angular.y).toBe(0)
      expect(velocity?.angular.z).toBe(0)
    })
  })

  describe('Physics Configuration', () => {
    it('should have mass of 1', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const physics = world.getComponent<Physics>(ufoId, Physics)

      expect(physics?.mass).toBe(1)
    })

    it('should have zero damping (maintains speed)', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const physics = world.getComponent<Physics>(ufoId, Physics)

      expect(physics?.damping).toBe(0)
    })

    it('should have screen wrapping enabled', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const physics = world.getComponent<Physics>(ufoId, Physics)

      expect(physics?.wrapScreen).toBe(true)
    })
  })

  describe('Collider Configuration', () => {
    it('should use sphere collision shape', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const collider = world.getComponent<Collider>(ufoId, Collider)

      expect(collider?.shape).toBe('sphere')
    })

    it('should have large UFO collider radius from config', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const collider = world.getComponent<Collider>(ufoId, Collider)

      expect(collider?.radius).toBe(UFO_CONFIG.large.colliderRadius)
    })

    it('should have small UFO collider radius from config', () => {
      const ufoId = createUFO(world, { size: 'small' })
      const collider = world.getComponent<Collider>(ufoId, Collider)

      expect(collider?.radius).toBe(UFO_CONFIG.small.colliderRadius)
    })

    it('should be on ufo layer', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const collider = world.getComponent<Collider>(ufoId, Collider)

      expect(collider?.layer).toBe('ufo')
    })

    it('should collide with player and projectiles', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const collider = world.getComponent<Collider>(ufoId, Collider)

      expect(collider?.mask).toContain('player')
      expect(collider?.mask).toContain('projectile')
    })

    it('should include asteroid in collision mask', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const collider = world.getComponent<Collider>(ufoId, Collider)

      expect(collider?.mask).toContain('asteroid')
    })

    it('should include asteroid in collision mask for small UFO', () => {
      const ufoId = createUFO(world, { size: 'small' })
      const collider = world.getComponent<Collider>(ufoId, Collider)

      expect(collider?.mask).toContain('asteroid')
    })
  })

  describe('Health Configuration', () => {
    it('should have max health of 1 (one-hit kill)', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const health = world.getComponent<Health>(ufoId, Health)

      expect(health?.max).toBe(1)
    })

    it('should have current health equal to max', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const health = world.getComponent<Health>(ufoId, Health)

      expect(health?.current).toBe(1)
    })
  })

  describe('UFO Component Configuration', () => {
    it('should have correct size for large UFO', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const ufo = world.getComponent<UFO>(ufoId, UFO)

      expect(ufo?.ufoSize).toBe('large')
      expect(ufo?.points).toBe(UFO_CONFIG.large.points)
    })

    it('should have correct size for small UFO', () => {
      const ufoId = createUFO(world, { size: 'small' })
      const ufo = world.getComponent<UFO>(ufoId, UFO)

      expect(ufo?.ufoSize).toBe('small')
      expect(ufo?.points).toBe(UFO_CONFIG.small.points)
    })
  })

  describe('Renderable Configuration', () => {
    it('should have correct mesh type for large UFO', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const renderable = world.getComponent<Renderable>(ufoId, Renderable)

      expect(renderable?.meshType).toBe('ufo_large')
    })

    it('should have correct mesh type for small UFO', () => {
      const ufoId = createUFO(world, { size: 'small' })
      const renderable = world.getComponent<Renderable>(ufoId, Renderable)

      expect(renderable?.meshType).toBe('ufo_small')
    })

    it('should use emissive material', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const renderable = world.getComponent<Renderable>(ufoId, Renderable)

      expect(renderable?.material).toBe('emissive')
    })

    it('should be visible initially', () => {
      const ufoId = createUFO(world, { size: 'large' })
      const renderable = world.getComponent<Renderable>(ufoId, Renderable)

      expect(renderable?.visible).toBe(true)
    })
  })

  describe('Multiple UFOs', () => {
    it('should create multiple UFO entities with unique IDs', () => {
      const ufo1 = createUFO(world, { size: 'large' })
      const ufo2 = createUFO(world, { size: 'small' })

      expect(ufo1).not.toBe(ufo2)
    })
  })
})
