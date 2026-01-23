# 3D Asteroids Game - Test Suite

This directory contains the test suite for the 3D Asteroids game, organized by test type.

## Test Structure

```
tests/
├── e2e/
│   └── asteroids.e2e.test.ts       # End-to-End user journey tests (15 tests)
├── integration/
│   └── asteroids.int.test.ts       # System component integration tests (3 tests)
├── unit/                            # [To be created during implementation]
│   ├── ecs/
│   ├── systems/
│   └── utils/
├── TEST_GENERATION_REPORT.md        # Detailed generation methodology and coverage
└── README.md                         # This file
```

## Test Types and Scope

### E2E Tests (`tests/e2e/asteroids.e2e.test.ts`)

**Purpose**: Verify critical user journeys end-to-end through complete game scenarios

**Test Count**: 15 E2E test skeletons

**Key User Journeys Covered**:
1. **Game Launch & Menu** - Menu display, Play button, initial game state
2. **Core Gameplay** - Ship control, asteroid spawning, shooting, collision
3. **Wave Progression** - Asteroid destruction, wave transitions, difficulty scaling
4. **Damage & Recovery** - Ship collision, life loss, respawn invulnerability
5. **Power-ups** - Collection, effect application, timer management
6. **Boss Encounters** - Wave 5 spawn, health bar, attack patterns
7. **Scoring** - Size-based points, leaderboard submission
8. **Game Over** - Final score display, name entry, persistence
9. **Pause/Resume** - Game state freezing, seamless continuation
10. **Weapon Variants** - Laser beam energy management, spread shot patterns

**Implementation Timing**: Execute after Phase 4 (complete game loop functional)

### Integration Tests (`tests/integration/asteroids.int.test.ts`)

**Purpose**: Verify system component interactions within the game architecture

**Test Count**: 3 integration test skeletons

**System Interactions Covered**:
1. **INT-1**: System pipeline coordination (Input → Physics → Collision)
2. **INT-2**: Collision detection performance and broad-phase optimization
3. **INT-3**: Render system ECS synchronization (Transform sync to Three.js)

**Implementation Timing**: Execute during Phase 2-3 (after ECS core and systems)

### Unit Tests (To be created)

**Scope**: Individual function and component validation (will be created during implementation)

**Target Coverage**: 70%+ code coverage of core logic

**Focus Areas**:
- ECS World operations (create, destroy, query)
- Physics calculations (velocity, damping, collision math)
- State machine transitions
- Scoring calculations
- Power-up effect logic

## Running Tests

### All Tests
```bash
npm run test
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Integration Tests Only
```bash
npm run test:integration
```

### Unit Tests Only
```bash
npm run test:unit
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Skeleton Format

All E2E and integration tests follow a consistent skeleton format for consistency and clarity:

### E2E Test Structure

```typescript
// AC: "[Original design doc AC text]"
// User Journey: [Step-by-step user interaction path]
// ROI: [0-100] | Business Value: [0-10] | Frequency: [0-10]
// Behavior: [Trigger] → [Process] → [Observable Result]
// Observable Result: [What user should see]
// @category: e2e
// @dependency: full-system
// @complexity: high | medium | low
it.todo('[Test ID]: [Human-readable test name]')
```

### Integration Test Structure

```typescript
// AC: "[Original design doc AC text]"
// System: [Component interactions]
// ROI: [0-100] | Business Value: [0-10] | Frequency: [0-10]
// Behavior: [Input] → [System processes] → [Observable output]
// Verification items:
//   1. [Specific assertion target]
//   2. [Specific assertion target]
// @category: core-functionality
// @dependency: [System names]
// @complexity: high | medium | low
it.todo('[Test ID]: [Test name]')
```

## Test Traceability

All tests are **directly traced to Design Doc acceptance criteria** (ACs).

### AC-to-Test Mapping

Each test comment includes:
- **AC**: Full original AC text from design document
- **ROI Score**: Business impact and coverage priority (0-100)
- **User Journey**: Step-by-step flow the test covers
- **Behavior Description**: The specific behavioral sequence being verified
- **Observable Result**: What changes should be visible to user

### AC Coverage

- **Total ACs in Design Doc**: 40+
- **ACs in E2E/INT Scope**: 35
- **ACs with Test Coverage**: 30 (87%)
- **Uncovered ACs**: 5 (unit-level implementation details)

See `TEST_GENERATION_REPORT.md` for detailed AC coverage map.

## Test Execution Order

Tests are designed to execute sequentially, with some dependencies:

### E2E Execution Order
1. **E2E-1** (Menu → Play) → prerequisite for all gameplay tests
2. **E2E-5** (Ship control) → prerequisite for E2E-8, E2E-10
3. **E2E-6** (Asteroid spawn) → prerequisite for E2E-7, E2E-13
4. **E2E-7, E2E-8** (Destruction mechanics) → enable E2E-13 (scoring)
5. **E2E-2** (Wave progression) → depends on destruction working
6. **E2E-10** (Damage & respawn) → can run in parallel
7. **E2E-11** (Power-ups) → depends on asteroid destruction
8. **E2E-12** (Boss) → depends on wave system reaching wave 5
9. **E2E-4** (Game Over) → terminal state, can run after any loss
10. **E2E-3** (Pause/Resume) → can run during any Playing state
11. **E2E-9** (Projectile lifetime) → edge case, independent
12. **E2E-14** (Leaderboard) → depends on Game Over state
13. **E2E-15** (Laser weapon) → advanced feature, independent

