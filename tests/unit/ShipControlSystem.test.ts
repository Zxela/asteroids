/**
 * ShipControlSystem Unit Tests
 *
 * Tests for ship control system that converts input to physics:
 * - Rotation control with left/right input
 * - Acceleration with up/forward input
 * - Forward direction calculation from rotation
 * - Combined input handling
 * - Edge cases and constraints
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { ShipControlSystem } from '../../src/systems/ShipControlSystem'
import { InputSystem } from '../../src/systems/InputSystem'
import { Transform, Velocity, Physics, Player } from '../../src/components'
import { gameConfig } from '../../src/config'

/**
 * Mock event target for InputSystem testing.
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

describe('ShipControlSystem', () => {
  let world: World
  let shipControlSystem: ShipControlSystem
  let inputSystem: InputSystem
  let mockTarget: MockEventTarget
  let shipId: ReturnType<World['createEntity']>

  beforeEach(() => {
    world = new World()
    mockTarget = new MockEventTarget()
    inputSystem = new InputSystem(mockTarget)
    shipControlSystem = new ShipControlSystem(inputSystem)

    // Create a test ship entity with all required components
    shipId = world.createEntity()
    world.addComponent(shipId, new Transform())
    world.addComponent(shipId, new Velocity())
    world.addComponent(shipId, new Physics(1, 1, 300, true)) // damping=1 for predictable tests
    world.addComponent(shipId, new Player())
  })

  describe('System Interface', () => {
    it('should implement System interface with update method', () => {
      expect(typeof shipControlSystem.update).toBe('function')
    })
  })

  describe('Rotation Control', () => {
    it('should rotate ship left when left input active (ArrowLeft)', () => {
      mockTarget.simulateKeyDown('ArrowLeft')

      const velocityBefore = world.getComponent(shipId, Velocity)
      const angularZBefore = velocityBefore?.angular.z ?? 0

      shipControlSystem.update(world, 100) // 0.1 seconds

      const velocityAfter = world.getComponent(shipId, Velocity)
      const angularZAfter = velocityAfter?.angular.z ?? 0

      // Left input should increase (positive) angular velocity
      expect(angularZAfter).toBeGreaterThan(angularZBefore)
    })

    it('should rotate ship left when A key pressed', () => {
      mockTarget.simulateKeyDown('a')

      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)
      expect(velocity?.angular.z).toBeGreaterThan(0)
    })

    it('should rotate ship right when right input active (ArrowRight)', () => {
      mockTarget.simulateKeyDown('ArrowRight')

      const velocityBefore = world.getComponent(shipId, Velocity)
      const angularZBefore = velocityBefore?.angular.z ?? 0

      shipControlSystem.update(world, 100)

      const velocityAfter = world.getComponent(shipId, Velocity)
      const angularZAfter = velocityAfter?.angular.z ?? 0

      // Right input should decrease (negative) angular velocity
      expect(angularZAfter).toBeLessThan(angularZBefore)
    })

    it('should rotate ship right when D key pressed', () => {
      mockTarget.simulateKeyDown('d')

      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)
      expect(velocity?.angular.z).toBeLessThan(0)
    })

    it('should rotate at PI rad/s when full left input for 1 second', () => {
      mockTarget.simulateKeyDown('ArrowLeft')

      shipControlSystem.update(world, 1000) // 1 second

      const velocity = world.getComponent(shipId, Velocity)
      const expectedRotation = gameConfig.physics.shipRotationSpeed // PI

      expect(velocity?.angular.z).toBeCloseTo(expectedRotation, 1)
    })

    it('should rotate at -PI rad/s when full right input for 1 second', () => {
      mockTarget.simulateKeyDown('ArrowRight')

      shipControlSystem.update(world, 1000) // 1 second

      const velocity = world.getComponent(shipId, Velocity)
      const expectedRotation = -gameConfig.physics.shipRotationSpeed // -PI

      expect(velocity?.angular.z).toBeCloseTo(expectedRotation, 1)
    })

    it('should apply proportional rotation for partial input (diagonal)', () => {
      // Diagonal input: left + up = normalized x component < 1
      mockTarget.simulateKeyDown('ArrowLeft')
      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 1000)

      const velocity = world.getComponent(shipId, Velocity)
      // Diagonal input normalizes, so x is ~0.707
      const expectedRotation = gameConfig.physics.shipRotationSpeed * Math.SQRT1_2

      expect(velocity?.angular.z).toBeCloseTo(expectedRotation, 1)
    })

    it('should not rotate with zero horizontal input', () => {
      // Only vertical input
      mockTarget.simulateKeyDown('ArrowUp')

      const velocityBefore = world.getComponent(shipId, Velocity)
      const angularZBefore = velocityBefore?.angular.z ?? 0

      shipControlSystem.update(world, 100)

      const velocityAfter = world.getComponent(shipId, Velocity)

      expect(velocityAfter?.angular.z).toBeCloseTo(angularZBefore, 5)
    })
  })

  describe('Acceleration Control', () => {
    it('should accelerate ship forward when up input active (ArrowUp)', () => {
      // Ship facing up (rotation = 0)
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = 0

      mockTarget.simulateKeyDown('ArrowUp')

      const velocityBefore = world.getComponent(shipId, Velocity)
      const speedBefore = velocityBefore?.linear.length() ?? 0

      shipControlSystem.update(world, 100)

      const velocityAfter = world.getComponent(shipId, Velocity)
      const speedAfter = velocityAfter?.linear.length() ?? 0

      expect(speedAfter).toBeGreaterThan(speedBefore)
    })

    it('should accelerate when W key pressed', () => {
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = 0

      mockTarget.simulateKeyDown('w')

      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)
      expect(velocity?.linear.length()).toBeGreaterThan(0)
    })

    it('should accelerate in ship facing direction (rotation = 0 means +Y)', () => {
      // Ship facing up (rotation = 0)
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = 0

      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)

      // Facing up, so Y velocity should be primary, X should be ~0
      expect(velocity!.linear.y).toBeGreaterThan(0)
      expect(Math.abs(velocity!.linear.x)).toBeLessThan(0.001)
    })

    it('should accelerate in ship facing direction (rotation = PI/2 means +X)', () => {
      // Ship facing right (rotation = PI/2)
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = Math.PI / 2

      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)

      // Facing right, so X velocity should be primary
      expect(velocity!.linear.x).toBeGreaterThan(0)
      expect(Math.abs(velocity!.linear.y)).toBeLessThan(0.01) // Small tolerance for cos(PI/2)
    })

    it('should accelerate in ship facing direction (rotation = PI means -Y)', () => {
      // Ship facing down (rotation = PI)
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = Math.PI

      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)

      // Facing down, so Y velocity should be negative
      expect(velocity!.linear.y).toBeLessThan(0)
    })

    it('should apply correct acceleration magnitude over 1 second', () => {
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = 0

      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 1000) // 1 second

      const velocity = world.getComponent(shipId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      // Full input should give shipAcceleration per second
      expect(speed).toBeCloseTo(gameConfig.physics.shipAcceleration, 1)
    })

    it('should not accelerate with zero vertical input', () => {
      // Only horizontal input
      mockTarget.simulateKeyDown('ArrowLeft')

      const velocityBefore = world.getComponent(shipId, Velocity)
      const speedBefore = velocityBefore?.linear.length() ?? 0

      shipControlSystem.update(world, 100)

      const velocityAfter = world.getComponent(shipId, Velocity)
      const speedAfter = velocityAfter?.linear.length() ?? 0

      expect(speedAfter).toBeCloseTo(speedBefore, 5)
    })

    it('should not accelerate with negative vertical input (down)', () => {
      mockTarget.simulateKeyDown('ArrowDown')

      const velocityBefore = world.getComponent(shipId, Velocity)
      const speedBefore = velocityBefore?.linear.length() ?? 0

      shipControlSystem.update(world, 100)

      const velocityAfter = world.getComponent(shipId, Velocity)
      const speedAfter = velocityAfter?.linear.length() ?? 0

      expect(speedAfter).toBeCloseTo(speedBefore, 5)
    })
  })

  describe('Combined Input', () => {
    it('should handle simultaneous rotation and acceleration', () => {
      mockTarget.simulateKeyDown('ArrowLeft')
      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)

      // Both rotation and acceleration should occur
      expect(Math.abs(velocity!.angular.z)).toBeGreaterThan(0)
      expect(velocity!.linear.length()).toBeGreaterThan(0)
    })

    it('should handle full input in all directions (right + up)', () => {
      mockTarget.simulateKeyDown('ArrowRight')
      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)

      // Right rotation is negative angular velocity
      expect(velocity?.angular.z).toBeLessThan(0)
      expect(velocity?.linear.length()).toBeGreaterThan(0)
    })
  })

  describe('Player Entity Query', () => {
    it('should only process entities with Player component', () => {
      // Create non-player entity with same components
      const nonPlayerId = world.createEntity()
      world.addComponent(nonPlayerId, new Transform())
      world.addComponent(nonPlayerId, new Velocity())
      world.addComponent(nonPlayerId, new Physics(1, 1, 300, true))
      // No Player component!

      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 100)

      // Player ship should have velocity
      const playerVelocity = world.getComponent(shipId, Velocity)
      expect(playerVelocity?.linear.length()).toBeGreaterThan(0)

      // Non-player should NOT have velocity
      const nonPlayerVelocity = world.getComponent(nonPlayerId, Velocity)
      expect(nonPlayerVelocity?.linear.length()).toBeCloseTo(0, 5)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing velocity component gracefully', () => {
      world.removeComponent(shipId, Velocity)

      mockTarget.simulateKeyDown('ArrowUp')

      expect(() => {
        shipControlSystem.update(world, 100)
      }).not.toThrow()
    })

    it('should handle missing transform component gracefully', () => {
      world.removeComponent(shipId, Transform)

      mockTarget.simulateKeyDown('ArrowUp')

      expect(() => {
        shipControlSystem.update(world, 100)
      }).not.toThrow()
    })

    it('should handle zero delta time', () => {
      mockTarget.simulateKeyDown('ArrowUp')

      expect(() => {
        shipControlSystem.update(world, 0)
      }).not.toThrow()

      // Velocity should remain unchanged
      const velocity = world.getComponent(shipId, Velocity)
      expect(velocity?.linear.length()).toBeCloseTo(0, 5)
    })

    it('should handle empty world gracefully', () => {
      const emptyWorld = new World()

      mockTarget.simulateKeyDown('ArrowUp')

      expect(() => {
        shipControlSystem.update(emptyWorld, 100)
      }).not.toThrow()
    })

    it('should handle very small delta time', () => {
      mockTarget.simulateKeyDown('ArrowUp')

      shipControlSystem.update(world, 1) // 1ms

      const velocity = world.getComponent(shipId, Velocity)
      // Should have some small velocity
      expect(velocity?.linear.length()).toBeGreaterThan(0)
    })
  })

  describe('Forward Direction Calculation', () => {
    it('should calculate forward as (0, 1) when rotation is 0', () => {
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = 0

      mockTarget.simulateKeyDown('ArrowUp')
      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)
      // Forward direction at rotation 0 should be +Y
      expect(Math.abs(velocity!.linear.x)).toBeLessThan(0.001)
      expect(velocity!.linear.y).toBeGreaterThan(0)
    })

    it('should calculate forward as (1, 0) when rotation is PI/2', () => {
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = Math.PI / 2

      mockTarget.simulateKeyDown('ArrowUp')
      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)
      // Forward direction at rotation PI/2 should be +X
      expect(velocity!.linear.x).toBeGreaterThan(0)
      expect(Math.abs(velocity!.linear.y)).toBeLessThan(0.01)
    })

    it('should calculate forward as (0, -1) when rotation is PI', () => {
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = Math.PI

      mockTarget.simulateKeyDown('ArrowUp')
      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)
      // Forward direction at rotation PI should be -Y
      expect(Math.abs(velocity!.linear.x)).toBeLessThan(0.001)
      expect(velocity!.linear.y).toBeLessThan(0)
    })

    it('should calculate forward as (-1, 0) when rotation is -PI/2', () => {
      const transform = world.getComponent(shipId, Transform)
      transform!.rotation.z = -Math.PI / 2

      mockTarget.simulateKeyDown('ArrowUp')
      shipControlSystem.update(world, 100)

      const velocity = world.getComponent(shipId, Velocity)
      // Forward direction at rotation -PI/2 should be -X
      expect(velocity!.linear.x).toBeLessThan(0)
      expect(Math.abs(velocity!.linear.y)).toBeLessThan(0.01)
    })
  })
})
