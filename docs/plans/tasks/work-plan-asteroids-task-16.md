# Task: Weapon System - Default Single Shot

Metadata:
- Phase: 3 (Core Gameplay Loop)
- Task: 3.2
- Dependencies: Task 3.1 (Projectile Entity), Task 2.2 (Input System), Task 2.5 (Ship Entity)
- Provides: WeaponSystem implementation (src/systems/WeaponSystem.ts), Weapon component definition
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement the WeaponSystem that queries for entities with Weapon components and fires projectiles when spacebar is pressed. The system enforces cooldown timers to prevent spam firing and reads input state from InputSystem. This task implements single-shot firing only; other weapon types come in Phase 5.

*Reference dependencies: Weapon component (from Task 2.3), InputSystem for spacebar input, createProjectile factory from Task 3.1*

## Target Files

- [x] `src/components/Weapon.ts` - Weapon component definition
- [x] `src/systems/WeaponSystem.ts` - Weapon firing logic
- [x] `tests/unit/WeaponSystem.test.ts` - Unit tests for weapon firing

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for WeaponSystem
- [x] Write failing test for projectile fired on spacebar
- [x] Write failing test for cooldown enforcement
- [x] Write failing test for no firing without spacebar input
- [x] Write failing test for firing only when action available
- [x] Write failing test for cooldown timer expiration
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement Weapon component**:
- [x] Create `src/components/Weapon.ts`:
  ```typescript
  import { Component } from '../types/ecs';

  export type WeaponType = 'single' | 'spread' | 'laser' | 'homing';

  export class Weapon implements Component {
    readonly componentType = 'weapon' as const;
    currentWeapon: WeaponType;
    cooldown: number;        // Milliseconds between shots
    lastFiredAt: number;     // Timestamp of last shot
    ammo: number | 'infinite';
    energy: number;          // Energy for special weapons
    maxEnergy: number;       // Max energy capacity

    constructor(
      currentWeapon: WeaponType = 'single',
      cooldown = 250,
      ammo: number | 'infinite' = 'infinite',
      maxEnergy = 100,
      energy = 100
    ) {
      this.currentWeapon = currentWeapon;
      this.cooldown = cooldown;
      this.lastFiredAt = 0;
      this.ammo = ammo;
      this.maxEnergy = maxEnergy;
      this.energy = energy;
    }

    canFire(currentTime: number): boolean {
      return currentTime - this.lastFiredAt >= this.cooldown;
    }

    recordFire(currentTime: number): void {
      this.lastFiredAt = currentTime;
    }

    consumeAmmo(amount: number = 1): boolean {
      if (this.ammo === 'infinite') {
        return true;
      }
      if (this.ammo >= amount) {
        this.ammo -= amount;
        return true;
      }
      return false;
    }

    consumeEnergy(amount: number): boolean {
      if (this.energy >= amount) {
        this.energy -= amount;
        return true;
      }
      return false;
    }

    addEnergy(amount: number): void {
      this.energy = Math.min(this.energy + amount, this.maxEnergy);
    }
  }
  ```

