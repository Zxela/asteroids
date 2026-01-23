# Task: Weapon System - Homing Missiles

Metadata:
- Phase: 5 (Enhanced Features)
- Task: 5.7
- Dependencies: Task 5.6 (Spread Shot and Laser)
- Provides: Homing missile weapon type with target tracking
- Size: Small (2-3 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement homing missile weapon type that fires projectiles tracking the nearest asteroid. Missiles have limited ammo (10 per pickup), slower speed (300 units/s), moderate cooldown (300ms), and homing acceleration (200 units/s^2). Projectiles track target entity each frame, adjusting direction toward target. Homing is lost if target is destroyed. Ammo counter displayed in HUD.

*Reference dependencies: WeaponSystem (Task 5.6), Projectile entity creation, HUD for ammo display*

## Target Files

- [ ] `src/systems/WeaponSystem.ts` - Extended with Homing Missiles
- [ ] `src/systems/ProjectileSystem.ts` - Extended with homing logic
- [ ] `tests/unit/WeaponSystem.test.ts` - Extended with homing tests
- [ ] `tests/unit/ProjectileSystem.test.ts` - Extended with tracking tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [ ] Extend test files for homing missile functionality
- [ ] Write failing test for weapon switching to homing (key '4')
- [ ] Write failing test for homing missile fires with ammo available
- [ ] Write failing test for homing missile consumes ammo on fire
- [ ] Write failing test for homing missile cannot fire with 0 ammo
- [ ] Write failing test for homing missile speed is 300 units/s
- [ ] Write failing test for homing missile cooldown is 300ms
- [ ] Write failing test for homing missile targets nearest asteroid
- [ ] Write failing test for homing missile direction updates toward target
- [ ] Write failing test for homing acceleration is 200 units/s^2
- [ ] Write failing test for homing lost when target destroyed
- [ ] Write failing test for homing missile continues straight if no target
- [ ] Write failing test for ammo counter displayed in HUD
- [ ] Write failing test for ammo increases on pickup (future power-up)
- [ ] Verify all tests fail (Red state)

### 2. Green Phase

**Update Weapon Configuration**:
- [ ] Update `src/config/weaponConfig.ts`:
  - Complete homing weapon config:
    - type: 'homing'
    - cooldown: 300ms
    - projectileSpeed: 300 units/s
    - damage: 2
    - ammo: 10 (starting ammo)
    - homingAcceleration: 200 units/s^2
    - homingRange: 500 (max distance to acquire target)

**Extend WeaponSystem for Homing**:
- [ ] Update `src/systems/WeaponSystem.ts`:
  - Add homing to weapon cycle ('4' key or Z/X cycle)
  - Implement homing missile firing:
    - Check if ammo > 0
    - If yes:
      - Find nearest asteroid within homingRange
      - Create projectile with homingTarget set
      - Decrement ammo
      - Emit 'weaponFired' event
    - If no ammo:
      - Play empty click sound
      - Don't create projectile
  - Method: findNearestTarget(position: Vector3, range: number): EntityId | null
    - Query all asteroid entities
    - Calculate distances
    - Return nearest within range, or null if none

**Extend ProjectileSystem for Homing Logic**:
- [ ] Update or create `src/systems/ProjectileSystem.ts`:
  - In update(deltaTime) method:
    - For each projectile with homingTarget set:
      - Check if target entity still exists
      - If target exists:
        - Calculate direction to target
        - Calculate desired velocity change (homing acceleration)
        - Apply turn toward target (limited by acceleration)
        - Clamp to projectile max speed
        - Update VelocityComponent
      - If target destroyed:
        - Clear homingTarget
        - Projectile continues in current direction
  - Method: applyHomingForce(projectile: EntityId, target: EntityId, deltaTime: number)
    - Get projectile position and velocity
    - Get target position
    - Calculate desired direction: normalize(targetPos - projectilePos)
    - Calculate steering: desired - currentDirection
    - Limit steering by homingAcceleration * deltaTime
    - Apply to velocity
    - Normalize and scale to projectile speed

**Extend HUD with Ammo Display**:
- [ ] Update `src/ui/HUD.ts`:
  - Add ammo display element:
    - Position: near weapon indicator
    - Shows: "MISSILES: X" or icon + number
    - Only visible when homing weapon selected (optional)
  - Method: updateAmmoDisplay(ammo: number | 'infinite')
    - If 'infinite': show infinity symbol or hide
    - If number: show ammo count
    - Color: red when ammo low (< 3), normal otherwise
  - Integrate into weapon display area

**Extend unit tests**:
- [ ] Update `tests/unit/WeaponSystem.test.ts`:
  - Test weapon switch to homing ('4' key)
  - Test homing fires with ammo
  - Test ammo decrements on fire
  - Test cannot fire with 0 ammo
  - Test homing projectile created with correct properties
  - Test nearest target selection
  - Test ammo display updates

- [ ] Update/create `tests/unit/ProjectileSystem.test.ts`:
  - Test homing projectile tracks target
  - Test direction updates toward target each frame
  - Test homing acceleration limits turn rate
  - Test homing lost when target destroyed
  - Test projectile continues straight without target
  - Test projectile speed maintained during homing
  - Edge cases: target behind projectile, multiple targets

### 3. Refactor Phase
- [ ] Verify homing physics feel natural
- [ ] Optimize target finding (spatial partitioning if needed)
- [ ] Fine-tune homing acceleration for gameplay feel
- [ ] Ensure ammo display clear and readable
- [ ] Test edge cases (no asteroids, rapid firing)
- [ ] Confirm all tests pass

## Completion Criteria

- [ ] Homing missile selectable via '4' key or weapon cycle
- [ ] Homing missiles fire with ammo available
- [ ] Ammo decremented on each fire
- [ ] Cannot fire with 0 ammo
- [ ] Homing missile speed: 300 units/s (slower than default)
- [ ] Homing missile cooldown: 300ms
- [ ] Projectiles track nearest asteroid within range
- [ ] Projectile direction updates toward target each frame
- [ ] Homing acceleration: 200 units/s^2 (limits turn rate)
- [ ] Homing lost when target entity destroyed
- [ ] Projectile continues straight if no valid target
- [ ] Ammo counter shown in HUD when homing selected
- [ ] Unit tests passing (15+ test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- WeaponSystem.test.ts
npm test -- ProjectileSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# Expected: Missiles curve toward asteroids, ammo limits firing
```

**Success Indicators**:
- Missiles visibly curve toward asteroids
- Turn rate feels natural (not instant lock-on)
- Missiles continue straight if target destroyed
- Ammo counter decrements correctly
- Cannot fire at 0 ammo
- All unit tests passing (15+ test cases)

## Notes

- Homing acceleration creates curved flight path, not instant targeting
- 200 units/s^2 means gradual turn, not snap-to-target
- Target selection: nearest asteroid within 500 units range
- If no asteroids in range, missile fires straight
- homingTarget stored in ProjectileComponent
- Ammo starts at 10, replenished by future ammo power-ups
- Missile visual: different mesh type ('projectile_missile')
- Homing lost means homingTarget set to undefined, not projectile destruction
- Projectile lifetime still applies (despawn after time)

## Impact Scope

**Allowed Changes**: Homing parameters (speed, acceleration, range), ammo count, HUD layout
**Protected Areas**: Projectile creation API, collision system, target entity queries
**Areas Affected**: Combat strategy, weapon variety, projectile behavior

## Deliverables

- Homing missile weapon type in WeaponSystem
- Projectile homing logic in ProjectileSystem
- Target tracking with acceleration-limited turning
- Ammo system with HUD display
- Comprehensive unit tests for homing mechanics
- Ready for Phase 5 integration testing
