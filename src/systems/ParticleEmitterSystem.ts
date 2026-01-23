/**
 * ParticleEmitterSystem - Particle spawning on game events
 *
 * Listens for game events and spawns appropriate particle effects:
 * - asteroidDestroyed -> explosion particles (20-50, radial spread)
 * - shipThrust -> thrust trail particles (50/second rate)
 *
 * Duration based on asteroid size:
 * - Small: 500ms
 * - Medium: 1500ms
 * - Large: 2000ms
 *
 * Following ADR-0001: ECS architecture for game systems.
 *
 * @module systems/ParticleEmitterSystem
 */

import { Color, Vector3 } from 'three'
import type { System, World } from '../ecs/types'
import type { ParticleManager } from '../rendering/ParticleManager'
import type { AsteroidSize } from '../types/components'
import type { AsteroidDestroyedEventData, ShipThrustEventData } from '../types/events'
import type { EventEmitter } from '../utils/EventEmitter'

/**
 * Event types used by the particle emitter.
 */
interface ParticleEvents extends Record<string, unknown> {
  asteroidDestroyed: AsteroidDestroyedEventData
  shipThrust: ShipThrustEventData
}

/**
 * Explosion duration based on asteroid size (in milliseconds).
 */
const EXPLOSION_DURATION: Record<AsteroidSize, number> = {
  small: 500,
  medium: 1500,
  large: 2000
}

/**
 * Explosion particle configuration.
 */
const EXPLOSION_CONFIG = {
  minParticles: 20,
  maxParticles: 50,
  minSpeed: 50,
  maxSpeed: 200,
  minSize: 2,
  maxSize: 8
}

/**
 * Thrust particle configuration.
 */
const THRUST_CONFIG = {
  rate: 50, // particles per second
  minSpeed: 50,
  maxSpeed: 100,
  minSize: 2,
  maxSize: 4,
  minLifetime: 200,
  maxLifetime: 400,
  shipRearOffset: 10 // distance behind ship center
}

/**
 * Explosion colors (orange, red, yellow).
 */
const EXPLOSION_COLORS: Color[] = [
  new Color(0xff8c00), // Orange
  new Color(0xff0000), // Red
  new Color(0xffff00) // Yellow
]

/**
 * Thrust colors (blue, cyan).
 */
const THRUST_COLORS: Color[] = [
  new Color(0x0000ff), // Blue
  new Color(0x00ffff) // Cyan
]

/**
 * Pending explosion event data.
 */
interface PendingExplosion {
  position: Vector3
  size: AsteroidSize
}

/**
 * ParticleEmitterSystem spawns particles based on game events.
 *
 * @example
 * ```typescript
 * const particleManager = new ParticleManager(500)
 * const eventEmitter = new EventEmitter()
 * const emitterSystem = new ParticleEmitterSystem(particleManager, eventEmitter)
 *
 * // In game loop
 * emitterSystem.update(world, deltaTime)
 * ```
 */
export class ParticleEmitterSystem implements System {
  /** Required components for this system */
  readonly requiredComponents: string[] = []

  /** Particle pool manager */
  private particleManager: ParticleManager

  /** Pending explosion events to process */
  private pendingExplosions: PendingExplosion[] = []

  /** Current thrust state */
  private thrustActive = false
  private thrustPosition: Vector3 = new Vector3()
  private thrustDirection: Vector3 = new Vector3()

  /** Accumulated time for thrust particle emission */
  private thrustAccumulator = 0

  /**
   * Create a ParticleEmitterSystem.
   *
   * @param particleManager - The particle pool manager
   * @param eventEmitter - Event emitter to subscribe to
   */
  constructor(particleManager: ParticleManager, eventEmitter: EventEmitter<ParticleEvents>) {
    this.particleManager = particleManager
    this.subscribeToEvents(eventEmitter)
  }

  /**
   * Subscribe to relevant game events.
   */
  private subscribeToEvents(eventEmitter: EventEmitter<ParticleEvents>): void {
    eventEmitter.on('asteroidDestroyed', (data) => {
      this.pendingExplosions.push({
        position: data.position.clone(),
        size: data.size
      })
    })

    eventEmitter.on('shipThrust', (data) => {
      this.thrustActive = data.active
      this.thrustPosition.copy(data.position)
      this.thrustDirection.copy(data.direction)
    })
  }

  /**
   * Check if thrust emitter is currently active.
   *
   * @returns True if thrust is active
   */
  isThrustActive(): boolean {
    return this.thrustActive
  }

  /**
   * Update particle emitters.
   *
   * Processes pending explosion events and emits thrust particles.
   *
   * @param _world - ECS world (unused)
   * @param deltaTime - Time since last update in milliseconds
   */
  update(_world: World, deltaTime: number): void {
    // Process pending explosions
    this.processExplosions()

    // Emit thrust particles if active
    if (this.thrustActive) {
      this.emitThrustParticles(deltaTime)
    }
  }

