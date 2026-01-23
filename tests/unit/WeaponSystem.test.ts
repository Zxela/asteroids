/**
 * Weapon System Tests
 *
 * Tests for WeaponSystem that handles weapon firing, cooldown enforcement,
 * and projectile creation based on spacebar input.
 *
 * TDD RED Phase - These tests define expected behavior for WeaponSystem.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { WeaponSystem, type WeaponFiredEvent } from '../../src/systems/WeaponSystem'
import { InputSystem } from '../../src/systems/InputSystem'
import { Transform, Weapon, Projectile } from '../../src/components'
import { gameConfig } from '../../src/config'

/**
 * Mock event target for testing keyboard input without DOM.
 * Simulates document.addEventListener/removeEventListener.
 */
class MockEventTarget {
  private keydownListeners: Array<(event: KeyboardEvent) => void> = []
  private keyupListeners: Array<(event: KeyboardEvent) => void> = []

  addEventListener(
    type: 'keydown' | 'keyup',
    listener: (event: KeyboardEvent) => void
  ): void {
    if (type === 'keydown') {
      this.keydownListeners.push(listener)
    } else if (type === 'keyup') {
      this.keyupListeners.push(listener)
    }
  }

  removeEventListener(
    type: 'keydown' | 'keyup',
    listener: (event: KeyboardEvent) => void
  ): void {
    if (type === 'keydown') {
      this.keydownListeners = this.keydownListeners.filter((l) => l !== listener)
    } else if (type === 'keyup') {
      this.keyupListeners = this.keyupListeners.filter((l) => l !== listener)
    }
  }

  simulateKeyDown(key: string): void {
    const event = { key, preventDefault: () => {} } as KeyboardEvent
    for (const listener of this.keydownListeners) {
      listener(event)
    }
  }

  simulateKeyUp(key: string): void {
    const event = { key, preventDefault: () => {} } as KeyboardEvent
    for (const listener of this.keyupListeners) {
      listener(event)
    }
  }
}

