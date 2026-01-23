# ADR-0002: Physics Approach

## Status

Proposed

## Context

The 3D Asteroids game requires physics for:
- Ship movement (thrust, rotation, momentum)
- Asteroid movement (linear velocity, optional rotation)
- Projectile trajectories
- Collision detection between all entity types
- Screen wrapping (toroidal topology)

Despite 3D visuals, gameplay occurs on a 2D plane (classic Asteroids mechanics). This "2.5D" nature means full 3D physics simulation is unnecessary and potentially wasteful.

Performance is critical: the game must maintain 60 FPS with potentially 50+ active entities (asteroids, projectiles, particles).

## Decision

### Decision Details

| Item | Content |
|------|---------|
| **Decision** | Implement custom arcade-style physics tailored to 2.5D gameplay |
| **Why now** | Physics approach dictates component design and system architecture |
| **Why this** | Custom physics eliminates WASM overhead and provides exact control over game feel |
| **Known unknowns** | Whether edge cases (many simultaneous collisions) will require optimization |
| **Kill criteria** | If physics bugs consume >25% of development time, consider Rapier migration |

## Rationale

Custom arcade physics provides:
- Zero external dependencies and WASM bundle overhead
- Direct control over game "feel" (acceleration curves, damping, bounce behavior)
- Simplified 2D collision math despite 3D rendering
- Perfect fit for classic Asteroids mechanics (no gravity, simple momentum)

### Options Considered

1. **Rapier (WASM)**
   - Pros: High performance via WASM SIMD; deterministic simulation; feature-rich (joints, constraints, continuous collision detection); 2-5x faster than 2024 versions; active development with 2026 roadmap
   - Cons: WASM adds ~500KB+ to bundle; initialization overhead; overkill for 2D plane physics; learning curve for API; requires async loading

2. **cannon-es (Pure JavaScript)**
   - Pros: Pure JS, no WASM complexity; reasonable performance for moderate entity counts; familiar API patterns; community maintained fork
   - Cons: Full 3D physics unnecessary for 2.5D game; performance ceiling lower than Rapier; less actively developed than Rapier

3. **Custom Arcade Physics (Selected)**
   - Pros: Zero dependencies and minimal bundle impact; complete control over game feel; optimized specifically for game requirements; simple 2D math with 3D position output; predictable performance characteristics; easy to debug and tune
   - Cons: Must implement collision detection from scratch; no advanced features (joints, constraints) if needed later; potential bugs in edge cases

## Consequences

### Positive Consequences

- Bundle size remains small (no physics library overhead)
- Game feel tunable without fighting library abstractions
- Collision system designed exactly for game needs (circles/spheres only)
- Performance predictable without WASM initialization concerns
- Physics code fully testable as pure functions

### Negative Consequences

- Must implement and test collision detection algorithms
- No built-in continuous collision detection (tunneling at extreme speeds)
- Advanced physics features require manual implementation if needed

### Neutral Consequences

- Physics system becomes a first-class ECS system
- Velocity and acceleration as separate components for flexibility
- Screen wrapping handled at physics level, not rendering

## Implementation Guidance

- Use circle-circle collision for all entities (radius-based bounding)
- Implement spatial partitioning (grid or quadtree) for collision broad phase
- Separate movement system from collision system for clarity
- Design velocity damping as configurable parameter for game feel tuning
- Screen wrapping: when entity exits bounds, reposition on opposite side
- Consider swept collision detection for fast projectiles if tunneling occurs

## Related Information

- [Three.js Forum: Rapier vs Cannon Performance](https://discourse.threejs.org/t/rapier-vs-cannon-performance/53475)
- [Rapier 2025 Review and 2026 Goals](https://dimforge.com/blog/2026/01/09/the-year-2025-in-dimforge/)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)
