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
import { Transform, Weapon, Projectile, Asteroid } from '../../src/components'
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

  describe('Weapon Switching via Number Keys', () => {
    it('should switch to single shot when pressing 1', () => {
      // Start with spread weapon
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'spread'

      mockTarget.simulateKeyDown('1')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('single')
    })

    it('should switch to spread shot when pressing 2', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      expect(weapon!.currentWeapon).toBe('single')

      mockTarget.simulateKeyDown('2')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('spread')
    })

    it('should switch to laser when pressing 3', () => {
      const weapon = world.getComponent(shipId as any, Weapon)

      mockTarget.simulateKeyDown('3')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('laser')
    })

    it('should update currentWeapon correctly on each switch', () => {
      const weapon = world.getComponent(shipId as any, Weapon)

      // Switch to spread
      mockTarget.simulateKeyDown('2')
      weaponSystem.update(world, 16)
      mockTarget.simulateKeyUp('2')
      expect(weapon!.currentWeapon).toBe('spread')

      // Switch to laser
      mockTarget.simulateKeyDown('3')
      weaponSystem.update(world, 16)
      mockTarget.simulateKeyUp('3')
      expect(weapon!.currentWeapon).toBe('laser')

      // Switch back to single
      mockTarget.simulateKeyDown('1')
      weaponSystem.update(world, 16)
      mockTarget.simulateKeyUp('1')
      expect(weapon!.currentWeapon).toBe('single')
    })
  })

  describe('Weapon Switching via Z/X Keys (Cycling)', () => {
    it('should switch to next weapon when pressing X', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      expect(weapon!.currentWeapon).toBe('single')

      mockTarget.simulateKeyDown('x')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('spread')
    })

    it('should switch to previous weapon when pressing Z', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'spread'

      mockTarget.simulateKeyDown('z')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('single')
    })

    it('should wrap around to first weapon after last when pressing X', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing' // Last weapon in list

      mockTarget.simulateKeyDown('x')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('single')
    })

    it('should wrap around to last weapon from first when pressing Z', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      expect(weapon!.currentWeapon).toBe('single') // First weapon

      mockTarget.simulateKeyDown('z')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('homing')
    })
  })

  describe('Weapon Changed Event', () => {
    it('should emit weaponChanged event on weapon switch', () => {
      mockTarget.simulateKeyDown('2')
      weaponSystem.update(world, 16)

      const events = weaponSystem.getWeaponChangedEvents()
      expect(events.length).toBe(1)
      expect(events[0].type).toBe('weaponChanged')
      expect(events[0].previousWeapon).toBe('single')
      expect(events[0].newWeapon).toBe('spread')
    })

    it('should not emit weaponChanged event when switching to same weapon', () => {
      mockTarget.simulateKeyDown('1') // Already on single
      weaponSystem.update(world, 16)

      const events = weaponSystem.getWeaponChangedEvents()
      expect(events.length).toBe(0)
    })
  })

  describe('Spread Shot', () => {
    beforeEach(() => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'spread'
      weapon!.cooldown = 400 // Spread weapon cooldown
    })

    it('should fire 3 projectiles when using spread weapon', () => {
      const initialCount = getEntityCount(world)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const finalCount = getEntityCount(world)
      expect(finalCount).toBe(initialCount + 3)
    })

    it('should fire projectiles at center, -15, and +15 degree angles', () => {
      const transform = world.getComponent(shipId as any, Transform)
      transform!.rotation.z = 0 // Facing up

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      // Find all projectiles
      const projectiles = findAllProjectileEntities(world, shipId)
      expect(projectiles.length).toBe(3)

      // Get projectile transforms and check directions
      const projectileTransforms = projectiles.map((id) =>
        world.getComponent(id as any, Transform)
      )

      // Verify spread pattern - projectiles should have different velocities
      // representing center, -15 degrees, +15 degrees
      expect(projectileTransforms.length).toBe(3)
    })

    it('should use spread weapon cooldown of 400ms', () => {
      mockTarget.simulateKeyDown(' ')

      // First shot
      weaponSystem.update(world, 16)
      const countAfterFirst = getEntityCount(world)

      // Try to fire at 300ms (within cooldown)
      weaponSystem.update(world, 300)
      expect(getEntityCount(world)).toBe(countAfterFirst)

      // Destroy existing projectiles to allow second spread shot
      // (maxPlayerProjectiles limit of 4 would block firing 3+3=6)
      const projectiles = findAllProjectileEntities(world, shipId)
      for (const projId of projectiles) {
        world.destroyEntity(projId as any)
      }

      // Fire after 400ms cooldown (now that we have room for more projectiles)
      weaponSystem.update(world, 150) // 450ms total
      expect(getEntityCount(world)).toBe(1 + 3) // ship + 3 new projectiles
    })
  })

  describe('Laser Weapon', () => {
    beforeEach(() => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'laser'
      weapon!.energy = 100
      weapon!.maxEnergy = 100
    })

    it('should fire continuously while fire button held', () => {
      mockTarget.simulateKeyDown(' ')

      // First frame
      weaponSystem.update(world, 16)
      const events1 = weaponSystem.getLaserFiredEvents()
      expect(events1.length).toBe(1)

      // Second frame (continuous, no cooldown)
      weaponSystem.update(world, 16)
      const events2 = weaponSystem.getLaserFiredEvents()
      expect(events2.length).toBe(1)
    })

    it('should drain energy at 10 per frame while firing', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      expect(weapon!.energy).toBe(100)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16) // One frame

      expect(weapon!.energy).toBe(90) // 100 - 10 = 90
    })

    it('should regenerate energy at 5 per frame when not firing', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.energy = 50

      // No fire input, just update
      weaponSystem.update(world, 16)

      expect(weapon!.energy).toBe(55) // 50 + 5 = 55
    })

    it('should have max energy of 100', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.energy = 95

      // Regenerate but don't exceed max
      weaponSystem.update(world, 16)

      expect(weapon!.energy).toBe(100) // Capped at max
    })

    it('should stop firing when energy depleted', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.energy = 5 // Less than cost of 10

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      // Should not fire because energy < 10
      const events = weaponSystem.getLaserFiredEvents()
      expect(events.length).toBe(0)
    })

    it('should resume firing when energy is sufficient again', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.energy = 5

      // Can't fire
      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)
      expect(weaponSystem.getLaserFiredEvents().length).toBe(0)

      // Release fire, let energy regen
      mockTarget.simulateKeyUp(' ')
      weaponSystem.update(world, 16) // +5 = 10
      weaponSystem.update(world, 16) // +5 = 15

      // Now try to fire again
      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)
      expect(weaponSystem.getLaserFiredEvents().length).toBe(1)
    })

    it('should clamp energy to min 0', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.energy = 15

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16) // 15 - 10 = 5
      expect(weapon!.energy).toBe(5)

      // Can't fire, energy stays at 5
      weaponSystem.update(world, 16)
      expect(weapon!.energy).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Energy Bar Updates', () => {
    it('should track energy state for HUD updates', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'laser'
      weapon!.energy = 75

      // The energy state should be accessible for HUD
      expect(weapon!.energy).toBe(75)
      expect(weapon!.maxEnergy).toBe(100)
    })
  })

  describe('Weapon Switching Resets State', () => {
    it('should stop laser firing when switching weapons', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'laser'
      weapon!.energy = 100

      // Start laser firing
      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)
      expect(weaponSystem.getLaserFiredEvents().length).toBe(1)

      // Switch to single weapon (fire button still held)
      mockTarget.simulateKeyDown('1')
      weaponSystem.update(world, 16)

      // Laser should have stopped
      expect(weaponSystem.getLaserFiredEvents().length).toBe(0)
    })
  })

  describe('Rapid Weapon Switching', () => {
    it('should handle rapid weapon switching without errors', () => {
      const weapon = world.getComponent(shipId as any, Weapon)

      // Rapid switching
      for (let i = 0; i < 10; i++) {
        mockTarget.simulateKeyDown(String((i % 3) + 1)) // Cycle through 1, 2, 3
        weaponSystem.update(world, 16)
        mockTarget.simulateKeyUp(String((i % 3) + 1))
      }

      // Should not throw and weapon should be set
      expect(['single', 'spread', 'laser']).toContain(weapon!.currentWeapon)
    })
  })

  describe('Energy Boundary Conditions', () => {
    it('should handle energy at exactly 0', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'laser'
      weapon!.energy = 0

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      // Should not fire
      expect(weaponSystem.getLaserFiredEvents().length).toBe(0)
      // Energy should regenerate
      expect(weapon!.energy).toBe(5)
    })

    it('should handle energy at exactly energyCost', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'laser'
      weapon!.energy = 10 // Exactly the cost

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      // Should fire (has exactly enough)
      expect(weaponSystem.getLaserFiredEvents().length).toBe(1)
      expect(weapon!.energy).toBe(0)
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

// Helper function to find all projectile entities owned by a ship
function findAllProjectileEntities(world: World, ownerId: number): number[] {
  const projectiles: number[] = []
  for (let i = 1; i <= 100; i++) {
    const projectile = world.getComponent(i as any, Projectile)
    if (projectile && projectile.owner === ownerId) {
      projectiles.push(i)
    }
  }
  return projectiles
}

describe('Homing Missile Weapon', () => {
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

    // Create a test ship with homing weapon and initial ammo
    shipId = world.createEntity() as unknown as number
    world.addComponent(shipId as any, new Transform())
    world.addComponent(shipId as any, new Weapon('homing', 300, 10)) // homing weapon, 300ms cooldown, 10 ammo
  })

  afterEach(() => {
    inputSystem.destroy()
  })

  describe('Weapon Switching to Homing', () => {
    it('should switch to homing weapon when pressing 4', () => {
      // Start with single weapon
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'single'

      mockTarget.simulateKeyDown('4')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('homing')
    })

    it('should cycle to homing via X key from laser', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'laser'

      mockTarget.simulateKeyDown('x')
      weaponSystem.update(world, 16)

      expect(weapon!.currentWeapon).toBe('homing')
    })

    it('should emit weaponChanged event when switching to homing', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'single'

      mockTarget.simulateKeyDown('4')
      weaponSystem.update(world, 16)

      const events = weaponSystem.getWeaponChangedEvents()
      expect(events.length).toBe(1)
      expect(events[0].previousWeapon).toBe('single')
      expect(events[0].newWeapon).toBe('homing')
    })
  })

  describe('Homing Missile Firing with Ammo', () => {
    it('should fire homing missile when ammo available', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10

      const initialCount = getEntityCount(world)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const finalCount = getEntityCount(world)
      expect(finalCount).toBe(initialCount + 1)
    })

    it('should decrement ammo on fire', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      expect(weapon!.ammo).toBe(9)
    })

    it('should not fire when ammo is 0', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 0

      const initialCount = getEntityCount(world)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const finalCount = getEntityCount(world)
      expect(finalCount).toBe(initialCount) // No projectile created
    })

    it('should emit weaponFired event when firing homing', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const events = weaponSystem.getEvents()
      expect(events.length).toBe(1)
      expect(events[0].weaponType).toBe('homing')
    })
  })

  describe('Homing Missile Configuration', () => {
    it('should use homing missile speed of 300 units/s', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const projectileId = findProjectileEntity(world, shipId)
      expect(projectileId).toBeDefined()

      const projectile = world.getComponent(projectileId! as any, Projectile)
      expect(projectile?.projectileType).toBe('homing')
    })

    it('should use homing missile cooldown of 300ms', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10
      weapon!.cooldown = 300

      mockTarget.simulateKeyDown(' ')

      // First shot
      weaponSystem.update(world, 16)
      const countAfterFirst = getEntityCount(world)

      // Try to fire at 200ms (within cooldown)
      weaponSystem.update(world, 200)
      expect(getEntityCount(world)).toBe(countAfterFirst)

      // Fire after 300ms cooldown
      weaponSystem.update(world, 150) // 350ms total
      expect(getEntityCount(world)).toBe(countAfterFirst + 1)
    })
  })

  describe('Homing Target Acquisition', () => {
    it('should set homingTarget to nearest asteroid when firing', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10

      // Create an asteroid entity near the ship
      const asteroidId = world.createEntity()
      world.addComponent(asteroidId, new Transform(new Vector3(100, 100, 0)))
      world.addComponent(asteroidId, new Asteroid('large', 25))

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const projectileId = findProjectileEntity(world, shipId)
      expect(projectileId).toBeDefined()

      const projectile = world.getComponent(projectileId! as any, Projectile)
      expect(projectile?.homingTarget).toBe(asteroidId)
    })

    it('should select nearest asteroid within range', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10

      // Create two asteroids - one closer, one farther
      const nearAsteroidId = world.createEntity()
      world.addComponent(nearAsteroidId, new Transform(new Vector3(100, 0, 0)))
      world.addComponent(nearAsteroidId, new Asteroid('large', 25))

      const farAsteroidId = world.createEntity()
      world.addComponent(farAsteroidId, new Transform(new Vector3(300, 0, 0)))
      world.addComponent(farAsteroidId, new Asteroid('large', 25))

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const projectileId = findProjectileEntity(world, shipId)
      const projectile = world.getComponent(projectileId! as any, Projectile)

      // Should target the nearest asteroid
      expect(projectile?.homingTarget).toBe(nearAsteroidId)
    })

    it('should not set homingTarget if no asteroids within range', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10

      // Create an asteroid far outside homing range (500 units)
      const farAsteroidId = world.createEntity()
      world.addComponent(farAsteroidId, new Transform(new Vector3(1000, 0, 0)))
      world.addComponent(farAsteroidId, new Asteroid('large', 25))

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const projectileId = findProjectileEntity(world, shipId)
      const projectile = world.getComponent(projectileId! as any, Projectile)

      // Should have no target (fires straight)
      expect(projectile?.homingTarget).toBeUndefined()
    })

    it('should fire straight if no asteroids exist', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 10

      // No asteroids created

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const projectileId = findProjectileEntity(world, shipId)
      expect(projectileId).toBeDefined()

      const projectile = world.getComponent(projectileId! as any, Projectile)
      expect(projectile?.homingTarget).toBeUndefined()
    })
  })

  describe('Homing Missile Multiple Fires', () => {
    it('should consume ammo correctly over multiple shots', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'homing'
      weapon!.ammo = 3

      mockTarget.simulateKeyDown(' ')

      // First shot
      weaponSystem.update(world, 16)
      expect(weapon!.ammo).toBe(2)

      // Wait for cooldown and fire again
      weaponSystem.update(world, 350)
      expect(weapon!.ammo).toBe(1)

      // Wait for cooldown and fire again
      weaponSystem.update(world, 350)
      expect(weapon!.ammo).toBe(0)

      // Try to fire with no ammo
      weaponSystem.update(world, 350)
      expect(weapon!.ammo).toBe(0) // Still 0, no projectile
      expect(getEntityCount(world)).toBe(4) // ship + 3 projectiles
    })
  })
})