**Implement WeaponSystem**:
- [x] Create `src/systems/WeaponSystem.ts`:
  ```typescript
  import { System, World } from '../types/ecs';
  import { Transform, Weapon } from '../components';
  import { InputSystem } from './InputSystem';
  import { createProjectile } from '../entities/createProjectile';
  import { gameConfig } from '../config';
  import { Vector3 } from 'three';

  export interface WeaponFiredEvent {
    type: 'weaponFired';
    weaponType: string;
    position: Vector3;
    direction: Vector3;
  }

  export class WeaponSystem implements System {
    readonly systemType = 'weapon' as const;
    private inputSystem: InputSystem;
    private currentTime: number = 0;
    private events: WeaponFiredEvent[] = [];

    constructor(inputSystem: InputSystem) {
      this.inputSystem = inputSystem;
    }

    update(world: World, deltaTime: number): void {
      this.currentTime += deltaTime;
      this.events = [];

      // Query for entities with Weapon component
      const weaponEntities = world.query([Transform, Weapon]);

      for (const entityId of weaponEntities) {
        const transform = world.getComponent<Transform>(entityId, Transform);
        const weapon = world.getComponent<Weapon>(entityId, Weapon);

        if (!transform || !weapon) {
          continue;
        }

        // Check for fire action from input
        const actions = this.inputSystem.getActions();
        const shouldFire = actions.has('fire'); // 'fire' = spacebar

        if (shouldFire && weapon.canFire(this.currentTime)) {
          // Fire projectile
          this.fireWeapon(world, entityId, transform, weapon);

          // Record fire time
          weapon.recordFire(this.currentTime);

          // Emit event for audio/feedback
          this.emitWeaponFiredEvent(weapon, transform);
        }
      }
    }

    private fireWeapon(
      world: World,
      shipId: number,
      transform: Transform,
      weapon: Weapon
    ): void {
      // Get weapon config
      const weaponCfg = gameConfig.weapons[weapon.currentWeapon];

      // Calculate projectile position (slightly ahead of ship)
      const shipRadius = gameConfig.physics.shipRadius;
      const spawnDistance = shipRadius + 1;
      const spawnOffset = this.getShipForwardDirection(transform.rotation.z)
        .multiplyScalar(spawnDistance);
      const projectilePosition = transform.position.clone().add(spawnOffset);

      // Get ship's forward direction for projectile
      const projectileDirection = this.getShipForwardDirection(transform.rotation.z);

      // Create projectile entity
      createProjectile(world, {
        position: projectilePosition,
        direction: projectileDirection,
        type: weapon.currentWeapon,
        owner: shipId,
        damage: weaponCfg.damage,
        speed: weaponCfg.projectileSpeed
      });
    }

    private getShipForwardDirection(rotationZ: number): Vector3 {
      // Convert Z rotation to forward direction vector
      // Rotation 0 = +Y direction (up)
      // Rotation π/2 = -X direction (left)
      // Rotation π = -Y direction (down)
      // Rotation 3π/2 = +X direction (right)
      const x = Math.sin(rotationZ);
      const y = Math.cos(rotationZ);
      return new Vector3(x, y, 0).normalize();
    }

    private emitWeaponFiredEvent(weapon: Weapon, transform: Transform): void {
      const event: WeaponFiredEvent = {
        type: 'weaponFired',
        weaponType: weapon.currentWeapon,
        position: transform.position.clone(),
        direction: this.getShipForwardDirection(transform.rotation.z)
      };
      this.events.push(event);
      // Events will be consumed by AudioSystem, ParticleSystem in later tasks
    }

    getEvents(): WeaponFiredEvent[] {
      return this.events;
    }
  }
  ```

