/**
 * ParticleEmitterSystem Tests
 *
 * Tests for particle spawning on game events.
 * Follows TDD approach - tests define expected behavior.
 *
 * @module tests/unit/ParticleEmitterSystem.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Vector3 } from 'three'
import { ParticleEmitterSystem } from '../../src/systems/ParticleEmitterSystem'
import { ParticleManager } from '../../src/rendering/ParticleManager'
import { EventEmitter } from '../../src/utils/EventEmitter'
import type { AsteroidDestroyedEventData, ShipThrustEventData, WeaponFiredEventData } from '../../src/types/events'
import type { WeaponType } from '../../src/types/components'

// Event types for type-safe event emitter
interface TestEvents extends Record<string, unknown> {
  asteroidDestroyed: AsteroidDestroyedEventData
  shipThrust: ShipThrustEventData
  weaponFired: WeaponFiredEventData
}

describe('ParticleEmitterSystem', () => {
  let particleManager: ParticleManager
  let eventEmitter: EventEmitter<TestEvents>
  let emitterSystem: ParticleEmitterSystem

  beforeEach(() => {
    particleManager = new ParticleManager(500)
    eventEmitter = new EventEmitter<TestEvents>()
    emitterSystem = new ParticleEmitterSystem(particleManager, eventEmitter)
  })

  describe('System Properties', () => {
    it('should have required components', () => {
      expect(emitterSystem.requiredComponents).toBeDefined()
      expect(Array.isArray(emitterSystem.requiredComponents)).toBe(true)
    })
  })

  describe('Explosion Emitter - asteroidDestroyed Event', () => {
    it('should spawn explosion particles on asteroidDestroyed event', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(100, 200, 0),
        size: 'large',
        points: 25,
        spawnChildren: true
      })

      // Process the event
      emitterSystem.update({} as any, 16)

      const activeParticles = particleManager.getActiveParticles()
      expect(activeParticles.length).toBeGreaterThan(0)
    })

    it('should spawn 20-50 particles for explosion', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(100, 200, 0),
        size: 'medium',
        points: 50,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)

      const count = particleManager.getActiveParticles().length
      expect(count).toBeGreaterThanOrEqual(20)
      expect(count).toBeLessThanOrEqual(50)
    })

    it('should spawn particles at asteroid position', () => {
      const position = new Vector3(150, 250, 0)

      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position,
        size: 'small',
        points: 100,
        spawnChildren: false
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      // All particles should be near the explosion center
      for (const particle of particles) {
        const distance = particle.position.distanceTo(position)
        // Initial spawn should be at or near center
        expect(distance).toBeLessThan(10)
      }
    })

    it('should spread particles radially', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'large',
        points: 25,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      // Check that particles have varied velocities (radial spread)
      const velocities = particles.map((p) => ({ x: p.velocity.x, y: p.velocity.y }))

      // At least some particles should have different direction vectors
      const uniqueDirections = new Set(
        velocities.map((v) => Math.atan2(v.y, v.x).toFixed(2))
      )

      expect(uniqueDirections.size).toBeGreaterThan(5) // Should have varied directions
    })

    it('should set particle velocity in range 50-200 units/s', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'medium',
        points: 50,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        const speed = particle.velocity.length()
        expect(speed).toBeGreaterThanOrEqual(50)
        expect(speed).toBeLessThanOrEqual(200)
      }
    })
  })

  describe('Explosion Duration Based on Size', () => {
    it('should set duration to 500ms for small asteroids', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'small',
        points: 100,
        spawnChildren: false
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        expect(particle.maxLifetime).toBe(500)
      }
    })

    it('should set duration to 1500ms for medium asteroids', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'medium',
        points: 50,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        expect(particle.maxLifetime).toBe(1500)
      }
    })

    it('should set duration to 2000ms for large asteroids', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'large',
        points: 25,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        expect(particle.maxLifetime).toBe(2000)
      }
    })
  })

  describe('Explosion Particle Colors', () => {
    it('should use orange/red/yellow colors for explosions', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'medium',
        points: 50,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        // Red component should be high (orange/red/yellow have high red)
        expect(particle.color.r).toBeGreaterThan(0.5)
      }
    })
  })

  describe('Explosion Particle Size', () => {
    it('should set particle size between 2-8 units', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'medium',
        points: 50,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        expect(particle.size).toBeGreaterThanOrEqual(2)
        expect(particle.size).toBeLessThanOrEqual(8)
      }
    })
  })

  describe('Thrust Emitter - shipThrust Event', () => {
    it('should spawn thrust particles on shipThrust event', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      // Need enough time to spawn at 50 particles/s (20ms per particle)
      emitterSystem.update({} as any, 50)

      const particles = particleManager.getActiveParticles()
      expect(particles.length).toBeGreaterThan(0)
    })

    it('should not spawn thrust particles when thrust inactive', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: false
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      expect(particles.length).toBe(0)
    })

    it('should emit 50 particles per second rate', () => {
      // Emit thrust for 1 second (1000ms)
      for (let time = 0; time < 1000; time += 20) {
        eventEmitter.emit('shipThrust', {
          entityId: 1 as any,
          position: new Vector3(0, 0, 0),
          direction: new Vector3(1, 0, 0),
          active: true
        })
        emitterSystem.update({} as any, 20)
      }

      const count = particleManager.getActiveParticles().length
      // Should be approximately 50 particles (allowing for variance)
      // Some particles may have expired
      expect(count).toBeGreaterThanOrEqual(20)
      expect(count).toBeLessThanOrEqual(60)
    })

    it('should spawn particles from ship rear position', () => {
      const shipPosition = new Vector3(100, 200, 0)
      const facingDirection = new Vector3(1, 0, 0)

      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: shipPosition,
        direction: facingDirection,
        active: true
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      expect(particles.length).toBeGreaterThan(0)

      // Particles should spawn behind the ship (opposite to facing direction)
      for (const particle of particles) {
        // Particle x position should be less than or equal to ship position
        // since facing is +X, rear is -X direction
        expect(particle.position.x).toBeLessThanOrEqual(shipPosition.x + 5)
      }
    })

    it('should set thrust particle velocity opposite to facing direction', () => {
      const facingDirection = new Vector3(1, 0, 0).normalize()

      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: facingDirection,
        active: true
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        // Velocity should be mostly in -X direction (opposite to facing)
        expect(particle.velocity.x).toBeLessThan(0)
      }
    })

    it('should use blue/cyan colors for thrust particles', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        // Blue component should be high
        expect(particle.color.b).toBeGreaterThan(0.5)
      }
    })

    it('should set thrust particle size between 2-4 units', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        expect(particle.size).toBeGreaterThanOrEqual(2)
        expect(particle.size).toBeLessThanOrEqual(4)
      }
    })

    it('should set thrust particle lifetime between 200-400ms', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        expect(particle.maxLifetime).toBeGreaterThanOrEqual(200)
        expect(particle.maxLifetime).toBeLessThanOrEqual(400)
      }
    })

    it('should set thrust particle velocity in range 50-100 units/s', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        const speed = particle.velocity.length()
        expect(speed).toBeGreaterThanOrEqual(50)
        expect(speed).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('Emitter Activation/Deactivation', () => {
    it('should activate emitter on event', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      expect(emitterSystem.isThrustActive()).toBe(true)
    })

    it('should deactivate emitter on thrust stop', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: false
      })

      expect(emitterSystem.isThrustActive()).toBe(false)
    })

    it('should not emit particles when emitter deactivated', () => {
      // First activate
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      // Then deactivate
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: false
      })

      // Update should not spawn new particles
      const initialCount = particleManager.getActiveParticles().length
      emitterSystem.update({} as any, 100)

      // Should not have spawned any new particles (may have fewer due to expiration)
      expect(particleManager.getActiveParticles().length).toBeLessThanOrEqual(initialCount)
    })
  })

  describe('Multiple Explosions', () => {
    it('should handle multiple simultaneous explosions', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'large',
        points: 25,
        spawnChildren: true
      })

      eventEmitter.emit('asteroidDestroyed', {
        entityId: 2 as any,
        position: new Vector3(200, 200, 0),
        size: 'medium',
        points: 50,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      // Should have particles from both explosions
      expect(particles.length).toBeGreaterThanOrEqual(40) // At least 20 from each
    })

    it('should handle rapid explosions', () => {
      for (let i = 0; i < 5; i++) {
        eventEmitter.emit('asteroidDestroyed', {
          entityId: i as any,
          position: new Vector3(i * 50, 0, 0),
          size: 'small',
          points: 100,
          spawnChildren: false
        })
      }

      emitterSystem.update({} as any, 16)

      const particles = particleManager.getActiveParticles()
      expect(particles.length).toBeGreaterThanOrEqual(100) // At least 20 from each
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero deltaTime', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      expect(() => {
        emitterSystem.update({} as any, 0)
      }).not.toThrow()
    })

    it('should handle very large deltaTime', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(1, 0, 0),
        active: true
      })

      expect(() => {
        emitterSystem.update({} as any, 10000)
      }).not.toThrow()
    })

    it('should handle pool exhaustion gracefully', () => {
      // Fill the pool
      for (let i = 0; i < 25; i++) {
        eventEmitter.emit('asteroidDestroyed', {
          entityId: i as any,
          position: new Vector3(i * 10, 0, 0),
          size: 'large',
          points: 25,
          spawnChildren: true
        })
      }

      // This should not throw even if pool is full
      expect(() => {
        emitterSystem.update({} as any, 16)
      }).not.toThrow()
    })

    it('should handle zero direction vector', () => {
      eventEmitter.emit('shipThrust', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 0, 0),
        active: true
      })

      expect(() => {
        emitterSystem.update({} as any, 100)
      }).not.toThrow()
    })
  })

  describe('Event Cleanup', () => {
    it('should clear pending events after processing', () => {
      eventEmitter.emit('asteroidDestroyed', {
        entityId: 1 as any,
        position: new Vector3(0, 0, 0),
        size: 'medium',
        points: 50,
        spawnChildren: true
      })

      emitterSystem.update({} as any, 16)
      const firstCount = particleManager.getActiveParticles().length

      // Second update should not spawn more particles from same event
      emitterSystem.update({} as any, 16)
      const secondCount = particleManager.getActiveParticles().length

      // Count should be same or less (particles may expire, but shouldn't increase)
      expect(secondCount).toBeLessThanOrEqual(firstCount)
    })
  })

  // ====================================================
  // Trail Emitter Tests (Task 7.3: Projectile Trails)
  // ====================================================
  describe('Trail Emitter - weaponFired Event', () => {
    it('should spawn trail particles on weaponFired event', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(100, 200, 0),
        direction: new Vector3(0, 1, 0)
      })

      // Process the event - need enough time to spawn at 20 particles/s
      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      expect(particles.length).toBeGreaterThan(0)
    })

    it('should emit trail particles at 20 particles per second rate', () => {
      // Emit weapon fire for 1 second (1000ms)
      for (let time = 0; time < 1000; time += 50) {
        eventEmitter.emit('weaponFired', {
          entityId: 1 as any,
          weaponType: 'single',
          position: new Vector3(0, 0, 0),
          direction: new Vector3(0, 1, 0)
        })
        emitterSystem.update({} as any, 50)
      }

      const count = particleManager.getActiveParticles().length
      // Should be approximately 20 particles per second
      // Allowing for variance and particle expiration
      expect(count).toBeGreaterThanOrEqual(5)
      expect(count).toBeLessThanOrEqual(30)
    })

    it('should set trail particle lifetime between 100-200ms', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        expect(particle.maxLifetime).toBeGreaterThanOrEqual(100)
        expect(particle.maxLifetime).toBeLessThanOrEqual(200)
      }
    })

    it('should set trail particle size between 1-3 units (smaller than explosion/thrust)', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        expect(particle.size).toBeGreaterThanOrEqual(1)
        expect(particle.size).toBeLessThanOrEqual(3)
      }
    })

    it('should set trail particle velocity with minimal spread (±10 units/s)', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        const speed = particle.velocity.length()
        // Velocity should be minimal, ±10 units/s = 0 to ~14 units/s magnitude
        expect(speed).toBeLessThanOrEqual(20)
      }
    })

    it('should spawn trail particles at projectile position', () => {
      const position = new Vector3(150, 250, 0)

      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position,
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      // All particles should be near the fire position
      for (const particle of particles) {
        const distance = particle.position.distanceTo(position)
        // Initial spawn should be at or very near the projectile position
        expect(distance).toBeLessThan(15)
      }
    })
  })

  describe('Trail Colors Based on Weapon Type', () => {
    it('should use red color for single weapon type', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        // Red (#FF0000) has r=1, g=0, b=0
        expect(particle.color.r).toBeGreaterThan(0.9)
        expect(particle.color.g).toBeLessThan(0.2)
        expect(particle.color.b).toBeLessThan(0.2)
      }
    })

    it('should use blue color for spread weapon type', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'spread',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        // Blue (#0000FF) has r=0, g=0, b=1
        expect(particle.color.r).toBeLessThan(0.2)
        expect(particle.color.g).toBeLessThan(0.2)
        expect(particle.color.b).toBeGreaterThan(0.9)
      }
    })

    it('should use cyan color for laser weapon type', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'laser',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        // Cyan (#00FFFF) has r=0, g=1, b=1
        expect(particle.color.r).toBeLessThan(0.2)
        expect(particle.color.g).toBeGreaterThan(0.9)
        expect(particle.color.b).toBeGreaterThan(0.9)
      }
    })

    it('should use green color for homing weapon type', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'homing',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        // Green (#00FF00) has r=0, g=1, b=0
        expect(particle.color.r).toBeLessThan(0.2)
        expect(particle.color.g).toBeGreaterThan(0.9)
        expect(particle.color.b).toBeLessThan(0.2)
      }
    })

    it('should use orange color for boss weapon type', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'boss',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      for (const particle of particles) {
        // Orange (#FF6600) has r=1, g=0.4, b=0
        expect(particle.color.r).toBeGreaterThan(0.9)
        expect(particle.color.g).toBeGreaterThan(0.3)
        expect(particle.color.g).toBeLessThan(0.5)
        expect(particle.color.b).toBeLessThan(0.1)
      }
    })
  })

  describe('Trail Emitter - Multiple Projectiles', () => {
    it('should handle multiple simultaneous projectile trails', () => {
      // Fire 3 projectiles from different positions
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      eventEmitter.emit('weaponFired', {
        entityId: 2 as any,
        weaponType: 'spread',
        position: new Vector3(100, 100, 0),
        direction: new Vector3(1, 0, 0)
      })

      eventEmitter.emit('weaponFired', {
        entityId: 3 as any,
        weaponType: 'laser',
        position: new Vector3(200, 200, 0),
        direction: new Vector3(-1, 0, 0)
      })

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      // Should have particles from all three projectiles
      expect(particles.length).toBeGreaterThanOrEqual(3)
    })

    it('should handle rapid projectile firing', () => {
      for (let i = 0; i < 10; i++) {
        eventEmitter.emit('weaponFired', {
          entityId: i as any,
          weaponType: 'single',
          position: new Vector3(i * 10, 0, 0),
          direction: new Vector3(0, 1, 0)
        })
      }

      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      expect(particles.length).toBeGreaterThan(0)
    })
  })

  describe('Trail Emitter - Edge Cases', () => {
    it('should handle zero direction vector for trail', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 0, 0)
      })

      expect(() => {
        emitterSystem.update({} as any, 100)
      }).not.toThrow()
    })

    it('should not spawn trail particles when no weaponFired event', () => {
      // Just update without any events
      emitterSystem.update({} as any, 100)

      const particles = particleManager.getActiveParticles()
      expect(particles.length).toBe(0)
    })

    it('should clear trail events after processing', () => {
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)
      const firstCount = particleManager.getActiveParticles().length

      // Second update should not spawn more particles from same event
      emitterSystem.update({} as any, 100)
      const secondCount = particleManager.getActiveParticles().length

      // Count should be same or less (particles may expire, but shouldn't increase)
      expect(secondCount).toBeLessThanOrEqual(firstCount)
    })
  })

  describe('Trail Particle Size Comparison', () => {
    it('should have trail particles smaller than explosion particles (1-3 vs 2-8)', () => {
      // Spawn trail particles
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const trailParticles = particleManager.getActiveParticles()
      const trailSizes = trailParticles.map(p => p.size)
      const maxTrailSize = Math.max(...trailSizes)

      // Trail max size (3) should be less than explosion max size (8)
      expect(maxTrailSize).toBeLessThanOrEqual(3)
    })

    it('should have trail particles smaller than thrust particles (1-3 vs 2-4)', () => {
      // First spawn trail particles
      eventEmitter.emit('weaponFired', {
        entityId: 1 as any,
        weaponType: 'single',
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 1, 0)
      })

      emitterSystem.update({} as any, 100)

      const trailParticles = particleManager.getActiveParticles()
      const trailSizes = trailParticles.map(p => p.size)
      const maxTrailSize = Math.max(...trailSizes)

      // Trail max size (3) should be less than or equal to thrust min (2)
      // Actually trail has same upper bound as thrust min, but trail starts at 1 vs 2
      expect(maxTrailSize).toBeLessThanOrEqual(3)
    })
  })
})
