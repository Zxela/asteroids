/**
 * ParticleEmitter Component
 *
 * Represents a particle emitter attached to an entity.
 * Used to track emitter state and configuration.
 *
 * @module components/ParticleEmitter
 */

import type { ParticleEmitterComponent, ParticleEmitterType } from '../types/components'

/**
 * ParticleEmitter component class - particle effect properties.
 *
 * Tracks the type, activation state, emission rate, and particle
 * lifetime for a particle emitter attached to an entity.
 *
 * @example
 * ```typescript
 * // Thrust emitter for ship
 * const thrustEmitter = new ParticleEmitter('thrust', true, 50, 400)
 *
 * // Explosion emitter (one-shot)
 * const explosionEmitter = new ParticleEmitter('explosion', true, 100, 2000)
 * ```
 */
export class ParticleEmitter implements ParticleEmitterComponent {
  readonly type = 'particleEmitter' as const

  /** Type of particle effect */
  emitterType: ParticleEmitterType

  /** Whether the emitter is currently active */
  active: boolean

  /** Emission rate in particles per second */
  rate: number

  /** Particle lifetime in milliseconds */
  lifetime: number

  /**
   * Create a ParticleEmitter component.
   *
   * @param emitterType - Type of emitter ('thrust', 'explosion', 'trail', 'shield')
   * @param active - Whether emitter is active (default: false)
   * @param rate - Particles per second (default: 50)
   * @param lifetime - Particle lifetime in ms (default: 1000)
   */
  constructor(emitterType: ParticleEmitterType, active = false, rate = 50, lifetime = 1000) {
    this.emitterType = emitterType
    this.active = active
    this.rate = rate
    this.lifetime = lifetime
  }
}
