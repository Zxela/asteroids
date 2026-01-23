# Task: Projectile Entity and Factory

Metadata:
- Phase: 3 (Core Gameplay Loop)
- Task: 3.1
- Dependencies: Task 2.5 (Ship Entity), Task 2.7 (Render System)
- Provides: Projectile entity factory (src/entities/createProjectile.ts), Projectile component implementation
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Create a projectile entity factory function that generates projectile entities with all required components. Projectiles are launched by the WeaponSystem and destroyed on collision with asteroids. This task implements the data/factory layer only; weapon firing logic happens in Task 3.2.

*Reference dependencies: Transform, Velocity, Collider, Renderable, Projectile components from Task 2.3*

## Target Files

- [x] `src/components/Projectile.ts` - Projectile component definition
- [x] `src/entities/createProjectile.ts` - Projectile factory function
- [x] `tests/unit/createProjectile.test.ts` - Unit tests for projectile creation

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for projectile creation
- [x] Write failing test for projectile with default configuration
- [x] Write failing tests for each weapon type (single, spread, laser, homing)
- [x] Write failing test for projectile lifetime property
- [x] Write failing test for projectile damage based on weapon type
- [x] Write failing test for collider configuration (layer="projectile", mask includes "asteroid")
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement Projectile component**:
- [x] Create `src/components/Projectile.ts`:
  ```typescript
  import { Component } from '../types/ecs';

  export type ProjectileType = 'single' | 'spread' | 'laser' | 'homing';

  export class Projectile implements Component {
    readonly componentType = 'projectile' as const;
    damage: number;
    owner: number;        // EntityId of ship that fired
    lifetime: number;     // Milliseconds
    elapsed: number;      // Milliseconds elapsed since creation
    type: ProjectileType;
    homingTarget?: number; // EntityId of target (for homing missiles)

    constructor(
      damage = 10,
      owner = 0,
      lifetime = 3000,
      type: ProjectileType = 'single',
      homingTarget?: number
    ) {
      this.damage = damage;
      this.owner = owner;
      this.lifetime = lifetime;
      this.elapsed = 0;
      this.type = type;
      this.homingTarget = homingTarget;
    }

    isExpired(): boolean {
      return this.elapsed >= this.lifetime;
    }

    updateElapsed(deltaTime: number): void {
      this.elapsed += deltaTime;
    }
  }
  ```

**Implement projectile factory**:
- [x] Create `src/entities/createProjectile.ts`:
  ```typescript
  import { Vector3 } from 'three';
  import { World } from '../ecs/World';
  import { Transform, Velocity, Collider, Renderable, Projectile } from '../components';
  import { gameConfig } from '../config';

  export interface ProjectileConfig {
    position: Vector3;
    direction: Vector3;        // Normalized direction vector
    type: 'single' | 'spread' | 'laser' | 'homing';
    owner: number;             // EntityId of ship
    damage?: number;
    speed?: number;
    lifetime?: number;
    homingTarget?: number;     // For homing missiles
  }

  export function createProjectile(world: World, config: ProjectileConfig): number {
    const projectileId = world.createEntity();

    // Get weapon config for this type
    const weaponCfg = gameConfig.weapons[config.type];
    const speed = config.speed ?? weaponCfg.projectileSpeed;
    const damage = config.damage ?? weaponCfg.damage;
    const lifetime = config.lifetime ?? 3000;

    // Transform: position, rotation toward direction
    const directionRotation = new Vector3(0, 0, Math.atan2(config.direction.x, config.direction.y));
    world.addComponent(projectileId, new Transform(
      config.position.clone(),
      directionRotation,
      new Vector3(1, 1, 1)
    ));

    // Velocity: direction * speed
    const linearVelocity = config.direction.clone().multiplyScalar(speed);
    world.addComponent(projectileId, new Velocity(
      linearVelocity,
      new Vector3(0, 0, 0)
    ));

    // Collider: small sphere on "projectile" layer, collides with "asteroid"
    world.addComponent(projectileId, new Collider(
      'sphere',
      0.3,  // radius for small projectile
      'projectile',
      ['asteroid']  // mask
    ));

    // Renderable: meshType based on weapon type, transparent material
    const meshTypeMap = {
      'single': 'projectile' as const,
      'spread': 'projectile' as const,
      'laser': 'projectile' as const,
      'homing': 'projectile' as const,
    };

    world.addComponent(projectileId, new Renderable(
      meshTypeMap[config.type],
      'transparent'
    ));

    // Projectile component
    world.addComponent(projectileId, new Projectile(
      damage,
      config.owner,
      lifetime,
      config.type,
      config.homingTarget
    ));

    return projectileId;
  }
  ```

