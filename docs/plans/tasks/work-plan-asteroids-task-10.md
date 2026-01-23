# Task: Ship Entity and Factory

Metadata:
- Phase: 2 (Minimal Playable Game)
- Task: 2.5
- Dependencies: Task 2.3 (Component Definitions), Task 2.4 (Physics System)
- Provides: createShip factory function, src/entities/createShip.ts
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Create ship entity with factory function and core components. The ship is the player-controlled entity at the center of the game. This task creates the entity factory that initializes the ship with all required components for rendering, physics, collision, health, and player tracking.

*Reference dependencies: Physics constants (mass, damping, maxSpeed), Collider layer/mask setup*

## Target Files

- [ ] `src/entities/createShip.ts` - Ship factory function
- [ ] `tests/unit/createShip.test.ts` - Unit tests for ship creation

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [ ] Create test file for ship creation
- [ ] Write failing test for ship entity creation
- [ ] Write failing test that ship has all required components
- [ ] Write failing test for ship initial position (screen center)
- [ ] Write failing test for ship initial state (3 lives, 0 score)
- [ ] Write failing test for collider configuration
- [ ] Verify all tests fail (Red state)

### 2. Green Phase

**Implement Ship Factory**:
- [ ] Create `src/entities/createShip.ts`:
  ```typescript
  import { Vector3 } from 'three';
  import { World, EntityId } from '../types/ecs';
  import {
    Transform,
    Velocity,
    Physics,
    Collider,
    Health,
    Player,
    Renderable,
  } from '../components';
  import { gameConfig } from '../config';

  const SCREEN_CENTER_X = 0; // Center of screen in world coordinates
  const SCREEN_CENTER_Y = 0;
  const SCREEN_CENTER_Z = 0;

  export function createShip(world: World): EntityId {
    const shipId = world.createEntity();

    // Transform: Position at screen center, no rotation initially
    world.addComponent(
      shipId,
      new Transform(
        new Vector3(SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_CENTER_Z),
        new Vector3(0, 0, 0), // No initial rotation
        new Vector3(1, 1, 1) // Normal scale
      )
    );

    // Velocity: No initial movement
    world.addComponent(
      shipId,
      new Velocity(new Vector3(0, 0, 0), new Vector3(0, 0, 0))
    );

    // Physics: ship physics properties
    world.addComponent(
      shipId,
      new Physics(
        1, // mass = 1
        gameConfig.physics.damping, // 0.99
        gameConfig.physics.shipMaxSpeed, // 300
        true // wrapScreen = true
      )
    );

    // Collider: Player collision layer
    world.addComponent(
      shipId,
      new Collider(
        'sphere', // shape
        20, // radius
        'player', // layer
        ['asteroid', 'bossProjectile', 'powerup'] // collision mask
      )
    );

    // Health: Ship has 1 health per life
    world.addComponent(shipId, new Health(1, 1));

    // Player: Tracks lives and score
    world.addComponent(
      shipId,
      new Player(gameConfig.gameplay.initialLives)
    );

    // Renderable: Visual representation
    world.addComponent(
      shipId,
      new Renderable('ship', 'standard')
    );

    return shipId;
  }
  ```

