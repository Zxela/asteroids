# Overall Design Document: Asteroids Game Implementation

Generation Date: 2026-01-22
Target Plan Document: work-plan-asteroids.md

## Project Overview

### Purpose and Goals

Implement a modern 3D browser-based Asteroids game using Three.js, TypeScript, and Vite with:
- Entity-Component-System (ECS) architecture for modularity
- Custom arcade physics engine with screen wrapping
- Progressive wave-based difficulty scaling
- Power-up and weapon systems with variants
- Boss battles with AI patterns
- Audio and visual effects with particles
- Local leaderboard persistence

### Background and Context

This is a greenfield implementation of a classic arcade game reimagined in 3D. The project uses modern web technologies with emphasis on:
- Strong type safety (TypeScript strict mode)
- Test-driven development with TDD methodology
- Vertical slice feature-driven approach for early playability
- Performance optimization for 60 FPS on mid-range hardware
- Cross-browser compatibility

## Task Division Design

### Division Policy

**Vertical Slice Feature-Driven Approach** with foundation prerequisites:
- **Phase 1 (Foundation)**: Type system, ECS infrastructure, build tooling - prerequisite for all phases
- **Phase 2 (Minimal Playable)**: Core gameplay loop (ship, asteroids, collision, rendering) - first playable vertical slice
- **Phase 3 (Core Loop)**: Weapons, destruction, scoring, lives system - complete gameplay loop
- **Phase 4 (Game Flow)**: State machine, menus, waves, persistence - full game session
- **Phase 5 (Enhancement)**: Audio, power-ups, weapon variants - feature richness
- **Phase 6 (Boss)**: Boss encounters, AI patterns - progression depth
- **Phase 7 (Polish)**: Particles, effects, animations - visual quality
- **Phase 8 (QA)**: Performance, testing, browser compatibility - production readiness

**Verifiability Level Distribution**:
- Phase 1: L3 (Build Success) - Types compile, no errors
- Phase 2: L1 (Functional) - Minimal playable game with visual verification
- Phase 3: L1 (Functional) - Complete gameplay loop playable
- Phase 4: L1 (Functional) - Full session with persistence playable
- Phase 5: L1 (Functional) - Enhanced gameplay with audio and weapons
- Phase 6: L1 (Functional) - Boss battles executable
- Phase 7: L2 (Test + Visual) - Visual quality verified
- Phase 8: L2 (Tests + Integration) - All tests passing, coverage achieved

### Inter-task Relationship Map

