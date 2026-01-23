# Task: Three.js Renderer Setup with WebGPU Support

Metadata:
- Phase: 2 (Minimal Playable Game)
- Dependencies: Task 1.1 (Project Setup), Task 1.4 (Configuration)
- Provides: SceneManager, Game entry point, main.ts
- Size: Small (3 files)
- Estimated Duration: 1.5 days

## Implementation Content

Initialize Three.js WebGPURenderer with fallback to WebGL 2, set up scene, camera, and lighting. Implement main Game orchestrator class and game loop.

## Target Files

- [x] `src/rendering/SceneManager.ts` - Three.js renderer and scene setup
- [x] `src/game/Game.ts` - Main game class and loop orchestration
- [x] `src/main.ts` - Application entry point
- [x] `tests/unit/rendering.test.ts` - Renderer unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase

**Write failing tests** in `tests/unit/rendering.test.ts`:
- [x] SceneManager initializes successfully
- [x] Scene is created with camera
- [x] Renderer is WebGPURenderer or WebGL2Renderer
- [x] Canvas responds to resize events
- [x] Camera is positioned correctly (2.5D gameplay)
- [x] Lighting set up (Directional + Ambient)
- [x] Renderer pixel ratio matches device DPI
- [x] Game loop runs at target FPS
- [x] Fixed timestep maintains consistency

### 2. Green Phase

**Implement renderer and game loop**:

- [x] Create `src/rendering/SceneManager.ts`:
  ```typescript
  import * as THREE from 'three';
  import { gameConfig } from '../config';

  export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.Renderer;
    private width: number;
    private height: number;

    constructor() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);

      // Create camera (2.5D perspective)
      const aspect = this.width / this.height;
      this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000);
      this.camera.position.z = 750; // Position for 2.5D view

      // Setup lighting
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      this.scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      this.scene.add(ambientLight);

      // Create renderer (WebGPU with WebGL 2 fallback)
      this.renderer = this.createRenderer();
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = false; // Disabled for performance

      // Add to DOM
      const canvas = document.getElementById('game') as HTMLCanvasElement;
      if (canvas && canvas instanceof HTMLCanvasElement) {
        canvas.appendChild(this.renderer.domElement);
      }

      // Handle resize
      window.addEventListener('resize', () => this.onWindowResize());
    }

    private createRenderer(): THREE.Renderer {
      // Try WebGPU first
      if ((navigator as any).gpu) {
        try {
          const canvas = document.getElementById('game') as HTMLCanvasElement;
          return new THREE.WebGPURenderer({ canvas });
        } catch (e) {
          console.warn('WebGPU not available, falling back to WebGL2');
        }
      }

      // Fall back to WebGL 2
      const canvas = document.getElementById('game') as HTMLCanvasElement;
      return new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
    }

    private onWindowResize(): void {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.width, this.height);
    }

    public getScene(): THREE.Scene {
      return this.scene;
    }

    public getCamera(): THREE.PerspectiveCamera {
      return this.camera;
    }

    public getRenderer(): THREE.Renderer {
      return this.renderer;
    }

    public render(): void {
      this.renderer.render(this.scene, this.camera);
    }

    public getViewportSize(): { width: number; height: number } {
      return { width: this.width, height: this.height };
    }
  }
  ```

- [x] Create `src/game/Game.ts`:
  ```typescript
  import { World } from '../ecs';
  import { SceneManager } from '../rendering/SceneManager';
  import { gameConfig } from '../config';

  export class Game {
    private world: World;
    private sceneManager: SceneManager;
    private running: boolean = false;
    private lastTime: number = 0;
    private accumulator: number = 0;
    private fixedTimestep: number = 1 / 60; // 60 Hz physics

    constructor() {
      this.world = new World();
      this.sceneManager = new SceneManager();
    }

    public async initialize(): Promise<void> {
      // Initialization logic will be added by subsequent tasks
      // (systems registration, entity creation, etc.)
    }

    public start(): void {
      this.running = true;
      this.lastTime = performance.now();
      this.gameLoop();
    }

    public stop(): void {
      this.running = false;
    }

    public getWorld(): World {
      return this.world;
    }

    public getSceneManager(): SceneManager {
      return this.sceneManager;
    }

    private gameLoop = (): void => {
      if (!this.running) return;

      requestAnimationFrame(this.gameLoop);

      const currentTime = performance.now();
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
      this.lastTime = currentTime;

      // Fixed timestep for physics
      this.accumulator += deltaTime;
      while (this.accumulator >= this.fixedTimestep) {
        this.update(this.fixedTimestep);
        this.accumulator -= this.fixedTimestep;
      }

      // Render at variable rate
      this.sceneManager.render();
    };

    private update(deltaTime: number): void {
      // Update game systems
      this.world.update(deltaTime);
    }
  }
  ```

- [x] Implement `src/main.ts`:
  ```typescript
  import { Game } from './game/Game';

  async function main() {
    const game = new Game();
    await game.initialize();
    game.start();
  }

  // Start game when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main().catch(console.error);
  }
  ```

### 3. Refactor Phase
- [x] Verify WebGPU detection logic is robust
- [x] Ensure canvas sizing handles mobile properly
- [x] Optimize game loop performance
- [ ] Add performance monitoring capability (FPS counter) - deferred to Phase 8

## Completion Criteria

- [x] WebGPURenderer initializes (or falls back to WebGL 2)
- [x] Scene renders without errors
- [x] Canvas responds to window resize
- [x] Game loop runs at target FPS (60)
- [x] Camera positioned correctly for 2.5D gameplay
- [x] Unit tests passing for renderer setup

## Verification Method

**L1: Functional Operation Verification**

```bash
# Build and start dev server
npm run build
npm run dev

# Open browser to http://localhost:5173/
# Visual verification:
# 1. Black canvas appears (empty scene)
# 2. No console errors
# 3. Canvas fills viewport
# 4. Browser DevTools shows stable 60 FPS in Performance tab
# 5. Resize window - canvas resizes smoothly
# 6. Ctrl+Shift+I → Console shows no errors
```

**Unit Tests**:
```bash
npm test -- tests/unit/rendering.test.ts
```

**Performance Baseline**:
```
# Expected results:
# - Frame time: ~16.67ms (60 FPS)
# - Draw calls: <5 (empty scene)
# - Memory: <100MB
```

## Notes

- WebGPU fallback to WebGL 2 for broad browser support
- Fixed timestep for physics determinism (variable render rate)
- 2.5D camera positioned to look down at game plane
- No rendering of entities yet (next tasks)
- Performance monitoring setup ready for Phase 8

## Integration Points

This task enables:
- Task 2.2: Input system (Game class provides update hook)
- Task 2.3: Component definitions (World ready for components)
- Task 2.7: Render system (SceneManager.getScene() for rendering)

## Impact Scope

**Allowed Changes**: Renderer configuration, camera position, lighting setup
**Protected Areas**: World interface (Task 1.2), game loop structure
**Areas Affected**: All rendering tasks depend on SceneManager, Game orchestrates all systems

## Deliverables

- SceneManager with WebGPU/WebGL fallback
- Game class with fixed timestep loop
- Main entry point ready for game initialization
- Ready for Task 2.2 (Input System)
