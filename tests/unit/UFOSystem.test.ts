/**
 * UFOSystem Unit Tests
 *
 * Tests for UFOSystem class:
 * - UFO AI movement patterns
 * - UFO shooting behavior
 * - Event emission (projectile fired, UFO destroyed)
 * - AudioManager integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Vector3 } from 'three'
import { UFOSystem } from '../../src/systems/UFOSystem'
import { AudioManager } from '../../src/audio/AudioManager'

describe('UFOSystem', () => {
  describe('AudioManager Integration', () => {
    it('should have audioManager property defined (AC-009d)', () => {
      const ufoSystem = new UFOSystem()
      expect(ufoSystem.audioManager).toBeDefined()
    })

    it('should have setAudioManager method (AC-009e)', () => {
      const ufoSystem = new UFOSystem()
      expect(typeof ufoSystem.setAudioManager).toBe('function')
    })

    it('should accept AudioManager instance in setAudioManager', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()

      expect(() => {
        ufoSystem.setAudioManager(audioManager)
      }).not.toThrow()
    })

    it('should store the AudioManager instance after setAudioManager', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()

      ufoSystem.setAudioManager(audioManager)

      expect(ufoSystem.audioManager).toBe(audioManager)
    })
  })

  describe('Sound State Tracking', () => {
    it('should track activeSoundId for current UFO sound (AC-009f)', () => {
      const ufoSystem = new UFOSystem()
      expect(ufoSystem.activeSoundId).toBe(null)
    })

    it('should track activeUfoId for current UFO entity (AC-009g)', () => {
      const ufoSystem = new UFOSystem()
      expect(ufoSystem.activeUfoId).toBe(null)
    })
  })

  describe('UFO Sound Playback on Spawn', () => {
    it('should play ufoLoop sound when first UFO spawns (AC-009h)', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      playSound.mockReturnValue(123) // mock sound ID

      ufoSystem.setAudioManager(audioManager)

      // Create a minimal world with UFO entity
      const world = createMockWorld()
      const ufoId = world.createEntity()

      // Add required components for large UFO
      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // Update system - should start sound on first UFO spawn
      ufoSystem.update(world, 16)

      expect(playSound).toHaveBeenCalledWith('ufoLoop', {
        loop: true,
        volume: 0.4,
        rate: expect.any(Number)
      })
    })

    it('should use pitch 1.0 for large UFO (AC-013)', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()
      const ufoId = world.createEntity()

      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      ufoSystem.update(world, 16)

      const playOptions = playSound.mock.calls[0][1]
      expect(playOptions.rate).toBe(1.0)
    })

    it('should use pitch 1.3 for small UFO (AC-013)', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()
      const ufoId = world.createEntity()

      world.addComponent(ufoId, {
        ufoSize: 'small',
        shootTimer: 1500,
        points: 1000
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(120, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      ufoSystem.update(world, 16)

      const playOptions = playSound.mock.calls[0][1]
      expect(playOptions.rate).toBe(1.3)
    })

    it('should not play sound if already playing', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()

      // First UFO
      const ufoId1 = world.createEntity()
      world.addComponent(ufoId1, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId1, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId1, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId1, {
        current: 1,
        max: 1
      })

      // First update - should play sound
      ufoSystem.update(world, 16)
      expect(playSound).toHaveBeenCalledTimes(1)

      // Second UFO spawns
      const ufoId2 = world.createEntity()
      world.addComponent(ufoId2, {
        ufoSize: 'small',
        shootTimer: 1500,
        points: 1000
      })
      world.addComponent(ufoId2, {
        position: new Vector3(100, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId2, {
        linear: new Vector3(120, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId2, {
        current: 1,
        max: 1
      })

      // Second update - should NOT play sound again
      ufoSystem.update(world, 16)
      expect(playSound).toHaveBeenCalledTimes(1)
    })
  })

  describe('Doppler Pitch Modulation', () => {
    it('should modulate sound pitch based on UFO horizontal position (AC-010)', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundRate = vi.spyOn(audioManager, 'setSoundRate')
      playSound.mockReturnValue(123) // mock sound ID

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()
      const ufoId = world.createEntity()

      // Create large UFO
      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0), // Center of screen
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO and starts sound
      ufoSystem.update(world, 16)

      // Second update - should modulate pitch
      ufoSystem.update(world, 16)

      expect(setSoundRate).toHaveBeenCalled()
      const lastCall = setSoundRate.mock.calls[setSoundRate.mock.calls.length - 1]
      const soundId = lastCall[0]
      const pitch = lastCall[1]

      expect(soundId).toBe(123)
      expect(pitch).toBeGreaterThanOrEqual(0.8)
      expect(pitch).toBeLessThanOrEqual(1.2)
    })

    it('should use pitch 0.8 when UFO is at left edge', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundRate = vi.spyOn(audioManager, 'setSoundRate')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()
      const ufoId = world.createEntity()

      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(-960, 0, 0), // Left edge
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO
      ufoSystem.update(world, 16)

      // Second update - should set pitch to 0.8
      ufoSystem.update(world, 16)

      const lastCall = setSoundRate.mock.calls[setSoundRate.mock.calls.length - 1]
      const pitch = lastCall[1]

      expect(pitch).toBeCloseTo(0.8, 2)
    })

    it('should use pitch 1.2 when UFO is at right edge', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundRate = vi.spyOn(audioManager, 'setSoundRate')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()
      const ufoId = world.createEntity()

      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(960, 0, 0), // Right edge
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO
      ufoSystem.update(world, 16)

      // Second update - should set pitch to 1.2
      ufoSystem.update(world, 16)

      const lastCall = setSoundRate.mock.calls[setSoundRate.mock.calls.length - 1]
      const pitch = lastCall[1]

      expect(pitch).toBeCloseTo(1.2, 2)
    })

    it('should use pitch 1.0 when UFO is at center', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundRate = vi.spyOn(audioManager, 'setSoundRate')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()
      const ufoId = world.createEntity()

      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0), // Center
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO
      ufoSystem.update(world, 16)

      // Second update - should set pitch to 1.0
      ufoSystem.update(world, 16)

      const lastCall = setSoundRate.mock.calls[setSoundRate.mock.calls.length - 1]
      const pitch = lastCall[1]

      expect(pitch).toBeCloseTo(1.0, 2)
    })

    it('should apply basePitch multiplier for small UFO doppler effect', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundRate = vi.spyOn(audioManager, 'setSoundRate')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()
      const ufoId = world.createEntity()

      world.addComponent(ufoId, {
        ufoSize: 'small',
        shootTimer: 1500,
        points: 1000
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0), // Center
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(120, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO
      ufoSystem.update(world, 16)

      // Second update - should apply 1.3x multiplier to center pitch (1.0 * 1.3 = 1.3)
      ufoSystem.update(world, 16)

      const lastCall = setSoundRate.mock.calls[setSoundRate.mock.calls.length - 1]
      const pitch = lastCall[1]

      expect(pitch).toBeCloseTo(1.3, 2)
    })

    it('should not call setSoundRate if activeSoundId is null', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const setSoundRate = vi.spyOn(audioManager, 'setSoundRate')

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()

      // Update with no UFOs
      ufoSystem.update(world, 16)

      expect(setSoundRate).not.toHaveBeenCalled()
    })

    it('should not call setSoundRate if audioManager is null', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      playSound.mockReturnValue(123)

      // Don't set audio manager
      const world = createMockWorld()
      const ufoId = world.createEntity()

      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      ufoSystem.update(world, 16)

      expect(playSound).not.toHaveBeenCalled()
    })
  })

  describe('Distance-based Volume Modulation', () => {
    it('should modulate sound volume based on distance to player (AC-011)', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundVolume = vi.spyOn(audioManager, 'setSoundVolume')
      playSound.mockReturnValue(123) // mock sound ID

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()

      // Create player at center
      const playerId = world.createEntity()
      world.addComponent(playerId, {
        // Player marker component
      })
      world.addComponent(playerId, {
        position: new Vector3(0, 0, 0), // Center
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })

      // Create UFO at center (close to player)
      const ufoId = world.createEntity()
      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0), // Same position as player
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO and starts sound
      ufoSystem.update(world, 16)

      // Second update - should modulate volume based on distance
      ufoSystem.update(world, 16)

      expect(setSoundVolume).toHaveBeenCalled()
      const lastCall = setSoundVolume.mock.calls[setSoundVolume.mock.calls.length - 1]
      const soundId = lastCall[0]
      const volume = lastCall[1]

      expect(soundId).toBe(123)
      expect(volume).toBeGreaterThanOrEqual(0.2)
      expect(volume).toBeLessThanOrEqual(0.6)
    })

    it('should use volume 0.6 when UFO is at same position as player', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundVolume = vi.spyOn(audioManager, 'setSoundVolume')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()

      // Create player at center
      const playerId = world.createEntity()
      world.addComponent(playerId, {
        // Player marker component
      })
      world.addComponent(playerId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })

      // Create UFO at same position
      const ufoId = world.createEntity()
      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0), // Same as player
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO
      ufoSystem.update(world, 16)

      // Second update - should set volume to 0.6 (closest)
      ufoSystem.update(world, 16)

      const lastCall = setSoundVolume.mock.calls[setSoundVolume.mock.calls.length - 1]
      const volume = lastCall[1]

      expect(volume).toBeCloseTo(0.6, 2)
    })

    it('should use minimum volume 0.2 when UFO is very far from player', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundVolume = vi.spyOn(audioManager, 'setSoundVolume')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()

      // Create player at center
      const playerId = world.createEntity()
      world.addComponent(playerId, {
        // Player marker component
      })
      world.addComponent(playerId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })

      // Create UFO very far away (beyond max distance)
      const ufoId = world.createEntity()
      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(2000, 2000, 0), // Very far, beyond maxDistance
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO
      ufoSystem.update(world, 16)

      // Second update - should set volume to 0.2 (minimum, clamped)
      ufoSystem.update(world, 16)

      const lastCall = setSoundVolume.mock.calls[setSoundVolume.mock.calls.length - 1]
      const volume = lastCall[1]

      expect(volume).toBe(0.2)
    })

    it('should not call setSoundVolume if activeSoundId is null', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const setSoundVolume = vi.spyOn(audioManager, 'setSoundVolume')

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()

      // Create player but no UFO
      const playerId = world.createEntity()
      world.addComponent(playerId, {
        // Player marker component
      })
      world.addComponent(playerId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })

      // Update with no UFOs
      ufoSystem.update(world, 16)

      expect(setSoundVolume).not.toHaveBeenCalled()
    })

    it('should not call setSoundVolume if audioManager is null', () => {
      const ufoSystem = new UFOSystem()

      const world = createMockWorld()

      // Create player
      const playerId = world.createEntity()
      world.addComponent(playerId, {
        // Player marker component
      })
      world.addComponent(playerId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })

      // Create UFO
      const ufoId = world.createEntity()
      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // Update without audio manager set
      ufoSystem.update(world, 16)

      // setSoundVolume should not be called (no way to spy on it since audioManager is null)
      // This test just ensures no crash
      expect(ufoSystem.audioManager).toBeNull()
    })

    it('should not call setSoundVolume if player does not exist', () => {
      const ufoSystem = new UFOSystem()
      const audioManager = AudioManager.getInstance()
      const playSound = vi.spyOn(audioManager, 'playSound')
      const setSoundVolume = vi.spyOn(audioManager, 'setSoundVolume')
      playSound.mockReturnValue(123)

      ufoSystem.setAudioManager(audioManager)

      const world = createMockWorld()

      // Create UFO but no player
      const ufoId = world.createEntity()
      world.addComponent(ufoId, {
        ufoSize: 'large',
        shootTimer: 2000,
        points: 200
      })
      world.addComponent(ufoId, {
        position: new Vector3(0, 0, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1)
      })
      world.addComponent(ufoId, {
        linear: new Vector3(80, 0, 0),
        angular: new Vector3(0, 0, 0)
      })
      world.addComponent(ufoId, {
        current: 1,
        max: 1
      })

      // First update - spawns UFO
      ufoSystem.update(world, 16)

      // Second update - should NOT call setSoundVolume (no player)
      ufoSystem.update(world, 16)

      expect(setSoundVolume).not.toHaveBeenCalled()
    })
  })
})

// Helper function to create a mock world
function createMockWorld() {
  const entities = new Map()
  const components = new Map()

  return {
    createEntity: () => {
      const id = entities.size + 1
      entities.set(id, true)
      components.set(id, new Map())
      return id
    },
    addComponent: (entityId: number, component: any) => {
      const entityComponents = components.get(entityId)
      if (entityComponents) {
        // Infer component type from structure
        if ('ufoSize' in component) {
          entityComponents.set('UFO', component)
        } else if ('position' in component) {
          entityComponents.set('Transform', component)
        } else if ('linear' in component) {
          entityComponents.set('Velocity', component)
        } else if ('current' in component) {
          entityComponents.set('Health', component)
        } else if (Object.keys(component).length === 0) {
          // Empty object is Player component marker
          entityComponents.set('Player', component)
        }
      }
    },
    getComponent: (entityId: number, componentClass: any) => {
      const entityComponents = components.get(entityId)
      if (!entityComponents) return null

      const className = componentClass.name
      return entityComponents.get(className) || null
    },
    query: (...componentClasses: any[]) => {
      const result = []
      for (const [entityId, entityComponents] of components) {
        const hasAll = componentClasses.every(cls =>
          entityComponents.has(cls.name)
        )
        if (hasAll) {
          result.push(entityId)
        }
      }
      return result
    },
    destroyEntity: (entityId: number) => {
      entities.delete(entityId)
      components.delete(entityId)
    }
  }
}
