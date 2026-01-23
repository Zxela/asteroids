/**
 * ParticleManager - Particle pool management for visual effects
 *
 * Manages a pool of reusable particles to minimize allocations during gameplay.
 * Particles are used for:
 * - Explosion effects on entity destruction
 * - Thrust trail effects from ship movement
 * - Projectile trail effects
 *
 * Uses object pooling pattern per ADR-0003: Rendering Strategy.
 *
 * @module rendering/ParticleManager
 */

import { Color, Vector3 } from 'three'

/**
 * Particle data structure.
 * Contains all state for a single particle in the pool.
 */
export interface Particle {
  /** Current position in world space */
  position: Vector3
  /** Current velocity (units per second) */
  velocity: Vector3
  /** Remaining lifetime in milliseconds */
  lifetime: number
  /** Maximum lifetime for alpha calculation */
  maxLifetime: number
  /** Particle color */
  color: Color
  /** Particle size (diameter) */
  size: number
  /** Whether this particle is currently in use */
  active: boolean
}

/**
 * Default pool size for particles.
 */
const DEFAULT_POOL_SIZE = 500

/**
 * ParticleManager manages a pool of reusable particles.
 *
 * Key features:
 * - Pre-allocated pool to avoid runtime allocations
 * - Efficient acquire/release cycle
 * - Automatic lifetime management
 *
 * @example
 * ```typescript
 * const particleManager = new ParticleManager(500)
 *
 * // Acquire particle for effect
 * const particle = particleManager.acquireParticle()
 * if (particle) {
 *   particle.position.set(100, 200, 0)
 *   particle.velocity.set(50, 0, 0)
 *   particle.lifetime = 1000
 *   particle.maxLifetime = 1000
 * }
 *
 * // Each frame
 * particleManager.updateParticles(deltaTime)
 *
 * // Get active particles for rendering
 * const active = particleManager.getActiveParticles()
 * ```
 */
export class ParticleManager {
  /** Pool of all particles */
  private particles: Particle[] = []

  /** Stack of available (inactive) particle indices for fast acquisition */
  private availableIndices: number[] = []

  /** Pool size */
  private poolSize: number

  /**
   * Create a ParticleManager with specified pool size.
   *
   * @param poolSize - Number of particles in the pool (default: 500)
   */
  constructor(poolSize: number = DEFAULT_POOL_SIZE) {
    this.poolSize = poolSize
    this.initializePool()
  }

  /**
   * Initialize the particle pool with inactive particles.
   */
  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const particle: Particle = {
        position: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        lifetime: 0,
        maxLifetime: 0,
        color: new Color(1, 1, 1),
        size: 1,
        active: false
      }
      this.particles.push(particle)
      this.availableIndices.push(i)
    }
  }

  /**
   * Get the total pool size.
   *
   * @returns Number of particles in the pool
   */
  getPoolSize(): number {
    return this.poolSize
  }

  /**
   * Acquire a particle from the pool.
   *
   * Returns an inactive particle marked as active, or null if pool is exhausted.
   * The particle's position and velocity are reset to zero.
   *
   * @returns Particle instance or null if pool exhausted
   */
  acquireParticle(): Particle | null {
    if (this.availableIndices.length === 0) {
      return null
    }

    const index = this.availableIndices.pop()
    if (index === undefined) {
      return null
    }

    const particle = this.particles[index]
    if (!particle) {
      return null
    }

    // Reset particle state
    particle.position.set(0, 0, 0)
    particle.velocity.set(0, 0, 0)
    particle.lifetime = 0
    particle.maxLifetime = 0
    particle.color.setRGB(1, 1, 1)
    particle.size = 1
    particle.active = true

    return particle
  }

  /**
   * Release a particle back to the pool.
   *
   * Marks the particle as inactive and returns it to the available pool.
   *
   * @param particle - The particle to release
   */
  releaseParticle(particle: Particle): void {
    if (!particle.active) {
      return // Already released
    }

    particle.active = false

    // Find index and return to available pool
    const index = this.particles.indexOf(particle)
    if (index !== -1) {
      this.availableIndices.push(index)
    }
  }

  /**
   * Update all active particles.
   *
   * Applies velocity to position, decreases lifetime, and releases
   * particles whose lifetime has expired.
   *
   * @param deltaTime - Time since last update in milliseconds
   */
  updateParticles(deltaTime: number): void {
    if (deltaTime === 0) {
      return
    }

    const deltaSeconds = deltaTime / 1000

    for (const particle of this.particles) {
      if (!particle.active) {
        continue
      }

      // Update position based on velocity
      particle.position.x += particle.velocity.x * deltaSeconds
      particle.position.y += particle.velocity.y * deltaSeconds
      particle.position.z += particle.velocity.z * deltaSeconds

      // Decrease lifetime
      particle.lifetime -= deltaTime

      // Release if expired
      if (particle.lifetime <= 0) {
        this.releaseParticle(particle)
      }
    }
  }

  /**
   * Get all currently active particles.
   *
   * @returns Array of active particles (for rendering)
   */
  getActiveParticles(): Particle[] {
    return this.particles.filter((p) => p.active)
  }
}
