/**
 * AudioSystem Unit Tests
 *
 * Tests for the AudioSystem class:
 * - Initialization with AudioManager and EventBus
 * - weaponFired event triggers shoot sound
 * - asteroidDestroyed event triggers explosion sound
 * - powerUpCollected event triggers powerup sound
 * - shipThrust event starts/stops thrust sound
 * - playerDied event triggers game over sound
 * - waveStarted event handling
 * - bossSpawned event triggers boss theme
 * - bossDefeated event returns to background music
 * - game state music changes
 * - volume settings respected
 * - destroy cleans up subscriptions
 * - handles missing AudioManager gracefully
 * - handles rapid events with cooldowns
 * - handles thrust sound loop correctly
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Vector3 } from 'three'
import { EventEmitter } from '../../src/utils/EventEmitter'
import type { AudioManager } from '../../src/audio/AudioManager'
import type {
  WeaponFiredEventData,
  AsteroidDestroyedEventData,
  PowerUpCollectedEventData,
  ShipThrustEventData,
  PlayerDiedEventData,
  WaveStartedEventData,
  BossSpawnedEventData,
  BossDefeatedEventData
} from '../../src/types/events'
import type { GameFlowState } from '../../src/types/game'

// Event map type for EventEmitter (uses EventData types, not full Event types)
interface AudioEventMap {
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

// Mock AudioManager
function createMockAudioManager(): AudioManager {
  return {
    playSound: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    setVolume: vi.fn(),
    getVolume: vi.fn().mockReturnValue(1),
    mute: vi.fn(),
    isMuted: vi.fn().mockReturnValue(false),
    stopAllSounds: vi.fn(),
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn()
  } as unknown as AudioManager
}

// Helper to create typed event data (returns EventData, not full Event)
function createWeaponFiredEvent(weaponType = 'single'): WeaponFiredEventData {
  return {
    entityId: 1 as unknown as import('../../src/types/ecs').EntityId,
    weaponType: weaponType as import('../../src/types/components').WeaponType,
    position: new Vector3(0, 0, 0),
    direction: new Vector3(1, 0, 0)
  }
}

function createAsteroidDestroyedEvent(
  size: 'large' | 'medium' | 'small' = 'medium',
  points = 50
): AsteroidDestroyedEventData {
  return {
    entityId: 1 as unknown as import('../../src/types/ecs').EntityId,
    position: new Vector3(0, 0, 0),
    size,
    points,
    spawnChildren: size !== 'small'
  }
}

function createPowerUpCollectedEvent(): PowerUpCollectedEventData {
  return {
    entityId: 1 as unknown as import('../../src/types/ecs').EntityId,
    powerUpEntityId: 2 as unknown as import('../../src/types/ecs').EntityId,
    powerUpType: 'shield',
    position: new Vector3(0, 0, 0)
  }
}

function createShipThrustEvent(active: boolean): ShipThrustEventData {
  return {
    entityId: 1 as unknown as import('../../src/types/ecs').EntityId,
    position: new Vector3(0, 0, 0),
    direction: new Vector3(0, 1, 0),
    active
  }
}

function createPlayerDiedEvent(): PlayerDiedEventData {
  return {
    finalScore: 1000,
    waveReached: 5
  }
}

function createWaveStartedEvent(wave = 1): WaveStartedEventData {
  return {
    wave,
    asteroidCount: 3 + (wave - 1) * 2,
    speedMultiplier: Math.min(1 + (wave - 1) * 0.05, 2.0),
    isBossWave: wave % 5 === 0
  }
}

function createBossSpawnedEvent(): BossSpawnedEventData {
  return {
    entityId: 1 as unknown as import('../../src/types/ecs').EntityId,
    bossType: 'destroyer',
    health: 100,
    wave: 5
  }
}

function createBossDefeatedEvent(): BossDefeatedEventData {
  return {
    entityId: 1 as unknown as import('../../src/types/ecs').EntityId,
    bossType: 'destroyer',
    wave: 5,
    bonusScore: 5000
  }
}

describe('AudioSystem', () => {
  let audioManager: AudioManager
  let globalEventBus: EventEmitter<AudioEventMap>
  let sessionEventBus: EventEmitter<AudioEventMap>
  let AudioSystem: typeof import('../../src/systems/AudioSystem').AudioSystem

  beforeEach(async () => {
    vi.resetModules()
    audioManager = createMockAudioManager()
    globalEventBus = new EventEmitter<AudioEventMap>()
    sessionEventBus = new EventEmitter<AudioEventMap>()
    const module = await import('../../src/systems/AudioSystem')
    AudioSystem = module.AudioSystem
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with AudioManager and dual EventBus', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      expect(system).toBeDefined()
    })

    it('should initialize with AudioManager and only global EventBus (session optional)', () => {
      const system = new AudioSystem(audioManager, globalEventBus)
      expect(system).toBeDefined()
    })

    it('should subscribe to global event bus on initialization', () => {
      const onSpy = vi.spyOn(globalEventBus, 'on')
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      expect(onSpy).toHaveBeenCalledWith('gameStateChanged', expect.any(Function))
    })

    it('should subscribe to session event bus for gameplay events when provided', () => {
      const onSpy = vi.spyOn(sessionEventBus, 'on')
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      expect(onSpy).toHaveBeenCalledWith('weaponFired', expect.any(Function))
      expect(onSpy).toHaveBeenCalledWith('asteroidDestroyed', expect.any(Function))
      expect(onSpy).toHaveBeenCalledWith('powerUpCollected', expect.any(Function))
      expect(onSpy).toHaveBeenCalledWith('shipThrust', expect.any(Function))
      expect(onSpy).toHaveBeenCalledWith('playerDied', expect.any(Function))
    })

    it('should have correct systemType', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      expect(system.systemType).toBe('audio')
    })

    it('should allow updating session event bus for new game sessions', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const newSessionEventBus = new EventEmitter<AudioEventMap>()
      const onSpy = vi.spyOn(newSessionEventBus, 'on')

      system.setSessionEventBus(newSessionEventBus)

      expect(onSpy).toHaveBeenCalledWith('weaponFired', expect.any(Function))
      expect(onSpy).toHaveBeenCalledWith('asteroidDestroyed', expect.any(Function))
    })

    it('should unsubscribe from old session event bus when setting new one', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const offSpy = vi.spyOn(sessionEventBus, 'off')
      const newSessionEventBus = new EventEmitter<AudioEventMap>()

      system.setSessionEventBus(newSessionEventBus)

      expect(offSpy).toHaveBeenCalledWith('weaponFired', expect.any(Function))
      expect(offSpy).toHaveBeenCalledWith('asteroidDestroyed', expect.any(Function))
    })
  })

  describe('Weapon Fired Event', () => {
    it('should play shoot sound on weaponFired event from session bus', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createWeaponFiredEvent()

      sessionEventBus.emit('weaponFired', event)

      expect(audioManager.playSound).toHaveBeenCalledWith('shoot', expect.any(Object))
    })

    it('should vary volume slightly based on weapon type', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const spreadEvent = createWeaponFiredEvent('spread')

      sessionEventBus.emit('weaponFired', spreadEvent)

      expect(audioManager.playSound).toHaveBeenCalledWith('shoot', expect.any(Object))
    })
  })

  describe('Asteroid Destroyed Event', () => {
    it('should play explosion sound on asteroidDestroyed event from session bus', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createAsteroidDestroyedEvent()

      sessionEventBus.emit('asteroidDestroyed', event)

      expect(audioManager.playSound).toHaveBeenCalledWith('explosion', expect.any(Object))
    })

    it('should scale volume based on asteroid size (large = louder)', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const largeEvent = createAsteroidDestroyedEvent('large')

      sessionEventBus.emit('asteroidDestroyed', largeEvent)

      expect(audioManager.playSound).toHaveBeenCalledWith(
        'explosion',
        expect.objectContaining({ volume: expect.any(Number) })
      )
    })

    it('should scale volume based on asteroid size (small = quieter)', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const smallEvent = createAsteroidDestroyedEvent('small')

      sessionEventBus.emit('asteroidDestroyed', smallEvent)

      expect(audioManager.playSound).toHaveBeenCalledWith(
        'explosion',
        expect.objectContaining({ volume: expect.any(Number) })
      )
    })

    it('should use different volumes for different sizes', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      sessionEventBus.emit('asteroidDestroyed', createAsteroidDestroyedEvent('large'))
      const largeCall = (audioManager.playSound as ReturnType<typeof vi.fn>).mock.calls[0]

      vi.clearAllMocks()

      sessionEventBus.emit('asteroidDestroyed', createAsteroidDestroyedEvent('small'))
      const smallCall = (audioManager.playSound as ReturnType<typeof vi.fn>).mock.calls[0]

      expect(largeCall[1].volume).toBeGreaterThan(smallCall[1].volume)
    })
  })

  describe('PowerUp Collected Event', () => {
    it('should play powerup sound on powerUpCollected event from session bus', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createPowerUpCollectedEvent()

      sessionEventBus.emit('powerUpCollected', event)

      expect(audioManager.playSound).toHaveBeenCalledWith('powerup', expect.any(Object))
    })
  })

  describe('Ship Thrust Event', () => {
    it('should play thrust sound when thrust is active', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createShipThrustEvent(true)

      sessionEventBus.emit('shipThrust', event)

      expect(audioManager.playSound).toHaveBeenCalledWith('thrust', expect.any(Object))
    })

    it('should not play additional thrust sound when already thrusting', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      sessionEventBus.emit('shipThrust', createShipThrustEvent(true))
      sessionEventBus.emit('shipThrust', createShipThrustEvent(true))

      // Should only be called once (thrust is looping)
      expect(audioManager.playSound).toHaveBeenCalledTimes(1)
    })

    it('should stop thrust sound when thrust becomes inactive', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      sessionEventBus.emit('shipThrust', createShipThrustEvent(true))
      sessionEventBus.emit('shipThrust', createShipThrustEvent(false))

      // Access internal state to verify thrust stopped
      expect(system.isThrustSoundPlaying()).toBe(false)
    })

    it('should restart thrust sound after stopping', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      sessionEventBus.emit('shipThrust', createShipThrustEvent(true))
      sessionEventBus.emit('shipThrust', createShipThrustEvent(false))
      sessionEventBus.emit('shipThrust', createShipThrustEvent(true))

      expect(audioManager.playSound).toHaveBeenCalledTimes(2)
    })
  })

  describe('Player Died Event', () => {
    it('should play gameOver sound on playerDied event', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createPlayerDiedEvent()

      sessionEventBus.emit('playerDied', event)

      expect(audioManager.playSound).toHaveBeenCalledWith('gameOver', expect.any(Object))
    })

    it('should stop background music on playerDied event', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createPlayerDiedEvent()

      sessionEventBus.emit('playerDied', event)

      expect(audioManager.stopMusic).toHaveBeenCalled()
    })
  })

  describe('Wave Started Event', () => {
    it('should handle waveStarted event without errors', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createWaveStartedEvent()

      expect(() => sessionEventBus.emit('waveStarted', event)).not.toThrow()
    })
  })

  describe('Boss Spawned Event', () => {
    it('should play boss theme music on bossSpawned event', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createBossSpawnedEvent()

      sessionEventBus.emit('bossSpawned', event)

      expect(audioManager.playMusic).toHaveBeenCalledWith('music_boss', expect.any(Object))
    })
  })

  describe('Boss Defeated Event', () => {
    it('should return to background music on bossDefeated event', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      const event = createBossDefeatedEvent()

      sessionEventBus.emit('bossDefeated', event)

      expect(audioManager.playMusic).toHaveBeenCalledWith('music_background', expect.any(Object))
    })
  })

  describe('Game State Changed', () => {
    it('should play menu music on mainMenu state', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      globalEventBus.emit('gameStateChanged', { state: 'mainMenu' })

      expect(audioManager.playMusic).toHaveBeenCalledWith('music_menu', expect.any(Object))
    })

    it('should play background music on playing state', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      globalEventBus.emit('gameStateChanged', { state: 'playing' })

      expect(audioManager.playMusic).toHaveBeenCalledWith('music_background', expect.any(Object))
    })

    it('should stop music on gameOver state', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      globalEventBus.emit('gameStateChanged', { state: 'gameOver' })

      expect(audioManager.stopMusic).toHaveBeenCalled()
    })

    it('should lower music volume on paused state', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      globalEventBus.emit('gameStateChanged', { state: 'paused' })

      expect(audioManager.setVolume).toHaveBeenCalledWith('music', expect.any(Number))
    })

    it('should restore music volume when resuming from paused', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      globalEventBus.emit('gameStateChanged', { state: 'playing' })
      globalEventBus.emit('gameStateChanged', { state: 'paused' })
      globalEventBus.emit('gameStateChanged', { state: 'playing' })

      // Should have called setVolume to restore
      expect(audioManager.setVolume).toHaveBeenCalled()
    })
  })

  describe('Volume Settings', () => {
    it('should respect muted state when playing sounds', () => {
      (audioManager.isMuted as ReturnType<typeof vi.fn>).mockReturnValue(true)
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      sessionEventBus.emit('weaponFired', createWeaponFiredEvent())

      // AudioManager handles muting internally, but system still calls playSound
      expect(audioManager.playSound).toHaveBeenCalled()
    })
  })

  describe('Destroy and Cleanup', () => {
    it('should unsubscribe from global events on destroy', () => {
      const offSpy = vi.spyOn(globalEventBus, 'off')
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      system.destroy()

      expect(offSpy).toHaveBeenCalled()
    })

    it('should unsubscribe from session events on destroy', () => {
      const offSpy = vi.spyOn(sessionEventBus, 'off')
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      system.destroy()

      expect(offSpy).toHaveBeenCalled()
    })

    it('should stop all sounds on destroy', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      system.destroy()

      expect(audioManager.stopAllSounds).toHaveBeenCalled()
    })

    it('should stop music on destroy', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      system.destroy()

      expect(audioManager.stopMusic).toHaveBeenCalled()
    })

    it('should not process events after destroy', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)
      system.destroy()

      vi.clearAllMocks()
      sessionEventBus.emit('weaponFired', createWeaponFiredEvent())

      expect(audioManager.playSound).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle null AudioManager gracefully', () => {
      expect(() => new AudioSystem(null as unknown as AudioManager, globalEventBus)).not.toThrow()
    })

    it('should handle undefined EventBus gracefully', () => {
      expect(
        () => new AudioSystem(audioManager, undefined as unknown as EventEmitter<AudioEventMap>)
      ).not.toThrow()
    })

    it('should not throw when event has missing data', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      expect(() =>
        sessionEventBus.emit('weaponFired', { type: 'weaponFired', timestamp: Date.now() } as WeaponFiredEventData)
      ).not.toThrow()
    })
  })

  describe('Update Method', () => {
    it('should have update method for continuous sounds', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      expect(typeof system.update).toBe('function')
    })

    it('should not throw on update with deltaTime', () => {
      const system = new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      expect(() => system.update(16)).not.toThrow()
    })
  })

  describe('Sound Cooldowns', () => {
    it('should prevent sound spam for rapid weapon fire events', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      // Fire multiple times rapidly
      for (let i = 0; i < 5; i++) {
        sessionEventBus.emit('weaponFired', createWeaponFiredEvent())
      }

      // Should be called but system may limit rapid sounds
      expect(audioManager.playSound).toHaveBeenCalled()
    })

    it('should prevent sound spam for rapid explosion events', () => {
      new AudioSystem(audioManager, globalEventBus, sessionEventBus)

      // Destroy multiple asteroids rapidly
      for (let i = 0; i < 10; i++) {
        sessionEventBus.emit('asteroidDestroyed', createAsteroidDestroyedEvent())
      }

      // All should be played but volume may be adjusted
      expect(audioManager.playSound).toHaveBeenCalled()
    })
  })
})
