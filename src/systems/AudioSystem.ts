/**
 * AudioSystem - Event-driven audio playback system
 *
 * Connects game events to audio playback through the AudioManager.
 * Listens for weapon fire, asteroid destruction, power-up collection,
 * ship thrust, player death, and boss events to trigger appropriate sounds.
 *
 * Features:
 * - Event subscription for all gameplay audio triggers
 * - Volume scaling based on event properties (asteroid size, etc.)
 * - Thrust sound loop management
 * - Music transitions for game state changes
 * - Boss theme crossfade support
 *
 * Following ADR-0001: ECS architecture for game entity management.
 * Following ADR-0004: Audio System with event-driven playback.
 *
 * @module systems/AudioSystem
 */

import type { AudioManager } from '../audio/AudioManager'
import type {
  AsteroidDestroyedEventData,
  BossDefeatedEventData,
  BossSpawnedEventData,
  PlayerDiedEventData,
  PowerUpCollectedEventData,
  ShipThrustEventData,
  WaveStartedEventData,
  WeaponFiredEventData
} from '../types/events'
import type { GameFlowState } from '../types/game'
import type { EventEmitter, EventHandler } from '../utils/EventEmitter'

/**
 * Event map type for the EventBus used by AudioSystem
 * Uses EventData types (payload only) to match Game.ts event emitter
 */
interface AudioEventMap extends Record<string, unknown> {
  weaponFired: WeaponFiredEventData
  asteroidDestroyed: AsteroidDestroyedEventData
  powerUpCollected: PowerUpCollectedEventData
  shipThrust: ShipThrustEventData
  playerDied: PlayerDiedEventData
  waveStarted: WaveStartedEventData
  bossSpawned: BossSpawnedEventData
  bossDefeated: BossDefeatedEventData
  gameStateChanged: { state: GameFlowState }
}

/**
 * Minimal event map for global events (state changes only).
 * Used when AudioSystem subscribes to globalEventEmitter for music transitions.
 */
interface GlobalAudioEventMap extends Record<string, unknown> {
  gameStateChanged: { state: GameFlowState }
}

/**
 * Volume multipliers for asteroid sizes
 */
const ASTEROID_VOLUME_MULTIPLIERS: Record<string, number> = {
  large: 1.0,
  medium: 0.7,
  small: 0.4
}

/**
 * Pause state music volume multiplier
 */
const PAUSED_VOLUME_MULTIPLIER = 0.3

/**
 * AudioSystem - Event listener and audio trigger system
 *
 * Subscribes to game events and triggers appropriate sounds through
 * the AudioManager. Handles continuous sounds like thrust and manages
 * music transitions for game state changes.
 *
 * @example
 * ```typescript
 * const audioManager = AudioManager.getInstance()
 * const eventBus = new EventEmitter<AudioEventMap>()
 * const audioSystem = new AudioSystem(audioManager, eventBus)
 *
 * // System automatically plays sounds based on events
 * eventBus.emit('weaponFired', weaponEvent) // Plays shoot sound
 *
 * // Cleanup
 * audioSystem.destroy()
 * ```
 */
export class AudioSystem {
  /** System type identifier */
  readonly systemType = 'audio' as const

  /** Reference to AudioManager for sound playback */
  private audioManager: AudioManager | null

  /** Reference to EventBus for event subscriptions (accepts full or global-only event maps) */
  private eventBus: EventEmitter<AudioEventMap> | EventEmitter<GlobalAudioEventMap> | null

  /** Flag indicating if thrust sound is currently playing */
  private thrustSoundPlaying = false

  /** Stored music volume before pausing */
  private previousMusicVolume = 1

  /** Flag indicating if system has been destroyed */
  private destroyed = false

  /** Event handler references for cleanup */
  private handlers: {
    weaponFired: EventHandler<WeaponFiredEventData>
    asteroidDestroyed: EventHandler<AsteroidDestroyedEventData>
    powerUpCollected: EventHandler<PowerUpCollectedEventData>
    shipThrust: EventHandler<ShipThrustEventData>
    playerDied: EventHandler<PlayerDiedEventData>
    waveStarted: EventHandler<WaveStartedEventData>
    bossSpawned: EventHandler<BossSpawnedEventData>
    bossDefeated: EventHandler<BossDefeatedEventData>
    gameStateChanged: EventHandler<{ state: GameFlowState }>
  }

