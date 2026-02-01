/**
 * PowerUpSystem Unit Tests
 *
 * Tests for power-up collection and effect management:
 * - Collision detection (player + power-up)
 * - Power-up removal on collection
 * - powerUpCollected event emission
 * - Shield effect (invulnerability, 10s duration)
 * - RapidFire effect (cooldown halved, 15s duration)
 * - MultiShot effect (flag active, 15s duration)
 * - ExtraLife (lives incremented, permanent)
 * - Timer countdown
 * - Multiple simultaneous effects
 * - Same power-up refreshes timer
 *
 * @module tests/unit/PowerUpSystem.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { PowerUpSystem } from '../../src/systems/PowerUpSystem'
import { Transform } from '../../src/components/Transform'
import { Collider } from '../../src/components/Collider'
import { Player } from '../../src/components/Player'
import { Health } from '../../src/components/Health'
import { Weapon } from '../../src/components/Weapon'
import { PowerUp } from '../../src/components/PowerUp'
import { PowerUpEffect } from '../../src/components/PowerUpEffect'
import { POWER_UP_CONFIGS } from '../../src/config/powerUpConfig'
import type { CollisionEvent } from '../../src/systems/CollisionSystem'
import type { EntityId, PowerUpType } from '../../src/types'

/**
 * Helper to create a player entity with all required components
 */
function createPlayerEntity(world: World): EntityId {
  const playerId = world.createEntity()
  world.addComponent(playerId, new Transform(new Vector3(0, 0, 0)))
  world.addComponent(playerId, new Collider('sphere', 20, 'player', ['asteroid', 'powerup']))
  world.addComponent(playerId, new Player(3))
  world.addComponent(playerId, new Health(1, 1))
  world.addComponent(playerId, new Weapon('single', 250))
  return playerId
}

/**
 * Helper to create a power-up entity
 */
function createPowerUpEntity(
  world: World,
  powerUpType: PowerUpType,
  position: Vector3 = new Vector3(10, 0, 0)
): EntityId {
  const powerUpId = world.createEntity()
  world.addComponent(powerUpId, new Transform(position))
  world.addComponent(powerUpId, new Collider('sphere', 10, 'powerup', ['player']))
  world.addComponent(powerUpId, new PowerUp(powerUpType))
  return powerUpId
}

/**
 * Helper to create a collision event
 */
function createCollisionEvent(
  playerId: EntityId,
  powerUpId: EntityId
): CollisionEvent {
  return {
    type: 'collision',
    entity1: playerId,
    entity2: powerUpId,
    layer1: 'player',
    layer2: 'powerup',
    distance: 10
  }
}

