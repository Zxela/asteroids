/**
 * AudioManager
 *
 * Singleton class that wraps Howler.js for centralized audio management.
 * Features:
 * - Preloading of critical sounds (shoot, explosion, powerup, thrust)
 * - Lazy-loading of non-critical sounds (music, gameOver)
 * - Separate volume controls for SFX and music
 * - localStorage persistence for volume settings
 * - Mute/unmute functionality
 * - AudioContext resume for browser autoplay policy compliance
 */

import { Howl, Howler } from 'howler'
import { type AudioDefinition, audioConfig } from '../config/audioConfig'

/** Audio settings stored in localStorage */
interface AudioSettings {
  sfx: number
  music: number
  muted: boolean
}

/** Volume type for setVolume/getVolume */
export type VolumeType = 'sfx' | 'music'

/** Options for playing a sound */
export interface PlaySoundOptions {
  volume?: number
}

/** Options for playing music */
export interface PlayMusicOptions {
  volume?: number
  fadeIn?: number
}

/** localStorage key for audio settings */
const STORAGE_KEY = 'asteroids-audio-settings'

/** Default audio settings */
const DEFAULT_SETTINGS: AudioSettings = {
  sfx: 1,
  music: 1,
  muted: false
}

/**
 * AudioManager - Centralized audio management with Howler.js.
 *
 * Implements singleton pattern to ensure single instance across the game.
 * Critical sounds are preloaded on init for responsive gameplay.
 * Music and non-critical sounds are lazy-loaded on first play.
 */
export class AudioManager {
  private static instance: AudioManager | null = null

  private sounds: Map<string, Howl> = new Map()
  private sfxVolume = 1
  private musicVolume = 1
  private muted = false
  private initialized = false
  private currentMusic: Howl | null = null
  private currentMusicId: string | null = null

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of AudioManager.
   * @returns The AudioManager instance
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /**
   * Initialize the audio manager.
   * - Restores settings from localStorage
   * - Preloads critical sounds
   * - Sets up user interaction listener for AudioContext resume
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return
    }

    // Restore settings from localStorage
    this.loadSettings()

    // Preload critical sounds
    await this.preloadCriticalSounds()

    // Set up AudioContext resume on user interaction
    this.setupAudioContextResume()

    this.initialized = true
  }

  /**
   * Play a sound effect by ID.
   * @param id - Sound ID (e.g., 'shoot', 'explosion', 'powerup', 'thrust', 'gameOver')
   * @param options - Optional playback options
   */
  playSound(id: string, options: PlaySoundOptions = {}): void {
    if (this.muted) {
      return
    }

    const sound = this.getOrLoadSound(id)
    if (!sound) {
      return
    }

    // Calculate effective volume
    const baseVolume = this.getSoundDefinition(id)?.volume ?? 1
    const optionVolume = options.volume ?? 1
    const effectiveVolume = this.sfxVolume * baseVolume * optionVolume

    sound.volume(effectiveVolume)
    sound.play()
  }

  /**
   * Play music by ID with optional looping.
   * @param id - Music ID (e.g., 'music_background', 'music_boss', 'music_menu')
   * @param options - Optional playback options
   */
  playMusic(id: string, options: PlayMusicOptions = {}): void {
    // Stop current music if playing
    if (this.currentMusic) {
      this.currentMusic.stop()
    }

    const sound = this.getOrLoadSound(id, true)
    if (!sound) {
      return
    }

    // Calculate effective volume
    const baseVolume = this.getSoundDefinition(id)?.volume ?? 1
    const optionVolume = options.volume ?? 1
    const effectiveVolume = this.muted ? 0 : this.musicVolume * baseVolume * optionVolume

    sound.volume(effectiveVolume)
    sound.loop(true)
    sound.play()

    this.currentMusic = sound
    this.currentMusicId = id
  }

  /**
   * Stop the currently playing music.
   * @param fadeOut - Optional fade out duration in milliseconds
   */
  stopMusic(fadeOut?: number): void {
    if (!this.currentMusic) {
      return
    }

    if (fadeOut && fadeOut > 0) {
      this.currentMusic.fade(this.currentMusic.volume() as number, 0, fadeOut)
      // Let the fade complete before stopping
      setTimeout(() => {
        this.currentMusic?.stop()
        this.currentMusic = null
        this.currentMusicId = null
      }, fadeOut)
    } else {
      this.currentMusic.stop()
      this.currentMusic = null
      this.currentMusicId = null
    }
  }

  /**
   * Set volume for a specific type (sfx or music).
   * @param type - 'sfx' or 'music'
   * @param level - Volume level (0-1), will be clamped
   */
  setVolume(type: VolumeType, level: number): void {
    // Clamp to 0-1 range
    const clampedLevel = Math.max(0, Math.min(1, level))

    if (type === 'sfx') {
      this.sfxVolume = clampedLevel
    } else {
      this.musicVolume = clampedLevel
      // Update currently playing music volume
      if (this.currentMusic && this.currentMusicId) {
        const def = this.getSoundDefinition(this.currentMusicId)
        const baseVolume = def?.volume ?? 1
        this.currentMusic.volume(this.muted ? 0 : clampedLevel * baseVolume)
      }
    }

    this.saveSettings()
  }

  /**
   * Get the current volume for a type.
   * @param type - 'sfx' or 'music'
   * @returns Volume level (0-1)
   */
  getVolume(type: VolumeType): number {
    return type === 'sfx' ? this.sfxVolume : this.musicVolume
  }

