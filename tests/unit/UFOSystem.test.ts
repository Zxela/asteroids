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
