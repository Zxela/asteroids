---
id: "001"
title: "Wire MultiShot powerup to WeaponSystem"
status: pending
depends_on: []
test_file: tests/unit/WeaponSystem.test.ts
---

# 001: Wire MultiShot powerup to WeaponSystem

## Objective

Connect the MultiShot powerup effect to the WeaponSystem so that collecting the powerup actually enables spread-fire behavior. Currently, PowerUpSystem tracks the effect but WeaponSystem never checks for it.

## Acceptance Criteria

- [ ] WeaponSystem accepts optional PowerUpSystem in constructor
- [ ] `handleStandardFiring()` checks `powerUpSystem.hasActiveEffect(entityId, 'multiShot')`
- [ ] When multiShot is active, fires 3 projectiles in spread pattern (center, +15°, -15°)
- [ ] MultiShot stacks with RapidFire (faster triple shots)
- [ ] MultiShot expires after 15 seconds, reverting to single shot
- [ ] Game.ts passes PowerUpSystem reference when creating WeaponSystem

## Technical Notes

From TECHNICAL_DESIGN.md:
```typescript
constructor(inputSystem: InputSystem, powerUpSystem?: PowerUpSystem) {
  this.inputSystem = inputSystem
  this.powerUpSystem = powerUpSystem ?? null
}

private handleStandardFiring(world, entityId, transform, weapon) {
  const hasMultiShot = this.powerUpSystem?.hasActiveEffect(entityId, 'multiShot') ?? false

  if (hasMultiShot || weapon.currentWeapon === 'spread') {
    this.fireSpreadShot(world, entityId, transform, weapon)
  } else if (weapon.currentWeapon === 'homing') {
    this.fireHomingMissile(world, entityId, transform, weapon)
  } else {
    this.fireSingleShot(world, entityId, transform, weapon)
  }
}
```

Key files:
- `src/systems/WeaponSystem.ts` - Add PowerUpSystem dependency
- `src/game/Game.ts` - Pass PowerUpSystem when creating WeaponSystem

## Test Requirements

Add to `tests/unit/WeaponSystem.test.ts`:
- Test that multiShot effect causes spread firing (3 projectiles)
- Test that multiShot stacks with rapidFire (both effects active)
- Test that without multiShot, single weapon fires single shot
- Test that PowerUpSystem is optional (null safe)