### Integration Execution Order
1. **INT-1** (System pipeline) → prerequisite for verifying other systems
2. **INT-3** (Render sync) → depends on working system pipeline
3. **INT-2** (Collision perf) → depends on collision system functional

## Test Metadata Reference

### ROI Scoring Formula
```
ROI = (Business Value × 10 + User Frequency × 10 + Legal × 100) / (Complexity × 5)
```

### Categories
- **e2e**: End-to-end user journey
- **core-functionality**: Critical game mechanic
- **integration**: Component interaction
- **edge-case**: Boundary condition
- **ux**: User experience feedback

### Complexity Levels
- **Low**: Single system, simple verification (<16ms)
- **Medium**: 2-3 systems, moderate state management
- **High**: 4+ systems, complex state coordination

### Dependencies
- **full-system**: All game systems required (E2E tests)
- **[System names]**: Specific systems being tested (INT tests)
- **none**: No external dependencies

## Implementation Guidelines

### Converting Skeletons to Implementation

Each `it.todo()` test skeleton should be implemented following this pattern:

```typescript
it('[Test ID]: [Test name]', async () => {
  // Arrange: Set up initial game state
  const game = createGame()
  game.start()

  // Act: Perform user actions or system operations
  simulateInput(game, 'W', 100) // Thrust for 100ms

  // Assert: Verify observable results
  expect(game.ship.position).toBeDefined()
  expect(game.ship.velocity.length()).toBeGreaterThan(0)
})
```

### Test Implementation Checklist

- [ ] Skeleton comment preserved (AC traceability)
- [ ] Arrange phase sets up required game state
- [ ] Act phase simulates user input or system behavior
- [ ] Assert phase verifies observable result
- [ ] Test name matches behavior being verified
- [ ] No mocking of core ECS components (INT tests)
- [ ] Performance assertions included where relevant
- [ ] Test runs independently (no state from prior tests)

## Vitest Framework Integration

Tests use **Vitest** test framework with these utilities:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Test Suite', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('test case', () => {
    expect(actual).toBe(expected)
  })
})
```

### Mock Helpers
- `vi.fn()`: Create mock function
- `vi.mock()`: Mock module
- `vi.spyOn()`: Spy on function

### Async Test Support
```typescript
it('async test', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

## Performance Benchmarks

### E2E Test Performance Targets
- Game launch to playable: < 2 seconds
- Frame rate during gameplay: 60 FPS
- Input-to-action latency: < 16ms (1 frame)

### Integration Test Performance
- System pipeline cycle: < 16ms
- Collision detection: < 5ms (for 50 entities)
- Render system sync: < 2ms

## Coverage Goals

| Metric | Target | Target Met |
|--------|--------|-----------|
| E2E Tests | 10-15 | 15 ✓ |
| Integration Tests | 2-3 | 3 ✓ |
| Unit Tests | 70%+ coverage | [TBD at implementation] |
| AC Coverage | 80%+ | 87% ✓ |
| Critical User Journeys | 100% | 100% ✓ |

## Documentation References

- **Design Doc**: `docs/design/design-asteroids.md`
- **Generation Report**: `TEST_GENERATION_REPORT.md`
- **Framework**: Vitest (https://vitest.dev/)
- **Three.js**: https://threejs.org/docs/

## Notes for Test Authors

### Key Testing Principles (from Design Doc)

1. **Behavior-First**: Focus on user-observable outcomes, not implementation details
2. **System Integration**: E2E and INT tests verify multiple components working together
3. **Performance**: Include timing assertions for frame-critical operations
4. **Independence**: Each test should run standalone (no cross-test state)
5. **Clarity**: Test names and comments should explain what behavior is being verified

### Common Pitfalls to Avoid

- ❌ Mocking the entire game (defeats purpose of E2E)
- ❌ Testing implementation details (e.g., internal component structure)
- ❌ Creating cross-test dependencies (shared game state)
- ❌ Ignoring timing/performance (can pass in dev, fail in CI)
- ❌ Testing third-party libraries (Three.js, Howler.js)
- ✓ Focus on user-observable behavior
- ✓ Mock only external I/O (Three.js rendering, Howler audio)
- ✓ Use realistic game scenarios
- ✓ Include performance assertions for critical paths

## Future Enhancements

As the game features expand, these tests should be added:

1. **Online Features**: If leaderboard becomes server-backed
2. **Mobile Support**: If touch controls are added
3. **Difficulty Modes**: If Easy/Normal/Hard settings introduced
4. **Advanced Weapons**: If new weapon types added beyond initial 4
5. **Multiplayer**: If co-op or PvP modes added (will require E2E redesign)

See `TEST_GENERATION_REPORT.md` for detailed discussion of future test enhancements.

---

**Last Updated**: 2026-01-22
**Generator**: Claude Code (integration-e2e-testing skill)
**Status**: Test skeletons complete, awaiting implementation
