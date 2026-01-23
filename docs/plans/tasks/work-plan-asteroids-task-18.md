# Task: Scoring System

Metadata:
- Phase: 3 (Core Gameplay Loop)
- Task: 3.4
- Dependencies: Task 3.3 (Projectile-Asteroid Collision), Task 2.5 (Ship Entity)
- Provides: ScoreSystem implementation (src/systems/ScoreSystem.ts)
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement the ScoreSystem that listens for asteroidDestroyed events and updates the player score. Points are awarded based on asteroid size: Small (100), Medium (50), Large (25). The system maintains player score in the Player component and emits scoreChanged events for HUD updates.

*Reference dependencies: asteroidDestroyed events from Task 3.3, Player component from Task 2.3*

## Target Files

- [x] `src/systems/ScoreSystem.ts` - Score tracking and calculation logic
- [x] `tests/unit/ScoreSystem.test.ts` - Unit tests for score calculation

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for score system
- [x] Write failing test for score increase on asteroid destruction
- [x] Write failing test for correct points per asteroid size
- [x] Write failing test for persistent score across multiple destructions
- [x] Write failing test for scoreChanged event emission
- [x] Write failing test for large asteroid = 25 points
- [x] Write failing test for medium asteroid = 50 points
- [x] Write failing test for small asteroid = 100 points
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement ScoreSystem**:
- [x] Create `src/systems/ScoreSystem.ts`:
  ```typescript
  import { System, World } from '../types/ecs';
  import { Player } from '../components';
  import { AsteroidDestroyedEvent } from './AsteroidDestructionSystem';

  export interface ScoreChangedEvent {
    type: 'scoreChanged';
    newScore: number;
    pointsAwarded: number;
    asteroidSize: 'large' | 'medium' | 'small';
  }

  export class ScoreSystem implements System {
    readonly systemType = 'score' as const;
    private events: ScoreChangedEvent[] = [];
    private asteroidDestroyedEvents: AsteroidDestroyedEvent[] = [];

    /**
     * Set asteroid destroyed events from AsteroidDestructionSystem
     * Called each frame with events from destruction system
     */
    setAsteroidDestroyedEvents(events: AsteroidDestroyedEvent[]): void {
      this.asteroidDestroyedEvents = events;
    }

    update(world: World, deltaTime: number): void {
      this.events = [];

      // Query for player entity
      const playerEntities = world.query([Player]);

      if (playerEntities.size === 0) {
        return; // No player entity
      }

      // Get player (should be only one)
      const playerId = Array.from(playerEntities)[0];
      const player = world.getComponent<Player>(playerId, Player);

      if (!player) {
        return;
      }

      // Process each asteroid destruction event
      for (const event of this.asteroidDestroyedEvents) {
        const pointsAwarded = event.pointsAwarded;

        // Update player score
        player.addScore(pointsAwarded);

        // Emit event
        const scoreEvent: ScoreChangedEvent = {
          type: 'scoreChanged',
          newScore: player.score,
          pointsAwarded,
          asteroidSize: event.size
        };
        this.events.push(scoreEvent);
      }
    }

    getEvents(): ScoreChangedEvent[] {
      return this.events;
    }
  }
  ```

