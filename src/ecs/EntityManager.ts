/**
 * EntityManager - Manages entity lifecycle in the ECS system.
 *
 * Responsible for:
 * - Entity creation with unique ID allocation
 * - Entity destruction
 * - Tracking alive entities
 */

import type { EntityId } from './types'

/**
 * Manages entity creation, destruction, and lifecycle tracking.
 */
export class EntityManager {
  /** Counter for generating unique entity IDs */
  private nextId = 1

  /** Set of currently alive entity IDs */
  private aliveEntities: Set<EntityId> = new Set()

  /**
   * Create a new entity with a unique ID.
   * @returns The EntityId of the newly created entity
   */
  createEntity(): EntityId {
    const id = this.nextId as EntityId
    this.nextId++
    this.aliveEntities.add(id)
    return id
  }

  /**
   * Destroy an entity, removing it from the alive set.
   * Safe to call on non-existent entities.
   * @param entityId - The entity to destroy
   */
  destroyEntity(entityId: EntityId): void {
    this.aliveEntities.delete(entityId)
  }

  /**
   * Check if an entity is currently alive.
   * @param entityId - The entity to check
   * @returns True if the entity exists and has not been destroyed
   */
  isAlive(entityId: EntityId): boolean {
    return this.aliveEntities.has(entityId)
  }

  /**
   * Get all currently alive entities.
   * @returns Array of alive EntityIds
   */
  getAliveEntities(): EntityId[] {
    return Array.from(this.aliveEntities)
  }

  /**
   * Get the count of alive entities.
   * @returns Number of alive entities
   */
  getEntityCount(): number {
    return this.aliveEntities.size
  }
}
