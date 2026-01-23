# Phase 7 Task Decomposition Complete

## Summary

Plan Document: work-plan-asteroids.md
Phase: 7 (Visual Polish)
Overall Design Document: _PHASE-7-DECOMPOSITION-SUMMARY.md
Number of Decomposed Tasks: 4

## Overall Optimization Results

### Common Processing
- **ParticleManager**: Single 500-particle pool shared across all effects (explosions, thrust, trails)
- **Event System**: Centralized event listeners in visual effect systems (no duplicate subscriptions)
- **Visual Configuration**: Color palette and visual constants centralized in gameConfig
- **Instanced Mesh Rendering**: Single draw call pattern for all particles (performance optimization)
- **Three.js Scene Access**: Coordinated through SceneManager (no direct scene manipulation)

### Impact Scope Management
- **Allowed Changes**: Particle counts, emission rates, colors, material properties, shake intensity
- **Protected Areas**: ECS World interface, rendering pipeline, event emission mechanism, game loop timing
- **Boundaries**: Visual polish only - no gameplay logic changes, no new features

### Implementation Order Optimization
- **Parallel Opportunity**: Tasks 7.1 (Particle System) and 7.2 (Screen Shake) can execute in parallel (no dependencies)
- **Sequential Requirements**: 7.3 (Trails) depends on 7.1 (ParticleManager), 7.4 (Polish) depends on all previous tasks
- **Critical Path**: 7.1 → 7.3 → 7.4 (3 days with parallelization of 7.2)

## Generated Task Files

### Task 7.1: Particle System - Explosions and Effects
**File**: work-plan-asteroids-task-37.md
**Overview**: Implement pooled particle system with explosion and thrust emitters
**Size**: Medium (4-5 files)
**Duration**: 1 day
**Deliverables**:
- ParticleManager with 500-particle object pool
- ParticleEmitterSystem for explosion and thrust spawning
- ParticleRenderSystem with instanced mesh rendering
- Explosion particles (20-50 count, size-dependent duration 0.5-2s)
- Thrust trail particles (50/second emission rate)

### Task 7.2: Screen Shake Camera Effect
**File**: work-plan-asteroids-task-38.md
**Overview**: Implement collision-based screen shake for impact feedback
**Size**: Small (2-3 files)
**Duration**: 0.5 days
**Deliverables**:
- CameraEffectSystem with collision event listeners
- Magnitude scaling by impact severity (ship-asteroid: 5, ship-boss: 7, projectile-asteroid: 2)
- Shake stacking for multiple simultaneous impacts
- 100ms duration with exponential decay
- Configurable intensity via VisualConfig

### Task 7.3: Projectile Trails
**File**: work-plan-asteroids-task-39.md
**Overview**: Add colored trails to projectiles for weapon distinction
**Size**: Small (2-3 files)
**Duration**: 0.5 days
**Deliverables**:
- Projectile trail emission in ParticleEmitterSystem
- Weapon-type-based colors (red: default, blue: spread, cyan: laser, green: homing)
- 20/second emission rate with 100-200ms lifetime
- Reuses ParticleManager pool from Task 7.1

### Task 7.4: Visual Polish Pass
**File**: work-plan-asteroids-task-40.md
**Overview**: Final material, lighting, and theme consistency polish
**Size**: Medium (3-5 files)
**Duration**: 1 day
**Deliverables**:
- Enhanced materials with emissive properties for all entity types
- Dynamic visual effects (ship pulse, boss color shift, power-up rotation)
- Refined lighting (DirectionalLight + AmbientLight)
- Cyberpunk/neon visual theme consistency
- Visual theme constants in configuration
- HUD styling consistency

## Execution Order

### Recommended Sequence

**Day 1 (Parallel Execution)**:
- Execute Task 7.1 (Particle System) - Primary developer
- Execute Task 7.2 (Screen Shake) - Secondary developer OR same developer if solo

**Day 2**:
- Execute Task 7.3 (Projectile Trails) - Depends on 7.1 completion

**Day 3**:
- Execute Task 7.4 (Visual Polish Pass) - Final polish after all effects ready

### Dependency Graph
```
Task 7.1 (Particle System) ────┬───> Task 7.3 (Trails) ───┐
                                │                          ├──> Task 7.4 (Polish)
Task 7.2 (Screen Shake) ────────┴──────────────────────────┘
```

