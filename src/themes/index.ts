/**
 * Theme System Exports
 *
 * Provides visual theme management for the Asteroids game.
 *
 * @example
 * ```typescript
 * import { ThemeManager, themes, ThemeId } from './themes'
 *
 * const manager = ThemeManager.getInstance()
 * manager.setTheme('classic')
 * ```
 */

export { ThemeManager } from './ThemeManager'
export type { ThemeChangeListener } from './ThemeManager'

export {
  type ThemeConfig,
  type ThemePalette,
  type ThemeEmissiveIntensity,
  type ThemeBackground,
  type ThemeMaterialProperties,
  type ThemeId,
  themes,
  classicTheme,
  neonTheme,
  retroTheme,
  DEFAULT_THEME_ID,
  THEME_IDS
} from './themeDefinitions'