**Create unit tests**:
- [ ] Create `tests/unit/createShip.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest';
  import { Vector3 } from 'three';
  import { World } from '../../src/ecs/World';
  import { createShip } from '../../src/entities/createShip';
  import {
    Transform,
    Velocity,
    Physics,
    Collider,
    Health,
    Player,
    Renderable,
  } from '../../src/components';
  import { gameConfig } from '../../src/config';

  describe('createShip', () => {
    let world: World;

    beforeEach(() => {
      world = new World();
    });

    describe('Ship Creation', () => {
      it('should create a ship entity', () => {
        const shipId = createShip(world);
        expect(shipId).toBeDefined();
        expect(typeof shipId).toBe('number');
      });

      it('should add all required components to ship', () => {
        const shipId = createShip(world);

        expect(world.getComponent(shipId, Transform)).toBeDefined();
        expect(world.getComponent(shipId, Velocity)).toBeDefined();
        expect(world.getComponent(shipId, Physics)).toBeDefined();
        expect(world.getComponent(shipId, Collider)).toBeDefined();
        expect(world.getComponent(shipId, Health)).toBeDefined();
        expect(world.getComponent(shipId, Player)).toBeDefined();
        expect(world.getComponent(shipId, Renderable)).toBeDefined();
      });
    });

    describe('Transform Configuration', () => {
      it('should position ship at screen center', () => {
        const shipId = createShip(world);
        const transform = world.getComponent<Transform>(shipId, Transform);

        expect(transform?.position.x).toBe(0);
        expect(transform?.position.y).toBe(0);
        expect(transform?.position.z).toBe(0);
      });

      it('should have no initial rotation', () => {
        const shipId = createShip(world);
        const transform = world.getComponent<Transform>(shipId, Transform);

        expect(transform?.rotation.x).toBe(0);
        expect(transform?.rotation.y).toBe(0);
        expect(transform?.rotation.z).toBe(0);
      });

      it('should have normal scale', () => {
        const shipId = createShip(world);
        const transform = world.getComponent<Transform>(shipId, Transform);

        expect(transform?.scale.x).toBe(1);
        expect(transform?.scale.y).toBe(1);
        expect(transform?.scale.z).toBe(1);
      });
    });

    describe('Velocity Configuration', () => {
      it('should have zero initial velocity', () => {
        const shipId = createShip(world);
        const velocity = world.getComponent<Velocity>(shipId, Velocity);

        expect(velocity?.linear.x).toBe(0);
        expect(velocity?.linear.y).toBe(0);
        expect(velocity?.linear.z).toBe(0);
        expect(velocity?.angular.x).toBe(0);
        expect(velocity?.angular.y).toBe(0);
        expect(velocity?.angular.z).toBe(0);
      });
    });

    describe('Physics Configuration', () => {
      it('should have mass of 1', () => {
        const shipId = createShip(world);
        const physics = world.getComponent<Physics>(shipId, Physics);

        expect(physics?.mass).toBe(1);
      });

      it('should have damping from config', () => {
        const shipId = createShip(world);
        const physics = world.getComponent<Physics>(shipId, Physics);

        expect(physics?.damping).toBe(gameConfig.physics.damping);
      });

      it('should have max speed from config', () => {
        const shipId = createShip(world);
        const physics = world.getComponent<Physics>(shipId, Physics);

        expect(physics?.maxSpeed).toBe(gameConfig.physics.shipMaxSpeed);
      });

      it('should have screen wrapping enabled', () => {
        const shipId = createShip(world);
        const physics = world.getComponent<Physics>(shipId, Physics);

        expect(physics?.wrapScreen).toBe(true);
      });

      it('should be enabled by default', () => {
        const shipId = createShip(world);
        const physics = world.getComponent<Physics>(shipId, Physics);

        expect(physics?.enabled).toBe(true);
      });
    });

    describe('Collider Configuration', () => {
      it('should use sphere collision shape', () => {
        const shipId = createShip(world);
        const collider = world.getComponent<Collider>(shipId, Collider);

        expect(collider?.shape).toBe('sphere');
      });

      it('should have radius of 20', () => {
        const shipId = createShip(world);
        const collider = world.getComponent<Collider>(shipId, Collider);

        expect(collider?.radius).toBe(20);
      });

      it('should be on player layer', () => {
        const shipId = createShip(world);
        const collider = world.getComponent<Collider>(shipId, Collider);

        expect(collider?.layer).toBe('player');
      });

      it('should collide with asteroids, boss projectiles, and power-ups', () => {
        const shipId = createShip(world);
        const collider = world.getComponent<Collider>(shipId, Collider);

        expect(collider?.mask.has('asteroid')).toBe(true);
        expect(collider?.mask.has('bossProjectile')).toBe(true);
        expect(collider?.mask.has('powerup')).toBe(true);
      });

      it('should be enabled by default', () => {
        const shipId = createShip(world);
        const collider = world.getComponent<Collider>(shipId, Collider);

        expect(collider?.enabled).toBe(true);
      });
    });

    describe('Health Configuration', () => {
      it('should have max health of 1', () => {
        const shipId = createShip(world);
        const health = world.getComponent<Health>(shipId, Health);

        expect(health?.max).toBe(1);
      });

      it('should have current health equal to max', () => {
        const shipId = createShip(world);
        const health = world.getComponent<Health>(shipId, Health);

        expect(health?.current).toBe(1);
      });

      it('should not be invulnerable initially', () => {
        const shipId = createShip(world);
        const health = world.getComponent<Health>(shipId, Health);

        expect(health?.invulnerable).toBe(false);
      });
    });

    describe('Player Configuration', () => {
      it('should have initial lives from config', () => {
        const shipId = createShip(world);
        const player = world.getComponent<Player>(shipId, Player);

        expect(player?.lives).toBe(gameConfig.gameplay.initialLives);
      });

      it('should have zero initial score', () => {
        const shipId = createShip(world);
        const player = world.getComponent<Player>(shipId, Player);

        expect(player?.score).toBe(0);
      });

      it('should have empty player name initially', () => {
        const shipId = createShip(world);
        const player = world.getComponent<Player>(shipId, Player);

        expect(player?.playerName).toBe('');
      });
    });

    describe('Renderable Configuration', () => {
      it('should have ship mesh type', () => {
        const shipId = createShip(world);
        const renderable = world.getComponent<Renderable>(shipId, Renderable);

        expect(renderable?.meshType).toBe('ship');
      });

      it('should use standard material', () => {
        const shipId = createShip(world);
        const renderable = world.getComponent<Renderable>(shipId, Renderable);

        expect(renderable?.material).toBe('standard');
      });

      it('should be visible initially', () => {
        const shipId = createShip(world);
        const renderable = world.getComponent<Renderable>(shipId, Renderable);

        expect(renderable?.visible).toBe(true);
      });
    });

    describe('Multiple Ships', () => {
      it('should create multiple ship entities with unique IDs', () => {
        const ship1 = createShip(world);
        const ship2 = createShip(world);

        expect(ship1).not.toBe(ship2);
      });

      it('should not share component instances between ships', () => {
        const ship1 = createShip(world);
        const ship2 = createShip(world);

        const transform1 = world.getComponent<Transform>(ship1, Transform);
        const transform2 = world.getComponent<Transform>(ship2, Transform);

        expect(transform1).not.toBe(transform2);
      });
    });
  });
  ```

