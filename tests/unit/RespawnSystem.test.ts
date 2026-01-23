/**
 * RespawnSystem Unit Tests
 *
 * Tests for respawn system mechanics:
 * - Life loss on ship destruction
 * - Respawn at center position
 * - Invulnerability timer (3000ms)
 * - Velocity reset on respawn
 * - Game over when lives = 0
 * - Event emission (playerDied, shipDamaged)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { RespawnSystem } from '../../src/systems/RespawnSystem'
import { Transform, Velocity, Health, Player } from '../../src/components'

describe('RespawnSystem', () => {
  let world: World
  let respawnSystem: RespawnSystem
  let shipId: number

  beforeEach(() => {
    world = new World()
    respawnSystem = new RespawnSystem()

    // Create player ship
    shipId = world.createEntity() as unknown as number
    world.addComponent(shipId, new Transform())
    world.addComponent(shipId, new Velocity())
    world.addComponent(shipId, new Health(1)) // 1 max health
    world.addComponent(shipId, new Player(3)) // 3 lives
  })

  describe('Life Loss', () => {
    it('should reduce lives on ship destruction', () => {
      const player = world.getComponent(shipId, Player)
      const initialLives = player!.lives

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      expect(player!.lives).toBe(initialLives - 1)
    })

    it('should emit shipDamaged event on destruction', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      const events = respawnSystem.getEvents()
      const damagedEvent = events.find((e) => e.type === 'shipDamaged')

      expect(damagedEvent).toBeDefined()
      expect(damagedEvent?.type).toBe('shipDamaged')
    })

    it('should include remaining lives in shipDamaged event', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      const events = respawnSystem.getEvents()
      const damagedEvent = events.find((e) => e.type === 'shipDamaged')

      expect((damagedEvent as { remainingLives?: number })?.remainingLives).toBe(2) // 3 - 1
    })

    it('should not be game over if lives remain', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      const events = respawnSystem.getEvents()
      const damagedEvent = events.find((e) => e.type === 'shipDamaged')

      expect((damagedEvent as { isGameOver?: boolean })?.isGameOver).toBe(false)
    })
  })

  describe('Respawn Mechanics', () => {
    it('should respawn ship at center position', () => {
      // Move ship away from center
      const transform = world.getComponent(shipId, Transform)
      transform!.position.set(100, 200, 0)

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      // Should be back at center
      expect(transform!.position.x).toBeCloseTo(0, 1)
      expect(transform!.position.y).toBeCloseTo(0, 1)
      expect(transform!.position.z).toBeCloseTo(0, 1)
    })

    it('should reset velocity to zero on respawn', () => {
      const velocity = world.getComponent(shipId, Velocity)
      velocity!.linear.set(100, 200, 0)
      velocity!.angular.z = Math.PI

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      // Velocity should be reset
      expect(velocity!.linear.length()).toBeLessThan(0.01)
      expect(velocity!.angular.length()).toBeLessThan(0.01)
    })

    it('should reset health to max on respawn', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0
      const maxHealth = health!.max

      respawnSystem.update(world, 16)

      expect(health!.current).toBe(maxHealth)
    })

    it('should set invulnerability timer to 3000ms', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      expect(health!.invulnerable).toBe(true)
      expect(health!.invulnerabilityTimer).toBe(3000)
    })

    it('should respawn even after multiple hits', () => {
      const health = world.getComponent(shipId, Health)
      const player = world.getComponent(shipId, Player)

      // First death and respawn
      health!.current = 0
      respawnSystem.update(world, 16)
      expect(player!.lives).toBe(2)
      expect(health!.current).toBe(health!.max)

      // Simulate time passing (wait for invulnerability to wear off)
      respawnSystem.update(world, 3001)

      // Take damage again
      health!.current = 0
      respawnSystem.update(world, 16)

      expect(player!.lives).toBe(1)
      expect(health!.current).toBe(health!.max)
    })
  })

  describe('Invulnerability Timer', () => {
    it('should count down invulnerability timer each frame', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16) // First update: set invulnerable

      const timerAfterRespawn = health!.invulnerabilityTimer

      respawnSystem.update(world, 100) // Second update: count down

      const timerAfterCountdown = health!.invulnerabilityTimer

      expect(timerAfterCountdown).toBe(timerAfterRespawn - 100)
    })

    it('should clear invulnerability when timer expires', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16) // Respawn with 3000ms invulnerability

      // Simulate 3001ms passing
      respawnSystem.update(world, 3001)

      expect(health!.invulnerable).toBe(false)
      expect(health!.invulnerabilityTimer).toBe(0)
    })

    it('should not go below zero', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16) // Respawn with 3000ms invulnerability

      // Simulate 5000ms passing (more than needed)
      respawnSystem.update(world, 5000)

      expect(health!.invulnerabilityTimer).toBe(0)
      expect(health!.invulnerable).toBe(false)
    })

    it('should maintain invulnerability during timer', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16) // Respawn

      // Simulate 1000ms (still invulnerable)
      respawnSystem.update(world, 1000)

      expect(health!.invulnerable).toBe(true)
      expect(health!.invulnerabilityTimer).toBeGreaterThan(0)
    })
  })

  describe('Game Over', () => {
    it('should emit playerDied event when last life lost', () => {
      const player = world.getComponent(shipId, Player)
      player!.lives = 1 // Last life

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      const events = respawnSystem.getEvents()
      const diedEvent = events.find((e) => e.type === 'playerDied')

      expect(diedEvent).toBeDefined()
      expect(diedEvent?.type).toBe('playerDied')
    })

    it('should not respawn when lives = 0', () => {
      const player = world.getComponent(shipId, Player)
      player!.lives = 1

      const health = world.getComponent(shipId, Health)
      const transform = world.getComponent(shipId, Transform)
      health!.current = 0
      transform!.position.set(100, 200, 0)

      respawnSystem.update(world, 16)

      // Should not have been respawned (position not at center)
      expect(transform!.position.x).not.toBeCloseTo(0, 1)
    })

    it('should include final score in playerDied event', () => {
      const player = world.getComponent(shipId, Player)
      player!.lives = 1
      player!.addScore(1000)

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      const events = respawnSystem.getEvents()
      const diedEvent = events.find((e) => e.type === 'playerDied')

      expect((diedEvent as { finalScore?: number })?.finalScore).toBe(1000)
    })

    it('should set isGameOver to true in final shipDamaged event', () => {
      const player = world.getComponent(shipId, Player)
      player!.lives = 1

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      const events = respawnSystem.getEvents()
      const damagedEvent = events.find((e) => e.type === 'shipDamaged')

      expect((damagedEvent as { isGameOver?: boolean })?.isGameOver).toBe(true)
    })

    it('should set remaining lives to 0 in final shipDamaged event', () => {
      const player = world.getComponent(shipId, Player)
      player!.lives = 1

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)

      const events = respawnSystem.getEvents()
      const damagedEvent = events.find((e) => e.type === 'shipDamaged')

      expect((damagedEvent as { remainingLives?: number })?.remainingLives).toBe(0)
    })
  })

  describe('Multiple Deaths', () => {
    it('should handle sequence of deaths and respawns', () => {
      const player = world.getComponent(shipId, Player)
      const health = world.getComponent(shipId, Health)

      // First death
      health!.current = 0
      respawnSystem.update(world, 16)
      expect(player!.lives).toBe(2)

      // Wait for invulnerability to wear off
      respawnSystem.update(world, 3001)
      expect(health!.invulnerable).toBe(false)

      // Second death
      health!.current = 0
      respawnSystem.update(world, 16)
      expect(player!.lives).toBe(1)

      // Third death (final)
      respawnSystem.update(world, 3001)
      health!.current = 0
      respawnSystem.update(world, 16)
      expect(player!.lives).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing health component gracefully', () => {
      world.removeComponent(shipId, Health)

      expect(() => {
        respawnSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle missing player component gracefully', () => {
      world.removeComponent(shipId, Player)

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      expect(() => {
        respawnSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle missing transform component gracefully', () => {
      world.removeComponent(shipId, Transform)

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      expect(() => {
        respawnSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle missing velocity component gracefully', () => {
      world.removeComponent(shipId, Velocity)

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      expect(() => {
        respawnSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle zero delta time', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      expect(() => {
        respawnSystem.update(world, 0)
      }).not.toThrow()
    })

    it('should handle negative health values', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = -100 // Over-damaged

      expect(() => {
        respawnSystem.update(world, 16)
      }).not.toThrow()

      expect(health!.invulnerable).toBe(true) // Should have respawned
    })

    it('should handle ship with no lives gracefully', () => {
      const player = world.getComponent(shipId, Player)
      player!.lives = 0

      const health = world.getComponent(shipId, Health)
      health!.current = 0

      expect(() => {
        respawnSystem.update(world, 16)
      }).not.toThrow()
    })
  })

  describe('Frame Continuity', () => {
    it('should not double-process destruction in same frame', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16)
      const events1 = respawnSystem.getEvents()

      // In next frame, health should be reset, so no more events
      respawnSystem.update(world, 16)
      const events2 = respawnSystem.getEvents()

      expect(events2.length).toBe(0) // No events in second frame
    })

    it('should count invulnerability time across frames', () => {
      const health = world.getComponent(shipId, Health)
      health!.current = 0

      respawnSystem.update(world, 16) // Respawn with 3000ms invulnerability

      respawnSystem.update(world, 1000) // Count down 1000ms
      const timerAfter1000 = health!.invulnerabilityTimer

      respawnSystem.update(world, 1000) // Count down another 1000ms
      const timerAfter2000 = health!.invulnerabilityTimer

      expect(timerAfter1000).toBeCloseTo(2000, 0)
      expect(timerAfter2000).toBeCloseTo(1000, 0)
    })
  })

  describe('No Player Ship', () => {
    it('should handle no player entities gracefully', () => {
      // Remove all components to make it not a player ship
      world.removeComponent(shipId, Player)
      world.removeComponent(shipId, Health)
      world.removeComponent(shipId, Transform)
      world.removeComponent(shipId, Velocity)

      expect(() => {
        respawnSystem.update(world, 16)
      }).not.toThrow()

      expect(respawnSystem.getEvents().length).toBe(0)
    })
  })
})
