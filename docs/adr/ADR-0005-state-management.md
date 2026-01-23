# ADR-0005: State Management

## Status

Proposed

## Context

The 3D Asteroids game requires state management for:
- Game flow states: Loading, MainMenu, Playing, Paused, GameOver, Victory
- Transitions between states with entry/exit logic
- Game session data: score, lives, current wave, active power-ups
- UI state: menu selections, settings values
- Persistence: high scores, settings to localStorage

State management must be:
- Predictable and debuggable
- Type-safe with TypeScript
- Easy to extend with new states
- Testable in isolation

## Decision

### Decision Details

| Item | Content |
|------|---------|
| **Decision** | Use explicit Finite State Machine (FSM) for game flow states |
| **Why now** | State management architecture affects all game systems and UI integration |
| **Why this** | FSM provides explicit, type-safe state transitions preventing invalid game states |
| **Known unknowns** | Whether hierarchical states (nested FSM) will be needed for complex boss battles |
| **Kill criteria** | If state explosion leads to >20 states with >50 transitions |

## Rationale

FSM provides:
- Explicit enumeration of all valid game states
- Type-safe transitions preventing invalid state changes
- Clear entry/exit hooks for resource management
- Easy visualization and debugging of game flow
- Natural fit for game screens and lifecycle

### Options Considered

1. **State Pattern Classes**
   - Pros: Encapsulated state logic; OOP familiarity; good for complex per-state behavior
   - Cons: Class proliferation for simple states; transition logic scattered across classes; harder to see full state machine at once; verbose for straightforward states

2. **Event-Driven (Pub/Sub)**
   - Pros: Loosely coupled; flexible event routing; good for complex interactions
   - Cons: Implicit state (derived from event history); hard to track current state; debugging difficult; transition validation complex; race conditions possible

3. **Finite State Machine (Selected)**
   - Pros: All states explicitly defined upfront; invalid transitions impossible by design; single location for state machine definition; natural onEnter/onUpdate/onExit hooks; excellent TypeScript support via discriminated unions; easy to visualize and document; matches game flow mental model; well-tested pattern for games
   - Cons: Initial boilerplate for state definitions; less flexible than event-driven for ad-hoc communication; may need composition with other patterns for game entity state

## Consequences

### Positive Consequences

- Game flow completely predictable from state machine definition
- TypeScript catches invalid transitions at compile time
- Clear separation between state transition logic and state behavior
- Easy to add new states without breaking existing transitions
- State machine can be serialized for save/resume functionality
- Testing can verify specific state transitions

### Negative Consequences

- Upfront effort to define all states and transitions
- May need separate state machines for entity-level state (ship, boss phases)
- Some flexibility sacrificed for explicitness

### Neutral Consequences

- Game loop behavior varies by current state
- UI rendering driven by current state
- Pause state freezes game loop but maintains game data

## Implementation Guidance

- Use TypeScript discriminated unions for type-safe state definitions
- Implement state machine as a class with explicit `transition(event)` method
- Each state has optional `onEnter`, `onUpdate`, `onExit` hooks
- Keep game session data (score, lives, wave) separate from flow state
- State machine transitions emit events for UI updates
- Consider lightweight FSM library (TypeState, @edium/fsm) or custom implementation
- Design entity-level state (ship invulnerability, boss phases) as separate mini-FSMs
- Persist only serializable state data, not state machine instance

## Related Information

- [Game Programming Patterns - State](https://gameprogrammingpatterns.com/state.html)
- [TypeState - Strongly Typed FSM](https://github.com/eonarheim/TypeState)
- [Composable State Machines in TypeScript](https://medium.com/@MichaelVD/composable-state-machines-in-typescript-type-safe-predictable-and-testable-5e16574a6906)
- [Character Logic State Machine in TypeScript](https://blog.ourcade.co/posts/2021/character-logic-state-machine-typescript/)
- [@edium/fsm - Lightweight FSM](https://www.npmjs.com/package/@edium/fsm)
