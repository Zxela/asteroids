# ADR-0003: Rendering Strategy

## Status

Proposed

## Context

The 3D Asteroids game requires a rendering strategy that:
- Delivers modern 3D visuals with particle effects, trails, and smooth animations
- Maintains 60 FPS on mid-range hardware (2020+ desktop/laptop)
- Works across all major browsers (Chrome, Firefox, Safari, Edge)
- Minimizes draw calls through instancing and batching (target: <100 draw calls)
- Supports efficient rendering of many similar objects (asteroids, projectiles, particles)

Browser support for WebGPU has reached mainstream adoption with Safari 26 (September 2025), making WebGPU viable for production applications while requiring fallback for older browsers.

## Decision

### Decision Details

| Item | Content |
|------|---------|
| **Decision** | Use Three.js WebGPURenderer with automatic WebGL 2 fallback |
| **Why now** | Renderer choice affects all visual systems and shader approaches |
| **Why this** | WebGPURenderer auto-fallback provides best of both worlds: modern performance where available, universal compatibility everywhere |
| **Known unknowns** | Whether specific visual effects require different implementations per backend |
| **Kill criteria** | If fallback behavior causes visual inconsistencies requiring >2 separate code paths |

## Rationale

Three.js WebGPURenderer (since r171):
- Targets WebGPU by default for 2-10x performance improvements on compatible browsers
- Automatically falls back to WebGL 2 when WebGPU unavailable
- Uses TSL (Three Shader Language) for backend-agnostic shader authoring
- Zero-config imports in modern Three.js versions
- Unified API means single codebase for both backends

### Options Considered

1. **WebGPU-Only**
   - Pros: Maximum performance; access to compute shaders; modern API design
   - Cons: Excludes older browsers; no graceful degradation; limits audience reach

2. **WebGL 2-Only (WebGLRenderer)**
   - Pros: Maximum compatibility; mature and stable; extensive community resources
   - Cons: Misses WebGPU performance benefits; older API; limited future development focus

3. **Three.js WebGPURenderer with Auto-Fallback (Selected)**
   - Pros: Best performance on modern browsers; automatic fallback to WebGL 2; single codebase via TSL; future-proof as WebGPU adoption grows; zero-config since r171; officially supported path forward for Three.js
   - Cons: Async initialization required (`await renderer.init()`); some advanced WebGPU features not available in fallback mode; newer approach with less community examples

## Consequences

### Positive Consequences

- Users with WebGPU browsers get best possible performance
- Users with older browsers still play the game (WebGL 2 fallback)
- Single codebase reduces maintenance burden
- TSL shaders work on both backends
- Instancing and batching work efficiently on both backends
- Future-proof for Three.js development direction

### Negative Consequences

- Async renderer initialization adds startup complexity
- Some WebGPU-specific features unavailable in fallback mode
- Fewer community examples for WebGPURenderer vs WebGLRenderer
- Testing required on both WebGPU and WebGL paths

### Neutral Consequences

- **Requires Three.js r171 or later** for stable WebGPU renderer with auto-fallback
  - Import path: `import { WebGPURenderer } from 'three/webgpu'`
  - For r170 or earlier, WebGPURenderer was experimental and required different setup
- Shader development uses TSL instead of raw GLSL/WGSL
- Performance monitoring should track which backend is active

## Implementation Guidance

- Initialize renderer asynchronously: `await renderer.init()` before first render
- Use Three.js instanced meshes for asteroids and particles
- Implement object pooling for frequently created/destroyed entities (projectiles, particles)
- Use `renderer.info` to monitor draw calls and performance
- Keep lighting simple: ambient + single directional (avoid many point lights)
- Test on both WebGPU and WebGL 2 browsers during development
- Consider adding backend indicator in debug mode for testing

## Related Information

- [Three.js WebGPURenderer Documentation](https://threejs.org/docs/pages/WebGPURenderer.html)
- [100 Three.js Best Practices (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [What's New in Three.js (2026)](https://www.utsubo.com/blog/threejs-2026-what-changed)
- [Three WebGPU Renderer Tutorial](https://sbcode.net/threejs/webgpu-renderer/)
- [WebGL vs WebGPU Explained](https://threejsroadmap.com/blog/webgl-vs-webgpu-explained)
