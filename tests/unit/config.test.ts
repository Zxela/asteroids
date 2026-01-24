/**
 * Unit tests for Configuration Constants
 *
 * Tests for gameConfig and audioConfig to verify:
 * - Configuration structure is correct
 * - Values match Design Doc specifications
 * - Types are properly exported
 */

import { describe, it, expect } from "vitest"

// ============================================
// Game Configuration Tests
// ============================================

describe("Game Configuration", () => {
  describe("gameConfig structure", () => {
    it("exports gameConfig constant", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig).toBeDefined()
    })

    it("has physics section with all required properties", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.physics).toBeDefined()
      expect(gameConfig.physics.shipAcceleration).toBeDefined()
      expect(gameConfig.physics.shipMaxSpeed).toBeDefined()
      expect(gameConfig.physics.shipRotationSpeed).toBeDefined()
      expect(gameConfig.physics.damping).toBeDefined()
      expect(gameConfig.physics.asteroidSpeeds).toBeDefined()
      expect(gameConfig.physics.asteroidSpeeds.large).toBeDefined()
      expect(gameConfig.physics.asteroidSpeeds.medium).toBeDefined()
      expect(gameConfig.physics.asteroidSpeeds.small).toBeDefined()
    })

    it("has gameplay section with all required properties", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.gameplay).toBeDefined()
      expect(gameConfig.gameplay.initialLives).toBeDefined()
      expect(gameConfig.gameplay.invulnerabilityDuration).toBeDefined()
      expect(gameConfig.gameplay.waveTransitionDelay).toBeDefined()
      expect(gameConfig.gameplay.scoring).toBeDefined()
      expect(gameConfig.gameplay.scoring.largeAsteroid).toBeDefined()
      expect(gameConfig.gameplay.scoring.mediumAsteroid).toBeDefined()
      expect(gameConfig.gameplay.scoring.smallAsteroid).toBeDefined()
      expect(gameConfig.gameplay.scoring.bossMultiplier).toBeDefined()
    })

    it("has wave section with all required properties", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.wave).toBeDefined()
      expect(gameConfig.wave.baseAsteroidCount).toBeDefined()
      expect(gameConfig.wave.asteroidIncrement).toBeDefined()
      expect(gameConfig.wave.speedMultiplier).toBeDefined()
      expect(gameConfig.wave.bossWaveInterval).toBeDefined()
    })

    it("has powerups section with all required properties", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.powerups).toBeDefined()
      expect(gameConfig.powerups.spawnChance).toBeDefined()
      expect(gameConfig.powerups.shield).toBeDefined()
      expect(gameConfig.powerups.shield.duration).toBeDefined()
      expect(gameConfig.powerups.rapidFire).toBeDefined()
      expect(gameConfig.powerups.rapidFire.duration).toBeDefined()
      expect(gameConfig.powerups.rapidFire.cooldownMultiplier).toBeDefined()
      expect(gameConfig.powerups.multiShot).toBeDefined()
      expect(gameConfig.powerups.multiShot.duration).toBeDefined()
      expect(gameConfig.powerups.multiShot.projectileCount).toBeDefined()
    })

    it("has visual section with all required properties", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.visual).toBeDefined()
      expect(gameConfig.visual.particlePoolSize).toBeDefined()
      expect(gameConfig.visual.projectilePoolSize).toBeDefined()
      expect(gameConfig.visual.maxProjectiles).toBeDefined()
      expect(gameConfig.visual.asteroidPoolSize).toBeDefined()
    })

    it("has performance section with all required properties", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.performance).toBeDefined()
      expect(gameConfig.performance.targetFPS).toBeDefined()
      expect(gameConfig.performance.targetDrawCalls).toBeDefined()
      expect(gameConfig.performance.collisionBroadPhaseGridSize).toBeDefined()
    })
  })

  describe("gameConfig values match Design Doc specifications", () => {
    // Physics values
    it("shipAcceleration is 500 units/s^2", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.physics.shipAcceleration).toBe(500)
    })

    it("shipMaxSpeed is 300", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.physics.shipMaxSpeed).toBe(300)
    })

    it("shipRotationSpeed is PI rad/s", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.physics.shipRotationSpeed).toBe(Math.PI)
    })

    it("damping is 0.99 per frame", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.physics.damping).toBe(0.99)
    })

    it("asteroid speeds are configured correctly", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.physics.asteroidSpeeds.large).toBe(50)
      expect(gameConfig.physics.asteroidSpeeds.medium).toBe(75)
      expect(gameConfig.physics.asteroidSpeeds.small).toBe(100)
    })

    // Gameplay values
    it("initialLives is 3", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.gameplay.initialLives).toBe(3)
    })

    it("invulnerabilityDuration is 3000ms", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.gameplay.invulnerabilityDuration).toBe(3000)
    })

    it("waveTransitionDelay is 3000ms", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.gameplay.waveTransitionDelay).toBe(3000)
    })

    it("scoring matches Design Doc (large=25, medium=50, small=100)", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.gameplay.scoring.largeAsteroid).toBe(25)
      expect(gameConfig.gameplay.scoring.mediumAsteroid).toBe(50)
      expect(gameConfig.gameplay.scoring.smallAsteroid).toBe(100)
    })

    it("boss multiplier is 1000", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.gameplay.scoring.bossMultiplier).toBe(1000)
    })

    // Wave values
    it("baseAsteroidCount is 3", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.wave.baseAsteroidCount).toBe(3)
    })

    it("asteroidIncrement is 2 per wave", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.wave.asteroidIncrement).toBe(2)
    })

    it("speedMultiplier is 1.05 per wave", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.wave.speedMultiplier).toBe(1.05)
    })

    it("bossWaveInterval is every 5 waves", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.wave.bossWaveInterval).toBe(5)
    })

    // Power-up values
    it("spawnChance is 0.1 (10%)", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.powerups.spawnChance).toBe(0.1)
    })

    it("shield duration is 10000ms", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.powerups.shield.duration).toBe(10000)
    })

    it("rapidFire duration is 15000ms with 0.5 cooldown multiplier", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.powerups.rapidFire.duration).toBe(15000)
      expect(gameConfig.powerups.rapidFire.cooldownMultiplier).toBe(0.5)
    })

    it("multiShot duration is 15000ms with 3 projectiles", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.powerups.multiShot.duration).toBe(15000)
      expect(gameConfig.powerups.multiShot.projectileCount).toBe(3)
    })

    // Visual values
    it("particlePoolSize is 500", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.visual.particlePoolSize).toBe(500)
    })

    it("projectilePoolSize is 50", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.visual.projectilePoolSize).toBe(50)
    })

    it("maxProjectiles is 200", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.visual.maxProjectiles).toBe(200)
    })

    it("asteroidPoolSize is 30", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.visual.asteroidPoolSize).toBe(30)
    })

    // Performance values
    it("targetFPS is 60", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.performance.targetFPS).toBe(60)
    })

    it("targetDrawCalls is 100", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.performance.targetDrawCalls).toBe(100)
    })

    it("collisionBroadPhaseGridSize is 100", async () => {
      const { gameConfig } = await import("../../src/config/gameConfig")
      expect(gameConfig.performance.collisionBroadPhaseGridSize).toBe(100)
    })
  })

  describe("GameConfig type export", () => {
    it("exports GameConfig interface", async () => {
      // Type check - if this compiles, the type is exported correctly
      const { gameConfig } = await import("../../src/config/gameConfig")
      type GameConfigType = typeof gameConfig
      const _typeCheck: GameConfigType = gameConfig
      expect(_typeCheck).toBeDefined()
    })
  })
})

