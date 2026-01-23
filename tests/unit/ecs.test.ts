/**
 * ECS (Entity-Component-System) Unit Tests
 *
 * Tests for core ECS infrastructure:
 * - EntityManager: Entity creation/destruction, ID allocation
 * - ComponentStorage: Component add/remove/query
 * - SystemManager: System registration and execution
 * - World: Public API orchestrator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Types will be implemented in src/ecs/types.ts
import type {
  EntityId,
  Component,
  System,
  ComponentClass,
} from '../../src/ecs/types'

// Core ECS classes to be implemented
import { EntityManager } from '../../src/ecs/EntityManager'
import { ComponentStorage } from '../../src/ecs/ComponentStorage'
import { SystemManager } from '../../src/ecs/SystemManager'
import { World } from '../../src/ecs/World'

// Test component classes
class TestPositionComponent implements Component {
  x: number
  y: number
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }
}

class TestVelocityComponent implements Component {
  vx: number
  vy: number
  constructor(vx = 0, vy = 0) {
    this.vx = vx
    this.vy = vy
  }
}

class TestHealthComponent implements Component {
  current: number
  max: number
  constructor(current = 100, max = 100) {
    this.current = current
    this.max = max
  }
}

describe('EntityManager', () => {
  let entityManager: EntityManager

  beforeEach(() => {
    entityManager = new EntityManager()
  })

  describe('createEntity', () => {
    it('should return unique EntityId on creation', () => {
      const entity1 = entityManager.createEntity()
      const entity2 = entityManager.createEntity()
      const entity3 = entityManager.createEntity()

      expect(entity1).not.toBe(entity2)
      expect(entity2).not.toBe(entity3)
      expect(entity1).not.toBe(entity3)
    })

    it('should return sequential IDs', () => {
      const entity1 = entityManager.createEntity()
      const entity2 = entityManager.createEntity()

      expect(entity2).toBeGreaterThan(entity1)
    })
  })

  describe('destroyEntity', () => {
    it('should remove entity from alive set', () => {
      const entity = entityManager.createEntity()
      expect(entityManager.isAlive(entity)).toBe(true)

      entityManager.destroyEntity(entity)
      expect(entityManager.isAlive(entity)).toBe(false)
    })

    it('should handle destroying non-existent entity gracefully', () => {
      expect(() => entityManager.destroyEntity(999 as EntityId)).not.toThrow()
    })
  })

  describe('isAlive', () => {
    it('should return true for existing entities', () => {
      const entity = entityManager.createEntity()
      expect(entityManager.isAlive(entity)).toBe(true)
    })

    it('should return false for destroyed entities', () => {
      const entity = entityManager.createEntity()
      entityManager.destroyEntity(entity)
      expect(entityManager.isAlive(entity)).toBe(false)
    })

    it('should return false for never-created entity ID', () => {
      expect(entityManager.isAlive(9999 as EntityId)).toBe(false)
    })
  })

  describe('getAliveEntities', () => {
    it('should return all alive entities', () => {
      const entity1 = entityManager.createEntity()
      const entity2 = entityManager.createEntity()
      const entity3 = entityManager.createEntity()

      entityManager.destroyEntity(entity2)

      const alive = entityManager.getAliveEntities()
      expect(alive).toContain(entity1)
      expect(alive).not.toContain(entity2)
      expect(alive).toContain(entity3)
    })
  })
})

describe('ComponentStorage', () => {
  let storage: ComponentStorage
  let entityId: EntityId

  beforeEach(() => {
    storage = new ComponentStorage()
    entityId = 1 as EntityId
  })

  describe('addComponent', () => {
    it('should add component to entity', () => {
      const position = new TestPositionComponent(10, 20)
      storage.addComponent(entityId, position)

      const retrieved = storage.getComponent(entityId, TestPositionComponent)
      expect(retrieved).toBe(position)
    })

    it('should replace existing component of same type', () => {
      const position1 = new TestPositionComponent(10, 20)
      const position2 = new TestPositionComponent(30, 40)

      storage.addComponent(entityId, position1)
      storage.addComponent(entityId, position2)

      const retrieved = storage.getComponent(entityId, TestPositionComponent)
      expect(retrieved).toBe(position2)
    })
  })

  describe('removeComponent', () => {
    it('should remove component from entity', () => {
      const position = new TestPositionComponent(10, 20)
      storage.addComponent(entityId, position)
      storage.removeComponent(entityId, TestPositionComponent)

      const retrieved = storage.getComponent(entityId, TestPositionComponent)
      expect(retrieved).toBeUndefined()
    })

    it('should handle removing non-existent component gracefully', () => {
      expect(() =>
        storage.removeComponent(entityId, TestPositionComponent)
      ).not.toThrow()
    })
  })

  describe('getComponent', () => {
    it('should return undefined for non-existent component', () => {
      const retrieved = storage.getComponent(entityId, TestPositionComponent)
      expect(retrieved).toBeUndefined()
    })

    it('should return correct component type', () => {
      const position = new TestPositionComponent(10, 20)
      const velocity = new TestVelocityComponent(1, 2)

      storage.addComponent(entityId, position)
      storage.addComponent(entityId, velocity)

      const retrievedPos = storage.getComponent(entityId, TestPositionComponent)
      const retrievedVel = storage.getComponent(entityId, TestVelocityComponent)

      expect(retrievedPos).toBe(position)
      expect(retrievedVel).toBe(velocity)
    })
  })

  describe('hasComponent', () => {
    it('should return true when entity has component', () => {
      storage.addComponent(entityId, new TestPositionComponent())
      expect(storage.hasComponent(entityId, TestPositionComponent)).toBe(true)
    })

    it('should return false when entity lacks component', () => {
      expect(storage.hasComponent(entityId, TestPositionComponent)).toBe(false)
    })
  })

  describe('query', () => {
    it('should return entities with single component type', () => {
      const entity1 = 1 as EntityId
      const entity2 = 2 as EntityId
      const entity3 = 3 as EntityId

      storage.addComponent(entity1, new TestPositionComponent())
      storage.addComponent(entity2, new TestPositionComponent())
      storage.addComponent(entity3, new TestVelocityComponent())

      const results = storage.query(TestPositionComponent)
      expect(results).toContain(entity1)
      expect(results).toContain(entity2)
      expect(results).not.toContain(entity3)
    })

    it('should return entities with multiple component types', () => {
      const entity1 = 1 as EntityId
      const entity2 = 2 as EntityId
      const entity3 = 3 as EntityId

      storage.addComponent(entity1, new TestPositionComponent())
      storage.addComponent(entity1, new TestVelocityComponent())

      storage.addComponent(entity2, new TestPositionComponent())

      storage.addComponent(entity3, new TestVelocityComponent())

      const results = storage.query(TestPositionComponent, TestVelocityComponent)
      expect(results).toContain(entity1)
      expect(results).not.toContain(entity2)
      expect(results).not.toContain(entity3)
    })

    it('should return empty array when no entities match', () => {
      const results = storage.query(TestPositionComponent)
      expect(results).toEqual([])
    })

    it('should support query with 3 component types', () => {
      const entity1 = 1 as EntityId
      const entity2 = 2 as EntityId

      storage.addComponent(entity1, new TestPositionComponent())
      storage.addComponent(entity1, new TestVelocityComponent())
      storage.addComponent(entity1, new TestHealthComponent())

      storage.addComponent(entity2, new TestPositionComponent())
      storage.addComponent(entity2, new TestVelocityComponent())

      const results = storage.query(
        TestPositionComponent,
        TestVelocityComponent,
        TestHealthComponent
      )
      expect(results).toContain(entity1)
      expect(results).not.toContain(entity2)
    })
  })

  describe('removeAllComponents', () => {
    it('should remove all components for an entity', () => {
      storage.addComponent(entityId, new TestPositionComponent())
      storage.addComponent(entityId, new TestVelocityComponent())

      storage.removeAllComponents(entityId)

      expect(storage.hasComponent(entityId, TestPositionComponent)).toBe(false)
      expect(storage.hasComponent(entityId, TestVelocityComponent)).toBe(false)
    })
  })
})

describe('SystemManager', () => {
  let systemManager: SystemManager
  let mockWorld: World

  beforeEach(() => {
    systemManager = new SystemManager()
    mockWorld = {} as World
  })

  describe('registerSystem', () => {
    it('should register system successfully', () => {
      const system: System = {
        update: vi.fn(),
      }

      systemManager.registerSystem(system)

      // Verify system is registered by calling updateAll
      systemManager.updateAll(mockWorld, 16)
      expect(system.update).toHaveBeenCalledWith(mockWorld, 16)
    })
  })

  describe('removeSystem', () => {
    it('should remove system from manager', () => {
      const system: System = {
        update: vi.fn(),
      }

      systemManager.registerSystem(system)
      systemManager.removeSystem(system)

      systemManager.updateAll(mockWorld, 16)
      expect(system.update).not.toHaveBeenCalled()
    })

    it('should handle removing non-existent system gracefully', () => {
      const system: System = {
        update: vi.fn(),
      }

      expect(() => systemManager.removeSystem(system)).not.toThrow()
    })
  })

  describe('updateAll', () => {
    it('should execute systems in registration order', () => {
      const executionOrder: number[] = []

      const system1: System = {
        update: () => executionOrder.push(1),
      }
      const system2: System = {
        update: () => executionOrder.push(2),
      }
      const system3: System = {
        update: () => executionOrder.push(3),
      }

      systemManager.registerSystem(system1)
      systemManager.registerSystem(system2)
      systemManager.registerSystem(system3)

      systemManager.updateAll(mockWorld, 16)

      expect(executionOrder).toEqual([1, 2, 3])
    })

    it('should pass correct deltaTime to systems', () => {
      const system: System = {
        update: vi.fn(),
      }

      systemManager.registerSystem(system)
      systemManager.updateAll(mockWorld, 33.33)

      expect(system.update).toHaveBeenCalledWith(mockWorld, 33.33)
    })
  })

  describe('getSystems', () => {
    it('should return registered systems', () => {
      const system1: System = { update: vi.fn() }
      const system2: System = { update: vi.fn() }

      systemManager.registerSystem(system1)
      systemManager.registerSystem(system2)

      const systems = systemManager.getSystems()
      expect(systems).toContain(system1)
      expect(systems).toContain(system2)
    })
  })
})

describe('World', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('createEntity', () => {
    it('should create entity with unique ID', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()

      expect(entity1).not.toBe(entity2)
    })
  })

  describe('destroyEntity', () => {
    it('should remove entity and all its components', () => {
      const entity = world.createEntity()
      world.addComponent(entity, new TestPositionComponent())
      world.addComponent(entity, new TestVelocityComponent())

      world.destroyEntity(entity)

      expect(world.hasComponent(entity, TestPositionComponent)).toBe(false)
      expect(world.hasComponent(entity, TestVelocityComponent)).toBe(false)
    })

    it('should exclude destroyed entity from queries', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()

      world.addComponent(entity1, new TestPositionComponent())
      world.addComponent(entity2, new TestPositionComponent())

      world.destroyEntity(entity1)

      const results = world.query(TestPositionComponent)
      expect(results).not.toContain(entity1)
      expect(results).toContain(entity2)
    })
  })

  describe('addComponent', () => {
    it('should add component to entity', () => {
      const entity = world.createEntity()
      const position = new TestPositionComponent(10, 20)

      world.addComponent(entity, position)

      const retrieved = world.getComponent(entity, TestPositionComponent)
      expect(retrieved).toBe(position)
    })
  })

  describe('removeComponent', () => {
    it('should remove component from entity', () => {
      const entity = world.createEntity()
      world.addComponent(entity, new TestPositionComponent())

      world.removeComponent(entity, TestPositionComponent)

      expect(world.hasComponent(entity, TestPositionComponent)).toBe(false)
    })
  })

  describe('getComponent', () => {
    it('should return component if exists', () => {
      const entity = world.createEntity()
      const position = new TestPositionComponent(5, 10)
      world.addComponent(entity, position)

      const retrieved = world.getComponent(entity, TestPositionComponent)
      expect(retrieved).toBe(position)
    })

    it('should return undefined if component not exists', () => {
      const entity = world.createEntity()
      const retrieved = world.getComponent(entity, TestPositionComponent)
      expect(retrieved).toBeUndefined()
    })
  })

  describe('hasComponent', () => {
    it('should return true if entity has component', () => {
      const entity = world.createEntity()
      world.addComponent(entity, new TestPositionComponent())

      expect(world.hasComponent(entity, TestPositionComponent)).toBe(true)
    })

    it('should return false if entity lacks component', () => {
      const entity = world.createEntity()

      expect(world.hasComponent(entity, TestPositionComponent)).toBe(false)
    })
  })

  describe('query', () => {
    it('should return entities with specified components', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      const entity3 = world.createEntity()

      world.addComponent(entity1, new TestPositionComponent())
      world.addComponent(entity1, new TestVelocityComponent())

      world.addComponent(entity2, new TestPositionComponent())

      world.addComponent(entity3, new TestVelocityComponent())

      const results = world.query(TestPositionComponent, TestVelocityComponent)
      expect(results).toContain(entity1)
      expect(results).not.toContain(entity2)
      expect(results).not.toContain(entity3)
    })

    it('should filter out destroyed entities from query results', () => {
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()

      world.addComponent(entity1, new TestPositionComponent())
      world.addComponent(entity2, new TestPositionComponent())

      world.destroyEntity(entity1)

      const results = world.query(TestPositionComponent)
      expect(results).not.toContain(entity1)
      expect(results).toContain(entity2)
    })
  })

  describe('registerSystem', () => {
    it('should register system for updates', () => {
      const system: System = {
        update: vi.fn(),
      }

      world.registerSystem(system)
      world.update(16)

      expect(system.update).toHaveBeenCalledWith(world, 16)
    })
  })

  describe('removeSystem', () => {
    it('should remove system from updates', () => {
      const system: System = {
        update: vi.fn(),
      }

      world.registerSystem(system)
      world.removeSystem(system)
      world.update(16)

      expect(system.update).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should orchestrate all registered systems', () => {
      const executionOrder: string[] = []

      const inputSystem: System = {
        update: () => executionOrder.push('input'),
      }
      const physicsSystem: System = {
        update: () => executionOrder.push('physics'),
      }
      const renderSystem: System = {
        update: () => executionOrder.push('render'),
      }

      world.registerSystem(inputSystem)
      world.registerSystem(physicsSystem)
      world.registerSystem(renderSystem)

      world.update(16)

      expect(executionOrder).toEqual(['input', 'physics', 'render'])
    })

    it('should pass deltaTime to all systems', () => {
      const system: System = {
        update: vi.fn(),
      }

      world.registerSystem(system)
      world.update(33.33)

      expect(system.update).toHaveBeenCalledWith(world, 33.33)
    })
  })

  describe('isEntityAlive', () => {
    it('should return true for alive entities', () => {
      const entity = world.createEntity()
      expect(world.isEntityAlive(entity)).toBe(true)
    })

    it('should return false for destroyed entities', () => {
      const entity = world.createEntity()
      world.destroyEntity(entity)
      expect(world.isEntityAlive(entity)).toBe(false)
    })
  })
})

describe('ECS Integration', () => {
  it('should support complete ECS workflow', () => {
    const world = new World()

    // Create entities
    const player = world.createEntity()
    const enemy = world.createEntity()

    // Add components
    world.addComponent(player, new TestPositionComponent(0, 0))
    world.addComponent(player, new TestVelocityComponent(1, 0))
    world.addComponent(player, new TestHealthComponent(100, 100))

    world.addComponent(enemy, new TestPositionComponent(10, 10))
    world.addComponent(enemy, new TestVelocityComponent(-1, 0))
    world.addComponent(enemy, new TestHealthComponent(50, 50))

    // Create movement system
    const movementSystem: System = {
      update: (w: World, dt: number) => {
        const entities = w.query(TestPositionComponent, TestVelocityComponent)
        for (const entity of entities) {
          const pos = w.getComponent(entity, TestPositionComponent)!
          const vel = w.getComponent(entity, TestVelocityComponent)!
          pos.x += vel.vx * dt
          pos.y += vel.vy * dt
        }
      },
    }

    world.registerSystem(movementSystem)

    // Run update
    world.update(1)

    // Verify positions updated
    const playerPos = world.getComponent(player, TestPositionComponent)!
    const enemyPos = world.getComponent(enemy, TestPositionComponent)!

    expect(playerPos.x).toBe(1)
    expect(playerPos.y).toBe(0)
    expect(enemyPos.x).toBe(9)
    expect(enemyPos.y).toBe(10)
  })

  it('should handle entity destruction during system update', () => {
    const world = new World()

    const entity1 = world.createEntity()
    const entity2 = world.createEntity()

    world.addComponent(entity1, new TestHealthComponent(0, 100)) // Dead
    world.addComponent(entity2, new TestHealthComponent(50, 100)) // Alive

    const destroyDeadSystem: System = {
      update: (w: World) => {
        const entities = w.query(TestHealthComponent)
        for (const entity of entities) {
          const health = w.getComponent(entity, TestHealthComponent)!
          if (health.current <= 0) {
            w.destroyEntity(entity)
          }
        }
      },
    }

    world.registerSystem(destroyDeadSystem)
    world.update(16)

    expect(world.isEntityAlive(entity1)).toBe(false)
    expect(world.isEntityAlive(entity2)).toBe(true)
  })
})

describe('Query Performance', () => {
  it('should query 100 entities in acceptable time (<1ms)', () => {
    const world = new World()

    // Create 100 entities with components
    for (let i = 0; i < 100; i++) {
      const entity = world.createEntity()
      world.addComponent(entity, new TestPositionComponent(i, i))
      if (i % 2 === 0) {
        world.addComponent(entity, new TestVelocityComponent(1, 1))
      }
    }

    const start = performance.now()
    const results = world.query(TestPositionComponent, TestVelocityComponent)
    const elapsed = performance.now() - start

    expect(results.length).toBe(50)
    expect(elapsed).toBeLessThan(1) // Should complete in <1ms
  })
})
