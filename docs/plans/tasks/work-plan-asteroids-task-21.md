# Task: Wave Progression System

Metadata:
- Phase: 4 (Game Flow and Progression)
- Task: 4.2
- Dependencies: Task 3.3 (Asteroid Destruction), Task 3.4 (Scoring System)
- Provides: Extended WaveSystem implementation, wave progression logic
- Size: Small (2-3 files)
- Estimated Duration: 0.5 days

## Implementation Content

Extend WaveSystem to track wave progression, calculate asteroid counts and difficulty scaling, detect wave completion, and trigger next wave with appropriate delays. Implements difficulty curve where wave number increases asteroids and speed, with boss encounters every 5 waves. This enables progressive challenge and extended gameplay sessions.

*Reference dependencies: WaveSystem from Phase 2, AsteroidDestructionSystem, GameStateMachine for wave transitions*

## Target Files

- [x] `src/systems/WaveSystem.ts` - Extended wave progression logic
- [x] `tests/unit/WaveSystem.test.ts` - Wave progression unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for wave progression
- [x] Write failing test for wave counter initialization (starts at 1)
- [x] Write failing test for asteroid count calculation: 3 + (wave - 1) * 2
- [x] Write failing test for speed multiplier: min(1 + (wave - 1) * 0.05, 2.0) capped at 2x
- [x] Write failing test for wave 1: 3 asteroids, 1x speed
- [x] Write failing test for wave 2: 5 asteroids, 1.05x speed
- [x] Write failing test for wave 3: 7 asteroids, 1.10x speed
- [x] Write failing test for speed multiplier caps at 2.0
- [x] Write failing test for wave completion detection (all asteroids destroyed)
- [x] Write failing test for wave transition delay (3 seconds)
- [x] Write failing test for boss wave detection (every 5 waves: 5, 10, 15, ...)
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Extend WaveSystem**:
- [x] Create/update `src/systems/WaveSystem.ts`:
  - Add WaveState interface: currentWave, asteroidCount, lastWaveTime, waveTransitionTimer
  - Method: calculateAsteroidCount(wave: number) → 3 + (wave - 1) * 2
  - Method: calculateSpeedMultiplier(wave: number) → min(1 + (wave - 1) * 0.05, 2.0)
  - Method: isBossWave(wave: number) → wave % 5 === 0
  - Update onEnter(): Initialize wave 1 with 3 asteroids
  - Update onUpdate():
    - Track remaining asteroids in world
    - When asteroidCount === 0 AND all asteroids destroyed:
      - Start 3-second transition delay (waveTransitionDelay from config)
      - Increment wave counter
      - Emit "waveProgressed" event with new wave number
      - Spawn next wave (boss if isBossWave, else standard asteroids)
      - Reset asteroidCount
  - Prevent overlapping wave spawns during transition delay

**Create unit tests**:
- [x] Create `tests/unit/WaveSystem.test.ts`:
  - Test asteroid count formula for waves 1-10
  - Test speed multiplier calculation and capping
  - Test boss wave detection at waves 5, 10, 15, 20
  - Test wave transition with 3-second delay
  - Test waveProgressed event emission
  - Test asteroids spawned with correct properties (count, speed)
  - Test wave counter increments correctly
  - Edge cases: zero asteroids, immediate respawn, rapid wave changes

### 3. Refactor Phase
- [x] Verify asteroid count formula matches spec exactly
- [x] Optimize wave spawn logic (reuse asteroid factory)
- [x] Ensure speed multiplier applied to all asteroid velocities
- [x] Add safety checks for rapid wave transitions
- [x] Confirm all tests pass

## Completion Criteria

- [x] Asteroid count increases per formula: 3 + (wave - 1) * 2
- [x] Speed multiplier increases per formula: min(1 + (wave - 1) * 0.05, 2.0)
- [x] Speed multiplier capped at 2.0x (no excessive difficulty at late waves)
- [x] Wave transition delay respected (3 seconds minimum before next spawn)
- [x] All asteroids must be cleared before next wave spawns
- [x] Boss waves triggered at correct intervals (5, 10, 15, ...)
- [x] waveProgressed events emitted on wave advancement
- [x] Unit tests passing (20+ test cases)
- [x] Build succeeds with no errors (pre-existing MainMenu.ts errors unrelated to this task)
- [x] Type checking passes (pre-existing MainMenu.ts errors unrelated to this task)

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- WaveSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (during Phase 4 integration test)
# Expected: Asteroids increase with each wave, difficulty scales smoothly
```

**Success Indicators**:
- All unit tests passing (20+ test cases)
- Type checking passes
- Build succeeds
- Wave progression follows formula exactly
- Speed multiplier caps at 2x
- Boss waves trigger every 5 waves

## Notes

- Wave counter starts at 1 (not 0)
- Asteroid count formula: 3 + (wave - 1) * 2 = [Wave 1: 3, Wave 2: 5, Wave 3: 7, ...]
- Speed multiplier formula: min(1 + (wave - 1) * 0.05, 2.0) = [Wave 1: 1.0x, Wave 2: 1.05x, ..., Wave 21+: 2.0x]
- Boss waves: Every 5 waves (5, 10, 15, 20, ...) instead of asteroids
- Transition delay prevents immediate respawn, gives player brief rest
- Wave progression independent of player score (continuous escalation)
- Wave state is managed by WaveSystem, not by GameStateMachine

## Impact Scope

**Allowed Changes**: Adjust asteroid count formula, modify speed multiplier, change boss wave interval
**Protected Areas**: Event system, AsteroidDestructionSystem integration
**Areas Affected**: Game difficulty curve, asteroid spawning, wave timing

## Deliverables

- Extended WaveSystem with full progression logic
- Accurate asteroid count and speed scaling
- Boss wave detection system
- Comprehensive unit tests for wave formulas
- Ready for Task 4.1+ integration (GameStateMachine hands control to WaveSystem)
