# Task: Main Menu UI

Metadata:
- Phase: 4 (Game Flow and Progression)
- Task: 4.3
- Dependencies: Task 4.1 (Game State Machine)
- Provides: MainMenu UI component and styling
- Size: Small (2-3 files)
- Estimated Duration: 0.5 days

## Implementation Content

Create main menu interface with interactive buttons for Play, Settings, and Leaderboard options. Menu displays on game startup (MainMenuState), responds to keyboard and mouse input, handles navigation, and triggers state transitions. Provides settings panel for audio volume control with localStorage persistence.

*Reference dependencies: GameStateMachine for state transitions, InputSystem for keyboard input, LeaderboardStorage for score display*

## Target Files

- [x] `src/ui/MainMenu.ts` - Main menu UI component and logic
- [x] `src/ui/SettingsPanel.ts` - Settings controls (volume sliders)
- [x] `src/styles/menu.css` - Menu styling
- [x] `tests/unit/MainMenu.test.ts` - UI interaction unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for main menu interactions
- [x] Write failing test for menu creation (DOM exists)
- [x] Write failing test for Play button visibility
- [x] Write failing test for Settings button visibility
- [x] Write failing test for Leaderboard button visibility
- [x] Write failing test for Play button click triggers transition
- [x] Write failing test for Settings button click shows settings panel
- [x] Write failing test for Leaderboard button click shows leaderboard
- [x] Write failing test for keyboard navigation (arrow keys)
- [x] Write failing test for keyboard selection (Enter key)
- [x] Write failing test for settings volume slider updates
- [x] Write failing test for settings persistence to localStorage
- [x] Write failing test for menu hide/show based on state
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement MainMenu Component**:
- [x] Create `src/ui/MainMenu.ts`:
  - Class MainMenu with methods:
    - constructor(gameStateMachine: GameStateMachine, inputSystem: InputSystem)
    - show(): Display menu in DOM, focus Play button
    - hide(): Remove menu from DOM
    - update(deltaTime: number): Handle keyboard/mouse input
  - HTML structure:
    - Container div with menu styling
    - Title: "ASTEROIDS"
    - Button: "Play" (class "menu-button play-button")
    - Button: "Settings" (class "menu-button settings-button")
    - Button: "Leaderboard" (class "menu-button leaderboard-button")
    - Button: "Instructions" (class "menu-button instructions-button")
  - Input handling:
    - Arrow Up/Down: Navigate buttons, update focus
    - Enter: Activate focused button
    - Mouse click: Activate clicked button
  - Event handlers:
    - Play: Emit "startGame" event to FSM
    - Settings: Show settings panel (overlay)
    - Leaderboard: Show leaderboard overlay
    - Instructions: Show instructions overlay

**Implement SettingsPanel Component**:
- [x] Create `src/ui/SettingsPanel.ts`:
  - Class SettingsPanel with methods:
    - constructor(audioManager: AudioManager)
    - show(onClose: callback): Display settings overlay
    - hide(): Remove settings from DOM
  - HTML structure:
    - Modal overlay
    - Title: "SETTINGS"
    - Label: "SFX Volume"
    - Slider: 0-100 (default 100)
    - Label: "Music Volume"
    - Slider: 0-100 (default 100)
    - Button: "Back" or "Close"
  - Input handling:
    - Sliders update AudioManager volume
    - onChange: Save settings to localStorage
    - Back button: Close panel, return to menu

**Implement Styling**:
- [x] Create `src/styles/menu.css`:
  - Menu container: centered, full viewport
  - Background: dark with subtle grid pattern
  - Buttons: glowing neon style, hover effects
  - Selected button: highlighted border
  - Sliders: custom styling to match game theme
  - Modal overlays: semi-transparent background
  - Responsive design for various screen sizes

**Create unit tests**:
- [x] Create `tests/unit/MainMenu.test.ts`:
  - Test menu DOM creation
  - Test button visibility
  - Test click handlers (Play, Settings, Leaderboard, Instructions)
  - Test keyboard navigation (arrow keys)
  - Test keyboard selection (Enter)
  - Test settings panel creation
  - Test volume slider updates
  - Test localStorage persistence for settings
  - Test menu hide/show
  - Test focus management

### 3. Refactor Phase
- [x] Verify button labels and alignment
- [x] Optimize CSS for performance
- [x] Ensure keyboard navigation smooth
- [x] Test responsiveness on various screen sizes
- [x] Add hover feedback animations
- [x] Confirm all tests pass

## Completion Criteria

- [x] Main menu displays on game start (MainMenuState)
- [x] Play button visible and clickable
- [x] Settings button visible and clickable
- [x] Leaderboard button visible and clickable
- [x] Instructions button visible and clickable
- [x] Play button starts game (transitions to Playing state)
- [x] Settings button shows settings panel
- [x] Leaderboard button shows top 10 scores
- [x] Instructions button shows game controls
- [x] Keyboard navigation works (arrow keys to select, Enter to activate)
- [x] Settings persist to localStorage
- [x] Menu responds to mouse clicks
- [x] Menu styling matches game aesthetic (neon/cyberpunk)
- [x] Menu hidden during gameplay
- [x] Unit tests passing (20+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- MainMenu.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (visual check)
# Expected: Menu displays on startup, buttons clickable, keyboard navigation smooth
```

**Success Indicators**:
- Menu visible on game startup
- All buttons respond to clicks
- Keyboard navigation works smoothly
- Settings panel appears/disappears correctly
- Volume settings persist after page reload
- Unit tests passing (20+ test cases)

## Notes

- Menu is overlay UI (displayed on top of game canvas)
- Keyboard input only processed when MainMenuState active
- Settings panel is separate component (reused by pause menu in Task 4.4)
- Button order: Play, Settings, Leaderboard, Instructions
- Settings persist via localStorage (volume levels only)
- Instructions display game controls and objectives
- Keyboard shortcuts: ESC to close menus/panels (if applicable)
- Menu styling uses CSS with no external UI frameworks (pure HTML/CSS)

## Impact Scope

**Allowed Changes**: Button labels, menu layout, styling, keyboard shortcuts, additional settings
**Protected Areas**: GameStateMachine integration, InputSystem contracts, AudioManager interface
**Areas Affected**: UI/UX presentation, player settings management

## Deliverables

- MainMenu UI component with full interaction support
- SettingsPanel component for audio volume control
- CSS styling matching game aesthetic
- Comprehensive unit tests for menu interactions
- Ready for Task 4.1+ (FSM triggers MainMenuState which creates MainMenu)
- Ready for Task 4.4 (Pause menu reuses SettingsPanel)