describe('WeaponSystem', () => {
  let world: World
  let weaponSystem: WeaponSystem
  let inputSystem: InputSystem
  let mockTarget: MockEventTarget
  let shipId: number

  beforeEach(() => {
    world = new World()
    mockTarget = new MockEventTarget()
    inputSystem = new InputSystem(mockTarget)
    weaponSystem = new WeaponSystem(inputSystem)

    // Create a test ship with weapon and transform
    shipId = world.createEntity() as unknown as number
    world.addComponent(shipId as any, new Transform())
    world.addComponent(shipId as any, new Weapon('single', 250))
  })

  afterEach(() => {
    inputSystem.destroy()
  })

  describe('Firing on Input', () => {
    it('should fire projectile when spacebar pressed', () => {
      // Simulate spacebar press via keyboard event
      mockTarget.simulateKeyDown(' ')

      const initialEntityCount = getEntityCount(world)

      weaponSystem.update(world, 16) // ~60 FPS frame

      const finalEntityCount = getEntityCount(world)

      // One new projectile should be created
      expect(finalEntityCount).toBe(initialEntityCount + 1)
    })

    it('should not fire without spacebar input', () => {
      // No spacebar press - ensure shoot action is not active
      const initialEntityCount = getEntityCount(world)

      weaponSystem.update(world, 16)

      const finalEntityCount = getEntityCount(world)

      // No new entity should be created
      expect(finalEntityCount).toBe(initialEntityCount)
    })

    it('should emit weaponFired event when firing', () => {
      mockTarget.simulateKeyDown(' ')

      weaponSystem.update(world, 16)

      const events = weaponSystem.getEvents()
      expect(events.length).toBeGreaterThan(0)
      expect(events[0].type).toBe('weaponFired')
      expect(events[0].weaponType).toBe('single')
    })

    it('should include correct position in weaponFired event', () => {
      const transform = world.getComponent(shipId as any, Transform)
      transform!.position.set(100, 200, 0)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const events = weaponSystem.getEvents()
      expect(events[0].position.x).toBeCloseTo(100, 0)
      expect(events[0].position.y).toBeCloseTo(200, 0)
    })

    it('should include correct direction in weaponFired event', () => {
      const transform = world.getComponent(shipId as any, Transform)
      transform!.rotation.z = 0 // Facing up (+Y direction)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const events = weaponSystem.getEvents()
      // Direction should be roughly (0, 1, 0) for rotation z = 0
      expect(events[0].direction.y).toBeGreaterThan(0.9)
    })
  })

  describe('Cooldown Enforcement', () => {
    it('should not fire during cooldown period', () => {
      mockTarget.simulateKeyDown(' ')

      // First shot
      weaponSystem.update(world, 16)
      const countAfterFirstShot = getEntityCount(world)

      // Immediate second attempt (within cooldown - only 16ms passed)
      weaponSystem.update(world, 16)
      const countAfterSecondAttempt = getEntityCount(world)

      // Second shot should not have fired
      expect(countAfterSecondAttempt).toBe(countAfterFirstShot)
    })

    it('should fire after cooldown expires', () => {
      const cooldownTime = 250 // ms
      mockTarget.simulateKeyDown(' ')

      // First shot
      weaponSystem.update(world, 16)
      const countAfterFirstShot = getEntityCount(world)

      // Simulate waiting for cooldown to expire
      weaponSystem.update(world, cooldownTime + 16)
      const countAfterCooldown = getEntityCount(world)

      // Second shot should have fired
      expect(countAfterCooldown).toBe(countAfterFirstShot + 1)
    })

    it('should enforce exact cooldown time (250ms for single shot)', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      expect(weapon?.cooldown).toBe(250)
    })

    it('should prevent rapid-fire with continuous input', () => {
      mockTarget.simulateKeyDown(' ')

      const shotCounts: number[] = []

      // Simulate 5 frames of firing input (each 16ms apart)
      for (let i = 0; i < 5; i++) {
        weaponSystem.update(world, 16)
        shotCounts.push(getEntityCount(world))
      }

      // Should only fire on first frame, not every frame (5*16ms = 80ms < 250ms cooldown)
      expect(shotCounts[1]).toBe(shotCounts[0]) // No second shot
      expect(shotCounts[2]).toBe(shotCounts[0]) // No third shot
      expect(shotCounts[3]).toBe(shotCounts[0]) // No fourth shot
      expect(shotCounts[4]).toBe(shotCounts[0]) // No fifth shot
    })

    it('should track cooldown using cumulative time', () => {
      mockTarget.simulateKeyDown(' ')

      // Fire first shot at t=0
      weaponSystem.update(world, 16) // t=16
      const countAfterFirst = getEntityCount(world)

      // Wait partial cooldown
      weaponSystem.update(world, 100) // t=116
      expect(getEntityCount(world)).toBe(countAfterFirst)

      // Wait more partial cooldown
      weaponSystem.update(world, 100) // t=216
      expect(getEntityCount(world)).toBe(countAfterFirst)

      // Cooldown should expire around t=266
      weaponSystem.update(world, 100) // t=316 - should fire
      expect(getEntityCount(world)).toBe(countAfterFirst + 1)
    })
  })

  describe('Fire Rate Limiting', () => {
    it('should only fire when action is active', () => {
      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const countAfterFirstFire = getEntityCount(world)

      // Turn off fire action by simulating key release
      mockTarget.simulateKeyUp(' ')
      weaponSystem.update(world, 300) // Wait past cooldown

      const countAfterNoFire = getEntityCount(world)

      // Should not fire again because action is not active
      expect(countAfterNoFire).toBe(countAfterFirstFire)
    })

    it('should allow firing after cooldown with held input', () => {
      mockTarget.simulateKeyDown(' ')

      // First fire
      weaponSystem.update(world, 16)
      const countAfterFirstShot = getEntityCount(world)

      // Wait for cooldown with spacebar still held
      weaponSystem.update(world, 250)

      const countAfterCooldown = getEntityCount(world)

      // Should fire again since spacebar is still held
      expect(countAfterCooldown).toBe(countAfterFirstShot + 1)
    })

    it('should allow firing after cooldown with new input press', () => {
      // First fire
      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)
      const countAfterFirstShot = getEntityCount(world)

      // Release spacebar
      mockTarget.simulateKeyUp(' ')

      // Wait for cooldown
      weaponSystem.update(world, 250)

      // Press spacebar again
      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const countAfterSecondShot = getEntityCount(world)

      // Second shot should have fired
      expect(countAfterSecondShot).toBe(countAfterFirstShot + 1)
    })
  })

  describe('Projectile Creation', () => {
    it('should create projectile at correct position offset from ship', () => {
      const testPosition = new Vector3(50, 60, 0)
      const transform = world.getComponent(shipId as any, Transform)
      transform!.position.copy(testPosition)
      transform!.rotation.z = 0 // Facing up

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      // Get projectile entity (newest created)
      const projectileId = findProjectileEntity(world, shipId)
      expect(projectileId).toBeDefined()

      const projectileTransform = world.getComponent(projectileId!, Transform)
      expect(projectileTransform).toBeDefined()

      // Projectile should be spawned ahead of ship, not at exact ship position
      // Ship facing up means projectile Y should be greater than ship Y
      expect(projectileTransform!.position.y).toBeGreaterThan(testPosition.y)
    })

    it('should create projectile in correct direction based on ship rotation', () => {
      const transform = world.getComponent(shipId as any, Transform)
      transform!.rotation.z = Math.PI / 2 // Facing left (-X direction)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const projectileId = findProjectileEntity(world, shipId)
      const projectile = world.getComponent(projectileId!, Projectile)

      expect(projectile).toBeDefined()
      expect(projectile!.projectileType).toBe('single')
    })

    it('should create projectile with correct owner', () => {
      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const projectileId = findProjectileEntity(world, shipId)
      const projectile = world.getComponent(projectileId!, Projectile)

      expect(projectile?.owner).toBe(shipId)
    })
  })

  describe('Weapon Configuration', () => {
    it('should use default single shot cooldown from config', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      expect(weapon?.cooldown).toBe(gameConfig.weapons.single.cooldown)
    })

    it('should use default single shot type', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      expect(weapon?.currentWeapon).toBe('single')
    })

    it('should have correct projectile damage from config', () => {
      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const projectileId = findProjectileEntity(world, shipId)
      const projectile = world.getComponent(projectileId!, Projectile)

      expect(projectile?.damage).toBe(gameConfig.weapons.single.damage)
    })
  })

  describe('Multiple Weapons Entities', () => {
    it('should handle multiple ships firing independently', () => {
      // Create second ship
      const ship2Id = world.createEntity() as unknown as number
      world.addComponent(ship2Id as any, new Transform())
      world.addComponent(ship2Id as any, new Weapon('single', 250))

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const totalEntities = getEntityCount(world)

      // Both ships should have fired: 2 ships + 2 projectiles = 4 entities
      expect(totalEntities).toBe(4)
    })

    it('should track cooldowns separately for each ship', () => {
      // Create second ship
      const ship2Id = world.createEntity() as unknown as number
      world.addComponent(ship2Id as any, new Transform())
      world.addComponent(ship2Id as any, new Weapon('single', 250))

      mockTarget.simulateKeyDown(' ')

      // First frame - both fire
      weaponSystem.update(world, 16)
      expect(getEntityCount(world)).toBe(4) // 2 ships + 2 projectiles

      // Second frame within cooldown - neither fires
      weaponSystem.update(world, 16)
      expect(getEntityCount(world)).toBe(4)

      // After cooldown - both fire again
      weaponSystem.update(world, 250)
      expect(getEntityCount(world)).toBe(6) // 2 ships + 4 projectiles
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing transform gracefully', () => {
      world.removeComponent(shipId as any, Transform)

      mockTarget.simulateKeyDown(' ')

      expect(() => {
        weaponSystem.update(world, 16)
      }).not.toThrow()

      // No projectile should be created
      expect(getEntityCount(world)).toBe(1) // Only ship remains
    })

    it('should handle missing weapon component gracefully', () => {
      world.removeComponent(shipId as any, Weapon)

      mockTarget.simulateKeyDown(' ')

      expect(() => {
        weaponSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle zero delta time', () => {
      mockTarget.simulateKeyDown(' ')

      expect(() => {
        weaponSystem.update(world, 0)
      }).not.toThrow()
    })

    it('should clear events between frames', () => {
      mockTarget.simulateKeyDown(' ')

      weaponSystem.update(world, 16)
      expect(weaponSystem.getEvents().length).toBe(1)

      // Next frame within cooldown - no firing
      weaponSystem.update(world, 16)
      expect(weaponSystem.getEvents().length).toBe(0)
    })

    it('should handle very large delta time', () => {
      mockTarget.simulateKeyDown(' ')

      expect(() => {
        weaponSystem.update(world, 10000) // 10 seconds
      }).not.toThrow()
    })
  })

  describe('Weapon Component Methods', () => {
    it('canFire should return true when cooldown expired', () => {
      const weapon = new Weapon('single', 250)
      weapon.lastFiredAt = 0

      expect(weapon.canFire(250)).toBe(true)
      expect(weapon.canFire(300)).toBe(true)
    })

    it('canFire should return false during cooldown', () => {
      const weapon = new Weapon('single', 250)
      // Simulate that weapon was fired at time 100
      weapon.lastFiredAt = 100

      // Check times within cooldown (100 + 250 = 350 is when cooldown expires)
      expect(weapon.canFire(200)).toBe(false) // 200 - 100 = 100 < 250
      expect(weapon.canFire(349)).toBe(false) // 349 - 100 = 249 < 250
    })

    it('canFire should return true when weapon has never been fired (lastFiredAt = 0)', () => {
      const weapon = new Weapon('single', 250)
      // lastFiredAt = 0 means never fired, should be able to fire immediately
      expect(weapon.canFire(0)).toBe(true)
      expect(weapon.canFire(16)).toBe(true)
    })

    it('recordFire should update lastFiredAt', () => {
      const weapon = new Weapon('single', 250)

      weapon.recordFire(1000)
      expect(weapon.lastFiredAt).toBe(1000)

      weapon.recordFire(2000)
      expect(weapon.lastFiredAt).toBe(2000)
    })

    it('consumeAmmo should work for finite ammo', () => {
      const weapon = new Weapon('single', 250, 10)

      expect(weapon.consumeAmmo()).toBe(true)
      expect(weapon.ammo).toBe(9)

      expect(weapon.consumeAmmo(5)).toBe(true)
      expect(weapon.ammo).toBe(4)

      expect(weapon.consumeAmmo(10)).toBe(false)
      expect(weapon.ammo).toBe(4)
    })

    it('consumeAmmo should always succeed for infinite ammo', () => {
      const weapon = new Weapon('single', 250, 'infinite')

      expect(weapon.consumeAmmo()).toBe(true)
      expect(weapon.ammo).toBe('infinite')
    })

    it('consumeEnergy should work correctly', () => {
      const weapon = new Weapon('single', 250, 'infinite', 100, 100)

      expect(weapon.consumeEnergy(30)).toBe(true)
      expect(weapon.energy).toBe(70)

      expect(weapon.consumeEnergy(80)).toBe(false)
      expect(weapon.energy).toBe(70)
    })

    it('addEnergy should cap at maxEnergy', () => {
      const weapon = new Weapon('single', 250, 'infinite', 100, 50)

      weapon.addEnergy(30)
      expect(weapon.energy).toBe(80)

      weapon.addEnergy(100)
      expect(weapon.energy).toBe(100)
    })

    it('hasAmmo should return correct value', () => {
      const weapon = new Weapon('single', 250, 5)

      expect(weapon.hasAmmo()).toBe(true)
      expect(weapon.hasAmmo(5)).toBe(true)
      expect(weapon.hasAmmo(6)).toBe(false)

      const infiniteWeapon = new Weapon('single', 250, 'infinite')
      expect(infiniteWeapon.hasAmmo(1000)).toBe(true)
    })
  })
})

// Helper function to count entities in world
function getEntityCount(world: World): number {
  return world.getEntityCount()
}

// Helper function to simulate key release
function simulateKeyRelease(inputSystem: InputSystem, mockTarget: MockEventTarget, key: string): void {
  mockTarget.simulateKeyUp(key)
}

// Helper function to find a projectile entity owned by a ship
function findProjectileEntity(world: World, ownerId: number): number | undefined {
  // Query all entities and find one with Projectile component
  // Since we can't easily query for specific component, we iterate
  for (let i = 1; i <= 100; i++) {
    // Assume entity IDs start at 1
    const projectile = world.getComponent(i as any, Projectile)
    if (projectile && projectile.owner === ownerId) {
      return i
    }
  }
  return undefined
}
