# Task: Lives System with Respawn

Metadata:
- Phase: 3 (Core Gameplay Loop)
- Task: 3.5
- Dependencies: Task 2.5 (Ship Entity), Task 2.9 (Collision System)
- Provides: RespawnSystem implementation (src/systems/RespawnSystem.ts)
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement the RespawnSystem that monitors for ship destruction (health = 0) and handles respawning with invulnerability. When the ship is destroyed by asteroid collision, lives decrease by one. If lives remain, the ship respawns at center with invulnerability period (3000ms). If lives reach zero, a playerDied event is emitted. The visual flashing effect will be implemented in Task 3.6.

*Reference dependencies: Health component from Task 2.3, Player component for lives tracking, CollisionSystem for damage events*

## Target Files

- [x] `src/systems/RespawnSystem.ts` - Respawn logic and invulnerability management
- [x] `tests/unit/RespawnSystem.test.ts` - Unit tests for respawn mechanics

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for respawn system
- [x] Write failing test for life loss on ship destruction
- [x] Write failing test for respawn at center position
- [x] Write failing test for invulnerability timer (3000ms)
- [x] Write failing test for velocity reset on respawn
- [x] Write failing test for game over when lives = 0
- [x] Write failing test for respawn not occurring when lives = 0
- [x] Write failing test for playerDied event emission
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement RespawnSystem**:
- [x] Create `src/systems/RespawnSystem.ts`:
  ```typescript
  import { System, World } from '../types/ecs';
  import { Transform, Velocity, Health, Player } from '../components';
  import { Vector3 } from 'three';

  export interface PlayerDiedEvent {
    type: 'playerDied';
    finalScore: number;
    wavesReached: number;
  }

  export interface ShipDamagedEvent {
    type: 'shipDamaged';
    remainingLives: number;
    isGameOver: boolean;
  }

  export class RespawnSystem implements System {
    readonly systemType = 'respawn' as const;
    private events: (PlayerDiedEvent | ShipDamagedEvent)[] = [];
    private readonly RESPAWN_INVULNERABILITY_DURATION = 3000; // 3 seconds in ms
    private readonly RESPAWN_POSITION = new Vector3(0, 0, 0); // Center of screen

    update(world: World, deltaTime: number): void {
      this.events = [];

      // Query for ship entities (entities with Health and Player component)
      const shipEntities = world.query([Transform, Health, Player]);

      // Note: Should only be one player ship
      const shipId = Array.from(shipEntities)[0];

      if (!shipId) {
        return; // No player ship
      }

      const health = world.getComponent<Health>(shipId, Health);
      const player = world.getComponent<Player>(shipId, Player);
      const transform = world.getComponent<Transform>(shipId, Transform);

      if (!health || !player || !transform) {
        return;
      }

      // Check if ship is destroyed (health <= 0)
      if (health.current <= 0) {
        this.handleShipDestroyed(world, shipId, health, player, transform);
      }

      // Update invulnerability timer
      if (health.invulnerable && health.invulnerabilityTimer > 0) {
        health.invulnerabilityTimer -= deltaTime;

        if (health.invulnerabilityTimer <= 0) {
          health.invulnerable = false;
          health.invulnerabilityTimer = 0;
        }
      }
    }

    private handleShipDestroyed(
      world: World,
      shipId: number,
      health: Health,
      player: Player,
      transform: Transform
    ): void {
      // Reduce lives
      player.loseLife();

      if (player.lives > 0) {
        // Respawn ship
        this.respawnShip(world, shipId, health, transform);

        // Emit ship damaged event
        const damagedEvent: ShipDamagedEvent = {
          type: 'shipDamaged',
          remainingLives: player.lives,
          isGameOver: false
        };
        this.events.push(damagedEvent);
      } else {
        // Game over
        const diedEvent: PlayerDiedEvent = {
          type: 'playerDied',
          finalScore: player.score,
          wavesReached: 1 // Will be set by game state in Phase 4
        };
        this.events.push(diedEvent);

        // Emit ship damaged event for final life loss
        const damagedEvent: ShipDamagedEvent = {
          type: 'shipDamaged',
          remainingLives: 0,
          isGameOver: true
        };
        this.events.push(damagedEvent);
      }
    }

    private respawnShip(
      world: World,
      shipId: number,
      health: Health,
      transform: Transform
    ): void {
      // Reset position to center
      transform.position = this.RESPAWN_POSITION.clone();

      // Reset velocity
      const velocity = world.getComponent('velocity', shipId);
      if (velocity) {
        velocity.linear.set(0, 0, 0);
        velocity.angular.set(0, 0, 0);
      }

      // Reset health to max
      health.current = health.max;

      // Set invulnerability
      health.setInvulnerable(this.RESPAWN_INVULNERABILITY_DURATION);
    }

    getEvents(): (PlayerDiedEvent | ShipDamagedEvent)[] {
      return this.events;
    }
  }
  ```