  /**
   * Process all pending explosion events.
   */
  private processExplosions(): void {
    for (const explosion of this.pendingExplosions) {
      this.spawnExplosion(explosion.position, explosion.size)
    }

    // Clear processed explosions
    this.pendingExplosions = []
  }

  /**
   * Spawn explosion particles at the given position.
   *
   * @param position - Center of explosion
   * @param size - Asteroid size for duration calculation
   */
  private spawnExplosion(position: Vector3, size: AsteroidSize): void {
    const duration = EXPLOSION_DURATION[size]
    const particleCount =
      EXPLOSION_CONFIG.minParticles +
      Math.floor(
        Math.random() * (EXPLOSION_CONFIG.maxParticles - EXPLOSION_CONFIG.minParticles + 1)
      )

    for (let i = 0; i < particleCount; i++) {
      const particle = this.particleManager.acquireParticle()
      if (!particle) {
        break // Pool exhausted
      }

      // Set position at explosion center
      particle.position.copy(position)

      // Random radial velocity
      const angle = Math.random() * Math.PI * 2
      const speed =
        EXPLOSION_CONFIG.minSpeed +
        Math.random() * (EXPLOSION_CONFIG.maxSpeed - EXPLOSION_CONFIG.minSpeed)

      particle.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed, 0)

      // Set lifetime
      particle.lifetime = duration
      particle.maxLifetime = duration

      // Random explosion color
      const colorIndex = Math.floor(Math.random() * EXPLOSION_COLORS.length)
      const selectedColor = EXPLOSION_COLORS[colorIndex]
      if (selectedColor) {
        particle.color.copy(selectedColor)
      }

      // Random size
      particle.size =
        EXPLOSION_CONFIG.minSize +
        Math.random() * (EXPLOSION_CONFIG.maxSize - EXPLOSION_CONFIG.minSize)
    }
  }

  /**
   * Emit thrust particles based on time accumulator.
   *
   * @param deltaTime - Time since last update in milliseconds
   */
  private emitThrustParticles(deltaTime: number): void {
    // Accumulate time
    this.thrustAccumulator += deltaTime

    // Calculate how many particles to emit
    const particleInterval = 1000 / THRUST_CONFIG.rate // ms per particle
    const particlesToEmit = Math.floor(this.thrustAccumulator / particleInterval)

    if (particlesToEmit > 0) {
      this.thrustAccumulator -= particlesToEmit * particleInterval

      for (let i = 0; i < particlesToEmit; i++) {
        this.spawnThrustParticle()
      }
    }
  }

  /**
   * Spawn a single thrust particle.
   */
  private spawnThrustParticle(): void {
    const particle = this.particleManager.acquireParticle()
    if (!particle) {
      return // Pool exhausted
    }

    // Calculate spawn position (behind ship)
    const rearDirection = this.thrustDirection.clone().normalize()

    // Handle zero direction vector
    if (rearDirection.lengthSq() === 0) {
      rearDirection.set(-1, 0, 0)
    }

    const spawnPosition = this.thrustPosition
      .clone()
      .sub(rearDirection.multiplyScalar(THRUST_CONFIG.shipRearOffset))

    particle.position.copy(spawnPosition)

    // Velocity opposite to facing direction with some randomness
    const speed =
      THRUST_CONFIG.minSpeed + Math.random() * (THRUST_CONFIG.maxSpeed - THRUST_CONFIG.minSpeed)

    // Add slight angle variation
    const angleVariation = (Math.random() - 0.5) * 0.3 // +/- 0.15 radians

    const baseDirection = this.thrustDirection.clone().normalize()
    if (baseDirection.lengthSq() === 0) {
      baseDirection.set(1, 0, 0)
    }

    const baseAngle = Math.atan2(baseDirection.y, baseDirection.x)
    const finalAngle = baseAngle + Math.PI + angleVariation // Opposite direction

    particle.velocity.set(Math.cos(finalAngle) * speed, Math.sin(finalAngle) * speed, 0)

    // Random lifetime
    const lifetime =
      THRUST_CONFIG.minLifetime +
      Math.random() * (THRUST_CONFIG.maxLifetime - THRUST_CONFIG.minLifetime)

    particle.lifetime = lifetime
    particle.maxLifetime = lifetime

    // Random thrust color (blue/cyan)
    const colorIndex = Math.floor(Math.random() * THRUST_COLORS.length)
    const selectedColor = THRUST_COLORS[colorIndex]
    if (selectedColor) {
      particle.color.copy(selectedColor)
    }

    // Random size
    particle.size =
      THRUST_CONFIG.minSize + Math.random() * (THRUST_CONFIG.maxSize - THRUST_CONFIG.minSize)
  }
}