```
Phase 1: Foundation
├── Task 1.1: Project Setup (no deps)
│   ↓
├── Task 1.2: ECS Implementation (→ World, EntityManager, ComponentStorage)
├── Task 1.3: Type Definitions (→ all type interfaces)
├── Task 1.4: Configuration (refs 1.3 → gameConfig, audioConfig)
└── Task 1.5: Utilities (→ EventEmitter, math, random)

Phase 2: Minimal Playable Game
├── Task 2.1: Three.js Setup (← 1.1, 1.4 → SceneManager, Game, main.ts)
├── Task 2.2: Input System (← 1.1, 1.4 → InputSystem)
├── Task 2.3: Components (← 1.3 → Component classes)
├── Task 2.4: Physics System (← 2.3, 1.4 → PhysicsSystem)
├── Task 2.5: Ship Entity (← 2.3, 2.4 → createShip factory)
├── Task 2.6: Ship Control System (← 2.2, 2.4, 2.5 → ShipControlSystem)
├── Task 2.7: Render System (← 2.1, 2.3, 2.6 → RenderSystem, MeshFactory)
├── Task 2.8: Asteroids (← 2.3, 2.7 → createAsteroid, WaveSystem)
└── Task 2.9: Collision System (← 2.3, 2.5, 2.8 → CollisionSystem, SpatialGrid)

Phase 3: Core Gameplay Loop
├── Task 3.1: Projectiles (← 2.5, 2.7 → createProjectile)
├── Task 3.2: Weapon System (← 3.1, 2.2, 2.5 → WeaponSystem)
├── Task 3.3: Destruction (← 3.2, 2.9 → AsteroidDestructionSystem)
├── Task 3.4: Scoring (← 3.3, 2.5 → ScoreSystem)
├── Task 3.5: Lives System (← 2.5, 2.9 → RespawnSystem)
├── Task 3.6: Health Visual (← 2.7, 3.5 → RenderSystem extension)
└── Task 3.7: HUD (← 3.4, 3.5 → HUD, UISystem)

Phase 4: Game Flow and Progression
├── Task 4.1: State Machine (← 1.1, 2.1 → GameStateMachine)
├── Task 4.2: Wave Progression (← 3.3, 3.4 → WaveSystem extension)
├── Task 4.3: Main Menu (← 4.1 → MainMenu)
├── Task 4.4: Pause Menu (← 4.1, 4.2 → PauseMenu)
├── Task 4.5: Game Over Screen (← 4.1, 3.4 → GameOverScreen)
└── Task 4.6: Leaderboard (← 4.5 → Leaderboard, LeaderboardStorage)

Phase 5: Enhanced Features
├── Task 5.1: Audio Manager (← 4.1 → AudioManager)
├── Task 5.2: Audio Integration (← 5.1, 3.2, 3.3 → AudioSystem)
├── Task 5.3: Power-up Entities (← 2.7, 3.3 → createPowerUp)
├── Task 5.4: Power-up Effects (← 5.3, 2.9 → PowerUpSystem)
├── Task 5.5: Power-up HUD (← 3.7, 5.4 → HUD extension)
├── Task 5.6: Weapon Variants (← 3.2, 2.2 → WeaponSystem extension)
└── Task 5.7: Homing Missiles (← 5.6 → WeaponSystem extension)

Phase 6: Boss System
├── Task 6.1: Boss Entity (← 4.2, 3.5 → createBoss, BossHealthSystem)
├── Task 6.2: Boss AI (← 6.1, 2.9 → BossSystem)
├── Task 6.3: Boss Projectiles (← 6.2, 2.9 → createProjectile extension)
└── Task 6.4: Boss Rewards (← 6.1, 3.4, 5.3 → ScoreSystem extension)

Phase 7: Visual Polish
├── Task 7.1: Particles (← 2.7, 3.3 → ParticleManager, ParticleEmitterSystem)
├── Task 7.2: Screen Shake (← 2.1, 2.9 → CameraEffectSystem)
├── Task 7.3: Trails (← 3.1, 7.1 → RenderSystem extension)
└── Task 7.4: Polish Pass (← 7.1, 7.2, 7.3 → Material refinement)

Phase 8: Quality Assurance
├── Task 8.1: Performance Optimization (← All → Profiling & optimization)
├── Task 8.2: Cross-browser Testing (← All → Browser compatibility)
├── Task 8.3: Integration Tests (← Phase 2-4 → Execute INT-1 through INT-3)
├── Task 8.4: E2E Tests (← All → Execute E2E-1 through E2E-15)
├── Task 8.5: Code Quality (← All → Coverage, linting, types)
└── Task 8.6: Bug Fix/QA (← All → Playtesting, edge cases)
```

### Interface Change Impact Analysis

| Existing Interface | New Interface | Conversion Required | Corresponding Task |
|-------------------|---------------|-------------------|-------------------|
| N/A (greenfield) | EntityId type | N/A | Task 1.3 |
| N/A | Component interface | N/A | Task 1.3 |
| N/A | World.update() | N/A | Task 1.2 |
| N/A | InputSystem.getMovementInput() | N/A | Task 2.2 |
| N/A | PhysicsSystem | N/A | Task 2.4 |
| N/A | RenderSystem | N/A | Task 2.7 |
| N/A | CollisionSystem → CollisionEvent | N/A | Task 2.9 |
| WeaponSystem() | WeaponSystem(weapon variant support) | Extension | Task 5.6 |
| Asteroid spawning | WaveSystem with progression | Extension | Task 4.2 |
| N/A | GameStateMachine | N/A | Task 4.1 |
| AudioManager | AudioManager with autoplay policy | N/A | Task 5.1 |

### Common Processing Points

**Identified Shared Components and Logic**:

1. **Event System**
   - Central EventEmitter for all game events
   - Defined in Task 1.5 (Utilities)
   - Used by: WeaponSystem, AsteroidDestructionSystem, ScoreSystem, AudioSystem, PowerUpSystem, etc.
   - Design policy: Single global event bus, subscribe at system initialization

