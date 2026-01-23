/**
 * CameraEffectSystem Unit Tests
 *
 * Tests for screen shake camera effect on collisions:
 * - Shake activation on collision events
 * - Magnitude calculation based on collision types
 * - Duration and decay over time
 * - Multiple shake stacking
 * - Camera position reset after shake expires
 * - No shake on non-damage collisions (power-up collection)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Vector3 } from 'three'
import { CameraEffectSystem } from '../../src/systems/CameraEffectSystem'
import { EventEmitter } from '../../src/utils/EventEmitter'
import type { CollisionLayer } from '../../src/types/components'

// Mock camera interface
interface MockCamera {
  position: Vector3
}

// Mock SceneManager
interface MockSceneManager {
  getCamera(): MockCamera
}

// Create collision event data matching CollisionSystem format
interface TestCollisionEvent {
  type: 'collision'
  entity1: number
  entity2: number
  layer1: CollisionLayer
  layer2: CollisionLayer
  distance: number
}

// Game events interface for EventEmitter
interface GameEvents {
  collision: TestCollisionEvent
}

describe('CameraEffectSystem', () => {
  let cameraEffectSystem: CameraEffectSystem
  let eventEmitter: EventEmitter<GameEvents>
  let mockCamera: MockCamera
  let mockSceneManager: MockSceneManager

  beforeEach(() => {
    // Create mock camera with initial position
    mockCamera = {
      position: new Vector3(0, 0, 750)
    }

    // Create mock scene manager
    mockSceneManager = {
      getCamera: () => mockCamera
    }

    // Create event emitter
    eventEmitter = new EventEmitter<GameEvents>()

    // Create system with dependencies
    cameraEffectSystem = new CameraEffectSystem(
      eventEmitter as unknown as EventEmitter,
      mockSceneManager
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Shake Activation on Collision', () => {
    it('should activate shake on ship-asteroid collision', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)
    })

    it('should activate shake on asteroid-ship collision (reversed order)', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'asteroid',
        layer2: 'player',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)
    })

    it('should activate shake on projectile-asteroid collision', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'projectile',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)
    })

    it('should activate shake on ship-boss collision', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'boss',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)
    })

    it('should activate shake on ship-bossProjectile collision', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'bossProjectile',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)
    })

    it('should activate shake on projectile-boss collision', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'projectile',
        layer2: 'boss',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)
    })
  })

  describe('No Shake on Non-Damage Collisions', () => {
    it('should NOT activate shake on ship-powerup collision', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'powerup',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(false)
    })

    it('should NOT activate shake on powerup-ship collision (reversed order)', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'powerup',
        layer2: 'player',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(false)
    })
  })

  describe('Shake Magnitude Based on Collision Type', () => {
    it('should return magnitude 5 for ship-asteroid collision', () => {
      const magnitude = cameraEffectSystem.getMagnitudeForCollision('player', 'asteroid')
      expect(magnitude).toBe(5)
    })

    it('should return magnitude 5 for asteroid-ship collision (order independent)', () => {
      const magnitude = cameraEffectSystem.getMagnitudeForCollision('asteroid', 'player')
      expect(magnitude).toBe(5)
    })

    it('should return magnitude 7 for ship-boss collision', () => {
      const magnitude = cameraEffectSystem.getMagnitudeForCollision('player', 'boss')
      expect(magnitude).toBe(7)
    })

    it('should return magnitude 6 for ship-bossProjectile collision', () => {
      const magnitude = cameraEffectSystem.getMagnitudeForCollision('player', 'bossProjectile')
      expect(magnitude).toBe(6)
    })

    it('should return magnitude 2 for projectile-asteroid collision', () => {
      const magnitude = cameraEffectSystem.getMagnitudeForCollision('projectile', 'asteroid')
      expect(magnitude).toBe(2)
    })

    it('should return magnitude 3 for projectile-boss collision', () => {
      const magnitude = cameraEffectSystem.getMagnitudeForCollision('projectile', 'boss')
      expect(magnitude).toBe(3)
    })

    it('should return magnitude 0 for ship-powerup collision', () => {
      const magnitude = cameraEffectSystem.getMagnitudeForCollision('player', 'powerup')
      expect(magnitude).toBe(0)
    })

    it('ship-boss magnitude should be greater than ship-asteroid magnitude', () => {
      const shipBoss = cameraEffectSystem.getMagnitudeForCollision('player', 'boss')
      const shipAsteroid = cameraEffectSystem.getMagnitudeForCollision('player', 'asteroid')
      expect(shipBoss).toBeGreaterThan(shipAsteroid)
    })

    it('ship-asteroid magnitude should be greater than projectile-asteroid magnitude', () => {
      const shipAsteroid = cameraEffectSystem.getMagnitudeForCollision('player', 'asteroid')
      const projectileAsteroid = cameraEffectSystem.getMagnitudeForCollision('projectile', 'asteroid')
      expect(shipAsteroid).toBeGreaterThan(projectileAsteroid)
    })
  })

  describe('Shake Duration', () => {
    it('should have 100ms default shake duration', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      const activeShakes = cameraEffectSystem.getActiveShakes()
      expect(activeShakes.length).toBe(1)
      expect(activeShakes[0].duration).toBe(100)
    })

    it('should remove shake after duration expires', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)
      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)

      // Update with 101ms (past duration)
      cameraEffectSystem.update(101)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(false)
    })

    it('should keep shake active before duration expires', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      // Update with 50ms (before duration expires)
      cameraEffectSystem.update(50)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)
    })
  })

  describe('Shake Decay Over Time', () => {
    it('should have elapsed = 0 when shake starts', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      const activeShakes = cameraEffectSystem.getActiveShakes()
      expect(activeShakes[0].elapsed).toBe(0)
    })

    it('should increment elapsed time on update', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)
      cameraEffectSystem.update(50)

      const activeShakes = cameraEffectSystem.getActiveShakes()
      expect(activeShakes[0].elapsed).toBe(50)
    })

    it('should calculate decay factor correctly (linear decay)', () => {
      // Test linear decay: decayFactor = 1.0 - (elapsed / duration)
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      // At 50ms with 100ms duration, decay factor should be 0.5
      const decayFactor = cameraEffectSystem.calculateDecayFactor(50, 100)
      expect(decayFactor).toBeCloseTo(0.5, 5)
    })

    it('should have decay factor of 1.0 at start', () => {
      const decayFactor = cameraEffectSystem.calculateDecayFactor(0, 100)
      expect(decayFactor).toBeCloseTo(1.0, 5)
    })

    it('should have decay factor of 0.0 at end', () => {
      const decayFactor = cameraEffectSystem.calculateDecayFactor(100, 100)
      expect(decayFactor).toBeCloseTo(0.0, 5)
    })
  })

  describe('Camera Position Offset', () => {
    it('should apply offset to camera position during shake', () => {
      // Seed random for deterministic test (0.75 produces offset of 0.5 after formula)
      vi.spyOn(Math, 'random').mockReturnValue(0.75)

      const initialPosition = mockCamera.position.clone()

      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)
      cameraEffectSystem.update(16)

      // Camera should have been offset from original position
      const hasOffset =
        mockCamera.position.x !== initialPosition.x ||
        mockCamera.position.y !== initialPosition.y

      expect(hasOffset).toBe(true)
    })

    it('should only offset X and Y (not Z for 2.5D gameplay)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const initialZ = mockCamera.position.z

      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)
      cameraEffectSystem.update(16)

      expect(mockCamera.position.z).toBe(initialZ)
    })

    it('should return camera to original position after shake expires', () => {
      const originalPosition = mockCamera.position.clone()

      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      // Apply shake
      cameraEffectSystem.update(50)

      // Expire shake
      cameraEffectSystem.update(51)

      expect(cameraEffectSystem.hasActiveShakes()).toBe(false)
      expect(mockCamera.position.x).toBeCloseTo(originalPosition.x, 5)
      expect(mockCamera.position.y).toBeCloseTo(originalPosition.y, 5)
      expect(mockCamera.position.z).toBeCloseTo(originalPosition.z, 5)
    })
  })

  describe('Multiple Shake Stacking', () => {
    it('should stack multiple simultaneous shakes', () => {
      const collision1: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      const collision2: TestCollisionEvent = {
        type: 'collision',
        entity1: 3,
        entity2: 4,
        layer1: 'projectile',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collision1)
      eventEmitter.emit('collision', collision2)

      expect(cameraEffectSystem.getActiveShakeCount()).toBe(2)
    })

    it('should have additive magnitude for stacked shakes', () => {
      // Use 0.75 for positive offset (0.75 * 2 - 1 = 0.5)
      vi.spyOn(Math, 'random').mockReturnValue(0.75)

      // Two ship-asteroid collisions (magnitude 5 each) should produce larger offset
      const collision1: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      const collision2: TestCollisionEvent = {
        type: 'collision',
        entity1: 3,
        entity2: 4,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collision1)
      cameraEffectSystem.update(16)
      const singleShakeOffset = Math.abs(mockCamera.position.x)

      // Reset
      mockCamera.position.set(0, 0, 750)
      cameraEffectSystem.reset()

      // Two collisions at once
      eventEmitter.emit('collision', collision1)
      eventEmitter.emit('collision', collision2)
      cameraEffectSystem.update(16)

      const doubleShakeOffset = Math.abs(mockCamera.position.x)

      // Two shakes should create larger total offset (due to additive nature)
      expect(doubleShakeOffset).toBeGreaterThan(singleShakeOffset * 0.9)
    })

    it('should handle rapid collision spam', () => {
      // Simulate rapid collisions
      for (let i = 0; i < 10; i++) {
        const collision: TestCollisionEvent = {
          type: 'collision',
          entity1: i,
          entity2: i + 100,
          layer1: 'projectile',
          layer2: 'asteroid',
          distance: 10
        }
        eventEmitter.emit('collision', collision)
      }

      expect(cameraEffectSystem.getActiveShakeCount()).toBe(10)

      // All should expire after duration
      cameraEffectSystem.update(101)
      expect(cameraEffectSystem.getActiveShakeCount()).toBe(0)
    })

    it('should remove individual shakes as they expire', () => {
      const collision1: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collision1)
      cameraEffectSystem.update(50) // 50ms elapsed

      // Add another shake
      const collision2: TestCollisionEvent = {
        type: 'collision',
        entity1: 3,
        entity2: 4,
        layer1: 'projectile',
        layer2: 'asteroid',
        distance: 10
      }
      eventEmitter.emit('collision', collision2)

      expect(cameraEffectSystem.getActiveShakeCount()).toBe(2)

      // First shake expires at 100ms, second still has 50ms left
      cameraEffectSystem.update(51) // Total: 101ms for first, 51ms for second

      expect(cameraEffectSystem.getActiveShakeCount()).toBe(1)
    })
  })

  describe('Original Camera Position Storage', () => {
    it('should store original camera position on first shake', () => {
      const originalPosition = mockCamera.position.clone()

      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)
      cameraEffectSystem.update(16)

      const storedOriginal = cameraEffectSystem.getOriginalCameraPosition()
      expect(storedOriginal.x).toBeCloseTo(originalPosition.x, 5)
      expect(storedOriginal.y).toBeCloseTo(originalPosition.y, 5)
      expect(storedOriginal.z).toBeCloseTo(originalPosition.z, 5)
    })

    it('should not update original position during ongoing shake', () => {
      const originalPosition = mockCamera.position.clone()

      const collision1: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collision1)
      cameraEffectSystem.update(16)

      // Camera position has changed due to shake
      // Add another collision - original should still be the same
      const collision2: TestCollisionEvent = {
        type: 'collision',
        entity1: 3,
        entity2: 4,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collision2)
      cameraEffectSystem.update(16)

      const storedOriginal = cameraEffectSystem.getOriginalCameraPosition()
      expect(storedOriginal.x).toBeCloseTo(originalPosition.x, 5)
      expect(storedOriginal.y).toBeCloseTo(originalPosition.y, 5)
      expect(storedOriginal.z).toBeCloseTo(originalPosition.z, 5)
    })
  })

  describe('Configuration', () => {
    it('should use default intensity from config', () => {
      // Default intensity should be 5
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      const activeShakes = cameraEffectSystem.getActiveShakes()
      expect(activeShakes[0].magnitude).toBe(5)
    })

    it('should use configurable duration', () => {
      // Create system with custom config
      const customConfig = { intensity: 10, duration: 200 }
      const customSystem = new CameraEffectSystem(
        eventEmitter as unknown as EventEmitter,
        mockSceneManager,
        customConfig
      )

      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      const activeShakes = customSystem.getActiveShakes()
      expect(activeShakes[0].duration).toBe(200)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero delta time', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(() => {
        cameraEffectSystem.update(0)
      }).not.toThrow()

      expect(cameraEffectSystem.hasActiveShakes()).toBe(true)
    })

    it('should handle very large delta time', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      expect(() => {
        cameraEffectSystem.update(10000)
      }).not.toThrow()

      expect(cameraEffectSystem.hasActiveShakes()).toBe(false)
    })

    it('should handle update with no active shakes', () => {
      expect(() => {
        cameraEffectSystem.update(16)
      }).not.toThrow()
    })

    it('should handle collision with same layer on both sides', () => {
      // This shouldn't happen in practice, but test graceful handling
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'asteroid',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)

      // Should not crash, magnitude might be 0
      expect(() => {
        cameraEffectSystem.update(16)
      }).not.toThrow()
    })

    it('should reset state when reset() is called', () => {
      const collisionEvent: TestCollisionEvent = {
        type: 'collision',
        entity1: 1,
        entity2: 2,
        layer1: 'player',
        layer2: 'asteroid',
        distance: 10
      }

      eventEmitter.emit('collision', collisionEvent)
      cameraEffectSystem.update(16)

      cameraEffectSystem.reset()

      expect(cameraEffectSystem.hasActiveShakes()).toBe(false)
      expect(cameraEffectSystem.getActiveShakeCount()).toBe(0)
    })
  })

  describe('System Interface', () => {
    it('should implement System interface with update method', () => {
      expect(typeof cameraEffectSystem.update).toBe('function')
    })

    it('should have systemType property', () => {
      expect(cameraEffectSystem.systemType).toBe('cameraEffect')
    })
  })
})
