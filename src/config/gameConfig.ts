/**
 * Game Configuration Constants
 *
 * Centralizes all physics, gameplay, wave progression, power-up, visual, and
 * performance constants for easy tuning. Values match Design Doc specifications.
 *
 * This configuration is read-only after initialization (const + Readonly types).
 * All magic numbers are centralized here - no hardcoded values elsewhere.
 */

// ============================================
// GameConfig Interface
// ============================================

/**
 * Physics configuration - ship and asteroid movement parameters.
 */
export interface PhysicsConfig {
  /** Ship acceleration rate (units/s^2) */
  readonly shipAcceleration: number
  /** Ship maximum speed (units/s) */
  readonly shipMaxSpeed: number
  /** Ship rotation speed (radians/s) - PI = 180 degrees/second */
  readonly shipRotationSpeed: number
  /** Velocity damping factor (0-1, applied per frame) */
  readonly damping: number
  /** Asteroid speed by size category (units/s) */
  readonly asteroidSpeeds: {
    readonly large: number
    readonly medium: number
    readonly small: number
  }
}

/**
 * Scoring configuration for destroyed entities.
 */
export interface ScoringConfig {
  /** Points for destroying large asteroid */
  readonly largeAsteroid: number
  /** Points for destroying medium asteroid */
  readonly mediumAsteroid: number
  /** Points for destroying small asteroid */
  readonly smallAsteroid: number
  /** Base multiplier for boss defeat score (multiplied by wave number) */
  readonly bossMultiplier: number
}

/**
 * Gameplay configuration - lives, timing, and scoring.
 */
export interface GameplayConfig {
  /** Starting lives for new game */
  readonly initialLives: number
  /** Invulnerability period after respawn (milliseconds) */
  readonly invulnerabilityDuration: number
  /** Delay between wave completion and next wave start (milliseconds) */
  readonly waveTransitionDelay: number
  /** Score values for destroyed entities */
  readonly scoring: ScoringConfig
}

/**
 * Wave progression configuration.
 */
export interface WaveConfig {
  /** Starting number of asteroids in wave 1 */
  readonly baseAsteroidCount: number
  /** Additional asteroids added per wave */
  readonly asteroidIncrement: number
  /** Speed multiplier increase per wave (e.g., 1.05 = 5% faster) */
  readonly speedMultiplier: number
  /** Wave interval for boss spawns (every N waves) */
  readonly bossWaveInterval: number
}

/**
 * Shield power-up configuration.
 */
export interface ShieldPowerUpConfig {
  /** Shield duration (milliseconds) */
  readonly duration: number
}

/**
 * Rapid Fire power-up configuration.
 */
export interface RapidFirePowerUpConfig {
  /** Effect duration (milliseconds) */
  readonly duration: number
  /** Weapon cooldown multiplier (0.5 = 2x fire rate) */
  readonly cooldownMultiplier: number
}

/**
 * Multi-Shot power-up configuration.
 */
export interface MultiShotPowerUpConfig {
  /** Effect duration (milliseconds) */
  readonly duration: number
  /** Number of projectiles fired per shot */
  readonly projectileCount: number
}

/**
 * Power-up system configuration.
 */
export interface PowerUpsConfig {
  /** Chance to spawn power-up on asteroid destruction (0-1) */
  readonly spawnChance: number
  /** Shield power-up settings */
  readonly shield: ShieldPowerUpConfig
  /** Rapid Fire power-up settings */
  readonly rapidFire: RapidFirePowerUpConfig
  /** Multi-Shot power-up settings */
  readonly multiShot: MultiShotPowerUpConfig
}

/**
 * Visual/rendering configuration - object pools and limits.
 */
export interface VisualConfig {
  /** Initial particle pool size for effects */
  readonly particlePoolSize: number
  /** Initial projectile pool size */
  readonly projectilePoolSize: number
  /** Maximum projectiles allowed (pool expansion limit) */
  readonly maxProjectiles: number
  /** Initial asteroid pool size */
  readonly asteroidPoolSize: number
}

/**
 * Performance target configuration.
 */
export interface PerformanceConfig {
  /** Target frames per second */
  readonly targetFPS: number
  /** Target maximum draw calls per frame */
  readonly targetDrawCalls: number
  /** Spatial grid cell size for collision broad phase (units) */
  readonly collisionBroadPhaseGridSize: number
}

/**
 * Visual theme color palette configuration.
 */
export interface VisualPaletteConfig {
  /** Primary color (Blue #0088FF) */
  readonly primary: number
  /** Secondary color (Cyan #00FFFF) */
  readonly secondary: number
  /** Accent color (Magenta #FF00FF) */
  readonly accent: number
  /** Warning color (Orange #FF8800) */
  readonly warning: number
  /** Danger color (Red #FF0000) */
  readonly danger: number
  /** Success color (Green #00FF00) */
  readonly success: number
  /** Neutral color (Gray #808080) */
  readonly neutral: number
}

/**
 * Emissive intensity levels configuration.
 */
export interface EmissiveIntensityConfig {
  /** Low intensity (0.3) - for ambient glow like asteroids */
  readonly low: number
  /** Medium intensity (0.5) - for noticeable glow like ship */
  readonly medium: number
  /** High intensity (1.0) - for bright glow like projectiles, power-ups */
  readonly high: number
}

/**
 * Animation speed configuration.
 */
export interface AnimationSpeedsConfig {
  /** Ship invulnerability pulse frequency (Hz) */
  readonly invulnerabilityPulse: number
  /** Power-up rotation speed (radians per second) */
  readonly powerUpRotation: number
}

/**
 * Visual theme configuration for cyberpunk/neon aesthetic.
 */
