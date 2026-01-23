# Task: Boss Entity and Health System

Metadata:
- Phase: 6 (Boss System)
- Task: 6.1
- Dependencies: Task 4.2 (Wave Progression System), Task 3.5 (Lives System with Respawn)
- Provides: Boss entity factory, BossHealthSystem, health bar UI
- Size: Medium (3-4 files)
- Estimated Duration: 1 day

## Implementation Content

Create boss entity with factory function supporting two boss types (Destroyer and Carrier). Implement BossHealthSystem to monitor boss health, display health bar (DOM overlay), trigger phase changes at 50% and 0% health thresholds, and emit events for damage and phase transitions. Boss spawns at wave 5, 10, 15, etc., via WaveSystem integration. Boss has multi-phase behavior based on health percentage.

*Reference dependencies: WaveSystem (Task 4.2), Health component (Task 3.5), event system*

## Target Files

- [x] `src/entities/createBoss.ts` - Boss factory function
- [x] `src/systems/BossHealthSystem.ts` - Health monitoring and phase management
- [x] `src/components/Boss.ts` - Boss component definition
- [x] `src/ui/BossHealthBar.ts` - Boss health bar UI
- [x] `tests/unit/createBoss.test.ts` - Boss creation tests
- [x] `tests/unit/BossHealthSystem.test.ts` - Health system tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file `tests/unit/createBoss.test.ts`
- [x] Write failing test for boss creation with Destroyer type
- [x] Write failing test for boss creation with Carrier type
- [x] Write failing test for boss components: Transform, Velocity, Physics, Collider, Health, Boss, Renderable
- [x] Write failing test for boss initial position (screen center)
- [x] Write failing test for boss health based on wave level
- [x] Write failing test for boss collider radius = 50
- [x] Write failing test for boss initial phase = 1
- [x] Create test file `tests/unit/BossHealthSystem.test.ts`
- [x] Write failing test for boss health monitoring
- [x] Write failing test for health bar display updates
- [x] Write failing test for phase transition at 50% health
- [x] Write failing test for phase transition at 0% health
- [x] Write failing test for bossPhaseChanged event emission
- [x] Write failing test for bossDamaged event emission
- [x] Write failing test for bossDefeated event emission
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Create Boss Component**:
- [x] Create `src/components/Boss.ts`:
  - Implement Boss component interface:
    - bossType: 'destroyer' | 'carrier'
    - phase: number (1, 2, 3)
    - phaseTimer: number (ms)
    - attackPattern: string (current attack pattern name)
  - Extend Component interface
  - Export from `src/components/index.ts`

**Create Boss Entity Factory**:
- [x] Create `src/entities/createBoss.ts`:
  - Factory function: createBoss(world: World, bossType: 'destroyer' | 'carrier', wave: number): EntityId
  - Calculate boss health based on wave:
    - Base health: Destroyer = 100, Carrier = 150
    - Wave scaling: base * (1 + (wave - 5) * 0.2)
  - Create entity with components:
    - Transform: position at screen center (0, 0, 0), rotation 0, scale based on type
    - Velocity: linear (0,0,0), angular 0 (AI controls movement)
    - Physics: mass 10, damping 0, maxSpeed 150, wrapScreen false
    - Collider: sphere, radius 50, layer "boss", mask includes "player" and "projectile"
    - Health: current/max based on calculation, invulnerable false
    - Boss: bossType, phase 1, phaseTimer 0, attackPattern 'idle'
    - Renderable: meshType `boss_${bossType}`, material "emissive"
  - Return EntityId

**Create Boss Health System**:
- [x] Create `src/systems/BossHealthSystem.ts`:
  - Extend System interface
  - In update(deltaTime) method:
    - Query for entities with Boss and Health components
    - For each boss entity:
      - Track previous health percentage
      - Calculate current health percentage: current / max
      - Check for phase transitions:
        - If health crosses 50% threshold (from above): set phase = 2, emit 'bossPhaseChanged'
        - If health crosses 0%: emit 'bossDefeated', mark for cleanup
      - Update health bar display
      - If health changed: emit 'bossDamaged' event
  - Method: getPhaseFromHealth(currentHealth: number, maxHealth: number): number
    - Returns 1 if health > 50%, 2 if health 25-50%, 3 if health < 25%
  - Method: emitPhaseChangeEvent(bossId: EntityId, newPhase: number)

**Create Boss Health Bar UI**:
- [x] Create `src/ui/BossHealthBar.ts`:
  - HTML overlay positioned at top center of screen
  - Display elements:
    - Boss name (based on bossType)
    - Health bar (progress bar style)
    - Health percentage text
  - Methods:
    - show(bossName: string): void - Make health bar visible
    - hide(): void - Hide health bar
    - update(current: number, max: number): void - Update bar width and percentage
  - Styling:
    - Width: 400px
    - Height: 30px
    - Background: dark with border
    - Fill color: gradient from red (low) to yellow (mid) to green (high)
    - Positioned 50px from top

