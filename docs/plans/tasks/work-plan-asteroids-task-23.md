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

- [ ] `src/ui/PauseMenu.ts` - Pause menu UI component
- [ ] `tests/unit/PauseMenu.test.ts` - Pause menu unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [ ] Create test file for pause menu interactions
- [ ] Write failing test for pause menu creation
- [ ] Write failing test for pause menu hidden initially
- [ ] Write failing test for pause menu shows on ESC during Playing state
- [ ] Write failing test for Resume button visible and clickable
- [ ] Write failing test for Main Menu button visible and clickable
- [ ] Write failing test for Settings button visible and clickable
- [ ] Write failing test for Resume button resumes game (Playing state)
- [ ] Write failing test for Main Menu button returns to menu (MainMenu state)
- [ ] Write failing test for Settings button shows settings panel
- [ ] Write failing test for pause freezes game systems
- [ ] Write failing test for pause hides gameplay HUD
- [ ] Write failing test for keyboard input (arrow keys, Enter)
- [ ] Verify all tests fail (Red state)

### 2. Green Phase

**Implement PauseMenu Component**:
- [ ] Create `src/ui/PauseMenu.ts`:
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
  - Handle "pauseRequested" event → transition to Paused state
  - Paused state entry: Create PauseMenu, hide HUD
  - Paused state exit: Destroy PauseMenu, show HUD

- [ ] Update PlayingState:
  - On ESC input: Emit pauseRequested event
  - Do NOT process other inputs when pause requested

**Create unit tests**:
- [ ] Create `tests/unit/PauseMenu.test.ts`:
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
- [ ] Verify pause state fully freezes systems (no updates to physics, collision, etc.)
- [ ] Ensure HUD properly hidden/shown
- [ ] Test ESC key responsiveness
- [ ] Optimize CSS for pause overlay
- [ ] Confirm all tests pass
- [ ] Verify settings panel reuse works correctly

## Completion Criteria

- [ ] Pause menu appears when ESC pressed during Playing state
- [ ] Game loop freezes (all systems stop updating)
- [ ] Gameplay HUD hidden during pause
- [ ] Resume button returns to Playing state
- [ ] Main Menu button returns to MainMenu state
- [ ] Settings button shows settings panel
- [ ] Keyboard navigation works (arrow keys, Enter)
- [ ] ESC key resumes game
- [ ] Multiple pause/resume cycles work correctly
- [ ] Settings changes persist while paused
- [ ] Unit tests passing (15+ test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes

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
