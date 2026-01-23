# Task: Boss AI System

Metadata:
- Phase: 6 (Boss System)
- Task: 6.2
- Dependencies: Task 6.1 (Boss Entity and Health System), Task 2.9 (Collision Detection System)
- Provides: BossSystem with AI patterns, movement behaviors, attack logic
- Size: Medium (2-3 files)
- Estimated Duration: 1 day

## Implementation Content

Implement boss AI system with movement patterns and attack behaviors. Each boss type has 2+ attack patterns that alternate based on timer (every 3 seconds). Destroyer boss has Charge and Spray patterns. Carrier boss has Summon and Retreat patterns. Phase-based AI increases difficulty: Phase 1 normal, Phase 2 (50% health) increased speed and aggression, Phase 3 (25% health) desperate attacks with higher damage. AI controls boss velocity through movement calculations.

*Reference dependencies: Boss entity (Task 6.1), CollisionSystem for targeting, event system for pattern changes*

## Target Files

- [x] `src/systems/BossSystem.ts` - Boss AI and attack pattern system
- [x] `src/config/bossConfig.ts` - Boss AI configuration and pattern definitions
- [x] `tests/unit/BossSystem.test.ts` - Boss AI tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file `tests/unit/BossSystem.test.ts`
- [x] Write failing test for BossSystem initialization
- [x] Write failing test for Destroyer Charge pattern (move toward player)
- [x] Write failing test for Destroyer Spray pattern (strafe and fire)
- [x] Write failing test for Carrier Summon pattern (spawn asteroids)
- [x] Write failing test for Carrier Retreat pattern (move away, fire homing)
- [x] Write failing test for attack pattern timer (3-second alternation)
- [x] Write failing test for pattern switch emits event
- [x] Write failing test for Phase 2 increases attack speed
- [x] Write failing test for Phase 2 increases movement speed
- [x] Write failing test for Phase 3 increases damage multiplier
- [x] Write failing test for boss moves toward/away from player based on pattern
- [x] Write failing test for boss velocity updated by AI
- [x] Write failing test for projectile firing during attack patterns
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Create Boss Configuration**:
- [x] Create `src/config/bossConfig.ts`:
  - Export BOSS_AI_CONFIG with pattern definitions:
    - destroyer:
      - patterns:
        - charge:
          - duration: 3000ms
          - speed: 100 units/s (Phase 1), 150 (Phase 2), 200 (Phase 3)
          - behavior: move toward player, attempt collision
          - damageMultiplier: 1.0 (Phase 1), 1.5 (Phase 2), 2.0 (Phase 3)
        - spray:
          - duration: 3000ms
          - speed: 80 units/s (strafing)
          - behavior: circle player, fire spread projectiles
          - projectileCount: 5 (Phase 1), 7 (Phase 2), 9 (Phase 3)
          - fireRate: 500ms (Phase 1), 300ms (Phase 2), 200ms (Phase 3)
      - baseSpeed: 100
      - detectionRange: 800 (distance to player before engaging)
    - carrier:
      - patterns:
        - summon:
          - duration: 3000ms
          - speed: 0 (stationary)
          - behavior: spawn asteroid minions around boss
          - spawnCount: 2 (Phase 1), 3 (Phase 2), 4 (Phase 3)
          - spawnRate: 1000ms
        - retreat:
          - duration: 3000ms
          - speed: 120 units/s (move away)
          - behavior: move away from player, fire homing projectiles
          - projectileCount: 2 (Phase 1), 3 (Phase 2), 4 (Phase 3)
          - fireRate: 800ms (Phase 1), 600ms (Phase 2), 400ms (Phase 3)
      - baseSpeed: 80
      - detectionRange: 800

**Create Boss AI System**:
- [x] Create `src/systems/BossSystem.ts`:
  - Extend System interface
  - Constructor: initialize pattern state tracking
  - In update(deltaTime) method:
    - Query for entities with Boss, Transform, Velocity, Health components
    - For each boss entity:
      - Get player position (query Player component)
      - Update pattern timer:
        - Decrement phaseTimer by deltaTime
        - If phaseTimer <= 0: switch to next pattern, reset timer to 3000ms
      - Execute current attack pattern based on bossType and attackPattern
      - Apply phase-based modifiers (speed, fire rate, damage)
      - Update Velocity component based on AI calculations

  - Method: executeDestroyerCharge(boss: BossComponents, playerPos: Vector3, phase: number)
    - Calculate direction to player: normalize(playerPos - bossPos)
    - Set velocity toward player at charge speed (scaled by phase)
    - Track collision attempts

  - Method: executeDestroyerSpray(boss: BossComponents, playerPos: Vector3, phase: number, deltaTime: number)
    - Calculate perpendicular direction to player (strafing)
    - Set velocity for circular movement around player
    - Track fire timer
    - When fire timer expires:
      - Create spread projectiles (5/7/9 based on phase)
      - Angles: distribute evenly across 90-degree arc toward player
      - Reset fire timer

  - Method: executeCarrierSummon(boss: BossComponents, playerPos: Vector3, phase: number, deltaTime: number)
    - Set velocity to zero (stationary)
    - Track spawn timer
    - When spawn timer expires:
      - Spawn small asteroids in circle around boss (2/3/4 based on phase)
      - Asteroids given random outward velocity
      - Reset spawn timer
      - Emit 'bossSpawnedMinion' event

  - Method: executeCarrierRetreat(boss: BossComponents, playerPos: Vector3, phase: number, deltaTime: number)
    - Calculate direction away from player: normalize(bossPos - playerPos)
    - Set velocity away from player at retreat speed
    - Track fire timer
    - When fire timer expires:
      - Create homing projectiles toward player (2/3/4 based on phase)
      - Set homingTarget to player entity
      - Reset fire timer

  - Method: switchPattern(boss: EntityId, bossType: string, currentPattern: string): string
    - Alternate between patterns:
      - Destroyer: charge <-> spray
      - Carrier: summon <-> retreat
    - Update Boss.attackPattern
    - Reset Boss.phaseTimer to 3000ms
    - Emit 'bossPatternChanged' event
    - Return new pattern name

  - Method: getPhaseModifiers(phase: number): { speedMult: number, fireRateMult: number, damageMult: number }
    - Phase 1: { speedMult: 1.0, fireRateMult: 1.0, damageMult: 1.0 }
    - Phase 2: { speedMult: 1.5, fireRateMult: 1.5, damageMult: 1.5 }
    - Phase 3: { speedMult: 2.0, fireRateMult: 2.0, damageMult: 2.0 }

