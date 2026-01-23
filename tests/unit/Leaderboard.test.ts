/**
 * Leaderboard UI Unit Tests
 *
 * Tests for the Leaderboard UI component:
 * - Leaderboard creation and DOM structure
 * - Leaderboard hidden initially
 * - Leaderboard shows on request
 * - Top 10 entries displayed
 * - Correct columns: Rank, Name, Score, Wave
 * - Entries sorted by score descending
 * - Back button hides leaderboard
 * - ESC key handling
 * - Highlights player's entry if just submitted
 * - Score formatting with commas
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'

let dom: JSDOM
let document: Document

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  document = dom.window.document
  global.document = document
  global.HTMLElement = dom.window.HTMLElement
  global.HTMLButtonElement = dom.window.HTMLButtonElement
  global.KeyboardEvent = dom.window.KeyboardEvent
})

afterEach(() => {
  vi.resetModules()
  dom.window.close()
})

// Mock LeaderboardStorage
interface MockLeaderboardStorage {
  getTopScores: ReturnType<typeof vi.fn>
  loadScores: ReturnType<typeof vi.fn>
  saveScore: ReturnType<typeof vi.fn>
  clearAllScores: ReturnType<typeof vi.fn>
  isInTopTen: ReturnType<typeof vi.fn>
}

function createMockLeaderboardStorage(entries: Array<{ name: string; score: number; wave: number; date: string; rank?: number }> = []): MockLeaderboardStorage {
  const entriesWithRank = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }))
  return {
    getTopScores: vi.fn().mockReturnValue(entriesWithRank),
    loadScores: vi.fn().mockReturnValue(entries),
    saveScore: vi.fn(),
    clearAllScores: vi.fn(),
    isInTopTen: vi.fn().mockReturnValue(true)
  }
}

async function getLeaderboard() {
  const { Leaderboard } = await import('../../src/ui/Leaderboard')
  return Leaderboard
}

describe('Leaderboard', () => {
  describe('DOM Element Creation', () => {
    it('should create a container element', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const container = leaderboard.getContainer()

      expect(container).toBeDefined()
      expect(container.id).toBe('leaderboard')
    })

    it('should create container with fixed positioning', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const container = leaderboard.getContainer()

      expect(container.style.position).toBe('fixed')
    })

    it('should create container covering full viewport', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const container = leaderboard.getContainer()

      expect(container.style.width).toBe('100%')
      expect(container.style.height).toBe('100%')
    })

    it('should have title "HIGH SCORES"', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const container = leaderboard.getContainer()
      const title = container.querySelector('[data-testid="leaderboard-title"]')

      expect(title).not.toBeNull()
      expect(title?.textContent?.toUpperCase()).toContain('HIGH SCORES')
    })

    it('should create table element for scores', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const container = leaderboard.getContainer()
      const table = container.querySelector('table')

      expect(table).not.toBeNull()
    })

    it('should have back button', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const container = leaderboard.getContainer()
      const backButton = container.querySelector('.back-button')

      expect(backButton).not.toBeNull()
    })
  })

  describe('Initial State', () => {
    it('should be hidden initially', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const container = leaderboard.getContainer()

      expect(container.style.display).toBe('none')
    })
  })

  describe('Show/Hide Functionality', () => {
    it('should become visible when show is called', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      expect(container.style.display).not.toBe('none')
    })

    it('should become hidden when hide is called', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()
      leaderboard.hide()

      const container = leaderboard.getContainer()
      expect(container.style.display).toBe('none')
    })

    it('should load scores when show is called', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage([
        { name: 'Player1', score: 1000, wave: 5, date: '2026-01-23T10:00:00.000Z' }
      ])

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      expect(mockStorage.getTopScores).toHaveBeenCalled()
    })
  })

  describe('Score Display', () => {
    it('should display top 10 entries', async () => {
      const Leaderboard = await getLeaderboard()
      const entries = Array.from({ length: 15 }, (_, i) => ({
        name: `Player${i}`,
        score: (15 - i) * 100,
        wave: 15 - i,
        date: new Date().toISOString()
      }))
      const mockStorage = createMockLeaderboardStorage(entries.slice(0, 10))

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const rows = container.querySelectorAll('tbody tr')

      expect(rows.length).toBe(10)
    })

    it('should display correct columns: Rank, Name, Score, Wave', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage([
        { name: 'Player1', score: 1000, wave: 5, date: '2026-01-23T10:00:00.000Z' }
      ])

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const headers = container.querySelectorAll('th')

      const headerTexts = Array.from(headers).map(h => h.textContent?.toUpperCase())
      expect(headerTexts).toContain('RANK')
      expect(headerTexts).toContain('NAME')
      expect(headerTexts).toContain('SCORE')
      expect(headerTexts).toContain('WAVE')
    })

    it('should display entries sorted by score descending', async () => {
      const Leaderboard = await getLeaderboard()
      const entries = [
        { name: 'Player3', score: 500, wave: 3, date: '2026-01-23T10:00:00.000Z', rank: 3 },
        { name: 'Player1', score: 1500, wave: 7, date: '2026-01-23T11:00:00.000Z', rank: 1 },
        { name: 'Player2', score: 1000, wave: 5, date: '2026-01-23T12:00:00.000Z', rank: 2 }
      ]
      // Storage already returns sorted with ranks
      const sortedEntries = [...entries].sort((a, b) => b.score - a.score)
      const mockStorage = createMockLeaderboardStorage(sortedEntries)

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const rows = container.querySelectorAll('tbody tr')

      // First row should have highest score (formatted with commas)
      const firstRowScore = rows[0]?.querySelector('td:nth-child(3)')?.textContent
      expect(firstRowScore).toContain('1,500')
    })

    it('should format scores with commas', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage([
        { name: 'Player1', score: 1234567, wave: 10, date: '2026-01-23T10:00:00.000Z' }
      ])

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const scoreCell = container.querySelector('tbody tr td:nth-child(3)')

      expect(scoreCell?.textContent).toContain('1,234,567')
    })

    it('should display rank numbers 1-10', async () => {
      const Leaderboard = await getLeaderboard()
      const entries = Array.from({ length: 10 }, (_, i) => ({
        name: `Player${i}`,
        score: (10 - i) * 100,
        wave: 10 - i,
        date: new Date().toISOString()
      }))
      const mockStorage = createMockLeaderboardStorage(entries)

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const rows = container.querySelectorAll('tbody tr')
      const firstRank = rows[0]?.querySelector('td:first-child')?.textContent

      expect(firstRank).toContain('1')
    })

    it('should show empty state when no scores exist', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage([])

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const emptyMessage = container.querySelector('[data-testid="empty-message"]')

      expect(emptyMessage).not.toBeNull()
    })
  })

  describe('Highlight Feature', () => {
    it('should highlight player entry when highlightPlayerName is provided', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage([
        { name: 'OtherPlayer', score: 1500, wave: 7, date: '2026-01-23T10:00:00.000Z' },
        { name: 'TestPlayer', score: 1000, wave: 5, date: '2026-01-23T11:00:00.000Z' }
      ])

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show('TestPlayer')

      const container = leaderboard.getContainer()
      const highlightedRow = container.querySelector('.highlighted')

      expect(highlightedRow).not.toBeNull()
      expect(highlightedRow?.textContent).toContain('TestPlayer')
    })

    it('should not highlight any row when highlightPlayerName is not provided', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage([
        { name: 'Player1', score: 1000, wave: 5, date: '2026-01-23T10:00:00.000Z' }
      ])

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const highlightedRow = container.querySelector('.highlighted')

      expect(highlightedRow).toBeNull()
    })
  })

  describe('Back Button', () => {
    it('should hide leaderboard when back button is clicked', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const backButton = container.querySelector('.back-button') as HTMLButtonElement
      backButton.click()

      expect(container.style.display).toBe('none')
    })
  })

  describe('Keyboard Input', () => {
    it('should hide leaderboard when ESC key is pressed', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.mount(document.body)
      leaderboard.show()

      const escEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escEvent)

      const container = leaderboard.getContainer()
      expect(container.style.display).toBe('none')
    })

    it('should not respond to ESC when hidden', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const hideSpy = vi.spyOn(leaderboard, 'hide')
      leaderboard.mount(document.body)
      // Do not call show()

      const escEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escEvent)

      // hide() should not be called if already hidden
      expect(hideSpy).not.toHaveBeenCalled()
    })
  })

  describe('Mount/Unmount', () => {
    it('should mount to parent element', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const parent = document.createElement('div')

      leaderboard.mount(parent)

      expect(parent.querySelector('#leaderboard')).not.toBeNull()
    })

    it('should unmount from parent element', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const parent = document.createElement('div')

      leaderboard.mount(parent)
      leaderboard.unmount()

      expect(parent.querySelector('#leaderboard')).toBeNull()
    })

    it('should handle unmount when not mounted', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)

      expect(() => leaderboard.unmount()).not.toThrow()
    })
  })

  describe('Special Styling', () => {
    it('should have rank 1-3 with special styling (gold, silver, bronze)', async () => {
      const Leaderboard = await getLeaderboard()
      const entries = [
        { name: 'Gold', score: 3000, wave: 10, date: '2026-01-23T10:00:00.000Z' },
        { name: 'Silver', score: 2000, wave: 8, date: '2026-01-23T11:00:00.000Z' },
        { name: 'Bronze', score: 1000, wave: 5, date: '2026-01-23T12:00:00.000Z' }
      ]
      const mockStorage = createMockLeaderboardStorage(entries)

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()
      const rows = container.querySelectorAll('tbody tr')

      // Check for special classes or styles on top 3
      expect(rows[0]?.classList.contains('rank-gold') || rows[0]?.querySelector('.rank-gold')).toBeTruthy()
      expect(rows[1]?.classList.contains('rank-silver') || rows[1]?.querySelector('.rank-silver')).toBeTruthy()
      expect(rows[2]?.classList.contains('rank-bronze') || rows[2]?.querySelector('.rank-bronze')).toBeTruthy()
    })

    it('should have high z-index to overlay game', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      leaderboard.show()

      const container = leaderboard.getContainer()

      expect(Number.parseInt(container.style.zIndex, 10)).toBeGreaterThanOrEqual(1000)
    })

    it('should have semi-transparent background', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)
      const container = leaderboard.getContainer()

      expect(container.style.backgroundColor).toContain('rgba')
    })
  })

  describe('Update Method', () => {
    it('should have update method for frame updates', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)

      expect(typeof leaderboard.update).toBe('function')
    })

    it('should not throw when update is called', async () => {
      const Leaderboard = await getLeaderboard()
      const mockStorage = createMockLeaderboardStorage()

      const leaderboard = new Leaderboard(mockStorage)

      expect(() => leaderboard.update(16.67)).not.toThrow()
    })
  })
})