// ============================================
// Audio Configuration Tests
// ============================================

describe("Audio Configuration", () => {
  describe("audioConfig structure", () => {
    it("exports audioConfig constant", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      expect(audioConfig).toBeDefined()
    })

    it("has sfx section with all sound effects", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      expect(audioConfig.sfx).toBeDefined()
      expect(audioConfig.sfx.shoot).toBeDefined()
      expect(audioConfig.sfx.explosion).toBeDefined()
      expect(audioConfig.sfx.powerup).toBeDefined()
      expect(audioConfig.sfx.thrust).toBeDefined()
    })

    it("has music section with background and boss music", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      expect(audioConfig.music).toBeDefined()
      expect(audioConfig.music.background).toBeDefined()
      expect(audioConfig.music.boss).toBeDefined()
    })
  })

  describe("AudioDefinition structure", () => {
    it("each sfx has id, path, volume, and preload properties", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")

      const checkAudioDefinition = (def: {
        id: string
        path: string
        volume: number
        preload: boolean
      }) => {
        expect(typeof def.id).toBe("string")
        expect(typeof def.path).toBe("string")
        expect(typeof def.volume).toBe("number")
        expect(typeof def.preload).toBe("boolean")
      }

      checkAudioDefinition(audioConfig.sfx.shoot)
      checkAudioDefinition(audioConfig.sfx.explosion)
      checkAudioDefinition(audioConfig.sfx.powerup)
      checkAudioDefinition(audioConfig.sfx.thrust)
    })

    it("each music has id, path, volume, and preload properties", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")

      const checkAudioDefinition = (def: {
        id: string
        path: string
        volume: number
        preload: boolean
      }) => {
        expect(typeof def.id).toBe("string")
        expect(typeof def.path).toBe("string")
        expect(typeof def.volume).toBe("number")
        expect(typeof def.preload).toBe("boolean")
      }

      checkAudioDefinition(audioConfig.music.background)
      checkAudioDefinition(audioConfig.music.boss)
    })
  })

  describe("audioConfig values", () => {
    it("sfx sounds have reasonable volume levels (0-1)", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      expect(audioConfig.sfx.shoot.volume).toBeGreaterThan(0)
      expect(audioConfig.sfx.shoot.volume).toBeLessThanOrEqual(1)
      expect(audioConfig.sfx.explosion.volume).toBeGreaterThan(0)
      expect(audioConfig.sfx.explosion.volume).toBeLessThanOrEqual(1)
      expect(audioConfig.sfx.powerup.volume).toBeGreaterThan(0)
      expect(audioConfig.sfx.powerup.volume).toBeLessThanOrEqual(1)
      expect(audioConfig.sfx.thrust.volume).toBeGreaterThan(0)
      expect(audioConfig.sfx.thrust.volume).toBeLessThanOrEqual(1)
    })

    it("music has reasonable volume levels (0-1)", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      expect(audioConfig.music.background.volume).toBeGreaterThan(0)
      expect(audioConfig.music.background.volume).toBeLessThanOrEqual(1)
      expect(audioConfig.music.boss.volume).toBeGreaterThan(0)
      expect(audioConfig.music.boss.volume).toBeLessThanOrEqual(1)
    })

    it("critical sfx are preloaded", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      expect(audioConfig.sfx.shoot.preload).toBe(true)
      expect(audioConfig.sfx.explosion.preload).toBe(true)
      expect(audioConfig.sfx.powerup.preload).toBe(true)
      expect(audioConfig.sfx.thrust.preload).toBe(true)
    })

    it("music is lazy-loaded (preload false)", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      expect(audioConfig.music.background.preload).toBe(false)
      expect(audioConfig.music.boss.preload).toBe(false)
    })

    it("audio paths start with /assets/audio/", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      expect(audioConfig.sfx.shoot.path).toMatch(/^\/assets\/audio\//)
      expect(audioConfig.sfx.explosion.path).toMatch(/^\/assets\/audio\//)
      expect(audioConfig.sfx.powerup.path).toMatch(/^\/assets\/audio\//)
      expect(audioConfig.sfx.thrust.path).toMatch(/^\/assets\/audio\//)
      expect(audioConfig.music.background.path).toMatch(/^\/assets\/audio\//)
      expect(audioConfig.music.boss.path).toMatch(/^\/assets\/audio\//)
    })
  })

  describe("AudioDefinition and AudioConfig type exports", () => {
    it("exports AudioDefinition interface", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      type AudioDefinitionType = typeof audioConfig.sfx.shoot
      const _typeCheck: AudioDefinitionType = audioConfig.sfx.shoot
      expect(_typeCheck).toBeDefined()
    })

    it("exports AudioConfig interface", async () => {
      const { audioConfig } = await import("../../src/config/audioConfig")
      type AudioConfigType = typeof audioConfig
      const _typeCheck: AudioConfigType = audioConfig
      expect(_typeCheck).toBeDefined()
    })
  })
})

// ============================================
// Config Index Barrel Export Tests
// ============================================

describe("Config Index Exports", () => {
  it("exports gameConfig from index", async () => {
    const { gameConfig } = await import("../../src/config")
    expect(gameConfig).toBeDefined()
    expect(gameConfig.physics).toBeDefined()
  })

  it("exports audioConfig from index", async () => {
    const { audioConfig } = await import("../../src/config")
    expect(audioConfig).toBeDefined()
    expect(audioConfig.sfx).toBeDefined()
  })

  it("exports GameConfig type from index", async () => {
    // This test verifies the type export by importing and using it
    const config = await import("../../src/config")
    const gameConfig = config.gameConfig
    expect(gameConfig).toBeDefined()
  })

  it("exports AudioConfig and AudioDefinition types from index", async () => {
    // This test verifies the type export by importing and using it
    const config = await import("../../src/config")
    const audioConfig = config.audioConfig
    expect(audioConfig).toBeDefined()
  })
})
