# Task: Physics System Implementation

Metadata:
- Phase: 2 (Minimal Playable Game)
- Task: 2.4
- Dependencies: Task 2.3 (Component Definitions), Task 1.4 (Configuration Constants)
- Provides: PhysicsSystem implementation, src/systems/PhysicsSystem.ts
- Size: Small (2 files)
- Estimated Duration: 1 day

## Implementation Content

Implement physics system for entity movement, velocity, damping, and screen wrapping. The physics system updates entity positions based on velocity and deltaTime, applies damping to reduce velocity each frame, enforces max speed limits, and implements screen wrapping (toroidal topology).

*Reference dependencies: gameConfig physics constants (shipAcceleration, shipMaxSpeed, damping)*

## Target Files

- [x] `src/systems/PhysicsSystem.ts` - Physics update logic
- [x] `tests/unit/PhysicsSystem.test.ts` - Unit tests for physics calculations

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for physics calculations
- [x] Write failing tests for position updates with velocity
- [x] Write failing tests for damping velocity reduction
- [x] Write failing tests for screen wrapping at boundaries
- [x] Write failing tests for max speed enforcement
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement PhysicsSystem**:
- [x] Create `src/systems/PhysicsSystem.ts`:
  ```typescript
  import { System, World, EntityId } from '../types/ecs';
  import { Transform, Velocity, Physics } from '../components';
  import { gameConfig } from '../config';

  const SCREEN_WIDTH = 1920;
  const SCREEN_HEIGHT = 1080;
  const SCREEN_HALF_WIDTH = SCREEN_WIDTH / 2;
  const SCREEN_HALF_HEIGHT = SCREEN_HEIGHT / 2;

  export class PhysicsSystem implements System {
    readonly systemType = 'physics' as const;

    update(world: World, deltaTime: number): void {
      // Convert deltaTime from ms to seconds
      const dt = deltaTime / 1000;

      // Query all entities with Transform, Velocity, and Physics components
      const entities = world.query([Transform, Velocity, Physics]);

      for (const entityId of entities) {
        const transform = world.getComponent<Transform>(entityId, Transform);
        const velocity = world.getComponent<Velocity>(entityId, Velocity);
        const physics = world.getComponent<Physics>(entityId, Physics);

        if (!transform || !velocity || !physics || !physics.enabled) {
          continue;
        }

        // Update position based on linear velocity
        transform.position.x += velocity.linear.x * dt;
        transform.position.y += velocity.linear.y * dt;
        transform.position.z += velocity.linear.z * dt;

        // Update rotation based on angular velocity
        transform.rotation.x += velocity.angular.x * dt;
        transform.rotation.y += velocity.angular.y * dt;
        transform.rotation.z += velocity.angular.z * dt;

        // Apply damping (exponential decay)
        velocity.linear.multiplyScalar(Math.pow(physics.damping, dt));
        velocity.angular.multiplyScalar(Math.pow(physics.damping, dt));

        // Enforce max speed limit
        this.enforceMaxSpeed(velocity, physics.maxSpeed);

        // Apply screen wrapping if enabled
        if (physics.wrapScreen) {
          this.wrapScreenCoordinates(transform);
        }
      }
    }

    private enforceMaxSpeed(velocity: Velocity, maxSpeed: number): void {
      const speed = velocity.linear.length();
      if (speed > maxSpeed) {
        velocity.linear.normalize().multiplyScalar(maxSpeed);
      }

      const angularSpeed = velocity.angular.length();
      if (angularSpeed > maxSpeed) {
        velocity.angular.normalize().multiplyScalar(maxSpeed);
      }
    }

    private wrapScreenCoordinates(transform: Transform): void {
      // Wrap X axis
      if (transform.position.x > SCREEN_HALF_WIDTH) {
        transform.position.x = -SCREEN_HALF_WIDTH;
      } else if (transform.position.x < -SCREEN_HALF_WIDTH) {
        transform.position.x = SCREEN_HALF_WIDTH;
      }

      // Wrap Y axis
      if (transform.position.y > SCREEN_HALF_HEIGHT) {
        transform.position.y = -SCREEN_HALF_HEIGHT;
      } else if (transform.position.y < -SCREEN_HALF_HEIGHT) {
        transform.position.y = SCREEN_HALF_HEIGHT;
      }

      // Z axis wrapping (for 2.5D gameplay)
      if (transform.position.z > 500) {
        transform.position.z = -500;
      } else if (transform.position.z < -500) {
        transform.position.z = 500;
      }
    }
  }
  ```