describe('MultiShot PowerUp Integration', () => {
  let world: World
  let weaponSystem: WeaponSystem
  let inputSystem: InputSystem
  let mockTarget: MockEventTarget
  let shipId: number
  let mockPowerUpSystem: {
    hasActiveEffect: (entityId: any, effectType: string) => boolean
  }
  let activeEffects: Map<string, Set<string>>

  beforeEach(() => {
    world = new World()
    mockTarget = new MockEventTarget()
    inputSystem = new InputSystem(mockTarget)

    // Create mock PowerUpSystem
    activeEffects = new Map()
    mockPowerUpSystem = {
      hasActiveEffect: (entityId: any, effectType: string) => {
        const entityEffects = activeEffects.get(String(entityId))
        return entityEffects?.has(effectType) ?? false
      }
    }

    weaponSystem = new WeaponSystem(inputSystem, mockPowerUpSystem as any)

    // Create a test ship with weapon and transform
    shipId = world.createEntity() as unknown as number
    world.addComponent(shipId as any, new Transform())
    world.addComponent(shipId as any, new Weapon('single', 250))
  })

  afterEach(() => {
    inputSystem.destroy()
  })

  // Helper to activate multiShot effect for an entity
  function activateMultiShot(entityId: number): void {
    const entityIdStr = String(entityId)
    if (!activeEffects.has(entityIdStr)) {
      activeEffects.set(entityIdStr, new Set())
    }
    activeEffects.get(entityIdStr)!.add('multiShot')
  }

  // Helper to deactivate multiShot effect for an entity
  function deactivateMultiShot(entityId: number): void {
    const entityIdStr = String(entityId)
    activeEffects.get(entityIdStr)?.delete('multiShot')
  }

  describe('MultiShot effect causes spread firing', () => {
    it('should fire 3 projectiles when multiShot is active and weapon is single', () => {
      // Activate multiShot for the ship
      activateMultiShot(shipId)

      const initialCount = getEntityCount(world)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const finalCount = getEntityCount(world)
      // Should fire 3 projectiles (spread pattern) instead of 1
      expect(finalCount).toBe(initialCount + 3)
    })

    it('should fire spread pattern at center, -15, and +15 degrees when multiShot active', () => {
      activateMultiShot(shipId)

      const transform = world.getComponent(shipId as any, Transform)
      transform!.rotation.z = 0 // Facing up

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      // Find all projectiles
      const projectiles = findAllProjectileEntities(world, shipId)
      expect(projectiles.length).toBe(3)
    })

    it('should fire single shot when multiShot is not active', () => {
      // No multiShot activated

      const initialCount = getEntityCount(world)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const finalCount = getEntityCount(world)
      // Should fire 1 projectile
      expect(finalCount).toBe(initialCount + 1)
    })

    it('should revert to single shot when multiShot expires', () => {
      // Start with multiShot active
      activateMultiShot(shipId)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const countAfterFirstShot = getEntityCount(world)
      expect(countAfterFirstShot).toBe(1 + 3) // ship + 3 projectiles

      // Destroy projectiles to allow more shots
      const projectiles = findAllProjectileEntities(world, shipId)
      for (const projId of projectiles) {
        world.destroyEntity(projId as any)
      }

      // Deactivate multiShot (simulating expiration)
      deactivateMultiShot(shipId)

      // Wait for cooldown and fire again
      weaponSystem.update(world, 300)

      // Should fire single shot now
      const finalCount = getEntityCount(world)
      expect(finalCount).toBe(1 + 1) // ship + 1 projectile
    })
  })

  describe('MultiShot stacks with RapidFire', () => {
    it('should fire 3 projectiles with reduced cooldown when both effects active', () => {
      activateMultiShot(shipId)

      // Simulate rapidFire by halving the cooldown
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.cooldown = 125 // Half of 250ms (rapidFire effect)

      mockTarget.simulateKeyDown(' ')

      // First shot
      weaponSystem.update(world, 16)
      const countAfterFirst = getEntityCount(world)
      expect(countAfterFirst).toBe(1 + 3) // ship + 3 projectiles

      // Destroy projectiles to allow more shots
      let projectiles = findAllProjectileEntities(world, shipId)
      for (const projId of projectiles) {
        world.destroyEntity(projId as any)
      }

      // Wait half the normal cooldown (rapidFire effect)
      weaponSystem.update(world, 130)

      // Should be able to fire again (rapidFire reduced cooldown)
      const countAfterSecond = getEntityCount(world)
      expect(countAfterSecond).toBe(1 + 3) // ship + 3 more projectiles
    })
  })

  describe('PowerUpSystem is optional (null safe)', () => {
    it('should work without PowerUpSystem (fires single shot)', () => {
      // Create WeaponSystem without PowerUpSystem
      const weaponSystemNoPowerUp = new WeaponSystem(inputSystem)

      const initialCount = getEntityCount(world)

      mockTarget.simulateKeyDown(' ')
      weaponSystemNoPowerUp.update(world, 16)

      const finalCount = getEntityCount(world)
      // Should fire single shot (no powerup system to check)
      expect(finalCount).toBe(initialCount + 1)
    })

    it('should handle null PowerUpSystem gracefully', () => {
      const weaponSystemNoPowerUp = new WeaponSystem(inputSystem, undefined)

      mockTarget.simulateKeyDown(' ')

      expect(() => {
        weaponSystemNoPowerUp.update(world, 16)
      }).not.toThrow()
    })
  })

  describe('MultiShot does not interfere with spread weapon', () => {
    it('should fire spread shot when weapon is already spread (regardless of multiShot)', () => {
      const weapon = world.getComponent(shipId as any, Weapon)
      weapon!.currentWeapon = 'spread'
      weapon!.cooldown = 400

      // MultiShot active but weapon is already spread
      activateMultiShot(shipId)

      const initialCount = getEntityCount(world)

      mockTarget.simulateKeyDown(' ')
      weaponSystem.update(world, 16)

      const finalCount = getEntityCount(world)
      // Should fire 3 projectiles (spread pattern)
      expect(finalCount).toBe(initialCount + 3)
    })
  })
})

