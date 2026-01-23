# Task: Particle System - Explosions and Effects

Metadata:
- Phase: 7 (Visual Polish)
- Task: 7.1
- Dependencies: Task 2.7 (Render System and Mesh Factory), Task 3.3 (Projectile-Asteroid Collision and Destruction)
- Provides: Particle rendering system, explosion effects, thrust trail effects
- Size: Medium (4-5 files)
- Estimated Duration: 1 day

## Implementation Content

Implement a pooled particle system for visual effects including explosions on entity destruction and thrust trail particles. Create ParticleManager for particle lifecycle management, ParticleEmitterSystem for spawning particles on game events, and ParticleRenderSystem for rendering particles with billboarding and fade-out effects. Particles are pooled to minimize allocations (500 initial pool size).

*Reference dependencies: RenderSystem (Task 2.7), collision events from CollisionSystem (Task 2.9), asteroid destruction events (Task 3.3)*

## Target Files

- [x] `src/rendering/ParticleManager.ts` - Particle pool management and data structures
- [x] `src/systems/ParticleEmitterSystem.ts` - Particle spawning logic on events
- [x] `src/systems/ParticleRenderSystem.ts` - Particle rendering with Three.js
- [x] `src/components/ParticleEmitter.ts` - ParticleEmitter component (if not exists)
- [x] `tests/unit/ParticleManager.test.ts` - Particle pool tests
- [x] `tests/unit/ParticleEmitterSystem.test.ts` - Emitter logic tests

## Inline Context (REQUIRED - Prevents Re-fetching)

### Relevant Interfaces

From Design Doc Type Definitions:

```typescript
interface ParticleEmitterComponent extends Component {
  type: 'particleEmitter'
  emitterType: ParticleEmitterType
  active: boolean
  rate: number
  lifetime: number
}

type ParticleEmitterType = 'thrust' | 'explosion' | 'trail' | 'shield'

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
```

### Implementation Patterns

From Design Doc Acceptance Criteria:
- "When entity destroyed, particle explosion shall play for 0.5-2 seconds (size-dependent)"
- "Property: particleDuration >= 500 && particleDuration <= 2000 (ms)"
- "While ship thrusting, flame particles shall emit from rear"

Particle pool pattern:
- Pre-allocate 500 particles in pool
- Reuse inactive particles instead of creating new
- Each particle has: position, velocity, lifetime, color, size, active state

### Similar Existing Implementations

- `src/rendering/MeshFactory.ts` - Object pooling pattern for meshes
- `src/entities/createProjectile.ts` - Entity with lifetime tracking
- `src/systems/RenderSystem.ts` - Three.js scene synchronization pattern
- `src/components/Lifetime.ts` - Lifetime component pattern

### Key Constraints

From Work Plan Phase 7:
- Object pooling reduces allocations by 80%+
- Particles fade over lifetime (alpha/opacity reduction)
- Explosion particle count: 20-50 radially
- Explosion duration based on entity size: large 2s, medium 1.5s, small 0.5s
- Thrust particles: 50 particles/second emission rate
- Thrust particle speed: 100-50 units/s fade
- Billboarding required (particles always face camera)

Performance targets:
- Pool management: <1ms per frame
- Particle rendering: maintain 60 FPS with 500 active particles
- Draw call optimization: batch particles into instanced meshes

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**Write failing tests**:

- [x] `tests/unit/ParticleManager.test.ts`:
  - Test particle pool initialization (500 particles)
  - Test particle acquisition from pool (get inactive particle)
  - Test particle return to pool (mark inactive)
  - Test pool expansion when exhausted (optional)
  - Test particle data structure (position, velocity, lifetime, color, size, active)
  - Test particle lifecycle (spawn -> update -> despawn)
  - Test pool reuse (same particle reused after despawn)

