# Task: Weapon System - Spread Shot and Laser

Metadata:
- Phase: 5 (Enhanced Features)
- Task: 5.6
- Dependencies: Task 3.2 (Weapon System), Task 2.2 (Input System)
- Provides: Extended WeaponSystem with weapon switching, Spread Shot, and Laser weapons
- Size: Medium (3-4 files)
- Estimated Duration: 0.5-1 day

## Implementation Content

Add weapon variants to WeaponSystem: Spread Shot (3 projectiles in 15-degree spread) and Laser (continuous beam with energy system). Implement weapon switching via number keys (1-3) or Z/X keys. Laser uses energy system: 100 max energy, 10/frame drain while firing, 5/frame regeneration when not firing. Energy bar displayed in HUD. Weapon type tracked in extended WeaponComponent.

*Reference dependencies: WeaponSystem (Task 3.2), InputSystem for weapon switching, HUD for energy display*

## Target Files

- [x] `src/systems/WeaponSystem.ts` - Extended with weapon switching, Spread Shot, Laser
- [x] `src/config/weaponConfig.ts` - Weapon configurations for all types
- [x] `src/ui/HUD.ts` - Extended with energy bar display
- [x] `tests/unit/WeaponSystem.test.ts` - Extended weapon tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Extend test file for new weapon functionality
- [x] Write failing test for weapon switching via number keys (1, 2, 3)
- [x] Write failing test for weapon switching via Z/X keys (cycle)
- [x] Write failing test for currentWeapon tracks active weapon
- [x] Write failing test for weaponChanged event emitted on switch
- [x] Write failing test for Spread Shot fires 3 projectiles
- [x] Write failing test for Spread Shot projectiles have 15-degree spread
- [x] Write failing test for Spread Shot cooldown is 400ms
- [x] Write failing test for Laser fires continuous beam while held
- [x] Write failing test for Laser drains energy (10/frame)
- [x] Write failing test for Laser regenerates energy (5/frame when not firing)
- [x] Write failing test for Laser max energy is 100
- [x] Write failing test for Laser stops when energy depleted
- [x] Write failing test for Laser resumes when energy sufficient
- [x] Write failing test for energy bar updates in HUD
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Create Weapon Configuration**:
- [x] Create/update `src/config/weaponConfig.ts`:
  - Export WEAPON_CONFIGS: Record<WeaponType, WeaponConfig>:
    - single:
      - cooldown: 250ms
      - projectileSpeed: 500
      - damage: 1
      - ammo: 'infinite'
    - spread:
      - cooldown: 400ms
      - projectileSpeed: 450
      - damage: 1
      - ammo: 'infinite'
      - spreadAngle: 15 (degrees)
      - projectileCount: 3
    - laser:
      - cooldown: 0 (continuous)
      - projectileSpeed: 0 (instant hit)
      - damage: 2 (per frame of contact)
      - energyCost: 10 (per frame)
      - energyRegen: 5 (per frame when not firing)
      - maxEnergy: 100
    - homing: (placeholder for Task 5.7)
      - cooldown: 300ms
      - projectileSpeed: 300
      - damage: 2
      - ammo: 10

**Extend WeaponComponent**:
- [x] Update WeaponComponent (already exists in types):
  - Verify fields: currentWeapon, cooldown, lastFiredAt, ammo, energy, maxEnergy, energyRegenRate

**Extend WeaponSystem**:
- [x] Update `src/systems/WeaponSystem.ts`:
  - Add weapon switching logic:
    - Listen for key inputs: '1', '2', '3' for direct selection
    - Listen for 'Z' (previous) and 'X' (next) for cycling
    - Update WeaponComponent.currentWeapon
    - Emit 'weaponChanged' event with new weapon type
    - Update HUD weapon indicator
  - Implement Spread Shot:
    - When firing with spread weapon:
      - Calculate 3 projectile directions:
        - Center: ship facing direction
        - Left: facing - 15 degrees
        - Right: facing + 15 degrees
      - Create 3 projectiles with respective directions
      - Use spread weapon cooldown (400ms)
  - Implement Laser:
    - Track laser firing state (continuous)
    - When fire button held AND currentWeapon === 'laser':
      - If energy >= energyCost:
        - Drain energy by energyCost
        - Perform raycast from ship position in facing direction
        - Damage all entities in ray path
        - Emit 'laserFired' event
      - If energy < energyCost:
        - Stop laser (cannot fire)
        - Play energy depleted sound
    - When fire button released OR weapon changed:
      - Stop laser
    - Energy regeneration:
      - If not firing laser: regenerate energy by energyRegen per frame
      - Clamp energy to [0, maxEnergy]
  - Update update(deltaTime) method:
    - Handle energy regeneration for all weapons
    - Process weapon switching input
    - Handle firing based on current weapon type

