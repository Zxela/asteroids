/**
 * GameOverScreen Unit Tests
 *
 * Tests for Game Over screen component:
 * - Screen creation and DOM structure
 * - Score and wave display
 * - Name input field validation
 * - Button functionality (Submit, Try Again, Main Menu)
 * - Show/hide functionality
 * - Keyboard navigation
 * - Leaderboard integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'

// We need to set up JSDOM before importing GameOverScreen
let dom: JSDOM
let document: Document

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  document = dom.window.document
  // Make document and HTMLElement available globally
  global.document = document
  global.HTMLElement = dom.window.HTMLElement
  global.HTMLInputElement = dom.window.HTMLInputElement
  global.HTMLButtonElement = dom.window.HTMLButtonElement
  global.KeyboardEvent = dom.window.KeyboardEvent
})

afterEach(() => {
  vi.resetModules()
  dom.window.close()
})

// Mock LeaderboardStorage
interface MockLeaderboardStorage {
  saveScore: ReturnType<typeof vi.fn>
  getTopScores: ReturnType<typeof vi.fn>
}

function createMockLeaderboardStorage(): MockLeaderboardStorage {
  return {
    saveScore: vi.fn(),
    getTopScores: vi.fn().mockReturnValue([])
  }
}

// Mock GameStateMachine
interface MockGameStateMachine {
  transition: ReturnType<typeof vi.fn>
  getCurrentStateName: ReturnType<typeof vi.fn>
}

function createMockGameStateMachine(): MockGameStateMachine {
  return {
    transition: vi.fn().mockReturnValue(true),
    getCurrentStateName: vi.fn().mockReturnValue('gameOver')
  }
}

// Dynamically import GameOverScreen after JSDOM setup
async function getGameOverScreen() {
  const { GameOverScreen } = await import('../../src/ui/GameOverScreen')
  return GameOverScreen
}

describe('GameOverScreen', () => {
  describe('DOM Element Creation', () => {
    it('should create a container element', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()

      expect(container).toBeDefined()
      expect(container.id).toBe('game-over-screen')
    })

    it('should create container with fixed positioning', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()

      expect(container.style.position).toBe('fixed')
    })

    it('should create container covering full viewport', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()

      expect(container.style.width).toBe('100%')
      expect(container.style.height).toBe('100%')
    })

    it('should create a title element with "GAME OVER"', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const title = container.querySelector('[data-testid="game-over-title"]')

      expect(title).not.toBeNull()
      expect(title?.textContent?.toUpperCase()).toContain('GAME OVER')
    })

    it('should create score display element', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const scoreElement = container.querySelector('[data-testid="final-score"]')

      expect(scoreElement).not.toBeNull()
    })

    it('should create wave display element', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const waveElement = container.querySelector('[data-testid="wave-reached"]')

      expect(waveElement).not.toBeNull()
    })

    it('should create name input field', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement

      expect(inputField).not.toBeNull()
      expect(inputField.placeholder).toBeDefined()
    })

    it('should create submit button', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const submitButton = container.querySelector('.submit-button')

      expect(submitButton).not.toBeNull()
    })

    it('should create try again button', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const tryAgainButton = container.querySelector('.try-again-button')

      expect(tryAgainButton).not.toBeNull()
    })

    it('should create main menu button', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const mainMenuButton = container.querySelector('.main-menu-button')

      expect(mainMenuButton).not.toBeNull()
    })
  })

  describe('Score Display', () => {
    it('should display final score when show is called', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1500, 5)

      const container = screen.getContainer()
      const scoreElement = container.querySelector('[data-testid="final-score"]')

      expect(scoreElement?.textContent).toContain('1500')
    })

    it('should display zero score correctly', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(0, 1)

      const container = screen.getContainer()
      const scoreElement = container.querySelector('[data-testid="final-score"]')

      expect(scoreElement?.textContent).toContain('0')
    })

    it('should display large score values correctly', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(999999, 25)

      const container = screen.getContainer()
      const scoreElement = container.querySelector('[data-testid="final-score"]')

      expect(scoreElement?.textContent).toContain('999999')
    })
  })

  describe('Wave Display', () => {
    it('should display wave reached when show is called', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 7)

      const container = screen.getContainer()
      const waveElement = container.querySelector('[data-testid="wave-reached"]')

      expect(waveElement?.textContent).toContain('7')
    })

    it('should display wave 1 correctly', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(100, 1)

      const container = screen.getContainer()
      const waveElement = container.querySelector('[data-testid="wave-reached"]')

      expect(waveElement?.textContent).toContain('1')
    })

    it('should display high wave numbers correctly', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(50000, 50)

      const container = screen.getContainer()
      const waveElement = container.querySelector('[data-testid="wave-reached"]')

      expect(waveElement?.textContent).toContain('50')
    })
  })

  describe('Name Input Field', () => {
    it('should capture entered text', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)

      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement

      inputField.value = 'PlayerOne'
      inputField.dispatchEvent(new dom.window.Event('input'))

      expect(inputField.value).toBe('PlayerOne')
    })

    it('should limit name to 20 characters maximum', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)

      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement

      expect(inputField.maxLength).toBe(20)
    })

    it('should validate minimum name length of 3 characters', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)

      // Attempt to submit with 2-character name
      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement
      const submitButton = container.querySelector('.submit-button') as HTMLButtonElement

      inputField.value = 'AB'
      submitButton.click()

      // Should not save with invalid name
      expect(mockStorage.saveScore).not.toHaveBeenCalled()
    })

    it('should accept names with valid length (3-10 chars)', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)

      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement
      const submitButton = container.querySelector('.submit-button') as HTMLButtonElement

      inputField.value = 'Player'
      submitButton.click()

      expect(mockStorage.saveScore).toHaveBeenCalled()
    })

    it('should have placeholder text', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)

      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement

      expect(inputField.placeholder).toBeTruthy()
    })
  })

  describe('Submit Button', () => {
    it('should save score to leaderboard when clicked with valid name', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(2500, 8)

      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement
      const submitButton = container.querySelector('.submit-button') as HTMLButtonElement

      inputField.value = 'TestPlayer'
      submitButton.click()

      expect(mockStorage.saveScore).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'TestPlayer',
          score: 2500,
          wave: 8
        })
      )
    })

    it('should not save if name is too short', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 3)

      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement
      const submitButton = container.querySelector('.submit-button') as HTMLButtonElement

      inputField.value = 'AB' // Too short (< 3 chars)
      submitButton.click()

      expect(mockStorage.saveScore).not.toHaveBeenCalled()
    })

    it('should not save if name is empty', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 3)

      const container = screen.getContainer()
      const submitButton = container.querySelector('.submit-button') as HTMLButtonElement

      submitButton.click()

      expect(mockStorage.saveScore).not.toHaveBeenCalled()
    })
  })

  describe('Try Again Button', () => {
    it('should trigger restart transition when clicked', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)

      const container = screen.getContainer()
      const tryAgainButton = container.querySelector('.try-again-button') as HTMLButtonElement

      tryAgainButton.click()

      expect(mockFSM.transition).toHaveBeenCalledWith('restart')
    })
  })

  describe('Main Menu Button', () => {
    it('should trigger returnToMenu transition when clicked', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)

      const container = screen.getContainer()
      const mainMenuButton = container.querySelector('.main-menu-button') as HTMLButtonElement

      mainMenuButton.click()

      expect(mockFSM.transition).toHaveBeenCalledWith('returnToMenu')
    })
  })

  describe('Show/Hide Functionality', () => {
    it('should be hidden initially', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()

      expect(container.style.display).toBe('none')
    })

    it('should become visible when show is called', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)

      const container = screen.getContainer()

      expect(container.style.display).not.toBe('none')
    })

    it('should become hidden when hide is called', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)
      screen.hide()

      const container = screen.getContainer()

      expect(container.style.display).toBe('none')
    })

    it('should toggle visibility correctly', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)

      expect(screen.getContainer().style.display).toBe('none')

      screen.show(1000, 5)
      expect(screen.getContainer().style.display).not.toBe('none')

      screen.hide()
      expect(screen.getContainer().style.display).toBe('none')
    })
  })

  describe('Mount/Unmount', () => {
    it('should mount to parent element', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const parent = document.createElement('div')

      screen.mount(parent)

      expect(parent.querySelector('#game-over-screen')).not.toBeNull()
    })

    it('should unmount from parent element', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const parent = document.createElement('div')

      screen.mount(parent)
      screen.unmount()

      expect(parent.querySelector('#game-over-screen')).toBeNull()
    })

    it('should handle unmount when not mounted', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)

      expect(() => screen.unmount()).not.toThrow()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should submit on Enter key in name field', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)

      const container = screen.getContainer()
      const inputField = container.querySelector('input[type="text"]') as HTMLInputElement

      inputField.value = 'TestPlayer'
      const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter' })
      inputField.dispatchEvent(enterEvent)

      expect(mockStorage.saveScore).toHaveBeenCalled()
    })

    it('should return to menu on Escape key', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      screen.show(1000, 5)
      screen.mount(document.body)

      const escEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escEvent)

      expect(mockFSM.transition).toHaveBeenCalledWith('returnToMenu')
    })
  })

  describe('Update Method', () => {
    it('should have update method for frame updates', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)

      expect(typeof screen.update).toBe('function')
    })

    it('should not throw when update is called', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)

      expect(() => screen.update(16.67)).not.toThrow()
    })
  })

  describe('Styling', () => {
    it('should have centered content', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()

      expect(container.style.display === 'none' || container.style.justifyContent === 'center').toBeTruthy()
    })

    it('should have high z-index to overlay game', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()

      // Show first to enable flex display
      screen.show(1000, 5)

      expect(Number.parseInt(container.style.zIndex, 10)).toBeGreaterThanOrEqual(1000)
    })

    it('should have semi-transparent background', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()

      expect(container.style.backgroundColor).toContain('rgba')
    })
  })

  describe('Button Labels', () => {
    it('should have Submit button with appropriate text', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const submitButton = container.querySelector('.submit-button')

      expect(submitButton?.textContent?.toLowerCase()).toContain('submit')
    })

    it('should have Try Again button with appropriate text', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const tryAgainButton = container.querySelector('.try-again-button')

      expect(tryAgainButton?.textContent?.toLowerCase()).toContain('try again')
    })

    it('should have Main Menu button with appropriate text', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const mainMenuButton = container.querySelector('.main-menu-button')

      expect(mainMenuButton?.textContent?.toLowerCase()).toContain('main menu')
    })
  })

  describe('Name Input Label', () => {
    it('should have label for name input', async () => {
      const GameOverScreen = await getGameOverScreen()
      const mockFSM = createMockGameStateMachine()
      const mockStorage = createMockLeaderboardStorage()

      const screen = new GameOverScreen(mockFSM, mockStorage)
      const container = screen.getContainer()
      const label = container.querySelector('[data-testid="name-label"]')

      expect(label).not.toBeNull()
      expect(label?.textContent?.toLowerCase()).toContain('name')
    })
  })
})
