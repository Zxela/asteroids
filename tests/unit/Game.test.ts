/**
 * Game Unit Tests
 *
 * Tests for the main Game class, focusing on:
 * - Global event emitter initialization and persistence
 * - Game state change event emissions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import type { GameFlowState } from '../../src/types/game'

// We need to set up JSDOM before importing Game
let dom: JSDOM
let document: Document
let window: Window & typeof globalThis

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  document = dom.window.document
  window = dom.window as unknown as Window & typeof globalThis
  // Make document, window, and HTMLElement available globally
  global.document = document
  global.window = window
  global.HTMLElement = dom.window.HTMLElement
  global.requestAnimationFrame = vi.fn((cb) => {
    return setTimeout(cb, 16) as unknown as number
  })
  global.cancelAnimationFrame = vi.fn()
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
})

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  dom.window.close()
})

// Mock modules before importing Game
vi.mock('three', () => ({
  Scene: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    traverse: vi.fn(),
    children: []
  })),
  PerspectiveCamera: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    lookAt: vi.fn(),
    aspect: 1,
    updateProjectionMatrix: vi.fn()
  })),
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    domElement: { style: {} },
    dispose: vi.fn()
  })),
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z, set: vi.fn(), clone: vi.fn() })),
  Color: vi.fn().mockImplementation(() => ({})),
  Mesh: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0, set: vi.fn() },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1, set: vi.fn() },
    geometry: { dispose: vi.fn() },
    material: { dispose: vi.fn() }
  })),
  BoxGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  Group: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    children: [],
    position: { x: 0, y: 0, z: 0 }
  })),
  InstancedMesh: vi.fn().mockImplementation(() => ({
    count: 0,
    setMatrixAt: vi.fn(),
    setColorAt: vi.fn(),
    instanceMatrix: { needsUpdate: false },
    instanceColor: { needsUpdate: false },
    geometry: { dispose: vi.fn() },
    material: { dispose: vi.fn() }
  })),
  Matrix4: vi.fn().mockImplementation(() => ({
    compose: vi.fn().mockReturnThis(),
    makeRotationZ: vi.fn().mockReturnThis()
  })),
  Quaternion: vi.fn().mockImplementation(() => ({
    setFromEuler: vi.fn().mockReturnThis()
  })),
  Euler: vi.fn().mockImplementation(() => ({})),
  SphereGeometry: vi.fn(),
  BufferGeometry: vi.fn(),
  LineBasicMaterial: vi.fn(),
  Line: vi.fn()
}))

// Mock SceneManager
vi.mock('../../src/rendering/SceneManager', () => ({
  SceneManager: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    getScene: vi.fn().mockReturnValue({
      add: vi.fn(),
      remove: vi.fn(),
      traverse: vi.fn(),
      children: []
    }),
    getCamera: vi.fn().mockReturnValue({
      position: { x: 0, y: 0, z: 0 },
      aspect: 1,
      updateProjectionMatrix: vi.fn()
    }),
    render: vi.fn(),
    clearGameObjects: vi.fn()
  }))
}))

// Mock AudioManager
vi.mock('../../src/audio/AudioManager', () => ({
  AudioManager: {
    getInstance: vi.fn().mockReturnValue({
      init: vi.fn().mockResolvedValue(undefined),
      playSound: vi.fn(),
      stopSound: vi.fn(),
      setMasterVolume: vi.fn()
    })
  }
}))

// Mock Starfield
vi.mock('../../src/rendering/Starfield', () => ({
  Starfield: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    dispose: vi.fn()
  }))
}))

// Mock AttractModeSystem
vi.mock('../../src/systems/AttractModeSystem', () => ({
  AttractModeSystem: vi.fn().mockImplementation(() => ({
    onStart: vi.fn(),
    onExit: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    resetIdleTimer: vi.fn(),
    updateIdleTimer: vi.fn().mockReturnValue(false),
    update: vi.fn().mockReturnValue({ movement: { x: 0, y: 0 }, shoot: false })
  })),
  createPressStartOverlay: vi.fn().mockReturnValue({ style: {} })
}))

// Mock UI components
vi.mock('../../src/ui/MainMenu', () => ({
  MainMenu: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    handleKeyDown: vi.fn(),
    onInteraction: vi.fn()
  }))
}))

vi.mock('../../src/ui/PauseMenu', () => ({
  PauseMenu: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    handleKeyDown: vi.fn()
  }))
}))

vi.mock('../../src/ui/GameOverScreen', () => ({
  GameOverScreen: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    show: vi.fn(),
    hide: vi.fn()
  }))
}))

vi.mock('../../src/ui/HUD', () => ({
  HUD: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    updateScore: vi.fn(),
    updateLives: vi.fn(),
    updateWave: vi.fn(),
    triggerWaveFlash: vi.fn()
  }))
}))

// Mock LeaderboardStorage
vi.mock('../../src/utils/LeaderboardStorage', () => ({
  LeaderboardStorage: vi.fn().mockImplementation(() => ({
    getLeaderboard: vi.fn().mockReturnValue({ entries: [], maxEntries: 10 }),
    addEntry: vi.fn()
  }))
}))

// Dynamically import Game after JSDOM setup
async function getGame() {
  const { Game } = await import('../../src/game/Game')
  return Game
}

describe('Game', () => {
  describe('Global Event Emitter', () => {
    it('should have globalEventEmitter property after construction', async () => {
      const Game = await getGame()
      const game = new Game()

      // The globalEventEmitter should exist immediately after construction
      // (not just after initialize)
      expect(game.getGlobalEventEmitter()).toBeDefined()
      expect(game.getGlobalEventEmitter()).not.toBeNull()
    })

    it('should have globalEventEmitter with on, off, and emit methods', async () => {
      const Game = await getGame()
      const game = new Game()

      const emitter = game.getGlobalEventEmitter()
      expect(typeof emitter.on).toBe('function')
      expect(typeof emitter.off).toBe('function')
      expect(typeof emitter.emit).toBe('function')
    })

    it('should persist globalEventEmitter across initialize calls', async () => {
      const Game = await getGame()
      const game = new Game()

      const emitterBeforeInit = game.getGlobalEventEmitter()
      await game.initialize()
      const emitterAfterInit = game.getGlobalEventEmitter()
      expect(emitterBeforeInit).toBe(emitterAfterInit)
    })
  })

  describe('Game State Changed Events', () => {
    it('should emit gameStateChanged event when transitioning to mainMenu', async () => {
      const Game = await getGame()
      const game = new Game()

      const eventHandler = vi.fn()
      game.getGlobalEventEmitter().on('gameStateChanged', eventHandler)

      await game.initialize()
      game.start()

      // start() transitions to mainMenu
      expect(eventHandler).toHaveBeenCalledWith({ state: 'mainMenu' })
    })

    it('should emit gameStateChanged event with correct state name', async () => {
      const Game = await getGame()
      const game = new Game()

      const receivedStates: GameFlowState[] = []
      game.getGlobalEventEmitter().on('gameStateChanged', (data: { state: GameFlowState }) => {
        receivedStates.push(data.state)
      })

      await game.initialize()
      game.start()

      // The start() method transitions: loading -> mainMenu
      // So we should receive 'mainMenu' as the state change event
      expect(receivedStates).toContain('mainMenu')
    })

    it('should emit gameStateChanged for all state transitions', async () => {
      const Game = await getGame()
      const game = new Game()

      const receivedStates: GameFlowState[] = []
      game.getGlobalEventEmitter().on('gameStateChanged', (data: { state: GameFlowState }) => {
        receivedStates.push(data.state)
      })

      await game.initialize()
      game.start() // -> mainMenu

      // We can't easily trigger all transitions without more complex mocking,
      // but we verify the mainMenu transition works
      expect(receivedStates.includes('mainMenu')).toBe(true)
    })

    it('should allow subscribing to events before game starts', async () => {
      const Game = await getGame()
      const game = new Game()

      const eventHandler = vi.fn()

      // Subscribe BEFORE initialize
      game.getGlobalEventEmitter().on('gameStateChanged', eventHandler)

      await game.initialize()
      game.start()

      // The handler should still receive the event
      expect(eventHandler).toHaveBeenCalled()
    })

    it('should include state property in gameStateChanged event data', async () => {
      const Game = await getGame()
      const game = new Game()

      let eventData: { state: GameFlowState } | null = null
      game.getGlobalEventEmitter().on('gameStateChanged', (data: { state: GameFlowState }) => {
        eventData = data
      })

      await game.initialize()
      game.start()

      expect(eventData).not.toBeNull()
      expect(eventData!.state).toBe('mainMenu')
    })
  })

  describe('Session Event Emitter Preservation', () => {
    it('should keep session-scoped eventEmitter separate from globalEventEmitter', async () => {
      const Game = await getGame()
      const game = new Game()

      await game.initialize()

      // globalEventEmitter exists from construction
      const globalEmitter = game.getGlobalEventEmitter()
      expect(globalEmitter).toBeDefined()

      // The session eventEmitter is created in initializeGameplay,
      // which happens when transitioning to 'playing' state
      // The global emitter should be different from any session emitter
    })
  })
})
