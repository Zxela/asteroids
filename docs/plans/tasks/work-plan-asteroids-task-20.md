# Task: Game State Machine

Metadata:
- Phase: 4 (Game Flow and Progression)
- Task: 4.1
- Dependencies: Task 1.1 (Project Setup), Task 2.1 (Renderer Setup)
- Provides: GameStateMachine implementation, src/state/ directory structure
- Size: Medium (3-4 files)
- Estimated Duration: 1 day

## Implementation Content

Implement finite state machine for managing game flow states: Loading → MainMenu → Playing → Paused → GameOver. The FSM provides centralized state management controlling which systems update, which UI displays, and handling transitions via events. This is the core orchestration layer enabling the complete game session experience.

*Reference dependencies: Game class (Task 2.1), Input system, UI components (Tasks 4.3-4.5)*

## Target Files

- [x] `src/state/GameStateMachine.ts` - FSM implementation with state interface
- [x] `src/state/states/LoadingState.ts` - Asset loading state
- [x] `src/state/states/MainMenuState.ts` - Main menu state
- [x] `src/state/states/PlayingState.ts` - Active gameplay state
- [x] `src/state/states/PausedState.ts` - Pause overlay state
- [x] `src/state/states/GameOverState.ts` - Game over state
- [x] `tests/unit/GameStateMachine.test.ts` - FSM unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for FSM state transitions
- [x] Write failing test for state initialization
- [x] Write failing test for transition from Loading to MainMenu
- [x] Write failing test for transition from MainMenu to Playing
- [x] Write failing test for transition from Playing to Paused
- [x] Write failing test for transition from Paused to Playing (resume)
- [x] Write failing test for transition from Playing to GameOver
- [x] Write failing test for invalid transitions (rejection)
- [x] Write failing test for state entry/exit action execution
- [x] Write failing test for preventing multiple active states
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement GameStateMachine**:
- [x] Create `src/state/GameStateMachine.ts`:
  - GameState interface with onEnter(), onUpdate(), onExit() methods
  - FSM class managing current state and transitions
  - Transition table defining valid transitions per state
  - Event-driven transition triggers (loadComplete, startGame, pause, resume, playerDied, returnToMenu, restart)
  - State validation (prevent transitions to invalid next states)
  - History tracking for debug/analytics

**Implement State Classes**:
- [x] Create `src/state/states/LoadingState.ts`:
  - onEnter(): Initialize asset loading progress
  - onUpdate(): Track loading progress, emit loadComplete when ready
  - onExit(): Cleanup progress tracker

- [x] Create `src/state/states/MainMenuState.ts`:
  - onEnter(): Show main menu UI
  - onUpdate(): Handle menu input, process menu selections
  - onExit(): Hide main menu UI

- [x] Create `src/state/states/PlayingState.ts`:
  - onEnter(): Start/resume all game systems
  - onUpdate(): Run game loop (input, physics, collision, render systems)
  - onExit(): Pause all systems

- [x] Create `src/state/states/PausedState.ts`:
  - onEnter(): Show pause menu, freeze rendering
  - onUpdate(): Handle pause menu input only
  - onExit(): Hide pause menu

- [x] Create `src/state/states/GameOverState.ts`:
  - onEnter(): Show game over screen with final score
  - onUpdate(): Handle game over input (restart, return to menu)
  - onExit(): Cleanup game over UI

**Create unit tests**:
- [x] Create `tests/unit/GameStateMachine.test.ts`:
  - Test state initialization
  - Test all valid transitions (6+ test cases)
  - Test invalid transitions rejected (3+ test cases)
  - Test entry/exit actions executed
  - Test event-driven transitions
  - Test single active state enforcement
  - Edge case: null transitions, rapid transitions

### 3. Refactor Phase
- [x] Verify transition table completeness
- [x] Optimize event handling (observer pattern)
- [x] Add state history for debugging
- [x] Ensure systems only update when Playing state active
- [x] Confirm all tests pass

## Completion Criteria

- [x] FSM transitions work correctly per defined events
- [x] Only one state active at a time
- [x] State entry/exit actions execute in correct order
- [x] Game loop only runs in Playing state
- [x] Transitions can be triggered via events (loadComplete, startGame, pause, resume, playerDied, returnToMenu, restart)
- [x] Invalid transitions rejected gracefully
- [x] Unit tests passing (15+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- GameStateMachine.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Verify state transitions
# Expected: Smooth transitions, no state overlap
```

**Success Indicators**:
- All unit tests passing (15+ test cases)
- Type checking passes
- Build succeeds
- State transitions execute without errors
- Only one state active per frame

## Notes

- State machine is event-driven (external components trigger transitions via emitted events)
- States encapsulate their logic (entry, update, exit) for independence
- Transition table is explicitly defined to prevent invalid state combinations
- Game orchestrator (Game class) owns FSM instance and passes world/deltaTime to current state
- Systems (input, physics, collision, render) are conditionally executed based on state
- UI components (menus, HUD) are shown/hidden based on state

## Impact Scope

**Allowed Changes**: Add new states, modify transition rules, adjust state behavior
**Protected Areas**: Event system contracts, system integration points
**Areas Affected**: Game flow control, UI visibility, system execution order

## Deliverables

- GameStateMachine class with full transition support
- Five state implementations (Loading, MainMenu, Playing, Paused, GameOver)
- Comprehensive unit tests for FSM logic
- Ready for Task 4.3+ integration (menus that trigger transitions)