export interface VisualThemeConfig {
  /** Color palette */
  readonly palette: VisualPaletteConfig
  /** Emissive intensity levels */
  readonly emissiveIntensity: EmissiveIntensityConfig
  /** Animation speeds */
  readonly animationSpeeds: AnimationSpeedsConfig
}

/**
 * Weapon type configuration.
 */
export interface WeaponTypeConfig {
  /** Projectile speed in units/second */
  readonly projectileSpeed: number
  /** Damage per hit */
  readonly damage: number
  /** Cooldown between shots in milliseconds */
  readonly cooldown: number
}

/**
 * Weapons configuration for all weapon types.
 */
export interface WeaponsConfig {
  /** Single shot weapon */
  readonly single: WeaponTypeConfig
  /** Spread shot weapon (fires multiple projectiles) */
  readonly spread: WeaponTypeConfig
  /** Laser weapon (continuous beam) */
  readonly laser: WeaponTypeConfig
  /** Homing missile weapon */
  readonly homing: WeaponTypeConfig
  /** Boss projectile weapon */
  readonly boss: WeaponTypeConfig
}

/**
 * Main game configuration interface combining all sections.
 */
export interface GameConfig {
  /** Physics simulation parameters */
  readonly physics: PhysicsConfig
  /** Gameplay parameters (lives, timing, scoring) */
  readonly gameplay: GameplayConfig
  /** Wave progression settings */
  readonly wave: WaveConfig
  /** Power-up configuration */
  readonly powerups: PowerUpsConfig
  /** Visual/pool size settings */
  readonly visual: VisualConfig
  /** Performance targets */
  readonly performance: PerformanceConfig
  /** Weapons configuration */
  readonly weapons: WeaponsConfig
  /** Visual theme configuration (colors, emissive, animations) */
  readonly visualTheme: VisualThemeConfig
}

// ============================================
// Game Configuration Constant
// ============================================

/**
 * Game configuration constant with all values matching Design Doc specifications.
 *
 * Physics values from Design Doc:
 * - Ship rotation: 180 degrees/second (PI rad/s)
 * - Ship acceleration: 0.5 units/s^2
 * - Max speed: 300 units/s
 * - Damping: 0.99 per frame
 *
 * Gameplay values from Design Doc:
 * - Initial lives: 3
 * - Invulnerability: 3000ms
 * - Wave transition: 3000ms
 * - Scoring: large=25, medium=50, small=100
 * - Boss multiplier: 1000
 *
 * Wave progression from Design Doc:
 * - Base asteroid count: 3
 * - Increment: +2 per wave
 * - Speed multiplier: 1.05 per wave (capped at 2.0 in game logic)
 * - Boss every 5 waves
 *
 * Power-up values from Design Doc:
 * - Spawn chance: 10%
 * - Shield: 10000ms
 * - Rapid Fire: 15000ms, 0.5x cooldown
 * - Multi-Shot: 15000ms, 3 projectiles
 *
 * Visual/pool values from Design Doc:
 * - Particles: 500 initial
 * - Projectiles: 50 initial, 200 max
 * - Asteroids: 30 initial
 *
 * Performance targets:
 * - 60 FPS
 * - <100 draw calls
 * - 100 unit grid cells for collision broad phase
 */
export const gameConfig: GameConfig = {
  physics: {
    shipAcceleration: 0.5,
    shipMaxSpeed: 300,
    shipRotationSpeed: Math.PI,
    damping: 0.99,
    asteroidSpeeds: {
      large: 50,
      medium: 75,
      small: 100
    }
  },
  gameplay: {
    initialLives: 3,
    invulnerabilityDuration: 3000,
    waveTransitionDelay: 3000,
    scoring: {
      largeAsteroid: 25,
      mediumAsteroid: 50,
      smallAsteroid: 100,
      bossMultiplier: 1000
    }
  },
  wave: {
    baseAsteroidCount: 3,
    asteroidIncrement: 2,
    speedMultiplier: 1.05,
    bossWaveInterval: 5
  },
  powerups: {
    spawnChance: 0.1,
    shield: { duration: 10000 },
    rapidFire: { duration: 15000, cooldownMultiplier: 0.5 },
    multiShot: { duration: 15000, projectileCount: 3 }
  },
  visual: {
    particlePoolSize: 500,
    projectilePoolSize: 50,
    maxProjectiles: 200,
    asteroidPoolSize: 30
  },
  performance: {
    targetFPS: 60,
    targetDrawCalls: 100,
    collisionBroadPhaseGridSize: 100
  },
  weapons: {
    single: {
      projectileSpeed: 400,
      damage: 10,
      cooldown: 250
    },
    spread: {
      projectileSpeed: 350,
      damage: 5,
      cooldown: 400
    },
    laser: {
      projectileSpeed: 600,
      damage: 2,
      cooldown: 50
    },
    homing: {
      projectileSpeed: 300,
      damage: 20,
      cooldown: 300
    },
    boss: {
      projectileSpeed: 350,
      damage: 15,
      cooldown: 500
    }
  },
  visualTheme: {
    palette: {
      primary: 0x0088ff, // Blue
      secondary: 0x00ffff, // Cyan
      accent: 0xff00ff, // Magenta
      warning: 0xff8800, // Orange
      danger: 0xff0000, // Red
      success: 0x00ff00, // Green
      neutral: 0x808080 // Gray
    },
    emissiveIntensity: {
      low: 0.3, // Asteroids (ambient glow)
      medium: 0.5, // Ship (noticeable)
      high: 1.0 // Projectiles, power-ups (bright)
    },
    animationSpeeds: {
      invulnerabilityPulse: 5, // Hz (5 pulses per second)
      powerUpRotation: Math.PI / 2 // rad/s (90 degrees per second)
    }
  }
}
