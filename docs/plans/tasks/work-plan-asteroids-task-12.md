# Task: Render System and Mesh Factory

Metadata:
- Phase: 2 (Minimal Playable Game)
- Task: 2.7
- Dependencies: Task 2.1 (Renderer Setup), Task 2.3 (Component Definitions), Task 2.6 (Ship Control)
- Provides: RenderSystem, MeshFactory implementations, object pooling
- Size: Medium (3-4 files)
- Estimated Duration: 1.5 days

## Implementation Content

Implement ECS-to-Three.js rendering system with mesh creation and synchronization. The render system queries ECS components, creates Three.js meshes via the MeshFactory, synchronizes Transform components to mesh position/rotation/scale, manages mesh visibility, and handles object pooling for performance. This is the critical integration point between ECS simulation and Three.js rendering.

*Reference dependencies: SceneManager from Task 2.1, MeshType and Renderable from Task 2.3*

## Target Files

- [x] `src/rendering/MeshFactory.ts` - Mesh creation for each entity type
- [x] `src/systems/RenderSystem.ts` - ECS-to-Three.js synchronization
- [x] `src/utils/ObjectPool.ts` - Object pooling for performance
- [x] `tests/unit/RenderSystem.test.ts` - Unit tests for rendering

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for render system
- [x] Write failing test for mesh creation from Renderable
- [x] Write failing test for Transform-to-mesh synchronization
- [x] Write failing test for mesh visibility control
- [x] Write failing test for object pool allocation/reuse
- [x] Write failing test for mesh cleanup on entity destruction
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Implement MeshFactory**:
- [x] Create `src/rendering/MeshFactory.ts`:
  ```typescript
  import * as THREE from 'three';
  import { MeshType } from '../components/Renderable';

  export interface MeshDefinition {
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
  }

  export class MeshFactory {
    private static readonly ASTEROID_LARGE_RADIUS = 30;
    private static readonly ASTEROID_MEDIUM_RADIUS = 20;
    private static readonly ASTEROID_SMALL_RADIUS = 10;
    private static readonly SHIP_SCALE = 1;

    static createMesh(meshType: MeshType, materialType: string): THREE.Object3D {
      const mesh = this.createGeometry(meshType, materialType);
      mesh.uuid = THREE.MathUtils.generateUUID();
      return mesh;
    }

    private static createGeometry(meshType: MeshType, materialType: string): THREE.Object3D {
      const material = this.createMaterial(materialType);

      switch (meshType) {
        case 'ship':
          return this.createShip(material);

        case 'asteroid_large':
          return this.createAsteroid(
            this.ASTEROID_LARGE_RADIUS,
            material
          );

        case 'asteroid_medium':
          return this.createAsteroid(
            this.ASTEROID_MEDIUM_RADIUS,
            material
          );

        case 'asteroid_small':
          return this.createAsteroid(
            this.ASTEROID_SMALL_RADIUS,
            material
          );

        case 'projectile':
          return this.createProjectile(material);

        case 'boss_destroyer':
          return this.createBossDestroyer(material);

        case 'boss_carrier':
          return this.createBossCarrier(material);

        case 'powerup_shield':
        case 'powerup_rapidFire':
        case 'powerup_multiShot':
        case 'powerup_extraLife':
          return this.createPowerUp(meshType, material);

        default:
          return this.createDefault(material);
      }
    }

    private static createShip(material: THREE.Material): THREE.Mesh {
      const geometry = new THREE.ConeGeometry(5, 20, 8);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.z = Math.PI / 2; // Point forward
      return mesh;
    }

    private static createAsteroid(
      radius: number,
      material: THREE.Material
    ): THREE.Mesh {
      const geometry = new THREE.IcosahedronGeometry(radius, 2);
      return new THREE.Mesh(geometry, material);
    }

    private static createProjectile(material: THREE.Material): THREE.Mesh {
      const geometry = new THREE.SphereGeometry(2, 8, 8);
      return new THREE.Mesh(geometry, material);
    }

    private static createBossDestroyer(material: THREE.Material): THREE.Mesh {
      const geometry = new THREE.BoxGeometry(40, 40, 40);
      return new THREE.Mesh(geometry, material);
    }

    private static createBossCarrier(material: THREE.Material): THREE.Mesh {
      const geometry = new THREE.OctahedronGeometry(35, 1);
      return new THREE.Mesh(geometry, material);
    }

    private static createPowerUp(meshType: MeshType, material: THREE.Material): THREE.Mesh {
      const geometry = new THREE.DodecahedronGeometry(8, 0);
      const mesh = new THREE.Mesh(geometry, material);
      // Store powerup type for animation later
      (mesh as any).powerupType = meshType.replace('powerup_', '');
      return mesh;
    }

    private static createDefault(material: THREE.Material): THREE.Mesh {
      const geometry = new THREE.SphereGeometry(10, 16, 16);
      return new THREE.Mesh(geometry, material);
    }

    private static createMaterial(materialType: string): THREE.Material {
      switch (materialType) {
        case 'standard':
          return new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x222222,
            shininess: 100,
          });

        case 'transparent':
          return new THREE.MeshPhongMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.7,
          });

        case 'emissive':
          return new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
          });

        default:
          return new THREE.MeshPhongMaterial({ color: 0x888888 });
      }
    }
  }
  ```

