/**
 * LeaderboardStorage - Leaderboard persistence utility
 *
 * Stores and retrieves leaderboard entries from localStorage with
 * in-memory fallback when localStorage is unavailable.
 *
 * Features:
 * - Save scores with name, score, wave, and timestamp
 * - Load and sort scores (descending by score, then by timestamp)
 * - Get top N scores with rank calculation
 * - Check if score qualifies for top 10
 * - Clear all scores
 * - Graceful fallback to in-memory storage
 *
 * @module utils/LeaderboardStorage
 */

import type { LeaderboardEntry } from '../types/game'

/**
 * Extended LeaderboardEntry with calculated rank
 */
export interface RankedLeaderboardEntry extends LeaderboardEntry {
  rank: number
}

/**
 * LeaderboardStorage class for managing leaderboard persistence.
 *
 * @example
 * ```typescript
 * const storage = new LeaderboardStorage()
 * storage.saveScore({ name: 'Player', score: 1500, wave: 5, date: '' })
 * const top10 = storage.getTopScores(10)
 * ```
 */
export class LeaderboardStorage {
  private readonly storageKey: string
  private readonly maxEntries: number
  private inMemoryScores: LeaderboardEntry[] = []
  private localStorageAvailable = true

  /**
   * Creates a new LeaderboardStorage instance.
   *
   * @param storageKey - localStorage key for storing scores (default: 'asteroids-leaderboard')
   * @param maxEntries - Maximum number of entries to store (default: 100)
   */
  constructor(storageKey = 'asteroids-leaderboard', maxEntries = 100) {
    this.storageKey = storageKey
    this.maxEntries = maxEntries
    this.checkLocalStorageAvailability()
    this.loadFromLocalStorage()
  }

  /**
   * Checks if localStorage is available.
   */
  private checkLocalStorageAvailability(): void {
    try {
      const testKey = '__localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      this.localStorageAvailable = true
    } catch {
      this.localStorageAvailable = false
    }
  }

  /**
   * Loads scores from localStorage into in-memory array.
   */
  private loadFromLocalStorage(): void {
    if (!this.localStorageAvailable) {
      return
    }

    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed)) {
          this.inMemoryScores = parsed
          // Sort on load to ensure proper order
          this.sortScores()
        }
      }
    } catch {
      // Invalid data, start with empty array
      this.inMemoryScores = []
    }
  }

  /**
   * Sorts scores by score descending, then by date descending (newer first).
   */
  private sortScores(): void {
    this.inMemoryScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }

  /**
   * Persists in-memory scores to localStorage.
   */
  private saveToLocalStorage(): void {
    if (!this.localStorageAvailable) {
      return
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.inMemoryScores))
    } catch {
      // localStorage may be full or unavailable
      // Continue with in-memory only
      this.localStorageAvailable = false
    }
  }

  /**
   * Validates a leaderboard entry.
   *
   * @param entry - The entry to validate
   * @throws Error if entry is invalid
   */
  private validateEntry(entry: LeaderboardEntry): void {
    // Validate name length (1-20 characters)
    if (!entry.name || entry.name.trim().length === 0) {
      throw new Error('Name cannot be empty')
    }

    // Validate score is non-negative
    if (entry.score < 0) {
      throw new Error('Score must be non-negative')
    }

    // Validate wave is positive
    if (entry.wave < 1) {
      throw new Error('Wave must be at least 1')
    }
  }

  /**
   * Saves a score entry to the leaderboard.
   *
   * @param entry - The leaderboard entry to save
   * @throws Error if entry is invalid (empty name, negative score, or wave < 1)
   */
  saveScore(entry: LeaderboardEntry): void {
    this.validateEntry(entry)

    // Create normalized entry
    const normalizedEntry: LeaderboardEntry = {
      name: entry.name.trim().slice(0, 20), // Truncate to 20 chars
      score: Math.floor(entry.score), // Ensure integer
      wave: Math.floor(entry.wave),
      date: entry.date || new Date().toISOString()
    }

    // Add to in-memory scores
    this.inMemoryScores.push(normalizedEntry)

    // Sort by score descending, then by date descending (newer first)
    this.sortScores()

    // Trim to maxEntries
    if (this.inMemoryScores.length > this.maxEntries) {
      this.inMemoryScores = this.inMemoryScores.slice(0, this.maxEntries)
    }

    // Persist to localStorage
    this.saveToLocalStorage()
  }

  /**
   * Loads all scores from storage.
   *
   * @returns Array of all stored leaderboard entries (sorted by score descending)
   */
  loadScores(): LeaderboardEntry[] {
    // Return a copy to prevent external mutation
    return [...this.inMemoryScores]
  }

  /**
   * Gets the top N scores with calculated ranks.
   *
   * @param count - Number of top scores to return (default: 10)
   * @returns Array of top scores with rank property
   */
  getTopScores(count = 10): RankedLeaderboardEntry[] {
    const topEntries = this.inMemoryScores.slice(0, count)

    return topEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))
  }

  /**
   * Clears all scores from storage.
   */
  clearAllScores(): void {
    this.inMemoryScores = []

    if (this.localStorageAvailable) {
      try {
        localStorage.removeItem(this.storageKey)
      } catch {
        // Ignore removal errors
      }
    }
  }

  /**
   * Checks if a score would qualify for the top 10.
   *
   * @param score - The score to check
   * @returns true if the score would be in the top 10
   */
  isInTopTen(score: number): boolean {
    // If fewer than 10 entries, any score qualifies
    if (this.inMemoryScores.length < 10) {
      return true
    }

    // Get the 10th place score
    const tenthPlaceScore = this.inMemoryScores[9]?.score ?? 0

    // Score qualifies if it's >= the 10th place score
    return score >= tenthPlaceScore
  }
}
