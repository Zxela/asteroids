# Task: Type Definitions System

Metadata:
- Phase: 1 (Foundation)
- Dependencies: Task 1.1 (Project Setup)
- Provides: All TypeScript interfaces and type definitions
- Size: Small (4 files)
- Estimated Duration: 1 day

## Implementation Content

Create all TypeScript interfaces and type definitions from Design Doc Type Definitions section. This establishes the data contracts for all components, systems, and game state.

## Target Files

- [x] `src/types/ecs.ts` - Core ECS types
- [x] `src/types/components.ts` - Component interfaces
- [x] `src/types/game.ts` - Game state types
- [x] `src/types/events.ts` - Event types
- [x] `src/types/index.ts` - Central export point

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**No failing tests for type-only task** (types verified by TypeScript compiler)
- [x] Verify no duplicate type names
- [x] Verify no circular type dependencies
- [x] Verify all Design Doc types covered

### 2. Green Phase

**Implement type definitions**:

- [x] Create `src/types/ecs.ts`:
  ```typescript
  export type EntityId = number & { readonly __entityId: unique symbol };
  export interface Component {}
  export interface System {
    update(world: World, deltaTime: number): void;
  }
  ```

- [x] Create `src/types/components.ts` with interfaces:
  - `Transform`: position (Vector3), rotation (Vector3), scale (Vector3)
  - `Velocity`: linear (Vector3), angular (Vector3)
  - `Physics`: mass (number), damping (number), maxSpeed (number), wrapScreen (boolean)
  - `Collider`: shape ('sphere'|'box'), radius (number), layer (string), mask (number)
  - `Health`: current (number), max (number), invulnerabilityTimer (number)
  - `Renderable`: meshType (string), material (string), visible (boolean), meshId (string)
  - `Weapon`: type ('single'|'spread'|'laser'|'homing'), cooldown (number), lastFiredAt (number), energy? (number)
  - `Projectile`: damage (number), owner (EntityId), lifetime (number), homingTarget? (EntityId)
  - `Player`: lives (number), score (number)
  - `Asteroid`: size ('large'|'medium'|'small'), points (number)
  - `Boss`: bossType (string), phase (number), phaseTimer (number), attackPattern (string)
  - `PowerUp`: type ('shield'|'rapidFire'|'multiShot'|'extraLife')
  - `PowerUpEffect`: type (string), expiresAt (number)
  - `ParticleEmitter`: rate (number), lifetime (number)

- [x] Create `src/types/game.ts`:
  ```typescript
  export type GameFlowState = 'loading' | 'mainMenu' | 'playing' | 'paused' | 'gameOver';
  export type GameFlowEvent = 'loadComplete' | 'startGame' | 'pause' | 'resume' | 'playerDied' | 'returnToMenu' | 'restart';

  export interface GameStateData {
    currentWave: number;
    currentScore: number;
    currentLives: number;
    gameFlowState: GameFlowState;
    isPaused: boolean;
  }

  export interface GameSettings {
    sfxVolume: number;
    musicVolume: number;
    enableParticles: boolean;
  }

  export interface LeaderboardEntry {
    name: string;
    score: number;
    wave: number;
    date: number;
  }
  ```

- [x] Create `src/types/events.ts`:
  ```typescript
  export type GameEventType =
    | 'weaponFired'
    | 'asteroidDestroyed'
    | 'powerUpCollected'
    | 'shipThrust'
    | 'shipDamaged'
    | 'playerDied'
    | 'bossDefeated'
    | 'waveComplete'
    | 'scoreChanged';

  export interface GameEvent {
    type: GameEventType;
    entityId?: EntityId;
    data?: Record<string, unknown>;
  }

  export interface CollisionEvent {
    entityA: EntityId;
    entityB: EntityId;
    position: Vector3;
  }
  ```

### 3. Refactor Phase
- [x] Review type definitions for clarity
- [x] Verify all Design Doc requirements are covered
- [x] Check for naming consistency (camelCase for properties)
- [x] Ensure no `any` types
- [x] Document complex types with JSDoc

## Completion Criteria

- [x] All type definitions from Design Doc implemented
- [x] No circular type dependencies detected
- [x] TypeScript strict mode passes (`npm run type-check`) - for types only; pre-existing errors in other files
- [x] All types exportable from `src/types/index.ts`
- [x] No `any` types in type definitions
- [x] All types match Design Doc specifications

## Verification Method

**L3: Build Success Verification**

```bash
# Type checking only (most important)
npm run type-check

# Build verification
npm run build

# Import all types to verify exports
# In a test file:
import * as Types from 'src/types';
// Should compile without errors
```

**Success Indicators**:
- TypeScript strict mode passes
- Build succeeds
- No circular dependency warnings
- All type exports accessible

## Notes

- This task does not require unit tests (types verified by compiler)
- Types are data contracts used by all subsequent components and systems
- Care taken to avoid circular dependencies between type files
- All Component types implement Component interface from Task 1.2
- All type definitions are pure (no implementation)

## Design Decisions

**Type Organization**:
- Core ECS types in `ecs.ts` (EntityId, Component, System)
- Component types in `components.ts` (all component interfaces)
- Game state types in `game.ts` (game-specific types)
- Event types in `events.ts` (event contracts)

**Naming Conventions**:
- Component types: PascalCase (Transform, Velocity, etc.)
- Enum-like string unions: lowercase (size: 'large'|'medium'|'small')
- Properties: camelCase
- Vector types imported from Three.js (Vector2, Vector3)

## Impact Scope

**Allowed Changes**: Type definitions, new component types, new event types
**Protected Areas**: Once types are defined, changes require major refactoring (avoid)
**Areas Affected**: Every system, component, and factory depends on these types

## Deliverables

- All TypeScript interfaces defined
- Type exports accessible
- Ready for Task 1.4 (Configuration) and Task 2.3 (Component Classes)
