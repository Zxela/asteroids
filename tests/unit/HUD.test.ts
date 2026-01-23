/**
 * HUD Unit Tests
 *
 * Tests for HUD component:
 * - DOM element creation
 * - Score display update
 * - Lives display update
 * - Wave display update
 * - Weapon display update
 * - Show/hide functionality
 * - Mount/unmount functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'

// We need to set up JSDOM before importing HUD
let dom: JSDOM
let document: Document

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  document = dom.window.document
  // Make document and HTMLElement available globally for the HUD class
  global.document = document
  global.HTMLElement = dom.window.HTMLElement
})

afterEach(() => {
  // Clean up
  dom.window.close()
})

// Dynamically import HUD after JSDOM setup
async function getHUD() {
  // Re-import to get a fresh module with the new global document
  const { HUD } = await import('../../src/ui/HUD')
  return HUD
}

describe('HUD', () => {
  describe('DOM Element Creation', () => {
    it('should create a container element', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()

      expect(container).toBeDefined()
      expect(container.id).toBe('game-hud')
    })

    it('should create container with fixed positioning', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()

      expect(container.style.position).toBe('fixed')
      expect(container.style.top).toBe('0px')
      expect(container.style.left).toBe('0px')
    })

    it('should create container with full width', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()

      expect(container.style.width).toBe('100%')
    })

    it('should create container with pointer-events none', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()

      expect(container.style.pointerEvents).toBe('none')
    })

    it('should create container with high z-index', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()

      expect(parseInt(container.style.zIndex)).toBeGreaterThanOrEqual(1000)
    })

    it('should create score element', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const scoreElement = container.querySelector('[data-hud="score"]')

      expect(scoreElement).toBeDefined()
      expect(scoreElement).not.toBeNull()
    })

    it('should create lives element', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const livesElement = container.querySelector('[data-hud="lives"]')

      expect(livesElement).toBeDefined()
      expect(livesElement).not.toBeNull()
    })

    it('should create wave element', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const waveElement = container.querySelector('[data-hud="wave"]')

      expect(waveElement).toBeDefined()
      expect(waveElement).not.toBeNull()
    })

    it('should create weapon element', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const weaponElement = container.querySelector('[data-hud="weapon"]')

      expect(weaponElement).toBeDefined()
      expect(weaponElement).not.toBeNull()
    })

    it('should use monospace font', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()

      expect(container.style.fontFamily).toBe('monospace')
    })

    it('should use white text color', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()

      expect(container.style.color).toBe('white')
    })
  })

  describe('Score Display', () => {
    it('should update score display with correct value', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateScore(100)

      const container = hud.getContainer()
      const scoreElement = container.querySelector('[data-hud="score"]')

      expect(scoreElement?.textContent).toContain('100')
    })

    it('should handle zero score', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateScore(0)

      const container = hud.getContainer()
      const scoreElement = container.querySelector('[data-hud="score"]')

      expect(scoreElement?.textContent).toContain('0')
    })

    it('should handle large score values', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateScore(999999)

      const container = hud.getContainer()
      const scoreElement = container.querySelector('[data-hud="score"]')

      expect(scoreElement?.textContent).toContain('999999')
    })

    it('should format score with label', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateScore(500)

      const container = hud.getContainer()
      const scoreElement = container.querySelector('[data-hud="score"]')

      expect(scoreElement?.textContent?.toLowerCase()).toContain('score')
    })
  })

  describe('Lives Display', () => {
    it('should update lives display with correct value', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateLives(3)

      const container = hud.getContainer()
      const livesElement = container.querySelector('[data-hud="lives"]')

      expect(livesElement?.textContent).toContain('3')
    })

    it('should handle zero lives', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateLives(0)

      const container = hud.getContainer()
      const livesElement = container.querySelector('[data-hud="lives"]')

      expect(livesElement?.textContent).toContain('0')
    })

    it('should handle high lives count', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateLives(10)

      const container = hud.getContainer()
      const livesElement = container.querySelector('[data-hud="lives"]')

      expect(livesElement?.textContent).toContain('10')
    })

    it('should format lives with label', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateLives(3)

      const container = hud.getContainer()
      const livesElement = container.querySelector('[data-hud="lives"]')

      expect(livesElement?.textContent?.toLowerCase()).toContain('lives')
    })
  })

  describe('Wave Display', () => {
    it('should update wave display with correct value', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateWave(1)

      const container = hud.getContainer()
      const waveElement = container.querySelector('[data-hud="wave"]')

      expect(waveElement?.textContent).toContain('1')
    })

    it('should handle high wave numbers', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateWave(25)

      const container = hud.getContainer()
      const waveElement = container.querySelector('[data-hud="wave"]')

      expect(waveElement?.textContent).toContain('25')
    })

    it('should format wave with label', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateWave(1)

      const container = hud.getContainer()
      const waveElement = container.querySelector('[data-hud="wave"]')

      expect(waveElement?.textContent?.toLowerCase()).toContain('wave')
    })
  })

  describe('Weapon Display', () => {
    it('should update weapon display with single shot', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateWeapon('single')

      const container = hud.getContainer()
      const weaponElement = container.querySelector('[data-hud="weapon"]')

      expect(weaponElement?.textContent?.toLowerCase()).toContain('single')
    })

    it('should update weapon display with spread shot', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateWeapon('spread')

      const container = hud.getContainer()
      const weaponElement = container.querySelector('[data-hud="weapon"]')

      expect(weaponElement?.textContent?.toLowerCase()).toContain('spread')
    })

    it('should update weapon display with laser', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateWeapon('laser')

      const container = hud.getContainer()
      const weaponElement = container.querySelector('[data-hud="weapon"]')

      expect(weaponElement?.textContent?.toLowerCase()).toContain('laser')
    })

    it('should update weapon display with homing', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.updateWeapon('homing')

      const container = hud.getContainer()
      const weaponElement = container.querySelector('[data-hud="weapon"]')

      expect(weaponElement?.textContent?.toLowerCase()).toContain('homing')
    })
  })

  describe('Show/Hide', () => {
    it('should be visible by default', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()

      expect(container.style.display).not.toBe('none')
    })

    it('should hide HUD when hide() called', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.hide()

      const container = hud.getContainer()

      expect(container.style.display).toBe('none')
    })

    it('should show HUD when show() called', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.hide()
      hud.show()

      const container = hud.getContainer()

      expect(container.style.display).not.toBe('none')
    })

    it('should toggle visibility correctly', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      hud.hide()
      expect(hud.getContainer().style.display).toBe('none')

      hud.show()
      expect(hud.getContainer().style.display).not.toBe('none')

      hud.hide()
      expect(hud.getContainer().style.display).toBe('none')
    })
  })

  describe('Mount/Unmount', () => {
    it('should mount to parent element', async () => {
      const HUD = await getHUD()
      const hud = new HUD()
      const parent = document.createElement('div')

      hud.mount(parent)

      expect(parent.children.length).toBe(1)
      expect(parent.querySelector('#game-hud')).not.toBeNull()
    })

    it('should unmount from parent element', async () => {
      const HUD = await getHUD()
      const hud = new HUD()
      const parent = document.createElement('div')

      hud.mount(parent)
      hud.unmount()

      expect(parent.children.length).toBe(0)
    })

    it('should handle unmount when not mounted', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      // Should not throw
      expect(() => hud.unmount()).not.toThrow()
    })

    it('should handle multiple mounts to same parent', async () => {
      const HUD = await getHUD()
      const hud = new HUD()
      const parent = document.createElement('div')

      hud.mount(parent)
      hud.mount(parent) // Should not duplicate

      expect(parent.querySelectorAll('#game-hud').length).toBe(1)
    })

    it('should handle mount to different parent', async () => {
      const HUD = await getHUD()
      const hud = new HUD()
      const parent1 = document.createElement('div')
      const parent2 = document.createElement('div')

      hud.mount(parent1)
      hud.mount(parent2)

      expect(parent1.children.length).toBe(0)
      expect(parent2.children.length).toBe(1)
    })
  })

  describe('Element Positioning', () => {
    it('should position score in top left', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const scoreElement = container.querySelector('[data-hud="score"]') as HTMLElement

      // Score should be positioned at left side
      expect(scoreElement?.style.position).toBe('absolute')
      expect(scoreElement?.style.left).toBe('20px')
      expect(scoreElement?.style.top).toBe('20px')
    })

    it('should position lives below score in top left', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const livesElement = container.querySelector('[data-hud="lives"]') as HTMLElement

      expect(livesElement?.style.position).toBe('absolute')
      expect(livesElement?.style.left).toBe('20px')
      expect(livesElement?.style.top).toBe('50px')
    })

    it('should position wave in top center', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const waveElement = container.querySelector('[data-hud="wave"]') as HTMLElement

      expect(waveElement?.style.position).toBe('absolute')
      expect(waveElement?.style.left).toBe('50%')
      expect(waveElement?.style.transform).toContain('translateX(-50%)')
    })

    it('should position weapon in top right', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const weaponElement = container.querySelector('[data-hud="weapon"]') as HTMLElement

      expect(weaponElement?.style.position).toBe('absolute')
      expect(weaponElement?.style.right).toBe('20px')
      expect(weaponElement?.style.top).toBe('20px')
    })
  })

  describe('Initial State', () => {
    it('should initialize with zero score', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const scoreElement = container.querySelector('[data-hud="score"]')

      expect(scoreElement?.textContent).toContain('0')
    })

    it('should initialize with default lives', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const livesElement = container.querySelector('[data-hud="lives"]')

      expect(livesElement?.textContent).toContain('3')
    })

    it('should initialize with wave 1', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const waveElement = container.querySelector('[data-hud="wave"]')

      expect(waveElement?.textContent).toContain('1')
    })

    it('should initialize with single weapon', async () => {
      const HUD = await getHUD()
      const hud = new HUD()

      const container = hud.getContainer()
      const weaponElement = container.querySelector('[data-hud="weapon"]')

      expect(weaponElement?.textContent?.toLowerCase()).toContain('single')
    })
  })
})