  /**
   * Create a new AudioSystem instance.
   *
   * @param audioManager - AudioManager instance for sound playback
   * @param eventBus - EventEmitter for subscribing to game events. Can be either:
   *                   - Full AudioEventMap for gameplay sounds (session-scoped)
   *                   - GlobalAudioEventMap for state changes only (persists across sessions)
   */
  constructor(
    audioManager: AudioManager,
    eventBus: EventEmitter<AudioEventMap> | EventEmitter<GlobalAudioEventMap>
  ) {
    this.audioManager = audioManager || null
    this.eventBus = eventBus || null

    // Create bound handlers for cleanup
    this.handlers = {
      weaponFired: this.onWeaponFired.bind(this),
      asteroidDestroyed: this.onAsteroidDestroyed.bind(this),
      powerUpCollected: this.onPowerUpCollected.bind(this),
      shipThrust: this.onShipThrust.bind(this),
      playerDied: this.onPlayerDied.bind(this),
      waveStarted: this.onWaveStarted.bind(this),
      bossSpawned: this.onBossSpawned.bind(this),
      bossDefeated: this.onBossDefeated.bind(this),
      gameStateChanged: this.onGameStateChanged.bind(this)
    }

    // Subscribe to all relevant events
    this.subscribeToEvents()
  }

  /**
   * Subscribe to all game events.
   * Sets up listeners for audio triggers.
   * Note: When using GlobalAudioEventMap, only gameStateChanged is subscribed.
   * Other gameplay events are safely subscribed but won't fire on global emitter.
   */
  private subscribeToEvents(): void {
    if (!this.eventBus) return

    // Cast to full AudioEventMap for subscription - this is safe because:
    // 1. EventEmitter.on() just registers handlers in a Map
    // 2. Events not emitted simply won't trigger their handlers
    // 3. This allows AudioSystem to work with both full and global-only emitters
    const bus = this.eventBus as EventEmitter<AudioEventMap>

    bus.on('weaponFired', this.handlers.weaponFired)
    bus.on('asteroidDestroyed', this.handlers.asteroidDestroyed)
    bus.on('powerUpCollected', this.handlers.powerUpCollected)
    bus.on('shipThrust', this.handlers.shipThrust)
    bus.on('playerDied', this.handlers.playerDied)
    bus.on('waveStarted', this.handlers.waveStarted)
    bus.on('bossSpawned', this.handlers.bossSpawned)
    bus.on('bossDefeated', this.handlers.bossDefeated)
    bus.on('gameStateChanged', this.handlers.gameStateChanged)
  }

  /**
   * Unsubscribe from all game events.
   * Called during cleanup/destroy.
   */
  private unsubscribeFromEvents(): void {
    if (!this.eventBus) return

    // Cast to full AudioEventMap for unsubscription (mirrors subscribeToEvents)
    const bus = this.eventBus as EventEmitter<AudioEventMap>

    bus.off('weaponFired', this.handlers.weaponFired)
    bus.off('asteroidDestroyed', this.handlers.asteroidDestroyed)
    bus.off('powerUpCollected', this.handlers.powerUpCollected)
    bus.off('shipThrust', this.handlers.shipThrust)
    bus.off('playerDied', this.handlers.playerDied)
    bus.off('waveStarted', this.handlers.waveStarted)
    bus.off('bossSpawned', this.handlers.bossSpawned)
    bus.off('bossDefeated', this.handlers.bossDefeated)
    bus.off('gameStateChanged', this.handlers.gameStateChanged)
  }

  /**
   * Handle weapon fired event.
   * Plays shoot sound with optional volume variation by weapon type.
   *
   * @param event - Weapon fired event data
   */
  private onWeaponFired(event: WeaponFiredEventData): void {
    if (this.destroyed || !this.audioManager) return

    // Vary volume slightly based on weapon type
    let volume = 1.0
    if (event.weaponType) {
      switch (event.weaponType) {
        case 'spread':
          volume = 0.9
          break
        case 'laser':
          volume = 0.7
          break
        case 'homing':
          volume = 0.8
          break
        default:
          volume = 1.0
      }
    }

    this.audioManager.playSound('shoot', { volume })
  }

  /**
   * Handle asteroid destroyed event.
   * Plays explosion sound with volume scaled by asteroid size.
   *
   * @param event - Asteroid destroyed event data
   */
  private onAsteroidDestroyed(event: AsteroidDestroyedEventData): void {
    if (this.destroyed || !this.audioManager) return

    // Scale volume based on asteroid size (larger = louder)
    const size = event.size || 'medium'
    const volume = ASTEROID_VOLUME_MULTIPLIERS[size] ?? 0.7

    this.audioManager.playSound('explosion', { volume })
  }

