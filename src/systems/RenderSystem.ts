/**
 * RenderSystem - ECS-to-Three.js synchronization
 *
 * Syncs ECS component data to Three.js meshes:
 * - Creates meshes for entities with Renderable component
 * - Updates mesh position/rotation/scale from Transform component
 * - Manages mesh visibility based on Renderable.visible
 * - Handles invulnerability flashing from Health component
 * - Cleans up meshes when entities are destroyed
 *
 * Following ADR-0003: Rendering Strategy with Three.js.
 */

import * as THREE from 'three'
import { Health, Renderable, Transform } from '../components'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'
import { MeshFactory } from '../rendering/MeshFactory'

// Type assertions for component classes to work with ECS type system
// Runtime behavior is correct; this bridges TypeScript's stricter type checking
const TransformClass = Transform as unknown as ComponentClass<Transform>
const RenderableClass = Renderable as unknown as ComponentClass<Renderable>
const HealthClass = Health as unknown as ComponentClass<Health>

/**
 * RenderSystem syncs ECS entities with Three.js scene objects.
 *
 * @example
 * ```typescript
 * const scene = sceneManager.getScene();
 * const renderSystem = new RenderSystem(scene);
 * world.registerSystem(renderSystem);
 *
 * // In game loop
 * renderSystem.update(world, deltaTime);
 * ```
 */
export class RenderSystem implements System {
  private scene: THREE.Scene
  private meshMap: Map<EntityId, THREE.Object3D> = new Map()
  private lastFlashTime: Map<EntityId, number> = new Map()

  // Flash interval for invulnerability effect (100ms per Design Doc)
  private static readonly FLASH_INTERVAL = 100

  /**
   * Create a RenderSystem.
   *
   * @param scene - The Three.js scene to add meshes to
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  /**
   * Update all renderable entities, syncing transforms and handling visibility.
   *
   * @param world - The ECS world instance
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  update(world: World, deltaTime: number): void {
    // Query all entities with Transform and Renderable components
    const renderableEntities = world.query(TransformClass, RenderableClass)

    for (const entityId of renderableEntities) {
      const transform = world.getComponent(entityId, TransformClass)
      const renderable = world.getComponent(entityId, RenderableClass)

      if (!transform || !renderable) {
        continue
      }

      // Get or create mesh for this entity
      let mesh = this.meshMap.get(entityId)

      if (!mesh) {
        mesh = MeshFactory.createMesh(renderable.meshType, renderable.material)
        this.scene.add(mesh)
        this.meshMap.set(entityId, mesh)
        // Store the Three.js uuid for component synchronization
        renderable.objectId = mesh.uuid
      }

      // Sync Transform component to mesh
      mesh.position.copy(transform.position)
      mesh.rotation.order = 'XYZ'
      mesh.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z)
      mesh.scale.copy(transform.scale)

      // Handle visibility with invulnerability flashing
      const health = world.getComponent(entityId, HealthClass)
      if (health?.invulnerable) {
        this.updateFlashingVisibility(mesh, entityId, deltaTime)
      } else {
        mesh.visible = renderable.visible
        this.lastFlashTime.delete(entityId)
      }
    }

    // Clean up meshes for destroyed entities
    this.cleanupDestroyedMeshes(world)
  }

  /**
   * Update mesh visibility with flashing effect for invulnerability.
   * Toggles visibility every FLASH_INTERVAL ms.
   */
  private updateFlashingVisibility(
    mesh: THREE.Object3D,
    entityId: EntityId,
    deltaTime: number
  ): void {
    const lastTime = this.lastFlashTime.get(entityId) ?? 0
    const currentTime = lastTime + deltaTime

    this.lastFlashTime.set(entityId, currentTime)

    // Flash every FLASH_INTERVAL ms (toggle visibility)
    const flashCycle = currentTime % (RenderSystem.FLASH_INTERVAL * 2)
    mesh.visible = flashCycle < RenderSystem.FLASH_INTERVAL
  }

  /**
   * Remove meshes for entities that no longer have Renderable component
   * or have been destroyed.
   */
  private cleanupDestroyedMeshes(world: World): void {
    const renderableEntities = new Set(world.query(RenderableClass))

    // Find meshes for destroyed/removed entities
    const toRemove: EntityId[] = []

    for (const [entityId, mesh] of this.meshMap) {
      if (!renderableEntities.has(entityId)) {
        // Remove mesh from scene
        this.scene.remove(mesh)

        // Dispose geometry and material to prevent memory leaks
        if (mesh instanceof THREE.Mesh) {
          mesh.geometry?.dispose()
          if (Array.isArray(mesh.material)) {
            for (const m of mesh.material) {
              m.dispose()
            }
          } else if (mesh.material) {
            mesh.material.dispose()
          }
        }

        toRemove.push(entityId)
      }
    }

    // Remove from mesh map
    for (const id of toRemove) {
      this.meshMap.delete(id)
      this.lastFlashTime.delete(id)
    }
  }

  /**
   * Get the Three.js scene.
   *
   * @returns The scene managed by this system
   */
  getScene(): THREE.Scene {
    return this.scene
  }

  /**
   * Get the mesh associated with an entity.
   *
   * @param entityId - The entity to get mesh for
   * @returns The Three.js Object3D or undefined if not found
   */
  getMeshForEntity(entityId: EntityId): THREE.Object3D | undefined {
    return this.meshMap.get(entityId)
  }

  /**
   * Manually attach a mesh to the scene.
   * Used for non-ECS managed objects.
   *
   * @param mesh - The mesh to attach
   */
  attachToScene(mesh: THREE.Object3D): void {
    this.scene.add(mesh)
  }
}
