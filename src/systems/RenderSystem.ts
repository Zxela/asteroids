/**
 * RenderSystem - ECS-to-Three.js synchronization
 *
 * Syncs ECS component data to Three.js meshes:
 * - Creates meshes for entities with Renderable component
 * - Updates mesh position/rotation/scale from Transform component
 * - Manages mesh visibility based on Renderable.visible
 * - Handles invulnerability flashing and emissive pulse from Health component
 * - Updates boss material colors based on phase
 * - Rotates power-up meshes continuously
 * - Cleans up meshes when entities are destroyed
 *
 * Per Task 7.4: Visual Polish Pass
 * Following ADR-0003: Rendering Strategy with Three.js.
 */

import * as THREE from 'three'
import { Boss, Health, PowerUp, Renderable, Transform } from '../components'
import { gameConfig } from '../config/gameConfig'
import { componentClass } from '../ecs/types'
import type { EntityId, System, World } from '../ecs/types'
import { MeshFactory } from '../rendering/MeshFactory'

// Type assertions for component classes to work with ECS type system
// Runtime behavior is correct; this bridges TypeScript's stricter type checking
const TransformClass = componentClass(Transform)
const RenderableClass = componentClass(Renderable)
const HealthClass = componentClass(Health)
const BossClass = componentClass(Boss)
const PowerUpClass = componentClass(PowerUp)

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
  private pulseElapsedTime: Map<EntityId, number> = new Map()
  private powerUpRotation: Map<EntityId, number> = new Map()

  // Flash interval for invulnerability effect (100ms per Design Doc)
  private static readonly FLASH_INTERVAL = 100

  // Boss phase colors per Task 7.4
  private static readonly BOSS_PHASE_COLORS = {
    1: 0x0088ff, // Blue
    2: 0xff8800, // Orange
    3: 0xff0000 // Red
  }

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

      // Handle visibility with invulnerability flashing and emissive pulse
      // Check invulnerabilityTimer > 0 as specified in Task 3.6
      const health = world.getComponent(entityId, HealthClass)
      if (health && health.invulnerabilityTimer > 0) {
        this.updateFlashingVisibility(mesh, entityId, deltaTime)
        // Only pulse ship entities (meshType === 'ship')
        if (renderable.meshType === 'ship') {
          this.updateShipInvulnerabilityPulse(mesh, entityId, deltaTime)
        }
      } else {
        mesh.visible = renderable.visible
        this.lastFlashTime.delete(entityId)
        this.pulseElapsedTime.delete(entityId)
        // Reset emissive intensity to default when not invulnerable (only for ship)
        if (renderable.meshType === 'ship') {
          this.resetShipEmissiveIntensity(mesh)
        }
      }

      // Update boss visual effects (phase-based color)
      const boss = world.getComponent(entityId, BossClass)
      if (boss) {
        this.updateBossVisuals(mesh, boss)
      }

      // Update power-up visual effects (rotation)
      const powerUp = world.getComponent(entityId, PowerUpClass)
      if (powerUp) {
        this.updatePowerUpVisuals(mesh, entityId, deltaTime)
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
   * Update ship emissive intensity pulse during invulnerability.
   * Per Task 7.4: 5Hz frequency, intensity oscillates between 0.5 and 1.0
   * Formula: 0.75 + 0.25 * sin(elapsedTime * 2 * PI * frequency)
   * This gives range [0.5, 1.0] since sin ranges [-1, 1]
   */
  private updateShipInvulnerabilityPulse(
    mesh: THREE.Object3D,
    entityId: EntityId,
    deltaTime: number
  ): void {
    if (!(mesh instanceof THREE.Mesh)) return

    const material = mesh.material as THREE.MeshStandardMaterial
    if (material.emissiveIntensity === undefined) return

    // Track elapsed time for pulse calculation
    const elapsedTime = (this.pulseElapsedTime.get(entityId) ?? 0) + deltaTime / 1000 // Convert to seconds
    this.pulseElapsedTime.set(entityId, elapsedTime)

    // Calculate pulsing intensity: 0.75 + 0.25 * sin(time * 2 * PI * frequency)
    // This oscillates between 0.5 (when sin=-1) and 1.0 (when sin=1)
    const frequency = gameConfig.visualTheme.animationSpeeds.invulnerabilityPulse
    const pulseIntensity = 0.75 + 0.25 * Math.sin(elapsedTime * 2 * Math.PI * frequency)

    material.emissiveIntensity = pulseIntensity
  }

  /**
   * Reset ship emissive intensity to default value.
   */
  private resetShipEmissiveIntensity(mesh: THREE.Object3D): void {
    if (!(mesh instanceof THREE.Mesh)) return

    const material = mesh.material as THREE.MeshStandardMaterial
    if (material.emissiveIntensity === undefined) return

    // Reset to default medium intensity
    material.emissiveIntensity = gameConfig.visualTheme.emissiveIntensity.medium
  }

  /**
   * Update boss material color based on current phase.
   * Per Task 7.4:
   * - Phase 1: Blue (#0088FF)
   * - Phase 2: Orange (#FF8800)
   * - Phase 3: Red (#FF0000)
   */
  private updateBossVisuals(mesh: THREE.Object3D, boss: Boss): void {
    if (!(mesh instanceof THREE.Mesh)) return

    const material = mesh.material as THREE.MeshStandardMaterial
    if (!material.color) return

    // Get color for current phase (default to phase 1 if invalid)
    const phaseKey = Math.min(Math.max(boss.phase, 1), 3) as 1 | 2 | 3
    const color = RenderSystem.BOSS_PHASE_COLORS[phaseKey]

    // Update both color and emissive to match phase
    material.color.setHex(color)
    material.emissive.setHex(color)
  }

  /**
   * Update power-up mesh rotation.
   * Per Task 7.4: Rotate at PI/2 radians per second (90 degrees/second)
   */
  private updatePowerUpVisuals(mesh: THREE.Object3D, entityId: EntityId, deltaTime: number): void {
    // Get current rotation or initialize
    const currentRotation = this.powerUpRotation.get(entityId) ?? mesh.rotation.y

    // Calculate new rotation: add (PI/2 * deltaTime/1000) radians
    const rotationSpeed = gameConfig.visualTheme.animationSpeeds.powerUpRotation
    const newRotation = currentRotation + rotationSpeed * (deltaTime / 1000)

    // Apply rotation to mesh
    mesh.rotation.y = newRotation
    this.powerUpRotation.set(entityId, newRotation)
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

    // Remove from mesh map and associated tracking maps
    for (const id of toRemove) {
      this.meshMap.delete(id)
      this.lastFlashTime.delete(id)
      this.pulseElapsedTime.delete(id)
      this.powerUpRotation.delete(id)
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
