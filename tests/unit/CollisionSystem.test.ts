/**
 * CollisionSystem and SpatialGrid Unit Tests
 *
 * Tests for collision detection system including:
 * - SpatialGrid: Broad-phase collision optimization
 * - CollisionSystem: Circle-circle collision detection
 * - Layer/mask filtering
 * - Performance budget verification
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { SpatialGrid } from '../../src/utils/SpatialGrid'
import { CollisionSystem } from '../../src/systems/CollisionSystem'
import { Transform } from '../../src/components/Transform'
import { Collider } from '../../src/components/Collider'

// ============================================
// SpatialGrid Tests
// ============================================

describe('SpatialGrid', () => {
  let grid: SpatialGrid

  beforeEach(() => {
    grid = new SpatialGrid({
      cellSize: 100,
      width: 1920,
      height: 1080
    })
  })

  describe('Insertion and Query', () => {
    it('should insert entity into grid', () => {
      const position = new Vector3(50, 50, 0)
      grid.insert(1, position)

      const nearby = grid.query(position, 50)
      expect(nearby.has(1)).toBe(true)
    })

    it('should query nearby entities', () => {
      grid.insert(1, new Vector3(0, 0, 0))
      grid.insert(2, new Vector3(50, 0, 0))
      grid.insert(3, new Vector3(500, 0, 0))

      const nearby = grid.query(new Vector3(0, 0, 0), 100)
      expect(nearby.has(1)).toBe(true)
      expect(nearby.has(2)).toBe(true)
      expect(nearby.has(3)).toBe(false)
    })

    it('should handle entities spanning multiple cells', () => {
      // Entity at cell boundary
      grid.insert(1, new Vector3(99, 99, 0))

      // Query should find entity due to radius spanning cells
      const nearby = grid.query(new Vector3(101, 101, 0), 50)
      expect(nearby.has(1)).toBe(true)
    })

    it('should clear grid', () => {
      grid.insert(1, new Vector3(0, 0, 0))
      grid.clear()

      const nearby = grid.query(new Vector3(0, 0, 0), 50)
      expect(nearby.size).toBe(0)
    })

    it('should return empty set for query with no entities', () => {
      const nearby = grid.query(new Vector3(0, 0, 0), 50)
      expect(nearby.size).toBe(0)
    })

    it('should handle multiple entities in same cell', () => {
      grid.insert(1, new Vector3(10, 10, 0))
      grid.insert(2, new Vector3(20, 20, 0))
      grid.insert(3, new Vector3(30, 30, 0))

      const nearby = grid.query(new Vector3(15, 15, 0), 50)
      expect(nearby.has(1)).toBe(true)
      expect(nearby.has(2)).toBe(true)
      expect(nearby.has(3)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle large radius queries', () => {
      grid.insert(1, new Vector3(0, 0, 0))
      grid.insert(2, new Vector3(300, 300, 0))

      const nearby = grid.query(new Vector3(0, 0, 0), 500)
      expect(nearby.has(1)).toBe(true)
      expect(nearby.has(2)).toBe(true)
    })

    it('should handle negative coordinates', () => {
      grid.insert(1, new Vector3(-100, -100, 0))

      const nearby = grid.query(new Vector3(-100, -100, 0), 50)
      expect(nearby.has(1)).toBe(true)
    })

    it('should handle zero radius query', () => {
      grid.insert(1, new Vector3(50, 50, 0))

      // Zero radius query at exact position should still find entity in same cell
      const nearby = grid.query(new Vector3(50, 50, 0), 0)
      expect(nearby.has(1)).toBe(true)
    })

    it('should handle very large coordinates', () => {
      grid.insert(1, new Vector3(10000, 10000, 0))

      const nearby = grid.query(new Vector3(10000, 10000, 0), 50)
      expect(nearby.has(1)).toBe(true)
    })
  })

  describe('Insert with Custom Radius', () => {
    it('should insert entity with specified radius', () => {
      // Insert entity at cell boundary with large radius
      grid.insert(1, new Vector3(50, 50, 0), 80)

      // Entity should be found even when query position is outside its direct cell
      const nearby = grid.query(new Vector3(130, 50, 0), 10)
      expect(nearby.has(1)).toBe(true)
    })
  })
})

// ============================================
// CollisionSystem Tests
// ============================================

describe('CollisionSystem', () => {
  let world: World
  let collisionSystem: CollisionSystem

  beforeEach(() => {
    world = new World()
    collisionSystem = new CollisionSystem()
  })

  describe('Circle Collision Detection', () => {
    it('should detect overlapping circles', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBeGreaterThan(0)
    })

    it('should not detect non-overlapping circles', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(100, 0, 0)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })

    it('should detect barely touching circles', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(39, 0, 0))) // Just inside collision range
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBeGreaterThan(0)
    })

    it('should not detect circles exactly at touch distance', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(40, 0, 0))) // Exactly touching
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)

      // Circles exactly touching (distance = radius1 + radius2) are not considered colliding
      expect(collisionSystem.getCollisionCount()).toBe(0)
    })
  })

  describe('Layer and Mask Filtering', () => {
    it('should not collide if layer/mask incompatible', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['projectile'])) // Only hits projectiles

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player'])) // Not in player's mask

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })

    it('should collide with correct layers', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid', 'projectile']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player', 'projectile']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBeGreaterThan(0)
    })

    it('should not collide with self', () => {
      const entity = world.createEntity()
      world.addComponent(entity, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity, new Collider('sphere', 20, 'player', ['player']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })

    it('should require both masks to match for collision', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      // Asteroid does NOT include player in its mask
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['projectile']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })
  })

  describe('Disabled Colliders', () => {
    it('should skip disabled colliders', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      const collider1 = new Collider('sphere', 20, 'player', ['asteroid'])
      collider1.enabled = false
      world.addComponent(entity1, collider1)

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })

    it('should skip when both colliders are disabled', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      const collider1 = new Collider('sphere', 20, 'player', ['asteroid'])
      collider1.enabled = false
      world.addComponent(entity1, collider1)

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      const collider2 = new Collider('sphere', 20, 'asteroid', ['player'])
      collider2.enabled = false
      world.addComponent(entity2, collider2)

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })
  })

  describe('Performance', () => {
    it('should complete collision check within 5ms budget for 20 entities', () => {
      // Create 20 entities
      for (let i = 0; i < 20; i++) {
        const entity = world.createEntity()
        world.addComponent(entity, new Transform(new Vector3(i * 50, i * 30, 0)))
        world.addComponent(
          entity,
          new Collider('sphere', 20, i % 2 === 0 ? 'player' : 'asteroid', [
            i % 2 === 0 ? 'asteroid' : 'player'
          ])
        )
      }

      const startTime = performance.now()
      collisionSystem.update(world, 16)
      const endTime = performance.now()

      const elapsedTime = endTime - startTime
      expect(elapsedTime).toBeLessThan(5)
    })

    it('should handle high entity count reasonably', () => {
      // Create 50 entities
      for (let i = 0; i < 50; i++) {
        const entity = world.createEntity()
        world.addComponent(
          entity,
          new Transform(
            new Vector3((i % 10) * 100 - 450, Math.floor(i / 10) * 100 - 225, 0)
          )
        )
        world.addComponent(
          entity,
          new Collider('sphere', 20, 'asteroid', ['projectile', 'player'])
        )
      }

      const startTime = performance.now()
      collisionSystem.update(world, 16)
      const endTime = performance.now()

      const elapsedTime = endTime - startTime
      // Should still be reasonably fast (less than 5ms target)
      expect(elapsedTime).toBeLessThan(5)
    })

    it('should track frame time', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getLastFrameTime()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Multiple Collisions', () => {
    it('should detect multiple simultaneous collisions', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 50, 'player', ['asteroid']))

      // Create 3 asteroids near the player - all within collision range
      // Player radius 50 + asteroid radius 20 = 70 units collision range
      const positions = [
        new Vector3(40, 0, 0), // 40 < 70, will collide
        new Vector3(0, 40, 0), // 40 < 70, will collide
        new Vector3(-40, 0, 0) // 40 < 70, will collide
      ]

      for (const pos of positions) {
        const entity = world.createEntity()
        world.addComponent(entity, new Transform(pos))
        world.addComponent(entity, new Collider('sphere', 20, 'asteroid', ['player']))
      }

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(3)
    })

    it('should not duplicate collision pairs', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)

      // Should only have 1 collision, not 2 (A-B and B-A)
      expect(collisionSystem.getCollisionCount()).toBe(1)
    })
  })

  describe('Collision Events', () => {
    it('should store collision data with correct entity pairs', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)

      const collisions = collisionSystem.getCollisions()
      expect(collisions.length).toBe(1)
      expect(collisions[0].entity1).toBeDefined()
      expect(collisions[0].entity2).toBeDefined()
      expect(collisions[0].distance).toBeDefined()
    })

    it('should clear collisions between frames', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)
      expect(collisionSystem.getCollisionCount()).toBe(1)

      // Move entities apart
      const transform2 = world.getComponent(entity2, Transform)
      if (transform2) {
        transform2.position.set(100, 0, 0)
      }

      collisionSystem.update(world, 16)
      expect(collisionSystem.getCollisionCount()).toBe(0)
    })
  })

  describe('Boss Projectile Collisions', () => {
    it('should detect boss projectile collision with player', () => {
      const playerEntity = world.createEntity()
      world.addComponent(playerEntity, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(
        playerEntity,
        new Collider('sphere', 20, 'player', ['asteroid', 'powerup', 'bossProjectile'])
      )

      const bossProjectile = world.createEntity()
      // Player radius 20 + projectile radius 5 = 25 collision range
      // Position at 20 < 25, so they will collide
      world.addComponent(bossProjectile, new Transform(new Vector3(20, 0, 0)))
      world.addComponent(
        bossProjectile,
        new Collider('sphere', 5, 'bossProjectile', ['player'])
      )

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(1)
      const collisions = collisionSystem.getCollisions()
      expect(collisions[0].layer1).toBe('player')
      expect(collisions[0].layer2).toBe('bossProjectile')
    })

    it('should not detect boss projectile collision with asteroid', () => {
      const asteroidEntity = world.createEntity()
      world.addComponent(asteroidEntity, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(
        asteroidEntity,
        new Collider('sphere', 30, 'asteroid', ['player', 'projectile'])
      )

      const bossProjectile = world.createEntity()
      world.addComponent(bossProjectile, new Transform(new Vector3(25, 0, 0)))
      world.addComponent(
        bossProjectile,
        new Collider('sphere', 5, 'bossProjectile', ['player'])
      )

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })

    it('should not detect boss projectile collision with boss', () => {
      const bossEntity = world.createEntity()
      world.addComponent(bossEntity, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(
        bossEntity,
        new Collider('sphere', 50, 'boss', ['player', 'projectile'])
      )

      const bossProjectile = world.createEntity()
      world.addComponent(bossProjectile, new Transform(new Vector3(30, 0, 0)))
      world.addComponent(
        bossProjectile,
        new Collider('sphere', 5, 'bossProjectile', ['player'])
      )

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })

    it('should not detect boss projectile collision with player projectile', () => {
      const playerProjectile = world.createEntity()
      world.addComponent(playerProjectile, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(
        playerProjectile,
        new Collider('sphere', 5, 'projectile', ['asteroid', 'boss'])
      )

      const bossProjectile = world.createEntity()
      world.addComponent(bossProjectile, new Transform(new Vector3(5, 0, 0)))
      world.addComponent(
        bossProjectile,
        new Collider('sphere', 5, 'bossProjectile', ['player'])
      )

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(0)
    })

    it('should detect multiple boss projectiles colliding with player', () => {
      const playerEntity = world.createEntity()
      world.addComponent(playerEntity, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(
        playerEntity,
        new Collider('sphere', 30, 'player', ['asteroid', 'powerup', 'bossProjectile'])
      )

      // Create 3 boss projectiles near the player
      const positions = [
        new Vector3(20, 0, 0),
        new Vector3(0, 20, 0),
        new Vector3(-20, 0, 0)
      ]

      for (const pos of positions) {
        const projectile = world.createEntity()
        world.addComponent(projectile, new Transform(pos))
        world.addComponent(
          projectile,
          new Collider('sphere', 5, 'bossProjectile', ['player'])
        )
      }

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(3)
    })
  })

  describe('Z-Axis Collision (2.5D)', () => {
    it('should ignore Z-axis for collision detection', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entity1, new Collider('sphere', 20, 'player', ['asteroid']))

      const entity2 = world.createEntity()
      // Same X/Y but different Z - should still collide in 2.5D
      world.addComponent(entity2, new Transform(new Vector3(30, 0, 100)))
      world.addComponent(entity2, new Collider('sphere', 20, 'asteroid', ['player']))

      collisionSystem.update(world, 16)

      expect(collisionSystem.getCollisionCount()).toBe(1)
    })
  })
})
