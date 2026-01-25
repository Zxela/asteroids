/**
 * DamageSystem Unit Tests
 *
 * Tests for damage system processing collision events:
 * - Projectile-asteroid collisions apply damage and destroy projectile
 * - Asteroid-player collisions apply instant kill damage
 * - Respects player invulnerability
 * - Handles entities already destroyed
 * - Edge cases for missing components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { DamageSystem } from '../../src/systems/DamageSystem'
import { CollisionSystem, type CollisionEvent } from '../../src/systems/CollisionSystem'
import { Transform, Collider, Health, Player, Projectile, Asteroid } from '../../src/components'
import type { EntityId } from '../../src/ecs/types'

describe('DamageSystem', () => {
  let world: World
  let collisionSystem: CollisionSystem
  let damageSystem: DamageSystem

  beforeEach(() => {
    world = new World()
    collisionSystem = new CollisionSystem()
    damageSystem = new DamageSystem(collisionSystem)
  })

  /**
   * Helper to create a projectile entity
   */
  function createProjectile(damage = 10): EntityId {
    const id = world.createEntity()
    world.addComponent(id, new Transform(new Vector3(0, 0, 0)))
    world.addComponent(id, new Collider('sphere', 5, 'projectile', ['asteroid']))
    world.addComponent(id, new Projectile(damage))
    return id
  }

  /**
   * Helper to create an asteroid entity
   * Position at (20, 0, 0) to collide with entity at origin
   * Projectile radius 5 + asteroid radius 20 = 25 collision range
   * Distance 20 < 25 = collision
   */
  function createAsteroid(health = 30): EntityId {
    const id = world.createEntity()
    world.addComponent(id, new Transform(new Vector3(20, 0, 0)))
    world.addComponent(id, new Collider('sphere', 20, 'asteroid', ['player', 'projectile']))
    world.addComponent(id, new Health(health))
    world.addComponent(id, new Asteroid('large', 100))
    return id
  }

  /**
   * Helper to create a player entity
   */
  function createPlayer(): EntityId {
    const id = world.createEntity()
    world.addComponent(id, new Transform(new Vector3(0, 0, 0)))
    world.addComponent(id, new Collider('sphere', 20, 'player', ['asteroid', 'powerup']))
    world.addComponent(id, new Health(1))
    world.addComponent(id, new Player(3))
    return id
  }

  describe('Projectile-Asteroid Collisions', () => {
    it('should apply projectile damage to asteroid health', () => {
      const projectileId = createProjectile(10)
      const asteroidId = createAsteroid(30)

      // Run collision system to detect the collision
      collisionSystem.update(world, 16)

      // Verify collision was detected
      expect(collisionSystem.getCollisionCount()).toBe(1)

      const asteroidHealth = world.getComponent(asteroidId, Health)
      const initialHealth = asteroidHealth!.current

      // Run damage system
      damageSystem.update(world, 16)

      // Asteroid should have taken damage
      expect(asteroidHealth!.current).toBe(initialHealth - 10)
    })

    it('should destroy projectile after dealing damage', () => {
      const projectileId = createProjectile(10)
      createAsteroid(30)

      // Run collision system
      collisionSystem.update(world, 16)

      // Run damage system
      damageSystem.update(world, 16)

      // Projectile should be destroyed
      expect(world.isEntityAlive(projectileId)).toBe(false)
    })

    it('should handle different damage amounts', () => {
      const projectileId = createProjectile(25)
      const asteroidId = createAsteroid(100)

      collisionSystem.update(world, 16)
      damageSystem.update(world, 16)

      const asteroidHealth = world.getComponent(asteroidId, Health)
      expect(asteroidHealth!.current).toBe(75)
    })

    it('should handle projectile killing asteroid', () => {
      createProjectile(50)
      const asteroidId = createAsteroid(30)

      collisionSystem.update(world, 16)
      damageSystem.update(world, 16)

      const asteroidHealth = world.getComponent(asteroidId, Health)
      // Health should be reduced to 0 (or below)
      expect(asteroidHealth!.current).toBeLessThanOrEqual(0)
    })

    it('should handle collision with layer order reversed', () => {
      // Create asteroid first so it has lower entity ID
      const asteroidId = createAsteroid(30)
      const projectileId = createProjectile(10)

      // Update projectile position to be near asteroid (asteroid is at 20,0,0)
      const projectileTransform = world.getComponent(projectileId, Transform)
      projectileTransform!.position.set(40, 0, 0) // Within collision range of asteroid at 20

      collisionSystem.update(world, 16)

      // Should still detect collision regardless of entity ID order
      expect(collisionSystem.getCollisionCount()).toBe(1)

      const asteroidHealth = world.getComponent(asteroidId, Health)
      const initialHealth = asteroidHealth!.current

      damageSystem.update(world, 16)

      expect(asteroidHealth!.current).toBe(initialHealth - 10)
      expect(world.isEntityAlive(projectileId)).toBe(false)
    })
  })

  describe('Asteroid-Player Collisions', () => {
    it('should set player health to 0 on asteroid collision', () => {
      const playerId = createPlayer()
      const asteroidId = createAsteroid(30)

      // Position asteroid to collide with player
      const asteroidTransform = world.getComponent(asteroidId, Transform)
      asteroidTransform!.position.set(30, 0, 0)

      // Update player collider mask to include asteroid
      const playerCollider = world.getComponent(playerId, Collider)
      playerCollider!.mask = ['asteroid']

      collisionSystem.update(world, 16)
      expect(collisionSystem.getCollisionCount()).toBe(1)

      damageSystem.update(world, 16)

      const playerHealth = world.getComponent(playerId, Health)
      expect(playerHealth!.current).toBe(0)
    })

    it('should not damage invulnerable player', () => {
      const playerId = createPlayer()
      const asteroidId = createAsteroid(30)

      // Make player invulnerable
      const playerHealth = world.getComponent(playerId, Health)
      playerHealth!.setInvulnerable(3000)

      // Position asteroid to collide with player
      const asteroidTransform = world.getComponent(asteroidId, Transform)
      asteroidTransform!.position.set(30, 0, 0)

      collisionSystem.update(world, 16)
      damageSystem.update(world, 16)

      // Player health should remain at max
      expect(playerHealth!.current).toBe(playerHealth!.max)
    })

    it('should not destroy asteroid on player collision', () => {
      const playerId = createPlayer()
      const asteroidId = createAsteroid(30)

      const asteroidTransform = world.getComponent(asteroidId, Transform)
      asteroidTransform!.position.set(30, 0, 0)

      collisionSystem.update(world, 16)
      damageSystem.update(world, 16)

      // Asteroid should still exist (damage system doesn't destroy asteroids)
      expect(world.isEntityAlive(asteroidId)).toBe(true)
    })
  })

  describe('Multiple Collisions', () => {
    it('should process multiple projectile-asteroid collisions', () => {
      const projectile1 = createProjectile(10)
      const projectile2 = createProjectile(10)

      // Position projectiles
      const p1Transform = world.getComponent(projectile1, Transform)
      p1Transform!.position.set(0, 0, 0)

      const p2Transform = world.getComponent(projectile2, Transform)
      p2Transform!.position.set(0, 50, 0)

      // Create two asteroids at different positions
      const asteroid1 = world.createEntity()
      world.addComponent(asteroid1, new Transform(new Vector3(20, 0, 0)))
      world.addComponent(asteroid1, new Collider('sphere', 20, 'asteroid', ['projectile']))
      world.addComponent(asteroid1, new Health(30))
      world.addComponent(asteroid1, new Asteroid('large', 100))

      const asteroid2 = world.createEntity()
      world.addComponent(asteroid2, new Transform(new Vector3(20, 50, 0)))
      world.addComponent(asteroid2, new Collider('sphere', 20, 'asteroid', ['projectile']))
      world.addComponent(asteroid2, new Health(30))
      world.addComponent(asteroid2, new Asteroid('large', 100))

      collisionSystem.update(world, 16)
      damageSystem.update(world, 16)

      // Both projectiles should be destroyed
      expect(world.isEntityAlive(projectile1)).toBe(false)
      expect(world.isEntityAlive(projectile2)).toBe(false)

      // Both asteroids should have taken damage
      const health1 = world.getComponent(asteroid1, Health)
      const health2 = world.getComponent(asteroid2, Health)
      expect(health1!.current).toBe(20)
      expect(health2!.current).toBe(20)
    })

    it('should handle mixed collision types', () => {
      const playerId = createPlayer()
      const projectileId = createProjectile(10)
      const asteroidId = createAsteroid(30)

      // Position player to collide with asteroid
      // Player radius 20 + asteroid radius 20 = 40 collision range
      const playerTransform = world.getComponent(playerId, Transform)
      playerTransform!.position.set(0, 0, 0)

      const asteroidTransform = world.getComponent(asteroidId, Transform)
      asteroidTransform!.position.set(30, 0, 0) // Distance 30 < 40 = collision

      // Position projectile to also collide with asteroid
      // Projectile radius 5 + asteroid radius 20 = 25 collision range
      const projectileTransform = world.getComponent(projectileId, Transform)
      projectileTransform!.position.set(50, 0, 0) // Distance to asteroid at (30,0,0) = 20 < 25 = collision

      collisionSystem.update(world, 16)
      damageSystem.update(world, 16)

      // Player should be at 0 health
      const playerHealth = world.getComponent(playerId, Health)
      expect(playerHealth!.current).toBe(0)

      // Asteroid should also be at 0 health (fatal damage from ship collision)
      const asteroidHealth = world.getComponent(asteroidId, Health)
      expect(asteroidHealth!.current).toBe(0)

      // Projectile should be destroyed
      expect(world.isEntityAlive(projectileId)).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle already destroyed projectile', () => {
      const projectileId = createProjectile(10)
      const asteroidId = createAsteroid(30)

      // Manually destroy projectile before damage system runs
      collisionSystem.update(world, 16)
      world.destroyEntity(projectileId)

      // Should not throw
      expect(() => damageSystem.update(world, 16)).not.toThrow()

      // Asteroid should not take damage
      const asteroidHealth = world.getComponent(asteroidId, Health)
      expect(asteroidHealth!.current).toBe(30)
    })

    it('should handle already destroyed asteroid', () => {
      const projectileId = createProjectile(10)
      const asteroidId = createAsteroid(30)

      // Manually destroy asteroid before damage system runs
      collisionSystem.update(world, 16)
      world.destroyEntity(asteroidId)

      // Should not throw
      expect(() => damageSystem.update(world, 16)).not.toThrow()

      // Projectile should still exist (wasn't processed)
      expect(world.isEntityAlive(projectileId)).toBe(true)
    })

    it('should handle already destroyed player', () => {
      const playerId = createPlayer()
      const asteroidId = createAsteroid(30)

      const asteroidTransform = world.getComponent(asteroidId, Transform)
      asteroidTransform!.position.set(30, 0, 0)

      collisionSystem.update(world, 16)
      world.destroyEntity(playerId)

      // Should not throw
      expect(() => damageSystem.update(world, 16)).not.toThrow()
    })

    it('should handle projectile missing Projectile component', () => {
      const projectileId = world.createEntity()
      world.addComponent(projectileId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(projectileId, new Collider('sphere', 5, 'projectile', ['asteroid']))
      // No Projectile component

      const asteroidId = createAsteroid(30)

      collisionSystem.update(world, 16)

      // Should not throw
      expect(() => damageSystem.update(world, 16)).not.toThrow()

      // Asteroid should not take damage
      const asteroidHealth = world.getComponent(asteroidId, Health)
      expect(asteroidHealth!.current).toBe(30)
    })

    it('should handle asteroid missing Health component', () => {
      const projectileId = createProjectile(10)

      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(asteroidId, new Collider('sphere', 20, 'asteroid', ['projectile']))
      world.addComponent(asteroidId, new Asteroid('large', 100))
      // No Health component

      collisionSystem.update(world, 16)

      // Should not throw
      expect(() => damageSystem.update(world, 16)).not.toThrow()
    })

    it('should handle player missing Health component', () => {
      const playerId = world.createEntity()
      world.addComponent(playerId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(playerId, new Collider('sphere', 20, 'player', ['asteroid']))
      world.addComponent(playerId, new Player(3))
      // No Health component

      const asteroidId = createAsteroid(30)
      const asteroidTransform = world.getComponent(asteroidId, Transform)
      asteroidTransform!.position.set(30, 0, 0)

      collisionSystem.update(world, 16)

      // Should not throw
      expect(() => damageSystem.update(world, 16)).not.toThrow()
    })

    it('should handle no collisions', () => {
      // Create entities too far apart to collide
      createProjectile(10)
      const asteroidId = createAsteroid(30)

      const asteroidTransform = world.getComponent(asteroidId, Transform)
      asteroidTransform!.position.set(500, 0, 0)

      collisionSystem.update(world, 16)
      expect(collisionSystem.getCollisionCount()).toBe(0)

      // Should not throw
      expect(() => damageSystem.update(world, 16)).not.toThrow()
    })

    it('should handle empty world', () => {
      collisionSystem.update(world, 16)
      expect(() => damageSystem.update(world, 16)).not.toThrow()
    })
  })

  describe('System Properties', () => {
    it('should have correct systemType', () => {
      expect(damageSystem.systemType).toBe('damage')
    })

    it('should have empty requiredComponents', () => {
      expect(damageSystem.requiredComponents).toEqual([])
    })
  })

  describe('Collision Type Filtering', () => {
    it('should ignore powerup collisions', () => {
      const playerId = createPlayer()

      // Create a powerup-like entity
      const powerupId = world.createEntity()
      world.addComponent(powerupId, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(powerupId, new Collider('sphere', 15, 'powerup', ['player']))

      collisionSystem.update(world, 16)

      const playerHealth = world.getComponent(playerId, Health)
      const initialHealth = playerHealth!.current

      damageSystem.update(world, 16)

      // Player health should not change for powerup collision
      expect(playerHealth!.current).toBe(initialHealth)
    })

    it('should ignore projectile-player collisions', () => {
      const playerId = createPlayer()
      const projectileId = createProjectile(10)

      // Update projectile to collide with player layer (not typical but test case)
      const projectileCollider = world.getComponent(projectileId, Collider)
      projectileCollider!.mask = ['player']

      const playerCollider = world.getComponent(playerId, Collider)
      playerCollider!.mask = ['projectile']

      const projectileTransform = world.getComponent(projectileId, Transform)
      projectileTransform!.position.set(15, 0, 0)

      collisionSystem.update(world, 16)

      const playerHealth = world.getComponent(playerId, Health)
      const initialHealth = playerHealth!.current

      damageSystem.update(world, 16)

      // Player health should not change from projectile collision
      expect(playerHealth!.current).toBe(initialHealth)
      // Projectile should still exist (not processed)
      expect(world.isEntityAlive(projectileId)).toBe(true)
    })
  })
})
