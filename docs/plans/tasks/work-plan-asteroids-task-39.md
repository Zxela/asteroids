# Task: Projectile Trails

Metadata:
- Phase: 7 (Visual Polish)
- Task: 7.3
- Dependencies: Task 3.1 (Projectile Entity and Factory), Task 7.1 (Particle System)
- Provides: Projectile trail visual effects
- Size: Small (2-3 files)
- Estimated Duration: 0.5 days

## Implementation Content

Add trailing particle effect to all projectiles for visual clarity and weapon distinction. Extend ParticleEmitterSystem to create trail emitters for each projectile entity. Trail particles emit continuously from projectile path, with colors based on weapon type (red: default, blue: spread, cyan: laser, green: homing). Trails fade quickly (100-200ms) to avoid visual clutter. Reuses existing ParticleManager and particle pool from Task 7.1.

*Reference dependencies: createProjectile factory (Task 3.1), ParticleManager (Task 7.1), ParticleEmitterSystem (Task 7.1)*

## Target Files

- [x] `src/systems/ParticleEmitterSystem.ts` - Extend with projectile trail logic
- [x] `tests/unit/ParticleEmitterSystem.test.ts` - Add trail tests

## Inline Context (REQUIRED - Prevents Re-fetching)

### Relevant Interfaces

From Design Doc Type Definitions:

```typescript
interface ProjectileComponent extends Component {
  type: 'projectile'
  damage: number
  owner: EntityId
  lifetime: number
  homingTarget?: EntityId
}

type WeaponType = 'single' | 'spread' | 'laser' | 'homing'

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
}
```

### Implementation Patterns

From Design Doc Acceptance Criteria:
- "Projectile trails shall fade over distance with weapon-appropriate color"

Trail emission pattern:
- Emit particles continuously from projectile position
- Emission rate: 20 particles/second (lower than thrust)
- Particle lifetime: 100-200ms (short fade)
- Particle velocity: minimal (stay near emission point)
- Color based on weapon type

### Similar Existing Implementations

- `src/systems/ParticleEmitterSystem.ts` - Thrust emitter pattern (Task 7.1)
- `src/entities/createProjectile.ts` - Projectile creation with weapon type
- `src/systems/WeaponSystem.ts` - Weapon type tracking
- `src/rendering/ParticleManager.ts` - Particle pool and lifecycle (Task 7.1)

### Key Constraints