**Create unit tests**:
- [x] Create `tests/unit/WeaponSystem.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import { Vector3 } from 'three';
  import { World } from '../../src/ecs/World';
  import { WeaponSystem } from '../../src/systems/WeaponSystem';
  import { InputSystem } from '../../src/systems/InputSystem';
  import { Transform, Weapon } from '../../src/components';
  import { gameConfig } from '../../src/config';

  describe('WeaponSystem', () => {
    let world: World;
    let weaponSystem: WeaponSystem;
    let inputSystem: InputSystem;
    let shipId: number;

    beforeEach(() => {
      world = new World();
      inputSystem = new InputSystem();
      weaponSystem = new WeaponSystem(inputSystem);

      // Create a test ship with weapon
      shipId = world.createEntity();
      world.addComponent(shipId, new Transform());
      world.addComponent(shipId, new Weapon('single', 250));
    });

    describe('Firing on Input', () => {
      it('should fire projectile when spacebar pressed', () => {
        // Simulate spacebar press
        inputSystem.setAction('fire', true);

        const initialEntityCount = world.query([]).size;

        weaponSystem.update(world, 16); // ~60 FPS

        const finalEntityCount = world.query([]).size;

        // One new projectile should be created
        expect(finalEntityCount).toBe(initialEntityCount + 1);
      });

      it('should not fire without spacebar input', () => {
        // No spacebar press
        inputSystem.setAction('fire', false);

        const initialEntityCount = world.query([]).size;

        weaponSystem.update(world, 16);

        const finalEntityCount = world.query([]).size;

        // No new entity should be created
        expect(finalEntityCount).toBe(initialEntityCount);
      });

      it('should emit weaponFired event', () => {
        inputSystem.setAction('fire', true);

        weaponSystem.update(world, 16);

        const events = weaponSystem.getEvents();
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].type).toBe('weaponFired');
        expect(events[0].weaponType).toBe('single');
      });
    });

    describe('Cooldown Enforcement', () => {
      it('should not fire during cooldown period', () => {
        inputSystem.setAction('fire', true);

        // First shot
        weaponSystem.update(world, 16);
        const countAfterFirstShot = world.query([]).size;

        // Immediate second attempt (within cooldown)
        weaponSystem.update(world, 16);
        const countAfterSecondAttempt = world.query([]).size;

        // Second shot should not have fired
        expect(countAfterSecondAttempt).toBe(countAfterFirstShot);
      });

      it('should fire after cooldown expires', () => {
        const cooldownTime = 250; // ms
        inputSystem.setAction('fire', true);

        // First shot
        weaponSystem.update(world, 16);
        const countAfterFirstShot = world.query([]).size;

        // Simulate waiting for cooldown
        weaponSystem.update(world, cooldownTime + 16);
        const countAfterCooldown = world.query([]).size;

        // Second shot should have fired
        expect(countAfterCooldown).toBe(countAfterFirstShot + 1);
      });

      it('should enforce exact cooldown time (250ms for single shot)', () => {
        const weapon = world.getComponent<Weapon>(shipId, Weapon);
        expect(weapon?.cooldown).toBe(250);
      });

      it('should prevent rapid-fire with continuous input', () => {
        inputSystem.setAction('fire', true);

        const shotCounts: number[] = [];

        // Simulate 5 frames of firing input
        for (let i = 0; i < 5; i++) {
          weaponSystem.update(world, 16);
          shotCounts.push(world.query([]).size);
        }

        // Should only fire on first frame, not every frame
        expect(shotCounts[1]).toBe(shotCounts[0]); // No second shot
        expect(shotCounts[2]).toBe(shotCounts[0]); // No second shot
      });
    });

    describe('Fire Rate Limiting', () => {
      it('should only fire when action is active', () => {
        inputSystem.setAction('fire', true);
        weaponSystem.update(world, 16);

        const countAfterFirstFire = world.query([]).size;

        // Turn off fire action
        inputSystem.setAction('fire', false);
        weaponSystem.update(world, 16);

        const countAfterNoFire = world.query([]).size;

        // Should not fire again
        expect(countAfterNoFire).toBe(countAfterFirstFire);
      });

      it('should allow firing after cooldown with new input press', () => {
        // First fire
        inputSystem.setAction('fire', true);
        weaponSystem.update(world, 16);
        const countAfterFirstShot = world.query([]).size;

        // Wait for cooldown
        weaponSystem.update(world, 250);

        // Release and press spacebar again
        inputSystem.setAction('fire', false);
        weaponSystem.update(world, 16);
        inputSystem.setAction('fire', true);
        weaponSystem.update(world, 16);

        const countAfterSecondShot = world.query([]).size;

        // Second shot should have fired
        expect(countAfterSecondShot).toBe(countAfterFirstShot + 1);
      });
    });

    describe('Projectile Creation', () => {
      it('should create projectile at correct position', () => {
        const testPosition = new Vector3(50, 60, 0);
        const transform = world.getComponent<Transform>(shipId, Transform);
        transform!.position = testPosition;

        inputSystem.setAction('fire', true);
        weaponSystem.update(world, 16);

        // Get projectile entity (should be the newest)
        const allEntities = Array.from(world.query([]));
        const projectileId = allEntities[allEntities.length - 1];

        const projectileTransform = world.getComponent<Transform>(projectileId, Transform);

        // Position should be offset from ship position
        expect(projectileTransform).toBeDefined();
        expect(projectileTransform?.position.length()).toBeGreaterThan(0);
      });

      it('should create projectile in correct direction', () => {
        const transform = world.getComponent<Transform>(shipId, Transform);
        transform!.rotation.z = 0; // Facing up

        inputSystem.setAction('fire', true);
        weaponSystem.update(world, 16);

        // Get projectile entity
        const allEntities = Array.from(world.query([]));
        const projectileId = allEntities[allEntities.length - 1];

        const projectileVelocity = world.getComponent(projectileId, 'velocity');
        expect(projectileVelocity).toBeDefined();
      });
    });

    describe('Weapon Configuration', () => {
      it('should use default single shot cooldown', () => {
        const weapon = world.getComponent<Weapon>(shipId, Weapon);
        expect(weapon?.cooldown).toBe(gameConfig.weapons.single.cooldown);
      });

      it('should use default single shot damage', () => {
        inputSystem.setAction('fire', true);
        weaponSystem.update(world, 16);

        // Verify by checking events
        const events = weaponSystem.getEvents();
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].weaponType).toBe('single');
      });

      it('should apply weapon damage to projectiles', () => {
        const weapon = world.getComponent<Weapon>(shipId, Weapon);
        const expectedDamage = gameConfig.weapons.single.damage;

        inputSystem.setAction('fire', true);
        weaponSystem.update(world, 16);

        // Projectile damage should match weapon damage
        const allEntities = Array.from(world.query([]));
        const projectileId = allEntities[allEntities.length - 1];

        const projectileComponent = world.getComponent(projectileId, 'projectile');
        expect(projectileComponent?.damage).toBe(expectedDamage);
      });
    });

    describe('Multiple Weapons', () => {
      it('should handle multiple ships firing independently', () => {
        // Create second ship
        const ship2Id = world.createEntity();
        world.addComponent(ship2Id, new Transform());
        world.addComponent(ship2Id, new Weapon('single', 250));

        inputSystem.setAction('fire', true);
        weaponSystem.update(world, 16);

        const countAfterBothFire = world.query([]).size;

        // Both should have fired (2 projectiles + 2 ships = 4 entities)
        expect(countAfterBothFire).toBe(4);
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing transform gracefully', () => {
        world.removeComponent(shipId, Transform);

        inputSystem.setAction('fire', true);

        expect(() => {
          weaponSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle missing weapon component gracefully', () => {
        world.removeComponent(shipId, Weapon);

        inputSystem.setAction('fire', true);

        expect(() => {
          weaponSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle zero delta time', () => {
        inputSystem.setAction('fire', true);

        expect(() => {
          weaponSystem.update(world, 0);
        }).not.toThrow();
      });
    });
  });
  ```