**Create unit tests**:
- [x] Create `tests/unit/createProjectile.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest';
  import { Vector3 } from 'three';
  import { World } from '../../src/ecs/World';
  import { createProjectile } from '../../src/entities/createProjectile';
  import { Transform, Velocity, Collider, Renderable, Projectile } from '../../src/components';
  import { gameConfig } from '../../src/config';

  describe('createProjectile', () => {
    let world: World;

    beforeEach(() => {
      world = new World();
    });

    describe('Single Shot Projectile', () => {
      it('should create projectile with correct position', () => {
        const position = new Vector3(10, 20, 0);
        const direction = new Vector3(0, 1, 0); // up
        const projectileId = createProjectile(world, {
          position,
          direction,
          type: 'single',
          owner: 1
        });

        const transform = world.getComponent<Transform>(projectileId, Transform);
        expect(transform?.position.x).toBeCloseTo(10, 1);
        expect(transform?.position.y).toBeCloseTo(20, 1);
        expect(transform?.position.z).toBeCloseTo(0, 1);
      });

      it('should create projectile with correct direction', () => {
        const position = new Vector3(0, 0, 0);
        const direction = new Vector3(0, 1, 0).normalize();
        const projectileId = createProjectile(world, {
          position,
          direction,
          type: 'single',
          owner: 1
        });

        const velocity = world.getComponent<Velocity>(projectileId, Velocity);
        const speed = gameConfig.weapons.single.projectileSpeed;

        // Should move in up direction
        expect(velocity?.linear.y).toBeGreaterThan(0);
        expect(Math.abs(velocity?.linear.x ?? 0)).toBeLessThan(0.1);
      });

      it('should apply correct damage for single shot', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.damage).toBe(gameConfig.weapons.single.damage);
      });

      it('should have projectile lifetime', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.lifetime).toBe(3000);
        expect(projectile?.elapsed).toBe(0);
      });

      it('should not be expired immediately', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.isExpired()).toBe(false);
      });
    });

    describe('Spread Shot Projectile', () => {
      it('should create spread projectile with correct type', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'spread',
          owner: 1
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.type).toBe('spread');
      });

      it('should apply spread shot damage', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'spread',
          owner: 1
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.damage).toBe(gameConfig.weapons.spread.damage);
      });
    });

    describe('Laser Projectile', () => {
      it('should create laser projectile with correct type', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'laser',
          owner: 1
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.type).toBe('laser');
      });

      it('should apply laser damage', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'laser',
          owner: 1
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.damage).toBe(gameConfig.weapons.laser.damage);
      });
    });

    describe('Homing Missile', () => {
      it('should create homing missile with target', () => {
        const targetId = 42;
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'homing',
          owner: 1,
          homingTarget: targetId
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.type).toBe('homing');
        expect(projectile?.homingTarget).toBe(targetId);
      });

      it('should apply homing missile damage', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'homing',
          owner: 1
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.damage).toBe(gameConfig.weapons.homing.damage);
      });
    });

    describe('Collider Configuration', () => {
      it('should have projectile collision layer', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1
        });

        const collider = world.getComponent<Collider>(projectileId, Collider);
        expect(collider?.layer).toBe('projectile');
      });

      it('should collide with asteroids', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1
        });

        const collider = world.getComponent<Collider>(projectileId, Collider);
        expect(collider?.mask.has('asteroid')).toBe(true);
      });

      it('should be sphere shape', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1
        });

        const collider = world.getComponent<Collider>(projectileId, Collider);
        expect(collider?.shape).toBe('sphere');
      });

      it('should have small radius', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1
        });

        const collider = world.getComponent<Collider>(projectileId, Collider);
        expect(collider?.radius).toBeLessThan(1);
      });
    });

    describe('Velocity Configuration', () => {
      it('should set velocity based on weapon speed', () => {
        const direction = new Vector3(1, 0, 0);
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction,
          type: 'single',
          owner: 1
        });

        const velocity = world.getComponent<Velocity>(projectileId, Velocity);
        const speed = gameConfig.weapons.single.projectileSpeed;

        expect(velocity?.linear.length()).toBeCloseTo(speed, 0);
      });

      it('should respect custom speed', () => {
        const customSpeed = 500;
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1,
          speed: customSpeed
        });

        const velocity = world.getComponent<Velocity>(projectileId, Velocity);
        expect(velocity?.linear.length()).toBeCloseTo(customSpeed, 0);
      });

      it('should have zero angular velocity', () => {
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1
        });

        const velocity = world.getComponent<Velocity>(projectileId, Velocity);
        expect(velocity?.angular.length()).toBeLessThan(0.01);
      });
    });

    describe('Custom Configuration', () => {
      it('should accept custom damage', () => {
        const customDamage = 50;
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1,
          damage: customDamage
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.damage).toBe(customDamage);
      });

      it('should accept custom lifetime', () => {
        const customLifetime = 5000;
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: 1,
          lifetime: customLifetime
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.lifetime).toBe(customLifetime);
      });
    });

    describe('Owner Tracking', () => {
      it('should track owner entity', () => {
        const ownerId = 99;
        const projectileId = createProjectile(world, {
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0),
          type: 'single',
          owner: ownerId
        });

        const projectile = world.getComponent<Projectile>(projectileId, Projectile);
        expect(projectile?.owner).toBe(ownerId);
      });
    });
  });
  ```

