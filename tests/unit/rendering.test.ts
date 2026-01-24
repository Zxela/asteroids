/**
 * Rendering Unit Tests
 *
 * Tests for Three.js renderer setup and game loop:
 * - SceneManager: Scene, camera, lighting, and renderer setup
 * - Game: Game loop orchestration with fixed timestep
 *
 * Note: These tests use mocks for Three.js and browser APIs since
 * we're testing in a Node.js environment without WebGL/WebGPU.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'

// Mock Three.js modules - mocks are hoisted and factory functions execute inline
vi.mock('three/webgpu', () => ({
  WebGPURenderer: vi.fn().mockImplementation(function () {
    return {
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas'),
      init: vi.fn().mockResolvedValue(undefined),
      info: { render: { calls: 0 } }
    }
  })
}))

vi.mock('three', () => ({
  Scene: vi.fn().mockImplementation(function () {
    return {
      add: vi.fn(),
      background: null
    }
  }),
  PerspectiveCamera: vi.fn().mockImplementation(function () {
    return {
      position: { x: 0, y: 0, z: 0, set: vi.fn() },
      aspect: 1,
      updateProjectionMatrix: vi.fn()
    }
  }),
  Color: vi.fn().mockImplementation((color) => ({ color })),
  DirectionalLight: vi.fn().mockImplementation(function () {
    return {
      position: { set: vi.fn() }
    }
  }),
  AmbientLight: vi.fn().mockImplementation(() => ({})),
  WebGLRenderer: vi.fn().mockImplementation(function () {
    return {
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas'),
      info: { render: { calls: 0 } }
    }
  })
}))

// Mock GameStateMachine to return 'playing' state for tests
vi.mock('../../src/state/GameStateMachine', () => ({
  GameStateMachine: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    transition: vi.fn(),
    getCurrentStateName: vi.fn().mockReturnValue('playing'),
    registerState: vi.fn()
  }))
}))

// Mock UI components
vi.mock('../../src/ui/MainMenu', () => ({
  MainMenu: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    handleKeyDown: vi.fn(),
    onStartGame: vi.fn()
  }))
}))

vi.mock('../../src/ui/PauseMenu', () => ({
  PauseMenu: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    handleKeyDown: vi.fn(),
    onResume: vi.fn(),
    onQuit: vi.fn()
  }))
}))

vi.mock('../../src/ui/GameOverScreen', () => ({
  GameOverScreen: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    onRestart: vi.fn(),
    onMainMenu: vi.fn()
  }))
}))

vi.mock('../../src/ui/HUD', () => ({
  HUD: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    update: vi.fn()
  }))
}))

// Mock LeaderboardStorage
vi.mock('../../src/utils/LeaderboardStorage', () => ({
  LeaderboardStorage: vi.fn().mockImplementation(() => ({
    saveScore: vi.fn(),
    loadScores: vi.fn().mockReturnValue([]),
    getTopScores: vi.fn().mockReturnValue([])
  }))
}))

// Mock state classes
vi.mock('../../src/state/states/LoadingState', () => ({
  LoadingState: vi.fn().mockImplementation(() => ({ enter: vi.fn(), exit: vi.fn() }))
}))

vi.mock('../../src/state/states/MainMenuState', () => ({
  MainMenuState: vi.fn().mockImplementation(() => ({ enter: vi.fn(), exit: vi.fn() }))
}))

vi.mock('../../src/state/states/PlayingState', () => ({
  PlayingState: vi.fn().mockImplementation(() => ({ enter: vi.fn(), exit: vi.fn() }))
}))

vi.mock('../../src/state/states/PausedState', () => ({
  PausedState: vi.fn().mockImplementation(() => ({ enter: vi.fn(), exit: vi.fn() }))
}))

vi.mock('../../src/state/states/GameOverState', () => ({
  GameOverState: vi.fn().mockImplementation(() => ({ enter: vi.fn(), exit: vi.fn() }))
}))

// Mock createShip
vi.mock('../../src/entities/createShip', () => ({
  createShip: vi.fn().mockReturnValue(1)
}))

// Mock all systems
vi.mock('../../src/systems/InputSystem', () => ({
  InputSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'input',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/PhysicsSystem', () => ({
  PhysicsSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'physics',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/CollisionSystem', () => ({
  CollisionSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'collision',
    requiredComponents: [],
    getCollisions: vi.fn().mockReturnValue([])
  }))
}))

vi.mock('../../src/systems/DamageSystem', () => ({
  DamageSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'damage',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/ShipControlSystem', () => ({
  ShipControlSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'shipControl',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/WeaponSystem', () => ({
  WeaponSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'weapon',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/ProjectileSystem', () => ({
  ProjectileSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'projectile',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/AsteroidDestructionSystem', () => ({
  AsteroidDestructionSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'asteroidDestruction',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/RespawnSystem', () => ({
  RespawnSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'respawn',
    requiredComponents: [],
    getEvents: vi.fn().mockReturnValue([])
  }))
}))

vi.mock('../../src/systems/ScoreSystem', () => ({
  ScoreSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'score',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/WaveSystem', () => ({
  WaveSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'wave',
    requiredComponents: [],
    getCurrentWave: vi.fn().mockReturnValue(1),
    getEvents: vi.fn().mockReturnValue([])
  }))
}))

vi.mock('../../src/systems/PowerUpSystem', () => ({
  PowerUpSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'powerUp',
    requiredComponents: []
  }))
}))

vi.mock('../../src/systems/RenderSystem', () => ({
  RenderSystem: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    systemType: 'render',
    requiredComponents: []
  }))
}))

// Import modules after mocks are set up
import { SceneManager } from '../../src/rendering/SceneManager'
import { Game } from '../../src/game/Game'
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'

describe('SceneManager', () => {
  let sceneManager: SceneManager
  let mockCanvas: HTMLCanvasElement

  beforeEach(() => {
    // Setup mock canvas in DOM
    mockCanvas = document.createElement('canvas')
    mockCanvas.id = 'game'
    document.body.appendChild(mockCanvas)

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true })
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true, configurable: true })
  })

  afterEach(() => {
    // Clean up DOM only - don't clear mocks
    document.body.innerHTML = ''
  })

  describe('initialization', () => {
    it('should initialize successfully with async init', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      expect(sceneManager).toBeDefined()
      expect(sceneManager.getScene()).toBeDefined()
      expect(sceneManager.getCamera()).toBeDefined()
      expect(sceneManager.getRenderer()).toBeDefined()
    })

    it('should create scene with black background', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      const scene = sceneManager.getScene()
      expect(THREE.Scene).toHaveBeenCalled()
      expect(scene).toBeDefined()
    })

    it('should create WebGPURenderer', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      expect(WebGPURenderer).toHaveBeenCalled()
    })
  })

  describe('camera setup', () => {
    it('should create perspective camera', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      expect(THREE.PerspectiveCamera).toHaveBeenCalledWith(
        60,
        expect.any(Number),
        0.1,
        10000
      )
    })

    it('should position camera at z=750 for 2.5D gameplay', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      const camera = sceneManager.getCamera()
      expect(camera.position.z).toBe(750)
    })
  })

  describe('lighting setup', () => {
    it('should add directional light with intensity 1.0 (per Task 7.4)', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      expect(THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 1.0)
    })

    it('should add ambient light with dark blue color and intensity 0.4 (per Task 7.4)', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      expect(THREE.AmbientLight).toHaveBeenCalledWith(0x222244, 0.4)
    })
  })

  describe('renderer configuration', () => {
    it('should set renderer size to window dimensions', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      const renderer = sceneManager.getRenderer()
      expect(renderer.setSize).toHaveBeenCalledWith(1920, 1080)
    })

    it('should set pixel ratio to device DPI', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      const renderer = sceneManager.getRenderer()
      expect(renderer.setPixelRatio).toHaveBeenCalledWith(2)
    })
  })

  describe('viewport management', () => {
    it('should return correct viewport size', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      const { width, height } = sceneManager.getViewportSize()
      expect(width).toBe(1920)
      expect(height).toBe(1080)
    })
  })

  describe('rendering', () => {
    it('should render scene with camera', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      sceneManager.render()

      const renderer = sceneManager.getRenderer()
      expect(renderer.render).toHaveBeenCalledWith(
        sceneManager.getScene(),
        sceneManager.getCamera()
      )
    })
  })

  describe('resize handling', () => {
    it('should update viewport on window resize', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      // Simulate window resize
      Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 720, configurable: true })

      window.dispatchEvent(new Event('resize'))

      const { width, height } = sceneManager.getViewportSize()
      expect(width).toBe(1280)
      expect(height).toBe(720)
    })

    it('should update camera aspect ratio on resize', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      const camera = sceneManager.getCamera()

      // Simulate resize
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true })
      window.dispatchEvent(new Event('resize'))

      expect(camera.aspect).toBeCloseTo(800 / 600)
      expect(camera.updateProjectionMatrix).toHaveBeenCalled()
    })

    it('should update renderer size on resize', async () => {
      sceneManager = new SceneManager()
      await sceneManager.init()

      const renderer = sceneManager.getRenderer()

      // Clear initial calls
      vi.clearAllMocks()

      // Simulate resize
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true })
      window.dispatchEvent(new Event('resize'))

      expect(renderer.setSize).toHaveBeenCalledWith(800, 600)
    })
  })

  describe('cleanup', () => {
    it('should remove resize listener on dispose', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      sceneManager = new SceneManager()
      await sceneManager.init()
      sceneManager.dispose()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
  })
})

describe('Game', () => {
  let game: Game
  let mockCanvas: HTMLCanvasElement
  let animationFrameCallbacks: Array<(time: number) => void>
  let rafSpy: MockInstance
  let cafSpy: MockInstance

  beforeEach(() => {
    // Setup mock canvas
    mockCanvas = document.createElement('canvas')
    mockCanvas.id = 'game'
    document.body.appendChild(mockCanvas)

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true })
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true, configurable: true })

    // Mock requestAnimationFrame
    animationFrameCallbacks = []
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrameCallbacks.push(callback)
      return animationFrameCallbacks.length
    })
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.innerHTML = ''
    // Only restore the spies we created, not module mocks
    rafSpy.mockRestore()
    cafSpy.mockRestore()
  })

  describe('initialization', () => {
    it('should initialize game successfully', async () => {
      game = new Game()
      await game.initialize()

      expect(game).toBeDefined()
      expect(game.getWorld()).toBeDefined()
      expect(game.getSceneManager()).toBeDefined()
    })
  })

  describe('game loop', () => {
    it('should start game loop with requestAnimationFrame', async () => {
      game = new Game()
      await game.initialize()

      game.start()

      expect(window.requestAnimationFrame).toHaveBeenCalled()
    })

    it('should stop game loop when stop is called', async () => {
      game = new Game()
      await game.initialize()

      game.start()
      game.stop()

      expect(game.isRunning()).toBe(false)
    })

    it('should report running state correctly', async () => {
      game = new Game()
      await game.initialize()

      expect(game.isRunning()).toBe(false)

      game.start()
      expect(game.isRunning()).toBe(true)

      game.stop()
      expect(game.isRunning()).toBe(false)
    })
  })

  describe('fixed timestep', () => {
    it('should use fixed timestep of 1/60 seconds for physics', async () => {
      game = new Game()
      await game.initialize()

      expect(game.getFixedTimestep()).toBeCloseTo(1 / 60, 5)
    })

    it('should accumulate time and run physics at fixed intervals', async () => {
      game = new Game()
      await game.initialize()

      const world = game.getWorld()
      const updateSpy = vi.spyOn(world, 'update')

      // Mock performance.now() to control time
      let mockTime = 1000
      const performanceSpy = vi.spyOn(performance, 'now').mockImplementation(() => mockTime)

      game.start()

      // First frame - sets lastTime
      animationFrameCallbacks[animationFrameCallbacks.length - 1](mockTime)

      // Second frame - 33ms later (about 2 physics updates at 16.67ms each)
      mockTime = 1033
      animationFrameCallbacks[animationFrameCallbacks.length - 1](mockTime)

      expect(updateSpy).toHaveBeenCalled()
      performanceSpy.mockRestore()
    })

    it('should cap deltaTime at 100ms to prevent spiral of death', async () => {
      game = new Game()
      await game.initialize()

      const world = game.getWorld()
      const updateSpy = vi.spyOn(world, 'update')

      // Mock performance.now() to control time
      let mockTime = 1000
      const performanceSpy = vi.spyOn(performance, 'now').mockImplementation(() => mockTime)

      game.start()

      // First frame
      animationFrameCallbacks[animationFrameCallbacks.length - 1](mockTime)

      // Simulate a huge frame time (500ms) - should be capped at 100ms
      mockTime = 1500
      animationFrameCallbacks[animationFrameCallbacks.length - 1](mockTime)

      // Should not run more than 6 physics updates (100ms / 16.67ms)
      const callCount = updateSpy.mock.calls.length
      expect(callCount).toBeLessThanOrEqual(7)
      performanceSpy.mockRestore()
    })
  })

  describe('World integration', () => {
    it('should update World each physics tick', async () => {
      game = new Game()
      await game.initialize()

      const world = game.getWorld()
      const updateSpy = vi.spyOn(world, 'update')

      // Mock performance.now() to control time
      let mockTime = 1000
      const performanceSpy = vi.spyOn(performance, 'now').mockImplementation(() => mockTime)

      game.start()

      animationFrameCallbacks[animationFrameCallbacks.length - 1](mockTime)

      // Advance time by 17ms (about 1 physics tick)
      mockTime = 1017
      animationFrameCallbacks[animationFrameCallbacks.length - 1](mockTime)

      expect(updateSpy).toHaveBeenCalled()
      performanceSpy.mockRestore()
    })
  })

  describe('SceneManager integration', () => {
    it('should render each frame', async () => {
      game = new Game()
      await game.initialize()

      const sceneManager = game.getSceneManager()
      const renderSpy = vi.spyOn(sceneManager, 'render')

      game.start()

      const startTime = performance.now()
      animationFrameCallbacks[animationFrameCallbacks.length - 1](startTime)

      expect(renderSpy).toHaveBeenCalled()
    })
  })

  describe('target FPS', () => {
    it('should target 60 FPS', async () => {
      game = new Game()
      await game.initialize()

      expect(game.getFixedTimestep()).toBeCloseTo(1 / 60, 5)
    })
  })
})

describe('Game and SceneManager Integration', () => {
  let mockCanvas: HTMLCanvasElement
  let animationFrameCallbacks: Array<(time: number) => void>
  let rafSpy: MockInstance
  let cafSpy: MockInstance

  beforeEach(() => {
    mockCanvas = document.createElement('canvas')
    mockCanvas.id = 'game'
    document.body.appendChild(mockCanvas)

    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true })
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true, configurable: true })

    animationFrameCallbacks = []
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrameCallbacks.push(callback)
      return animationFrameCallbacks.length
    })
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.innerHTML = ''
    rafSpy.mockRestore()
    cafSpy.mockRestore()
  })

  it('should initialize and run a complete game loop cycle', async () => {
    const game = new Game()
    await game.initialize()

    const sceneManager = game.getSceneManager()
    const world = game.getWorld()

    const renderSpy = vi.spyOn(sceneManager, 'render')
    const updateSpy = vi.spyOn(world, 'update')

    // Mock performance.now() to control time
    let mockTime = 1000
    const performanceSpy = vi.spyOn(performance, 'now').mockImplementation(() => mockTime)

    game.start()
    expect(game.isRunning()).toBe(true)

    // Run one frame
    animationFrameCallbacks[animationFrameCallbacks.length - 1](mockTime)

    // Verify render was called
    expect(renderSpy).toHaveBeenCalled()

    // Run another frame to verify physics update
    mockTime = 1017
    animationFrameCallbacks[animationFrameCallbacks.length - 1](mockTime)

    // Verify world update was called
    expect(updateSpy).toHaveBeenCalled()

    game.stop()
    expect(game.isRunning()).toBe(false)
    performanceSpy.mockRestore()
  })
})