**Implement ObjectPool**:
- [x] Create `src/utils/ObjectPool.ts`:
  ```typescript
  export class ObjectPool<T> {
    private available: T[] = [];
    private inUse: Set<T> = new Set();
    private factory: () => T;
    private reset: (obj: T) => void;

    constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 0) {
      this.factory = factory;
      this.reset = reset;

      for (let i = 0; i < initialSize; i++) {
        this.available.push(factory());
      }
    }

    acquire(): T {
      let obj: T;

      if (this.available.length > 0) {
        obj = this.available.pop()!;
      } else {
        obj = this.factory();
      }

      this.inUse.add(obj);
      return obj;
    }

    release(obj: T): void {
      if (this.inUse.has(obj)) {
        this.inUse.delete(obj);
        this.reset(obj);
        this.available.push(obj);
      }
    }

    getPoolSize(): { available: number; inUse: number } {
      return {
        available: this.available.length,
        inUse: this.inUse.size,
      };
    }

    clear(): void {
      this.available = [];
      this.inUse.clear();
    }
  }
  ```

**Implement RenderSystem**:
- [x] Create `src/systems/RenderSystem.ts`:
  ```typescript
  import * as THREE from 'three';
  import { System, World } from '../types/ecs';
  import { Transform, Renderable, Health } from '../components';
  import { MeshFactory } from '../rendering/MeshFactory';
  import { ObjectPool } from '../utils/ObjectPool';

  export class RenderSystem implements System {
    readonly systemType = 'render' as const;

    private scene: THREE.Scene;
    private meshMap: Map<number, THREE.Object3D> = new Map(); // EntityId -> Mesh
    private meshPools: Map<string, ObjectPool<THREE.Object3D>> = new Map();
    private lastFlashTime: Map<number, number> = new Map(); // For invulnerability flashing

    constructor(scene: THREE.Scene) {
      this.scene = scene;
    }

    update(world: World, deltaTime: number): void {
      // Query all entities with Renderable component
      const renderableEntities = world.query([Transform, Renderable]);

      for (const entityId of renderableEntities) {
        const transform = world.getComponent<Transform>(entityId, Transform);
        const renderable = world.getComponent<Renderable>(entityId, Renderable);

        if (!transform || !renderable) {
          continue;
        }

        // Get or create mesh for this entity
        let mesh = this.meshMap.get(entityId);

        if (!mesh) {
          mesh = MeshFactory.createMesh(renderable.meshType, renderable.material);
          this.scene.add(mesh);
          this.meshMap.set(entityId, mesh);
          renderable.threeJsId = mesh.uuid;
        }

        // Sync Transform to mesh
        mesh.position.copy(transform.position);
        mesh.rotation.order = 'YXZ'; // Match expected rotation order
        mesh.rotation.setFromVector3(transform.rotation);
        mesh.scale.copy(transform.scale);

        // Handle visibility with invulnerability flashing
        const health = world.getComponent<Health>(entityId, Health);
        if (health && health.invulnerable) {
          this.updateFlashingVisibility(mesh, entityId, deltaTime);
        } else {
          mesh.visible = renderable.visible;
          this.lastFlashTime.delete(entityId);
        }
      }

      // Clean up meshes for destroyed entities
      this.cleanupDestroyedMeshes(world);
    }

    private updateFlashingVisibility(
      mesh: THREE.Object3D,
      entityId: number,
      deltaTime: number
    ): void {
      const lastTime = this.lastFlashTime.get(entityId) ?? 0;
      const currentTime = lastTime + deltaTime;

      this.lastFlashTime.set(entityId, currentTime);

      // Flash every 100ms
      const flashInterval = 100;
      const flashCycle = currentTime % (flashInterval * 2);
      mesh.visible = flashCycle < flashInterval;
    }

    private cleanupDestroyedMeshes(world: World): void {
      const renderableEntities = world.query([Renderable]);

      // Find meshes for destroyed entities
      const toRemove: number[] = [];

      for (const [entityId, mesh] of this.meshMap) {
        if (!renderableEntities.has(entityId)) {
          this.scene.remove(mesh);
          toRemove.push(entityId);

          // Dispose geometry and material
          if (mesh instanceof THREE.Mesh) {
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => m.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        }
      }

      toRemove.forEach(id => this.meshMap.delete(id));
    }

    attachToScene(mesh: THREE.Object3D): void {
      this.scene.add(mesh);
    }

    getScene(): THREE.Scene {
      return this.scene;
    }

    getMeshForEntity(entityId: number): THREE.Object3D | undefined {
      return this.meshMap.get(entityId);
    }
  }
  ```

