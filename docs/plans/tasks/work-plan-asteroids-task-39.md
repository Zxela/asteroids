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

- [ ] `src/systems/ParticleEmitterSystem.ts` - Extend with projectile trail logic
- [ ] `tests/unit/ParticleEmitterSystem.test.ts` - Add trail tests

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

- [ ] `tests/unit/ParticleEmitterSystem.test.ts` (extend existing file):
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

- [ ] Verify new tests fail (Red state)

### 2. Green Phase

**Extend Projectile Factory**:

- [ ] Update `src/entities/createProjectile.ts`:
  - Add ParticleEmitter component to projectile entities:
    ```typescript
    world.addComponent(projectileId, {
      type: 'particleEmitter',
      emitterType: 'trail',
      active: true,
      rate: 20, // particles/second
      lifetime: 150 // ms (average of 100-200)
    })
    ```
  - Store weapon type for color determination (may need Weapon reference or separate component)

**Extend Particle Emitter System**:

- [ ] Update `src/systems/ParticleEmitterSystem.ts`:
  - Add method: `updateTrailEmitters(deltaTime: number, entities: EntityId[], world: World): void`
    - Query entities with Projectile + ParticleEmitter + Transform components
    - For each projectile entity:
      - Get weapon type from Projectile component (may need to track or infer)
      - Calculate emission count: emitter.rate * deltaTime (20/second)
      - Spawn trail particles:
        - Position: projectile Transform.position
        - Velocity: minimal random spread (±10 units/s in X/Y)
        - Color: based on weapon type using `getTrailColorForWeapon(weaponType)`
        - Size: 1-3 units (smaller than thrust/explosion)
        - Lifetime: 100-200ms random
  - Add method: `getTrailColorForWeapon(weaponType: WeaponType): Color`
    - Return Three.js Color:
      - 'single' → new Color(0xFF0000) // red
      - 'spread' → new Color(0x0000FF) // blue
      - 'laser' → new Color(0x00FFFF) // cyan
      - 'homing' → new Color(0x00FF00) // green
  - Update main `update()` method:
    - Call `updateTrailEmitters(deltaTime, entities, world)` after thrust emitter update

**Handle Weapon Type Access**:

Option 1: Store weapon type in Projectile component
- [ ] Update `src/components/Projectile.ts`:
  - Add optional `weaponType?: WeaponType` field
  - Update in createProjectile to pass weapon type

Option 2: Infer from mesh type
- [ ] Use Renderable component meshType to infer weapon:
  - 'projectile_default' → 'single'
  - 'projectile_spread' → 'spread'
  - 'projectile_laser' → 'laser'
  - 'projectile_missile' → 'homing'

**Clean Up Trail Emitters**:

- [ ] Verify trail particles cleaned up when projectile destroyed:
  - ParticleManager automatically handles particle lifecycle
  - No additional cleanup needed (particles fade out naturally)

**Create unit tests**:

- [ ] Implement all tests from Red phase
- [ ] Verify tests pass

### 3. Refactor Phase

- [ ] Verify trail colors distinct and visually appealing
- [ ] Ensure trail particle count doesn't overwhelm pool (500 particles)
- [ ] Optimize trail emission (no allocations per emit)
- [ ] Test trail visual clarity with many simultaneous projectiles
- [ ] Verify trail fade timing feels right (not too long, not too short)
- [ ] Add configuration for trail emission rate and lifetime
- [ ] Test edge case: 50+ projectiles with trails
- [ ] Confirm all tests pass

## Completion Criteria

- [ ] ParticleEmitter component added to all projectiles
- [ ] Trail particles emit from projectile position
- [ ] Trail emission rate: 20 particles/second
- [ ] Trail particle lifetime: 100-200ms
- [ ] Trail colors based on weapon type:
  - Default: Red
  - Spread: Blue
  - Laser: Cyan
  - Homing: Green
- [ ] Trail particles have minimal velocity (stay near emission point)
- [ ] Trail particles smaller than explosion/thrust particles (size 1-3)
- [ ] Trails fade over lifetime (alpha reduction)
- [ ] Multiple projectiles can have trails simultaneously
- [ ] Trail emitters cleaned up with projectile destruction
- [ ] Unit tests passing (10+ new test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes
- [ ] Visual verification: projectiles have colored trails
- [ ] Performance: 60 FPS maintained with 50+ projectiles with trails

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
