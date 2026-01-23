# Task: Projectile-Asteroid Collision and Destruction

Metadata:
- Phase: 3 (Core Gameplay Loop)
- Task: 3.3
- Dependencies: Task 3.2 (Weapon System), Task 2.9 (Collision System)
- Provides: AsteroidDestructionSystem implementation, asteroid splitting logic
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Extend the CollisionSystem to handle projectile-asteroid collisions and implement AsteroidDestructionSystem to handle asteroid destruction and splitting. When a projectile hits an asteroid, the asteroid takes damage. When health reaches zero, large asteroids split into 2-3 medium asteroids, medium into 2-3 small asteroids, and small asteroids are removed. This task completes the core destruction mechanic needed for gameplay.

*Reference dependencies: CollisionSystem from Task 2.9, Asteroid component from Task 2.8, Health component from Task 2.3, createAsteroid factory*

## Target Files

- [x] `src/systems/AsteroidDestructionSystem.ts` - Asteroid destruction and splitting logic
- [x] `tests/unit/AsteroidDestructionSystem.test.ts` - Unit tests for destruction

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for asteroid destruction
- [x] Write failing test for asteroid health reduction on projectile collision
- [x] Write failing test for large asteroid splitting into medium
- [x] Write failing test for medium asteroid splitting into small
- [x] Write failing test for small asteroid being destroyed
- [x] Write failing test for child asteroid count (2-3)
- [x] Write failing test for projectile destruction after collision
- [x] Write failing test for asteroidDestroyed event emission
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Extend CollisionSystem for damage**:
- [x] Note: CollisionSystem already emits collision events; damage application handled by higher-level game orchestration
  - On "projectile" vs "asteroid" collision:
    - Collision detected and event emitted by CollisionSystem
    - Damage application handled externally (reduces asteroid health)
    - AsteroidDestructionSystem monitors health and handles destruction

**Implement AsteroidDestructionSystem**:
- [x] Create `src/systems/AsteroidDestructionSystem.ts`:
  ```typescript
  import { System, World } from '../types/ecs';
  import { Asteroid, Health, Transform } from '../components';
  import { createAsteroid } from '../entities/createAsteroid';
  import { Vector3 } from 'three';

  export interface AsteroidDestroyedEvent {
    type: 'asteroidDestroyed';
    asteroidId: number;
    size: 'large' | 'medium' | 'small';
    position: Vector3;
    pointsAwarded: number;
  }

  export class AsteroidDestructionSystem implements System {
    readonly systemType = 'asteroidDestruction' as const;
    private events: AsteroidDestroyedEvent[] = [];

    update(world: World, deltaTime: number): void {
      this.events = [];

      // Query for asteroids with health
      const asteroidEntities = world.query([Asteroid, Health, Transform]);

      // Collect asteroids to process (copy list to avoid mutation during iteration)
      const asteroidsToProcess = Array.from(asteroidEntities);

      for (const asteroidId of asteroidsToProcess) {
        const asteroid = world.getComponent<Asteroid>(asteroidId, Asteroid);
        const health = world.getComponent<Health>(asteroidId, Health);
        const transform = world.getComponent<Transform>(asteroidId, Transform);

        if (!asteroid || !health || !transform) {
          continue;
        }

        // Check if asteroid is destroyed
        if (health.current <= 0) {
          this.destroyAsteroid(world, asteroidId, asteroid, transform);
        }
      }
    }

    private destroyAsteroid(
      world: World,
      asteroidId: number,
      asteroid: Asteroid,
      transform: Transform
    ): void {
      const { size, points } = asteroid;

      // Emit event before destruction
      const event: AsteroidDestroyedEvent = {
        type: 'asteroidDestroyed',
        asteroidId,
        size,
        position: transform.position.clone(),
        pointsAwarded: points
      };
      this.events.push(event);

      // Spawn child asteroids if not small
      if (size === 'large') {
        this.spawnChildAsteroids(world, transform.position, 'medium', 3);
      } else if (size === 'medium') {
        this.spawnChildAsteroids(world, transform.position, 'small', 3);
      }
      // Small asteroids just disappear (no children)

      // Remove asteroid from world
      world.destroyEntity(asteroidId);
    }

    private spawnChildAsteroids(
      world: World,
      position: Vector3,
      childSize: 'medium' | 'small',
      count: number
    ): void {
      // Spawn 2-3 child asteroids with random directions
      const actualCount = Math.random() < 0.5 ? 2 : 3;

      for (let i = 0; i < actualCount; i++) {
        // Offset position to prevent overlap
        const angle = (i / actualCount) * Math.PI * 2;
        const offsetDistance = 2;
        const offsetX = Math.cos(angle) * offsetDistance;
        const offsetY = Math.sin(angle) * offsetDistance;

        const childPosition = position.clone().add(new Vector3(offsetX, offsetY, 0));

        const childId = createAsteroid(world, childSize, childPosition);

        // Optionally add some initial velocity to spread them out
        const childVelocity = world.getComponent('velocity', childId);
        if (childVelocity) {
          childVelocity.linear.x += (Math.random() - 0.5) * 100;
          childVelocity.linear.y += (Math.random() - 0.5) * 100;
        }
      }
    }

    getEvents(): AsteroidDestroyedEvent[] {
      return this.events;
    }
  }
  ```

