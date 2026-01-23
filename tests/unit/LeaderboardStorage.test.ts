/**
 * LeaderboardStorage Unit Tests
 *
 * Tests for the LeaderboardStorage utility:
 * - Save score with name, score, wave
 * - Load all scores from localStorage
 * - Scores sorted descending by score
 * - Top 10 entries returned (if more than 10 saved)
 * - localStorage unavailability handling
 * - Score validity checks (non-negative, integer)
 * - Duplicate names allowed
 * - Timestamp added to entry
 * - Clear all scores
 * - Check if score is in top 10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage
const createMockLocalStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    _getStore: () => store
  }
}

let mockStorage: ReturnType<typeof createMockLocalStorage>

beforeEach(() => {
  mockStorage = createMockLocalStorage()
  global.localStorage = mockStorage as unknown as Storage
})

afterEach(() => {
  vi.resetModules()
})

async function getLeaderboardStorage() {
  const { LeaderboardStorage } = await import('../../src/utils/LeaderboardStorage')
  return LeaderboardStorage
}

describe('LeaderboardStorage', () => {
  describe('Constructor', () => {
    it('should create storage with default key and max entries', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      expect(storage).toBeDefined()
    })

    it('should accept custom storage key', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage('custom-leaderboard')

      storage.saveScore({ name: 'Player', score: 100, wave: 1, date: new Date().toISOString() })

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'custom-leaderboard',
        expect.any(String)
      )
    })

    it('should accept custom max entries', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage('asteroids-leaderboard', 5)

      expect(storage).toBeDefined()
    })
  })

  describe('saveScore', () => {
    it('should save score with name, score, and wave', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      storage.saveScore({
        name: 'Player1',
        score: 1500,
        wave: 5,
        date: '2026-01-23T10:00:00.000Z'
      })

      // Verify via loadScores instead of checking mock calls
      const scores = storage.loadScores()
      expect(scores[0].name).toBe('Player1')
      expect(scores[0].score).toBe(1500)
      expect(scores[0].wave).toBe(5)
    })

    it('should add timestamp (date) if not present', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      const beforeSave = Date.now()
      storage.saveScore({
        name: 'Player1',
        score: 1000,
        wave: 3,
        date: ''
      })

      // Verify via loadScores
      const scores = storage.loadScores()
      const savedDate = new Date(scores[0].date).getTime()

      expect(savedDate).toBeGreaterThanOrEqual(beforeSave)
    })

    it('should validate name length (1-20 characters)', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      // Empty name should be rejected
      expect(() => storage.saveScore({
        name: '',
        score: 100,
        wave: 1,
        date: new Date().toISOString()
      })).toThrow()

      // Name > 20 chars should be truncated
      const longNameEntry = {
        name: 'A'.repeat(25),
        score: 100,
        wave: 1,
        date: new Date().toISOString()
      }
      storage.saveScore(longNameEntry)
      const scores = storage.loadScores()
      expect(scores[0].name.length).toBeLessThanOrEqual(20)
    })

    it('should validate score is non-negative', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      expect(() => storage.saveScore({
        name: 'Player',
        score: -100,
        wave: 1,
        date: new Date().toISOString()
      })).toThrow()
    })

    it('should validate wave is positive', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      expect(() => storage.saveScore({
        name: 'Player',
        score: 100,
        wave: 0,
        date: new Date().toISOString()
      })).toThrow()
    })

    it('should allow duplicate names', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      storage.saveScore({ name: 'Player', score: 100, wave: 1, date: '2026-01-23T10:00:00.000Z' })
      storage.saveScore({ name: 'Player', score: 200, wave: 2, date: '2026-01-23T11:00:00.000Z' })

      const scores = storage.loadScores()
      const playerEntries = scores.filter(s => s.name === 'Player')
      expect(playerEntries.length).toBe(2)
    })

    it('should save to in-memory array as fallback', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage full')
      })

      const storage = new LeaderboardStorage()
      storage.saveScore({ name: 'Player', score: 100, wave: 1, date: new Date().toISOString() })

      // Should still be retrievable from in-memory
      const scores = storage.loadScores()
      expect(scores.length).toBe(1)
    })
  })

  describe('loadScores', () => {
    it('should load all scores from localStorage', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = [
        { name: 'Player1', score: 1000, wave: 5, date: '2026-01-23T10:00:00.000Z' },
        { name: 'Player2', score: 2000, wave: 8, date: '2026-01-23T11:00:00.000Z' }
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const scores = storage.loadScores()

      expect(scores.length).toBe(2)
    })

    it('should return empty array if no scores saved', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      mockStorage.getItem.mockReturnValue(null)

      const storage = new LeaderboardStorage()
      const scores = storage.loadScores()

      expect(scores).toEqual([])
    })

    it('should fallback to in-memory array if localStorage unavailable', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      const storage = new LeaderboardStorage()
      // Should not throw
      const scores = storage.loadScores()
      expect(Array.isArray(scores)).toBe(true)
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      mockStorage.getItem.mockReturnValue('invalid-json{')

      const storage = new LeaderboardStorage()
      const scores = storage.loadScores()

      expect(Array.isArray(scores)).toBe(true)
    })
  })

  describe('getTopScores', () => {
    it('should return top 10 entries by default', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = Array.from({ length: 15 }, (_, i) => ({
        name: `Player${i}`,
        score: (i + 1) * 100,
        wave: i + 1,
        date: new Date().toISOString()
      }))
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const topScores = storage.getTopScores()

      expect(topScores.length).toBe(10)
    })

    it('should return scores sorted by score descending', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = [
        { name: 'Player1', score: 500, wave: 3, date: '2026-01-23T10:00:00.000Z' },
        { name: 'Player2', score: 1500, wave: 7, date: '2026-01-23T11:00:00.000Z' },
        { name: 'Player3', score: 1000, wave: 5, date: '2026-01-23T12:00:00.000Z' }
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const topScores = storage.getTopScores()

      expect(topScores[0].score).toBe(1500)
      expect(topScores[1].score).toBe(1000)
      expect(topScores[2].score).toBe(500)
    })

    it('should sort by timestamp (newer first) when scores are tied', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = [
        { name: 'Player1', score: 1000, wave: 5, date: '2026-01-23T10:00:00.000Z' },
        { name: 'Player2', score: 1000, wave: 5, date: '2026-01-23T12:00:00.000Z' }
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const topScores = storage.getTopScores()

      expect(topScores[0].name).toBe('Player2') // Newer timestamp first
      expect(topScores[1].name).toBe('Player1')
    })

    it('should accept custom count parameter', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = Array.from({ length: 15 }, (_, i) => ({
        name: `Player${i}`,
        score: (i + 1) * 100,
        wave: i + 1,
        date: new Date().toISOString()
      }))
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const top5 = storage.getTopScores(5)

      expect(top5.length).toBe(5)
    })

    it('should return all scores if fewer than requested count', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = [
        { name: 'Player1', score: 1000, wave: 5, date: new Date().toISOString() }
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const topScores = storage.getTopScores(10)

      expect(topScores.length).toBe(1)
    })

    it('should add rank property to entries', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = [
        { name: 'Player1', score: 1500, wave: 7, date: '2026-01-23T10:00:00.000Z' },
        { name: 'Player2', score: 1000, wave: 5, date: '2026-01-23T11:00:00.000Z' }
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const topScores = storage.getTopScores()

      expect(topScores[0].rank).toBe(1)
      expect(topScores[1].rank).toBe(2)
    })
  })

  describe('clearAllScores', () => {
    it('should clear all scores from localStorage', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      storage.saveScore({ name: 'Player', score: 100, wave: 1, date: new Date().toISOString() })
      storage.clearAllScores()

      expect(mockStorage.removeItem).toHaveBeenCalledWith('asteroids-leaderboard')
    })

    it('should clear in-memory array', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      storage.saveScore({ name: 'Player', score: 100, wave: 1, date: new Date().toISOString() })
      storage.clearAllScores()

      const scores = storage.loadScores()
      expect(scores.length).toBe(0)
    })
  })

  describe('isInTopTen', () => {
    it('should return true if score would be in top 10', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = Array.from({ length: 5 }, (_, i) => ({
        name: `Player${i}`,
        score: (i + 1) * 100,
        wave: i + 1,
        date: new Date().toISOString()
      }))
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const result = storage.isInTopTen(600)

      expect(result).toBe(true)
    })

    it('should return true if fewer than 10 scores exist', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      mockStorage.getItem.mockReturnValue(JSON.stringify([]))

      const storage = new LeaderboardStorage()
      const result = storage.isInTopTen(1)

      expect(result).toBe(true)
    })

    it('should return false if score is lower than all top 10', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = Array.from({ length: 10 }, (_, i) => ({
        name: `Player${i}`,
        score: (i + 1) * 1000,
        wave: i + 1,
        date: new Date().toISOString()
      }))
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const result = storage.isInTopTen(500)

      expect(result).toBe(false)
    })

    it('should return true if score equals lowest top 10 score', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = Array.from({ length: 10 }, (_, i) => ({
        name: `Player${i}`,
        score: (i + 1) * 100,
        wave: i + 1,
        date: new Date().toISOString()
      }))
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const result = storage.isInTopTen(100) // Equals lowest

      expect(result).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty storage', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      mockStorage.getItem.mockReturnValue(null)

      const storage = new LeaderboardStorage()
      const scores = storage.loadScores()
      const topScores = storage.getTopScores()

      expect(scores).toEqual([])
      expect(topScores).toEqual([])
    })

    it('should handle single entry', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage()

      storage.saveScore({ name: 'Solo', score: 100, wave: 1, date: new Date().toISOString() })

      const topScores = storage.getTopScores()
      expect(topScores.length).toBe(1)
      expect(topScores[0].rank).toBe(1)
    })

    it('should handle tied scores correctly (same score)', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const testData = [
        { name: 'Player1', score: 1000, wave: 5, date: '2026-01-23T10:00:00.000Z' },
        { name: 'Player2', score: 1000, wave: 6, date: '2026-01-23T11:00:00.000Z' },
        { name: 'Player3', score: 1000, wave: 4, date: '2026-01-23T12:00:00.000Z' }
      ]
      mockStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const storage = new LeaderboardStorage()
      const topScores = storage.getTopScores()

      expect(topScores.length).toBe(3)
      // All should have different ranks based on timestamp
      expect(topScores[0].rank).toBe(1)
      expect(topScores[1].rank).toBe(2)
      expect(topScores[2].rank).toBe(3)
    })

    it('should limit stored entries to maxEntries', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      const storage = new LeaderboardStorage('asteroids-leaderboard', 5)

      // Save more than max entries
      for (let i = 0; i < 10; i++) {
        storage.saveScore({
          name: `Player${i}`,
          score: (i + 1) * 100,
          wave: i + 1,
          date: new Date().toISOString()
        })
      }

      const scores = storage.loadScores()
      expect(scores.length).toBeLessThanOrEqual(5)
    })
  })

  describe('localStorage Unavailability', () => {
    it('should work entirely in memory when localStorage throws', async () => {
      const LeaderboardStorage = await getLeaderboardStorage()
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      const storage = new LeaderboardStorage()

      // Should not throw
      storage.saveScore({ name: 'Player', score: 100, wave: 1, date: new Date().toISOString() })
      const scores = storage.loadScores()

      expect(scores.length).toBe(1)
      expect(scores[0].name).toBe('Player')
    })
  })
})
