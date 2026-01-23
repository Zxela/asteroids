# Task: Power-up Effects System

Metadata:
- Phase: 5 (Enhanced Features)
- Task: 5.4
- Dependencies: Task 5.3 (Power-up Entities), Task 2.9 (Collision System)
- Provides: PowerUpSystem implementation, effect application and timer management
- Size: Medium (3 files)
- Estimated Duration: 0.5-1 day

## Implementation Content

Implement power-up collection and effect application system. PowerUpSystem listens for collisions between player and power-up entities, applies effects based on power-up type, manages effect timers, and removes expired effects. Effects include: Shield (10s invulnerability), RapidFire (15s halved cooldown), MultiShot (15s 3-projectile pattern), ExtraLife (permanent +1 life).

*Reference dependencies: Collision events from CollisionSystem, createPowerUp entities, WeaponComponent for weapon modifications*

## Target Files

- [x] `src/systems/PowerUpSystem.ts` - Power-up collection and effect management
- [x] `src/config/powerUpConfig.ts` - Power-up effect configurations
- [x] `tests/unit/PowerUpSystem.test.ts` - Power-up system unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for PowerUpSystem
- [x] Write failing test for PowerUpSystem initialization
- [x] Write failing test for collision between player and power-up detected
- [x] Write failing test for power-up entity removed on collection
- [x] Write failing test for powerUpCollected event emitted
- [x] Write failing test for Shield effect grants invulnerability
- [x] Write failing test for Shield effect duration is 10 seconds
- [x] Write failing test for RapidFire effect halves weapon cooldown
- [x] Write failing test for RapidFire effect duration is 15 seconds
- [x] Write failing test for MultiShot effect changes projectile count
- [x] Write failing test for MultiShot effect duration is 15 seconds
- [x] Write failing test for ExtraLife increments player lives
- [x] Write failing test for ExtraLife effect is permanent (no timer)
- [x] Write failing test for effect timers decrement each frame
- [x] Write failing test for expired effects removed
- [x] Write failing test for multiple effects can be active simultaneously
- [x] Write failing test for collecting same power-up refreshes timer
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Create Power-up Configuration**:
- [x] Create `src/config/powerUpConfig.ts`:
  - Interface PowerUpEffectConfig:
    - type: PowerUpType
    - duration: number (milliseconds, -1 for permanent)
    - description: string
  - Export POWER_UP_CONFIGS: Record<PowerUpType, PowerUpEffectConfig>:
    - shield: { duration: 10000, description: 'Invulnerability' }
    - rapidFire: { duration: 15000, description: 'Double fire rate' }
    - multiShot: { duration: 15000, description: 'Triple projectile spread' }
    - extraLife: { duration: -1, description: 'Extra life' }

**Implement PowerUpSystem**:
- [x] Create `src/systems/PowerUpSystem.ts`:
  - Class PowerUpSystem implements System:
    - Private world: World
    - Private eventBus: EventBus
  - Constructor:
    - Accept World and EventBus dependencies
    - Subscribe to collision events
  - Method: update(deltaTime: number)
    - Query entities with PowerUpEffectComponent
    - For each entity with effects:
      - Decrement remainingTime for each timed effect
      - Remove effects where remainingTime <= 0
      - Apply active effects to gameplay:
        - Shield: Set HealthComponent.invulnerable = true
        - RapidFire: Reduce WeaponComponent.cooldown by half
        - MultiShot: Flag for WeaponSystem to fire spread pattern
      - When effect expires:
        - Shield: Set HealthComponent.invulnerable = false
        - RapidFire: Restore original WeaponComponent.cooldown
        - MultiShot: Reset to single projectile
  - Method: onCollision(event: CollisionEvent)
    - Check if collision involves player and power-up
    - If true:
      - Get power-up type from PowerUpComponent
      - Apply effect to player entity
      - Emit 'powerUpCollected' event with type
      - Remove power-up entity from world
  - Method: applyEffect(playerEntity: EntityId, powerUpType: PowerUpType)
    - Get or create PowerUpEffectComponent on player
    - Check if effect already active:
      - If yes: Refresh timer (reset remainingTime)
      - If no: Add new ActivePowerUp to effects array
    - Apply immediate effects:
      - ExtraLife: Increment PlayerComponent.lives immediately
      - Shield: Set HealthComponent.invulnerable = true
      - RapidFire: Modify WeaponComponent
      - MultiShot: Flag active in effect component
  - Method: removeEffect(playerEntity: EntityId, powerUpType: PowerUpType)
    - Remove effect from PowerUpEffectComponent
    - Revert any modifications:
      - Shield: Set invulnerable = false
      - RapidFire: Restore original cooldown
      - MultiShot: Clear spread flag
  - Method: hasActiveEffect(playerEntity: EntityId, type: PowerUpType): boolean
    - Check if effect is currently active