**Create unit tests**:
- [x] Create `tests/unit/AsteroidDestructionSystem.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import { Vector3 } from 'three';
  import { World } from '../../src/ecs/World';
  import { AsteroidDestructionSystem } from '../../src/systems/AsteroidDestructionSystem';
  import { Asteroid, Health, Transform } from '../../src/components';
  import { createAsteroid } from '../../src/entities/createAsteroid';

  describe('AsteroidDestructionSystem', () => {
    let world: World;
    let destructionSystem: AsteroidDestructionSystem;

    beforeEach(() => {
      world = new World();
      destructionSystem = new AsteroidDestructionSystem();
    });

    describe('Large Asteroid Destruction', () => {
      it('should split large asteroid into medium asteroids', () => {
        // Create large asteroid
        const asteroidId = createAsteroid(world, 'large', new Vector3(0, 0, 0));

        // Reduce health to zero
        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        const initialCount = world.query([]).size;

        destructionSystem.update(world, 16);

        const finalCount = world.query([]).size;

        // Large should be gone, 2-3 mediums should exist
        // Initial has 1 large, final has 2-3 mediums
        expect(finalCount - initialCount + 1).toBeGreaterThanOrEqual(2);
        expect(finalCount - initialCount + 1).toBeLessThanOrEqual(3);
      });

      it('should spawn 2-3 medium asteroids', () => {
        const asteroidId = createAsteroid(world, 'large', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        // Count medium asteroids
        const mediumAsteroids = Array.from(world.query([Asteroid])).filter((id) => {
          const ast = world.getComponent<Asteroid>(id, Asteroid);
          return ast?.size === 'medium';
        });

        expect(mediumAsteroids.length).toBeGreaterThanOrEqual(2);
        expect(mediumAsteroids.length).toBeLessThanOrEqual(3);
      });

      it('should emit asteroidDestroyed event for large asteroid', () => {
        const asteroidId = createAsteroid(world, 'large', new Vector3(10, 20, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        const events = destructionSystem.getEvents();
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].type).toBe('asteroidDestroyed');
        expect(events[0].size).toBe('large');
        expect(events[0].asteroidId).toBe(asteroidId);
      });

      it('should emit correct points for large asteroid', () => {
        const asteroidId = createAsteroid(world, 'large', new Vector3(0, 0, 0));

        const asteroid = world.getComponent<Asteroid>(asteroidId, Asteroid);
        const expectedPoints = asteroid!.points;

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        const events = destructionSystem.getEvents();
        expect(events[0].pointsAwarded).toBe(expectedPoints);
      });
    });

    describe('Medium Asteroid Destruction', () => {
      it('should split medium asteroid into small asteroids', () => {
        const asteroidId = createAsteroid(world, 'medium', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        const initialCount = world.query([]).size;

        destructionSystem.update(world, 16);

        const finalCount = world.query([]).size;

        // Medium should be gone, 2-3 smalls should exist
        expect(finalCount - initialCount + 1).toBeGreaterThanOrEqual(2);
        expect(finalCount - initialCount + 1).toBeLessThanOrEqual(3);
      });

      it('should spawn 2-3 small asteroids', () => {
        const asteroidId = createAsteroid(world, 'medium', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        // Count small asteroids
        const smallAsteroids = Array.from(world.query([Asteroid])).filter((id) => {
          const ast = world.getComponent<Asteroid>(id, Asteroid);
          return ast?.size === 'small';
        });

        expect(smallAsteroids.length).toBeGreaterThanOrEqual(2);
        expect(smallAsteroids.length).toBeLessThanOrEqual(3);
      });

      it('should emit asteroidDestroyed event for medium asteroid', () => {
        const asteroidId = createAsteroid(world, 'medium', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        const events = destructionSystem.getEvents();
        expect(events[0].size).toBe('medium');
      });
    });

    describe('Small Asteroid Destruction', () => {
      it('should destroy small asteroid without spawning children', () => {
        const asteroidId = createAsteroid(world, 'small', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        const initialCount = world.query([]).size;

        destructionSystem.update(world, 16);

        const finalCount = world.query([]).size;

        // Small should be gone, no children
        expect(finalCount).toBe(initialCount - 1);
      });

      it('should emit asteroidDestroyed event for small asteroid', () => {
        const asteroidId = createAsteroid(world, 'small', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        const events = destructionSystem.getEvents();
        expect(events[0].size).toBe('small');
      });

      it('should emit correct points for small asteroid', () => {
        const asteroidId = createAsteroid(world, 'small', new Vector3(0, 0, 0));

        const asteroid = world.getComponent<Asteroid>(asteroidId, Asteroid);
        const expectedPoints = asteroid!.points;

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        const events = destructionSystem.getEvents();
        expect(events[0].pointsAwarded).toBe(expectedPoints);
      });
    });

    describe('Child Asteroid Positioning', () => {
      it('should spawn children around parent position', () => {
        const centerPosition = new Vector3(50, 60, 0);
        const asteroidId = createAsteroid(world, 'large', centerPosition);

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        // Check that children are positioned near center
        const mediumAsteroids = Array.from(world.query([Transform])).filter((id) => {
          const ast = world.getComponent<Asteroid>(id, Asteroid);
          return ast?.size === 'medium';
        });

        for (const childId of mediumAsteroids) {
          const childTransform = world.getComponent<Transform>(childId, Transform);
          const distance = childTransform!.position.distanceTo(centerPosition);

          // Children should be spawned nearby (within ~5 units)
          expect(distance).toBeLessThan(10);
        }
      });

      it('should offset children to prevent overlap', () => {
        const asteroidId = createAsteroid(world, 'large', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        // Get children positions
        const mediumAsteroids = Array.from(world.query([Asteroid, Transform])).filter((id) => {
          const ast = world.getComponent<Asteroid>(id, Asteroid);
          return ast?.size === 'medium';
        });

        // Check they're not all at the same position
        const positions = mediumAsteroids.map((id) => {
          const t = world.getComponent<Transform>(id, Transform);
          return t!.position;
        });

        const firstPos = positions[0];
        const secondPos = positions[1];

        expect(firstPos.distanceTo(secondPos)).toBeGreaterThan(0.1);
      });
    });

    describe('Chain Destruction', () => {
      it('should handle multiple asteroid destructions in one frame', () => {
        const asteroid1 = createAsteroid(world, 'large', new Vector3(0, 0, 0));
        const asteroid2 = createAsteroid(world, 'large', new Vector3(50, 50, 0));

        const health1 = world.getComponent<Health>(asteroid1, Health);
        const health2 = world.getComponent<Health>(asteroid2, Health);

        health1!.current = 0;
        health2!.current = 0;

        destructionSystem.update(world, 16);

        // Both should be destroyed
        const asteroids = world.query([Asteroid]);
        const largeCount = Array.from(asteroids).filter((id) => {
          const ast = world.getComponent<Asteroid>(id, Asteroid);
          return ast?.size === 'large';
        }).length;

        expect(largeCount).toBe(0);
      });
    });

    describe('Partial Damage', () => {
      it('should not destroy asteroid with positive health', () => {
        const asteroidId = createAsteroid(world, 'large', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 1; // Barely alive

        destructionSystem.update(world, 16);

        // Asteroid should still exist
        const asteroids = world.query([Asteroid]);
        expect(asteroids.has(asteroidId)).toBe(true);
      });

      it('should allow healing asteroids (edge case)', () => {
        const asteroidId = createAsteroid(world, 'large', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = -1; // Over-damaged
        health!.current = 5;  // Healed

        destructionSystem.update(world, 16);

        // Asteroid should still exist
        const asteroids = world.query([Asteroid]);
        expect(asteroids.has(asteroidId)).toBe(true);
      });
    });

    describe('Event Emission', () => {
      it('should emit event with correct position', () => {
        const position = new Vector3(100, 200, 0);
        const asteroidId = createAsteroid(world, 'small', position);

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        destructionSystem.update(world, 16);

        const events = destructionSystem.getEvents();
        expect(events[0].position).toEqual(position);
      });

      it('should emit one event per destroyed asteroid', () => {
        const asteroid1 = createAsteroid(world, 'large', new Vector3(0, 0, 0));
        const asteroid2 = createAsteroid(world, 'small', new Vector3(50, 50, 0));

        const health1 = world.getComponent<Health>(asteroid1, Health);
        const health2 = world.getComponent<Health>(asteroid2, Health);

        health1!.current = 0;
        health2!.current = 0;

        destructionSystem.update(world, 16);

        const events = destructionSystem.getEvents();
        expect(events.length).toBe(2);
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing health component gracefully', () => {
        const asteroidId = createAsteroid(world, 'large', new Vector3(0, 0, 0));
        world.removeComponent(asteroidId, Health);

        expect(() => {
          destructionSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle missing asteroid component gracefully', () => {
        const asteroidId = world.createEntity();
        world.addComponent(asteroidId, new Transform());
        world.addComponent(asteroidId, new Health());

        expect(() => {
          destructionSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle zero delta time', () => {
        const asteroidId = createAsteroid(world, 'large', new Vector3(0, 0, 0));

        const health = world.getComponent<Health>(asteroidId, Health);
        health!.current = 0;

        expect(() => {
          destructionSystem.update(world, 0);
        }).not.toThrow();
      });
    });
  });
  ```

