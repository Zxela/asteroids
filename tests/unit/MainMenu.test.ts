/**
 * MainMenu Unit Tests
 *
 * Tests for MainMenu and SettingsPanel components:
 * - DOM element creation
 * - Button visibility and click handlers
 * - Keyboard navigation (arrow keys, Enter)
 * - Settings panel show/hide
 * - Volume slider updates
 * - localStorage persistence
 * - Menu show/hide based on state
 * - Focus management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'

// We need to set up JSDOM before importing MainMenu and SettingsPanel
let dom: JSDOM
let document: Document
let window: Window & typeof globalThis

// Helper to create keyboard events using JSDOM's KeyboardEvent
function createKeyboardEvent(type: string, key: string): KeyboardEvent {
  return new dom.window.KeyboardEvent(type, { key })
}

// Helper to create events using JSDOM's Event
function createEvent(type: string): Event {
  return new dom.window.Event(type)
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

// Dynamically import MainMenu after JSDOM setup
async function getMainMenu() {
  const { MainMenu } = await import('../../src/ui/MainMenu')
  return MainMenu
}

// Dynamically import SettingsPanel after JSDOM setup
async function getSettingsPanel() {
  const { SettingsPanel } = await import('../../src/ui/SettingsPanel')
  return SettingsPanel
}

// Mock GameStateMachine
function createMockGameStateMachine() {
  return {
    transition: vi.fn().mockReturnValue(true),
    getCurrentStateName: vi.fn().mockReturnValue('mainMenu')
  }
}

describe('MainMenu', () => {
  describe('DOM Element Creation', () => {
    it('should create a container element', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()

      expect(container).toBeDefined()
      expect(container.id).toBe('main-menu')
    })

    it('should create container with fixed positioning', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()

      expect(container.style.position).toBe('fixed')
    })

    it('should create container with high z-index', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()

      expect(parseInt(container.style.zIndex)).toBeGreaterThanOrEqual(1000)
    })

    it('should create title element with "ASTEROIDS"', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()
      const title = container.querySelector('[data-menu="title"]')

      expect(title).not.toBeNull()
      expect(title?.textContent).toBe('ASTEROIDS')
    })
  })

  describe('Button Visibility', () => {
    it('should create Play button', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()
      const playButton = container.querySelector('.play-button')

      expect(playButton).not.toBeNull()
      expect(playButton?.textContent).toBe('Play')
    })

    it('should create Settings button', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()
      const settingsButton = container.querySelector('.settings-button')

      expect(settingsButton).not.toBeNull()
      expect(settingsButton?.textContent).toBe('Settings')
    })

    it('should create Leaderboard button', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()
      const leaderboardButton = container.querySelector('.leaderboard-button')

      expect(leaderboardButton).not.toBeNull()
      expect(leaderboardButton?.textContent).toBe('Leaderboard')
    })

    it('should create Instructions button', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()
      const instructionsButton = container.querySelector('.instructions-button')

      expect(instructionsButton).not.toBeNull()
      expect(instructionsButton?.textContent).toBe('Instructions')
    })

    it('should have all buttons with menu-button class', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()
      const buttons = container.querySelectorAll('.menu-button')

      expect(buttons.length).toBe(4)
    })

    it('should display buttons in correct order: Play, Settings, Leaderboard, Instructions', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()
      const buttons = container.querySelectorAll('.menu-button')
      const buttonTexts = Array.from(buttons).map((b) => b.textContent)

      expect(buttonTexts).toEqual(['Play', 'Settings', 'Leaderboard', 'Instructions'])
    })
  })

  describe('Play Button Click', () => {
    it('should trigger startGame transition when Play button clicked', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()
      const playButton = container.querySelector('.play-button') as HTMLButtonElement

      playButton.click()

      expect(mockFsm.transition).toHaveBeenCalledWith('startGame')
    })
  })

  describe('Settings Button Click', () => {
    it('should show settings panel when Settings button clicked', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      const container = menu.getContainer()
      const settingsButton = container.querySelector('.settings-button') as HTMLButtonElement

      settingsButton.click()

      const settingsPanel = document.querySelector('#settings-panel')
      expect(settingsPanel).not.toBeNull()
    })
  })

  describe('Leaderboard Button Click', () => {
    it('should show leaderboard overlay when Leaderboard button clicked', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      const container = menu.getContainer()
      const leaderboardButton = container.querySelector('.leaderboard-button') as HTMLButtonElement

      leaderboardButton.click()

      const leaderboardOverlay = document.querySelector('#leaderboard-overlay')
      expect(leaderboardOverlay).not.toBeNull()
    })
  })

  describe('Instructions Button Click', () => {
    it('should show instructions overlay when Instructions button clicked', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      const container = menu.getContainer()
      const instructionsButton = container.querySelector('.instructions-button') as HTMLButtonElement

      instructionsButton.click()

      const instructionsOverlay = document.querySelector('#instructions-overlay')
      expect(instructionsOverlay).not.toBeNull()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should focus Play button by default when menu shown', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()

      const playButton = menu.getContainer().querySelector('.play-button')
      expect(menu.getFocusedButtonIndex()).toBe(0)
    })

    it('should move focus down when ArrowDown pressed', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()

      // Simulate ArrowDown
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))

      expect(menu.getFocusedButtonIndex()).toBe(1)
    })

    it('should move focus up when ArrowUp pressed', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()

      // Move down first
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      // Then move up
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowUp'))

      expect(menu.getFocusedButtonIndex()).toBe(0)
    })

    it('should wrap focus to last button when ArrowUp pressed at top', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()

      // ArrowUp at top should wrap to bottom
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowUp'))

      expect(menu.getFocusedButtonIndex()).toBe(3) // Instructions button (last)
    })

    it('should wrap focus to first button when ArrowDown pressed at bottom', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()

      // Move to bottom
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      // Now at bottom, ArrowDown should wrap to top
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))

      expect(menu.getFocusedButtonIndex()).toBe(0) // Play button (first)
    })

    it('should activate focused button when Enter pressed', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()

      // Focus is on Play button by default
      menu.handleKeyDown(createKeyboardEvent('keydown', 'Enter'))

      expect(mockFsm.transition).toHaveBeenCalledWith('startGame')
    })

    it('should activate focused button when Space pressed', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()

      // Focus is on Play button by default
      menu.handleKeyDown(createKeyboardEvent('keydown', ' '))

      expect(mockFsm.transition).toHaveBeenCalledWith('startGame')
    })
  })

  describe('Show/Hide', () => {
    it('should be hidden by default', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      const container = menu.getContainer()

      expect(container.style.display).toBe('none')
    })

    it('should show menu when show() called', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.show()

      const container = menu.getContainer()
      expect(container.style.display).not.toBe('none')
    })

    it('should hide menu when hide() called', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.show()
      menu.hide()

      const container = menu.getContainer()
      expect(container.style.display).toBe('none')
    })

    it('should reset focus to Play button when show() called', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()
      // Move focus down
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))
      menu.hide()
      menu.show()

      expect(menu.getFocusedButtonIndex()).toBe(0)
    })
  })

  describe('Mount/Unmount', () => {
    it('should mount to parent element', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)
      const parent = document.createElement('div')

      menu.mount(parent)

      expect(parent.children.length).toBe(1)
      expect(parent.querySelector('#main-menu')).not.toBeNull()
    })

    it('should unmount from parent element', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)
      const parent = document.createElement('div')

      menu.mount(parent)
      menu.unmount()

      expect(parent.children.length).toBe(0)
    })

    it('should handle unmount when not mounted', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      expect(() => menu.unmount()).not.toThrow()
    })
  })

  describe('Focus Styling', () => {
    it('should add focused class to focused button', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()

      const buttons = menu.getContainer().querySelectorAll('.menu-button')
      expect(buttons[0].classList.contains('focused')).toBe(true)
    })

    it('should move focused class when focus changes', async () => {
      const MainMenu = await getMainMenu()
      const mockFsm = createMockGameStateMachine()
      const menu = new MainMenu(mockFsm)

      menu.mount(document.body)
      menu.show()
      menu.handleKeyDown(createKeyboardEvent('keydown', 'ArrowDown'))

      const buttons = menu.getContainer().querySelectorAll('.menu-button')
      expect(buttons[0].classList.contains('focused')).toBe(false)
      expect(buttons[1].classList.contains('focused')).toBe(true)
    })
  })
})

describe('SettingsPanel', () => {
  describe('DOM Element Creation', () => {
    it('should create a container element', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()

      expect(container).toBeDefined()
      expect(container.id).toBe('settings-panel')
    })

    it('should create title element with "SETTINGS"', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const title = container.querySelector('[data-settings="title"]')

      expect(title).not.toBeNull()
      expect(title?.textContent).toBe('SETTINGS')
    })

    it('should create SFX volume label', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const label = container.querySelector('[data-settings="sfx-label"]')

      expect(label).not.toBeNull()
      expect(label?.textContent).toContain('SFX')
    })

    it('should create SFX volume slider', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="sfx-slider"]') as HTMLInputElement

      expect(slider).not.toBeNull()
      expect(slider?.type).toBe('range')
      expect(slider?.min).toBe('0')
      expect(slider?.max).toBe('100')
    })

    it('should create Music volume label', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const label = container.querySelector('[data-settings="music-label"]')

      expect(label).not.toBeNull()
      expect(label?.textContent).toContain('Music')
    })

    it('should create Music volume slider', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="music-slider"]') as HTMLInputElement

      expect(slider).not.toBeNull()
      expect(slider?.type).toBe('range')
      expect(slider?.min).toBe('0')
      expect(slider?.max).toBe('100')
    })

    it('should create Back button', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const backButton = container.querySelector('[data-settings="back-button"]')

      expect(backButton).not.toBeNull()
      expect(backButton?.textContent).toBe('Back')
    })
  })

  describe('Volume Slider Functionality', () => {
    it('should update SFX volume value display when slider changes', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="sfx-slider"]') as HTMLInputElement
      const valueDisplay = container.querySelector('[data-settings="sfx-value"]')

      slider.value = '75'
      slider.dispatchEvent(createEvent('input'))

      expect(valueDisplay?.textContent).toBe('75')
    })

    it('should update Music volume value display when slider changes', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="music-slider"]') as HTMLInputElement
      const valueDisplay = container.querySelector('[data-settings="music-value"]')

      slider.value = '50'
      slider.dispatchEvent(createEvent('input'))

      expect(valueDisplay?.textContent).toBe('50')
    })

    it('should default SFX slider to 100', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="sfx-slider"]') as HTMLInputElement

      // Verify the slider has correct attributes
      expect(slider).not.toBeNull()
      expect(slider.getAttribute('type')).toBe('range')
      expect(slider.getAttribute('min')).toBe('0')
      expect(slider.getAttribute('max')).toBe('100')
      expect(slider.getAttribute('value')).toBe('100')
    })

    it('should default Music slider to 100', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="music-slider"]') as HTMLInputElement

      // Verify the slider has correct attributes
      expect(slider).not.toBeNull()
      expect(slider.getAttribute('type')).toBe('range')
      expect(slider.getAttribute('min')).toBe('0')
      expect(slider.getAttribute('max')).toBe('100')
      expect(slider.getAttribute('value')).toBe('100')
    })
  })

  describe('localStorage Persistence', () => {
    it('should save SFX volume to localStorage when changed', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="sfx-slider"]') as HTMLInputElement

      slider.value = '60'
      slider.dispatchEvent(createEvent('change'))

      expect(localStorage.setItem).toHaveBeenCalledWith('asteroids-sfx-volume', '60')
    })

    it('should save Music volume to localStorage when changed', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="music-slider"]') as HTMLInputElement

      slider.value = '40'
      slider.dispatchEvent(createEvent('change'))

      expect(localStorage.setItem).toHaveBeenCalledWith('asteroids-music-volume', '40')
    })

    it('should load SFX volume from localStorage on creation', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'asteroids-sfx-volume') return '80'
        return null
      })

      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="sfx-slider"]') as HTMLInputElement

      expect(slider.value).toBe('80')
    })

    it('should load Music volume from localStorage on creation', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'asteroids-music-volume') return '30'
        return null
      })

      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="music-slider"]') as HTMLInputElement

      expect(slider.value).toBe('30')
    })
  })

  describe('Show/Hide', () => {
    it('should be hidden by default', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()

      expect(container.style.display).toBe('none')
    })

    it('should show panel when show() called', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      panel.show()

      const container = panel.getContainer()
      expect(container.style.display).not.toBe('none')
    })

    it('should hide panel when hide() called', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      panel.show()
      panel.hide()

      const container = panel.getContainer()
      expect(container.style.display).toBe('none')
    })

    it('should call onClose callback when Back button clicked', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()
      const onClose = vi.fn()

      panel.show(onClose)
      const container = panel.getContainer()
      const backButton = container.querySelector('[data-settings="back-button"]') as HTMLButtonElement

      backButton.click()

      expect(onClose).toHaveBeenCalled()
    })

    it('should hide panel when Back button clicked', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      panel.show()
      const container = panel.getContainer()
      const backButton = container.querySelector('[data-settings="back-button"]') as HTMLButtonElement

      backButton.click()

      expect(container.style.display).toBe('none')
    })
  })

  describe('Mount/Unmount', () => {
    it('should mount to parent element', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()
      const parent = document.createElement('div')

      panel.mount(parent)

      expect(parent.children.length).toBe(1)
      expect(parent.querySelector('#settings-panel')).not.toBeNull()
    })

    it('should unmount from parent element', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()
      const parent = document.createElement('div')

      panel.mount(parent)
      panel.unmount()

      expect(parent.children.length).toBe(0)
    })
  })

  describe('Volume Range Validation', () => {
    it('should clamp SFX volume to 0-100 range', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="sfx-slider"]') as HTMLInputElement

      // HTML range inputs naturally clamp values, just verify the attributes
      expect(parseInt(slider.min)).toBe(0)
      expect(parseInt(slider.max)).toBe(100)
    })

    it('should clamp Music volume to 0-100 range', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="music-slider"]') as HTMLInputElement

      expect(parseInt(slider.min)).toBe(0)
      expect(parseInt(slider.max)).toBe(100)
    })
  })

  describe('Keyboard Navigation in Settings', () => {
    it('should close settings panel when Escape pressed', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      panel.show()
      panel.handleKeyDown(createKeyboardEvent('keydown', 'Escape'))

      const container = panel.getContainer()
      expect(container.style.display).toBe('none')
    })

    it('should call onClose callback when Escape pressed', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()
      const onClose = vi.fn()

      panel.show(onClose)
      panel.handleKeyDown(createKeyboardEvent('keydown', 'Escape'))

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Settings Getters', () => {
    it('should return current SFX volume', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="sfx-slider"]') as HTMLInputElement
      slider.value = '65'
      slider.dispatchEvent(createEvent('input'))

      expect(panel.getSfxVolume()).toBe(65)
    })

    it('should return current Music volume', async () => {
      const SettingsPanel = await getSettingsPanel()
      const panel = new SettingsPanel()

      const container = panel.getContainer()
      const slider = container.querySelector('[data-settings="music-slider"]') as HTMLInputElement
      slider.value = '45'
      slider.dispatchEvent(createEvent('input'))

      expect(panel.getMusicVolume()).toBe(45)
    })
  })
})