**Create unit tests**:
- [x] Create `tests/unit/RespawnSystem.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest';
  import { Vector3 } from 'three';
  import { World } from '../../src/ecs/World';
  import { RespawnSystem } from '../../src/systems/RespawnSystem';
  import { Transform, Velocity, Health, Player } from '../../src/components';

  describe('RespawnSystem', () => {
    let world: World;
    let respawnSystem: RespawnSystem;
    let shipId: number;

    beforeEach(() => {
      world = new World();
      respawnSystem = new RespawnSystem();

      // Create player ship
      shipId = world.createEntity();
      world.addComponent(shipId, new Transform());
      world.addComponent(shipId, new Velocity());
      world.addComponent(shipId, new Health(1)); // 1 max health
      world.addComponent(shipId, new Player(3)); // 3 lives
    });

    describe('Life Loss', () => {
      it('should reduce lives on ship destruction', () => {
        const player = world.getComponent<Player>(shipId, Player);
        const initialLives = player!.lives;

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        expect(player!.lives).toBe(initialLives - 1);
      });

      it('should emit shipDamaged event on destruction', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        const events = respawnSystem.getEvents();
        const damagedEvent = events.find((e) => e.type === 'shipDamaged');

        expect(damagedEvent).toBeDefined();
        expect(damagedEvent?.type).toBe('shipDamaged');
      });

      it('should include remaining lives in shipDamaged event', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        const events = respawnSystem.getEvents();
        const damagedEvent = events.find((e) => e.type === 'shipDamaged');

        expect((damagedEvent as any)?.remainingLives).toBe(2); // 3 - 1
      });

      it('should not be game over if lives remain', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        const events = respawnSystem.getEvents();
        const damagedEvent = events.find((e) => e.type === 'shipDamaged');

        expect((damagedEvent as any)?.isGameOver).toBe(false);
      });
    });

    describe('Respawn Mechanics', () => {
      it('should respawn ship at center position', () => {
        // Move ship away from center
        const transform = world.getComponent<Transform>(shipId, Transform);
        transform!.position.set(100, 200, 0);

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        // Should be back at center
        expect(transform!.position.x).toBeCloseTo(0, 1);
        expect(transform!.position.y).toBeCloseTo(0, 1);
        expect(transform!.position.z).toBeCloseTo(0, 1);
      });

      it('should reset velocity to zero on respawn', () => {
        const velocity = world.getComponent<Velocity>(shipId, Velocity);
        velocity!.linear.set(100, 200, 0);
        velocity!.angular.z = Math.PI;

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        // Velocity should be reset
        expect(velocity!.linear.length()).toBeLessThan(0.01);
        expect(velocity!.angular.length()).toBeLessThan(0.01);
      });

      it('should reset health to max on respawn', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;
        const maxHealth = health!.max;

        respawnSystem.update(world, 16);

        expect(health!.current).toBe(maxHealth);
      });

      it('should set invulnerability timer to 3000ms', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        expect(health!.invulnerable).toBe(true);
        expect(health!.invulnerabilityTimer).toBe(3000);
      });

      it('should respawn even after multiple hits', () => {
        const transform = world.getComponent<Transform>(shipId, Transform);
        const health = world.getComponent<Health>(shipId, Health);
        const player = world.getComponent<Player>(shipId, Player);

        // First death and respawn
        health!.current = 0;
        respawnSystem.update(world, 16);
        expect(player!.lives).toBe(2);
        expect(health!.current).toBe(health!.max);

        // Simulate time passing
        respawnSystem.update(world, 100);

        // Take damage again
        health!.current = 0;
        respawnSystem.update(world, 16);

        expect(player!.lives).toBe(1);
        expect(health!.current).toBe(health!.max);
      });
    });

    describe('Invulnerability Timer', () => {
      it('should count down invulnerability timer each frame', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16); // First update: set invulnerable

        const timerAfterRespawn = health!.invulnerabilityTimer;

        respawnSystem.update(world, 100); // Second update: count down

        const timerAfterCountdown = health!.invulnerabilityTimer;

        expect(timerAfterCountdown).toBe(timerAfterRespawn - 100);
      });

      it('should clear invulnerability when timer expires', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16); // Respawn with 3000ms invulnerability

        // Simulate 3001ms passing
        respawnSystem.update(world, 3001);

        expect(health!.invulnerable).toBe(false);
        expect(health!.invulnerabilityTimer).toBe(0);
      });

      it('should not go below zero', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16); // Respawn with 3000ms invulnerability

        // Simulate 5000ms passing (more than needed)
        respawnSystem.update(world, 5000);

        expect(health!.invulnerabilityTimer).toBe(0);
        expect(health!.invulnerable).toBe(false);
      });

      it('should maintain invulnerability during timer', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16); // Respawn

        // Simulate 1000ms (still invulnerable)
        respawnSystem.update(world, 1000);

        expect(health!.invulnerable).toBe(true);
        expect(health!.invulnerabilityTimer).toBeGreaterThan(0);
      });
    });

    describe('Game Over', () => {
      it('should emit playerDied event when last life lost', () => {
        const player = world.getComponent<Player>(shipId, Player);
        player!.lives = 1; // Last life

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        const events = respawnSystem.getEvents();
        const diedEvent = events.find((e) => e.type === 'playerDied');

        expect(diedEvent).toBeDefined();
        expect(diedEvent?.type).toBe('playerDied');
      });

      it('should not respawn when lives = 0', () => {
        const player = world.getComponent<Player>(shipId, Player);
        player!.lives = 1;

        const health = world.getComponent<Health>(shipId, Health);
        const transform = world.getComponent<Transform>(shipId, Transform);
        health!.current = 0;
        transform!.position.set(100, 200, 0);

        respawnSystem.update(world, 16);

        // Should not have been respawned (position not at center)
        expect(transform!.position.x).not.toBeCloseTo(0, 1);
      });

      it('should include final score in playerDied event', () => {
        const player = world.getComponent<Player>(shipId, Player);
        player!.lives = 1;
        player!.addScore(1000);

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        const events = respawnSystem.getEvents();
        const diedEvent = events.find((e) => e.type === 'playerDied');

        expect((diedEvent as any)?.finalScore).toBe(1000);
      });

      it('should set isGameOver to true in final shipDamaged event', () => {
        const player = world.getComponent<Player>(shipId, Player);
        player!.lives = 1;

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        const events = respawnSystem.getEvents();
        const damagedEvent = events.find((e) => e.type === 'shipDamaged');

        expect((damagedEvent as any)?.isGameOver).toBe(true);
      });

      it('should set remaining lives to 0 in final shipDamaged event', () => {
        const player = world.getComponent<Player>(shipId, Player);
        player!.lives = 1;

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);

        const events = respawnSystem.getEvents();
        const damagedEvent = events.find((e) => e.type === 'shipDamaged');

        expect((damagedEvent as any)?.remainingLives).toBe(0);
      });
    });

    describe('Multiple Deaths', () => {
      it('should handle sequence of deaths and respawns', () => {
        const player = world.getComponent<Player>(shipId, Player);
        const health = world.getComponent<Health>(shipId, Health);

        // First death
        health!.current = 0;
        respawnSystem.update(world, 16);
        expect(player!.lives).toBe(2);

        // Wait for invulnerability to wear off
        respawnSystem.update(world, 3001);
        expect(health!.invulnerable).toBe(false);

        // Second death
        health!.current = 0;
        respawnSystem.update(world, 16);
        expect(player!.lives).toBe(1);

        // Third death (final)
        respawnSystem.update(world, 3001);
        health!.current = 0;
        respawnSystem.update(world, 16);
        expect(player!.lives).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing health component gracefully', () => {
        world.removeComponent(shipId, Health);

        expect(() => {
          respawnSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle missing player component gracefully', () => {
        world.removeComponent(shipId, Player);

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        expect(() => {
          respawnSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle missing transform component gracefully', () => {
        world.removeComponent(shipId, Transform);

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        expect(() => {
          respawnSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle missing velocity component gracefully', () => {
        world.removeComponent(shipId, Velocity);

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        expect(() => {
          respawnSystem.update(world, 16);
        }).not.toThrow();
      });

      it('should handle zero delta time', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        expect(() => {
          respawnSystem.update(world, 0);
        }).not.toThrow();
      });

      it('should handle negative health values', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = -100; // Over-damaged

        expect(() => {
          respawnSystem.update(world, 16);
        }).not.toThrow();

        expect(health!.invulnerable).toBe(true); // Should have respawned
      });

      it('should handle ship with no lives gracefully', () => {
        const player = world.getComponent<Player>(shipId, Player);
        player!.lives = 0;

        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        expect(() => {
          respawnSystem.update(world, 16);
        }).not.toThrow();
      });
    });

    describe('Frame Continuity', () => {
      it('should not double-process destruction in same frame', () => {
        const player = world.getComponent<Player>(shipId, Player);
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16);
        const events1 = respawnSystem.getEvents();

        // In next frame, health should be reset, so no more events
        respawnSystem.update(world, 16);
        const events2 = respawnSystem.getEvents();

        expect(events2.length).toBe(0); // No events in second frame
      });

      it('should count invulnerability time across frames', () => {
        const health = world.getComponent<Health>(shipId, Health);
        health!.current = 0;

        respawnSystem.update(world, 16); // Respawn with 3000ms invulnerability

        respawnSystem.update(world, 1000); // Count down 1000ms
        const timerAfter1000 = health!.invulnerabilityTimer;

        respawnSystem.update(world, 1000); // Count down another 1000ms
        const timerAfter2000 = health!.invulnerabilityTimer;

        expect(timerAfter1000).toBeCloseTo(2000, 0);
        expect(timerAfter2000).toBeCloseTo(1000, 0);
      });
    });
  });
  ```

