# Task: Leaderboard System

Metadata:
- Phase: 4 (Game Flow and Progression)
- Task: 4.6
- Dependencies: Task 4.5 (Game Over Screen)
- Provides: LeaderboardStorage utility, Leaderboard UI component
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement leaderboard system with localStorage persistence for player scores. Stores entries with name, score, wave, and timestamp. Displays top 10 scores sorted descending, accessible from main menu or after game submission. Handles localStorage unavailability gracefully with in-memory fallback. Enables score persistence across page reloads and provides high score comparison.

*Reference dependencies: GameOverScreen for score submission, MainMenu for leaderboard display button*

## Target Files

- [ ] `src/utils/LeaderboardStorage.ts` - Leaderboard persistence logic
- [ ] `src/ui/Leaderboard.ts` - Leaderboard display UI
- [ ] `tests/unit/LeaderboardStorage.test.ts` - Storage tests
- [ ] `tests/unit/Leaderboard.test.ts` - UI tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**LeaderboardStorage Tests**:
- [ ] Write failing test for save score with name, score, wave
- [ ] Write failing test for load all scores from localStorage
- [ ] Write failing test for scores sorted descending by score
- [ ] Write failing test for top 10 entries returned (if more than 10 saved)
- [ ] Write failing test for localStorage unavailability handling
- [ ] Write failing test for score validity checks (non-negative, integer)
- [ ] Write failing test for duplicate names allowed
- [ ] Write failing test for timestamp added to entry
- [ ] Write failing test for clear all scores
- [ ] Write failing test for export scores as JSON

**Leaderboard UI Tests**:
- [ ] Write failing test for leaderboard creation
- [ ] Write failing test for leaderboard hidden initially
- [ ] Write failing test for leaderboard shows on request
- [ ] Write failing test for top 10 entries displayed
- [ ] Write failing test for correct columns: Rank, Name, Score, Wave
- [ ] Write failing test for entries sorted by score descending
- [ ] Write failing test for back button hides leaderboard
- [ ] Write failing test for scrolling if more than 10 entries (UI feature)
- [ ] Write failing test for highlights player's entry if just submitted
- [ ] Verify all tests fail (Red state)

### 2. Green Phase

**Implement LeaderboardStorage**:
- [ ] Create `src/utils/LeaderboardStorage.ts`:
  - Interface LeaderboardEntry:
    - name: string (1-20 characters)
    - score: number (non-negative integer)
    - wave: number (integer)
    - timestamp: number (milliseconds since epoch)
    - rank?: number (calculated on retrieval)
  - Class LeaderboardStorage:
    - constructor(storageKey = 'asteroids-leaderboard', maxEntries = 100)
    - saveScore(entry: LeaderboardEntry): void
      - Validate name (1-20 chars), score (non-negative), wave (positive)
      - Add timestamp if not present
      - Save to localStorage
      - Save to in-memory array as fallback
      - Emit "scoreAdded" event
    - loadScores(): LeaderboardEntry[]
      - Try load from localStorage
      - Fallback to in-memory array if unavailable
      - Return all entries in in-memory storage
    - getTopScores(count = 10): LeaderboardEntry[]
      - Load all scores
      - Sort by score descending, then by timestamp (newer first)
      - Calculate rank
      - Return top `count` entries
    - getAllScores(): LeaderboardEntry[]
      - Return all scores sorted descending
    - clearAllScores(): void
      - Clear localStorage
      - Clear in-memory array
    - getPlayerRank(playerName: string): number
      - Find highest score for player name
      - Calculate rank among all scores
    - isInTopTen(score: number): boolean
      - Check if score would be in top 10

