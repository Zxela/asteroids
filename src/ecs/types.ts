/**
 * ECS Core Type Definitions
 *
 * Defines the fundamental types for the Entity-Component-System architecture.
 * Following ADR-0001 decisions for game architecture.
 */

/**
 * Unique identifier for an entity.
 * Uses branded type for type safety to prevent mixing with regular numbers.
 */
export type EntityId = number & { readonly __entityId: unique symbol }

/**
 * Base interface for all components.
 * Components are pure data containers with no logic.
 */
// biome-ignore lint/complexity/noBannedTypes: Empty interface is intentional for ECS component marker type
export type Component = {}

/**
 * Interface for systems that process entities with specific components.
 * Systems contain all logic and operate on component sets.
 */
export interface System {
  /**
   * Called each frame to update entities.
   * @param world - The ECS world instance for querying and modifying entities
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void
}

/**
 * Type for component class constructors.
 * Used for type-safe component queries and storage.
 */
export type ComponentClass<T extends Component = Component> = new (...args: unknown[]) => T

/**
 * Interface for the ECS World.
 * Provides the public API for entity/component/system operations.
 */
export interface World {
  /**
   * Create a new entity.
   * @returns Unique EntityId for the created entity
   */
  createEntity(): EntityId

  /**
   * Destroy an entity and remove all its components.
   * @param entityId - The entity to destroy
   */
  destroyEntity(entityId: EntityId): void

  /**
   * Check if an entity is still alive (not destroyed).
   * @param entityId - The entity to check
   * @returns True if entity exists and is alive
   */
  isEntityAlive(entityId: EntityId): boolean

  /**
   * Add a component to an entity.
   * If component of same type exists, it will be replaced.
   * @param entityId - The entity to add component to
   * @param component - The component instance to add
   */
  addComponent<T extends Component>(entityId: EntityId, component: T): void

  /**
   * Remove a component from an entity.
   * @param entityId - The entity to remove component from
   * @param componentType - The component class to remove
   */
  removeComponent<T extends Component>(entityId: EntityId, componentType: ComponentClass<T>): void

  /**
   * Get a component from an entity.
   * @param entityId - The entity to get component from
   * @param componentType - The component class to retrieve
   * @returns The component instance or undefined if not found
   */
  getComponent<T extends Component>(
    entityId: EntityId,
    componentType: ComponentClass<T>
  ): T | undefined

  /**
   * Check if an entity has a specific component.
   * @param entityId - The entity to check
   * @param componentType - The component class to check for
   * @returns True if entity has the component
   */
  hasComponent<T extends Component>(entityId: EntityId, componentType: ComponentClass<T>): boolean

  /**
   * Query for entities that have all specified component types.
   * @param componentTypes - Component classes to query for
   * @returns Array of EntityIds that have all specified components
   */
  query<T extends Component[]>(
    ...componentTypes: { [K in keyof T]: ComponentClass<T[K]> }
  ): EntityId[]

  /**
   * Register a system to be updated each frame.
   * Systems are executed in registration order.
   * @param system - The system to register
   */
  registerSystem(system: System): void

  /**
   * Remove a system from the update loop.
   * @param system - The system to remove
   */
  removeSystem(system: System): void

  /**
   * Update all registered systems.
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime: number): void
}