describe('PowerUpSystem', () => {
  let world: World
  let powerUpSystem: PowerUpSystem
  let playerId: EntityId

  beforeEach(() => {
    world = new World()
    powerUpSystem = new PowerUpSystem()
    playerId = createPlayerEntity(world)
  })

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(powerUpSystem).toBeDefined()
    })

    it('should have correct system type', () => {
      expect(powerUpSystem.systemType).toBe('powerUp')
    })
  })

  describe('Configuration', () => {
    it('should have shield config with 10s duration', () => {
      expect(POWER_UP_CONFIGS.shield.duration).toBe(10000)
    })

    it('should have rapidFire config with 15s duration', () => {
      expect(POWER_UP_CONFIGS.rapidFire.duration).toBe(15000)
    })

    it('should have multiShot config with 15s duration', () => {
      expect(POWER_UP_CONFIGS.multiShot.duration).toBe(15000)
    })

    it('should have extraLife config with permanent duration (-1)', () => {
      expect(POWER_UP_CONFIGS.extraLife.duration).toBe(-1)
    })
  })

  describe('Collision Detection', () => {
    it('should detect collision between player and power-up', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // Power-up should be collected (removed from world)
      expect(world.isEntityAlive(powerUpId)).toBe(false)
    })

    it('should detect collision with reversed entity order', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      // Create collision with power-up as entity1 and player as entity2
      const collision: CollisionEvent = {
        type: 'collision',
        entity1: powerUpId,
        entity2: playerId,
        layer1: 'powerup',
        layer2: 'player',
        distance: 10
      }

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      expect(world.isEntityAlive(powerUpId)).toBe(false)
    })

    it('should not process collision between non-player and power-up', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(asteroidId, new Collider('sphere', 20, 'asteroid', ['player', 'projectile']))

      const collision: CollisionEvent = {
        type: 'collision',
        entity1: asteroidId,
        entity2: powerUpId,
        layer1: 'asteroid',
        layer2: 'powerup',
        distance: 10
      }

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // Power-up should NOT be collected
      expect(world.isEntityAlive(powerUpId)).toBe(true)
    })
  })

  describe('Power-up Removal', () => {
    it('should remove power-up entity on collection', () => {
      const powerUpId = createPowerUpEntity(world, 'rapidFire')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      expect(world.isEntityAlive(powerUpId)).toBe(false)
    })

    it('should handle multiple power-ups collected in same frame', () => {
      const powerUp1 = createPowerUpEntity(world, 'shield', new Vector3(10, 0, 0))
      const powerUp2 = createPowerUpEntity(world, 'rapidFire', new Vector3(20, 0, 0))

      const collision1 = createCollisionEvent(playerId, powerUp1)
      const collision2 = createCollisionEvent(playerId, powerUp2)

      powerUpSystem.setCollisions([collision1, collision2])
      powerUpSystem.update(world, 16)

      expect(world.isEntityAlive(powerUp1)).toBe(false)
      expect(world.isEntityAlive(powerUp2)).toBe(false)
    })
  })

  describe('Event Emission', () => {
    it('should emit powerUpCollected event', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const events = powerUpSystem.getEvents()
      expect(events.length).toBe(1)
      expect(events[0].type).toBe('powerUpCollected')
    })

    it('should include power-up type in event', () => {
      const powerUpId = createPowerUpEntity(world, 'multiShot')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const events = powerUpSystem.getEvents()
      expect(events[0].data.powerUpType).toBe('multiShot')
    })

    it('should include collecting entity in event', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const events = powerUpSystem.getEvents()
      expect(events[0].data.entityId).toBe(playerId)
    })

    it('should include color in event for shield powerup', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const events = powerUpSystem.getEvents()
      expect(events[0].data.color).toBe(0x00ffff) // cyan
    })

    it('should include color in event for rapidFire powerup', () => {
      const powerUpId = createPowerUpEntity(world, 'rapidFire')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const events = powerUpSystem.getEvents()
      expect(events[0].data.color).toBe(0xff8800) // orange
    })

    it('should include color in event for multiShot powerup', () => {
      const powerUpId = createPowerUpEntity(world, 'multiShot')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const events = powerUpSystem.getEvents()
      expect(events[0].data.color).toBe(0xff00ff) // magenta
    })

    it('should include color in event for extraLife powerup', () => {
      const powerUpId = createPowerUpEntity(world, 'extraLife')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const events = powerUpSystem.getEvents()
      expect(events[0].data.color).toBe(0x00ff00) // green
    })

    it('should clear events at start of each update', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)
      expect(powerUpSystem.getEvents().length).toBe(1)

      // Second frame with no collisions
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 16)
      expect(powerUpSystem.getEvents().length).toBe(0)
    })
  })

  describe('Shield Effect', () => {
    it('should grant invulnerability on collection', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const health = world.getComponent(playerId, Health)
      expect(health?.invulnerable).toBe(true)
    })

    it('should have 10 second duration', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const shieldEffect = effectComponent?.effects.find(e => e.powerUpType === 'shield')
      expect(shieldEffect?.totalDuration).toBe(10000)
    })

    it('should remove invulnerability when timer expires', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // Simulate 10 seconds passing
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 10000)

      const health = world.getComponent(playerId, Health)
      expect(health?.invulnerable).toBe(false)
    })

    it('should decrement timer correctly', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // After 1 second
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 1000)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const shieldEffect = effectComponent?.effects.find(e => e.powerUpType === 'shield')
      expect(shieldEffect?.remainingTime).toBeCloseTo(9000, -2)
    })
  })

  describe('RapidFire Effect', () => {
    it('should halve weapon cooldown on collection', () => {
      const powerUpId = createPowerUpEntity(world, 'rapidFire')
      const collision = createCollisionEvent(playerId, powerUpId)

      const weapon = world.getComponent(playerId, Weapon)
      const originalCooldown = weapon!.cooldown

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      expect(weapon!.cooldown).toBe(originalCooldown / 2)
    })

    it('should have 15 second duration', () => {
      const powerUpId = createPowerUpEntity(world, 'rapidFire')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const effect = effectComponent?.effects.find(e => e.powerUpType === 'rapidFire')
      expect(effect?.totalDuration).toBe(15000)
    })

    it('should restore original cooldown when timer expires', () => {
      const powerUpId = createPowerUpEntity(world, 'rapidFire')
      const collision = createCollisionEvent(playerId, powerUpId)

      const weapon = world.getComponent(playerId, Weapon)
      const originalCooldown = weapon!.cooldown

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)
      expect(weapon!.cooldown).toBe(originalCooldown / 2)

      // Simulate 15 seconds passing
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 15000)

      expect(weapon!.cooldown).toBe(originalCooldown)
    })
  })

  describe('MultiShot Effect', () => {
    it('should activate multi-shot flag on collection', () => {
      const powerUpId = createPowerUpEntity(world, 'multiShot')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      expect(powerUpSystem.hasActiveEffect(playerId, 'multiShot')).toBe(true)
    })

    it('should have 15 second duration', () => {
      const powerUpId = createPowerUpEntity(world, 'multiShot')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const effect = effectComponent?.effects.find(e => e.powerUpType === 'multiShot')
      expect(effect?.totalDuration).toBe(15000)
    })

    it('should deactivate multi-shot when timer expires', () => {
      const powerUpId = createPowerUpEntity(world, 'multiShot')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)
      expect(powerUpSystem.hasActiveEffect(playerId, 'multiShot')).toBe(true)

      // Simulate 15 seconds passing
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 15000)

      expect(powerUpSystem.hasActiveEffect(playerId, 'multiShot')).toBe(false)
    })
  })

  describe('ExtraLife Effect', () => {
    it('should increment player lives by 1', () => {
      const powerUpId = createPowerUpEntity(world, 'extraLife')
      const collision = createCollisionEvent(playerId, powerUpId)

      const player = world.getComponent(playerId, Player)
      const initialLives = player!.lives

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      expect(player!.lives).toBe(initialLives + 1)
    })

    it('should be permanent (no timer)', () => {
      const powerUpId = createPowerUpEntity(world, 'extraLife')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // Simulate many seconds passing
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 60000)

      // Lives should still be incremented (effect was instant)
      const player = world.getComponent(playerId, Player)
      expect(player!.lives).toBe(4) // 3 initial + 1
    })

    it('should not create a timed effect entry', () => {
      const powerUpId = createPowerUpEntity(world, 'extraLife')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const extraLifeEffect = effectComponent?.effects.find(e => e.powerUpType === 'extraLife')
      // ExtraLife should not have a timed effect entry
      expect(extraLifeEffect).toBeUndefined()
    })
  })

  describe('Timer Countdown', () => {
    it('should decrement remaining time each frame', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const initialTime = effectComponent?.effects[0]?.remainingTime ?? 0

      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 100)

      const newTime = effectComponent?.effects[0]?.remainingTime ?? 0
      expect(newTime).toBe(initialTime - 100)
    })

    it('should remove effect when remaining time reaches 0', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // Expire the effect
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 10000)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const shieldEffect = effectComponent?.effects.find(e => e.powerUpType === 'shield')
      expect(shieldEffect).toBeUndefined()
    })
  })

  describe('Multiple Simultaneous Effects', () => {
    it('should allow multiple different effects active at once', () => {
      const powerUp1 = createPowerUpEntity(world, 'shield', new Vector3(10, 0, 0))
      const powerUp2 = createPowerUpEntity(world, 'rapidFire', new Vector3(20, 0, 0))

      const collision1 = createCollisionEvent(playerId, powerUp1)
      const collision2 = createCollisionEvent(playerId, powerUp2)

      powerUpSystem.setCollisions([collision1, collision2])
      powerUpSystem.update(world, 16)

      expect(powerUpSystem.hasActiveEffect(playerId, 'shield')).toBe(true)
      expect(powerUpSystem.hasActiveEffect(playerId, 'rapidFire')).toBe(true)
    })

    it('should track multiple effects independently', () => {
      const powerUp1 = createPowerUpEntity(world, 'shield', new Vector3(10, 0, 0))
      const powerUp2 = createPowerUpEntity(world, 'rapidFire', new Vector3(20, 0, 0))

      powerUpSystem.setCollisions([createCollisionEvent(playerId, powerUp1)])
      powerUpSystem.update(world, 16)

      // Wait 5 seconds
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 5000)

      // Collect second power-up
      powerUpSystem.setCollisions([createCollisionEvent(playerId, powerUp2)])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const shieldEffect = effectComponent?.effects.find(e => e.powerUpType === 'shield')
      const rapidFireEffect = effectComponent?.effects.find(e => e.powerUpType === 'rapidFire')

      // Shield should have ~5s left, RapidFire should have ~15s
      expect(shieldEffect?.remainingTime).toBeCloseTo(5000, -2)
      expect(rapidFireEffect?.remainingTime).toBeCloseTo(15000, -2)
    })

    it('should remove only expired effects', () => {
      const powerUp1 = createPowerUpEntity(world, 'shield', new Vector3(10, 0, 0))
      const powerUp2 = createPowerUpEntity(world, 'rapidFire', new Vector3(20, 0, 0))

      const collision1 = createCollisionEvent(playerId, powerUp1)
      const collision2 = createCollisionEvent(playerId, powerUp2)

      powerUpSystem.setCollisions([collision1, collision2])
      powerUpSystem.update(world, 16)

      // Wait 10 seconds - shield should expire, rapidFire should remain
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 10000)

      expect(powerUpSystem.hasActiveEffect(playerId, 'shield')).toBe(false)
      expect(powerUpSystem.hasActiveEffect(playerId, 'rapidFire')).toBe(true)
    })
  })

  describe('Same Power-up Refreshes Timer', () => {
    it('should refresh timer when collecting same power-up type', () => {
      const powerUp1 = createPowerUpEntity(world, 'shield', new Vector3(10, 0, 0))

      powerUpSystem.setCollisions([createCollisionEvent(playerId, powerUp1)])
      powerUpSystem.update(world, 16)

      // Wait 5 seconds
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 5000)

      // Collect another shield
      const powerUp2 = createPowerUpEntity(world, 'shield', new Vector3(20, 0, 0))
      powerUpSystem.setCollisions([createCollisionEvent(playerId, powerUp2)])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const shieldEffect = effectComponent?.effects.find(e => e.powerUpType === 'shield')
      // Timer should be refreshed to full duration
      expect(shieldEffect?.remainingTime).toBeCloseTo(10000, -2)
    })

    it('should not stack duration (only refresh)', () => {
      const powerUp1 = createPowerUpEntity(world, 'rapidFire', new Vector3(10, 0, 0))
      const powerUp2 = createPowerUpEntity(world, 'rapidFire', new Vector3(20, 0, 0))

      const collision1 = createCollisionEvent(playerId, powerUp1)
      const collision2 = createCollisionEvent(playerId, powerUp2)

      // Collect both at once
      powerUpSystem.setCollisions([collision1, collision2])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const rapidFireEffects = effectComponent?.effects.filter(e => e.powerUpType === 'rapidFire')

      // Should only have one rapidFire effect, not two
      expect(rapidFireEffects?.length).toBe(1)
      expect(rapidFireEffects?.[0]?.remainingTime).toBeCloseTo(15000, -2)
    })
  })

  describe('hasActiveEffect', () => {
    it('should return true when effect is active', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      expect(powerUpSystem.hasActiveEffect(playerId, 'shield')).toBe(true)
    })

    it('should return false when effect is not active', () => {
      expect(powerUpSystem.hasActiveEffect(playerId, 'shield')).toBe(false)
    })

    it('should return false after effect expires', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // Expire the effect
      powerUpSystem.setCollisions([])
      powerUpSystem.update(world, 10000)

      expect(powerUpSystem.hasActiveEffect(playerId, 'shield')).toBe(false)
    })

    it('should return false for extraLife (instant effect)', () => {
      const powerUpId = createPowerUpEntity(world, 'extraLife')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // ExtraLife is instant, no active effect
      expect(powerUpSystem.hasActiveEffect(playerId, 'extraLife')).toBe(false)
    })
  })

  describe('getPowerUpColor', () => {
    it('should return cyan (0x00ffff) for shield powerup', () => {
      expect(powerUpSystem.getPowerUpColor('shield')).toBe(0x00ffff)
    })

    it('should return orange (0xff8800) for rapidFire powerup', () => {
      expect(powerUpSystem.getPowerUpColor('rapidFire')).toBe(0xff8800)
    })

    it('should return magenta (0xff00ff) for multiShot powerup', () => {
      expect(powerUpSystem.getPowerUpColor('multiShot')).toBe(0xff00ff)
    })

    it('should return green (0x00ff00) for extraLife powerup', () => {
      expect(powerUpSystem.getPowerUpColor('extraLife')).toBe(0x00ff00)
    })
  })

  describe('Edge Cases', () => {
    it('should handle collecting power-up while already invulnerable', () => {
      // Set player invulnerable via Health component directly
      const health = world.getComponent(playerId, Health)
      health!.invulnerable = true

      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // Should still work
      expect(health!.invulnerable).toBe(true)
      expect(powerUpSystem.hasActiveEffect(playerId, 'shield')).toBe(true)
    })

    it('should handle rapid collection of same power-up type', () => {
      const powerUp1 = createPowerUpEntity(world, 'rapidFire', new Vector3(10, 0, 0))
      const powerUp2 = createPowerUpEntity(world, 'rapidFire', new Vector3(20, 0, 0))
      const powerUp3 = createPowerUpEntity(world, 'rapidFire', new Vector3(30, 0, 0))

      const collision1 = createCollisionEvent(playerId, powerUp1)
      const collision2 = createCollisionEvent(playerId, powerUp2)
      const collision3 = createCollisionEvent(playerId, powerUp3)

      powerUpSystem.setCollisions([collision1, collision2, collision3])
      powerUpSystem.update(world, 16)

      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const rapidFireEffects = effectComponent?.effects.filter(e => e.powerUpType === 'rapidFire')

      // Should only have one effect
      expect(rapidFireEffects?.length).toBe(1)
    })

    it('should handle entity with no Player component gracefully', () => {
      // Create entity without Player component
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Collider('sphere', 20, 'player', ['powerup']))
      world.addComponent(entityId, new Health(1, 1))
      world.addComponent(entityId, new Weapon('single', 250))

      const powerUpId = createPowerUpEntity(world, 'extraLife')
      const collision: CollisionEvent = {
        type: 'collision',
        entity1: entityId,
        entity2: powerUpId,
        layer1: 'player',
        layer2: 'powerup',
        distance: 10
      }

      // Should not throw
      expect(() => {
        powerUpSystem.setCollisions([collision])
        powerUpSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle entity with no Weapon component gracefully for rapidFire', () => {
      // Create player without Weapon component
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Collider('sphere', 20, 'player', ['powerup']))
      world.addComponent(entityId, new Player(3))
      world.addComponent(entityId, new Health(1, 1))
      // No Weapon component

      const powerUpId = createPowerUpEntity(world, 'rapidFire')
      const collision: CollisionEvent = {
        type: 'collision',
        entity1: entityId,
        entity2: powerUpId,
        layer1: 'player',
        layer2: 'powerup',
        distance: 10
      }

      // Should not throw
      expect(() => {
        powerUpSystem.setCollisions([collision])
        powerUpSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle zero delta time', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      powerUpSystem.setCollisions([collision])
      powerUpSystem.update(world, 16)

      // Update with zero delta
      powerUpSystem.setCollisions([])
      expect(() => {
        powerUpSystem.update(world, 0)
      }).not.toThrow()

      // Timer should not change
      const effectComponent = world.getComponent(playerId, PowerUpEffect)
      const shieldEffect = effectComponent?.effects.find(e => e.powerUpType === 'shield')
      expect(shieldEffect?.remainingTime).toBeCloseTo(10000, -2)
    })

    it('should handle no collisions gracefully', () => {
      expect(() => {
        powerUpSystem.setCollisions([])
        powerUpSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle destroyed player entity gracefully', () => {
      const powerUpId = createPowerUpEntity(world, 'shield')
      const collision = createCollisionEvent(playerId, powerUpId)

      world.destroyEntity(playerId)

      expect(() => {
        powerUpSystem.setCollisions([collision])
        powerUpSystem.update(world, 16)
      }).not.toThrow()
    })
  })
})