2. **Entity Factory Pattern**
   - Common approach: createX() factory functions
   - Defined across: createShip, createAsteroid, createProjectile, createPowerUp, createBoss
   - Design policy: All factories return EntityId, World is passed as parameter

3. **Component Storage and Querying**
   - Centralized in World.query<ComponentType>()
   - All systems query components consistently
   - Design policy: No direct entity access, only through World interface

4. **Collision Layer/Mask System**
   - Defined in Task 1.3 (Collider type)
   - Used by: CollisionSystem (broad/narrow phase), WeaponSystem (targeting), PowerUpSystem (collection)
   - Design policy: Layer enum, mask as bit flags, checked in CollisionSystem and specialized systems

5. **Physics Application Pattern**
   - PhysicsSystem handles core movement
   - Systems extending behavior: BossSystem (AI movement), PowerUpSystem (drift)
   - Design policy: All physics through Velocity component, separate AI overwrites velocity as needed

6. **Effect Timing Pattern**
   - Used for: Invulnerability, power-up duration, boss phase timers
   - Design policy: Decrement timer each frame, remove when expired, check in appropriate system

7. **Material/Mesh Type Constants**
   - Defined in Task 1.3 (Renderable component type)
   - Used by: MeshFactory, RenderSystem, visual polish extensions
   - Design policy: Enum-based material types, MeshFactory factory methods for each type

**Prevention of Duplicate Implementation**:
- EventEmitter defined once in Task 1.5, used everywhere
- World.query<T>() defined once in Task 1.2, used by all systems
- MeshFactory consolidates all mesh creation in Task 2.7
- SpatialGrid defined once in Task 2.9 collision system
- Factory pattern established early (Task 2.5, extended in 2.8, 3.1, 5.3, 6.1)

## Implementation Considerations

### Principles to Maintain Throughout

1. **ECS Architecture Purity**
   - No logic in components (data only)
   - All behavior in systems
   - World orchestrates system updates
   - Systems query entities, don't store references

2. **Type Safety First**
   - TypeScript strict mode enabled
   - No `any` types except where absolutely necessary (with justification)
   - Type definitions before implementation
   - Circular dependency prevention

3. **Physics Arcade-Game Style**
   - Velocity-based movement (not acceleration-based)
   - Screen wrapping at boundaries
   - Consistent damping (0.99 per frame)
   - Speed clamping to maxSpeed

4. **Performance Constraints**
   - 60 FPS target on mid-range hardware
   - <100 draw calls per frame
   - Spatial grid for collision broad phase (cell size 100 units)
   - Object pooling for projectiles, particles, asteroids

5. **Test-Driven Development**
   - Write failing tests first (Red phase)
   - Minimal implementation to pass tests (Green phase)
   - Refactor while maintaining passing tests (Refactor phase)
   - Unit tests for utilities, components, systems
   - Integration tests at system interaction points
   - E2E tests for user-facing features

6. **Vertical Slice Completeness**
   - Each phase delivers playable value
   - Dependencies managed explicitly
   - No "partial" features between phases
   - Integration verification at each phase boundary

7. **Configuration Management**
   - All magic numbers in gameConfig
   - Physics constants isolated
   - Audio configuration separate
   - Easy tuning without code changes

### Risks and Countermeasures

| Risk | Expected Impact | Probability | Mitigation | Detection |
|------|-----------------|-------------|-----------|-----------|
| **Performance degradation at high entity counts** | High - unplayable at 50+ entities | Medium | Object pooling (Task 2.7), spatial grid (Task 2.9), early profiling (Task 8.1) | FPS monitoring, draw call tracking |
| **Collision detection bugs in edge cases** | Medium - occasional missed/false collisions | Medium | Comprehensive unit tests (Task 2.9), integration tests (Task 8.3), extensive playtesting (Task 8.6) | E2E test failures, gameplay anomalies |
| **WebGPU/WebGL incompatibilities** | Medium - rendering issues on some browsers | Low | Three.js abstraction (Task 2.1), fallback to WebGL 2, cross-browser testing (Task 8.2) | Console errors, visual artifacts |
| **Boss AI too complex** | Medium - difficult to debug and balance | Medium | Start with 2 patterns minimum (Task 6.2), define minimum viable behavior, avoid scope creep | Play-test feedback, complexity metrics |
| **Audio autoplay policy violations** | Low - silent audio on first play | Medium | Defer audio init to user interaction (Task 5.1), resume AudioContext on first input | Console warnings, silent game |
| **Scope creep beyond Design Doc** | High - schedule delays, incomplete phases | Medium | Freeze scope at Design Doc acceptance, track feature requests separately, phase boundaries | Change request log review |
| **Type system complexity** | Low - tooling slowdown, harder refactoring | Low | Modular type definitions (Task 1.3), regular circular dependency checks (Task 8.5) | Type-check duration, dependency graph |

