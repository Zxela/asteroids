/**
 * Core ECS Types
 *
 * Type definitions for the Entity-Component-System architecture.
 * These types define the contracts for entities, components, systems, and the world.
 */

/**
 * Unique identifier for an entity.
 * Uses a branded type pattern for type safety - prevents accidental use of regular numbers.
 */
export type EntityId = number & { readonly __entityId: unique symbol }

/**
 * Component type identifier string.
 * Used for runtime component type identification and queries.
 */
export type ComponentType = string

/**
 * Base component interface - all components must implement this.
 * Components are pure data containers with no behavior.
 */
export interface Component {
  readonly type: ComponentType
}

/**
 * System interface - logic operators on component sets.
 * Systems contain all game logic and operate on entities with specific component combinations.
 */
export interface System {
  /** List of component types required for this system to process an entity */
  readonly requiredComponents: ComponentType[]

  /**
   * Update method called each frame for matching entities
   * @param deltaTime Time elapsed since last frame in seconds
   * @param entities Array of entity IDs that match requiredComponents
   * @param world Reference to the ECS world for component access
   */
  update(deltaTime: number, entities: EntityId[], world: World): void
}

/**
 * ECS World interface - the central orchestrator for entity management.
 * Provides methods for entity creation, component management, and system registration.
 */
export interface World {
  /**
   * Create a new entity with a unique ID
   * @returns The newly created entity ID
   */
  createEntity(): EntityId

  /**
   * Destroy an entity and remove all its components
   * @param id The entity ID to destroy
   */
  destroyEntity(id: EntityId): void

  /**
   * Add a component to an entity
   * @param entity The target entity ID
   * @param component The component instance to add
   */
  addComponent<T extends Component>(entity: EntityId, component: T): void

  /**
   * Remove a component from an entity by type
   * @param entity The target entity ID
   * @param type The component type to remove
   */
  removeComponent(entity: EntityId, type: ComponentType): void

  /**
   * Get a component from an entity
   * @param entity The target entity ID
   * @param type The component type to retrieve
   * @returns The component instance or undefined if not found
   */
  getComponent<T extends Component>(entity: EntityId, type: ComponentType): T | undefined

  /**
   * Check if an entity has a specific component
   * @param entity The target entity ID
   * @param type The component type to check
   * @returns True if the entity has the component
   */
  hasComponent(entity: EntityId, type: ComponentType): boolean

  /**
   * Query for entities that have all specified component types
   * @param types Component types to query for
   * @returns Array of entity IDs matching the query
   */
  query(...types: ComponentType[]): EntityId[]

  /**
   * Register a system to be updated each frame
   * @param system The system instance to register
   */
  addSystem(system: System): void

  /**
   * Update all registered systems
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void
}
