# Task: Enhanced HUD with Power-up Display

Metadata:
- Phase: 5 (Enhanced Features)
- Task: 5.5
- Dependencies: Task 3.7 (HUD System), Task 5.4 (Power-up Effects System)
- Provides: Enhanced HUD with power-up display area and timers
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Update HUD to display active power-ups with remaining time. Add power-up display area (top-right corner below weapon indicator) showing icons for each active power-up with countdown timers. Display updates every frame to reflect remaining duration, and icons disappear when effects expire. Supports multiple simultaneous power-ups with clear visual hierarchy.

*Reference dependencies: HUD component (Task 3.7), PowerUpEffectComponent for active effects, PowerUpSystem for effect data*

## Target Files

- [x] `src/ui/HUD.ts` - Extended with power-up display functionality
- [x] `tests/unit/HUD.test.ts` - Extended HUD tests for power-up display

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Extend test file for HUD power-up display
- [x] Write failing test for power-up display area exists in HUD
- [x] Write failing test for no power-ups shown when none active
- [x] Write failing test for shield power-up icon displayed when active
- [x] Write failing test for rapidFire power-up icon displayed when active
- [x] Write failing test for multiShot power-up icon displayed when active
- [x] Write failing test for extraLife indicator updates (lives count)
- [x] Write failing test for power-up timer shows remaining seconds
- [x] Write failing test for timer updates each frame
- [x] Write failing test for power-up icon removed when effect expires
- [x] Write failing test for multiple power-ups displayed simultaneously
- [x] Write failing test for power-up display order consistent
- [x] Write failing test for timer text formatting (seconds, decimals)
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Extend HUD Component**:
- [x] Update `src/ui/HUD.ts`:
  - Add power-up display container:
    - HTML element: div with class 'power-up-display'
    - Position: top-right, below weapon indicator
    - Layout: vertical stack of active power-ups
  - Add power-up icon elements:
    - Interface PowerUpIconElement:
      - container: HTMLElement
      - icon: HTMLElement (image or CSS-based icon)
      - timer: HTMLElement (text showing remaining time)
      - type: PowerUpType
  - Private activeIcons: Map<PowerUpType, PowerUpIconElement>
  - Method: createPowerUpIcon(type: PowerUpType): PowerUpIconElement
    - Create container div with class 'power-up-item'
    - Create icon element (CSS sprite or image) for type
    - Create timer text element
    - Append to power-up display container
    - Return element reference
  - Method: removePowerUpIcon(type: PowerUpType)
    - Get element from activeIcons map
    - Remove from DOM
    - Delete from map
  - Method: updatePowerUpDisplay(effects: ActivePowerUp[])
    - For each effect in effects:
      - If not in activeIcons: create icon
      - Update timer text: format remainingTime as seconds
    - For each icon in activeIcons:
      - If not in effects: remove icon
  - Method: formatTime(ms: number): string
    - Convert milliseconds to display format
    - If >= 10000: show whole seconds (e.g., "12s")
    - If < 10000: show one decimal (e.g., "9.5s")
    - If < 1000: show one decimal (e.g., "0.8s")
  - Update existing update(deltaTime, playerEntity) method:
    - Get PowerUpEffectComponent from player entity
    - If exists: call updatePowerUpDisplay(effects)
    - If not exists: clear all power-up icons

**Add Power-up Styling**:
- [x] Add CSS for power-up display:
  - .power-up-display: positioned top-right, flexbox column
  - .power-up-item: horizontal layout, icon + timer
  - .power-up-icon: sized icon with type-specific appearance
  - .power-up-timer: text styling matching HUD theme
  - Animations: fade-in on appear, fade-out on expire (optional)
  - Shield icon: blue/cyan glow
  - RapidFire icon: orange/fire effect
  - MultiShot icon: spread pattern visual
  - Pulse effect when timer < 3 seconds (warning)

**Extend unit tests**:
- [x] Update `tests/unit/HUD.test.ts`:
  - Test power-up display container exists
  - Test no icons when no effects
  - Test shield icon appears with active shield
  - Test rapidFire icon appears with active rapidFire
  - Test multiShot icon appears with active multiShot
  - Test extraLife updates lives count (handled by existing lives display)
  - Test timer text shows correct remaining time
  - Test timer updates each frame
  - Test icon removed when effect expires
  - Test multiple icons shown simultaneously
  - Test display order is consistent (alphabetical or priority)
  - Test time formatting (various values)
  - Test low-time warning visual (< 3s)

### 3. Refactor Phase
- [x] Verify icon visuals match power-up types
- [x] Optimize DOM updates (minimize reflows)
- [x] Add smooth transitions for icon appear/disappear
- [x] Ensure timer accuracy with variable deltaTime
- [x] Test multiple simultaneous power-ups
- [x] Confirm all tests pass

## Completion Criteria

- [x] Power-up display area added to HUD (top-right)
- [x] No icons shown when no power-ups active
- [x] Shield power-up shows icon when active
- [x] RapidFire power-up shows icon when active
- [x] MultiShot power-up shows icon when active
- [x] ExtraLife updates lives counter (existing HUD functionality)
- [x] Timers show remaining duration in seconds
- [x] Timers update every frame
- [x] Icons disappear when power-up expires
- [x] Multiple power-ups displayed correctly
- [x] Display order consistent (e.g., shield, rapidFire, multiShot)
- [x] Low-time warning visual (< 3 seconds remaining)
- [x] Unit tests passing (15+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- HUD.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (visual check)
# Expected: Power-up icons appear/disappear, timers count down
```

**Success Indicators**:
- Power-up icons visible in top-right during gameplay
- Timers count down accurately
- Icons disappear on expiry
- Multiple power-ups stack vertically
- Visual warning when time running out
- All unit tests passing (15+ test cases)

## Notes

- Power-up display is overlay UI (similar to other HUD elements)
- ExtraLife doesn't show in power-up display (updates lives counter instead)
- Timer format: "Xs" or "X.Xs" depending on remaining time
- Display order should be consistent to avoid visual jumping
- Low-time warning (< 3s) uses pulse animation or color change
- Icons can be CSS-based or small images/sprites
- Power-up display only visible in Playing state
- DOM updates should be efficient (update text, don't recreate elements)

## Impact Scope

**Allowed Changes**: Display positioning, timer formatting, icon styling, warning threshold
**Protected Areas**: HUD core functionality, PowerUpEffectComponent interface
**Areas Affected**: Visual feedback, player awareness of active effects

## Deliverables

- Enhanced HUD with power-up display area
- Power-up icons with countdown timers
- Visual feedback for expiring effects
- Comprehensive unit tests for power-up display
- Ready for Phase 5 integration testing
