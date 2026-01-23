/**
 * PauseMenu Unit Tests
 *
 * Tests for PauseMenu component:
 * - DOM element creation
 * - Button visibility and click handlers
 * - Keyboard navigation (arrow keys, Enter)
 * - ESC key handling (resume game)
 * - Settings panel integration
 * - HUD show/hide coordination
 * - Menu show/hide based on state
 * - Focus management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'

// We need to set up JSDOM before importing PauseMenu
let dom: JSDOM
let document: Document
let window: Window & typeof globalThis

// Helper to create keyboard events using JSDOM's KeyboardEvent
function createKeyboardEvent(type: string, key: string): KeyboardEvent {
  return new dom.window.KeyboardEvent(type, { key })
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  document = dom.window.document
  window = dom.window as unknown as Window & typeof globalThis
  // Make document, window, and HTMLElement available globally
  global.document = document
  global.window = window
  global.HTMLElement = dom.window.HTMLElement
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

// Dynamically import PauseMenu after JSDOM setup
async function getPauseMenu() {
  const { PauseMenu } = await import('../../src/ui/PauseMenu')
  return PauseMenu
}

// Mock GameStateMachine
function createMockGameStateMachine() {
  return {
    transition: vi.fn().mockReturnValue(true),
    getCurrentStateName: vi.fn().mockReturnValue('paused')
  }
}

// Mock HUD
function createMockHUD() {
  return {
    show: vi.fn(),
    hide: vi.fn(),
    mount: vi.fn(),
    unmount: vi.fn(),
    getContainer: vi.fn().mockReturnValue(document.createElement('div'))
  }
}

describe('PauseMenu', () => {
  describe('DOM Element Creation', () => {
    it('should create a container element', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()

      expect(container).toBeDefined()
      expect(container.id).toBe('pause-menu')
    })

    it('should create container with fixed positioning', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()

      expect(container.style.position).toBe('fixed')
    })

    it('should create container with high z-index', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()

      expect(parseInt(container.style.zIndex)).toBeGreaterThanOrEqual(1000)
    })

    it('should create title element with "PAUSED"', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const title = container.querySelector('[data-pause="title"]')

      expect(title).not.toBeNull()
      expect(title?.textContent).toBe('PAUSED')
    })

    it('should have semi-transparent dark background', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()

      expect(container.style.backgroundColor).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.\d+\)/)
    })
  })

  describe('Button Visibility', () => {
    it('should create Resume button', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const resumeButton = container.querySelector('.resume-button')

      expect(resumeButton).not.toBeNull()
      expect(resumeButton?.textContent).toBe('Resume')
    })

    it('should create Settings button', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const settingsButton = container.querySelector('.settings-button')

      expect(settingsButton).not.toBeNull()
      expect(settingsButton?.textContent).toBe('Settings')
    })

    it('should create Main Menu button', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const mainMenuButton = container.querySelector('.main-menu-button')

      expect(mainMenuButton).not.toBeNull()
      expect(mainMenuButton?.textContent).toBe('Main Menu')
    })

    it('should have all buttons with menu-button class', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const buttons = container.querySelectorAll('.menu-button')

      expect(buttons.length).toBe(3)
    })

    it('should display buttons in correct order: Resume, Settings, Main Menu', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const buttons = container.querySelectorAll('.menu-button')
      const buttonTexts = Array.from(buttons).map((b) => b.textContent)

      expect(buttonTexts).toEqual(['Resume', 'Settings', 'Main Menu'])
    })
  })

  describe('Resume Button Click', () => {
    it('should trigger resume transition when Resume button clicked', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const resumeButton = container.querySelector('.resume-button') as HTMLButtonElement

      resumeButton.click()

      expect(mockFsm.transition).toHaveBeenCalledWith('resume')
    })

    it('should show HUD when Resume button clicked', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const resumeButton = container.querySelector('.resume-button') as HTMLButtonElement

      resumeButton.click()

      expect(mockHud.show).toHaveBeenCalled()
    })

    it('should hide pause menu when Resume button clicked', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      const container = menu.getContainer()
      const resumeButton = container.querySelector('.resume-button') as HTMLButtonElement

      resumeButton.click()

      expect(container.style.display).toBe('none')
    })
  })

  describe('Main Menu Button Click', () => {
    it('should trigger returnToMenu transition when Main Menu button clicked', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()
      const mainMenuButton = container.querySelector('.main-menu-button') as HTMLButtonElement

      mainMenuButton.click()

      expect(mockFsm.transition).toHaveBeenCalledWith('returnToMenu')
    })
  })

  describe('Settings Button Click', () => {
    it('should show settings panel when Settings button clicked', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      const container = menu.getContainer()
      const settingsButton = container.querySelector('.settings-button') as HTMLButtonElement

      settingsButton.click()

      const settingsPanel = document.querySelector('#settings-panel')
      expect(settingsPanel).not.toBeNull()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should focus Resume button by default when menu shown', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      expect(menu.getFocusedButtonIndex()).toBe(0)
    })

    it('should move focus down when ArrowDown pressed', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))

      expect(menu.getFocusedButtonIndex()).toBe(1)
    })

    it('should move focus up when ArrowUp pressed', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowUp'))

      expect(menu.getFocusedButtonIndex()).toBe(0)
    })

    it('should wrap focus to last button when ArrowUp pressed at top', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowUp'))

      expect(menu.getFocusedButtonIndex()).toBe(2) // Main Menu button (last)
    })

    it('should wrap focus to first button when ArrowDown pressed at bottom', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))

      expect(menu.getFocusedButtonIndex()).toBe(0) // Resume button (first)
    })

    it('should activate focused button when Enter pressed', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', 'Enter'))

      expect(mockFsm.transition).toHaveBeenCalledWith('resume')
    })

    it('should activate focused button when Space pressed', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', ' '))

      expect(mockFsm.transition).toHaveBeenCalledWith('resume')
    })
  })

  describe('ESC Key Handling', () => {
    it('should resume game when ESC pressed while paused', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', 'Escape'))

      expect(mockFsm.transition).toHaveBeenCalledWith('resume')
    })

    it('should hide pause menu when ESC pressed', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', 'Escape'))

      const container = menu.getContainer()
      expect(container.style.display).toBe('none')
    })

    it('should show HUD when ESC pressed', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      menu.handleKeyDown(createKeyboardEvent('keydown', 'Escape'))

      expect(mockHud.show).toHaveBeenCalled()
    })
  })

  describe('Show/Hide', () => {
    it('should be hidden by default', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const container = menu.getContainer()

      expect(container.style.display).toBe('none')
    })

    it('should show menu when show() called', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.show()

      const container = menu.getContainer()
      expect(container.style.display).not.toBe('none')
    })

    it('should hide HUD when show() called', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.show()

      expect(mockHud.hide).toHaveBeenCalled()
    })

    it('should hide menu when hide() called', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.show()
      menu.hide()

      const container = menu.getContainer()
      expect(container.style.display).toBe('none')
    })

    it('should reset focus to Resume button when show() called', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.hide()
      menu.show()

      expect(menu.getFocusedButtonIndex()).toBe(0)
    })
  })

  describe('HUD Coordination', () => {
    it('should hide HUD when pause menu is shown', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.show()

      expect(mockHud.hide).toHaveBeenCalled()
    })

    it('should show HUD when pause menu is hidden via hide()', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.show()
      mockHud.show.mockClear() // Clear previous calls
      menu.hide()

      expect(mockHud.show).toHaveBeenCalled()
    })
  })

  describe('Mount/Unmount', () => {
    it('should mount to parent element', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)
      const parent = document.createElement('div')

      menu.mount(parent)

      expect(parent.children.length).toBe(1)
      expect(parent.querySelector('#pause-menu')).not.toBeNull()
    })

    it('should unmount from parent element', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)
      const parent = document.createElement('div')

      menu.mount(parent)
      menu.unmount()

      expect(parent.children.length).toBe(0)
    })

    it('should handle unmount when not mounted', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      expect(() => menu.unmount()).not.toThrow()
    })
  })

  describe('Focus Styling', () => {
    it('should add focused class to focused button', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()

      const buttons = menu.getContainer().querySelectorAll('.menu-button')
      expect(buttons[0].classList.contains('focused')).toBe(true)
    })

    it('should move focused class when focus changes', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)
      menu.show()
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))

      const buttons = menu.getContainer().querySelectorAll('.menu-button')
      expect(buttons[0].classList.contains('focused')).toBe(false)
      expect(buttons[1].classList.contains('focused')).toBe(true)
    })
  })

  describe('Settings Panel Integration', () => {
    it('should get settings panel instance', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      const settingsPanel = menu.getSettingsPanel()

      expect(settingsPanel).toBeDefined()
    })

    it('should hide settings panel on unmount', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)
      const parent = document.createElement('div')

      menu.mount(parent)
      // Show settings
      const settingsButton = menu.getContainer().querySelector('.settings-button') as HTMLButtonElement
      settingsButton.click()

      menu.unmount()

      const settingsPanel = menu.getSettingsPanel()
      expect(settingsPanel.getContainer().style.display).toBe('none')
    })
  })

  describe('Multiple Pause/Resume Cycles', () => {
    it('should work correctly after multiple pause/resume cycles', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)

      // First cycle
      menu.show()
      expect(menu.getContainer().style.display).not.toBe('none')
      menu.hide()
      expect(menu.getContainer().style.display).toBe('none')

      // Second cycle
      menu.show()
      expect(menu.getContainer().style.display).not.toBe('none')
      menu.hide()
      expect(menu.getContainer().style.display).toBe('none')

      // Third cycle
      menu.show()
      expect(menu.getContainer().style.display).not.toBe('none')

      // Verify focus reset
      expect(menu.getFocusedButtonIndex()).toBe(0)
    })

    it('should maintain button functionality after multiple cycles', async () => {
      const PauseMenu = await getPauseMenu()
      const mockFsm = createMockGameStateMachine()
      const mockHud = createMockHUD()
      const menu = new PauseMenu(mockFsm, mockHud)

      menu.mount(document.body)

      // First cycle
      menu.show()
      const resumeButton = menu.getContainer().querySelector('.resume-button') as HTMLButtonElement
      resumeButton.click()
      expect(mockFsm.transition).toHaveBeenCalledWith('resume')

      mockFsm.transition.mockClear()

      // Second cycle
      menu.show()
      resumeButton.click()
      expect(mockFsm.transition).toHaveBeenCalledWith('resume')
    })
  })
})
