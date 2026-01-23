# Task: Power-up Entities and Spawning

Metadata:
- Phase: 5 (Enhanced Features)
- Task: 5.3
- Dependencies: Task 2.7 (Asteroid Entity), Task 3.3 (Asteroid Destruction)
- Provides: createPowerUp factory, power-up spawning logic in AsteroidDestructionSystem
- Size: Small (2-3 files)
- Estimated Duration: 0.5 days

## Implementation Content

Create power-up entities that spawn on asteroid destruction with configurable probability. Power-ups are collectible items that drift slowly and despawn after a duration. Four types: Shield, RapidFire, MultiShot, and ExtraLife. The factory creates entities with proper components (Transform, Velocity, Collider, PowerUp, Renderable, Lifetime) and integrates with AsteroidDestructionSystem for spawning.

*Reference dependencies: createAsteroid pattern (Task 2.7), AsteroidDestructionSystem for spawn trigger*

## Target Files

- [x] `src/entities/createPowerUp.ts` - Power-up entity factory function
- [x] `src/systems/AsteroidDestructionSystem.ts` - Extended with power-up spawning
- [x] `tests/unit/createPowerUp.test.ts` - Power-up factory unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for createPowerUp factory
- [x] Write failing test for createPowerUp returns valid entity ID
- [x] Write failing test for power-up has TransformComponent at correct position
- [x] Write failing test for power-up has VelocityComponent with slow drift
- [x] Write failing test for power-up has ColliderComponent with 'powerup' layer
- [x] Write failing test for power-up has PowerUpComponent with correct type
- [x] Write failing test for power-up has RenderableComponent with correct meshType
- [x] Write failing test for power-up has LifetimeComponent (3000ms default)
- [x] Write failing test for shield power-up created correctly
- [x] Write failing test for rapidFire power-up created correctly
- [x] Write failing test for multiShot power-up created correctly
- [x] Write failing test for extraLife power-up created correctly
- [x] Write failing test for power-up spawn chance (10% probability)
- [x] Write failing test for random power-up type distribution
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement createPowerUp Factory**:
- [x] Create `src/entities/createPowerUp.ts`:
  - Interface CreatePowerUpOptions:
    - position: Vector3 (spawn location)
    - powerUpType: PowerUpType (shield, rapidFire, multiShot, extraLife)
    - lifetime?: number (default 3000ms)
    - velocity?: Vector3 (default slow random drift)
  - Function createPowerUp(world: World, options: CreatePowerUpOptions): EntityId
    - Create entity in world
    - Add TransformComponent:
      - position: options.position
      - rotation: Vector3(0, 0, 0)
      - scale: Vector3(1, 1, 1)
    - Add VelocityComponent:
      - linear: slow random drift (10-30 units/s)
      - angular: slow rotation for visual appeal
    - Add ColliderComponent:
      - shape: 'sphere'
      - radius: 10 (collectible size)
      - layer: 'powerup'
      - mask: ['player'] (only collides with player)
    - Add PowerUpComponent:
      - type: 'powerUp'
      - powerUpType: options.powerUpType
    - Add RenderableComponent:
      - meshType: `powerup_${options.powerUpType}` (e.g., 'powerup_shield')
      - material: 'emissive'
      - visible: true
    - Add LifetimeComponent:
      - remaining: options.lifetime || 3000
    - Return entity ID

**Extend AsteroidDestructionSystem**:
- [x] Update `src/systems/AsteroidDestructionSystem.ts`:
  - Import createPowerUp factory
  - Add spawnChance constant: 0.10 (10%)
  - In onAsteroidDestroyed handler:
    - Generate random value 0-1
    - If value < spawnChance:
      - Select random power-up type from PowerUpType options
      - Call createPowerUp with asteroid position
      - Optionally emit 'powerUpSpawned' event
  - Helper function: getRandomPowerUpType(): PowerUpType
    - Equal probability for all 4 types (25% each)

**Create unit tests**:
- [x] Create `tests/unit/createPowerUp.test.ts`:
  - Test entity creation returns valid ID
  - Test TransformComponent position matches input
  - Test VelocityComponent has slow drift speed
  - Test ColliderComponent layer is 'powerup'
  - Test ColliderComponent mask is ['player']
  - Test PowerUpComponent type for each power-up type
  - Test RenderableComponent meshType matches power-up type
  - Test LifetimeComponent default (3000ms)
  - Test LifetimeComponent custom value
  - Test all 4 power-up types create correctly
  - Test spawn probability (mock random)
  - Test random type distribution (mock random)

### 3. Refactor Phase
- [x] Verify all power-up types have correct configurations
- [x] Optimize spawn logic placement in destruction handler
- [x] Ensure power-up drift velocities feel natural
- [x] Add visual rotation to power-ups for visibility
- [x] Confirm all tests pass

## Completion Criteria

- [x] createPowerUp factory creates valid entities
- [x] Power-ups have correct components (Transform, Velocity, Collider, PowerUp, Renderable, Lifetime)
- [x] Power-ups spawn at asteroid destruction location
- [x] Power-ups have 10% spawn chance on asteroid destruction
- [x] Power-up types distributed randomly (25% each)
- [x] Power-ups move slowly (drift motion)
- [x] Power-ups despawn after 3 seconds (Lifetime component)
- [x] Power-ups only collide with player (mask: ['player'])
- [x] All 4 power-up types work: shield, rapidFire, multiShot, extraLife
- [x] Unit tests passing (15+ test cases) - 43 tests for createPowerUp + 7 tests for power-up spawning in AsteroidDestructionSystem
- [ ] Build succeeds with no errors (pre-existing AudioManager errors not related to this task)
- [x] Type checking passes (no errors in power-up related files)

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- createPowerUp.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (during integration)
# Expected: Power-ups spawn occasionally after asteroid destruction
```

**Success Indicators**:
- All unit tests passing (15+ test cases)
- Type checking passes
- Build succeeds
- Power-ups spawn at correct rate (approximately 10%)
- Power-ups visible and move slowly
- Power-ups despawn after 3 seconds

## Notes

- Power-up spawn rate (10%) provides occasional bonuses without overwhelming player
- Equal distribution of power-up types ensures variety
- Slow drift motion makes power-ups easier to collect
- 3-second lifetime creates urgency without frustration
- Emissive material makes power-ups visually distinct
- Power-ups only collide with player (not asteroids or projectiles)
- Lifetime component handled by existing LifetimeSystem (if exists) or PowerUpSystem

## Impact Scope

**Allowed Changes**: Spawn chance, lifetime duration, drift speed, power-up type probabilities
**Protected Areas**: World API, component interfaces, AsteroidDestructionSystem core logic
**Areas Affected**: Gameplay variety, power-up availability, visual presentation

## Deliverables

- createPowerUp entity factory with full component setup
- Power-up spawning integrated into AsteroidDestructionSystem
- Four power-up types: shield, rapidFire, multiShot, extraLife
- Comprehensive unit tests for power-up creation
- Ready for Task 5.4 (Power-up Effects System for collection and application)