**Create unit tests**:
- [x] Create `tests/unit/PhysicsSystem.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest';
  import { Vector3 } from 'three';
  import { World } from '../../src/ecs/World';
  import { PhysicsSystem } from '../../src/systems/PhysicsSystem';
  import { Transform, Velocity, Physics } from '../../src/components';

  describe('PhysicsSystem', () => {
    let world: World;
    let physicsSystem: PhysicsSystem;

    beforeEach(() => {
      world = new World();
      physicsSystem = new PhysicsSystem();
    });

    describe('Position Updates', () => {
      it('should update position based on velocity', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)));
        world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)));
        world.addComponent(entityId, new Physics(1, 0.99, 300, false));

        physicsSystem.update(world, 1000); // 1 second

        const transform = world.getComponent<Transform>(entityId, Transform);
        expect(transform?.position.x).toBeCloseTo(100, 0);
      });

      it('should update rotation based on angular velocity', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Velocity(
          new Vector3(0, 0, 0),
          new Vector3(Math.PI, 0, 0)
        ));
        world.addComponent(entityId, new Physics());

        physicsSystem.update(world, 1000); // 1 second

        const transform = world.getComponent<Transform>(entityId, Transform);
        expect(transform?.rotation.x).toBeCloseTo(Math.PI, 0);
      });

      it('should handle multiple frames correctly', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)));
        world.addComponent(entityId, new Velocity(new Vector3(50, 0, 0)));
        world.addComponent(entityId, new Physics());

        physicsSystem.update(world, 500); // 0.5 seconds
        physicsSystem.update(world, 500); // 0.5 seconds

        const transform = world.getComponent<Transform>(entityId, Transform);
        expect(transform?.position.x).toBeCloseTo(50, 0);
      });
    });

    describe('Damping', () => {
      it('should reduce velocity over time', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        const velocity = new Velocity(new Vector3(100, 0, 0));
        world.addComponent(entityId, velocity);
        world.addComponent(entityId, new Physics(1, 0.9, 300, false));

        physicsSystem.update(world, 1000); // 1 second

        const updatedVelocity = world.getComponent<Velocity>(entityId, Velocity);
        expect(updatedVelocity?.linear.x).toBeLessThan(100);
        expect(updatedVelocity?.linear.x).toBeGreaterThan(50);
      });

      it('should apply exponential damping', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Velocity(new Vector3(1000, 0, 0)));
        world.addComponent(entityId, new Physics(1, 0.5, 1000, false));

        const initialVelocity = 1000;
        physicsSystem.update(world, 100); // 0.1 seconds

        const velocity = world.getComponent<Velocity>(entityId, Velocity);
        const damping = Math.pow(0.5, 0.1);
        expect(velocity?.linear.x).toBeCloseTo(initialVelocity * damping, 0);
      });

      it('should eventually stop moving with damping', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)));
        world.addComponent(entityId, new Physics(1, 0.1, 300, false));

        for (let i = 0; i < 100; i++) {
          physicsSystem.update(world, 100);
        }

        const velocity = world.getComponent<Velocity>(entityId, Velocity);
        expect(velocity?.linear.x).toBeLessThan(0.01);
      });
    });

    describe('Max Speed Enforcement', () => {
      it('should limit linear velocity to max speed', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Velocity(new Vector3(500, 0, 0)));
        world.addComponent(entityId, new Physics(1, 0.99, 300, false));

        physicsSystem.update(world, 100);

        const velocity = world.getComponent<Velocity>(entityId, Velocity);
        const speed = velocity?.linear.length() || 0;
        expect(speed).toBeLessThanOrEqual(300);
      });

      it('should limit angular velocity to max speed', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Velocity(
          new Vector3(0, 0, 0),
          new Vector3(500, 500, 500)
        ));
        world.addComponent(entityId, new Physics(1, 0.99, 300, false));

        physicsSystem.update(world, 100);

        const velocity = world.getComponent<Velocity>(entityId, Velocity);
        const angularSpeed = velocity?.angular.length() || 0;
        expect(angularSpeed).toBeLessThanOrEqual(300);
      });
    });

    describe('Screen Wrapping', () => {
      it('should wrap x coordinate when exceeding right boundary', () => {
        const entityId = world.createEntity();
        const transform = new Transform(new Vector3(1000, 0, 0));
        world.addComponent(entityId, transform);
        world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)));
        world.addComponent(entityId, new Physics(1, 0.99, 300, true));

        physicsSystem.update(world, 100);

        const updatedTransform = world.getComponent<Transform>(entityId, Transform);
        expect(updatedTransform?.position.x).toBeLessThan(0);
      });

      it('should wrap x coordinate when exceeding left boundary', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform(new Vector3(-1000, 0, 0)));
        world.addComponent(entityId, new Velocity(new Vector3(-100, 0, 0)));
        world.addComponent(entityId, new Physics(1, 0.99, 300, true));

        physicsSystem.update(world, 100);

        const transform = world.getComponent<Transform>(entityId, Transform);
        expect(transform?.position.x).toBeGreaterThan(0);
      });

      it('should wrap y coordinate at boundaries', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform(new Vector3(0, 600, 0)));
        world.addComponent(entityId, new Velocity(new Vector3(0, 100, 0)));
        world.addComponent(entityId, new Physics(1, 0.99, 300, true));

        physicsSystem.update(world, 100);

        const transform = world.getComponent<Transform>(entityId, Transform);
        expect(transform?.position.y).toBeLessThan(0);
      });

      it('should not wrap when wrapScreen is false', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform(new Vector3(1000, 0, 0)));
        world.addComponent(entityId, new Velocity());
        world.addComponent(entityId, new Physics(1, 0.99, 300, false));

        physicsSystem.update(world, 100);

        const transform = world.getComponent<Transform>(entityId, Transform);
        expect(transform?.position.x).toBeGreaterThan(900);
      });
    });

    describe('Physics Disabled', () => {
      it('should not update disabled physics', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)));
        world.addComponent(entityId, new Velocity(new Vector3(100, 0, 0)));
        const physics = new Physics();
        physics.enabled = false;
        world.addComponent(entityId, physics);

        physicsSystem.update(world, 1000);

        const transform = world.getComponent<Transform>(entityId, Transform);
        expect(transform?.position.x).toBe(0);
      });
    });
  });
  ```