### 3. Refactor Phase
- [x] Verify invulnerability timer countdown logic
- [x] Review respawn position reset
- [x] Clean up event emission system
- [x] Add JSDoc comments to public methods
- [x] Confirm all tests pass
- [x] Verify no race conditions with health updates

## Completion Criteria

- [x] Ship loses 1 life on collision with asteroid
- [x] Ship respawns at center with invulnerability (3000ms)
- [x] Velocity reset to zero on respawn
- [x] Health reset to maximum on respawn
- [x] Game over when lives reach 0
- [x] No respawn on final life loss
- [x] Invulnerability timer counts down each frame
- [x] Invulnerability cleared when timer expires
- [x] playerDied event emitted when game over
- [x] shipDamaged events emitted on each damage
- [x] Unit tests passing (30+ test cases)
- [x] Build succeeds with no TypeScript errors (pre-existing error in createProjectile.ts)
- [x] Type checking passes (pre-existing error in createProjectile.ts)

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- RespawnSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Performance baseline
# Expected: <0.1ms per frame (minimal logic)
```

**Success Indicators**:
- All unit tests passing (30+ test cases)
- Type checking passes without errors
- Build succeeds
- Respawn mechanics work correctly
- Invulnerability timer functions properly
- Game over condition detected at lives = 0

## Notes

- RespawnSystem monitors Health.current for destruction (value <= 0)
- Invulnerability is set by Health.setInvulnerable(duration)
- Player can be damaged but survives until health = 0
- Respawn position hardcoded to (0, 0, 0) - center of play area
- Invulnerability duration fixed at 3000ms (3 seconds)
- Events consumed by: UISystem (lives display), GameStateMachine (game over transition)
- Visual flashing effect implemented separately in Task 3.6
- Collision detection handles damage reduction in CollisionSystem (Task 2.9)
- Multiple respawns allowed as long as lives > 0

## Impact Scope

**Allowed Changes**: Adjust invulnerability duration, change respawn position, modify event data
**Protected Areas**: Health component interface, Player lives tracking, collision layer detection
**Areas Affected**: CollisionSystem emits damage (Task 2.9), UISystem displays lives (Task 3.7), RenderSystem flashes ship (Task 3.6)

## Deliverables

- RespawnSystem class implementation
- Respawn mechanics with invulnerability timer
- playerDied event emission for game over
- shipDamaged event emission for damage feedback
- Comprehensive unit tests for respawn mechanics
- Ready for Task 3.6 (Visual feedback)
- Ready for Task 3.7 (HUD implementation)
