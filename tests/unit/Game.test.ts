/**
 * Game Unit Tests - Screen Flash Feature
 *
 * Tests for Game class screen flash functionality:
 * - Flash overlay element creation
 * - Flash overlay styling (covers screen, pointer-events: none)
 * - Flash triggered on powerUpCollected event
 * - Flash color matches powerup color
 * - Flash opacity and duration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { Vector3 } from 'three'

// Mock modules before importing Game
vi.mock('../../src/rendering/SceneManager', () => ({
  SceneManager: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    getScene: vi.fn().mockReturnValue({}),
    getCamera: vi.fn().mockReturnValue({}),
    render: vi.fn(),
    clearGameObjects: vi.fn()
  }))
}))

vi.mock('../../src/audio/AudioManager', () => ({
  AudioManager: {
    getInstance: vi.fn().mockReturnValue({
      init: vi.fn().mockResolvedValue(undefined),
      playMusic: vi.fn(),
      stopMusic: vi.fn(),
      playSFX: vi.fn()
    })
  }
}))

vi.mock('../../src/rendering/Starfield', () => ({
  Starfield: vi.fn().mockImplementation(() => ({
    update: vi.fn()
  }))
}))

// Set up JSDOM before importing Game
let dom: JSDOM
let document: Document

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  document = dom.window.document
  // Make document and window available globally
  global.document = document
  global.HTMLElement = dom.window.HTMLElement
  global.window = dom.window as unknown as Window & typeof globalThis

  // Mock requestAnimationFrame
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    setTimeout(() => cb(performance.now()), 16)
    return 1
  })

  // Mock performance.now
  vi.stubGlobal('performance', {
    now: () => Date.now()
  })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.unstubAllGlobals()
  dom.window.close()
})

// Dynamically import Game after JSDOM setup
async function getGame() {
  const { Game } = await import('../../src/game/Game')
  return Game
}

describe('Game - Screen Flash Feature', () => {
  describe('Flash Overlay Element Creation (AC1, AC2)', () => {
    it('should create flash overlay element on initialization', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]')

      expect(flashOverlay).not.toBeNull()
      expect(flashOverlay).toBeInstanceOf(dom.window.HTMLElement)
    })

    it('should add flash overlay to DOM body', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]')

      expect(flashOverlay?.parentElement).toBe(document.body)
    })

    it('should set flash overlay to cover entire screen with fixed positioning', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement

      expect(flashOverlay.style.position).toBe('fixed')
      // Accept either '0' or '0px' as both are valid CSS
      expect(['0', '0px']).toContain(flashOverlay.style.inset)
    })

    it('should set pointer-events to none on flash overlay', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement

      expect(flashOverlay.style.pointerEvents).toBe('none')
    })

    it('should initialize flash overlay with opacity 0', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement

      expect(flashOverlay.style.opacity).toBe('0')
    })

    it('should set transition property on flash overlay', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement

      expect(flashOverlay.style.transition).toContain('opacity')
    })
  })

  describe('Flash Screen Method', () => {
    it('should have a flashScreen method', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      expect(typeof (game as any).flashScreen).toBe('function')
    })

    it('should set background color from hex color parameter (AC4)', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement
      const color = 0xff00ff // Magenta

      ;(game as any).flashScreen(color)

      expect(flashOverlay.style.backgroundColor).toBe('rgb(255, 0, 255)')
    })

    it('should set opacity to 0.3 during flash (AC5)', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement
      const color = 0x00ffff // Cyan

      ;(game as any).flashScreen(color)

      expect(flashOverlay.style.opacity).toBe('0.3')
    })

    it('should fade out flash after 100ms (AC6, AC7)', async () => {
      vi.useFakeTimers()

      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement
      const color = 0x00ff00 // Green

      ;(game as any).flashScreen(color)
      expect(flashOverlay.style.opacity).toBe('0.3')

      // Advance timer by 100ms
      vi.advanceTimersByTime(100)

      expect(flashOverlay.style.opacity).toBe('0')

      vi.useRealTimers()
    })

    it('should handle different powerup colors correctly', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement

      // Test shield (cyan)
      ;(game as any).flashScreen(0x00ffff)
      expect(flashOverlay.style.backgroundColor).toBe('rgb(0, 255, 255)')

      // Test rapidFire (orange)
      ;(game as any).flashScreen(0xff8800)
      expect(flashOverlay.style.backgroundColor).toBe('rgb(255, 136, 0)')

      // Test multiShot (magenta)
      ;(game as any).flashScreen(0xff00ff)
      expect(flashOverlay.style.backgroundColor).toBe('rgb(255, 0, 255)')

      // Test extraLife (green)
      ;(game as any).flashScreen(0x00ff00)
      expect(flashOverlay.style.backgroundColor).toBe('rgb(0, 255, 0)')
    })

    it('should not crash if flash overlay is missing', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      // Remove the overlay
      const flashOverlay = document.querySelector('[data-game-flash]')
      flashOverlay?.remove()

      // Should not throw
      expect(() => {
        ;(game as any).flashScreen(0xff0000)
      }).not.toThrow()
    })
  })

  describe('PowerUp Collection Event Integration (AC3)', () => {
    it('should trigger flash when powerUpCollected event is emitted', async () => {
      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement

      // Get global event emitter
      const globalEventEmitter = (game as any).globalEventEmitter

      // Emit powerUpCollected event
      globalEventEmitter.emit('powerUpCollected', {
        entityId: 1,
        powerUpEntityId: 2,
        powerUpType: 'shield',
        position: new Vector3(0, 0, 0),
        color: 0x00ffff
      })

      // Flash should be triggered
      expect(flashOverlay.style.opacity).toBe('0.3')
      expect(flashOverlay.style.backgroundColor).toBe('rgb(0, 255, 255)')
    })

    it('should flash with correct color for each powerup type', async () => {
      vi.useFakeTimers()

      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement
      const globalEventEmitter = (game as any).globalEventEmitter

      // Test shield (cyan)
      globalEventEmitter.emit('powerUpCollected', {
        entityId: 1,
        powerUpEntityId: 2,
        powerUpType: 'shield',
        position: new Vector3(0, 0, 0),
        color: 0x00ffff
      })
      expect(flashOverlay.style.backgroundColor).toBe('rgb(0, 255, 255)')
      vi.advanceTimersByTime(150)

      // Test rapidFire (orange)
      globalEventEmitter.emit('powerUpCollected', {
        entityId: 1,
        powerUpEntityId: 3,
        powerUpType: 'rapidFire',
        position: new Vector3(0, 0, 0),
        color: 0xff8800
      })
      expect(flashOverlay.style.backgroundColor).toBe('rgb(255, 136, 0)')
      vi.advanceTimersByTime(150)

      // Test multiShot (magenta)
      globalEventEmitter.emit('powerUpCollected', {
        entityId: 1,
        powerUpEntityId: 4,
        powerUpType: 'multiShot',
        position: new Vector3(0, 0, 0),
        color: 0xff00ff
      })
      expect(flashOverlay.style.backgroundColor).toBe('rgb(255, 0, 255)')
      vi.advanceTimersByTime(150)

      // Test extraLife (green)
      globalEventEmitter.emit('powerUpCollected', {
        entityId: 1,
        powerUpEntityId: 5,
        powerUpType: 'extraLife',
        position: new Vector3(0, 0, 0),
        color: 0x00ff00
      })
      expect(flashOverlay.style.backgroundColor).toBe('rgb(0, 255, 0)')

      vi.useRealTimers()
    })

    it('should handle multiple rapid powerup collections', async () => {
      vi.useFakeTimers()

      const Game = await getGame()
      const game = new Game()
      await game.initialize()

      const flashOverlay = document.querySelector('[data-game-flash]') as HTMLElement
      const globalEventEmitter = (game as any).globalEventEmitter

      // First powerup
      globalEventEmitter.emit('powerUpCollected', {
        entityId: 1,
        powerUpEntityId: 2,
        powerUpType: 'shield',
        position: new Vector3(0, 0, 0),
        color: 0x00ffff
      })
      expect(flashOverlay.style.opacity).toBe('0.3')

      // Second powerup before first fades
      vi.advanceTimersByTime(50)
      globalEventEmitter.emit('powerUpCollected', {
        entityId: 1,
        powerUpEntityId: 3,
        powerUpType: 'rapidFire',
        position: new Vector3(0, 0, 0),
        color: 0xff8800
      })

      // Should still flash with new color
      expect(flashOverlay.style.opacity).toBe('0.3')
      expect(flashOverlay.style.backgroundColor).toBe('rgb(255, 136, 0)')

      vi.useRealTimers()
    })
  })
})
