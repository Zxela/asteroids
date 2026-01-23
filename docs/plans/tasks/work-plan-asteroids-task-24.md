# Task: Game Over Screen

Metadata:
- Phase: 4 (Game Flow and Progression)
- Task: 4.5
- Dependencies: Task 4.1 (Game State Machine), Task 3.4 (Scoring System)
- Provides: GameOverScreen UI component and game end state handling
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Create game over screen displaying final score, wave reached, and player name input field. Screen appears when player loses all lives (PlayerDied event), allows name entry for leaderboard submission, and provides options to retry or return to menu. Integrates with GameStateMachine to transition from Playing to GameOver state.

*Reference dependencies: GameStateMachine, ScoreSystem (final score), WaveSystem (wave count), LeaderboardStorage for score persistence*

## Target Files

- [ ] `src/ui/GameOverScreen.ts` - Game over UI and name entry
- [ ] `tests/unit/GameOverScreen.test.ts` - Game over UI tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [ ] Create test file for game over screen
- [ ] Write failing test for game over screen creation
- [ ] Write failing test for game over screen hidden initially
- [ ] Write failing test for game over screen shows on playerDied event
- [ ] Write failing test for final score displayed
- [ ] Write failing test for wave reached displayed
- [ ] Write failing test for name input field visible
- [ ] Write failing test for submit button visible
- [ ] Write failing test for try again button visible
- [ ] Write failing test for main menu button visible
- [ ] Write failing test for submit saves score to leaderboard
- [ ] Write failing test for try again restarts game (Playing state)
- [ ] Write failing test for main menu returns to menu (MainMenu state)
- [ ] Verify all tests fail (Red state)

### 2. Green Phase

**Implement GameOverScreen Component**:
- [ ] Create `src/ui/GameOverScreen.ts`:
  - Class GameOverScreen with methods:
    - constructor(gameStateMachine: GameStateMachine, leaderboardStorage: LeaderboardStorage)
    - show(finalScore: number, waveReached: number): Display game over screen
    - hide(): Remove game over screen from DOM
    - update(deltaTime: number): Handle keyboard/mouse input
  - HTML structure:
    - Container div with game over styling
    - Title: "GAME OVER"
    - Text: "Final Score: {score}"
    - Text: "Wave Reached: {wave}"
    - Label: "Enter your name:"
    - Input field: Text input, placeholder "Player"
    - Button: "Submit" (class "button submit-button")
    - Button: "Try Again" (class "button try-again-button")
    - Button: "Main Menu" (class "button main-menu-button")
  - Input handling:
    - Text input: Capture player name (max 20 chars)
    - Submit button: Save score to leaderboard, trigger Leaderboard display
    - Try Again button: Restart game (Playing state, wave 1)
    - Main Menu button: Return to MainMenu state
  - Keyboard:
    - Enter in name field: Submit score
    - Arrow keys: Navigate buttons
    - Enter: Activate focused button
    - ESC: Return to Main Menu (instead of pausing)

**Integrate with GameStateMachine**:
- [ ] Update RespawnSystem (Phase 3):
  - When Player.lives reach 0:
    - Emit "playerDied" event with final score and wave number
    - Transition GameStateMachine to GameOver state

- [ ] Update GameStateMachine:
  - Handle "playerDied" event → transition to GameOver state
  - GameOver state entry: Create GameOverScreen, show final stats
  - GameOver state exit: Destroy GameOverScreen, reset game data

- [ ] Update Game class:
  - Capture final score/wave from Player component
  - Pass to GameOverScreen when created
  - Handle restart: Reset World, reset Player (lives, score), transition to Playing

**Create unit tests**:
- [ ] Create `tests/unit/GameOverScreen.test.ts`:
  - Test screen creation
  - Test screen initially hidden
  - Test screen shows on playerDied event
  - Test score display (various numbers)
  - Test wave display (various numbers)
  - Test name input field exists
  - Test name input captures text
  - Test submit button saves to leaderboard
  - Test try again button restarts (Playing state)
  - Test main menu button transitions (MainMenu state)
  - Test keyboard navigation (arrow keys)
  - Test Enter in name field submits
  - Test ESC returns to menu
  - Test max name length (20 chars)

### 3. Refactor Phase
- [ ] Verify score and wave display accuracy
- [ ] Ensure name input validation (max length, sanitization)
- [ ] Test form submission flow
- [ ] Optimize styling for readability
- [ ] Confirm leaderboard save integration
- [ ] Confirm all tests pass

## Completion Criteria

- [ ] Game Over screen shows on playerDied event (lives reach 0)
- [ ] Final score displayed correctly
- [ ] Wave reached displayed correctly
- [ ] Name input field available (max 20 characters)
- [ ] Submit button saves to leaderboard
- [ ] Try Again button restarts game (Playing state, wave 1, 3 lives, score reset)
- [ ] Main Menu button returns to MainMenu state
- [ ] Keyboard navigation works (arrow keys to select, Enter to submit)
- [ ] Enter key in name field submits score
- [ ] ESC key returns to Main Menu
- [ ] Name input captures text correctly
- [ ] Unit tests passing (15+ test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- GameOverScreen.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check during Phase 4 integration)
# Expected: Screen appears on death, buttons work, score saves
```

**Success Indicators**:
- Game Over screen appears when lives reach 0
- Final score and wave displayed correctly
- Name input works and submits
- Try Again restarts with fresh state
- Main Menu returns without errors
- Scores persist in leaderboard
- Unit tests passing (15+ test cases)

## Notes

- Game Over screen only appears when PlayerDied event triggered (lives = 0)
- Score and wave are final at moment of death (no further gameplay)
- Name input is required before leaderboard submission (minimum 1 character)
- Try Again creates fresh world/entities (same as pressing Play from menu)
- Main Menu returns without saving if Submit not clicked
- Screen styling similar to other menus (neon/cyberpunk aesthetic)
- Leaderboard save includes: name, score, wave, timestamp
- Game Over is a terminal state requiring explicit transition choice

## Impact Scope

**Allowed Changes**: Button labels, screen layout, styling, name input validation
**Protected Areas**: GameStateMachine transitions, LeaderboardStorage interface, Player component
**Areas Affected**: Game end state handling, leaderboard persistence, game restart flow

## Deliverables

- GameOverScreen UI component with name entry
- Score and wave display logic
- Leaderboard submission integration
- Game restart handling (fresh world setup)
- Comprehensive unit tests for game over functionality
- Ready for Task 4.1+ (FSM triggers GameOver state on playerDied event)
- Ready for Task 4.6 (Leaderboard reads saved scores)
