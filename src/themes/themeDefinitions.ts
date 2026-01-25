/**
 * Theme Definitions - Visual theme configurations for the Asteroids game
 *
 * Defines multiple visual themes that affect:
 * - Color palettes (ship, asteroids, projectiles, power-ups)
 * - Material properties (emissive intensity, glow effects)
 * - Background colors
 * - Line thickness (for future wireframe mode)
 *
 * Available themes:
 * - Classic: Green vector lines on black (original arcade style)
 * - Neon: Bright colors with strong glow effects (cyberpunk)
 * - Retro: Muted colors with CRT-like feel (vintage)
 */

/**
 * Color palette for a visual theme.
 * All colors are hex numbers (e.g., 0x00ff00).
 */
export interface ThemePalette {
  /** Primary color for player ship */
  readonly ship: number
  /** Ship emissive/glow color */
  readonly shipEmissive: number
  /** Asteroid base color */
  readonly asteroid: number
  /** Asteroid emissive color */
  readonly asteroidEmissive: number
  /** Default projectile color */
  readonly projectile: number
  /** Spread projectile color */
  readonly projectileSpread: number
  /** Laser projectile color */
  readonly projectileLaser: number
  /** Missile projectile color */
  readonly projectileMissile: number
  /** Boss projectile color */
  readonly projectileBoss: number
  /** Shield power-up color */
  readonly powerUpShield: number
  /** Rapid fire power-up color */
  readonly powerUpRapidFire: number
  /** Multi-shot power-up color */
  readonly powerUpMultiShot: number
  /** Extra life power-up color */
  readonly powerUpExtraLife: number
  /** Boss phase 1 color */
  readonly bossPhase1: number
  /** Boss phase 2 color */
  readonly bossPhase2: number
  /** Boss phase 3 color */
  readonly bossPhase3: number
  /** UI accent color (for menus, HUD highlights) */
  readonly uiAccent: number
  /** UI text color */
  readonly uiText: number
}

/**
 * Emissive intensity levels for glow effects.
 */
export interface ThemeEmissiveIntensity {
  /** Low intensity for ambient glow (asteroids) */
  readonly low: number
  /** Medium intensity for noticeable glow (ship) */
  readonly medium: number
  /** High intensity for bright glow (projectiles, power-ups) */
  readonly high: number
  /** Ship-specific emissive intensity */
  readonly ship: number
  /** Boss-specific emissive intensity */
  readonly boss: number
}

/**
 * Background and lighting configuration.
 */
export interface ThemeBackground {
  /** Scene background color */
  readonly color: number
  /** Ambient light color */
  readonly ambientLight: number
  /** Ambient light intensity (0-1) */
  readonly ambientIntensity: number
  /** Directional light color */
  readonly directionalLight: number
  /** Directional light intensity (0-1) */
  readonly directionalIntensity: number
}

/**
 * Material properties for theme.
 */
export interface ThemeMaterialProperties {
  /** Default roughness for metallic materials */
  readonly roughness: number
  /** Default metalness for metallic materials */
  readonly metalness: number
  /** Transparency for projectiles */
  readonly projectileOpacity: number
}

/**
 * Complete theme configuration.
 */
export interface ThemeConfig {
  /** Unique theme identifier */
  readonly id: string
  /** Display name for UI */
  readonly name: string
  /** Short description */
  readonly description: string
  /** Color palette */
  readonly palette: ThemePalette
  /** Emissive intensity levels */
  readonly emissive: ThemeEmissiveIntensity
  /** Background and lighting */
  readonly background: ThemeBackground
  /** Material properties */
  readonly materials: ThemeMaterialProperties
}

/**
 * Theme identifier type for type safety.
 */
export type ThemeId = 'classic' | 'neon' | 'retro'

/**
 * Classic theme - Green vector lines on black background.
 * Inspired by the original 1979 Asteroids arcade game.
 */
export const classicTheme: ThemeConfig = {
  id: 'classic',
  name: 'Classic Vector',
  description: 'Original arcade style with green vector graphics',
  palette: {
    ship: 0x00ff00, // Bright green
    shipEmissive: 0x00ff00,
    asteroid: 0x808080, // Gray
    asteroidEmissive: 0x00ff00, // Green glow
    projectile: 0x00ff00, // Green
    projectileSpread: 0x00ff00,
    projectileLaser: 0x00ff00,
    projectileMissile: 0x00ff00,
    projectileBoss: 0xff0000, // Red for enemy
    powerUpShield: 0x00ffff, // Cyan
    powerUpRapidFire: 0xffff00, // Yellow
    powerUpMultiShot: 0xff00ff, // Magenta
    powerUpExtraLife: 0x00ff00, // Green
    bossPhase1: 0x00ff00,
    bossPhase2: 0xffff00,
    bossPhase3: 0xff0000,
    uiAccent: 0x00ff00,
    uiText: 0x00ff00
  },
  emissive: {
    low: 0.4,
    medium: 0.7,
    high: 1.0,
    ship: 0.9,
    boss: 0.8
  },
  background: {
    color: 0x000000, // Pure black
    ambientLight: 0x111111,
    ambientIntensity: 0.3,
    directionalLight: 0xffffff,
    directionalIntensity: 0.8
  },
  materials: {
    roughness: 0.5,
    metalness: 0.3,
    projectileOpacity: 0.9
  }
}