**Extend HUD with Energy Bar**:
- [x] Update `src/ui/HUD.ts`:
  - Add energy bar element:
    - Position: below weapon indicator or alongside
    - Visual: horizontal bar showing energy percentage
    - Color: gradient from full (cyan/blue) to empty (red)
  - Method: updateEnergyBar(current: number, max: number)
    - Calculate percentage: current / max
    - Update bar width/fill
    - Update color based on percentage
  - Show energy bar only when laser weapon selected (optional)
  - Integrate into existing update() method

**Extend unit tests**:
- [x] Update `tests/unit/WeaponSystem.test.ts`:
  - Test weapon switching via '1', '2', '3' keys
  - Test weapon switching via 'Z', 'X' keys (cycle)
  - Test currentWeapon updates correctly
  - Test weaponChanged event emission
  - Test Spread Shot creates 3 projectiles
  - Test Spread Shot angles (center, -15, +15 degrees)
  - Test Spread Shot cooldown (400ms)
  - Test Laser continuous fire while held
  - Test Laser energy drain (10/frame)
  - Test Laser energy regen (5/frame)
  - Test Laser max energy (100)
  - Test Laser stops at 0 energy
  - Test Laser resumes with sufficient energy
  - Test energy bar updates
  - Edge cases: rapid switching, energy boundary

### 3. Refactor Phase
- [x] Verify weapon configurations match spec
- [x] Optimize projectile creation for Spread Shot
- [x] Ensure Laser raycast is performant
- [x] Add visual feedback for weapon switching
- [x] Test energy edge cases (0, max, negative)
- [x] Confirm all tests pass

## Completion Criteria

- [x] Weapons switchable via keyboard (1/2/3 or Z/X)
- [x] currentWeapon tracks active weapon correctly
- [x] weaponChanged event emitted on weapon switch
- [x] Spread Shot fires 3 projectiles at correct angles (0, -15, +15 degrees)
- [x] Spread Shot has 400ms cooldown
- [x] Laser fires continuously while fire button held
- [x] Laser drains energy at 10 units per frame
- [x] Laser regenerates energy at 5 units per frame when not firing
- [x] Laser max energy is 100
- [x] Laser cannot fire when energy depleted (< energyCost)
- [x] Laser resumes when energy sufficient
- [x] Energy bar displayed in HUD (shows current/max)
- [x] Weapons can't fire without sufficient energy/ammo
- [x] Unit tests passing (20+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- WeaponSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# Expected: Weapons switchable, Spread Shot fires 3 projectiles, Laser fires continuously
```

**Success Indicators**:
- Weapon switching responsive (immediate)
- Spread Shot creates visible 3-projectile spread
- Laser beam visible while firing
- Energy bar depletes and regenerates correctly
- All unit tests passing (20+ test cases)

## Notes

- Weapon keys: 1=Single, 2=Spread, 3=Laser (4=Homing in Task 5.7)
- Z/X keys cycle through available weapons
- Spread Shot angle: 15 degrees = Math.PI / 12 radians
- Laser implementation options: raycast OR long thin projectile
- Energy is per-frame, convert to per-second for deltaTime: energy * deltaTime / 16.67
- Laser visual: beam effect from ship to impact point
- Energy bar only relevant for laser, but tracks for all weapons
- Weapon switch should reset firing state (stop laser mid-fire)

## Impact Scope

**Allowed Changes**: Weapon configurations, spread angle, energy values, HUD layout
**Protected Areas**: Projectile creation API, collision system, input system contracts
**Areas Affected**: Combat mechanics, player strategy, visual feedback

## Deliverables

- Extended WeaponSystem with weapon switching
- Spread Shot weapon (3 projectiles, 15-degree spread)
- Laser weapon (continuous beam, energy system)
- Weapon configurations for all types
- Energy bar in HUD
- Comprehensive unit tests for weapon variants
- Ready for Task 5.7 (Homing Missiles)