## Task Characteristics Summary

| Task | Size | Files | Est. Duration | Dependencies | Verification |
|------|------|-------|---------------|--------------|--------------|
| 7.1 | Medium | 4-5 | 1 day | 2.7, 3.3 | L2 + L1 |
| 7.2 | Small | 2-3 | 0.5 days | 2.1, 2.9 | L2 + L1 |
| 7.3 | Small | 2-3 | 0.5 days | 3.1, 7.1 | L2 + L1 |
| 7.4 | Medium | 3-5 | 1 day | 7.1, 7.2, 7.3 | L2 + L1 |

**Total Files**: 11-16
**Total Duration**: 2-3 days (with parallelization)
**Total Test Cases**: 50+ across all tasks

## Performance Targets

All tasks must maintain:
- **60 FPS**: Consistent frame rate with all visual effects active
- **Draw Calls**: < 100 per frame (instanced mesh optimization)
- **Particle Rendering**: < 5ms per frame
- **Screen Shake**: < 0.5ms per frame overhead
- **Memory**: Particle pool pre-allocated (no runtime allocations)

## Quality Checklist

### Per-Task Requirements
- [ ] Unit tests passing (10-20+ per task)
- [ ] Build succeeds with no errors
- [ ] Type checking passes (strict mode)
- [ ] No Biome lint errors
- [ ] Visual verification in gameplay
- [ ] Performance targets met (60 FPS)

### Phase Completion Requirements
- [ ] All 4 tasks complete and verified
- [ ] All 50+ unit tests passing
- [ ] Visual theme consistent (cyberpunk/neon)
- [ ] No visual artifacts (Z-fighting, clipping)
- [ ] Performance maintained (60 FPS with all effects)
- [ ] Player feedback clear (explosions, shake, trails)
- [ ] Code quality baseline met
- [ ] Ready for Phase 8 (Quality Assurance)

## Integration Points

### With Previous Phases
- **Phase 2**: RenderSystem (2.7), SceneManager (2.1), CollisionSystem (2.9)
- **Phase 3**: Projectile Entity (3.1), Asteroid Destruction (3.3)
- **Phase 4-6**: All gameplay features complete (visual polish adds no gameplay changes)

### With Next Phase
- **Phase 8 (QA)**: Visual effects verified in E2E tests, performance profiling, cross-browser visual testing

## Risk Mitigation Summary

| Risk | Mitigation |
|------|-----------|
| Particle pool insufficient | Pool capacity analysis (500 = 98% at peak), expansion logic available |
| Performance degradation | Object pooling, instanced mesh rendering, particle count limits |
| Visual theme inconsistency | Centralized color palette, visual audit in Task 7.4 |
| Screen shake too intense | Configurable intensity, magnitude tuning, playtesting |
| Trail colors not distinct | High-contrast palette (red/blue/cyan/green) |

## Next Steps

1. **Start with Task 7.1**: Particle System (foundation for trails)
2. **Optionally Parallel**: Execute Task 7.2 (Screen Shake) simultaneously if resources available
3. **Continue with Task 7.3**: Projectile Trails (after 7.1 complete)
4. **Finish with Task 7.4**: Visual Polish Pass (after all effects ready)
5. **Verify Phase Completion**: Run all tests, visual verification, performance check
6. **Proceed to Phase 8**: Quality Assurance (performance optimization, cross-browser testing, E2E tests)

## Notes

- **Inline Context**: All task files include inline context (interfaces, patterns, constraints) to prevent executor re-fetching Design Docs
- **Similar Implementations**: Each task references 2-3 similar existing files for pattern guidance
- **TDD Format**: All tasks follow Red-Green-Refactor cycle with failing tests first
- **Verification Method**: All tasks include L2 (unit tests) + L1 (functional gameplay verification)
- **Completion Criteria**: Specific, measurable criteria for each task (not subjective)
- **Impact Scope**: Clearly defined allowed changes and protected areas for each task

---

**Document Version**: 1.0
**Generated**: 2026-01-23
**Status**: Ready for Execution
**Estimated Phase Duration**: 2-3 days (with optimal parallelization)
**Total Tasks**: 4
**Total Estimated Test Cases**: 50+
**Performance Target**: 60 FPS maintained
