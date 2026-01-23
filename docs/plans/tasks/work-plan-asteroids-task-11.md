# Task: Ship Control System

Metadata:
- Phase: 2 (Minimal Playable Game)
- Task: 2.6
- Dependencies: Task 2.2 (Input System), Task 2.4 (Physics System), Task 2.5 (Ship Entity)
- Provides: ShipControlSystem implementation, src/systems/ShipControlSystem.ts
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement system to convert input to ship rotation and acceleration. The ship control system reads the InputSystem's movement state each frame and applies rotation based on left/right input and acceleration based on up/forward input. This is the primary gameplay mechanic connecting player input to entity physics.

*Reference dependencies: InputSystem for input queries, Physics constants (shipAcceleration, shipRotationSpeed)*

## Target Files

- [ ] `src/systems/ShipControlSystem.ts` - Ship control logic
- [ ] `tests/unit/ShipControlSystem.test.ts` - Unit tests for ship control

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [ ] Create test file for ship control
- [ ] Write failing test for ship rotation with left input
- [ ] Write failing test for ship rotation with right input
- [ ] Write failing test for ship acceleration with up input
- [ ] Write failing test for rotation speed (π rad/s)
- [ ] Write failing test for multiple input combinations
- [ ] Verify all tests fail (Red state)

### 2. Green Phase

**Implement ShipControlSystem**:
- [ ] Create `src/systems/ShipControlSystem.ts`:
  ```typescript
  import { System, World } from '../types/ecs';
  import { Transform, Velocity, Physics } from '../components';
  import { gameConfig } from '../config';
  import { InputSystem } from './InputSystem';

  export class ShipControlSystem implements System {
    readonly systemType = 'shipControl' as const;
    private inputSystem: InputSystem;

    constructor(inputSystem: InputSystem) {
      this.inputSystem = inputSystem;
    }

    update(world: World, deltaTime: number): void {
      // Convert deltaTime from ms to seconds
      const dt = deltaTime / 1000;

      // Get player ship (query for entities with Transform, Velocity, Physics)
      // Note: in full implementation, would query for Player component
      const shipEntities = world.query([Transform, Velocity, Physics]);

      if (shipEntities.size === 0) {
        return; // No ship in world yet
      }

      // Get first ship (should only be one player ship)
      const shipId = Array.from(shipEntities)[0];

      const transform = world.getComponent<Transform>(shipId, Transform);
      const velocity = world.getComponent<Velocity>(shipId, Velocity);
      const physics = world.getComponent<Physics>(shipId, Physics);

      if (!transform || !velocity || !physics || !physics.enabled) {
        return;
      }

      // Get input from InputSystem
      const movement = this.inputSystem.getMovementInput();

      // Apply rotation based on horizontal input (left/right)
      if (Math.abs(movement.x) > 0.01) {
        const rotationAmount = -movement.x * gameConfig.physics.shipRotationSpeed * dt;
        velocity.angular.z += rotationAmount;
      }

      // Apply acceleration based on vertical input (up/forward)
      if (movement.y > 0.01) {
        // Get ship's forward direction from rotation
        const forwardDirection = this.getForwardDirection(transform.rotation.z);

        // Apply acceleration in forward direction
        const acceleration = gameConfig.physics.shipAcceleration * movement.y;
        velocity.linear.x += forwardDirection.x * acceleration;
        velocity.linear.y += forwardDirection.y * acceleration;

        // Store thrust state for particle effects (will be used in Phase 7)
        this.emitThrustEvent(shipId, movement.y > 0.5); // Half intensity for half movement
      }

      // Clamp angular velocity to prevent excessive rotation
      const maxAngularSpeed = gameConfig.physics.shipMaxSpeed;
      const angularSpeed = Math.abs(velocity.angular.z);
      if (angularSpeed > maxAngularSpeed) {
        velocity.angular.z = (velocity.angular.z / angularSpeed) * maxAngularSpeed;
      }
    }

    private getForwardDirection(rotationZ: number): { x: number; y: number } {
      // Convert Z rotation to forward direction vector
      // Rotation 0 = +Y direction (up)
      // Rotation π/2 = -X direction (left)
      // Rotation π = -Y direction (down)
      // Rotation 3π/2 = +X direction (right)
      const x = Math.sin(rotationZ);
      const y = Math.cos(rotationZ);
      return { x, y };
    }

    private emitThrustEvent(shipId: number, isThrusting: boolean): void {
      // Emit event for audio/particle system (will be implemented in Phase 5)
      // For now, just a placeholder for future integration
      if (isThrusting) {
        // Event emission will happen here
      }
    }
  }
  ```

