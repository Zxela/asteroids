# Task: Utility Implementations (Math, Random, Events)

Metadata:
- Phase: 1 (Foundation)
- Dependencies: Task 1.1 (Project Setup)
- Provides: EventEmitter, math utilities, random generation
- Size: Small (4 files)
- Estimated Duration: 1 day

## Implementation Content

Implement utility functions for math operations, random number generation, and event emission. These are foundational utilities used by all subsequent systems.

## Target Files

- [ ] `src/utils/math.ts` - Vector and math operations
- [ ] `src/utils/random.ts` - Seeded random number generation
- [ ] `src/utils/EventEmitter.ts` - Event subscription and publication
- [ ] `tests/unit/utilities.test.ts` - Unit tests for utilities

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**Write failing unit tests** in `tests/unit/utilities.test.ts`:

**Math utilities**:
- [ ] `normalizeVector2(v)` returns unit vector
- [ ] `normalizeVector2` handles zero vector (returns [0,0])
- [ ] `distance(a, b)` returns correct Euclidean distance
- [ ] `magnitude(v)` returns correct length
- [ ] `angleBetween(a, b)` returns angle in radians
- [ ] `wrapAngle(angle)` wraps to [0, 2π]
- [ ] `clamp(value, min, max)` restricts to range

**Random utilities**:
- [ ] `randomRange(min, max)` returns value in range
- [ ] `randomRange` with seed produces reproducible results
- [ ] `randomInt(min, max)` returns integer in range
- [ ] `randomDirection()` returns normalized Vector2
- [ ] `randomChoice(array)` returns array element
- [ ] Seeded random is reproducible across calls

**Event emitter**:
- [ ] EventEmitter can be instantiated
- [ ] `on(type, handler)` registers listener
- [ ] `emit(type, data)` calls all registered listeners
- [ ] `off(type, handler)` unregisters listener
- [ ] Multiple listeners for same event all called
- [ ] Listeners can unregister during emit
- [ ] Listener receives emitted data

### 2. Green Phase

**Implement minimal code to pass tests**:

- [ ] Create `src/utils/math.ts`:
  ```typescript
  import * as THREE from 'three';

  export function normalizeVector2(v: THREE.Vector2): THREE.Vector2 {
    const copy = v.clone();
    if (copy.length() > 0) {
      copy.normalize();
    }
    return copy;
  }

  export function distance(a: THREE.Vector2 | THREE.Vector3, b: THREE.Vector2 | THREE.Vector3): number {
    return a.distanceTo(b);
  }

  export function magnitude(v: THREE.Vector2 | THREE.Vector3): number {
    return v.length();
  }

  export function angleBetween(a: THREE.Vector2, b: THREE.Vector2): number {
    const angleA = Math.atan2(a.y, a.x);
    const angleB = Math.atan2(b.y, b.x);
    return angleB - angleA;
  }

  export function wrapAngle(angle: number): number {
    return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }

  export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  ```

- [ ] Create `src/utils/random.ts`:
  ```typescript
  import * as THREE from 'three';

  // Seeded random number generator (Mulberry32 algorithm)
  class SeededRandom {
    private seed: number;

    constructor(seed: number) {
      this.seed = seed >>> 0;
    }

    next(): number {
      this.seed |= 0;
      this.seed = (this.seed + 0x6d2b79f5) | 0;
      let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }

  let globalRandom: SeededRandom | null = null;

  export function setSeed(seed: number): void {
    globalRandom = new SeededRandom(seed);
  }

  export function randomRange(min: number, max: number, seed?: number): number {
    const rng = seed !== undefined ? new SeededRandom(seed) : globalRandom || new SeededRandom(Date.now());
    return min + rng.next() * (max - min);
  }

  export function randomInt(min: number, max: number, seed?: number): number {
    return Math.floor(randomRange(min, max + 1, seed));
  }

  export function randomDirection(seed?: number): THREE.Vector2 {
    const angle = randomRange(0, 2 * Math.PI, seed);
    return new THREE.Vector2(Math.cos(angle), Math.sin(angle));
  }

  export function randomChoice<T>(array: T[], seed?: number): T {
    const index = randomInt(0, array.length - 1, seed);
    return array[index];
  }
  ```

- [ ] Create `src/utils/EventEmitter.ts`:
  ```typescript
  export interface EventHandler<T = unknown> {
    (data: T): void;
  }

  export class EventEmitter<Events extends Record<string, unknown> = {}> {
    private listeners: Map<string, Set<EventHandler>> = new Map();

    on<K extends string & keyof Events>(eventType: K, handler: EventHandler<Events[K]>): void {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, new Set());
      }
      this.listeners.get(eventType)!.add(handler as EventHandler);
    }

    off<K extends string & keyof Events>(eventType: K, handler: EventHandler<Events[K]>): void {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.delete(handler as EventHandler);
      }
    }

    emit<K extends string & keyof Events>(eventType: K, data: Events[K]): void {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.forEach((handler) => {
          handler(data);
        });
      }
    }

    clear(eventType?: string): void {
      if (eventType) {
        this.listeners.delete(eventType);
      } else {
        this.listeners.clear();
      }
    }
  }
  ```

- [ ] Export utilities from `src/utils/index.ts`:
  ```typescript
  export * from './math';
  export * from './random';
  export { EventEmitter } from './EventEmitter';
  export type { EventHandler } from './EventEmitter';
  ```

### 3. Refactor Phase
- [ ] Verify math functions handle edge cases (zero vectors, etc.)
- [ ] Ensure random generation doesn't have quality issues
- [ ] Optimize event emitter for performance (hot path)
- [ ] Add JSDoc to all public functions
- [ ] Verify all tests still pass

## Completion Criteria

- [ ] Math utilities handle edge cases (zero vectors, angle wrapping)
- [ ] Random generation works with optional seeding
- [ ] EventEmitter supports subscribe/unsubscribe/publish
- [ ] Unit tests passing for all utilities (3+ test suites)
- [ ] All utilities exported from `src/utils/index.ts`
- [ ] TypeScript strict mode passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run utility tests
npm test -- tests/unit/utilities.test.ts

# Type checking
npm run type-check

# Build verification
npm run build
```

**Success Indicators**:
- All utility tests passing (math, random, event emitter)
- TypeScript strict mode passes
- Build succeeds

## Example Usage (for reference)

After this task completes, subsequent tasks use utilities like:

```typescript
import { EventEmitter, normalizeVector2, randomRange } from 'src/utils';

// Event emission
const emitter = new EventEmitter<{ 'asteroidDestroyed': { size: string } }>();
emitter.on('asteroidDestroyed', (data) => console.log(data.size));
emitter.emit('asteroidDestroyed', { size: 'large' });

// Math utilities
const direction = normalizeVector2(new Vector2(5, 0)); // [1, 0]
const speed = randomRange(50, 200); // Random value between 50-200

// Random direction
const moveDir = randomDirection(); // Random unit vector
```

## Notes

- EventEmitter uses generics for type-safe event emission
- Random generation supports optional seeding for reproducibility
- Math utilities wrap Three.js operations for convenience
- All utilities have no side effects (pure functions)
- Performance-conscious design (utilities called every frame)

## Impact Scope

**Allowed Changes**: Utility function implementations, new utility functions
**Protected Areas**: Public API signatures (breaking change for all systems)
**Areas Affected**: All systems depend on EventEmitter, math, and random utilities

## Deliverables

- Working EventEmitter for game events
- Math utilities for vector and angle operations
- Seeded random number generation
- Ready for Phase 2 tasks