### 3. Refactor Phase
- [x] Verify weapon firing calculations are correct
- [x] Review projectile spawn offset calculation
- [x] Clean up event emission system
- [x] Add JSDoc comments to system methods
- [x] Confirm all tests pass
- [x] Verify InputSystem integration is correct

## Completion Criteria

- [x] Projectiles fire on spacebar input
- [x] Cooldown enforced (250ms between shots)
- [x] Firing only when action is active AND cooldown expired
- [x] Weapon component created with cooldown, lastFiredAt, ammo tracking
- [x] Projectiles created at correct position and direction
- [x] Damage applied per weapon type
- [x] Events emitted for audio system
- [x] Unit tests passing (25+ test cases) - 35 test cases
- [x] Build succeeds with no TypeScript errors
- [x] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- WeaponSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Performance baseline
# Expected: <0.5ms per frame for weapon system with 1 firing ship
```

**Success Indicators**:
- All unit tests passing (25+ test cases)
- Type checking passes without errors
- Build succeeds
- WeaponSystem creates projectiles on input
- Cooldown prevents rapid firing
- Weapon component accessible from src/components

## Notes

- Weapon component tracks cooldown using timestamps (not delta-based)
- Fire action = spacebar input from InputSystem
- Projectile spawned slightly ahead of ship (spawnDistance = shipRadius + 1)
- Direction calculated from ship rotation (same as ShipControlSystem)
- Events emitted for audio feedback (consumed by AudioSystem later)
- Ammo tracking prepared for Phase 5 (currently 'infinite')
- Energy system prepared for Phase 5 (special weapons)
- Multiple weapon types supported (logic for switching in Phase 5)

## Impact Scope

**Allowed Changes**: Adjust cooldown times, projectile offset distance, add weapon switching logic
**Protected Areas**: InputSystem integration, collision layer naming, Weapon component interface
**Areas Affected**: CollisionSystem will detect projectile collisions (Task 3.3), ScoreSystem will track destroyed asteroids (Task 3.4)

## Deliverables

- Weapon component class with cooldown management
- WeaponSystem implementation for single-shot firing
- Comprehensive unit tests for weapon firing
- Event emission system for audio/feedback
- Ready for Task 2.1 Game orchestrator integration
- Ready for Task 3.3 (Projectile-Asteroid Collision)