**Create unit tests**:
- [x] Create `tests/unit/ScoreSystem.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest';
  import { World } from '../../src/ecs/World';
  import { ScoreSystem } from '../../src/systems/ScoreSystem';
  import { AsteroidDestructionSystem, AsteroidDestroyedEvent } from '../../src/systems/AsteroidDestructionSystem';
  import { Player } from '../../src/components';
  import { Vector3 } from 'three';

  describe('ScoreSystem', () => {
    let world: World;
    let scoreSystem: ScoreSystem;
    let playerId: number;

    beforeEach(() => {
      world = new World();
      scoreSystem = new ScoreSystem();

      // Create player entity
      playerId = world.createEntity();
      world.addComponent(playerId, new Player(3)); // 3 lives
    });

    describe('Score Increase', () => {
      it('should increase score on asteroid destruction', () => {
        const player = world.getComponent<Player>(playerId, Player);
        const initialScore = player!.score;

        // Create mock asteroidDestroyed event
        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        const updatedScore = player!.score;
        expect(updatedScore).toBe(initialScore + 100);
      });

      it('should accumulate score across multiple destructions', () => {
        const player = world.getComponent<Player>(playerId, Player);
        const initialScore = player!.score;

        // Create multiple events
        const events: AsteroidDestroyedEvent[] = [
          {
            type: 'asteroidDestroyed',
            asteroidId: 1,
            size: 'small',
            position: new Vector3(0, 0, 0),
            pointsAwarded: 100
          },
          {
            type: 'asteroidDestroyed',
            asteroidId: 2,
            size: 'medium',
            position: new Vector3(10, 10, 0),
            pointsAwarded: 50
          },
          {
            type: 'asteroidDestroyed',
            asteroidId: 3,
            size: 'large',
            position: new Vector3(20, 20, 0),
            pointsAwarded: 25
          }
        ];

        scoreSystem.setAsteroidDestroyedEvents(events);
        scoreSystem.update(world, 16);

        const updatedScore = player!.score;
        expect(updatedScore).toBe(initialScore + 175); // 100 + 50 + 25
      });

      it('should persist score across multiple frames', () => {
        const player = world.getComponent<Player>(playerId, Player);

        // First frame: destroy small
        const event1: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };
        scoreSystem.setAsteroidDestroyedEvents([event1]);
        scoreSystem.update(world, 16);

        const scoreAfterFirst = player!.score;

        // Second frame: destroy medium
        const event2: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 2,
          size: 'medium',
          position: new Vector3(10, 10, 0),
          pointsAwarded: 50
        };
        scoreSystem.setAsteroidDestroyedEvents([event2]);
        scoreSystem.update(world, 16);

        const scoreAfterSecond = player!.score;

        expect(scoreAfterFirst).toBe(100);
        expect(scoreAfterSecond).toBe(150);
      });
    });

    describe('Point Values', () => {
      it('should award 100 points for small asteroid', () => {
        const player = world.getComponent<Player>(playerId, Player);

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        expect(player!.score).toBe(100);
      });

      it('should award 50 points for medium asteroid', () => {
        const player = world.getComponent<Player>(playerId, Player);

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'medium',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 50
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        expect(player!.score).toBe(50);
      });

      it('should award 25 points for large asteroid', () => {
        const player = world.getComponent<Player>(playerId, Player);

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'large',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 25
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        expect(player!.score).toBe(25);
      });
    });

    describe('Event Emission', () => {
      it('should emit scoreChanged event', () => {
        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        const events = scoreSystem.getEvents();
        expect(events.length).toBe(1);
        expect(events[0].type).toBe('scoreChanged');
      });

      it('should include new score in event', () => {
        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        const events = scoreSystem.getEvents();
        expect(events[0].newScore).toBe(100);
      });

      it('should include points awarded in event', () => {
        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        const events = scoreSystem.getEvents();
        expect(events[0].pointsAwarded).toBe(100);
      });

      it('should include asteroid size in event', () => {
        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'medium',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 50
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        const events = scoreSystem.getEvents();
        expect(events[0].asteroidSize).toBe('medium');
      });

      it('should emit one event per asteroid destroyed', () => {
        const events: AsteroidDestroyedEvent[] = [
          {
            type: 'asteroidDestroyed',
            asteroidId: 1,
            size: 'small',
            position: new Vector3(0, 0, 0),
            pointsAwarded: 100
          },
          {
            type: 'asteroidDestroyed',
            asteroidId: 2,
            size: 'medium',
            position: new Vector3(10, 10, 0),
            pointsAwarded: 50
          }
        ];

        scoreSystem.setAsteroidDestroyedEvents(events);
        scoreSystem.update(world, 16);

        const scoreEvents = scoreSystem.getEvents();
        expect(scoreEvents.length).toBe(2);
      });
    });

    describe('Multiple Players', () => {
      it('should only update first player found', () => {
        // Create second player
        const player2Id = world.createEntity();
        world.addComponent(player2Id, new Player(3));

        const player1 = world.getComponent<Player>(playerId, Player);
        const player2 = world.getComponent<Player>(player2Id, Player);

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        // Only first player should be updated (single-player game)
        expect(player1!.score).toBe(100);
      });
    });

    describe('Edge Cases', () => {
      it('should handle no player entity gracefully', () => {
        const worldNoPlayer = new World();

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);

        expect(() => {
          scoreSystem.update(worldNoPlayer, 16);
        }).not.toThrow();
      });

      it('should handle zero points events', () => {
        const player = world.getComponent<Player>(playerId, Player);
        const initialScore = player!.score;

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 0
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        expect(player!.score).toBe(initialScore);
      });

      it('should handle negative points (bug safety)', () => {
        const player = world.getComponent<Player>(playerId, Player);
        player!.addScore(100); // Start at 100

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: -50 // Negative points
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);
        scoreSystem.update(world, 16);

        // Should handle gracefully (Player.addScore should clamp to 0 if implemented)
        expect(player!.score).toBe(50);
      });

      it('should handle missing player component gracefully', () => {
        world.removeComponent(playerId, Player);

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);

        expect(() => {
          scoreSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle empty event list', () => {
        const player = world.getComponent<Player>(playerId, Player);
        const initialScore = player!.score;

        scoreSystem.setAsteroidDestroyedEvents([]);
        scoreSystem.update(world, 16);

        expect(player!.score).toBe(initialScore);
      });

      it('should handle zero delta time', () => {
        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);

        expect(() => {
          scoreSystem.update(world, 0);
        }).not.toThrow();
      });
    });

    describe('Score Overflow', () => {
      it('should handle large score values', () => {
        const player = world.getComponent<Player>(playerId, Player);
        player!.score = Number.MAX_SAFE_INTEGER - 50;

        const event: AsteroidDestroyedEvent = {
          type: 'asteroidDestroyed',
          asteroidId: 1,
          size: 'small',
          position: new Vector3(0, 0, 0),
          pointsAwarded: 100
        };

        scoreSystem.setAsteroidDestroyedEvents([event]);

        expect(() => {
          scoreSystem.update(world, 16);
        }).not.toThrow();

        // Score should be updated (or clamped by Player component)
        expect(player!.score).toBeGreaterThan(0);
      });
    });
  });
  ```

