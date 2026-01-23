/**
 * Audio Configuration
 *
 * Defines sound effect and music configurations with preload strategy.
 * Critical sounds (shoot, collision, powerup) are preloaded before game start.
 * Music is lazy-loaded after menu displays to reduce initial load time.
 *
 * Audio paths are placeholders - actual audio files not required for Phase 1.
 * The structure supports Howler.js integration in Phase 5.
 */

// ============================================
// AudioDefinition Interface
// ============================================

/**
 * Configuration for a single audio asset.
 */
export interface AudioDefinition {
  /** Unique identifier for the sound */
  readonly id: string
  /** Path to the audio file (relative to public directory) */
  readonly path: string
  /** Default playback volume (0-1) */
  readonly volume: number
  /** Whether to preload this audio before game start */
  readonly preload: boolean
}

// ============================================
// AudioConfig Interface
// ============================================

/**
 * Sound effects configuration - critical gameplay audio.
 */
export interface SfxConfig {
  /** Weapon firing sound */
  readonly shoot: AudioDefinition
  /** Explosion/destruction sound */
  readonly explosion: AudioDefinition
  /** Power-up collection sound */
  readonly powerup: AudioDefinition
  /** Ship thrust/engine sound */
  readonly thrust: AudioDefinition
}

/**
 * Music configuration - background and boss music.
 */
export interface MusicConfig {
  /** Main background music (looping) */
  readonly background: AudioDefinition
  /** Boss battle music */
  readonly boss: AudioDefinition
}

/**
 * Complete audio configuration combining SFX and music.
 */
export interface AudioConfig {
  /** Sound effects */
  readonly sfx: SfxConfig
  /** Music tracks */
  readonly music: MusicConfig
}

// ============================================
// Audio Configuration Constant
// ============================================

/**
 * Audio configuration with all sound definitions.
 *
 * Preload Strategy (from Design Doc):
 * - Critical (preload before game start): shoot, collision, powerup, thrust
 * - Lazy-load (after menu displays): background music, boss themes
 *
 * Volume levels are set to reasonable defaults:
 * - SFX: 0.4-0.8 (higher for important feedback)
 * - Music: 0.5 (background, not overpowering)
 *
 * Audio paths follow the standard asset structure:
 * /assets/audio/[filename].mp3
 */
export const audioConfig: AudioConfig = {
  sfx: {
    shoot: {
      id: 'shoot',
      path: '/assets/audio/shoot.mp3',
      volume: 0.7,
      preload: true
    },
    explosion: {
      id: 'explosion',
      path: '/assets/audio/explosion.mp3',
      volume: 0.8,
      preload: true
    },
    powerup: {
      id: 'powerup',
      path: '/assets/audio/powerup.mp3',
      volume: 0.6,
      preload: true
    },
    thrust: {
      id: 'thrust',
      path: '/assets/audio/thrust.mp3',
      volume: 0.4,
      preload: true
    }
  },
  music: {
    background: {
      id: 'music_background',
      path: '/assets/audio/background.mp3',
      volume: 0.5,
      preload: false
    },
    boss: {
      id: 'music_boss',
      path: '/assets/audio/boss.mp3',
      volume: 0.5,
      preload: false
    }
  }
}