  /**
   * Mute or unmute all audio.
   * @param muted - Whether to mute audio
   */
  mute(muted: boolean): void {
    this.muted = muted

    // Update all sounds
    for (const sound of this.sounds.values()) {
      sound.mute(muted)
    }

    // Update current music
    if (this.currentMusic && this.currentMusicId) {
      if (muted) {
        this.currentMusic.volume(0)
      } else {
        const def = this.getSoundDefinition(this.currentMusicId)
        const baseVolume = def?.volume ?? 1
        this.currentMusic.volume(this.musicVolume * baseVolume)
      }
    }

    this.saveSettings()
  }

  /**
   * Check if audio is muted.
   * @returns Whether audio is muted
   */
  isMuted(): boolean {
    return this.muted
  }

  /**
   * Stop all playing sound effects.
   * Note: This does not stop music.
   */
  stopAllSounds(): void {
    for (const [id, sound] of this.sounds.entries()) {
      // Skip music tracks
      if (!id.startsWith('music_')) {
        sound.stop()
      }
    }
  }

  /**
   * Destroy the AudioManager and reset singleton.
   * Used for testing and cleanup.
   */
  destroy(): void {
    // Stop all sounds
    for (const sound of this.sounds.values()) {
      sound.stop()
      sound.unload()
    }

    this.sounds.clear()
    this.currentMusic = null
    this.currentMusicId = null
    this.initialized = false

    // Reset singleton
    AudioManager.instance = null
  }

  /**
   * Load settings from localStorage.
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings: AudioSettings = JSON.parse(stored)
        this.sfxVolume = settings.sfx ?? DEFAULT_SETTINGS.sfx
        this.musicVolume = settings.music ?? DEFAULT_SETTINGS.music
        this.muted = settings.muted ?? DEFAULT_SETTINGS.muted
      }
    } catch {
      // Use defaults on error
      this.sfxVolume = DEFAULT_SETTINGS.sfx
      this.musicVolume = DEFAULT_SETTINGS.music
      this.muted = DEFAULT_SETTINGS.muted
    }
  }

  /**
   * Save settings to localStorage.
   */
  private saveSettings(): void {
    try {
      const settings: AudioSettings = {
        sfx: this.sfxVolume,
        music: this.musicVolume,
        muted: this.muted
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore localStorage errors (e.g., quota exceeded, unavailable)
    }
  }

  /**
   * Preload critical sounds that need to be ready immediately.
   */
  private async preloadCriticalSounds(): Promise<void> {
    const criticalSounds = Object.values(audioConfig.sfx)

    const loadPromises = criticalSounds.map((def) => this.loadSound(def))

    await Promise.all(loadPromises)
  }

  /**
   * Load a single sound.
   * @param def - Audio definition
   * @returns Promise that resolves when loaded
   */
  private loadSound(def: AudioDefinition): Promise<void> {
    return new Promise((resolve) => {
      const howl = new Howl({
        src: [def.path],
        volume: def.volume,
        preload: def.preload,
        onload: () => resolve()
      })

      this.sounds.set(def.id, howl)

      // If not preloading, resolve immediately
      if (!def.preload) {
        resolve()
      }
    })
  }

  /**
   * Get or lazy-load a sound by ID.
   * @param id - Sound ID
   * @param isMusic - Whether this is a music track (for loop setting)
   * @returns The Howl instance or undefined if not found
   */
  private getOrLoadSound(id: string, isMusic = false): Howl | undefined {
    // Check if already loaded
    const existing = this.sounds.get(id)
    if (existing) {
      return existing
    }

    // Try to find definition and lazy-load
    const def = this.getSoundDefinition(id)
    if (!def) {
      return undefined
    }

    // Create new Howl for lazy-loaded sound
    const howl = new Howl({
      src: [def.path],
      volume: def.volume,
      loop: isMusic,
      preload: true
    })

    this.sounds.set(id, howl)
    return howl
  }

  /**
   * Get audio definition by ID.
   * @param id - Sound ID
   * @returns Audio definition or undefined
   */
  private getSoundDefinition(id: string): AudioDefinition | undefined {
    // Check SFX
    const sfx = audioConfig.sfx as unknown as Record<string, AudioDefinition>
    if (sfx[id]) {
      return sfx[id]
    }

    // Check lazy-load SFX
    const lazyLoadSfx = audioConfig.lazyLoadSfx as unknown as Record<string, AudioDefinition>
    if (lazyLoadSfx[id]) {
      return lazyLoadSfx[id]
    }

    // Check music
    const music = audioConfig.music as unknown as Record<string, AudioDefinition>
    for (const musicDef of Object.values(music)) {
      if (musicDef.id === id) {
        return musicDef
      }
    }

    // Search by key name in music
    if (music[id]) {
      return music[id]
    }

    return undefined
  }

  /**
   * Set up AudioContext resume on user interaction.
   * Required for browser autoplay policy compliance.
   */
  private setupAudioContextResume(): void {
    const resumeAudio = () => {
      const ctx = Howler.ctx
      if (ctx && ctx.state === 'suspended') {
        ctx.resume()
      }
    }

    // Add listener for first click
    document.addEventListener('click', resumeAudio, { once: true })
    document.addEventListener('keydown', resumeAudio, { once: true })
    document.addEventListener('touchstart', resumeAudio, { once: true })
  }
}
