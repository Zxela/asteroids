# Task: Visual Polish Pass

Metadata:
- Phase: 7 (Visual Polish)
- Task: 7.4
- Dependencies: Task 7.1 (Particle System), Task 7.2 (Screen Shake), Task 7.3 (Projectile Trails)
- Provides: Enhanced materials, lighting, visual theme consistency
- Size: Medium (3-5 files)
- Estimated Duration: 1 day

## Implementation Content

Final visual polish pass to enhance material properties, refine lighting, ensure visual theme consistency (cyberpunk/neon aesthetic), and fix any visual artifacts. Update material definitions for all entity types (asteroids, ship, boss, power-ups) with emissive properties and dynamic effects. Adjust lighting to ensure all meshes properly illuminated. Apply consistent color palette throughout game (HUD, particles, materials). Add dynamic visual effects like pulsing ship during invulnerability and boss color shift based on phase.

*Reference dependencies: MeshFactory (Task 2.7), RenderSystem (Task 2.7), all particle systems (Task 7.1-7.3)*

## Target Files

- [ ] `src/rendering/MeshFactory.ts` - Update material definitions
- [ ] `src/rendering/SceneManager.ts` - Adjust lighting setup
- [ ] `src/systems/RenderSystem.ts` - Add dynamic material effects
- [ ] `src/config/gameConfig.ts` - Add visual theme constants
- [ ] `tests/unit/RenderSystem.test.ts` - Add visual effect tests

## Inline Context (REQUIRED - Prevents Re-fetching)

### Relevant Interfaces

From Design Doc Type Definitions:

```typescript
interface RenderableComponent extends Component {
  type: 'renderable'
  meshType: MeshType
  material: MaterialType
  visible: boolean
  objectId?: string
}

type MeshType =
  | 'ship'
  | 'asteroid_large'
  | 'asteroid_medium'
  | 'asteroid_small'
  | 'projectile_default'
  | 'projectile_spread'
  | 'projectile_laser'
  | 'projectile_missile'
  | 'powerup_shield'
  | 'powerup_rapidfire'
  | 'powerup_multishot'
  | 'powerup_extralife'
  | 'boss_destroyer'
  | 'boss_carrier'

type MaterialType = 'standard' | 'emissive' | 'transparent'

interface HealthComponent extends Component {
  type: 'health'
  current: number
  max: number
  invulnerable: boolean
  invulnerabilityTimer: number
}

interface BossComponent extends Component {
  type: 'boss'
  bossType: BossType
  phase: number
  phaseTimer: number
  attackPattern: AttackPattern
}
```

### Implementation Patterns

From Design Doc and Work Plan:
- Emissive materials with slight glow
- Pulsing effect during invulnerability
- Boss color shift based on phase
- Power-up rotating mesh with emissive glow
- Consistent cyberpunk/neon color palette

Material enhancement pattern:
- Use MeshStandardMaterial with emissive properties
- Add emissiveIntensity for glow effect
- Use Color for dynamic color changes
- Animate material properties based on component state

### Similar Existing Implementations

- `src/rendering/MeshFactory.ts` - Existing mesh and material creation
- `src/systems/RenderSystem.ts` - ECS-to-Three.js synchronization
- `src/rendering/SceneManager.ts` - Scene and lighting setup
- `src/systems/PowerUpSystem.ts` - Power-up state management

### Key Constraints

From Work Plan Phase 7:
- Asteroid: emissive material with slight glow
- Ship: emissive material, pulsing during invulnerability
- Boss: emissive material, phase-based color shift
- Power-up: emissive, rotating mesh
- No visual clipping or artifacts
- Visual theme consistent (cyberpunk/neon)
- HUD color consistent with theme
- All meshes properly illuminated

Performance targets:
- Material updates: <1ms per frame
- No additional draw calls from polish
- Maintain 60 FPS with all effects active

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**Write failing tests**:

- [ ] `tests/unit/RenderSystem.test.ts` (extend existing):
  - Test ship material pulses during invulnerability
  - Test ship emissive intensity oscillates (0.5-1.5 range)
  - Test ship material normal when not invulnerable
  - Test boss material color changes based on phase
  - Test boss phase 1: blue color
  - Test boss phase 2: orange color
  - Test boss phase 3: red color
  - Test power-up mesh rotation (continuous)
  - Test power-up rotation speed (π/2 rad/s)
  - Test asteroid emissive intensity applied
  - Test material caching (same material reused for same type)

- [ ] Verify new tests fail (Red state)

### 2. Green Phase

**Update Material Definitions**:

