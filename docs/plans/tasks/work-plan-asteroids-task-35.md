# Task: Boss Projectiles

Metadata:
- Phase: 6 (Boss System)
- Task: 6.3
- Dependencies: Task 6.2 (Boss AI System), Task 2.9 (Collision Detection System)
- Provides: Boss projectile creation, boss-player collision handling
- Size: Small (2-3 files)
- Estimated Duration: 0.5 days

## Implementation Content

Extend projectile system to support boss projectiles with higher damage and distinct collision layer. Boss projectiles created during Destroyer Spray and Carrier Retreat patterns. Implement ship-boss projectile collision handling: damage ship (if not shielded), reduce lives, trigger respawn. Extend CollisionSystem to handle "bossProjectile" layer collisions with "player" layer. Boss projectiles despawn on collision or lifetime expiration.

*Reference dependencies: createProjectile factory (Task 3.1), BossSystem (Task 6.2), CollisionSystem (Task 2.9), RespawnSystem (Task 3.5)*

## Target Files

- [x] `src/entities/createProjectile.ts` - Extended with boss projectile support
- [x] `src/systems/CollisionSystem.ts` - Extended with boss projectile collision
- [x] `tests/unit/createProjectile.test.ts` - Extended with boss projectile tests
- [x] `tests/unit/CollisionSystem.test.ts` - Extended with boss collision tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Extend test file `tests/unit/createProjectile.test.ts`
- [x] Write failing test for boss projectile creation
- [x] Write failing test for boss projectile layer = "bossProjectile"
- [x] Write failing test for boss projectile damage higher than player projectile
- [x] Write failing test for boss projectile owner = boss entity ID
- [x] Write failing test for boss projectile speed configurable
- [x] Write failing test for boss projectile meshType distinct
- [x] Extend test file `tests/unit/CollisionSystem.test.ts`
- [x] Write failing test for ship-boss projectile collision detected
- [x] Write failing test for collision reduces ship health
- [x] Write failing test for collision destroys boss projectile
- [x] Write failing test for shield blocks boss projectile damage
- [x] Write failing test for shipDamaged event emitted
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Extend Projectile Factory for Boss Projectiles**:
- [x] Update `src/entities/createProjectile.ts`:
  - Add optional owner parameter: owner?: EntityId
  - Add boss projectile creation logic:
    - If owner is boss entity:
      - Set Collider.layer to "bossProjectile"
      - Set Collider.mask to ["player"] (only collides with player)
      - Set Projectile.damage based on boss type and phase
      - Set Renderable.meshType to "projectile_boss"
      - Set Renderable.material to "emissive" with red/orange color
    - If owner is player entity (existing logic):
      - Set Collider.layer to "projectile"
      - Set Collider.mask to ["asteroid", "boss"]
  - Factory signature: createProjectile(world, position, direction, type, damage?, owner?)
  - Projectile types: 'single', 'spread', 'laser', 'homing', 'boss'
  - Boss projectile properties:
    - Speed: 350 units/s (faster than player projectiles)
    - Damage: 1 base (scaled by phase in BossSystem)
    - Lifetime: 3000ms
    - Collision layer: "bossProjectile"

**Extend CollisionSystem for Boss Projectile Collisions**:
- [x] Update `src/systems/CollisionSystem.ts`:
  - In collision detection loop:
    - Add collision pair check: "bossProjectile" layer with "player" layer
    - On collision between boss projectile and player:
      - Check if player has shield power-up active (invulnerable)
      - If not shielded:
        - Get projectile damage from Projectile component
        - Reduce player Health.current by damage amount
        - If Health.current <= 0:
          - Emit 'shipDamaged' event with { damage, fatal: true }
          - Trigger respawn logic (handled by RespawnSystem)
        - Else:
          - Emit 'shipDamaged' event with { damage, fatal: false }
      - Mark boss projectile for destruction (remove from world)
      - Emit 'projectileHit' event
  - Ensure collision filtering respects layer/mask compatibility

**Extend BossSystem to Create Boss Projectiles**:
- [x] Update `src/systems/BossSystem.ts` (from Task 6.2):
  - In executeDestroyerSpray method:
    - Call createProjectile with owner = boss entity ID
    - Pass 'boss' as projectile type
    - Pass damage scaled by phase modifier
  - In executeCarrierRetreat method:
    - Call createProjectile with owner = boss entity ID
    - Pass 'homing' as projectile type (but owned by boss)
    - Pass damage scaled by phase modifier
    - Set homingTarget to player entity

