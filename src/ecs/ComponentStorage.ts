/**
 * ComponentStorage - Manages component data storage and querying.
 *
 * Responsible for:
 * - Storing components by entity and type
 * - Component retrieval, addition, and removal
 * - Efficient querying for entities with specific component combinations
 */

import type { Component, ComponentClass, EntityId } from './types'

/**
 * Stores and manages components for all entities.
 * Uses a two-level Map structure: ComponentClass -> EntityId -> Component
 */
export class ComponentStorage {
  /**
   * Storage structure: Map<ComponentClass.name, Map<EntityId, Component>>
   * Using class name as key allows proper component type resolution.
   */
  private storage: Map<string, Map<EntityId, Component>> = new Map()

  /**
   * Tracks which component types each entity has.
   * Enables efficient removal of all components for an entity.
   */
  private entityComponents: Map<EntityId, Set<string>> = new Map()

  /**
   * Add a component to an entity.
   * Replaces existing component of the same type if present.
   * @param entityId - The entity to add component to
   * @param component - The component instance to add
   */
  addComponent<T extends Component>(entityId: EntityId, component: T): void {
    const componentName = component.constructor.name

    // Get or create the storage map for this component type
    let typeStorage = this.storage.get(componentName)
    if (!typeStorage) {
      typeStorage = new Map()
      this.storage.set(componentName, typeStorage)
    }
    typeStorage.set(entityId, component)

    // Track which components this entity has
    let entityComps = this.entityComponents.get(entityId)
    if (!entityComps) {
      entityComps = new Set()
      this.entityComponents.set(entityId, entityComps)
    }
    entityComps.add(componentName)
  }

  /**
   * Remove a component from an entity.
   * Safe to call if component doesn't exist.
   * @param entityId - The entity to remove component from
   * @param componentType - The component class to remove
   */
  removeComponent<T extends Component>(entityId: EntityId, componentType: ComponentClass<T>): void {
    const componentName = componentType.name
    const typeStorage = this.storage.get(componentName)

    if (typeStorage) {
      typeStorage.delete(entityId)
    }

    const entityComps = this.entityComponents.get(entityId)
    if (entityComps) {
      entityComps.delete(componentName)
    }
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
    const componentName = componentType.name
    const typeStorage = this.storage.get(componentName)

    if (!typeStorage) {
      return undefined
    }

    return typeStorage.get(entityId) as T | undefined
  }

  /**
   * Check if an entity has a specific component.
   * @param entityId - The entity to check
   * @param componentType - The component class to check for
   * @returns True if entity has the component
   */
  hasComponent<T extends Component>(entityId: EntityId, componentType: ComponentClass<T>): boolean {
    const componentName = componentType.name
    const typeStorage = this.storage.get(componentName)

    if (!typeStorage) {
      return false
    }

    return typeStorage.has(entityId)
  }

  /**
   * Query for entities that have all specified component types.
   * Uses efficient set intersection for multi-component queries.
   * @param componentTypes - Variable number of component classes to query for
   * @returns Array of EntityIds that have all specified components
   */
  query<T extends Component[]>(
    ...componentTypes: { [K in keyof T]: ComponentClass<T[K]> }
  ): EntityId[] {
    if (componentTypes.length === 0) {
      return []
    }

    // Get entity sets for each component type
    const entitySets: Set<EntityId>[] = []

    for (const componentType of componentTypes) {
      const componentName = componentType.name
      const typeStorage = this.storage.get(componentName)

      if (!typeStorage || typeStorage.size === 0) {
        // If any component type has no entities, result is empty
        return []
      }

      entitySets.push(new Set(typeStorage.keys()))
    }

    // Start with the smallest set for efficiency
    entitySets.sort((a, b) => a.size - b.size)

    // Intersect all sets
    const result: EntityId[] = []
    const smallestSet = entitySets[0]

    // Safety check - should never happen due to early return above
    if (!smallestSet) {
      return []
    }

    const otherSets = entitySets.slice(1)

    for (const entityId of smallestSet) {
      let hasAll = true
      for (const set of otherSets) {
        if (!set.has(entityId)) {
          hasAll = false
          break
        }
      }
      if (hasAll) {
        result.push(entityId)
      }
    }

    return result
  }

  /**
   * Remove all components associated with an entity.
   * Used when destroying an entity.
   * @param entityId - The entity whose components should be removed
   */
  removeAllComponents(entityId: EntityId): void {
    const entityComps = this.entityComponents.get(entityId)

    if (entityComps) {
      for (const componentName of entityComps) {
        const typeStorage = this.storage.get(componentName)
        if (typeStorage) {
          typeStorage.delete(entityId)
        }
      }
      this.entityComponents.delete(entityId)
    }
  }

  /**
   * Get all component type names stored.
   * Useful for debugging and introspection.
   * @returns Array of component type names
   */
  getComponentTypes(): string[] {
    return Array.from(this.storage.keys())
  }
}
