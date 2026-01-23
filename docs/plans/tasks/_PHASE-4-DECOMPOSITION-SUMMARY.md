# Phase 4 Task Decomposition Summary

**Plan Document**: work-plan-asteroids.md (Lines 943-1158)
**Decomposition Date**: 2026-01-22
**Phase**: 4 - Game Flow and Progression
**Objectives**: Implement game state machine, wave progression, menus, and leaderboard
**Duration**: 3-4 days
**Verification Level**: L1 (Functional - full game session playable)

---

## Decomposed Tasks

### Task 4.1: Game State Machine
**File**: `work-plan-asteroids-task-20.md`
**Size**: Medium (4-5 files)
**Duration**: 1 day
**Dependencies**: Task 1.1, Task 2.1
**Provides**: GameStateMachine class, 5 state implementations

**Content**:
- GameStateMachine FSM with event-driven transitions
- Five state implementations: Loading, MainMenu, Playing, Paused, GameOver
- State interface: onEnter(), onUpdate(), onExit()
- Transition events: loadComplete, startGame, pause, resume, playerDied, returnToMenu, restart
- Only one active state at a time
- System execution control based on state

**Key Implementation Points**:
```typescript
interface GameState {
  onEnter(world: World): void
  onUpdate(world: World, deltaTime: number): void
  onExit(world: World): void
}

class GameStateMachine {
  currentState: GameState
  transition(event: GameFlowEvent): void
  update(world: World, deltaTime: number): void
}

// Five state implementations
class LoadingState implements GameState
class MainMenuState implements GameState
class PlayingState implements GameState
class PausedState implements GameState
class GameOverState implements GameState
```

**Verification**: L2 (Test Operation - 15+ unit tests)

---

### Task 4.2: Wave Progression System
**File**: `work-plan-asteroids-task-21.md`
**Size**: Small (2 files)
**Duration**: 0.5 days
**Dependencies**: Task 3.3, Task 3.4
**Provides**: Extended WaveSystem with progression logic

**Content**:
- Wave counter tracking (starts at 1)
- Asteroid count formula: 3 + (wave - 1) * 2
  - Wave 1: 3, Wave 2: 5, Wave 3: 7, Wave 4: 9, Wave 5: boss, etc.
- Speed multiplier formula: min(1 + (wave - 1) * 0.05, 2.0)
  - Wave 1: 1.0x, Wave 2: 1.05x, ..., Wave 21+: 2.0x (capped)
- Boss wave detection: Every 5 waves (5, 10, 15, 20, ...)
- Wave transition delay: 3 seconds after last asteroid destroyed
- Wave completion detection
- waveProgressed event emission

**Key Implementation Points**:
```typescript
class WaveSystem {
  currentWave: number
  calculateAsteroidCount(wave: number): number
  // Returns: 3 + (wave - 1) * 2

  calculateSpeedMultiplier(wave: number): number
  // Returns: min(1 + (wave - 1) * 0.05, 2.0)

  isBossWave(wave: number): boolean
  // Returns: wave % 5 === 0

  update(world: World, deltaTime: number): void
  // Tracks asteroids, detects completion, transitions waves
}
```

**Verification**: L2 (Test Operation - 20+ unit tests)

---

### Task 4.3: Main Menu UI
**File**: `work-plan-asteroids-task-22.md`
**Size**: Small (3 files)
**Duration**: 0.5 days
**Dependencies**: Task 4.1
**Provides**: MainMenu and SettingsPanel UI components

**Content**:
- Main menu with buttons: Play, Settings, Leaderboard, Instructions
- Keyboard navigation (arrow keys, Enter)
- Mouse click support
- Settings panel with SFX and Music volume sliders (0-100)
- Settings persistence to localStorage
- CSS styling with neon/cyberpunk aesthetic
- Show/hide based on MainMenuState

**Key Implementation Points**:
```typescript
class MainMenu {
  show(): void
  hide(): void
  update(deltaTime: number): void
  // Handles keyboard/mouse input
}

class SettingsPanel {
  show(onClose: callback): void
  hide(): void
  // Volume sliders, localStorage save/load
}
```

