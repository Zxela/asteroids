# Task: Component Definitions

Metadata:
- Phase: 2 (Minimal Playable Game)
- Task: 2.3
- Dependencies: Task 1.3 (Type Definitions)
- Provides: Component class implementations, src/components/index.ts exports
- Size: Small (7 files)
- Estimated Duration: 1 day

## Implementation Content

Implement component classes for Transform, Velocity, Physics, Collider, Renderable, Health, and Player. Components are pure data containers (no logic) that hold entity state in the ECS architecture.

## Target Files

- [x] `src/components/Transform.ts` - Position, rotation, scale using Three.js Vector3
- [x] `src/components/Velocity.ts` - Linear and angular velocity vectors
- [x] `src/components/Physics.ts` - Mass, damping, maxSpeed, wrapScreen flags
- [x] `src/components/Collider.ts` - Shape, radius/size, collision layer and mask
- [x] `src/components/Renderable.ts` - Mesh type, material, visibility, Three.js sync ID
- [x] `src/components/Health.ts` - Current/max health, invulnerability timer
- [x] `src/components/Player.ts` - Lives and score tracking
- [x] `src/components/index.ts` - Component exports

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for component structure validation
- [x] Verify each component implements Component interface from types
- [x] Test component instantiation and property access
- [x] Verify no circular dependencies between components

### 2. Green Phase

**Implement Transform component**:
- [x] Create `src/components/Transform.ts`:
  ```typescript
  import { Vector3 } from 'three';
  import { Component } from '../types/ecs';

  export class Transform implements Component {
    readonly componentType = 'transform' as const;
    position: Vector3;
    rotation: Vector3; // Euler angles in radians
    scale: Vector3;

    constructor(
      position = new Vector3(0, 0, 0),
      rotation = new Vector3(0, 0, 0),
      scale = new Vector3(1, 1, 1)
    ) {
      this.position = position;
      this.rotation = rotation;
      this.scale = scale;
    }
  }
  ```

**Implement Velocity component**:
- [x] Create `src/components/Velocity.ts`:
  ```typescript
  import { Vector3 } from 'three';
  import { Component } from '../types/ecs';

  export class Velocity implements Component {
    readonly componentType = 'velocity' as const;
    linear: Vector3;      // Linear velocity (units/second)
    angular: Vector3;     // Angular velocity (radians/second)

    constructor(
      linear = new Vector3(0, 0, 0),
      angular = new Vector3(0, 0, 0)
    ) {
      this.linear = linear;
      this.angular = angular;
    }
  }
  ```

**Implement Physics component**:
- [x] Create `src/components/Physics.ts`:
  ```typescript
  import { Component } from '../types/ecs';

  export class Physics implements Component {
    readonly componentType = 'physics' as const;
    mass: number;
    damping: number;
    maxSpeed: number;
    wrapScreen: boolean;
    enabled: boolean;

    constructor(
      mass = 1,
      damping = 0.99,
      maxSpeed = 300,
      wrapScreen = false
    ) {
      this.mass = mass;
      this.damping = damping;
      this.maxSpeed = maxSpeed;
      this.wrapScreen = wrapScreen;
      this.enabled = true;
    }
  }
  ```

**Implement Collider component**:
- [x] Create `src/components/Collider.ts`:
  ```typescript
  import { Component } from '../types/ecs';

  export type CollisionShape = 'sphere' | 'box' | 'capsule';

  export class Collider implements Component {
    readonly componentType = 'collider' as const;
    shape: CollisionShape;
    radius: number; // For sphere shapes
    size?: { width: number; height: number; depth: number }; // For box shapes
    layer: string; // e.g., "player", "asteroid", "projectile"
    mask: Set<string>; // Collision layers this collides with
    enabled: boolean;

    constructor(
      shape: CollisionShape = 'sphere',
      radius = 1,
      layer = 'default',
      mask: string[] = []
    ) {
      this.shape = shape;
      this.radius = radius;
      this.layer = layer;
      this.mask = new Set(mask);
      this.enabled = true;
    }
  }
  ```

