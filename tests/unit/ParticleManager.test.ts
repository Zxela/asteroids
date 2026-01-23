/**
 * ParticleManager Tests
 *
 * Tests for particle pool management and particle lifecycle.
 * Follows TDD approach - tests define expected behavior.
 *
 * @module tests/unit/ParticleManager.test
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { Vector3, Color } from 'three'
import { ParticleManager, type Particle } from '../../src/rendering/ParticleManager'

describe('ParticleManager', () => {
  let particleManager: ParticleManager

  beforeEach(() => {
    particleManager = new ParticleManager(500)
  })

  describe('Pool Initialization', () => {
    it('should initialize with specified pool size', () => {
      expect(particleManager.getPoolSize()).toBe(500)
    })

    it('should initialize with default pool size of 500 when not specified', () => {
      const defaultManager = new ParticleManager()
      expect(defaultManager.getPoolSize()).toBe(500)
    })

    it('should start with zero active particles', () => {
      expect(particleManager.getActiveParticles().length).toBe(0)
    })

    it('should create particles with correct initial state', () => {
      const particle = particleManager.acquireParticle()
      expect(particle).not.toBeNull()
      expect(particle!.active).toBe(true)
    })
  })

  describe('Particle Acquisition', () => {
    it('should acquire particle from pool', () => {
      const particle = particleManager.acquireParticle()
      expect(particle).not.toBeNull()
    })

    it('should mark acquired particle as active', () => {
      const particle = particleManager.acquireParticle()
      expect(particle!.active).toBe(true)
    })

    it('should increase active particle count on acquisition', () => {
      particleManager.acquireParticle()
      expect(particleManager.getActiveParticles().length).toBe(1)
    })

    it('should acquire multiple particles', () => {
      for (let i = 0; i < 10; i++) {
        particleManager.acquireParticle()
      }
      expect(particleManager.getActiveParticles().length).toBe(10)
    })

    it('should return null when pool exhausted', () => {
      // Acquire all particles
      for (let i = 0; i < 500; i++) {
        particleManager.acquireParticle()
      }

      // Pool should be exhausted
      const particle = particleManager.acquireParticle()
      expect(particle).toBeNull()
    })

    it('should return distinct particle objects', () => {
      const p1 = particleManager.acquireParticle()
      const p2 = particleManager.acquireParticle()
      expect(p1).not.toBe(p2)
    })
  })

  describe('Particle Release', () => {
    it('should release particle back to pool', () => {
      const particle = particleManager.acquireParticle()
      particleManager.releaseParticle(particle!)
      expect(particleManager.getActiveParticles().length).toBe(0)
    })

    it('should mark released particle as inactive', () => {
      const particle = particleManager.acquireParticle()
      particleManager.releaseParticle(particle!)
      expect(particle!.active).toBe(false)
    })

    it('should allow reuse of released particle', () => {
      const particle = particleManager.acquireParticle()
      particleManager.releaseParticle(particle!)

      const reacquired = particleManager.acquireParticle()
      expect(reacquired).toBe(particle)
    })

    it('should not decrease count when releasing inactive particle', () => {
      const particle = particleManager.acquireParticle()
      particleManager.releaseParticle(particle!)
      particleManager.releaseParticle(particle!) // Release again

      expect(particleManager.getActiveParticles().length).toBe(0)
    })
  })

  describe('Particle Data Structure', () => {
    it('should have position as Vector3', () => {
      const particle = particleManager.acquireParticle()
      expect(particle!.position).toBeInstanceOf(Vector3)
    })

    it('should have velocity as Vector3', () => {
      const particle = particleManager.acquireParticle()
      expect(particle!.velocity).toBeInstanceOf(Vector3)
    })

    it('should have lifetime property', () => {
      const particle = particleManager.acquireParticle()
      expect(typeof particle!.lifetime).toBe('number')
    })

    it('should have maxLifetime property', () => {
      const particle = particleManager.acquireParticle()
      expect(typeof particle!.maxLifetime).toBe('number')
    })

    it('should have color as Color', () => {
      const particle = particleManager.acquireParticle()
      expect(particle!.color).toBeInstanceOf(Color)
    })

    it('should have size property', () => {
      const particle = particleManager.acquireParticle()
      expect(typeof particle!.size).toBe('number')
    })

    it('should have active state', () => {
      const particle = particleManager.acquireParticle()
      expect(typeof particle!.active).toBe('boolean')
    })
  })

  describe('Particle Update', () => {
    it('should update particle positions based on velocity', () => {
      const particle = particleManager.acquireParticle()
      particle!.position.set(0, 0, 0)
      particle!.velocity.set(100, 0, 0)
      particle!.lifetime = 1000
      particle!.maxLifetime = 1000

      particleManager.updateParticles(100) // 100ms

      // Position should move by velocity * deltaTime
      expect(particle!.position.x).toBeCloseTo(10, 1) // 100 units/s * 0.1s = 10
    })

    it('should decrease particle lifetime', () => {
      const particle = particleManager.acquireParticle()
      particle!.lifetime = 1000
      particle!.maxLifetime = 1000

      particleManager.updateParticles(100)

      expect(particle!.lifetime).toBe(900)
    })

    it('should release particle when lifetime reaches zero', () => {
      const particle = particleManager.acquireParticle()
      particle!.lifetime = 50
      particle!.maxLifetime = 1000

      particleManager.updateParticles(100)

      expect(particle!.active).toBe(false)
      expect(particleManager.getActiveParticles().length).toBe(0)
    })

    it('should not update inactive particles', () => {
      const particle = particleManager.acquireParticle()
      const initialPosition = particle!.position.clone()
      particle!.velocity.set(100, 0, 0)
      particleManager.releaseParticle(particle!)

      particleManager.updateParticles(100)

      expect(particle!.position.x).toBe(initialPosition.x)
    })

    it('should handle multiple particles update', () => {
      const p1 = particleManager.acquireParticle()
      const p2 = particleManager.acquireParticle()

      p1!.position.set(0, 0, 0)
      p1!.velocity.set(100, 0, 0)
      p1!.lifetime = 1000
      p1!.maxLifetime = 1000

      p2!.position.set(0, 0, 0)
      p2!.velocity.set(0, 100, 0)
      p2!.lifetime = 1000
      p2!.maxLifetime = 1000

      particleManager.updateParticles(100)

      expect(p1!.position.x).toBeCloseTo(10, 1)
      expect(p2!.position.y).toBeCloseTo(10, 1)
    })
  })

  describe('Active Particles Query', () => {
    it('should return only active particles', () => {
      const p1 = particleManager.acquireParticle()
      const p2 = particleManager.acquireParticle()
      particleManager.releaseParticle(p1!)

      const active = particleManager.getActiveParticles()
      expect(active.length).toBe(1)
      expect(active[0]).toBe(p2)
    })

    it('should return empty array when no active particles', () => {
      expect(particleManager.getActiveParticles().length).toBe(0)
    })

    it('should return all active particles', () => {
      for (let i = 0; i < 5; i++) {
        particleManager.acquireParticle()
      }

      expect(particleManager.getActiveParticles().length).toBe(5)
    })
  })

  describe('Particle Pool Reuse', () => {
    it('should reuse particles without allocations', () => {
      // Acquire and release multiple times
      const particles: Particle[] = []

      for (let i = 0; i < 10; i++) {
        particles.push(particleManager.acquireParticle()!)
      }

      for (const p of particles) {
        particleManager.releaseParticle(p)
      }

      // Acquire again - should be same objects
      const reacquired: Particle[] = []
      for (let i = 0; i < 10; i++) {
        reacquired.push(particleManager.acquireParticle()!)
      }

      // Should be reusing the same particle objects
      for (const p of reacquired) {
        expect(particles).toContain(p)
      }
    })

    it('should reset particle state on acquire', () => {
      const particle = particleManager.acquireParticle()
      particle!.position.set(100, 200, 300)
      particle!.velocity.set(50, 50, 50)
      particle!.lifetime = 123
      particleManager.releaseParticle(particle!)

      const reacquired = particleManager.acquireParticle()
      // Position and velocity should be reset to zero
      expect(reacquired!.position.x).toBe(0)
      expect(reacquired!.position.y).toBe(0)
      expect(reacquired!.position.z).toBe(0)
      expect(reacquired!.velocity.x).toBe(0)
      expect(reacquired!.velocity.y).toBe(0)
      expect(reacquired!.velocity.z).toBe(0)
    })
  })

  describe('Lifecycle - Spawn to Despawn', () => {
    it('should complete full particle lifecycle', () => {
      // Spawn
      const particle = particleManager.acquireParticle()
      expect(particle).not.toBeNull()
      expect(particle!.active).toBe(true)

      // Configure
      particle!.position.set(0, 0, 0)
      particle!.velocity.set(100, 0, 0)
      particle!.lifetime = 200
      particle!.maxLifetime = 200

      // Update (still alive)
      particleManager.updateParticles(100)
      expect(particle!.active).toBe(true)
      expect(particle!.lifetime).toBe(100)

      // Update (despawns)
      particleManager.updateParticles(150)
      expect(particle!.active).toBe(false)
      expect(particleManager.getActiveParticles().length).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero deltaTime', () => {
      const particle = particleManager.acquireParticle()
      particle!.lifetime = 1000
      particle!.maxLifetime = 1000

      expect(() => {
        particleManager.updateParticles(0)
      }).not.toThrow()

      expect(particle!.lifetime).toBe(1000)
    })

    it('should handle very large deltaTime', () => {
      const particle = particleManager.acquireParticle()
      particle!.lifetime = 100
      particle!.maxLifetime = 100

      expect(() => {
        particleManager.updateParticles(10000)
      }).not.toThrow()

      expect(particle!.active).toBe(false)
    })

    it('should handle small pool size', () => {
      const smallManager = new ParticleManager(1)
      const p1 = smallManager.acquireParticle()
      expect(p1).not.toBeNull()

      const p2 = smallManager.acquireParticle()
      expect(p2).toBeNull()
    })
  })

  describe('Performance', () => {
    it('should handle rapid acquire/release cycles', () => {
      for (let cycle = 0; cycle < 100; cycle++) {
        const particles: Particle[] = []

        // Acquire batch
        for (let i = 0; i < 50; i++) {
          const p = particleManager.acquireParticle()
          if (p) particles.push(p)
        }

        // Release batch
        for (const p of particles) {
          particleManager.releaseParticle(p)
        }
      }

      // Pool should be in consistent state
      expect(particleManager.getActiveParticles().length).toBe(0)
    })

    it('should maintain pool integrity after many operations', () => {
      // Use and release all particles multiple times
      for (let round = 0; round < 3; round++) {
        const acquired: Particle[] = []

        // Acquire all
        let particle = particleManager.acquireParticle()
        while (particle) {
          particle.lifetime = 100
          particle.maxLifetime = 100
          acquired.push(particle)
          particle = particleManager.acquireParticle()
        }

        expect(acquired.length).toBe(500)

        // Update to expire all
        particleManager.updateParticles(200)

        expect(particleManager.getActiveParticles().length).toBe(0)
      }
    })
  })
})