- [x] `tests/unit/ParticleEmitterSystem.test.ts`:
  - Test explosion emitter on asteroidDestroyed event
  - Test explosion particle count (20-50 range)
  - Test explosion particle velocity (radial spread)
  - Test explosion duration based on size (small: 500ms, medium: 1500ms, large: 2000ms)
  - Test thrust emitter on ship thrust
  - Test thrust particle rate (50/second)
  - Test thrust emission from ship rear position
  - Test particle color assignment per emitter type
  - Test emitter activation/deactivation
  - Test no emission when emitter inactive

- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Create Particle Data Structures**:

- [x] Create `src/rendering/ParticleManager.ts`:
  - Interface `Particle`:
    ```typescript
    interface Particle {
      position: Vector3
      velocity: Vector3
      lifetime: number
      maxLifetime: number
      color: Color // Three.js Color
      size: number
      active: boolean
    }
    ```
  - Class `ParticleManager`:
    - Constructor: `constructor(poolSize: number = 500)`
    - Property: `particles: Particle[]` (pool array)
    - Property: `meshes: InstancedMesh` (Three.js instanced mesh for rendering)
    - Method: `acquireParticle(): Particle | null` - Get inactive particle from pool
    - Method: `releaseParticle(particle: Particle): void` - Mark particle as inactive
    - Method: `updateParticles(deltaTime: number): void` - Update all active particles
    - Method: `getActiveParticles(): Particle[]` - Query active particles
    - Initialize pool with inactive particles on construction

**Create ParticleEmitter Component** (if not exists):

- [x] Create or verify `src/components/ParticleEmitter.ts`:
  - Implement ParticleEmitterComponent interface (from Design Doc)
  - Export from `src/components/index.ts`

**Create Particle Emitter System**:

- [x] Create `src/systems/ParticleEmitterSystem.ts`:
  - Extend System interface
  - Constructor: inject ParticleManager, EventEmitter
  - Listen for events:
    - `asteroidDestroyed` → spawn explosion emitter
    - `shipThrust` → activate thrust emitter (or create if not exists)
    - `shipThrustStop` → deactivate thrust emitter
  - Method: `createExplosionEmitter(position: Vector3, size: AsteroidSize)`
    - Calculate particle count: random 20-50
    - Calculate duration based on size:
      - small: 500ms
      - medium: 1500ms
      - large: 2000ms
    - Spawn particles with:
      - Position: explosion center
      - Velocity: random radial direction, speed 50-200 units/s
      - Color: orange/red/yellow gradient
      - Size: random 2-8 units
      - Lifetime: duration calculated above
  - Method: `updateThrustEmitter(shipEntity: EntityId, deltaTime: number)`
    - If ship thrusting (from InputSystem):
      - Calculate emission count: rate * deltaTime (50 particles/second)
      - Spawn particles from ship rear (Transform.position - facing direction * shipRadius)
      - Velocity: opposite to facing direction, 100-50 units/s random
      - Color: blue/cyan gradient
      - Size: 2-4 units
      - Lifetime: 200-400ms
  - Method: `update(deltaTime: number, entities: EntityId[], world: World): void`
    - Update thrust emitter for ship entity
    - Update all active emitters

**Create Particle Render System**:

- [x] Create `src/systems/ParticleRenderSystem.ts`:
  - Extend System interface
  - Constructor: inject ParticleManager, Three.js Scene, Camera
  - Initialize Three.js instanced mesh for particles:
    - Geometry: PlaneGeometry (quad)
    - Material: MeshBasicMaterial with transparent blending
    - InstancedMesh: maxCount = 500 (pool size)
  - Method: `update(deltaTime: number, entities: EntityId[], world: World): void`
    - Get active particles from ParticleManager
    - For each active particle:
      - Calculate alpha: 1.0 - (lifetime elapsed / maxLifetime)
      - Update instanced mesh matrix (position, billboard rotation toward camera, scale)
      - Update material color and opacity
    - Set instancedMesh.count = active particle count
  - Method: `getBillboardRotation(camera: Camera): Quaternion`
    - Return quaternion to face camera (billboarding)
  - Add instanced mesh to scene on initialization
  - Remove instanced mesh from scene on cleanup

