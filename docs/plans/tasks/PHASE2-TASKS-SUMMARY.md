# Phase 2: Minimal Playable Game - Task Decomposition Summary

**Date Created**: 2026-01-22
**Phase**: 2 (Minimal Playable Game)
**Tasks Covered**: 2.3 through 2.9
**Task Files Generated**: 7 (tasks 08-14)

## Task Overview

The following tasks decompose Phase 2 work plan items 2.3-2.9 into individual, independently executable task files. Each task follows the TDD (Red-Green-Refactor) approach and includes concrete implementation guidance with code snippets.

### Task List

| Task # | Work Plan # | Title | Dependencies | Est. Days | Size |
|--------|-------------|-------|--------------|-----------|------|
| 08 | 2.3 | Component Definitions | Task 1.3 | 1 | Small (7 files) |
| 09 | 2.4 | Physics System | Task 2.3, 1.4 | 1 | Small (2 files) |
| 10 | 2.5 | Ship Entity | Task 2.3, 2.4 | 0.5 | Small (2 files) |
| 11 | 2.6 | Ship Control | Task 2.2, 2.4, 2.5 | 0.5 | Small (2 files) |
| 12 | 2.7 | Render System | Task 2.1, 2.3, 2.6 | 1.5 | Medium (4 files) |
| 13 | 2.8 | Asteroids | Task 2.3, 2.7 | 1 | Small (3 files) |
| 14 | 2.9 | Collision System | Task 2.3, 2.5, 2.8 | 1.5 | Medium (3 files) |

**Total Estimated Effort**: 6.5-7 days

## Dependency Flow

```
Task 08: Component Definitions
├── Task 09: Physics System
│   ├── Task 10: Ship Entity
│   │   └── Task 11: Ship Control
│   │       └── Task 12: Render System
│   │           ├── Task 13: Asteroids
│   │           │   └── Task 14: Collision System
```

## Key Design Decisions

### 1. Component-Based Architecture (Task 08)
- Pure data containers with minimal logic
- Discriminated by `componentType` property for type safety
- Support for helper methods (e.g., `Health.takeDamage()`, `Player.addScore()`)
- Components: Transform, Velocity, Physics, Collider, Renderable, Health, Player

### 2. Physics System (Task 09)
- Exponential damping: `velocity *= damping^deltaTime`
- Max speed enforcement on vector length
- Screen wrapping (toroidal topology)
- Separated from input handling (clean separation of concerns)

### 3. Ship Entity (Task 10)
- Factory function pattern for entity creation
- 3 lives initially (from gameConfig)
- Sphere collider with radius 20
- Proper configuration of all 7 component types

### 4. Ship Control (Task 11)
- Rotation speed: π rad/s (from gameConfig)
- Acceleration in ship's facing direction
- Forward direction calculated from Z rotation
- Integrated with InputSystem (dependency)

### 5. Render System (Task 12)
- ECS-to-Three.js synchronization point
- Object pooling prepared for particles, projectiles
- Invulnerability flashing: 100ms interval
- Mesh cleanup on entity destruction (prevents memory leaks)

### 6. Asteroid Spawning (Task 13)
- Three sizes: large (30px), medium (20px), small (10px)
- Spawn from screen edges (50 units beyond visible area)
- Wave formula: 3 + (wave-1)*2 asteroids per wave
- Point values: 25/50/100 for large/medium/small

### 7. Collision Detection (Task 14)
- Spatial grid broad-phase (100-unit cells)
- Circle-circle narrow-phase collision
- Layer/mask filtering system (flexible collision rules)
- Performance target: <5ms for 50 entities

## Verification Strategy

### Build Verification (L3)
- `npm run type-check` passes
- `npm run build` succeeds
- No circular dependencies
- All imports resolve correctly

### Test Verification (L2)
- Unit tests created alongside implementation
- Each task includes 10-18 test cases
- Tests verify core functionality in isolation
- Total: 100+ unit tests across Phase 2

### Functional Verification (L1)
- Executed during Phase 2 integration (Task 2-completion)
- Ship visible and controllable
- Asteroids spawn and move
- Collisions detected visually

## Performance Targets

