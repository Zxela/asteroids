/**
 * BossHealthBar Unit Tests
 *
 * Tests for BossHealthBar component:
 * - DOM element creation
 * - Show/hide functionality
 * - Health bar update with color gradient
 * - Mount/unmount functionality
 * - Visibility state
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'

// We need to set up JSDOM before importing BossHealthBar
let dom: JSDOM
let document: Document

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  document = dom.window.document
  // Make document and HTMLElement available globally
  global.document = document
  global.HTMLElement = dom.window.HTMLElement
})

afterEach(() => {
  // Clean up
  dom.window.close()
})

// Dynamically import BossHealthBar after JSDOM setup
async function getBossHealthBar() {
  const { BossHealthBar } = await import('../../src/ui/BossHealthBar')
  return BossHealthBar
}

describe('BossHealthBar', () => {
  describe('DOM Element Creation', () => {
    it('should create a container element', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()

      expect(container).toBeDefined()
      expect(container.id).toBe('boss-health-bar')
    })

    it('should create container with fixed positioning', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()

      expect(container.style.position).toBe('fixed')
      expect(container.style.top).toBe('50px')
    })

    it('should create container centered horizontally', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()

      expect(container.style.left).toBe('50%')
      expect(container.style.transform).toBe('translateX(-50%)')
    })

    it('should create container with flex display', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()

      expect(container.style.flexDirection).toBe('column')
      expect(container.style.alignItems).toBe('center')
    })

    it('should create container with pointer-events none', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()

      expect(container.style.pointerEvents).toBe('none')
    })

    it('should have name display element', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()
      const nameElement = container.querySelector('[data-boss-ui="name"]')

      expect(nameElement).toBeDefined()
      expect(nameElement).not.toBeNull()
    })

    it('should have bar container element', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()
      const barContainer = container.querySelector('[data-boss-ui="bar-container"]')

      expect(barContainer).toBeDefined()
      expect(barContainer).not.toBeNull()
    })

    it('should have bar fill element inside bar container', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()
      const barFill = container.querySelector('[data-boss-ui="bar-fill"]')

      expect(barFill).toBeDefined()
      expect(barFill).not.toBeNull()
    })

    it('should have percentage display element', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const container = healthBar.getContainer()
      const percentageElement = container.querySelector('[data-boss-ui="percentage"]')

      expect(percentageElement).toBeDefined()
      expect(percentageElement).not.toBeNull()
    })

    it('should be initially hidden', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      expect(healthBar.isVisible()).toBe(false)
      expect(healthBar.getContainer().style.display).toBe('none')
    })
  })

  describe('Show/Hide Functionality', () => {
    it('should show the health bar with boss name', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.show('DESTROYER')

      expect(healthBar.isVisible()).toBe(true)
      expect(healthBar.getContainer().style.display).toBe('flex')
    })

    it('should display boss name when shown', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.show('CARRIER')

      const nameElement = healthBar.getContainer().querySelector('[data-boss-ui="name"]')
      expect(nameElement?.textContent).toBe('CARRIER')
    })

    it('should hide the health bar', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.show('DESTROYER')
      healthBar.hide()

      expect(healthBar.isVisible()).toBe(false)
      expect(healthBar.getContainer().style.display).toBe('none')
    })

    it('should be able to show again after hiding', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.show('DESTROYER')
      healthBar.hide()
      healthBar.show('CARRIER')

      expect(healthBar.isVisible()).toBe(true)
    })
  })

  describe('Health Bar Update', () => {
    it('should update health percentage display', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(50, 100)

      const percentageElement = healthBar.getContainer().querySelector('[data-boss-ui="percentage"]')
      expect(percentageElement?.textContent).toBe('50%')
    })

    it('should update bar width based on health', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(75, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.width).toBe('75%')
    })

    it('should show green color for high health (>66%)', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(80, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(0, 255, 0)')
    })

    it('should show yellow color for medium health (33-66%)', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(50, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 255, 0)')
    })

    it('should show orange color for low health (15-33%)', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(25, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 136, 0)')
    })

    it('should show red color for critical health (<15%)', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(10, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 0, 0)')
    })

    it('should handle zero health', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(0, 100)

      const percentageElement = healthBar.getContainer().querySelector('[data-boss-ui="percentage"]')
      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement

      expect(percentageElement?.textContent).toBe('0%')
      expect(barFill?.style.width).toBe('0%')
    })

    it('should handle full health', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(100, 100)

      const percentageElement = healthBar.getContainer().querySelector('[data-boss-ui="percentage"]')
      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement

      expect(percentageElement?.textContent).toBe('100%')
      expect(barFill?.style.width).toBe('100%')
    })

    it('should clamp percentage above 100', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(150, 100)

      const percentageElement = healthBar.getContainer().querySelector('[data-boss-ui="percentage"]')
      expect(percentageElement?.textContent).toBe('100%')
    })

    it('should clamp percentage below 0', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(-10, 100)

      const percentageElement = healthBar.getContainer().querySelector('[data-boss-ui="percentage"]')
      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement

      expect(percentageElement?.textContent).toBe('0%')
      expect(barFill?.style.width).toBe('0%')
    })

    it('should handle zero max health', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(50, 0)

      const percentageElement = healthBar.getContainer().querySelector('[data-boss-ui="percentage"]')
      expect(percentageElement?.textContent).toBe('0%')
    })

    it('should floor percentage display value', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(33, 100)

      const percentageElement = healthBar.getContainer().querySelector('[data-boss-ui="percentage"]')
      expect(percentageElement?.textContent).toBe('33%')
    })
  })

  describe('Mount/Unmount Functionality', () => {
    it('should mount to parent element', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const parent = document.createElement('div')
      healthBar.mount(parent)

      expect(parent.contains(healthBar.getContainer())).toBe(true)
    })

    it('should unmount from parent element', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const parent = document.createElement('div')
      healthBar.mount(parent)
      healthBar.unmount()

      expect(parent.contains(healthBar.getContainer())).toBe(false)
    })

    it('should handle unmount when not mounted', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      // Should not throw
      expect(() => healthBar.unmount()).not.toThrow()
    })

    it('should remount to different parent', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const parent1 = document.createElement('div')
      const parent2 = document.createElement('div')

      healthBar.mount(parent1)
      healthBar.mount(parent2)

      expect(parent1.contains(healthBar.getContainer())).toBe(false)
      expect(parent2.contains(healthBar.getContainer())).toBe(true)
    })

    it('should not duplicate when mounting to same parent twice', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      const parent = document.createElement('div')

      healthBar.mount(parent)
      healthBar.mount(parent)

      expect(parent.querySelectorAll('#boss-health-bar').length).toBe(1)
    })
  })

  describe('Color Gradient Boundaries', () => {
    it('should use green at exactly 67%', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(67, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(0, 255, 0)')
    })

    it('should use yellow at exactly 66%', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(66, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 255, 0)')
    })

    it('should use yellow at exactly 34%', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(34, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 255, 0)')
    })

    it('should use orange at exactly 33%', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(33, 100)

      // 33 is NOT > 33, so it falls to orange (15-33 range)
      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 136, 0)')
    })

    it('should use orange at exactly 16%', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(16, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 136, 0)')
    })

    it('should use red at exactly 15%', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(15, 100)

      // 15 is NOT > 15, so it falls to red (<15 range)
      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 0, 0)')
    })

    it('should use red at exactly 14%', async () => {
      const BossHealthBar = await getBossHealthBar()
      const healthBar = new BossHealthBar()

      healthBar.update(14, 100)

      const barFill = healthBar.getContainer().querySelector('[data-boss-ui="bar-fill"]') as HTMLElement
      expect(barFill?.style.backgroundColor).toBe('rgb(255, 0, 0)')
    })
  })
})
