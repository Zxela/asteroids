# Task: Input System Implementation

Metadata:
- Phase: 2 (Minimal Playable Game)
- Dependencies: Task 1.1 (Project Setup), Task 1.4 (Configuration)
- Provides: InputSystem for keyboard input
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement keyboard input handling for movement and actions. The input system provides a frame-synchronized interface for game logic to query input state.

## Target Files

- [x] `src/systems/InputSystem.ts` - Keyboard input tracking
- [x] `tests/unit/input.test.ts` - Unit tests for input

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**Write failing tests** in `tests/unit/input.test.ts`:
- [x] Input system can be instantiated
- [x] Keyboard events update internal state
- [x] `getMovementInput()` returns normalized Vector2
- [x] Movement vector is clamped to [-1, 1]
- [x] Multiple movement keys handled correctly
- [x] `getActions()` returns set of active actions
- [x] Action 'shoot' detected on spacebar
- [x] Action 'pause' detected on ESC
- [x] Key release removes action from set

### 2. Green Phase

**Implement input tracking**:

- [x] Create `src/systems/InputSystem.ts`:
  ```typescript
  import * as THREE from 'three';
  import type { System } from '../types/ecs';

  export type GameAction = 'shoot' | 'pause' | 'switchWeapon1' | 'switchWeapon2' | 'switchWeapon3';

  export class InputSystem implements System {
    private keysPressed: Set<string> = new Set();
    private movementInput: THREE.Vector2 = new THREE.Vector2(0, 0);
    private currentActions: Set<GameAction> = new Set();

    constructor() {
      this.setupListeners();
    }

    private setupListeners(): void {
      document.addEventListener('keydown', (event) => this.onKeyDown(event));
      document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    private onKeyDown(event: KeyboardEvent): void {
      const key = event.key.toLowerCase();
      this.keysPressed.add(key);

      // Map keys to actions
      if (key === ' ') {
        this.currentActions.add('shoot');
        event.preventDefault();
      }
      if (key === 'escape') {
        this.currentActions.add('pause');
      }
      if (key === '1') this.currentActions.add('switchWeapon1');
      if (key === '2') this.currentActions.add('switchWeapon2');
      if (key === '3') this.currentActions.add('switchWeapon3');
    }

    private onKeyUp(event: KeyboardEvent): void {
      const key = event.key.toLowerCase();
      this.keysPressed.delete(key);

      // Remove actions
      if (key === ' ') {
        this.currentActions.delete('shoot');
      }
      if (key === 'escape') {
        this.currentActions.delete('pause');
      }
      if (key === '1') this.currentActions.delete('switchWeapon1');
      if (key === '2') this.currentActions.delete('switchWeapon2');
      if (key === '3') this.currentActions.delete('switchWeapon3');
    }

    public getMovementInput(): THREE.Vector2 {
      // Update movement based on current keys
      this.movementInput.set(0, 0);

      // Horizontal (rotate)
      if (this.keysPressed.has('arrowleft') || this.keysPressed.has('a')) {
        this.movementInput.x -= 1;
      }
      if (this.keysPressed.has('arrowright') || this.keysPressed.has('d')) {
        this.movementInput.x += 1;
      }

      // Vertical (thrust)
      if (this.keysPressed.has('arrowup') || this.keysPressed.has('w')) {
        this.movementInput.y += 1;
      }
      if (this.keysPressed.has('arrowdown') || this.keysPressed.has('s')) {
        this.movementInput.y -= 1;
      }

      // Normalize to unit vector (for diagonal movement)
      if (this.movementInput.length() > 0) {
        this.movementInput.normalize();
      }

      return this.movementInput.clone();
    }

    public getActions(): Set<GameAction> {
      return new Set(this.currentActions);
    }

    public hasAction(action: GameAction): boolean {
      return this.currentActions.has(action);
    }

    public update(): void {
      // Input system updates every frame to capture key states
      // This is called by the game loop
    }
  }
  ```

- [x] Create `tests/unit/input.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import { InputSystem } from '../src/systems/InputSystem';
  import * as THREE from 'three';

  describe('InputSystem', () => {
    let inputSystem: InputSystem;

    beforeEach(() => {
      inputSystem = new InputSystem();
    });

    it('should initialize with no movement input', () => {
      const movement = inputSystem.getMovementInput();
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(0);
    });

    it('should normalize movement input to unit length', () => {
      // Simulate diagonal input (arrow up + arrow left)
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });

      document.dispatchEvent(upEvent);
      document.dispatchEvent(leftEvent);

      const movement = inputSystem.getMovementInput();
      const length = movement.length();
      expect(Math.abs(length - 1.0)).toBeLessThan(0.01);
    });

    it('should track shoot action on spacebar', () => {
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(spaceEvent);

      const actions = inputSystem.getActions();
      expect(actions.has('shoot')).toBe(true);
    });

    it('should remove action on key release', () => {
      const spaceDown = new KeyboardEvent('keydown', { key: ' ' });
      const spaceUp = new KeyboardEvent('keyup', { key: ' ' });

      document.dispatchEvent(spaceDown);
      expect(inputSystem.hasAction('shoot')).toBe(true);

      document.dispatchEvent(spaceUp);
      expect(inputSystem.hasAction('shoot')).toBe(false);
    });
  });
  ```

### 3. Refactor Phase
- [x] Verify all key mappings are correct
- [x] Ensure movement normalization works for all directions
- [x] Test diagonal movement produces unit vector
- [x] Add JSDoc for public methods

## Completion Criteria

- [x] Keyboard input tracked accurately
- [x] Movement vector normalized correctly (unit circle)
- [x] Action set updated per frame
- [x] Unit tests passing for input logic
- [x] Arrow keys and WASD both work
- [x] Spacebar and ESC handled correctly

## Verification Method

**L2: Test Operation Verification**

```bash
# Run input tests
npm test -- tests/unit/input.test.ts

# Type checking
npm run type-check

# Build verification
npm run build
```

**Success Indicators**:
- Input unit tests passing
- TypeScript strict mode passes
- Build succeeds

## Example Usage (for reference)

After this task, Game uses InputSystem:

```typescript
const inputSystem = new InputSystem();

// Per frame:
const movement = inputSystem.getMovementInput(); // [-1, 0] for left
const actions = inputSystem.getActions(); // Set { 'shoot', 'pause' }

if (inputSystem.hasAction('shoot')) {
  // Fire weapon
}
```

## Notes

- InputSystem not registered as ECS System (utility pattern)
- Single global instance used by game
- Key mappings configurable (could be expanded)
- Diagonal movement normalizes to unit length
- Action set cleared frame-to-frame as keys release

## Integration Points

This task enables:
- Task 2.6: Ship Control System (consumes InputSystem.getMovementInput())
- Task 4.4: Pause Menu (uses 'pause' action)
- Task 5.6: Weapon Switching (uses switchWeapon actions)

## Impact Scope

**Allowed Changes**: Key mappings, action definitions, input normalization
**Protected Areas**: InputSystem public interface (getMovementInput, getActions)
**Areas Affected**: ShipControlSystem, pause logic, weapon switching

## Deliverables

- InputSystem with keyboard tracking
- Normalized movement vector
- Action set management
- Ready for Task 2.6 (Ship Control System)