  /**
   * Handle power-up collected event.
   * Plays powerup collection sound.
   *
   * @param _event - Power-up collected event data
   */
  private onPowerUpCollected(_event: PowerUpCollectedEventData): void {
    if (this.destroyed || !this.audioManager) return

    this.audioManager.playSound('powerup', { volume: 1.0 })
  }

  /**
   * Handle ship thrust event.
   * Manages thrust sound loop - plays when active, stops when inactive.
   *
   * @param event - Ship thrust event data
   */
  private onShipThrust(event: ShipThrustEventData): void {
    if (this.destroyed || !this.audioManager) return

    const active = event.active ?? false

    if (active && !this.thrustSoundPlaying) {
      // Start thrust sound loop
      this.audioManager.playSound('thrust', { volume: 1.0 })
      this.thrustSoundPlaying = true
    } else if (!active && this.thrustSoundPlaying) {
      // Stop thrust sound
      this.thrustSoundPlaying = false
      // Note: AudioManager doesn't have a stopSound method,
      // thrust sound naturally ends or is interrupted by next play
    }
  }

  /**
   * Handle player died event.
   * Plays game over sound and stops background music.
   *
   * @param _event - Player died event data
   */
  private onPlayerDied(_event: PlayerDiedEventData): void {
    if (this.destroyed || !this.audioManager) return

    // Stop background music
    this.audioManager.stopMusic()

    // Play game over sound
    this.audioManager.playSound('gameOver', { volume: 1.0 })

    // Reset thrust state
    this.thrustSoundPlaying = false
  }

  /**
   * Handle wave started event.
   * Optional: could play a subtle wave start sound.
   *
   * @param _event - Wave started event data
   */
  private onWaveStarted(_event: WaveStartedEventData): void {
    if (this.destroyed || !this.audioManager) return

    // Wave start sound is optional - not implemented in audioConfig
    // Could add a subtle "ding" or "whoosh" sound here
  }

  /**
   * Handle boss spawned event.
   * Crossfades to boss theme music.
   *
   * @param _event - Boss spawned event data
   */
  private onBossSpawned(_event: BossSpawnedEventData): void {
    if (this.destroyed || !this.audioManager) return

    // Crossfade to boss theme
    this.audioManager.playMusic('music_boss', { volume: 1.0 })
  }

  /**
   * Handle boss defeated event.
   * Crossfades back to background music.
   *
   * @param _event - Boss defeated event data
   */
  private onBossDefeated(_event: BossDefeatedEventData): void {
    if (this.destroyed || !this.audioManager) return

    // Crossfade back to background music
    this.audioManager.playMusic('music_background', { volume: 1.0 })
  }

  /**
   * Handle game state changed event.
   * Manages music based on game flow state.
   *
   * @param data - Game state change data
   */
  private onGameStateChanged(data: { state: GameFlowState }): void {
    if (this.destroyed || !this.audioManager) return

    switch (data.state) {
      case 'mainMenu':
        this.audioManager.playMusic('music_menu', { volume: 1.0 })
        break

      case 'playing':
        // Restore volume if coming from paused
        this.audioManager.setVolume('music', this.previousMusicVolume)
        this.audioManager.playMusic('music_background', { volume: 1.0 })
        break

      case 'paused':
        // Store current volume and lower music
        this.previousMusicVolume = this.audioManager.getVolume('music')
        this.audioManager.setVolume('music', this.previousMusicVolume * PAUSED_VOLUME_MULTIPLIER)
        break

      case 'gameOver':
        this.audioManager.stopMusic()
        break

      case 'loading':
      case 'victory':
        // No music changes for these states
        break
    }
  }

  /**
   * Check if thrust sound is currently playing.
   * Used for testing and state inspection.
   *
   * @returns True if thrust sound is playing
   */
  isThrustSoundPlaying(): boolean {
    return this.thrustSoundPlaying
  }

  /**
   * Update method for continuous sound handling.
   * Called each frame to manage looping sounds and transitions.
   *
   * @param _deltaTime - Time since last frame in milliseconds
   */
  update(_deltaTime: number): void {
    if (this.destroyed) return

    // Handle continuous sounds like thrust loop
    // Currently managed through event handlers
    // Future: could add fade timing and sound cooldowns here
  }

  /**
   * Destroy the AudioSystem.
   * Unsubscribes from all events and stops all sounds.
   */
  destroy(): void {
    this.destroyed = true
    this.unsubscribeFromEvents()

    if (this.audioManager) {
      this.audioManager.stopAllSounds()
      this.audioManager.stopMusic()
    }

    this.thrustSoundPlaying = false
    this.audioManager = null
    this.eventBus = null
  }
}