**Verification**: L1 (Functional) + L2 (Test Operation - 20+ unit tests)

---

### Task 4.4: Pause Menu
**File**: `work-plan-asteroids-task-23.md`
**Size**: Small (2 files)
**Duration**: 0.5 days
**Dependencies**: Task 4.1, Task 4.3
**Provides**: PauseMenu UI, pause state management

**Content**:
- Pause menu triggered by ESC keypress during Playing state
- Menu buttons: Resume, Settings, Main Menu
- Keyboard navigation (arrow keys, Enter, ESC)
- Game systems freeze while paused
- Gameplay HUD hidden during pause
- Reuses SettingsPanel component from MainMenu
- Smooth pause/resume with no data loss

**Key Implementation Points**:
```typescript
class PauseMenu {
  show(): void
  hide(): void
  update(deltaTime: number): void
  // ESC key triggers resume
}

// GameStateMachine handles
Playing → (ESC pressed) → Paused → (resume) → Playing
```

**Verification**: L1 (Functional) + L2 (Test Operation - 15+ unit tests)

---

### Task 4.5: Game Over Screen
**File**: `work-plan-asteroids-task-24.md`
**Size**: Small (2 files)
**Duration**: 0.5 days
**Dependencies**: Task 4.1, Task 3.4
**Provides**: GameOverScreen UI, game end state handling

**Content**:
- Game Over screen appears when Player.lives = 0
- Displays: Final score, Wave reached
- Name input field (max 20 characters)
- Buttons: Submit (to leaderboard), Try Again, Main Menu
- Keyboard input: Enter (submit), ESC (main menu)
- Try Again: Restarts with fresh world (wave 1, 3 lives, score 0)
- Main Menu: Returns to MainMenuState

**Key Implementation Points**:
```typescript
class GameOverScreen {
  show(finalScore: number, waveReached: number): void
  hide(): void
  // Name input, submit button, leaderboard save
}

// RespawnSystem triggers on lives = 0
PlayerDied event → GameStateMachine.transition(playerDied)
  → GameOverState → GameOverScreen
```

**Verification**: L1 (Functional) + L2 (Test Operation - 15+ unit tests)

---

### Task 4.6: Leaderboard System
**File**: `work-plan-asteroids-task-25.md`
**Size**: Small (3 files)
**Duration**: 0.5 days
**Dependencies**: Task 4.5
**Provides**: LeaderboardStorage utility, Leaderboard UI

**Content**:
- LeaderboardStorage: localStorage persistence for scores
- LeaderboardEntry: name, score, wave, timestamp
- Top 10 scores: Sorted descending by score
- Leaderboard UI: Display rank, name, score, wave
- localStorage fallback: In-memory array if storage unavailable
- Score validation: Non-negative, integer
- Name validation: 1-20 characters
- Clear/reset functionality for testing
- Persistent across page reloads

**Key Implementation Points**:
```typescript
interface LeaderboardEntry {
  name: string
  score: number
  wave: number
  timestamp: number
  rank?: number
}

class LeaderboardStorage {
  saveScore(entry: LeaderboardEntry): void
  loadScores(): LeaderboardEntry[]
  getTopScores(count = 10): LeaderboardEntry[]
  getAllScores(): LeaderboardEntry[]
  getPlayerRank(name: string): number
  isInTopTen(score: number): boolean
}

class Leaderboard {
  show(highlightPlayerName?: string): void
  hide(): void
  // Display top 10 with highlighting
}
```

**Verification**: L2 (Test Operation - 20+ unit tests)

---

## Task Dependencies and Execution Order

```
Task 4.1: Game State Machine (Foundation)
  ↓ (provides state infrastructure)
Task 4.2: Wave Progression System (extends existing WaveSystem)
  ↓ (enables wave advancement)
Task 4.3: Main Menu UI
  ↓ (provides starting point, reused by)
Task 4.4: Pause Menu (reuses SettingsPanel)
  ↓
Task 4.5: Game Over Screen (integrates with Game Flow)
  ↓
Task 4.6: Leaderboard System (receives scores from Game Over)
```