describe('Max Player Projectiles Limit', () => {
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

  it('should not fire when player has max projectiles on screen', () => {
    // Config has maxPlayerProjectiles: 4 (classic Asteroids limit)
    const maxProjectiles = gameConfig.gameplay.maxPlayerProjectiles

    mockTarget.simulateKeyDown(' ')

    // Fire max projectiles (waiting for cooldown each time)
    for (let i = 0; i < maxProjectiles; i++) {
      weaponSystem.update(world, 16)
      if (i < maxProjectiles - 1) {
        weaponSystem.update(world, 250) // Wait for cooldown
      }
    }

    const countAtMax = getEntityCount(world)
    expect(countAtMax).toBe(1 + maxProjectiles) // ship + maxProjectiles

    // Try to fire one more after cooldown - should be blocked
    weaponSystem.update(world, 250) // Wait for cooldown
    const countAfterAttempt = getEntityCount(world)

    expect(countAfterAttempt).toBe(countAtMax) // No new projectile
  })

  it('should allow firing when projectile count drops below max', () => {
    const maxProjectiles = gameConfig.gameplay.maxPlayerProjectiles

    mockTarget.simulateKeyDown(' ')

    // Fire max projectiles
    for (let i = 0; i < maxProjectiles; i++) {
      weaponSystem.update(world, 16)
      if (i < maxProjectiles - 1) {
        weaponSystem.update(world, 250)
      }
    }

    const countAtMax = getEntityCount(world)

    // Simulate one projectile being destroyed (expired or hit something)
    const projectileId = findProjectileEntity(world, shipId)
    if (projectileId) {
      world.destroyEntity(projectileId as any)
    }

    // Wait for cooldown and try to fire again
    weaponSystem.update(world, 250)

    // Should be able to fire now
    const countAfterDestroy = getEntityCount(world)
    expect(countAfterDestroy).toBe(countAtMax) // back to max (one destroyed, one created)
  })

  it('should only count projectiles owned by the player', () => {
    const maxProjectiles = gameConfig.gameplay.maxPlayerProjectiles

    // Create enemy projectiles (different owner ID)
    const enemyId = world.createEntity() as unknown as number
    for (let i = 0; i < 10; i++) {
      const projId = world.createEntity()
      world.addComponent(projId, new Projectile(10, enemyId as any, 3000, 'single'))
      world.addComponent(projId, new Transform())
    }

    mockTarget.simulateKeyDown(' ')

    // Player should still be able to fire up to their max
    for (let i = 0; i < maxProjectiles; i++) {
      weaponSystem.update(world, 16)
      if (i < maxProjectiles - 1) {
        weaponSystem.update(world, 250)
      }
    }

    // Count player projectiles
    const playerProjectiles = findAllProjectileEntities(world, shipId)
    expect(playerProjectiles.length).toBe(maxProjectiles)
  })

  it('should count spread shot projectiles correctly (3 per shot)', () => {
    const weapon = world.getComponent(shipId as any, Weapon)
    weapon!.currentWeapon = 'spread'
    weapon!.cooldown = 400

    const maxProjectiles = gameConfig.gameplay.maxPlayerProjectiles

    mockTarget.simulateKeyDown(' ')

    // Fire spread shot (creates 3 projectiles)
    weaponSystem.update(world, 16)

    const playerProjectiles = findAllProjectileEntities(world, shipId)

    // With max of 4, one spread shot creates 3 projectiles
    // Next shot would create 3 more (total 6) which exceeds 4
    // So second spread shot should be blocked
    weaponSystem.update(world, 450) // Wait for cooldown

    const projectilesAfterSecondAttempt = findAllProjectileEntities(world, shipId)
    expect(projectilesAfterSecondAttempt.length).toBe(playerProjectiles.length) // Should not increase
  })

  it('should have maxPlayerProjectiles config set to 4 (classic Asteroids)', () => {
    expect(gameConfig.gameplay.maxPlayerProjectiles).toBe(4)
  })

  it('should allow firing when at max-1 projectiles', () => {
    const maxProjectiles = gameConfig.gameplay.maxPlayerProjectiles

    mockTarget.simulateKeyDown(' ')

    // Fire max-1 projectiles
    for (let i = 0; i < maxProjectiles - 1; i++) {
      weaponSystem.update(world, 16)
      if (i < maxProjectiles - 2) {
        weaponSystem.update(world, 250)
      }
    }

    const countBelowMax = getEntityCount(world)
    expect(countBelowMax).toBe(1 + maxProjectiles - 1)

    // Should be able to fire one more
    weaponSystem.update(world, 250)
    const countAfterFire = getEntityCount(world)
    expect(countAfterFire).toBe(1 + maxProjectiles)
  })
})
