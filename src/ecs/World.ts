/**
 * World - Main ECS orchestrator providing public API for entity/component/system operations.
 *
 * The World composes:
 * - EntityManager: Entity lifecycle management
 * - ComponentStorage: Component data storage and querying
 * - SystemManager: System registration and execution
 *
 * Following ADR-0001: ECS architecture for game entity management.
 */

import { ComponentStorage } from './ComponentStorage'
import { EntityManager } from './EntityManager'
import { SystemManager } from './SystemManager'
import type { Component, ComponentClass, EntityId, World as IWorld, System } from './types'

/**
 * The main ECS World implementation.
 * Provides a unified interface for all ECS operations.
 */
export class World implements IWorld {
  private entityManager: EntityManager
  private componentStorage: ComponentStorage
  private systemManager: SystemManager

  constructor() {
    this.entityManager = new EntityManager()
    this.componentStorage = new ComponentStorage()
    this.systemManager = new SystemManager()
  }

  // ========================================
  // Entity Operations
  // ========================================

  /**
   * Create a new entity with a unique ID.
   * @returns The EntityId of the newly created entity
   */
  createEntity(): EntityId {
    return this.entityManager.createEntity()
  }

  /**
   * Destroy an entity and remove all its components.
   * The entity ID will no longer be valid after destruction.
   * @param entityId - The entity to destroy
   */
  destroyEntity(entityId: EntityId): void {
    // Remove all components first
    this.componentStorage.removeAllComponents(entityId)
    // Then mark entity as destroyed
    this.entityManager.destroyEntity(entityId)
  }

  /**
   * Check if an entity is still alive (not destroyed).
   * @param entityId - The entity to check
   * @returns True if entity exists and is alive
   */
  isEntityAlive(entityId: EntityId): boolean {
    return this.entityManager.isAlive(entityId)
  }

  // ========================================
  // Component Operations
  // ========================================

  /**
   * Add a component to an entity.
   * If a component of the same type already exists, it will be replaced.
   * @param entityId - The entity to add component to
   * @param component - The component instance to add
   */
  addComponent<T extends Component>(entityId: EntityId, component: T): void {
    this.componentStorage.addComponent(entityId, component)
  }

  /**
   * Remove a component from an entity.
   * Safe to call if component doesn't exist.
   * @param entityId - The entity to remove component from
   * @param componentType - The component class to remove
   */
  removeComponent<T extends Component>(entityId: EntityId, componentType: ComponentClass<T>): void {
    this.componentStorage.removeComponent(entityId, componentType)
  }

  /**
   * Get a component from an entity.
   * @param entityId - The entity to get component from
   * @param componentType - The component class to retrieve
   * @returns The component instance or undefined if not found
   */
  getComponent<T extends Component>(
    entityId: EntityId,
    componentType: ComponentClass<T>
  ): T | undefined {
    return this.componentStorage.getComponent(entityId, componentType)
  }

  /**
   * Check if an entity has a specific component.
   * @param entityId - The entity to check
   * @param componentType - The component class to check for
   * @returns True if entity has the component
   */
  hasComponent<T extends Component>(entityId: EntityId, componentType: ComponentClass<T>): boolean {
    return this.componentStorage.hasComponent(entityId, componentType)
  }

  // ========================================
  // Query Operations
  // ========================================

  /**
   * Query for entities that have all specified component types.
   * Only returns entities that are still alive.
   * @param componentTypes - Component classes to query for
   * @returns Array of EntityIds that have all specified components
   */
  query<T extends Component[]>(
    ...componentTypes: { [K in keyof T]: ComponentClass<T[K]> }
  ): EntityId[] {
    const results = this.componentStorage.query(...componentTypes)
    // Filter to only include alive entities
    return results.filter((entityId) => this.entityManager.isAlive(entityId))
  }

  // ========================================
  // System Operations
  // ========================================

  /**
   * Register a system to be updated each frame.
   * Systems are executed in registration order.
   * @param system - The system to register
   */
  registerSystem(system: System): void {
    this.systemManager.registerSystem(system)
  }

  /**
   * Remove a system from the update loop.
   * @param system - The system to remove
   */
  removeSystem(system: System): void {
    this.systemManager.removeSystem(system)
  }

  /**
   * Update all registered systems.
   * Systems are executed in registration order.
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime: number): void {
    this.systemManager.updateAll(this, deltaTime)
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Get the count of alive entities.
   * @returns Number of alive entities in the world
   */
  getEntityCount(): number {
    return this.entityManager.getEntityCount()
  }

  /**
   * Get the count of registered systems.
   * @returns Number of registered systems
   */
  getSystemCount(): number {
    return this.systemManager.getSystemCount()
  }
}
