/**
 * Ship Entity Factory Tests
 *
 * Tests for createShip factory function that creates the player ship entity
 * with all required components properly configured.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { createShip } from '../../src/entities/createShip'
import {
  Transform,
  Velocity,
  Physics,
  Collider,
  Health,
  Player,
  Renderable,
} from '../../src/components'
import { gameConfig } from '../../src/config'

describe('createShip', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('Ship Creation', () => {
    it('should create a ship entity', () => {
      const shipId = createShip(world)
      expect(shipId).toBeDefined()
      expect(typeof shipId).toBe('number')
    })

    it('should add all required components to ship', () => {
      const shipId = createShip(world)

      expect(world.getComponent(shipId, Transform)).toBeDefined()
      expect(world.getComponent(shipId, Velocity)).toBeDefined()
      expect(world.getComponent(shipId, Physics)).toBeDefined()
      expect(world.getComponent(shipId, Collider)).toBeDefined()
      expect(world.getComponent(shipId, Health)).toBeDefined()
      expect(world.getComponent(shipId, Player)).toBeDefined()
      expect(world.getComponent(shipId, Renderable)).toBeDefined()
    })
  })

  describe('Transform Configuration', () => {
    it('should position ship at screen center', () => {
      const shipId = createShip(world)
      const transform = world.getComponent<Transform>(shipId, Transform)

      expect(transform?.position.x).toBe(0)
      expect(transform?.position.y).toBe(0)
      expect(transform?.position.z).toBe(0)
    })

    it('should have no initial rotation', () => {
      const shipId = createShip(world)
      const transform = world.getComponent<Transform>(shipId, Transform)

      expect(transform?.rotation.x).toBe(0)
      expect(transform?.rotation.y).toBe(0)
      expect(transform?.rotation.z).toBe(0)
    })

    it('should have normal scale', () => {
      const shipId = createShip(world)
      const transform = world.getComponent<Transform>(shipId, Transform)

      expect(transform?.scale.x).toBe(1)
      expect(transform?.scale.y).toBe(1)
      expect(transform?.scale.z).toBe(1)
    })
  })

  describe('Velocity Configuration', () => {
    it('should have zero initial velocity', () => {
      const shipId = createShip(world)
      const velocity = world.getComponent<Velocity>(shipId, Velocity)

      expect(velocity?.linear.x).toBe(0)
      expect(velocity?.linear.y).toBe(0)
      expect(velocity?.linear.z).toBe(0)
      expect(velocity?.angular.x).toBe(0)
      expect(velocity?.angular.y).toBe(0)
      expect(velocity?.angular.z).toBe(0)
    })
  })

  describe('Physics Configuration', () => {
    it('should have mass of 1', () => {
      const shipId = createShip(world)
      const physics = world.getComponent<Physics>(shipId, Physics)

      expect(physics?.mass).toBe(1)
    })

    it('should have damping from config', () => {
      const shipId = createShip(world)
      const physics = world.getComponent<Physics>(shipId, Physics)

      expect(physics?.damping).toBe(gameConfig.physics.damping)
    })

    it('should have max speed from config', () => {
      const shipId = createShip(world)
      const physics = world.getComponent<Physics>(shipId, Physics)

      expect(physics?.maxSpeed).toBe(gameConfig.physics.shipMaxSpeed)
    })

    it('should have screen wrapping enabled', () => {
      const shipId = createShip(world)
      const physics = world.getComponent<Physics>(shipId, Physics)

      expect(physics?.wrapScreen).toBe(true)
    })
  })

  describe('Collider Configuration', () => {
    it('should use sphere collision shape', () => {
      const shipId = createShip(world)
      const collider = world.getComponent<Collider>(shipId, Collider)

      expect(collider?.shape).toBe('sphere')
    })

    it('should have radius of 12 (smaller for fair gameplay)', () => {
      const shipId = createShip(world)
      const collider = world.getComponent<Collider>(shipId, Collider)

      expect(collider?.radius).toBe(12)
    })

    it('should be on player layer', () => {
      const shipId = createShip(world)
      const collider = world.getComponent<Collider>(shipId, Collider)

      expect(collider?.layer).toBe('player')
    })

    it('should collide with asteroids, boss projectiles, and power-ups', () => {
      const shipId = createShip(world)
      const collider = world.getComponent<Collider>(shipId, Collider)

      expect(collider?.mask).toContain('asteroid')
      expect(collider?.mask).toContain('bossProjectile')
      expect(collider?.mask).toContain('powerup')
    })
  })

  describe('Health Configuration', () => {
    it('should have max health of 1', () => {
      const shipId = createShip(world)
      const health = world.getComponent<Health>(shipId, Health)

      expect(health?.max).toBe(1)
    })

    it('should have current health equal to max', () => {
      const shipId = createShip(world)
      const health = world.getComponent<Health>(shipId, Health)

      expect(health?.current).toBe(1)
    })

    it('should not be invulnerable initially', () => {
      const shipId = createShip(world)
      const health = world.getComponent<Health>(shipId, Health)

      expect(health?.invulnerable).toBe(false)
    })
  })

  describe('Player Configuration', () => {
    it('should have initial lives from config', () => {
      const shipId = createShip(world)
      const player = world.getComponent<Player>(shipId, Player)

      expect(player?.lives).toBe(gameConfig.gameplay.initialLives)
    })

    it('should have zero initial score', () => {
      const shipId = createShip(world)
      const player = world.getComponent<Player>(shipId, Player)

      expect(player?.score).toBe(0)
    })
  })

  describe('Renderable Configuration', () => {
    it('should have ship mesh type', () => {
      const shipId = createShip(world)
      const renderable = world.getComponent<Renderable>(shipId, Renderable)

      expect(renderable?.meshType).toBe('ship')
    })

    it('should use standard material', () => {
      const shipId = createShip(world)
      const renderable = world.getComponent<Renderable>(shipId, Renderable)

      expect(renderable?.material).toBe('standard')
    })

    it('should be visible initially', () => {
      const shipId = createShip(world)
      const renderable = world.getComponent<Renderable>(shipId, Renderable)

      expect(renderable?.visible).toBe(true)
    })
  })

  describe('Multiple Ships', () => {
    it('should create multiple ship entities with unique IDs', () => {
      const ship1 = createShip(world)
      const ship2 = createShip(world)

      expect(ship1).not.toBe(ship2)
    })

    it('should not share component instances between ships', () => {
      const ship1 = createShip(world)
      const ship2 = createShip(world)

      const transform1 = world.getComponent<Transform>(ship1, Transform)
      const transform2 = world.getComponent<Transform>(ship2, Transform)

      expect(transform1).not.toBe(transform2)
    })
  })
})
