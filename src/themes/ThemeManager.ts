/**
 * ThemeManager - Visual theme management and application
 *
 * Manages the active visual theme for the game:
 * - Loads/saves theme preference to localStorage
 * - Provides access to current theme configuration
 * - Notifies listeners when theme changes for live updates
 * - Validates theme IDs and falls back to default on errors
 *
 * Usage:
 * ```typescript
 * const themeManager = ThemeManager.getInstance()
 * themeManager.setTheme('classic')
 * const palette = themeManager.getTheme().palette
 * ```
 */

import {
  DEFAULT_THEME_ID,
  THEME_IDS,
  type ThemeConfig,
  type ThemeId,
  themes
} from './themeDefinitions'

/** Storage key for theme persistence */
const STORAGE_KEY = 'asteroids-visual-theme'

/** Theme change listener callback type */
export type ThemeChangeListener = (theme: ThemeConfig, previousTheme: ThemeConfig) => void

/**
 * ThemeManager handles visual theme selection, persistence, and notification.
 *
 * Implements singleton pattern for global access across the application.
 * Uses observer pattern to notify systems when theme changes.
 */
export class ThemeManager {
  private static instance: ThemeManager | null = null

  private currentTheme: ThemeConfig
  private listeners: Set<ThemeChangeListener> = new Set()

  /**
   * Private constructor for singleton pattern.
   * Loads saved theme or uses default.
   */
  private constructor() {
    this.currentTheme = this.loadSavedTheme()
  }

  /**
   * Get the singleton ThemeManager instance.
   * Creates the instance on first call.
   */
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  /**
   * Reset the singleton instance (for testing purposes).
   */
  static resetInstance(): void {
    ThemeManager.instance = null
  }

  /**
   * Load saved theme from localStorage.
   * Falls back to default theme if not found or invalid.
   */
  private loadSavedTheme(): ThemeConfig {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY)
      if (savedId && this.isValidThemeId(savedId)) {
        return themes[savedId as ThemeId]
      }
    } catch {
      // localStorage not available or error reading - use default
    }
    return themes[DEFAULT_THEME_ID]
  }

  /**
   * Check if a string is a valid theme ID.
   */
  private isValidThemeId(id: string): id is ThemeId {
    return THEME_IDS.includes(id as ThemeId)
  }

  /**
   * Save theme preference to localStorage.
   */
  private saveTheme(themeId: ThemeId): void {
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // localStorage not available - ignore
    }
  }

  /**
   * Get the current active theme configuration.
   */
  getTheme(): ThemeConfig {
    return this.currentTheme
  }

  /**
   * Get the current theme ID.
   */
  getThemeId(): ThemeId {
    return this.currentTheme.id as ThemeId
  }

  /**
   * Get a specific theme by ID.
   * Returns undefined if theme ID is invalid.
   */
  getThemeById(id: ThemeId): ThemeConfig | undefined {
    return themes[id]
  }

  /**
   * Get all available themes.
   */
  getAllThemes(): ThemeConfig[] {
    return THEME_IDS.map((id) => themes[id])
  }

  /**
   * Get all available theme IDs.
   */
  getAvailableThemeIds(): readonly ThemeId[] {
    return THEME_IDS
  }

  /**
   * Set the active theme by ID.
   * Persists the choice and notifies all listeners.
   *
   * @param themeId - The theme ID to activate
   * @returns true if theme was changed, false if already active or invalid
   */
  setTheme(themeId: ThemeId): boolean {
    if (!this.isValidThemeId(themeId)) {
      console.warn(`Invalid theme ID: ${themeId}. Using current theme.`)
      return false
    }

    const newTheme = themes[themeId]
    if (newTheme.id === this.currentTheme.id) {
      return false // Already active
    }

    const previousTheme = this.currentTheme
    this.currentTheme = newTheme
    this.saveTheme(themeId)

    // Notify all listeners of the change
    this.notifyListeners(newTheme, previousTheme)

    return true
  }

  /**
   * Subscribe to theme change events.
   *
   * @param listener - Callback function called when theme changes
   * @returns Unsubscribe function
   */
  subscribe(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of a theme change.
   */
  private notifyListeners(newTheme: ThemeConfig, previousTheme: ThemeConfig): void {
    for (const listener of this.listeners) {
      try {
        listener(newTheme, previousTheme)
      } catch (error) {
        console.error('Error in theme change listener:', error)
      }
    }
  }

  /**
   * Cycle to the next theme in the list.
   * Useful for quick theme switching via keyboard.
   */
  cycleTheme(): ThemeId {
    const currentIndex = THEME_IDS.indexOf(this.currentTheme.id as ThemeId)
    const nextIndex = (currentIndex + 1) % THEME_IDS.length
    const nextId = THEME_IDS[nextIndex]
    if (nextId) {
      this.setTheme(nextId)
      return nextId
    }
    return this.getThemeId()
  }
}