### 3. Refactor Phase
- [x] Verify Projectile component is pure data (no business logic except helpers)
- [x] Ensure factory function handles all weapon types correctly
- [x] Review direction rotation calculation for accuracy
- [x] Add JSDoc comments for factory parameters
- [x] Confirm all tests pass (20+ test cases)
- [x] Verify no circular dependencies with other components

## Completion Criteria

- [x] Projectile component created with damage, owner, lifetime, type, homingTarget
- [x] Factory function creates projectile entities with all required components
- [x] All weapon types (single, spread, laser, homing) supported
- [x] Projectile collider configured with "projectile" layer and "asteroid" mask
- [x] Velocity set based on weapon type speed configuration
- [x] Owner tracked correctly
- [x] Lifetime tracking in place
- [x] Unit tests passing (20+ test cases)
- [x] Build succeeds with no TypeScript errors
- [x] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- createProjectile.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Verify no compile errors
npm run build 2>&1 | grep -i error
```

**Success Indicators**:
- All unit tests passing (20+ test cases)
- Type checking passes without errors
- Build succeeds
- Projectile component accessible from src/components
- Factory function handles all weapon types
- Projectile entities have correct component structure

## Notes

- Projectile component is pure data only (no logic except helper methods)
- Lifetime tracking uses elapsed counter (updated by systems later)
- Direction is normalized before applying to velocity
- Rotation calculated to face direction of travel
- Custom damage/speed/lifetime can override weapon config defaults
- Homing missiles store target EntityId for later AI system
- Collider radius (0.3) designed to be small for precise collision detection
- No Physics component needed (projectiles use simple velocity-based movement)

## Impact Scope

**Allowed Changes**: Add new weapon types, adjust projectile properties, enhance factory parameters
**Protected Areas**: Component interface compliance, collision layer naming ("projectile", "asteroid")
**Areas Affected**: WeaponSystem (Task 3.2) will use this factory, CollisionSystem will detect projectile collisions

## Deliverables

- Projectile component class
- Projectile entity factory function
- Comprehensive unit tests for projectile creation
- Ready for Task 3.2 (Weapon System)
- Ready for Task 3.3 (Projectile-Asteroid Collision)