**Create unit tests**:
- [ ] Create `tests/unit/ShipControlSystem.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import { Vector3 } from 'three';
  import { World } from '../../src/ecs/World';
  import { ShipControlSystem } from '../../src/systems/ShipControlSystem';
  import { InputSystem, InputState } from '../../src/systems/InputSystem';
  import { Transform, Velocity, Physics } from '../../src/components';
  import { gameConfig } from '../../src/config';

  describe('ShipControlSystem', () => {
    let world: World;
    let shipControlSystem: ShipControlSystem;
    let inputSystem: InputSystem;
    let shipId: number;

    beforeEach(() => {
      world = new World();
      inputSystem = new InputSystem();
      shipControlSystem = new ShipControlSystem(inputSystem);

      // Create a test ship entity
      shipId = world.createEntity();
      world.addComponent(shipId, new Transform());
      world.addComponent(shipId, new Velocity());
      world.addComponent(shipId, new Physics());
    });

    describe('Rotation Control', () => {
      it('should rotate ship left when left input active', () => {
        // Set input to move left
        inputSystem['inputState'].movement.set(-1, 0);

        const velocityBefore = world.getComponent<Velocity>(shipId, Velocity);
        const angularZBefore = velocityBefore?.angular.z ?? 0;

        shipControlSystem.update(world, 100); // 0.1 seconds

        const velocityAfter = world.getComponent<Velocity>(shipId, Velocity);
        const angularZAfter = velocityAfter?.angular.z ?? 0;

        // Left input should increase (positive) angular velocity
        expect(angularZAfter).toBeGreaterThan(angularZBefore);
      });

      it('should rotate ship right when right input active', () => {
        // Set input to move right
        inputSystem['inputState'].movement.set(1, 0);

        const velocityBefore = world.getComponent<Velocity>(shipId, Velocity);
        const angularZBefore = velocityBefore?.angular.z ?? 0;

        shipControlSystem.update(world, 100);

        const velocityAfter = world.getComponent<Velocity>(shipId, Velocity);
        const angularZAfter = velocityAfter?.angular.z ?? 0;

        // Right input should decrease (negative) angular velocity
        expect(angularZAfter).toBeLessThan(angularZBefore);
      });

      it('should rotate at π rad/s when full left input', () => {
        inputSystem['inputState'].movement.set(-1, 0);

        shipControlSystem.update(world, 1000); // 1 second

        const velocity = world.getComponent<Velocity>(shipId, Velocity);
        const expectedRotation = gameConfig.physics.shipRotationSpeed; // π

        expect(velocity?.angular.z).toBeCloseTo(expectedRotation, 0);
      });

      it('should rotate at π rad/s when full right input', () => {
        inputSystem['inputState'].movement.set(1, 0);

        shipControlSystem.update(world, 1000); // 1 second

        const velocity = world.getComponent<Velocity>(shipId, Velocity);
        const expectedRotation = -gameConfig.physics.shipRotationSpeed; // -π

        expect(velocity?.angular.z).toBeCloseTo(expectedRotation, 0);
      });

      it('should apply proportional rotation for partial input', () => {
        inputSystem['inputState'].movement.set(-0.5, 0); // Half left

        shipControlSystem.update(world, 1000);

        const velocity = world.getComponent<Velocity>(shipId, Velocity);
        const expectedRotation = gameConfig.physics.shipRotationSpeed * 0.5;

        expect(velocity?.angular.z).toBeCloseTo(expectedRotation, 0);
      });

      it('should not rotate with zero horizontal input', () => {
        inputSystem['inputState'].movement.set(0, 0);

        const velocityBefore = world.getComponent<Velocity>(shipId, Velocity);
        const angularZBefore = velocityBefore?.angular.z ?? 0;

        shipControlSystem.update(world, 100);

        const velocityAfter = world.getComponent<Velocity>(shipId, Velocity);
        const angularZAfter = velocityAfter?.angular.z ?? 0;

        expect(angularZAfter).toBeCloseTo(angularZBefore, 5);
      });
    });

    describe('Acceleration Control', () => {
      it('should accelerate ship forward when up input active', () => {
        // Ship facing up (rotation = 0)
        const transform = world.getComponent<Transform>(shipId, Transform);
        transform!.rotation.z = 0;

        inputSystem['inputState'].movement.set(0, 1);

        const velocityBefore = world.getComponent<Velocity>(shipId, Velocity);
        const speedBefore = velocityBefore?.linear.length() ?? 0;

        shipControlSystem.update(world, 100);

        const velocityAfter = world.getComponent<Velocity>(shipId, Velocity);
        const speedAfter = velocityAfter?.linear.length() ?? 0;

        expect(speedAfter).toBeGreaterThan(speedBefore);
      });

      it('should accelerate in ship facing direction', () => {
        // Ship facing right (rotation = π/2)
        const transform = world.getComponent<Transform>(shipId, Transform);
        transform!.rotation.z = Math.PI / 2;

        inputSystem['inputState'].movement.set(0, 1);

        shipControlSystem.update(world, 100);

        const velocity = world.getComponent<Velocity>(shipId, Velocity);

        // Facing right, so X velocity should be primary
        expect(Math.abs(velocity!.linear.x)).toBeGreaterThan(
          Math.abs(velocity!.linear.y)
        );
      });

      it('should accelerate with proportional input', () => {
        const transform = world.getComponent<Transform>(shipId, Transform);
        transform!.rotation.z = 0;

        inputSystem['inputState'].movement.set(0, 0.5); // Half acceleration

        shipControlSystem.update(world, 1000);

        const velocity = world.getComponent<Velocity>(shipId, Velocity);
        const speed = velocity?.linear.length() ?? 0;

        // Half input should give half acceleration
        const expectedAccel = gameConfig.physics.shipAcceleration * 0.5;
        expect(speed).toBeCloseTo(expectedAccel, 0);
      });

      it('should not accelerate with zero vertical input', () => {
        inputSystem['inputState'].movement.set(0, 0);

        const velocityBefore = world.getComponent<Velocity>(shipId, Velocity);
        const speedBefore = velocityBefore?.linear.length() ?? 0;

        shipControlSystem.update(world, 100);

        const velocityAfter = world.getComponent<Velocity>(shipId, Velocity);
        const speedAfter = velocityAfter?.linear.length() ?? 0;

        expect(speedAfter).toBeCloseTo(speedBefore, 5);
      });

      it('should not accelerate with negative vertical input', () => {
        inputSystem['inputState'].movement.set(0, -1);

        const velocityBefore = world.getComponent<Velocity>(shipId, Velocity);
        const speedBefore = velocityBefore?.linear.length() ?? 0;

        shipControlSystem.update(world, 100);

        const velocityAfter = world.getComponent<Velocity>(shipId, Velocity);
        const speedAfter = velocityAfter?.linear.length() ?? 0;

        expect(speedAfter).toBeCloseTo(speedBefore, 5);
      });
    });

    describe('Combined Input', () => {
      it('should handle simultaneous rotation and acceleration', () => {
        inputSystem['inputState'].movement.set(-0.5, 1);

        const velocityBefore = world.getComponent<Velocity>(shipId, Velocity);

        shipControlSystem.update(world, 100);

        const velocityAfter = world.getComponent<Velocity>(shipId, Velocity);

        // Both rotation and acceleration should occur
        expect(Math.abs(velocityAfter!.angular.z)).toBeGreaterThan(0);
        expect(velocityAfter!.linear.length()).toBeGreaterThan(0);
      });

      it('should handle full input in all directions', () => {
        inputSystem['inputState'].movement.set(1, 1);

        shipControlSystem.update(world, 100);

        const velocity = world.getComponent<Velocity>(shipId, Velocity);

        expect(velocity?.angular.z).toBeLessThan(0);
        expect(velocity?.linear.length()).toBeGreaterThan(0);
      });
    });

    describe('Physics Constraints', () => {
      it('should not exceed max angular speed', () => {
        // Force high angular velocity
        const velocity = world.getComponent<Velocity>(shipId, Velocity);
        velocity!.angular.z = 1000;

        shipControlSystem.update(world, 100);

        const updatedVelocity = world.getComponent<Velocity>(shipId, Velocity);
        const angularSpeed = Math.abs(updatedVelocity!.angular.z);

        expect(angularSpeed).toBeLessThanOrEqual(gameConfig.physics.shipMaxSpeed);
      });

      it('should not update disabled physics', () => {
        const physics = world.getComponent<Physics>(shipId, Physics);
        physics!.enabled = false;

        inputSystem['inputState'].movement.set(1, 1);

        const velocityBefore = world.getComponent<Velocity>(shipId, Velocity);
        const speedBefore = velocityBefore?.linear.length() ?? 0;

        shipControlSystem.update(world, 100);

        const velocityAfter = world.getComponent<Velocity>(shipId, Velocity);
        const speedAfter = velocityAfter?.linear.length() ?? 0;

        expect(speedAfter).toBeCloseTo(speedBefore, 5);
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing velocity component gracefully', () => {
        world.removeComponent(shipId, Velocity);

        inputSystem['inputState'].movement.set(1, 1);

        expect(() => {
          shipControlSystem.update(world, 100);
        }).not.toThrow();
      });

      it('should handle zero delta time', () => {
        inputSystem['inputState'].movement.set(1, 1);

        expect(() => {
          shipControlSystem.update(world, 0);
        }).not.toThrow();
      });

      it('should handle empty world gracefully', () => {
        const emptyWorld = new World();

        expect(() => {
          shipControlSystem.update(emptyWorld, 100);
        }).not.toThrow();
      });
    });
  });
  ```