| Metric | Target | Task |
|--------|--------|------|
| Physics system | <1ms/frame | Task 09 |
| Ship control | <0.5ms/frame | Task 11 |
| Render sync | <2ms/frame | Task 12 |
| Collision detect | <5ms/frame (20 entities) | Task 14 |
| Overall | 60 FPS sustained | All |

## Integration Points

### Between Tasks
- Task 08 provides component classes used by all other tasks
- Task 09 (physics) depends on Task 08 (components)
- Task 10 (ship) uses components from Task 08, physics from Task 09
- Task 11 (control) applies forces to Task 10's ship
- Task 12 (render) syncs all entities' components to Three.js
- Task 13 (asteroids) uses components and rendering
- Task 14 (collision) queries all components from Task 08

### With External Systems
- InputSystem: Used by Task 11 (Ship Control)
- SceneManager: Used by Task 12 (Render System)
- EventSystem: Prepared for Task 14 (Collision events)

## Code Quality Criteria

### TypeScript Strict Mode
- All tasks use strict mode enabled
- No implicit `any` types
- Type safety enforced throughout

### Test Coverage
- Unit tests for all public APIs
- Integration tests prepared for Phase 4
- E2E tests execute in Phase 8

### Performance Optimization
- Spatial grid in Task 14 for collision acceleration
- Object pooling in Task 12 prepared for future
- Minimal allocations in hot loops

## Risk Mitigation

### Identified Risks

| Risk | Task | Mitigation |
|------|------|-----------|
| Physics collision edge cases | Task 09 | Comprehensive unit tests with damping scenarios |
| Control responsiveness | Task 11 | Frame-rate independent calculations (deltaTime) |
| Render performance | Task 12 | Object pooling, mesh reuse, proper cleanup |
| Collision false positives | Task 14 | Layer/mask filtering, spatial optimization |
| Memory leaks | All | Proper component/mesh cleanup on entity destruction |

## File Structure Created

```
/home/zxela/asteroids/docs/plans/tasks/
├── work-plan-asteroids-task-08.md      (Component Definitions)
├── work-plan-asteroids-task-09.md      (Physics System)
├── work-plan-asteroids-task-10.md      (Ship Entity)
├── work-plan-asteroids-task-11.md      (Ship Control)
├── work-plan-asteroids-task-12.md      (Render System)
├── work-plan-asteroids-task-13.md      (Asteroids)
├── work-plan-asteroids-task-14.md      (Collision System)
└── PHASE2-TASKS-SUMMARY.md             (This file)
```

## Execution Recommendations

### Sequential Order
1. **Task 08** (Components): Foundation for all others
2. **Task 09** (Physics): Fundamental system
3. **Task 10** (Ship): Player-controlled entity
4. **Task 11** (Control): Input handling
5. **Task 12** (Render): Visualization
6. **Task 13** (Asteroids): Obstacles
7. **Task 14** (Collision): Interaction detection

### Parallel Opportunities
- Task 09 and Task 11 can start once Task 08 completes
- Task 10 can proceed in parallel with Task 09/11
- Task 13 can start once Task 12 is underway

### Testing Strategy
- Each task completes with all unit tests passing
- Integration testing deferred to Phase 2 completion
- E2E testing deferred to Phase 8 (QA)

## Deliverables Summary

### Code Generated (if implemented)
- 30+ TypeScript source files
- 100+ unit test cases
- Component definitions, systems, entity factories
- Utility functions (SpatialGrid, ObjectPool, math)
- Full type safety with strict mode

### Documentation Provided
- 7 comprehensive task files with code snippets
- Implementation guidance with Red-Green-Refactor
- Performance targets and verification methods
- 100+ test case specifications

## Next Steps

1. **Review Tasks 08-14**: Verify completeness and accuracy
2. **Execute Tasks Sequentially**: Follow dependency order above
3. **Verify Phase 2 Completion**: Check all acceptance criteria met
4. **Proceed to Phase 3**: Weapons, scoring, lives system

## References

- Work Plan: `/home/zxela/asteroids/docs/plans/work-plan-asteroids.md`
- Design Doc: `/home/zxela/asteroids/docs/design/design-asteroids.md`
- ADRs: `/home/zxela/asteroids/docs/adr/` (ADR-0001 through ADR-0005)

---

**Document Version**: 1.0
**Created**: 2026-01-22
**Status**: Ready for Implementation