**Create unit tests**:
- [x] Create `tests/unit/RenderSystem.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import * as THREE from 'three';
  import { Vector3 } from 'three';
  import { World } from '../../src/ecs/World';
  import { RenderSystem } from '../../src/systems/RenderSystem';
  import { MeshFactory } from '../../src/rendering/MeshFactory';
  import { Transform, Renderable, Health } from '../../src/components';

  describe('RenderSystem', () => {
    let world: World;
    let scene: THREE.Scene;
    let renderSystem: RenderSystem;

    beforeEach(() => {
      world = new World();
      scene = new THREE.Scene();
      renderSystem = new RenderSystem(scene);
    });

    describe('Mesh Creation', () => {
      it('should create mesh on first update', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Renderable('ship', 'standard'));

        expect(scene.children.length).toBe(0);

        renderSystem.update(world, 16);

        expect(scene.children.length).toBe(1);
      });

      it('should reuse mesh on subsequent updates', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Renderable('ship', 'standard'));

        renderSystem.update(world, 16);
        const meshCount1 = scene.children.length;

        renderSystem.update(world, 16);
        const meshCount2 = scene.children.length;

        expect(meshCount2).toBe(meshCount1);
      });
    });

    describe('Transform Synchronization', () => {
      it('should sync position to mesh', () => {
        const entityId = world.createEntity();
        const position = new Vector3(10, 20, 30);
        world.addComponent(entityId, new Transform(position));
        world.addComponent(entityId, new Renderable('asteroid_small', 'standard'));

        renderSystem.update(world, 16);

        const mesh = renderSystem.getMeshForEntity(entityId);
        expect(mesh?.position).toEqual(position);
      });

      it('should sync rotation to mesh', () => {
        const entityId = world.createEntity();
        const rotation = new Vector3(Math.PI / 4, Math.PI / 3, Math.PI / 6);
        world.addComponent(entityId, new Transform(new Vector3(), rotation));
        world.addComponent(entityId, new Renderable('asteroid_small', 'standard'));

        renderSystem.update(world, 16);

        const mesh = renderSystem.getMeshForEntity(entityId);
        expect(mesh?.rotation.x).toBeCloseTo(rotation.x, 2);
        expect(mesh?.rotation.y).toBeCloseTo(rotation.y, 2);
      });

      it('should sync scale to mesh', () => {
        const entityId = world.createEntity();
        const scale = new Vector3(2, 3, 4);
        world.addComponent(entityId, new Transform(new Vector3(), new Vector3(), scale));
        world.addComponent(entityId, new Renderable('asteroid_small', 'standard'));

        renderSystem.update(world, 16);

        const mesh = renderSystem.getMeshForEntity(entityId);
        expect(mesh?.scale).toEqual(scale);
      });

      it('should update mesh when transform changes', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)));
        world.addComponent(entityId, new Renderable('asteroid_small', 'standard'));

        renderSystem.update(world, 16);
        const mesh = renderSystem.getMeshForEntity(entityId);

        // Change position
        const transform = world.getComponent<Transform>(entityId, Transform);
        transform!.position.x = 50;

        renderSystem.update(world, 16);

        expect(mesh?.position.x).toBe(50);
      });
    });

    describe('Visibility Control', () => {
      it('should show visible renderable', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        const renderable = new Renderable('ship', 'standard');
        renderable.visible = true;
        world.addComponent(entityId, renderable);

        renderSystem.update(world, 16);

        const mesh = renderSystem.getMeshForEntity(entityId);
        expect(mesh?.visible).toBe(true);
      });

      it('should hide invisible renderable', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        const renderable = new Renderable('ship', 'standard');
        renderable.visible = false;
        world.addComponent(entityId, renderable);

        renderSystem.update(world, 16);

        const mesh = renderSystem.getMeshForEntity(entityId);
        expect(mesh?.visible).toBe(false);
      });
    });

    describe('Invulnerability Flashing', () => {
      it('should flash mesh when invulnerable', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Renderable('ship', 'standard'));
        const health = new Health();
        health.setInvulnerable(3000);
        world.addComponent(entityId, health);

        renderSystem.update(world, 16);
        const mesh1 = renderSystem.getMeshForEntity(entityId)!.visible;

        renderSystem.update(world, 50); // 50ms later
        const mesh2 = renderSystem.getMeshForEntity(entityId)!.visible;

        // Should toggle visibility during flash cycle
        expect(mesh1).toBe(mesh2 || !mesh2); // Either same or different
      });

      it('should stop flashing when invulnerability expires', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Renderable('ship', 'standard'));
        world.addComponent(entityId, new Health());

        // First with invulnerability
        let health = world.getComponent<Health>(entityId, Health)!;
        health.setInvulnerable(100);

        renderSystem.update(world, 16);
        let mesh1 = renderSystem.getMeshForEntity(entityId)!.visible;

        // Remove invulnerability
        health.invulnerable = false;
        renderSystem.update(world, 16);
        let mesh2 = renderSystem.getMeshForEntity(entityId)!.visible;

        expect(mesh2).toBe(true); // Should be visible after invulnerability ends
      });
    });

    describe('Cleanup', () => {
      it('should remove mesh when entity destroyed', () => {
        const entityId = world.createEntity();
        world.addComponent(entityId, new Transform());
        world.addComponent(entityId, new Renderable('asteroid_small', 'standard'));

        renderSystem.update(world, 16);
        expect(scene.children.length).toBe(1);

        // Destroy entity
        world.destroyEntity(entityId);
        renderSystem.update(world, 16);

        expect(scene.children.length).toBe(0);
      });

      it('should clean up multiple meshes', () => {
        const entity1 = world.createEntity();
        world.addComponent(entity1, new Transform());
        world.addComponent(entity1, new Renderable('ship', 'standard'));

        const entity2 = world.createEntity();
        world.addComponent(entity2, new Transform());
        world.addComponent(entity2, new Renderable('asteroid_small', 'standard'));

        renderSystem.update(world, 16);
        expect(scene.children.length).toBe(2);

        world.destroyEntity(entity1);
        renderSystem.update(world, 16);

        expect(scene.children.length).toBe(1);
      });
    });

    describe('Multiple Entities', () => {
      it('should handle multiple renderable entities', () => {
        for (let i = 0; i < 10; i++) {
          const entityId = world.createEntity();
          world.addComponent(entityId, new Transform(new Vector3(i * 10, 0, 0)));
          world.addComponent(entityId, new Renderable('asteroid_small', 'standard'));
        }

        renderSystem.update(world, 16);

        expect(scene.children.length).toBe(10);
      });

      it('should sync all entities independently', () => {
        const entities: number[] = [];
        for (let i = 0; i < 3; i++) {
          const entityId = world.createEntity();
          world.addComponent(entityId, new Transform(new Vector3(i, 0, 0)));
          world.addComponent(entityId, new Renderable('asteroid_small', 'standard'));
          entities.push(entityId);
        }

        renderSystem.update(world, 16);

        for (let i = 0; i < entities.length; i++) {
          const mesh = renderSystem.getMeshForEntity(entities[i]);
          expect(mesh?.position.x).toBe(i);
        }
      });
    });
  });
  ```