### 3. Refactor Phase
- [ ] Verify rotation and acceleration calculations are correct
- [ ] Review forward direction calculation for accuracy
- [ ] Clean up placeholder thrust event system
- [ ] Add performance comments
- [ ] Confirm all tests pass

## Completion Criteria

- [ ] Ship rotates smoothly with left/right input
- [ ] Rotation speed matches π rad/second
- [ ] Ship accelerates in facing direction with up input
- [ ] Velocity magnitude respects max speed (enforced by Physics system)
- [ ] Combined input works (rotation + acceleration simultaneously)
- [ ] Unit tests passing (15+ test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- ShipControlSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Performance baseline will be checked when integrated with Task 2.1 renderer
# Expected: <0.5ms per frame for ship control
```

**Success Indicators**:
- All unit tests passing (15+ test cases)
- Type checking passes
- Build succeeds
- Ship rotates proportionally to input
- Ship accelerates in facing direction
- Rotation speed accurate (π rad/s)

## Notes

- Ship control applies forces to Velocity component (Physics system handles damping)
- Rotation is around Z-axis (local rotation for 2.5D gameplay)
- Acceleration uses forward direction calculated from Z rotation
- Angular velocity is clamped to max speed to prevent excessive spinning
- Thrust event placeholder will be used for particle/audio system in Phase 5
- Input movement vector ranges from -1 to 1 in each axis
- No direct position changes; control only affects velocity
- Integration with InputSystem happens in Game orchestrator (Task 2.1)

## Impact Scope

**Allowed Changes**: Adjust control responsiveness, change rotation speed, add new control schemes
**Protected Areas**: InputSystem integration points, Physics component structure
**Areas Affected**: Player input handling, ship movement behavior

## Deliverables

- ShipControlSystem class implementation
- Comprehensive unit tests for ship control logic
- Ready for Task 2.1 integration
- Ready for Task 2.7 (Render System) for visual feedback