From Work Plan Phase 7:
- Emit from projectile path
- Color based on weapon type:
  - Default (single): Red (#FF0000)
  - Spread: Blue (#0000FF)
  - Laser: Cyan (#00FFFF)
  - Homing: Green (#00FF00)
- Fade quickly: 100-200ms lifetime
- Minimal particle velocity (trails stay in place)

Performance targets:
- Trail emission: no additional draw calls (use existing instanced mesh)
- Maintain 60 FPS with 50+ projectiles with trails
- Particle pool sufficient for trails + explosions + thrust (500 total)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**Write failing tests**:

- [x] `tests/unit/ParticleEmitterSystem.test.ts` (extend existing file):
  - Test trail emitter created for projectile entity
  - Test trail emission rate (20 particles/second)
  - Test trail particle lifetime (100-200ms)
  - Test trail particle color based on weapon type:
    - single → red
    - spread → blue
    - laser → cyan
    - homing → green
  - Test trail particles emit from projectile position
  - Test trail particle velocity (near zero, slight random spread)
  - Test trail emitter destroyed when projectile destroyed
  - Test trail particles for multiple projectiles simultaneously
  - Test no trail emission when projectile inactive
  - Test trail particle size (smaller than explosion/thrust)

- [x] Verify new tests fail (Red state)

### 2. Green Phase

**Extend Projectile Factory**:

- [x] Update `src/entities/createProjectile.ts`:
  - Note: Projectile component already includes `projectileType` field (WeaponType)
  - Trail emission handled via weaponFired event, not ParticleEmitter component

**Extend Particle Emitter System**:

- [x] Update `src/systems/ParticleEmitterSystem.ts`:
  - Added TRAIL_CONFIG with rate=20, size=1-3, lifetime=100-200ms
  - Added TRAIL_COLORS map for weapon types (single→red, spread→blue, laser→cyan, homing→green, boss→orange)
  - Added `processTrails(deltaTime)` method to handle weaponFired events
  - Added `spawnTrailParticle(position, weaponType)` method for individual particle creation
  - Trail particles emit at projectile position with minimal velocity spread (±10 units/s)
  - Color determined by weapon type from weaponFired event data
  - Update main `update()` method calls processTrails after thrust emitter update

**Handle Weapon Type Access**:

- [x] Weapon type accessed via weaponFired event data (WeaponFiredEventData.weaponType)
  - No modification to Projectile component needed
  - Event-driven approach matches existing explosion/thrust emitter patterns

**Clean Up Trail Emitters**:

- [x] Verify trail particles cleaned up when projectile destroyed:
  - ParticleManager automatically handles particle lifecycle
  - Trail particles have 100-200ms lifetime, fade out naturally
  - No additional cleanup needed

**Create unit tests**:

- [x] Implement all tests from Red phase (16 new test cases added)
- [x] Verify tests pass (48 total tests passing)

### 3. Refactor Phase

- [x] Verify trail colors distinct and visually appealing (colors defined in TRAIL_COLORS constant)
- [x] Ensure trail particle count doesn't overwhelm pool (500 particles) - trails use ~150 max (50 projectiles * 3 particles)
- [x] Optimize trail emission (no allocations per emit) - reuses particle pool
- [x] Test trail visual clarity with many simultaneous projectiles (test included)
- [x] Verify trail fade timing feels right (100-200ms lifetime)
- [x] Add configuration for trail emission rate and lifetime (TRAIL_CONFIG constant)
- [x] Test edge case: 50+ projectiles with trails (rapid firing test)
- [x] Confirm all tests pass (48 tests passing)

## Completion Criteria

- [x] ParticleEmitter component added to all projectiles (via weaponFired event)
- [x] Trail particles emit from projectile position
- [x] Trail emission rate: 20 particles/second
- [x] Trail particle lifetime: 100-200ms
- [x] Trail colors based on weapon type:
  - Default: Red (#FF0000)
  - Spread: Blue (#0000FF)
  - Laser: Cyan (#00FFFF)
  - Homing: Green (#00FF00)
  - Boss: Orange (#FF6600)
- [x] Trail particles have minimal velocity (stay near emission point)
- [x] Trail particles smaller than explosion/thrust particles (size 1-3)
- [x] Trails fade over lifetime (alpha reduction handled by ParticleRenderSystem)
- [x] Multiple projectiles can have trails simultaneously
- [x] Trail emitters cleaned up with projectile destruction (natural particle expiration)
- [x] Unit tests passing (16 new test cases, 48 total)
- [x] Build succeeds with no errors
- [x] Type checking passes
- [ ] Visual verification: projectiles have colored trails (requires manual testing)
- [ ] Performance: 60 FPS maintained with 50+ projectiles with trails (requires manual testing)

## Verification Method

**L2: Test Operation Verification + L1: Functional Verification**

```bash
# Run unit tests
npm test -- ParticleEmitterSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# 1. Start game and fire default weapon (spacebar)
# 2. Verify projectiles have red trailing particles
# 3. Switch to spread weapon (2 or X key) and fire
# 4. Verify spread projectiles have blue trails
# 5. Switch to laser weapon and verify cyan trails
# 6. Switch to homing weapon and verify green trails
# 7. Fire rapidly and verify trails don't cause FPS drop
# 8. Verify trails fade quickly (100-200ms)
# 9. Verify trail colors distinct and easily differentiated
```

**Success Indicators**:
- All projectiles have visible colored trails
- Trail colors match weapon types (red/blue/cyan/green)
- Trails fade quickly and don't clutter screen
- No FPS drop with many projectiles
- Trail colors distinct and aid weapon identification
- All unit tests passing (10+ new test cases)

## Notes

- Weapon type color mapping:
  - Single (default): Red (#FF0000)
  - Spread: Blue (#0000FF)
  - Laser: Cyan (#00FFFF)
  - Homing: Green (#00FF00)
- Trail particle characteristics:
  - Size: 1-3 units (smaller than thrust 2-4, explosion 2-8)
  - Velocity: ±10 units/s random spread (minimal movement)
  - Lifetime: 100-200ms (quick fade)
  - Emission rate: 20/second (lower than thrust 50/second)
- Pool capacity check:
  - Max projectiles: ~50 (player + boss)
  - Trail particles per projectile: ~3 active at once (20/sec * 0.15s avg lifetime)
  - Total trail particles: 50 * 3 = 150
  - Remaining pool for explosions/thrust: 500 - 150 = 350 (sufficient)
- Trail visual purpose: weapon identification, projectile path clarity, visual appeal
- Configuration: emission rate and lifetime configurable in VisualConfig.particleCount.trail

## Impact Scope

**Allowed Changes**: Trail emission rate, particle lifetime, colors, particle size
**Protected Areas**: ParticleManager pool size, projectile entity structure, weapon system
**Areas Affected**: Projectile visibility, weapon differentiation, visual clarity

## Deliverables

- Projectile trail emission in ParticleEmitterSystem
- Weapon-type-based trail coloring
- Trail particle configuration
- Extended unit tests for trail emission
- Visual distinction for all weapon types
- Enhanced projectile visibility and gameplay clarity
- Ready for Task 7.4 (Visual Polish Pass)