**Create/Extend unit tests**:
- [x] Update `tests/unit/createProjectile.test.ts`:
  - Test boss projectile created with owner = boss entity
  - Test boss projectile layer = "bossProjectile"
  - Test boss projectile mask includes "player"
  - Test boss projectile damage configurable
  - Test boss projectile speed = 350 units/s
  - Test boss projectile meshType = "projectile_boss"
  - Test boss projectile lifetime = 3000ms
  - Edge cases: no owner, invalid owner type

- [x] Update `tests/unit/CollisionSystem.test.ts`:
  - Test collision between boss projectile and player detected
  - Test player health reduced by projectile damage
  - Test boss projectile destroyed on collision
  - Test shield blocks boss projectile damage (no health reduction)
  - Test shipDamaged event emitted with correct data
  - Test fatal damage triggers respawn (Health = 0)
  - Test non-fatal damage does not trigger respawn
  - Edge cases: multiple projectiles, rapid collisions

### 3. Refactor Phase
- [x] Verify boss projectile damage feels balanced
- [x] Optimize collision detection for boss projectiles
- [x] Ensure boss projectile visuals distinct from player projectiles
- [x] Test edge cases (shield timing, rapid fire, multiple bosses)
- [x] Confirm all tests pass

## Completion Criteria

- [x] createProjectile factory supports boss projectiles
- [x] Boss projectiles created with owner parameter = boss entity ID
- [x] Boss projectile collision layer = "bossProjectile"
- [x] Boss projectile collision mask = ["player"]
- [x] Boss projectile damage configurable (scaled by phase)
- [x] Boss projectile speed: 350 units/s
- [x] Boss projectile meshType: "projectile_boss"
- [x] Boss projectile material: emissive red/orange
- [x] CollisionSystem detects ship-boss projectile collisions
- [x] Ship health reduced by boss projectile damage
- [x] Boss projectile destroyed on collision
- [x] Shield power-up blocks boss projectile damage
- [x] shipDamaged event emitted on collision
- [x] Fatal damage (Health = 0) triggers respawn
- [x] Non-fatal damage does not trigger respawn
- [x] Unit tests passing (10+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- createProjectile.test.ts
npm test -- CollisionSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# 1. Play to wave 5 (Destroyer boss)
# 2. Observe boss fire spread projectiles during Spray pattern
# 3. Get hit by boss projectile, verify health decreases
# 4. Verify boss projectile disappears on collision
# 5. Activate shield, verify boss projectiles blocked
# 6. Take fatal damage, verify respawn occurs
# 7. Play to wave 10 (Carrier boss)
# 8. Observe boss fire homing projectiles during Retreat pattern
```

**Success Indicators**:
- Boss projectiles visible and distinct from player projectiles
- Ship takes damage on boss projectile hit
- Boss projectiles destroyed on collision
- Shield blocks boss projectile damage
- Respawn triggered at 0 health
- All unit tests passing (10+ test cases)

## Notes

- Boss projectile layer: "bossProjectile" (distinct from player "projectile")
- Boss projectile mask: ["player"] (only collides with player ship)
- Player projectile mask: ["asteroid", "boss"] (does NOT collide with boss projectiles)
- Damage scaling: base damage * phase modifier (from BossSystem)
- Phase 1: 1.0x damage, Phase 2: 1.5x, Phase 3: 2.0x
- Boss projectile speed faster than player (350 vs 500 for player default)
- Lifetime: 3000ms (despawn if no collision)
- Shield power-up (from Task 5.4) blocks boss projectile damage
- RespawnSystem (from Task 3.5) handles ship respawn at 0 health
- Boss projectile visual: red/orange emissive material for danger indication
- Homing boss projectiles use same homing logic as player homing missiles

## Impact Scope

**Allowed Changes**: Boss projectile damage values, speed, visual appearance
**Protected Areas**: Collision detection algorithm, projectile creation API, health system
**Areas Affected**: Boss combat difficulty, player survivability, shield value

## Deliverables

- Boss projectile support in createProjectile factory
- Boss projectile collision handling in CollisionSystem
- Ship damage and respawn on boss projectile hit
- Shield blocking for boss projectiles
- Comprehensive unit tests for boss projectile creation and collision
- Ready for Task 6.4 (Boss Rewards)