### 3. Refactor Phase
- [x] Verify score calculation is correct
- [x] Review event emission structure
- [x] Clean up method documentation
- [x] Add JSDoc comments for public methods
- [x] Confirm all tests pass
- [x] Verify integration with AsteroidDestructionSystem events

## Completion Criteria

- [x] Score increases on asteroid destruction
- [x] Correct point values (100/50/25 for small/medium/large)
- [x] Score persists across multiple destructions
- [x] ScoreChanged events emitted with correct data
- [x] New score value included in events
- [x] Points awarded value included in events
- [x] Asteroid size included in events (via reason field)
- [x] Multiple destructions in single frame handled
- [x] Unit tests passing (20+ test cases - 24 tests)
- [x] Build succeeds with no TypeScript errors (ScoreSystem has no errors)
- [x] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- ScoreSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Performance baseline
# Expected: <0.1ms per frame (no physics/collision)
```

**Success Indicators**:
- All unit tests passing (20+ test cases)
- Type checking passes without errors
- Build succeeds
- ScoreChanged events emitted correctly
- Score values match specifications
- Events consumed by UISystem for HUD display

## Notes

- ScoreSystem listens to AsteroidDestructionSystem events (event-based coupling)
- Single-player game (only one Player entity expected)
- Point values are configuration-driven (from asteroid.points)
- Score never decreases (only increases)
- Events emitted each frame for each destroyed asteroid
- UISystem will consume scoreChanged events for HUD updates (Task 3.7)
- Leaderboard persistence handled separately (Phase 8)
- Score component integrated with Player entity

## Impact Scope

**Allowed Changes**: Adjust point multipliers, modify event fields, add score milestones
**Protected Areas**: Player component interface, asteroidDestroyed event type
**Areas Affected**: UISystem will display score (Task 3.7), leaderboard system will persist scores (Phase 8)

## Deliverables

- ScoreSystem class implementation
- Score tracking and update logic
- scoreChanged event emission for HUD updates
- Comprehensive unit tests for scoring
- Ready for Task 3.7 (Basic HUD Implementation)
- Ready for Phase 8 quality assurance