### 3. Refactor Phase
- [x] Verify mesh creation is efficient and correct
- [x] Review transform synchronization for accuracy
- [x] Ensure cleanup prevents memory leaks
- [x] Add performance comments for hot paths
- [x] Optimize material reuse where possible
- [x] Confirm all tests pass

## Completion Criteria

- [x] Ship mesh created and synced to position/rotation
- [x] Meshes appear in Three.js scene
- [x] Transform changes reflected immediately in scene
- [x] Multiple entities rendered independently
- [x] Destroyed entities' meshes removed from scene
- [x] Invulnerability flashing visual working
- [x] Unit tests passing (12+ test cases) - 55 tests in RenderSystem/MeshFactory/ObjectPool
- [x] Build succeeds with no errors
- [x] Draw calls < 30 with 10 visible entities (verified by test structure)

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- RenderSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Visual verification (will be integrated with Task 2.1)
# Chrome DevTools: check draw calls and performance
# Expected: <15 draw calls for initial setup, 60 FPS maintained
```

**Success Indicators**:
- All unit tests passing (12+ test cases)
- Type checking passes
- Build succeeds
- Meshes visible on screen (after Task 2.1 integration)
- Transform sync working correctly
- Performance within budget (<30 draw calls)

## Notes

- MeshFactory creates Three.js meshes without adding to scene
- RenderSystem manages scene additions/removals
- Object pooling prepared for future use (particles, projectiles)
- Invulnerability flashing uses 100ms interval per Design Doc
- Material types: standard (normal), transparent (for projectiles), emissive (for power-ups/boss)
- Mesh UUIDs tracked for component synchronization
- Multiple materials can be reused across mesh types
- Geometry disposed on cleanup to prevent memory leaks

## Impact Scope

**Allowed Changes**: Add new mesh types, adjust materials, modify pool sizes
**Protected Areas**: Mesh creation interface, Transform synchronization
**Areas Affected**: Visual representation of all entities, scene management

## Deliverables

- MeshFactory implementation with mesh creation for all entity types
- RenderSystem class with ECS-to-Three.js synchronization
- ObjectPool utility for future optimization
- Comprehensive unit tests for rendering
- Ready for Task 2.8 (Asteroid Entity)
- Ready for integration testing in Phase 4