**Extend WaveSystem for Boss Spawning**:
- [ ] Update `src/systems/WaveSystem.ts`:
  - In wave start logic:
    - Check if current wave is divisible by 5 (wave % 5 === 0)
    - If yes:
      - Determine boss type: wave % 10 === 0 ? 'carrier' : 'destroyer'
      - Call createBoss(world, bossType, wave)
      - Skip asteroid spawning for boss wave
      - Show BossHealthBar
      - Emit 'bossWaveStarted' event
  - In wave clear logic:
    - On boss defeat: hide BossHealthBar
    - Transition to next wave after 3-second delay
  - NOTE: WaveSystem integration is deferred to a separate task for boss spawning logic

**Create unit tests**:
- [x] `tests/unit/createBoss.test.ts`:
  - Test boss created with Destroyer type
  - Test boss created with Carrier type
  - Test boss has all required components
  - Test boss initial position at screen center
  - Test boss health scaling with wave level
  - Test boss collider radius and layers
  - Test boss initial phase = 1
  - Test Destroyer vs Carrier base health difference
  - Edge cases: wave 5, wave 10, wave 100

- [x] `tests/unit/BossHealthSystem.test.ts`:
  - Test health monitoring updates health bar
  - Test phase transition at 50% health
  - Test phase transition at 25% health
  - Test bossPhaseChanged event emitted
  - Test bossDamaged event emitted on health change
  - Test bossDefeated event emitted at 0 health
  - Test health bar shows/hides correctly
  - Test multiple bosses (only one at a time in actual game)
  - Edge cases: instant kill, gradual damage

### 3. Refactor Phase
- [x] Verify boss health scaling formula feels balanced
- [x] Optimize boss health bar rendering (update only on change)
- [x] Ensure boss collider size appropriate for visual mesh
- [x] Add visual feedback for phase transitions
- [x] Test edge cases (boss spawning, immediate defeat)
- [x] Confirm all tests pass

## Completion Criteria

- [x] Boss entity created with createBoss factory
- [ ] Boss spawns at wave 5, 10, 15, etc. (every 5 waves) - NOTE: WaveSystem integration deferred
- [x] Boss has correct components: Transform, Velocity, Physics, Collider, Health, Boss, Renderable
- [x] Boss health calculated based on wave: base * (1 + (wave - 5) * 0.2)
- [x] Destroyer base health: 100, Carrier base health: 150
- [x] Boss collider radius: 50 units
- [x] Boss initial phase: 1
- [x] BossHealthSystem monitors boss health
- [x] Health bar displayed at top center (400px wide, 30px tall)
- [x] Health bar updates on damage
- [x] Phase transition at 50% health (phase 1 → 2)
- [x] Phase transition at 25% health (phase 2 → 3)
- [x] bossPhaseChanged event emitted on phase change
- [x] bossDamaged event emitted on health decrease
- [x] bossDefeated event emitted at 0 health
- [x] Health bar color gradient: green → yellow → red
- [x] Unit tests passing (15+ test cases) - 59 tests passing
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- createBoss.test.ts
npm test -- BossHealthSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# 1. Play to wave 5
# 2. Verify boss spawns
# 3. Verify health bar appears
# 4. Shoot boss and verify health bar updates
# 5. Damage boss to 50% health, verify phase change
# 6. Defeat boss, verify health bar disappears
```

**Success Indicators**:
- Boss spawns at wave 5 with health bar
- Health bar updates smoothly on damage
- Phase transitions visible (boss behavior change in Task 6.2)
- Boss defeated triggers next wave
- All unit tests passing (15+ test cases)

## Notes

- Boss types: Destroyer (aggressive, charge attacks), Carrier (summons minions)
- Wave 5, 15, 25: Destroyer boss
- Wave 10, 20, 30: Carrier boss
- Health scaling prevents bosses from being too easy at high waves
- Phase system: 1 (100-51%), 2 (50-26%), 3 (25-0%)
- Boss does not wrap screen (wrapScreen: false in Physics component)
- Health bar positioned to avoid HUD overlap
- Only one boss at a time (single entity)
- Boss defeat triggers normal wave progression (next wave starts)
- Phase timer used in Task 6.2 for attack pattern timing

## Impact Scope

**Allowed Changes**: Boss health formula, collider size, health bar styling, phase thresholds
**Protected Areas**: Health component interface, collision system, event emission mechanism
**Areas Affected**: Wave progression, difficulty scaling, player strategy

## Deliverables

- Boss entity factory (createBoss)
- Boss component definition
- BossHealthSystem with phase management
- Boss health bar UI
- WaveSystem integration for boss spawning
- Comprehensive unit tests for boss creation and health system
- Ready for Task 6.2 (Boss AI and Attack Patterns)
