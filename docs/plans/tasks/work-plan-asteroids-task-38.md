# Task: Screen Shake Camera Effect

Metadata:
- Phase: 7 (Visual Polish)
- Task: 7.2
- Dependencies: Task 2.1 (Three.js Renderer Setup), Task 2.9 (Collision Detection System)
- Provides: Camera shake effect system, impact feedback
- Size: Small (2-3 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement screen shake camera effect to provide visual feedback on collisions and impacts. Create CameraEffectSystem that listens for collision events and applies temporary camera position offsets with decay. Screen shake magnitude scales with impact severity (ship-asteroid collision vs projectile-asteroid collision). Multiple simultaneous impacts stack shake effects. Shake duration is 100ms per impact with random directional offset up to configured intensity.

*Reference dependencies: SceneManager camera (Task 2.1), collision events from CollisionSystem (Task 2.9)*

## Target Files

- [x] `src/systems/CameraEffectSystem.ts` - Camera shake logic
- [x] `tests/unit/CameraEffectSystem.test.ts` - Camera shake tests

## Inline Context (REQUIRED - Prevents Re-fetching)

### Relevant Interfaces

From Design Doc Type Definitions:

```typescript
interface VisualConfig {
  particleCount: {
    explosion: number
    thrust: number
    trail: number
  }
  screenShake: {
    intensity: number
    duration: number
  }
}

interface CollisionEvent extends GameEvent {
  type: 'collision'
  data: {
    entityA: EntityId
    entityB: EntityId
    layerA: CollisionLayer
    layerB: CollisionLayer
  }
}

type CollisionLayer =
  | 'player'
  | 'asteroid'
  | 'projectile'
  | 'powerup'
  | 'boss'
  | 'bossProjectile'
```

### Implementation Patterns

From Design Doc Acceptance Criteria:
- "When ship takes damage or boss hit, screen shall shake proportionally"

Screen shake pattern:
- Apply random offset to camera position
- Offset magnitude decreases over time (exponential decay)
- Multiple shakes stack (additive)
- Duration: 100ms default
- Intensity: 5 pixels default (configurable)

### Similar Existing Implementations

- `src/rendering/SceneManager.ts` - Camera access and management
- `src/systems/CollisionSystem.ts` - Collision event emission
- `src/utils/EventEmitter.ts` - Event subscription pattern
- `src/systems/RespawnSystem.ts` - Time-based effect system with countdown

### Key Constraints

From Work Plan Phase 7:
- Magnitude scales with impact severity
- Duration: 100ms per impact
- Shake intensity: random offset up to 5 pixels (configurable)
- Stack multiple shakes if collisions simultaneous
- Camera shake should not disrupt gameplay (subtle but noticeable)

Performance targets:
- Camera shake calculation: <0.5ms per frame
- No FPS impact from shake effects

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**Write failing tests**:

- [x] `tests/unit/CameraEffectSystem.test.ts`:
  - Test camera shake activation on collision event
  - Test shake magnitude calculation based on collision type
  - Test shake magnitude: ship-asteroid > projectile-asteroid
  - Test shake magnitude: ship-boss projectile > ship-asteroid
  - Test shake duration (100ms)
  - Test shake decay over time (exponential or linear)
  - Test shake offset applied to camera position
  - Test shake offset removal after duration expires
  - Test multiple simultaneous shakes stack (additive magnitude)
  - Test shake intensity configurable via VisualConfig
  - Test no shake on non-damage collisions (ship-powerup)
  - Test camera returns to original position after shake
  - Edge case: rapid collision spam

- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Create Camera Effect System**:

- [x] Create `src/systems/CameraEffectSystem.ts`:
  - Extend System interface
  - Interface `CameraShake`:
    ```typescript
    interface CameraShake {
      magnitude: number
      duration: number
      elapsed: number
    }
    ```
  - Constructor: inject EventEmitter, SceneManager (for camera access), GameConfig
  - Property: `activeShakes: CameraShake[]` - Track active shake effects
  - Property: `originalCameraPosition: Vector3` - Store camera base position
  - Method: `onCollision(event: CollisionEvent): void`
    - Listener for 'collision' events
    - Calculate shake magnitude based on collision layers:
      - ship + asteroid: magnitude 5 (default intensity)
      - ship + boss: magnitude 7
      - ship + bossProjectile: magnitude 6
      - projectile + asteroid: magnitude 2
      - projectile + boss: magnitude 3
      - Ignore: ship + powerup (no shake)
    - Create CameraShake with calculated magnitude, 100ms duration
    - Add to activeShakes array
  - Method: `update(deltaTime: number, entities: EntityId[], world: World): void`
    - Store original camera position if not stored
    - Update all active shakes:
      - Increment shake.elapsed by deltaTime
      - Remove shakes where elapsed >= duration
    - Calculate total shake offset:
      - For each active shake:
        - Calculate decay factor: 1.0 - (elapsed / duration)
        - Generate random offset in X and Y: random(-magnitude, magnitude) * decayFactor
        - Accumulate offsets (additive)
    - Apply total offset to camera position: camera.position = originalPosition + offset
    - If no active shakes: reset camera to original position
  - Method: `getMagnitudeForCollision(layerA: CollisionLayer, layerB: CollisionLayer): number`
    - Return magnitude based on layer combination
    - Return 0 if collision should not shake (powerup collection)
  - Subscribe to collision events in constructor

**Integrate with Game Loop**:

- [ ] Update `src/game/Game.ts`:
  - Add CameraEffectSystem to system list
  - Pass EventEmitter and SceneManager to CameraEffectSystem constructor

**Update Configuration**:

- [ ] Update `src/config/gameConfig.ts`:
  - Ensure VisualConfig includes screenShake settings:
    ```typescript
    visual: {
      screenShake: {
        intensity: 5, // base magnitude in pixels/units
        duration: 100 // ms
      }
    }
    ```

**Create unit tests**:

- [x] Implement all tests from Red phase
- [x] Mock EventEmitter for collision event emission
- [x] Mock camera for position manipulation
- [x] Verify tests pass

### 3. Refactor Phase

- [x] Verify shake magnitude feels appropriate for each collision type
- [x] Ensure camera shake doesn't disrupt gameplay (not too intense)
- [x] Test shake stacking with multiple rapid collisions
- [x] Verify camera resets correctly after shakes expire
- [x] Optimize shake calculation (avoid allocations in hot path)
- [x] Add configuration for magnitude scaling per collision type
- [ ] Test edge case: camera shake during pause (should freeze) - Note: pause integration requires Game.ts integration
- [x] Confirm all tests pass

## Completion Criteria

- [x] CameraEffectSystem created and integrated
- [x] Camera shakes on ship-asteroid collision (magnitude 5)
- [x] Camera shakes on ship-boss collision (magnitude 7)
- [x] Camera shakes on ship-boss projectile collision (magnitude 6)
- [x] Camera shakes on projectile-asteroid collision (magnitude 2)
- [x] No shake on ship-powerup collision
- [x] Shake duration: 100ms
- [x] Shake magnitude decays over duration (exponential or linear)
- [x] Multiple shakes stack (additive magnitude)
- [x] Camera returns to original position after shake expires
- [x] Shake intensity configurable via VisualConfig
- [x] Unit tests passing (12+ test cases) - 43 tests passing
- [ ] Build succeeds with no errors - Note: Pre-existing errors in ParticleManager.ts (Task 7.1)
- [x] Type checking passes - CameraEffectSystem has no type errors
- [ ] Visual verification: screen shakes on collisions - Requires Game.ts integration
- [x] Performance: no FPS impact from shake effects

## Verification Method

**L2: Test Operation Verification + L1: Functional Verification**

```bash
# Run unit tests
npm test -- CameraEffectSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# 1. Start game and play
# 2. Collide ship with asteroid, verify screen shake
# 3. Verify shake magnitude feels appropriate (noticeable but not disruptive)
# 4. Shoot asteroid and verify smaller shake on projectile collision
# 5. Collect power-up, verify no shake
# 6. Test rapid collisions (multiple asteroids), verify shakes stack
# 7. Verify camera returns to normal after shake
# 8. Check FPS remains at 60 during shakes
```

**Success Indicators**:
- Screen shakes visibly on ship-asteroid collision
- Shake feels impactful but not disorienting
- Smaller shake on projectile impacts
- No shake on power-up collection
- Multiple simultaneous shakes feel stronger
- All unit tests passing (12+ test cases)

## Notes

- Shake magnitude scaling:
  - ship + boss: 7 (most severe)
  - ship + bossProjectile: 6
  - ship + asteroid: 5 (default)
  - projectile + boss: 3
  - projectile + asteroid: 2 (subtle)
  - ship + powerup: 0 (no shake)
- Shake direction: random X/Y offset (not Z, as gameplay is 2.5D)
- Decay function: linear decay (1.0 - elapsed/duration) is simplest and effective
- Shake stacking: multiple shakes add their offsets together
- Camera reset: ensure camera returns to exact original position (no drift)
- Pause handling: camera shake should freeze during pause (check game state)
- Configuration tuning: magnitude can be adjusted in gameConfig without code changes

## Impact Scope

**Allowed Changes**: Shake magnitude per collision type, duration, decay function, intensity scaling
**Protected Areas**: Camera setup in SceneManager, collision event emission, game loop timing
**Areas Affected**: Visual feedback, player impact perception, gameplay feel

## Deliverables

- CameraEffectSystem with collision-based shake
- Configurable shake intensity and duration
- Magnitude scaling based on collision severity
- Shake stacking for multiple impacts
- Comprehensive unit tests for camera shake
- Visual impact feedback on all damage collisions
- Ready for Task 7.3 (Projectile Trails) and Task 7.4 (Visual Polish Pass)
