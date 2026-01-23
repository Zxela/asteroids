# ADR-0001: Game Architecture Pattern

## Status

Proposed

## Context

We need to select an architecture pattern for the 3D Asteroids game that will manage game entities (ship, asteroids, projectiles, power-ups, bosses), their behaviors, and interactions. The pattern must support:

- Multiple entity types with varying combinations of behaviors
- Efficient collision detection across many entities
- Clean separation between game logic and rendering
- Testability and maintainability
- Performance for real-time gameplay (60 FPS target)

The classic Asteroids game involves many simultaneous entities with similar but not identical behaviors, making this architectural decision critical for long-term code quality.

## Decision

### Decision Details

| Item | Content |
|------|---------|
| **Decision** | Use Entity-Component-System (ECS) architecture for game entity management |
| **Why now** | Architecture pattern must be established before any entity implementation begins |
| **Why this** | ECS provides composition over inheritance, enabling flexible entity definitions and efficient batch processing of similar components |
| **Known unknowns** | Whether lightweight custom ECS or a library like Miniplex provides better DX for this scope |
| **Kill criteria** | If component composition complexity exceeds OOP equivalent for 80% of entities |

## Rationale

ECS separates entities (identity), components (data), and systems (logic), enabling:
- Flexible entity composition without inheritance hierarchies
- Cache-friendly data access patterns for systems processing many entities
- Easy addition of new behaviors without modifying existing code
- Natural fit for Three.js integration (Transform component syncs to Object3D)

### Options Considered

1. **OOP Class Hierarchy**
   - Pros: Familiar pattern for most developers; straightforward to understand; good IDE support for refactoring
   - Cons: Deep inheritance chains become rigid; diamond problem with multiple behaviors; difficult to add behaviors dynamically; tight coupling between data and logic

2. **Functional/Reducer Pattern**
   - Pros: Immutable state simplifies debugging; works well with state management tools; excellent testability
   - Cons: Frequent object creation impacts GC; not designed for real-time game loops; awkward for continuous physics updates

3. **Entity-Component-System (Selected)**
   - Pros: Composition over inheritance eliminates hierarchy problems; systems process entities in batches for efficiency; easy to add/remove behaviors at runtime; proven pattern for game development; natural separation of data and logic; excellent for handling many similar entities (asteroids, projectiles)
   - Cons: Learning curve for developers unfamiliar with pattern; initial boilerplate for component/system setup; requires discipline to avoid putting logic in components

## Consequences

### Positive Consequences

- Asteroids, projectiles, and particles can share components (Position, Velocity, Renderable) without inheritance
- New entity types (power-ups, bosses) added by composing existing components
- Systems can be tested in isolation with mock component data
- Rendering system naturally separates from game logic
- Collision system processes all collidable entities uniformly

### Negative Consequences

- Initial setup requires more boilerplate than simple OOP
- Developers must understand ECS mental model
- Component queries add slight overhead vs direct object access

### Neutral Consequences

- Three.js Object3D instances become "view" components synced from Transform components
- Game state naturally serializable (all data in components)

## Implementation Guidance

- Components are pure data containers (no methods beyond getters/setters)
- Systems contain all logic and operate on component sets
- Use dependency injection for systems to enable testing
- Transform component is the source of truth; sync to Three.js Object3D in render system
- Consider lightweight custom ECS over library to minimize bundle size and learning curve

## Related Information

- [A-Frame ECS Documentation](https://aframe.io/docs/1.7.0/introduction/entity-component-system.html)
- [Web Game Dev ECS Guide](https://www.webgamedev.com/code-architecture/ecs)
- [Game Programming Patterns - Component](https://gameprogrammingpatterns.com/component.html)
- [Miniplex for React Three Fiber](https://github.com/hmans/miniplex)