**Parallelization Opportunity**:
- Tasks 4.3, 4.4, 4.5, 4.6 can be developed partially in parallel (after 4.1 complete)
- Each UI component is somewhat independent
- Recommended: Sequential for clarity and debugging

---

## Common Implementation Patterns

### 1. State Machine Event-Driven Architecture
- External components emit events
- FSM listens for events
- FSM triggers state transitions
- States manage their own UI and systems

### 2. UI Component Pattern
- Each menu is a component with show/hide/update
- Components manage their own DOM
- Components emit events on user actions
- Parent (FSM) controls component lifecycle

### 3. Keyboard Input Integration
- InputSystem tracks all keyboard events
- UI components subscribe to specific keys
- Arrow keys for navigation, Enter for selection
- ESC for back/menu

### 4. localStorage Persistence
- Wrapper utility handles storage/fallback
- Data serialized to JSON
- Automatic error handling for unavailable storage
- In-memory cache for performance

---

## Integration Points with Other Phases

**From Phase 3 (into Phase 4)**:
- RespawnSystem emits "playerDied" event when lives reach 0
- ScoreSystem provides final score to GameOverScreen
- WaveSystem provides current wave number

**Phase 4 → Phase 5 (into)**:
- Event system emits: "weaponFired", "asteroidDestroyed", "powerUpCollected"
- Audio system will listen to these events
- Game state stable for feature additions

---

## Phase 4 Verification

### Functional Requirements (L1)
✓ Game starts with main menu
✓ Play button transitions to gameplay
✓ ESC pauses game (systems freeze, menu shows)
✓ Resume returns to gameplay uninterrupted
✓ Lose all lives triggers Game Over screen
✓ Game Over screen shows final score and wave
✓ Name submission saves to leaderboard
✓ Leaderboard persists across page reloads
✓ Wave progression works (asteroids increase per formula)
✓ Full session: menu → game → pause → resume → game over → leaderboard

### Code Quality (L2)
✓ All unit tests passing (85+ test cases total)
✓ Type checking passes
✓ Build succeeds
✓ No circular dependencies

### Performance
✓ 60 FPS maintained during menu operations
✓ 60 FPS maintained during gameplay
✓ No stuttering on state transitions
✓ localStorage operations <10ms
✓ No memory leaks in pause/resume cycles

---

## Design Decisions and Trade-offs

### Event-Driven State Machine
**Why**: Decouples state management from UI/game systems
**Trade-off**: Slightly more complexity in event handling
**Benefit**: Flexible, extensible, easy to add new transitions

### SettingsPanel Reuse
**Why**: Avoid code duplication (main menu and pause menu both need settings)
**Trade-off**: Slight coupling between menu components
**Benefit**: Consistent user experience, maintainable

### localStorage with In-Memory Fallback
**Why**: Graceful degradation when storage unavailable
**Trade-off**: Data may be lost if fallback used across page reloads
**Benefit**: Game still playable, leaderboard still functional

### Top 10 Leaderboard
**Why**: Limited display space, manageable data size
**Trade-off**: Players not in top 10 don't see their rank
**Benefit**: Simple UI, fast display, easy localStorage limit

---

## Risk Mitigation

| Risk | Mitigation | Status |
|------|-----------|--------|
| State machine complexity | Comprehensive unit tests, clear event contracts | ✓ Addressed in design |
| UI responsiveness during pause | Explicit system freeze in Paused state | ✓ Addressed in design |
| Score persistence failure | In-memory fallback, graceful degradation | ✓ Addressed in design |
| Multiple state transitions | Event queue, transition validation | ✓ Addressed in design |

---

## Next Phase Handoff (Phase 5)

**Phase 4 Delivers To Phase 5**:
- Event emission system (used by audio, particle, power-up systems)
- Game state stability (clean foundation for features)
- Leaderboard persistence (scores available for Phase 5 components)
- UI component patterns (reused for power-up HUD displays)

**Phase 5 Prerequisites**:
- [ ] Phase 4 complete and verified
- [ ] Event system stable and tested
- [ ] Game flow working smoothly
- [ ] No critical bugs in state management

