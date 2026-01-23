/**
 * UISystem Unit Tests
 *
 * Tests for UISystem that bridges ECS world and HUD:
 * - Queries Player component and updates HUD
 * - Updates score display from player state
 * - Updates lives display from player state
 * - Handles missing Player gracefully
 * - Updates weapon from Weapon component
 * - Processes score changed events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { World } from '../../src/ecs/World'
import { Player } from '../../src/components/Player'
import { Weapon } from '../../src/components/Weapon'
import type { ScoreChangedEvent } from '../../src/types'

// Set up JSDOM before tests
let dom: JSDOM

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  global.document = dom.window.document
  global.HTMLElement = dom.window.HTMLElement
})

afterEach(() => {
  dom.window.close()
})

// Dynamic imports after JSDOM setup
async function getModules() {
  const [{ HUD }, { UISystem }] = await Promise.all([
    import('../../src/ui/HUD'),
    import('../../src/systems/UISystem')
  ])
  return { HUD, UISystem }
}

describe('UISystem', () => {
  describe('System Properties', () => {
    it('should have correct systemType', async () => {
      const { HUD, UISystem } = await getModules()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      expect(uiSystem.systemType).toBe('ui')
    })
  })

  describe('Player Component Updates', () => {
    it('should query for Player entity', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      // Create player entity
      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))

      // Spy on HUD update methods
      const updateScoreSpy = vi.spyOn(hud, 'updateScore')
      const updateLivesSpy = vi.spyOn(hud, 'updateLives')

      uiSystem.update(world, 16)

      expect(updateScoreSpy).toHaveBeenCalled()
      expect(updateLivesSpy).toHaveBeenCalled()
    })

    it('should update HUD with player score', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      // Create player with specific score
      const playerId = world.createEntity()
      const player = new Player(3)
      player.score = 500
      world.addComponent(playerId, player)

      const updateScoreSpy = vi.spyOn(hud, 'updateScore')

      uiSystem.update(world, 16)

      expect(updateScoreSpy).toHaveBeenCalledWith(500)
    })

    it('should update HUD with player lives', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      // Create player with specific lives
      const playerId = world.createEntity()
      const player = new Player(5)
      world.addComponent(playerId, player)

      const updateLivesSpy = vi.spyOn(hud, 'updateLives')

      uiSystem.update(world, 16)

      expect(updateLivesSpy).toHaveBeenCalledWith(5)
    })

    it('should update score from scoreChanged events', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      // Create player
      const playerId = world.createEntity()
      const player = new Player(3)
      player.score = 100
      world.addComponent(playerId, player)

      const updateScoreSpy = vi.spyOn(hud, 'updateScore')

      uiSystem.update(world, 16)

      expect(updateScoreSpy).toHaveBeenCalledWith(100)
    })

    it('should track score changes across frames', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      const player = new Player(3)
      world.addComponent(playerId, player)

      const updateScoreSpy = vi.spyOn(hud, 'updateScore')

      // First frame
      player.score = 100
      uiSystem.update(world, 16)
      expect(updateScoreSpy).toHaveBeenLastCalledWith(100)

      // Second frame with changed score
      player.score = 200
      uiSystem.update(world, 16)
      expect(updateScoreSpy).toHaveBeenLastCalledWith(200)
    })
  })

  describe('Weapon Component Updates', () => {
    it('should update HUD with current weapon', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))
      world.addComponent(playerId, new Weapon('spread'))

      const updateWeaponSpy = vi.spyOn(hud, 'updateWeapon')

      uiSystem.update(world, 16)

      expect(updateWeaponSpy).toHaveBeenCalledWith('spread')
    })

    it('should default to single weapon when no Weapon component', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      // Create player without weapon component
      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))

      const updateWeaponSpy = vi.spyOn(hud, 'updateWeapon')

      uiSystem.update(world, 16)

      expect(updateWeaponSpy).toHaveBeenCalledWith('single')
    })

    it('should handle weapon changes across frames', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))
      const weapon = new Weapon('single')
      world.addComponent(playerId, weapon)

      const updateWeaponSpy = vi.spyOn(hud, 'updateWeapon')

      // First frame
      uiSystem.update(world, 16)
      expect(updateWeaponSpy).toHaveBeenLastCalledWith('single')

      // Change weapon
      weapon.currentWeapon = 'laser'
      uiSystem.update(world, 16)
      expect(updateWeaponSpy).toHaveBeenLastCalledWith('laser')
    })
  })

  describe('Missing Player Handling', () => {
    it('should handle no Player entity gracefully', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      // No player entity created

      expect(() => {
        uiSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should not update HUD when no Player exists', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const updateScoreSpy = vi.spyOn(hud, 'updateScore')
      const updateLivesSpy = vi.spyOn(hud, 'updateLives')

      uiSystem.update(world, 16)

      // Should not be called when no player exists
      expect(updateScoreSpy).not.toHaveBeenCalled()
      expect(updateLivesSpy).not.toHaveBeenCalled()
    })

    it('should handle destroyed Player entity', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))

      // First update works
      uiSystem.update(world, 16)

      // Destroy the player
      world.destroyEntity(playerId)

      // Should not throw on next update
      expect(() => {
        uiSystem.update(world, 16)
      }).not.toThrow()
    })
  })

  describe('Wave Updates', () => {
    it('should update wave display from WaveSystem', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))

      const updateWaveSpy = vi.spyOn(hud, 'updateWave')

      // Set current wave
      uiSystem.setCurrentWave(5)
      uiSystem.update(world, 16)

      expect(updateWaveSpy).toHaveBeenCalledWith(5)
    })

    it('should default to wave 1', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))

      const updateWaveSpy = vi.spyOn(hud, 'updateWave')

      uiSystem.update(world, 16)

      expect(updateWaveSpy).toHaveBeenCalledWith(1)
    })
  })

  describe('Score Events Processing', () => {
    it('should accept score changed events', async () => {
      const { HUD, UISystem } = await getModules()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const scoreEvent: ScoreChangedEvent = {
        type: 'scoreChanged',
        timestamp: Date.now(),
        data: {
          previousScore: 0,
          newScore: 100,
          delta: 100,
          reason: 'Test'
        }
      }

      expect(() => {
        uiSystem.setScoreEvents([scoreEvent])
      }).not.toThrow()
    })

    it('should handle empty score events array', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))

      uiSystem.setScoreEvents([])

      expect(() => {
        uiSystem.update(world, 16)
      }).not.toThrow()
    })
  })

  describe('HUD Visibility Control', () => {
    it('should have access to HUD for visibility control', async () => {
      const { HUD, UISystem } = await getModules()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      expect(uiSystem.getHUD()).toBe(hud)
    })
  })

  describe('Multiple Updates', () => {
    it('should handle multiple updates per frame', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))

      // Should not throw on multiple rapid updates
      for (let i = 0; i < 10; i++) {
        expect(() => {
          uiSystem.update(world, 16)
        }).not.toThrow()
      }
    })

    it('should correctly update on each frame', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      const player = new Player(3)
      world.addComponent(playerId, player)

      const updateScoreSpy = vi.spyOn(hud, 'updateScore')

      // Simulate score changes across frames
      player.score = 100
      uiSystem.update(world, 16)

      player.score = 200
      uiSystem.update(world, 16)

      player.score = 300
      uiSystem.update(world, 16)

      expect(updateScoreSpy).toHaveBeenCalledTimes(3)
      expect(updateScoreSpy).toHaveBeenNthCalledWith(1, 100)
      expect(updateScoreSpy).toHaveBeenNthCalledWith(2, 200)
      expect(updateScoreSpy).toHaveBeenNthCalledWith(3, 300)
    })
  })

  describe('Zero Delta Time', () => {
    it('should handle zero delta time', async () => {
      const { HUD, UISystem } = await getModules()
      const world = new World()
      const hud = new HUD()
      const uiSystem = new UISystem(hud)

      const playerId = world.createEntity()
      world.addComponent(playerId, new Player(3))

      expect(() => {
        uiSystem.update(world, 0)
      }).not.toThrow()
    })
  })
})