**Implement Renderable component**:
- [x] Create `src/components/Renderable.ts`:
  ```typescript
  import { Component } from '../types/ecs';

  export type MeshType =
    | 'ship'
    | 'asteroid_large'
    | 'asteroid_medium'
    | 'asteroid_small'
    | 'projectile'
    | 'boss_destroyer'
    | 'boss_carrier'
    | 'powerup_shield'
    | 'powerup_rapidFire'
    | 'powerup_multiShot'
    | 'powerup_extraLife';

  export type MaterialType = 'standard' | 'transparent' | 'emissive';

  export class Renderable implements Component {
    readonly componentType = 'renderable' as const;
    meshType: MeshType;
    material: MaterialType;
    visible: boolean;
    threeJsId: string; // UUID for syncing with Three.js Object3D

    constructor(
      meshType: MeshType,
      material: MaterialType = 'standard'
    ) {
      this.meshType = meshType;
      this.material = material;
      this.visible = true;
      this.threeJsId = '';
    }
  }
  ```

**Implement Health component**:
- [x] Create `src/components/Health.ts`:
  ```typescript
  import { Component } from '../types/ecs';

  export class Health implements Component {
    readonly componentType = 'health' as const;
    current: number;
    max: number;
    invulnerable: boolean;
    invulnerabilityTimer: number; // Milliseconds remaining

    constructor(max = 1, current?: number) {
      this.max = max;
      this.current = current ?? max;
      this.invulnerable = false;
      this.invulnerabilityTimer = 0;
    }

    takeDamage(amount: number): void {
      if (!this.invulnerable) {
        this.current = Math.max(0, this.current - amount);
      }
    }

    setInvulnerable(duration: number): void {
      this.invulnerable = true;
      this.invulnerabilityTimer = duration;
    }
  }
  ```

**Implement Player component**:
- [x] Create `src/components/Player.ts`:
  ```typescript
  import { Component } from '../types/ecs';

  export class Player implements Component {
    readonly componentType = 'player' as const;
    lives: number;
    score: number;
    playerName: string;

    constructor(lives = 3) {
      this.lives = lives;
      this.score = 0;
      this.playerName = '';
    }

    addScore(points: number): void {
      this.score += points;
    }

    loseLife(): void {
      this.lives = Math.max(0, this.lives - 1);
    }
  }
  ```

**Export components**:
- [x] Create `src/components/index.ts`:
  ```typescript
  export { Transform } from './Transform';
  export { Velocity } from './Velocity';
  export { Physics } from './Physics';
  export { Collider, type CollisionShape } from './Collider';
  export { Renderable, type MeshType, type MaterialType } from './Renderable';
  export { Health } from './Health';
  export { Player } from './Player';
  ```

### 3. Refactor Phase
- [x] Verify all components are pure data (no logic except helpers)
- [x] Ensure consistent naming and structure across all components
- [x] Add JSDoc comments for complex properties
- [x] Verify no hardcoded values (use config where applicable)
- [x] Confirm all components implement Component interface

## Completion Criteria

- [x] All component classes implement Component interface
- [x] Components are pure data (no logic except trivial getters/setters)
- [x] Type safety enforced (strict TypeScript)
- [x] Components exportable from src/components/index.ts
- [x] All properties initialized in constructors
- [x] No circular dependencies between components
- [x] Unit tests passing for component instantiation
- [x] Build succeeds with no TypeScript errors

## Verification Method

**L3: Build Success Verification**

```bash
# Type checking
npm run type-check

# Build verification
npm run build

# Component import test (manual verification)
# In a test file or console:
import { Transform, Velocity, Physics, Collider, Renderable, Health, Player } from 'src/components';
const transform = new Transform();
const velocity = new Velocity();
const physics = new Physics();
console.log(transform.componentType); // Should be 'transform'
```

**Success Indicators**:
- Build succeeds with no errors
- TypeScript strict mode passes
- All components importable
- Component types correct
- No console warnings

## Notes

- Components are pure data containers (no game logic)
- All numeric values use constructor defaults (configurable)
- Component types are discriminated by `componentType` property
- Health component includes damage helper method
- Player component includes score and life helpers
- Renderable component tracks Three.js UUID for sync
- Collider layer/mask use strings for flexibility

## Impact Scope

**Allowed Changes**: Add new component properties, add helper methods to components
**Protected Areas**: Component interface compliance, componentType discrimination
**Areas Affected**: All systems that query or modify components (Physics, Render, Collision systems)

## Deliverables

- Component class implementations
- Type-safe component definitions
- Ready for Task 2.4 (Physics System)
- Ready for Task 2.5 (Ship Entity)
- Ready for Task 2.7 (Render System)
