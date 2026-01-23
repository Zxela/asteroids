# Task: Core ECS Implementation and World

Metadata:
- Phase: 1 (Foundation)
- Dependencies: Task 1.1 (Project Setup)
- Provides: World, EntityManager, ComponentStorage, SystemManager operational
- Size: Small (4 files)
- Estimated Duration: 1.5 days

## Implementation Content

Implement ECS infrastructure: Entity Manager, Component Storage, System Manager, and World orchestrator. This provides the core abstraction layer for all game logic.

## Target Files

- [ ] `src/ecs/EntityManager.ts` - Entity creation/destruction, ID allocation
- [ ] `src/ecs/ComponentStorage.ts` - Component archetype storage and querying
- [ ] `src/ecs/SystemManager.ts` - System registration and update orchestration
- [ ] `src/ecs/World.ts` - Public interface for entity/component/system operations
- [ ] `src/ecs/index.ts` - Public API exports
- [ ] `tests/unit/ecs.test.ts` - Unit tests (Red state)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**Write failing tests first** in `tests/unit/ecs.test.ts`:
- [ ] Entity creation returns unique EntityId
- [ ] Entity destruction removes entity from system
- [ ] Component add/remove works per entity
- [ ] Component queries return correct entities
- [ ] System registration and execution in order
- [ ] World.update() orchestrates all systems
- [ ] Query with multiple component requirements works
- [ ] Destroying entity removes all components
- [ ] Systems can be removed

### 2. Green Phase

**Implement minimal code to pass tests**:

- [ ] Implement `src/ecs/types.ts`:
  ```typescript
  export type EntityId = number & { readonly __entityId: unique symbol };
  export interface Component {}
  export interface System {
    update(world: World, deltaTime: number): void;
  }
  export type ComponentClass<T extends Component> = new () => T;
  ```

- [ ] Implement `EntityManager.ts`:
  - Private counter for entity IDs
  - Method: `createEntity(): EntityId`
  - Method: `destroyEntity(entityId: EntityId): void`
  - Method: `isAlive(entityId: EntityId): boolean`
  - Track alive entities in Set<EntityId>

- [ ] Implement `ComponentStorage.ts`:
  - Store components by entity and type
  - Method: `addComponent<T>(entityId: EntityId, component: T): void`
  - Method: `removeComponent<T>(entityId: EntityId, componentType: ComponentClass<T>): void`
  - Method: `getComponent<T>(entityId: EntityId, componentType: ComponentClass<T>): T | undefined`
  - Method: `hasComponent<T>(entityId: EntityId, componentType: ComponentClass<T>): boolean`
  - Method: `query<T>(componentType: ComponentClass<T>): EntityId[]`
  - Method: `query<T, U>(type1: ComponentClass<T>, type2: ComponentClass<U>): EntityId[]`
  - Support variable-arity queries (2-4 component types initially)

- [ ] Implement `SystemManager.ts`:
  - Store systems in order
  - Method: `registerSystem(system: System): void`
  - Method: `removeSystem(system: System): void`
  - Method: `updateAll(world: World, deltaTime: number): void`
  - Execute systems in registration order

- [ ] Implement `World.ts`:
  - Compose EntityManager, ComponentStorage, SystemManager
  - Public methods:
    - `createEntity(): EntityId`
    - `destroyEntity(entityId: EntityId): void`
    - `addComponent<T>(entityId: EntityId, component: T): void`
    - `removeComponent<T>(entityId: EntityId, componentType: ComponentClass<T>): void`
    - `getComponent<T>(entityId: EntityId, componentType: ComponentClass<T>): T | undefined`
    - `hasComponent<T>(entityId: EntityId, componentType: ComponentClass<T>): boolean`
    - `query<T>(componentType: ComponentClass<T>): EntityId[]`
    - `query<T, U>(...types): EntityId[]`
    - `registerSystem(system: System): void`
    - `update(deltaTime: number): void`

- [ ] Export public API from `src/ecs/index.ts`:
  ```typescript
  export { World } from './World';
  export type { EntityId, Component, System } from './types';
  ```

### 3. Refactor Phase
- [ ] Verify no unnecessary allocations in hot path (query, update)
- [ ] Ensure type safety throughout (no `any` types)
- [ ] Document complex methods with JSDoc
- [ ] Optimize ComponentStorage for memory locality
- [ ] Ensure all tests still pass

## Completion Criteria

- [ ] ECS World can create and destroy entities
- [ ] Components can be added, removed, and queried from entities
- [ ] Systems can be registered and updated in order
- [ ] Unit tests created and all passing (5+ test suites)
- [ ] TypeScript strict mode passes
- [ ] No circular dependencies
- [ ] Query performance acceptable (<1ms for 100 entities)

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests for ECS
npm test -- tests/unit/ecs.test.ts

# Type checking
npm run type-check

# Build verification
npm run build

# Circular dependency check
npm run check:deps
```

**Success Indicators**:
- All unit tests passing (Entity management, Component operations, System orchestration)
- TypeScript strict mode passes
- Build succeeds with no errors
- No circular dependencies detected

## Example Usage (for reference)

After this task is complete, subsequent tasks will use the World like this:

```typescript
// Create entity
const shipId = world.createEntity();

// Add components
world.addComponent(shipId, new Transform());
world.addComponent(shipId, new Velocity());

// Query entities with Transform
const movingEntities = world.query(Transform);

// Register system
world.registerSystem(physicsSystem);

// Update all systems
world.update(deltaTime);
```

## Notes

- This is foundational for all game systems
- Performance is critical (query and update called every frame)
- Memory efficiency matters (many components per entity)
- Type safety enforced throughout (no `any` types)
- Query with multiple types supports 2-4 components (extensible)

## Impact Scope

**Allowed Changes**: ECS core implementation, type definitions, system orchestration
**Protected Areas**: Once complete, World interface is stable (extensions only via new query overloads)
**Areas Affected**: All subsequent phases use this World interface

## Deliverables

- Operational ECS World
- EntityManager with ID allocation
- ComponentStorage with querying
- SystemManager with update orchestration
- Ready for Task 1.3 (Type Definitions)
