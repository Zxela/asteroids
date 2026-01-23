# Task: Boss Rewards

Metadata:
- Phase: 6 (Boss System)
- Task: 6.4
- Dependencies: Task 6.1 (Boss Entity and Health System), Task 3.4 (Scoring System), Task 5.3 (Power-up Entities and Spawning)
- Provides: Boss defeat rewards (guaranteed power-up, bonus score), wave continuation
- Size: Small (2-3 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement boss defeat detection and reward system. When boss health reaches 0, spawn guaranteed power-up at boss location, award bonus score (1000 * wave level), emit bossDefeated event, and continue to next wave after 3-second delay. Extend BossHealthSystem to handle defeat logic. Extend ScoreSystem to handle boss score with wave multiplier. Extend WaveSystem to manage wave continuation after boss defeat.

*Reference dependencies: BossHealthSystem (Task 6.1), ScoreSystem (Task 3.4), createPowerUp (Task 5.3), WaveSystem (Task 4.2)*

## Target Files

- [x] `src/systems/BossHealthSystem.ts` - Extended with defeat logic
- [x] `src/systems/ScoreSystem.ts` - Extended with boss score
- [x] `src/systems/WaveSystem.ts` - Extended with boss wave continuation
- [x] `tests/unit/BossHealthSystem.test.ts` - Extended with defeat tests
- [x] `tests/unit/ScoreSystem.test.ts` - Extended with boss score tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Extend test file `tests/unit/BossHealthSystem.test.ts`
- [x] Write failing test for boss defeat detection (health = 0)
- [x] Write failing test for bossDefeated event emission
- [x] Write failing test for guaranteed power-up spawn at boss location
- [x] Write failing test for power-up type selection (random from all types)
- [x] Write failing test for boss entity cleanup after defeat
- [x] Extend test file `tests/unit/ScoreSystem.test.ts`
- [x] Write failing test for boss score calculation (1000 * wave)
- [x] Write failing test for boss score added to player total
- [x] Write failing test for scoreChanged event emission
- [x] Write failing test for different wave levels (wave 5 vs wave 10)
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Extend BossHealthSystem for Defeat Logic**:
- [x] Update `src/systems/BossHealthSystem.ts`:
  - In update(deltaTime) method:
    - After checking health:
      - If boss health <= 0:
        - Get boss position from Transform component
        - Call spawnBossReward(bossPosition, wave)
        - Emit 'bossDefeated' event with { bossId, bossType, wave, score }
        - Mark boss entity for removal from world
        - Hide health bar (BossHealthBar.hide())

  - Method: spawnBossReward(position: Vector3, wave: number): void
    - Select random power-up type from all available types:
      - Types: 'shield', 'rapidFire', 'multiShot', 'extraLife'
      - Random selection: Math.floor(Math.random() * 4)
    - Call createPowerUp(world, position, powerUpType)
    - Power-up spawns at boss death location
    - Power-up has standard lifetime (30 seconds, longer than normal)

  - Method: calculateBossScore(wave: number): number
    - Base score: 1000
    - Wave multiplier: wave level (e.g., wave 5 = 5000, wave 10 = 10000)
    - Formula: 1000 * wave
    - Return calculated score

**Extend ScoreSystem for Boss Score**:
- [x] Update `src/systems/ScoreSystem.ts`:
  - Listen for 'bossDefeated' event
  - On event received:
    - Extract wave from event data
    - Calculate boss score: 1000 * wave
    - Add to Player.score
    - Emit 'scoreChanged' event with { newScore, scoreDelta, reason: 'boss' }
  - Existing asteroid score logic unchanged

**Extend WaveSystem for Boss Wave Continuation**:
- [x] Update `src/systems/WaveSystem.ts`:
  - Listen for 'bossDefeated' event
  - On event received:
    - Set wave clear flag (no asteroids to check)
    - Start wave transition timer (3000ms delay)
    - After delay:
      - Increment current wave
      - Start next wave (asteroid wave, not another boss)
      - Emit 'waveStarted' event
  - Boss wave completion logic:
    - Check if boss entity exists
    - If boss defeated (no boss entity), proceed to next wave
    - Next wave after boss: normal asteroid wave (unless next boss wave)

**Create/Extend unit tests**:
- [x] Update `tests/unit/BossHealthSystem.test.ts`:
  - Test boss defeat detected when health = 0
  - Test bossDefeated event emitted with correct data
  - Test power-up spawned at boss position
  - Test power-up type random selection (all 4 types possible)
  - Test boss entity removed from world
  - Test health bar hidden on defeat
  - Test boss score calculated correctly (1000 * wave)
  - Edge cases: boss defeated by single hit, boss at screen edge

- [x] Update `tests/unit/ScoreSystem.test.ts`:
  - Test boss score listener registered
  - Test boss score added to player total
  - Test score calculation for wave 5 (5000 points)
  - Test score calculation for wave 10 (10000 points)
  - Test score calculation for wave 20 (20000 points)
  - Test scoreChanged event emitted with boss reason
  - Test score persists across multiple boss defeats
  - Edge cases: boss defeat with 0 score before, max score scenarios

### 3. Refactor Phase
- [x] Verify boss score formula feels rewarding
- [x] Balance power-up spawn rate (guaranteed vs random type)
- [x] Optimize boss cleanup (ensure no memory leaks)
- [x] Test wave continuation timing (3-second delay appropriate)
- [x] Test edge cases (rapid boss defeat, boss defeat during next wave)
- [x] Confirm all tests pass

## Completion Criteria

- [x] Boss defeat detected when health reaches 0
- [x] bossDefeated event emitted with boss data (id, type, wave, score)
- [x] Guaranteed power-up spawned at boss position
- [x] Power-up type randomly selected from all 4 types
- [x] Power-up lifetime: 30 seconds (extended from normal 3 seconds)
- [x] Boss entity removed from world after defeat
- [x] Boss health bar hidden on defeat
- [x] Boss score calculated: 1000 * wave level
- [x] Boss score added to player total score
- [x] scoreChanged event emitted with boss reason
- [x] Wave 5 boss defeat awards 5000 points
- [x] Wave 10 boss defeat awards 10000 points
- [x] Wave transition delay: 3 seconds after boss defeat
- [x] Next wave begins after delay (asteroid wave unless next boss wave)
- [x] Unit tests passing (10+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- BossHealthSystem.test.ts
npm test -- ScoreSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# 1. Play to wave 5 (Destroyer boss)
# 2. Defeat boss, verify health bar disappears
# 3. Verify power-up spawns at boss location
# 4. Verify score increases by 5000 (1000 * 5)
# 5. Wait 3 seconds, verify next wave starts
# 6. Play to wave 10 (Carrier boss)
# 7. Defeat boss, verify score increases by 10000 (1000 * 10)
# 8. Collect spawned power-up, verify effect applied
```

**Success Indicators**:
- Boss disappears on defeat
- Power-up spawns at boss location
- Score visibly increases by 1000 * wave
- Next wave starts after 3 seconds
- Power-up collectible and functional
- All unit tests passing (10+ test cases)

## Notes

- Boss score formula: 1000 * wave level (scales with difficulty)
- Wave 5: 5000 points, Wave 10: 10000 points, Wave 15: 15000 points
- Guaranteed power-up spawn (100% drop rate vs 10% for asteroids)
- Power-up type: random selection from all 4 types (equal probability)
- Power-up lifetime extended to 30 seconds (vs 3 for asteroid drops)
- Boss entity cleanup prevents memory leaks
- Health bar hidden immediately on defeat
- Wave transition delay: 3 seconds (same as asteroid wave clear)
- Next wave after boss: increments wave counter, spawns asteroids
- Boss wave every 5 levels: 5, 10, 15, 20, etc.
- Score event reason: 'boss' (distinct from 'asteroid')
- Power-up spawn position: exact boss Transform position at defeat
- Boss cleanup: remove from world, destroy mesh, clear references

## Impact Scope

**Allowed Changes**: Boss score formula, power-up spawn rate, wave delay timing
**Protected Areas**: Power-up creation API, score calculation system, wave progression logic
**Areas Affected**: Player motivation, reward pacing, difficulty progression

## Deliverables

- Boss defeat detection in BossHealthSystem
- Guaranteed power-up spawn at boss location
- Boss score calculation and award (1000 * wave)
- Wave continuation after boss defeat
- Boss entity cleanup
- Health bar hiding on defeat
- Comprehensive unit tests for boss rewards
- Ready for Phase 6 verification and Phase 7 (Visual Polish)