**Create unit tests**:
- [x] Create `tests/unit/PowerUpSystem.test.ts`:
  - Test initialization
  - Test collision detection (player + power-up)
  - Test power-up removal on collection
  - Test powerUpCollected event emission
  - Test Shield effect:
    - Invulnerability enabled
    - Duration 10 seconds
    - Removed after timer expires
  - Test RapidFire effect:
    - Cooldown halved
    - Duration 15 seconds
    - Cooldown restored on expiry
  - Test MultiShot effect:
    - Effect flag active
    - Duration 15 seconds
    - Flag cleared on expiry
  - Test ExtraLife effect:
    - Lives incremented
    - No timer (permanent)
  - Test timer countdown (deltaTime applied)
  - Test multiple simultaneous effects
  - Test same power-up refreshes timer
  - Test hasActiveEffect returns correct boolean
  - Edge cases: collect while invulnerable, rapid collection

### 3. Refactor Phase
- [x] Verify effect durations match spec
- [x] Optimize effect application/removal
- [x] Ensure timer precision with variable deltaTime
- [x] Add safety checks for missing components
- [x] Confirm all tests pass

## Completion Criteria

- [x] Power-ups collectable (collision triggers collection)
- [x] Power-up entity removed on collection
- [x] powerUpCollected event emitted with power-up type
- [x] Shield grants invulnerability for 10 seconds
- [x] RapidFire halves weapon cooldown for 15 seconds
- [x] MultiShot enables triple projectile pattern for 15 seconds
- [x] ExtraLife permanently increments lives by 1
- [x] Effect timers count down correctly each frame
- [x] Expired effects removed automatically
- [x] Effects revert to normal on expiry (shield, rapidFire, multiShot)
- [x] Multiple effects can be active simultaneously
- [x] Collecting same power-up refreshes timer (doesn't stack duration)
- [x] Unit tests passing (20+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- PowerUpSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (during integration)
# Expected: Power-ups apply effects, timers work, effects expire correctly
```

**Success Indicators**:
- All unit tests passing (20+ test cases)
- Type checking passes
- Build succeeds
- Shield makes player invulnerable
- RapidFire increases fire rate
- MultiShot fires 3 projectiles
- ExtraLife adds one life
- Effects expire at correct times

## Notes

- Effect durations: Shield 10s, RapidFire 15s, MultiShot 15s, ExtraLife permanent
- Timer uses milliseconds internally (deltaTime in ms)
- Collecting same power-up refreshes timer, doesn't stack duration
- RapidFire effect requires storing original cooldown to restore
- MultiShot effect may need flag that WeaponSystem checks
- Shield effect modifies HealthComponent.invulnerable
- ExtraLife applies immediately and has no effect component entry (permanent)
- PowerUpEffectComponent tracks array of ActivePowerUp for multiple effects

## Impact Scope

**Allowed Changes**: Effect durations, effect implementations, timer refresh behavior
**Protected Areas**: Component interfaces, collision event contracts, WeaponSystem core logic
**Areas Affected**: Gameplay mechanics, player abilities, weapon behavior

## Deliverables

- PowerUpSystem with full collection and effect management
- Power-up configuration for all 4 types
- Timer-based effect expiration
- Effect application and reversal logic
- Comprehensive unit tests for power-up mechanics
- Ready for Task 5.5 (HUD display of active power-ups)