- [ ] Update `src/rendering/MeshFactory.ts`:
  - Modify material creation for each mesh type:
    - **Asteroids** (all sizes):
      - Material: MeshStandardMaterial
      - Color: Gray (#808080) base
      - Emissive: Cyan (#00FFFF)
      - EmissiveIntensity: 0.3
      - Roughness: 0.8
      - Metalness: 0.2
    - **Ship**:
      - Material: MeshStandardMaterial
      - Color: White (#FFFFFF)
      - Emissive: Blue (#0088FF)
      - EmissiveIntensity: 0.5 (will pulse during invulnerability)
      - Roughness: 0.5
      - Metalness: 0.5
    - **Projectiles** (all types):
      - Material: MeshStandardMaterial with transparency
      - Color: based on weapon type (from Task 7.3)
      - Emissive: same as color
      - EmissiveIntensity: 1.0 (bright)
      - Transparent: true
      - Opacity: 0.8
    - **Power-ups** (all types):
      - Material: MeshStandardMaterial
      - Color: based on type:
        - Shield: Cyan (#00FFFF)
        - RapidFire: Yellow (#FFFF00)
        - MultiShot: Magenta (#FF00FF)
        - ExtraLife: Green (#00FF00)
      - Emissive: same as color
      - EmissiveIntensity: 1.0 (bright glow)
      - Metalness: 0.8
    - **Boss** (destroyer, carrier):
      - Material: MeshStandardMaterial
      - Color: based on phase (updated dynamically)
      - Emissive: based on phase
      - EmissiveIntensity: 0.8
      - Roughness: 0.3
      - Metalness: 0.7

**Enhance Lighting Setup**:

- [ ] Update `src/rendering/SceneManager.ts`:
  - Adjust DirectionalLight:
    - Color: White (#FFFFFF)
    - Intensity: 1.0
    - Position: (5, 10, 5) for good coverage
  - Adjust AmbientLight:
    - Color: Dark blue (#222244) for atmosphere
    - Intensity: 0.4
  - Add optional: PointLight at ship position (subtle, low intensity)
  - Ensure all meshes receive adequate lighting

**Add Dynamic Visual Effects**:

- [ ] Update `src/systems/RenderSystem.ts`:
  - Add method: `updateShipVisuals(entity: EntityId, world: World, deltaTime: number)`
    - Query entity Health component
    - If invulnerable:
      - Get mesh material
      - Pulse emissiveIntensity: 0.5 + 0.5 * sin(time * 2π * frequency)
      - Frequency: 5 Hz (5 pulses per second)
      - Store elapsed time for sine calculation
    - If not invulnerable:
      - Reset emissiveIntensity to 0.5 (default)
  - Add method: `updateBossVisuals(entity: EntityId, world: World)`
    - Query entity Boss component
    - Get current phase
    - Update material color and emissive based on phase:
      - Phase 1: Blue (#0088FF), emissive blue
      - Phase 2: Orange (#FF8800), emissive orange
      - Phase 3: Red (#FF0000), emissive red
    - Apply color transition smoothly (interpolate over 0.5s)
  - Add method: `updatePowerUpVisuals(entity: EntityId, world: World, deltaTime: number)`
    - Rotate power-up mesh continuously
    - Rotation speed: π/2 radians per second (90 degrees/sec)
    - Apply to mesh.rotation.y
  - Update main `update()` method:
    - Call `updateShipVisuals()` for ship entity
    - Call `updateBossVisuals()` for boss entities
    - Call `updatePowerUpVisuals()` for power-up entities

**Add Visual Theme Constants**:

- [ ] Update `src/config/gameConfig.ts`:
  - Add VisualTheme section:
    ```typescript
    visualTheme: {
      palette: {
        primary: 0x0088FF,    // Blue
        secondary: 0x00FFFF,  // Cyan
        accent: 0xFF00FF,     // Magenta
        warning: 0xFF8800,    // Orange
        danger: 0xFF0000,     // Red
        success: 0x00FF00,    // Green
        neutral: 0x808080     // Gray
      },
      emissiveIntensity: {
        low: 0.3,
        medium: 0.5,
        high: 1.0
      },
      animationSpeeds: {
        invulnerabilityPulse: 5, // Hz
        powerUpRotation: Math.PI / 2 // rad/s
      }
    }
    ```

**Apply HUD Styling Consistency**:

- [ ] Update HUD CSS (if in separate file) or inline styles:
  - Use visual theme colors for consistency
  - Example: Score text color: cyan (#00FFFF)
  - Lives color: green (#00FF00)
  - Warning text: orange (#FF8800)
  - Boss health bar: gradient red-orange-yellow
  - Power-up display: use power-up colors

**Create unit tests**:

- [ ] Implement all tests from Red phase
- [ ] Mock material properties for inspection
- [ ] Verify tests pass

### 3. Refactor Phase

- [ ] Verify all materials visually consistent and appealing
- [ ] Ensure emissive glow visible but not overpowering
- [ ] Test invulnerability pulse visibility and timing
- [ ] Verify boss color transitions smooth and clear
- [ ] Test power-up rotation speed feels right
- [ ] Check for visual clipping or artifacts (Z-fighting, etc.)
- [ ] Verify lighting adequate for all mesh types
- [ ] Optimize material updates (cache materials, update only on change)
- [ ] Test visual theme consistency across all UI and game elements
- [ ] Confirm all tests pass

## Completion Criteria

- [ ] All mesh materials updated with emissive properties
- [ ] Asteroids: gray with cyan emissive glow (intensity 0.3)
- [ ] Ship: white with blue emissive (intensity 0.5, pulses when invulnerable)
- [ ] Ship invulnerability pulse: 5 Hz frequency, oscillates 0.5-1.0 intensity
- [ ] Projectiles: colored emissive matching weapon type (intensity 1.0)
- [ ] Power-ups: colored emissive matching type (intensity 1.0)
- [ ] Power-up meshes rotate continuously (π/2 rad/s)
- [ ] Boss: emissive material with phase-based color:
  - Phase 1: Blue
  - Phase 2: Orange
  - Phase 3: Red
- [ ] Boss color transitions smooth (0.5s interpolation)
- [ ] Lighting adjusted: DirectionalLight + AmbientLight adequate
- [ ] HUD styling consistent with visual theme
- [ ] Color palette consistent: blue/cyan primary, orange/red warnings
- [ ] No visual clipping or artifacts
- [ ] Visual theme cohesive (cyberpunk/neon aesthetic)
- [ ] Unit tests passing (10+ visual effect test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes
- [ ] Visual verification: all enhancements visible and appealing
- [ ] Performance: 60 FPS maintained with all visual effects

## Verification Method

**L2: Test Operation Verification + L1: Functional Verification**

```bash
# Run unit tests
npm test -- RenderSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# 1. Start game and observe visual quality
# 2. Verify asteroids have cyan emissive glow
# 3. Collide with asteroid to lose life, verify ship pulses blue during invulnerability
# 4. Collect power-ups, verify they glow and rotate
# 5. Play to wave 5, verify boss appears with blue emissive
# 6. Damage boss to 50% health, verify color shifts to orange
# 7. Damage boss to 25% health, verify color shifts to red
# 8. Verify all projectiles have colored emissive trails
# 9. Check HUD colors match theme (cyan, blue, orange, red)
# 10. Verify overall visual consistency and appeal
# 11. Check for visual artifacts (Z-fighting, clipping)
# 12. Verify FPS remains at 60 with all effects
```

**Success Indicators**:
- All entities have appropriate emissive glow
- Ship pulses visibly during invulnerability
- Boss color changes clearly indicate phase
- Power-ups rotate and glow attractively
- Visual theme consistent (cyberpunk/neon)
- No visual clipping or artifacts
- HUD styling matches game aesthetic
- All unit tests passing (10+ test cases)
- 60 FPS maintained

## Notes

- Color palette (cyberpunk/neon theme):
  - Primary: Blue (#0088FF), Cyan (#00FFFF)
  - Accent: Magenta (#FF00FF), Yellow (#FFFF00)
  - Warning: Orange (#FF8800)
  - Danger: Red (#FF0000)
  - Success: Green (#00FF00)
  - Neutral: Gray (#808080)
- Emissive intensity levels:
  - Low (0.3): Ambient glow (asteroids)
  - Medium (0.5): Noticeable (ship)
  - High (1.0): Bright (projectiles, power-ups)
- Ship invulnerability pulse:
  - Formula: 0.5 + 0.5 * Math.sin(elapsedTime * 2 * Math.PI * frequency)
  - Frequency: 5 Hz (5 pulses per second)
  - Result: intensity oscillates between 0.5 and 1.0
- Boss phase colors:
  - Phase 1 (100-51%): Blue (#0088FF) - Normal
  - Phase 2 (50-26%): Orange (#FF8800) - Escalated
  - Phase 3 (25-0%): Red (#FF0000) - Critical
- Material caching: reuse materials for same mesh types to reduce memory
- Lighting balance: enough to see details but maintain dark space atmosphere
- Visual artifacts to check:
  - Z-fighting: overlapping geometry
  - Clipping: meshes passing through each other
  - LOD popping: sudden visual changes
  - Material seams: visible edges in textures

## Impact Scope

**Allowed Changes**: Material properties (colors, emissive, roughness, metalness), lighting intensity, animation speeds, HUD styling
**Protected Areas**: Mesh geometry, rendering pipeline, ECS component structure
**Areas Affected**: Visual appeal, theme consistency, player feedback clarity, overall polish

## Deliverables

- Enhanced material definitions for all entity types
- Dynamic visual effects (ship pulse, boss color shift, power-up rotation)
- Refined lighting setup
- Consistent visual theme (cyberpunk/neon)
- Visual theme constants in configuration
- HUD styling consistency
- Comprehensive visual effect unit tests
- Final visual polish for production-ready appearance
- Ready for Phase 8 (Quality Assurance)