### 3. Refactor Phase
- [ ] Verify all components properly initialized
- [ ] Ensure configuration values match Design Doc
- [ ] Add JSDoc comments explaining ship setup
- [ ] Verify no hardcoded values (all from config or calculated)
- [ ] Confirm all tests pass

## Completion Criteria

- [ ] Ship entity created with all required components
- [ ] Ship positioned at center of screen (0, 0, 0)
- [ ] Collider configured correctly (sphere, radius 20, player layer)
- [ ] Initial state matches spec (3 lives, 0 score)
- [ ] Physics properties use config values
- [ ] Unit tests passing (all test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- createShip.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (will be integrated with Task 2.1 renderer)
# Ship will be visible on screen at center after renderer task
```

**Success Indicators**:
- All unit tests passing (18+ test cases)
- Type checking passes
- Build succeeds
- Ship has all required components
- Component values match config

## Notes

- Ship has only 1 health per life (health depleted = loss of life, triggers respawn)
- Collider radius (20) is suitable for visible ship size
- Screen coordinates use origin at center (0, 0) - matches Three.js camera
- Configuration values (lives, damping, max speed) from Task 1.4
- Ship mass of 1 is baseline; other entities may have different mass
- Player name initially empty (set by leaderboard UI in Phase 4)
- Renderable component's threeJsId set by RenderSystem in Task 2.7

## Impact Scope

**Allowed Changes**: Adjust component properties, change initial values (if from config)
**Protected Areas**: Component setup order, collider layer/mask
**Areas Affected**: Ship behavior (physics, control, rendering) depends on these components

## Deliverables

- Ship factory function implementation
- Comprehensive unit tests for ship creation
- Ready for Task 2.6 (Ship Control)
- Ready for Task 2.7 (Render System)