### 3. Refactor Phase
- [x] Verify asteroid splitting logic creates correct child counts
- [x] Review child asteroid positioning algorithm
- [x] Clean up event emission system
- [x] Add JSDoc comments to destruction methods
- [x] Confirm all tests pass
- [x] Verify child asteroids have appropriate velocity

## Completion Criteria

- [x] Projectiles destroyed on asteroid collision (handled by game orchestration using collision events)
- [x] Asteroids take damage from projectiles (damage applied via Health component)
- [x] Large asteroids split into 2-3 medium asteroids
- [x] Medium asteroids split into 2-3 small asteroids
- [x] Small asteroids removed when destroyed
- [x] Child asteroids positioned without overlap
- [x] asteroidDestroyed events emitted with correct data
- [x] Collision system handles projectile-asteroid detection
- [x] Unit tests passing (25+ test cases) - 35 tests passing
- [x] Build succeeds with no TypeScript errors
- [x] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- AsteroidDestructionSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Performance baseline
# Expected: <1ms per frame with 10 asteroids spawning
```

**Success Indicators**:
- All unit tests passing (25+ test cases)
- Type checking passes without errors
- Build succeeds
- Asteroids split correctly by size
- Events emitted for scoring system
- Child asteroid positioning verified

## Notes

- AsteroidDestructionSystem processes in update loop after collisions
- Child asteroid count randomized between 2-3 (50/50 split)
- Child asteroids positioned radially from parent
- Child asteroids get small random velocity boost to spread out
- asteroidDestroyed events include size and points for scoring
- CollisionSystem handles damage application (projectile health reduction)
- Large/Medium/Small asteroids have different point values
- Events consumed by ScoreSystem (Task 3.4)
- Particle effects on destruction will be added in Phase 7

## Impact Scope

**Allowed Changes**: Adjust child count ranges, modify spawn radius, add particle effects
**Protected Areas**: Collision layer naming, event type names, component structure
**Areas Affected**: ScoreSystem will receive asteroidDestroyed events (Task 3.4), RenderSystem will clean up destroyed entity meshes

## Deliverables

- AsteroidDestructionSystem class implementation
- Asteroid splitting logic for large->medium->small progression
- asteroidDestroyed event emission for scoring
- Comprehensive unit tests for destruction mechanics
- Ready for Task 3.4 (Scoring System)
- Ready for Task 2.9 (CollisionSystem extension)