**Integrate with Game Loop**:

- [ ] Update `src/game/Game.ts`:
  - Instantiate ParticleManager
  - Add ParticleEmitterSystem to system list
  - Add ParticleRenderSystem to system list (after RenderSystem)
  - Pass ParticleManager to both systems

**Create unit tests**:

- [x] Implement all tests from Red phase
- [x] Verify tests pass

### 3. Refactor Phase

- [x] Optimize particle pool reuse (ensure no allocations during gameplay)
- [x] Verify billboarding works from all camera angles
- [ ] Test particle rendering performance (profile 500 active particles)
- [x] Ensure particle colors appropriate for each emitter type
- [x] Verify explosion particle spread is radial and visually appealing
- [x] Verify thrust particles emit from correct ship position
- [x] Add configuration for particle counts and durations
- [x] Test edge cases: pool exhaustion, rapid explosions
- [x] Confirm all tests pass

## Completion Criteria

- [x] ParticleManager initialized with 500-particle pool
- [x] Particles acquired and released without allocations
- [x] Explosion particles spawn on asteroid destruction (20-50 count)
- [x] Explosion duration matches size (small: 500ms, medium: 1500ms, large: 2000ms)
- [x] Explosion particles spread radially with random velocities
- [x] Thrust particles emit while ship thrusting (50/second rate)
- [x] Thrust particles emit from ship rear
- [x] Particles fade over lifetime (alpha reduction)
- [x] Particles billboard toward camera (always face player)
- [x] Instanced mesh used for particle rendering (optimized draw calls)
- [x] Particle colors appropriate (explosion: orange/red, thrust: blue/cyan)
- [x] Unit tests passing (20+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes
- [ ] Visual verification: explosions and thrust trails visible
- [ ] Performance: 60 FPS maintained with 500 active particles

## Verification Method

**L2: Test Operation Verification + L1: Functional Verification**

```bash
# Run unit tests
npm test -- ParticleManager.test.ts
npm test -- ParticleEmitterSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# 1. Start game and play
# 2. Shoot asteroids and verify explosion particles
# 3. Verify explosion size matches asteroid size (visual)
# 4. Hold thrust (W/up arrow) and verify blue flame particles from ship rear
# 5. Verify particles fade out over time
# 6. Verify particles always face camera (billboard)
# 7. Check FPS stays at 60 with many explosions
```

**Success Indicators**:
- Explosions visible on asteroid destruction
- Explosion visual intensity matches asteroid size
- Thrust trail visible while moving
- Particles fade smoothly
- No FPS drop with multiple explosions
- All unit tests passing (20+ test cases)

## Notes

- Particle pool size: 500 (configurable in VisualConfig)
- Pool can expand if 500 insufficient (optional stretch goal)
- Billboarding: particles always face camera for sprite-like appearance
- Color gradients:
  - Explosion: mix of orange (#FF8C00), red (#FF0000), yellow (#FFFF00)
  - Thrust: blue (#0000FF), cyan (#00FFFF)
- Instanced mesh rendering: single draw call for all particles (performance optimization)
- Particle velocity affected by parent entity velocity (explosion inherits asteroid velocity)
- Emitter types supported: explosion, thrust (trail and shield for future tasks)
- Integration with AudioSystem: explosion particles paired with explosion sound (already implemented)

## Impact Scope

**Allowed Changes**: Particle pool size, emission rates, particle colors, lifetime durations, size ranges
**Protected Areas**: ECS World interface, event emission mechanism, Three.js scene structure
**Areas Affected**: Visual feedback quality, performance (draw calls, FPS), player feedback clarity

## Deliverables

- ParticleManager with object pooling
- ParticleEmitterSystem with explosion and thrust emitters
- ParticleRenderSystem with instanced mesh rendering
- ParticleEmitter component definition
- Comprehensive unit tests for particle systems
- Explosion effects on asteroid destruction
- Thrust trail effects on ship movement
- Ready for Task 7.2 (Screen Shake) and Task 7.3 (Projectile Trails)