/**
 * Neon theme - Bright colors with strong glow effects.
 * Cyberpunk/synthwave aesthetic.
 */
export const neonTheme: ThemeConfig = {
  id: 'neon',
  name: 'Neon Glow',
  description: 'Cyberpunk style with bright neon colors and glow',
  palette: {
    ship: 0x00ffff, // Cyan
    shipEmissive: 0x00ffff,
    asteroid: 0x808080, // Gray
    asteroidEmissive: 0x00ffff, // Cyan glow
    projectile: 0xff0000, // Red
    projectileSpread: 0x0088ff, // Blue
    projectileLaser: 0x00ffff, // Cyan
    projectileMissile: 0x00ff00, // Green
    projectileBoss: 0xff8800, // Orange
    powerUpShield: 0x00ffff, // Cyan
    powerUpRapidFire: 0xffff00, // Yellow
    powerUpMultiShot: 0xff00ff, // Magenta
    powerUpExtraLife: 0x00ff00, // Green
    bossPhase1: 0x0088ff, // Blue
    bossPhase2: 0xff8800, // Orange
    bossPhase3: 0xff0000, // Red
    uiAccent: 0x00ffff,
    uiText: 0xffffff
  },
  emissive: {
    low: 0.3,
    medium: 0.5,
    high: 1.0,
    ship: 0.8,
    boss: 0.8
  },
  background: {
    color: 0x000000, // Black
    ambientLight: 0x222244, // Dark blue tint
    ambientIntensity: 0.4,
    directionalLight: 0xffffff,
    directionalIntensity: 1.0
  },
  materials: {
    roughness: 0.3,
    metalness: 0.7,
    projectileOpacity: 0.8
  }
}

/**
 * Retro theme - Muted colors with CRT-like feel.
 * Vintage gaming aesthetic with phosphor glow simulation.
 */
export const retroTheme: ThemeConfig = {
  id: 'retro',
  name: 'Retro CRT',
  description: 'Vintage style with muted colors and phosphor glow',
  palette: {
    ship: 0x88cc88, // Muted green
    shipEmissive: 0x66aa66,
    asteroid: 0x666666, // Dark gray
    asteroidEmissive: 0x88aa88, // Muted green-gray
    projectile: 0xcccc88, // Muted yellow
    projectileSpread: 0x8888cc, // Muted blue
    projectileLaser: 0x88cccc, // Muted cyan
    projectileMissile: 0xcc8888, // Muted red
    projectileBoss: 0xcc8844, // Muted orange
    powerUpShield: 0x88cccc, // Muted cyan
    powerUpRapidFire: 0xcccc88, // Muted yellow
    powerUpMultiShot: 0xcc88cc, // Muted magenta
    powerUpExtraLife: 0x88cc88, // Muted green
    bossPhase1: 0x8888cc, // Muted blue
    bossPhase2: 0xccaa66, // Muted orange
    bossPhase3: 0xcc6666, // Muted red
    uiAccent: 0x88cc88,
    uiText: 0xcccccc
  },
  emissive: {
    low: 0.2,
    medium: 0.4,
    high: 0.7,
    ship: 0.5,
    boss: 0.6
  },
  background: {
    color: 0x0a0a0a, // Very dark gray (not pure black)
    ambientLight: 0x1a1a1a, // Warm dark
    ambientIntensity: 0.5,
    directionalLight: 0xeeeedd, // Slightly warm white
    directionalIntensity: 0.7
  },
  materials: {
    roughness: 0.6,
    metalness: 0.2,
    projectileOpacity: 0.85
  }
}

/**
 * All available themes indexed by ID.
 */
export const themes: Record<ThemeId, ThemeConfig> = {
  classic: classicTheme,
  neon: neonTheme,
  retro: retroTheme
}

/**
 * Default theme ID to use when no preference is saved.
 */
export const DEFAULT_THEME_ID: ThemeId = 'neon'

/**
 * List of all available theme IDs for iteration.
 */
export const THEME_IDS: readonly ThemeId[] = ['classic', 'neon', 'retro'] as const