### Mitigation Strategies

1. **Performance Risk**
   - Spatial grid implementation with configurable cell size
   - Object pooling with pre-allocation strategy
   - Three.js built-in frustum culling
   - Draw call analysis in Phase 8 profiling

2. **Collision Risk**
   - Separate broad-phase (spatial) and narrow-phase (circle math)
   - Extensive unit tests for collision math
   - Integration tests for system pipeline
   - Playtesting with boundary/edge scenarios

3. **Cross-browser Risk**
   - WebGPU detection with WebGL 2 fallback
   - Regular testing across Chrome, Firefox, Safari, Edge
   - Feature detection for APIs (localStorage, AudioContext)

4. **Boss Complexity Risk**
   - Minimal viable patterns defined upfront
   - Pattern system allows easy addition/modification
   - Difficulty tuning through configuration

5. **Audio Autoplay Risk**
   - UserInteraction gate before audio playback
   - Graceful degradation if audio unavailable
   - Clear messaging to user about audio requirement

6. **Scope Creep Risk**
   - Design Doc as single source of truth
   - Phase boundaries as hard stops
   - Any new features documented as "Future" in backlogs

### Impact Scope Management

**Allowed Change Scope** (by task):
- Task modifications to own files only
- Extensions to existing interfaces only where specified (e.g., WeaponSystem extends for variants)
- Addition of new event types for new features
- Configuration constant additions

**No-Change Areas** (protected across phases):
- Core ECS interface (World, EntityManager, ComponentStorage)
- Physics calculation engine core algorithm
- Collision detection broad/narrow phase separation
- Event emission/subscription mechanism
- Three.js scene graph hierarchy

**Verification at Integration Points**:
- Phase 1→2: ECS World operational, types compile
- Phase 2→3: Minimal playable game (ship, asteroids, collision)
- Phase 3→4: Complete gameplay loop (weapons, scoring, lives)
- Phase 4→5: Full game session with menus and persistence
- Phase 5→6: Audio and power-ups working, weapons switchable
- Phase 6→7: Boss encounters playable and defeatable
- Phase 7→8: Visual polish complete, QA ready
- Phase 8: All tests passing, performance baseline met

## Task Execution Recommendations

### Parallel Execution Opportunities

Tasks that can execute in parallel (within same phase):
- **Phase 1**: Tasks 1.2, 1.3, 1.4, 1.5 can start after 1.1 completes
- **Phase 2**: Tasks 2.2, 2.3 can execute in parallel; Tasks 2.4-2.9 have sequential dependencies
- **Phase 3**: Tasks 3.1, 3.2 can execute in parallel; 3.3+ sequential
- **Phase 4**: Tasks 4.3-4.6 can execute in parallel after 4.1

### Phase Completion Criteria

Each phase completion requires:
1. All tasks in phase marked complete
2. Phase verification checklist passed (from work plan)
3. No critical bugs reported in playtesting
4. Build succeeds with no errors
5. Unit tests passing (where applicable)
6. Integration point tests passing

### Quality Standards

- **Code Quality**: No Biome lint errors, TypeScript strict mode
- **Test Coverage**: 70%+ statements, branches, functions, lines
- **Performance**: 60 FPS at 50+ entities, <100 draw calls
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Type Safety**: No circular dependencies, strict type checking

---

**Document Version**: 1.0
**Generated**: 2026-01-22
**Status**: Ready for Task Decomposition