### 3. Refactor Phase
- [x] Verify physics calculations are accurate
- [x] Review screen wrapping logic for edge cases
- [x] Add performance comments for hot paths
- [x] Ensure damping calculation is efficient
- [x] Confirm all tests pass

## Completion Criteria

- [x] Entities move according to velocity
- [x] Damping smoothly reduces speed over time
- [x] Screen wrapping works at all boundaries (X, Y, Z)
- [x] Max speed enforcement prevents excessive velocity
- [x] Physics disabled entities don't move (Note: enabled property not in Design Doc interface)
- [x] Unit tests passing (all test cases)
- [x] Build succeeds with no errors
- [x] Damping math verified (exponential decay)

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- PhysicsSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Performance check (manual)
# Monitor frame timing in Chrome DevTools
# PhysicsSystem should complete in <1ms per frame
```

**Success Indicators**:
- All unit tests passing (8+ test cases)
- Type checking passes
- Build succeeds
- Physics calculations accurate (verified by tests)
- Damping visible in gameplay (entities slow down)
- Screen wrapping working (entities reappear on opposite side)

## Notes

- Screen dimensions (1920x1080) are placeholder - will use actual canvas dimensions in Task 2.1
- Physics system operates on deltaTime in milliseconds (converted to seconds internally)
- Damping uses exponential decay formula: velocity *= damping^deltaTime
- Max speed is enforced on vector length, not components individually
- Physics component `enabled` flag allows selective physics updates
- Angular velocity treated same as linear velocity for damping/max speed
- No collision resolution in this system (handled separately in Task 2.9)

## Impact Scope

**Allowed Changes**: Adjust damping formulas, add new physics properties, optimize performance
**Protected Areas**: Component interface compliance, query patterns
**Areas Affected**: Movement behavior of all entities (depends on this system)

## Deliverables

- PhysicsSystem class implementation
- Comprehensive unit tests for physics calculations
- Ready for Task 2.5 (Ship Entity) and Task 2.6 (Ship Control)
