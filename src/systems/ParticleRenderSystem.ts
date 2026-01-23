/**
 * ParticleRenderSystem - Particle rendering with Three.js
 *
 * Renders particles using Three.js InstancedMesh for performance.
 * Features:
 * - Billboarding (particles always face camera)
 * - Alpha fade over lifetime
 * - Instanced rendering for draw call optimization
 *
 * Following ADR-0003: Rendering Strategy with Three.js.
 *
 * @module systems/ParticleRenderSystem
 */

import * as THREE from 'three'
import type { System, World } from '../ecs/types'
import type { Particle, ParticleManager } from '../rendering/ParticleManager'

/**
 * Default maximum particle count for instanced mesh.
 */
const DEFAULT_MAX_PARTICLES = 500

/**
 * ParticleRenderSystem renders particles using Three.js InstancedMesh.
 *
 * Uses instanced rendering for efficient draw calls (single draw call
 * for all particles) and billboarding for sprite-like appearance.
 *
 * @example
 * ```typescript
 * const particleManager = new ParticleManager(500)
 * const scene = new THREE.Scene()
 * const camera = new THREE.PerspectiveCamera(...)
 *
 * const renderSystem = new ParticleRenderSystem(particleManager, scene, camera)
 *
 * // Each frame
 * renderSystem.update(world, deltaTime)
 * ```
 */
export class ParticleRenderSystem implements System {
  /** Particle pool manager */
  private particleManager: ParticleManager

  /** Three.js scene */
  private scene: THREE.Scene

  /** Three.js camera for billboarding */
  private camera: THREE.Camera

  /** Instanced mesh for particles */
  private instancedMesh: THREE.InstancedMesh

  /** Material for particles */
  private material: THREE.MeshBasicMaterial

  /** Geometry for particle instances */
  private geometry: THREE.PlaneGeometry

  /** Dummy object for matrix calculations */
  private dummy: THREE.Object3D = new THREE.Object3D()

  /** Color instance for setting instance colors */
  private colorInstance: THREE.Color = new THREE.Color()

  /** Maximum particle count */
  private maxParticles: number

  /**
   * Create a ParticleRenderSystem.
   *
   * @param particleManager - The particle pool manager
   * @param scene - Three.js scene to add particles to
   * @param camera - Camera for billboarding calculations
   * @param maxParticles - Maximum number of particles (default: 500)
   */
  constructor(
    particleManager: ParticleManager,
    scene: THREE.Scene,
    camera: THREE.Camera,
    maxParticles: number = DEFAULT_MAX_PARTICLES
  ) {
    this.particleManager = particleManager
    this.scene = scene
    this.camera = camera
    this.maxParticles = maxParticles

    // Create geometry - simple plane quad for each particle
    this.geometry = new THREE.PlaneGeometry(1, 1)

    // Create material with transparency
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxParticles)

    // Enable vertex colors for per-particle coloring
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.maxParticles * 3),
      3
    )

    // Initialize with no visible instances
    this.instancedMesh.count = 0
    this.instancedMesh.frustumCulled = false

    // Add to scene
    this.scene.add(this.instancedMesh)
  }

  /**
   * Update particle rendering.
   *
   * Updates instanced mesh matrices, colors, and alpha based on
   * active particles from the particle manager.
   *
   * @param _world - ECS world (unused)
   * @param _deltaTime - Time since last update (unused - particles update in ParticleManager)
   */
  update(_world: World, _deltaTime: number): void {
    const activeParticles = this.particleManager.getActiveParticles()
    const count = Math.min(activeParticles.length, this.maxParticles)

    // Update each instance
    for (let i = 0; i < count; i++) {
      const particle = activeParticles[i]
      if (particle) {
        this.updateParticleInstance(i, particle)
      }
    }

    // Set visible instance count
    this.instancedMesh.count = count
    this.instancedMesh.instanceMatrix.needsUpdate = true

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }
  }

  /**
   * Update a single particle instance.
   *
   * @param index - Instance index in the mesh
   * @param particle - Particle data
   */
  private updateParticleInstance(index: number, particle: Particle): void {
    // Calculate alpha based on remaining lifetime
    const alpha = this.calculateAlpha(particle)

    // Apply billboarding rotation
    this.applyBillboarding()

    // Set position
    this.dummy.position.copy(particle.position)

    // Set scale based on particle size and alpha for fade effect
    const scale = particle.size * alpha
    this.dummy.scale.set(scale, scale, scale)

    // Update matrix
    this.dummy.updateMatrix()
    this.instancedMesh.setMatrixAt(index, this.dummy.matrix)

    // Set color with alpha
    this.colorInstance.copy(particle.color)

    // Apply color directly to instance color attribute
    if (this.instancedMesh.instanceColor) {
      // Multiply color by alpha for fade effect
      this.instancedMesh.instanceColor.setXYZ(
        index,
        this.colorInstance.r * alpha,
        this.colorInstance.g * alpha,
        this.colorInstance.b * alpha
      )
    }
  }

  /**
   * Calculate particle alpha based on lifetime.
   *
   * @param particle - Particle to calculate alpha for
   * @returns Alpha value 0.0-1.0
   */
  private calculateAlpha(particle: Particle): number {
    if (particle.maxLifetime === 0) {
      return 1.0
    }

    const lifeRatio = particle.lifetime / particle.maxLifetime
    return Math.max(0, Math.min(1, lifeRatio))
  }

  /**
   * Apply billboarding rotation to face camera.
   *
   * Sets the dummy object rotation to face the camera.
   */
  private applyBillboarding(): void {
    // Get camera world quaternion
    this.dummy.quaternion.copy(this.camera.quaternion)
  }

  /**
   * Get the billboarding rotation quaternion.
   *
   * @returns Quaternion to face camera
   */
  getBillboardRotation(): THREE.Quaternion {
    return this.camera.quaternion.clone()
  }

  /**
   * Get the instanced mesh for external access.
   *
   * @returns The Three.js InstancedMesh
   */
  getInstancedMesh(): THREE.InstancedMesh {
    return this.instancedMesh
  }

  /**
   * Clean up resources.
   * Removes instanced mesh from scene and disposes geometry/material.
   */
  dispose(): void {
    this.scene.remove(this.instancedMesh)
    this.geometry.dispose()
    this.material.dispose()
  }
}