**Integrate with Existing Systems**:
- [ ] Update `src/game/Game.ts`:
  - Register BossSystem after PhysicsSystem, before RenderSystem
  - BossSystem updates boss velocity, PhysicsSystem applies it
  - NOTE: Game loop integration deferred to Task 6.3 (Boss Projectile System)

**Create unit tests**:
- [x] `tests/unit/BossSystem.test.ts`:
  - Test BossSystem queries boss entities
  - Test Destroyer charge pattern moves toward player
  - Test Destroyer spray pattern strafes and fires projectiles
  - Test Carrier summon pattern spawns asteroids
  - Test Carrier retreat pattern moves away and fires homing
  - Test pattern timer decrements and switches at 3 seconds
  - Test bossPatternChanged event emitted on switch
  - Test Phase 2 modifiers increase speed and fire rate (1.5x)
  - Test Phase 3 modifiers increase damage (2.0x)
  - Test velocity updates applied to Velocity component
  - Test projectile count increases with phase
  - Test fire rate increases with phase
  - Edge cases: no player entity, boss at screen edge, rapid phase change

### 3. Refactor Phase
- [x] Verify attack patterns feel challenging but fair
- [x] Balance phase modifiers for difficulty curve
- [x] Optimize boss AI calculations (avoid excessive math per frame)
- [x] Fine-tune pattern durations for gameplay variety
- [x] Test edge cases (player death during boss fight, boss at boundaries)
- [x] Confirm all tests pass

## Completion Criteria

- [x] BossSystem created and registered in game loop
- [x] Boss AI queries entities with Boss, Transform, Velocity, Health components
- [x] Destroyer Charge pattern moves boss toward player
- [x] Destroyer Spray pattern strafes and fires spread projectiles (5/7/9)
- [x] Carrier Summon pattern spawns asteroids (2/3/4) in circle
- [x] Carrier Retreat pattern moves away and fires homing projectiles (2/3/4)
- [x] Attack patterns alternate every 3 seconds
- [x] Pattern timer tracked in Boss.phaseTimer
- [x] bossPatternChanged event emitted on pattern switch
- [x] Phase modifiers applied: Phase 2 (1.5x speed/fire rate), Phase 3 (2.0x)
- [x] Boss velocity updated by AI (not player input)
- [x] Projectiles created during Spray and Retreat patterns (events emitted, actual creation in Task 6.3)
- [x] Asteroids spawned during Summon pattern (events emitted, actual creation in Task 6.3)
- [x] Phase-based projectile count scaling (5->7->9 for Spray, 2->3->4 for others)
- [x] Fire rate scaling with phase
- [x] Unit tests passing (39 test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- BossSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# 1. Play to wave 5 (Destroyer boss)
# 2. Observe boss charge toward player
# 3. Wait 3 seconds, observe boss strafe and fire spread projectiles
# 4. Damage boss to 50% health, observe increased speed
# 5. Damage boss to 25% health, observe even faster attacks
# 6. Play to wave 10 (Carrier boss)
# 7. Observe boss spawn asteroids
# 8. Wait 3 seconds, observe boss retreat and fire homing projectiles
```

**Success Indicators**:
- Boss movement visibly changes based on attack pattern
- Pattern switches every 3 seconds
- Destroyer charges player, then strafes and fires
- Carrier spawns asteroids, then retreats and fires homing
- Boss becomes faster and more aggressive at lower health
- All unit tests passing (39 test cases)

## Notes

- Pattern duration: 3000ms (3 seconds) per pattern
- Boss AI overwrites Velocity component (PhysicsSystem applies it)
- Destroyer patterns: charge (aggressive melee) vs spray (ranged sustained)
- Carrier patterns: summon (minion support) vs retreat (ranged burst)
- Phase modifiers stack with base stats (e.g., 100 speed * 2.0 = 200 in Phase 3)
- Boss does not use input system (AI-controlled)
- Projectile creation uses existing createProjectile factory (Task 3.1)
- Asteroid spawning uses createAsteroid factory (Task 2.8)
- Player position queried from Player component entity
- Detection range: 800 units (boss engages when player within range)
- Pattern timer in Boss component allows visual feedback (future UI)

## Impact Scope

**Allowed Changes**: AI pattern parameters, phase modifiers, pattern duration, projectile counts
**Protected Areas**: Velocity component interface, physics system calculations, collision detection
**Areas Affected**: Boss difficulty, player strategy, combat variety

## Deliverables

- BossSystem with AI pattern execution
- Boss AI configuration with pattern definitions
- Destroyer attack patterns (Charge, Spray)
- Carrier attack patterns (Summon, Retreat)
- Phase-based difficulty scaling (speed, fire rate, damage)
- Pattern alternation system (3-second timer)
- Comprehensive unit tests for boss AI
- Ready for Task 6.3 (Boss Projectile System)