**Implement Leaderboard UI**:
- [ ] Create `src/ui/Leaderboard.ts`:
  - Class Leaderboard with methods:
    - constructor(leaderboardStorage: LeaderboardStorage)
    - show(highlightPlayerName?: string): Display leaderboard overlay
    - hide(): Remove leaderboard from DOM
    - update(deltaTime: number): Handle keyboard input
  - HTML structure:
    - Modal overlay (semi-transparent)
    - Title: "HIGH SCORES"
    - Table/list with columns:
      - Rank (1-10)
      - Name (player name)
      - Score (formatted with commas)
      - Wave (highest wave reached)
    - Rows: Top 10 entries
    - Highlight row: If highlightPlayerName provided, highlight matching entry
    - Button: "Back" or "Close" (class "button back-button")
  - Styling:
    - Table-like layout (fixed width columns)
    - Alternating row colors for readability
    - Highlighted row with glow effect
    - Rank 1-3 with special styling (gold, silver, bronze)
    - Responsive design
  - Input handling:
    - ESC: Close leaderboard
    - Click Back button: Close leaderboard
    - Arrow keys: Scroll if needed (optional)

**Create unit tests**:
- [ ] Create `tests/unit/LeaderboardStorage.test.ts`:
  - Test score save and load
  - Test top 10 retrieval (various quantities)
  - Test sorting accuracy (multiple scores)
  - Test localStorage fallback
  - Test score validation
  - Test duplicate names allowed
  - Test timestamp auto-addition
  - Test clear all scores
  - Test rank calculation
  - Test score in top 10 detection
  - Edge cases: empty storage, single entry, tied scores

- [ ] Create `tests/unit/Leaderboard.test.ts`:
  - Test leaderboard creation
  - Test show/hide functionality
  - Test top 10 display
  - Test sorting (scores descending)
  - Test columns visible (Rank, Name, Score, Wave)
  - Test highlight feature
  - Test back button closes
  - Test keyboard input (ESC)
  - Test formatting (commas in scores)
  - Test rank numbering (1-10)

### 3. Refactor Phase
- [ ] Verify localStorage error handling
- [ ] Test score sorting with ties
- [ ] Optimize table rendering performance
- [ ] Add number formatting (commas in scores)
- [ ] Test rank highlighting on just-submitted scores
- [ ] Confirm all tests pass

## Completion Criteria

- [ ] Scores persist to localStorage
- [ ] Scores load from localStorage on startup
- [ ] Top 10 entries displayed in correct order (descending by score)
- [ ] Entries show: Rank (1-10), Name, Score, Wave
- [ ] Leaderboard visible from main menu
- [ ] Leaderboard shown after score submission
- [ ] New player name entry highlighted after submission
- [ ] Graceful fallback if localStorage unavailable
- [ ] Score validation (non-negative, integer)
- [ ] Name validation (1-20 characters)
- [ ] Clear/reset functionality (for testing)
- [ ] Scores persist across page reloads
- [ ] Unit tests passing (20+ test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- LeaderboardStorage.test.ts
npm test -- Leaderboard.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification
# Expected: Scores persist, display correctly, handle storage errors
```

**Success Indicators**:
- Scores save and load from localStorage
- Top 10 displayed correctly sorted
- New score persists after page reload
- UI shows correct rank/name/score/wave
- All tests passing (20+ test cases)

## Notes

- localStorage key: 'asteroids-leaderboard' (configurable)
- Max stored entries: 100 (older entries may be pruned if space needed)
- Top 10 display: Shows best scores only
- Rank calculation: Automatic based on score order
- Timestamp: Added automatically on save
- Duplicate names: Allowed (each score counted separately)
- Storage fallback: Uses in-memory array if localStorage fails
- Score uniqueness: Not enforced (same score multiple times allowed)
- Name format: Any string 1-20 characters (no special validation)
- Sorting: Score descending, then timestamp (newer first for ties)

## Impact Scope

**Allowed Changes**: Storage key, max entries, top 10 count, sort order
**Protected Areas**: localStorage API usage, entry interface contract
**Areas Affected**: Score persistence, leaderboard display, main menu features

## Deliverables

- LeaderboardStorage utility with full persistence logic
- Leaderboard UI component for display and interaction
- localStorage fallback for unavailable storage
- Score validation and rank calculation
- Comprehensive unit tests for storage and UI
- Ready for Task 4.5+ (GameOverScreen triggers leaderboard save)
- Ready for Task 4.3+ (MainMenu displays leaderboard button)
