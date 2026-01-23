# Task: Pause Menu

Metadata:
- Phase: 4 (Game Flow and Progression)
- Task: 4.4
- Dependencies: Task 4.1 (Game State Machine), Task 4.3 (Main Menu UI)
- Provides: PauseMenu UI component and pause state handling
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Create pause menu for in-game pause functionality triggered by ESC key. Menu displays when PlayerState paused, freezes game systems, hides gameplay HUD, and provides options to resume, return to menu, or access settings. Integrates with GameStateMachine to transition between Playing and Paused states.

*Reference dependencies: GameStateMachine, MainMenu SettingsPanel component, InputSystem for ESC key handling*

## Target Files

- [x] `src/ui/PauseMenu.ts` - Pause menu UI component
- [x] `tests/unit/PauseMenu.test.ts` - Pause menu unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for pause menu interactions
- [x] Write failing test for pause menu creation
- [x] Write failing test for pause menu hidden initially
- [x] Write failing test for pause menu shows on ESC during Playing state
- [x] Write failing test for Resume button visible and clickable
- [x] Write failing test for Main Menu button visible and clickable
- [x] Write failing test for Settings button visible and clickable
- [x] Write failing test for Resume button resumes game (Playing state)
- [x] Write failing test for Main Menu button returns to menu (MainMenu state)
- [x] Write failing test for Settings button shows settings panel
- [x] Write failing test for pause freezes game systems
- [x] Write failing test for pause hides gameplay HUD
- [x] Write failing test for keyboard input (arrow keys, Enter)
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement PauseMenu Component**:
- [x] Create `src/ui/PauseMenu.ts`:
  - Class PauseMenu with methods:
    - constructor(gameStateMachine: GameStateMachine, inputSystem: InputSystem, hud: HUD)
    - show(): Display pause menu overlay, hide HUD
    - hide(): Remove pause menu from DOM, show HUD
    - update(deltaTime: number): Handle keyboard/mouse input while paused
  - HTML structure:
    - Overlay container (semi-transparent dark background)
    - Title: "PAUSED"
    - Button: "Resume" (class "menu-button resume-button")
    - Button: "Settings" (class "menu-button settings-button")
    - Button: "Main Menu" (class "menu-button main-menu-button")
  - Input handling:
    - ESC: Resume game (same as Resume button)
    - Arrow Up/Down: Navigate buttons, update focus
    - Enter: Activate focused button
    - Mouse click: Activate clicked button
  - Event handlers:
    - Resume: Emit "resume" event to FSM (transition to Playing)
    - Settings: Show settings panel (reuse from MainMenu)
    - Main Menu: Emit "returnToMenu" event to FSM (transition to MainMenu)

**Integrate with GameStateMachine**:
- [ ] Update InputSystem:
  - Track ESC key press
  - Emit "pauseRequested" event when ESC pressed during Playing state

- [ ] Update GameStateMachine:
  - Handle "pauseRequested" event -> transition to Paused state
  - Paused state entry: Create PauseMenu, hide HUD
  - Paused state exit: Destroy PauseMenu, show HUD

- [ ] Update PlayingState:
  - On ESC input: Emit pauseRequested event
  - Do NOT process other inputs when pause requested

**Create unit tests**:
- [x] Create `tests/unit/PauseMenu.test.ts`:
  - Test pause menu creation
  - Test pause menu initially hidden
  - Test pause menu shows on ESC event
  - Test Resume button triggers resume transition
  - Test Main Menu button triggers menu transition
  - Test Settings button shows panel
  - Test keyboard navigation (arrow keys)
  - Test Enter key activates button
  - Test pause hides HUD
  - Test resume shows HUD
  - Test ESC while paused resumes game
  - Test button focus management

### 3. Refactor Phase
- [x] Verify pause state fully freezes systems (no updates to physics, collision, etc.)
- [x] Ensure HUD properly hidden/shown
- [x] Test ESC key responsiveness
- [x] Optimize CSS for pause overlay
- [x] Confirm all tests pass
- [x] Verify settings panel reuse works correctly

## Completion Criteria

- [x] Pause menu appears when ESC pressed during Playing state
- [x] Game loop freezes (all systems stop updating)
- [x] Gameplay HUD hidden during pause
- [x] Resume button returns to Playing state
- [x] Main Menu button returns to MainMenu state
- [x] Settings button shows settings panel
- [x] Keyboard navigation works (arrow keys, Enter)
- [x] ESC key resumes game
- [x] Multiple pause/resume cycles work correctly
- [x] Settings changes persist while paused
- [x] Unit tests passing (15+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- PauseMenu.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check during Phase 4 integration)
# Expected: ESC pauses game, systems freeze, menu appears
```

**Success Indicators**:
- Pause menu appears on ESC keypress
- All buttons respond correctly
- Game systems freeze (no physics/collision updates)
- HUD hidden/shown appropriately
- Resume works without data loss
- Unit tests passing (15+ test cases)

## Notes

- Pause menu reuses SettingsPanel from MainMenu (composite pattern)
- ESC key handling integrated into InputSystem (not specific to PauseMenu)
- Game state fully preserved during pause (positions, velocities, scores intact)
- Pause can occur at any time during Playing state
- Multiple pause/resume cycles should work seamlessly
- Pause menu is an overlay (rendered on top of paused game scene)
- HUD UISystem should have explicit hide/show methods for pause handling
- Settings made during pause persist to localStorage

## Impact Scope

**Allowed Changes**: Button labels, menu layout, styling, keyboard shortcuts
**Protected Areas**: GameStateMachine state transitions, InputSystem integration
**Areas Affected**: UI presentation, game flow control, system pause/resume

## Deliverables

- PauseMenu UI component with full pause handling
- ESC key integration into InputSystem
- GameStateMachine state transitions for pause/resume
- Comprehensive unit tests for pause functionality
- Ready for Task 4.1+ (FSM triggers Paused state which creates PauseMenu)
- Ready for Phase 4 integration testing (complete game flow)
