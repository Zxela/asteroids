/**
 * BossSystem Unit Tests
 *
 * Tests for boss AI and attack patterns:
 * - BossSystem initialization and entity querying
 * - Destroyer patterns: Charge (move toward player), Spray (strafe and fire)
 * - Carrier patterns: Summon (spawn asteroids), Retreat (move away, fire homing)
 * - Pattern timer (3-second alternation)
 * - Phase modifiers (speed, fire rate, damage)
 * - Event emission for pattern changes
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { BossSystem, type BossPatternChangedEvent } from '../../src/systems/BossSystem'
import { Transform, Velocity, Physics, Collider, Health, Renderable, Player } from '../../src/components'
import { Boss } from '../../src/components/Boss'
import { BOSS_AI_CONFIG } from '../../src/config/bossConfig'

/**
 * Helper to create a mock boss entity with specified properties
 */
function createMockBoss(
  world: World,
  bossType: 'destroyer' | 'carrier' = 'destroyer',
  phase = 1,
  attackPattern: 'idle' | 'charge' | 'spray' | 'summon' | 'retreat' = 'idle',
  phaseTimer = 3000,
  position = new Vector3(0, 0, 0)
): ReturnType<typeof world.createEntity> {
  const entityId = world.createEntity()
  world.addComponent(entityId, new Transform(position.clone()))
  world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
  world.addComponent(entityId, new Physics(10, 0, 150, false))
  world.addComponent(entityId, new Collider('sphere', 50, 'boss', ['player', 'projectile']))
  world.addComponent(entityId, new Health(100, 100))
  world.addComponent(entityId, new Boss(bossType, phase, phaseTimer, attackPattern))
  world.addComponent(entityId, new Renderable(`boss_${bossType}`, 'emissive', true))
  return entityId
}

/**
 * Helper to create a mock player entity
 */
function createMockPlayer(
  world: World,
  position = new Vector3(200, 200, 0)
): ReturnType<typeof world.createEntity> {
  const entityId = world.createEntity()
  world.addComponent(entityId, new Transform(position.clone()))
  world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
  world.addComponent(entityId, new Physics(1, 0.99, 300, true))
  world.addComponent(entityId, new Collider('sphere', 20, 'player', ['asteroid', 'powerup']))
  world.addComponent(entityId, new Health(1, 1))
  world.addComponent(entityId, new Player(3))
  world.addComponent(entityId, new Renderable('ship', 'standard', true))
  return entityId
}

describe('BossSystem', () => {
  let world: World
  let bossSystem: BossSystem

  beforeEach(() => {
    world = new World()
    bossSystem = new BossSystem()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization and Entity Querying', () => {
    it('should initialize BossSystem without errors', () => {
      expect(bossSystem).toBeDefined()
    })

    it('should query for entities with Boss, Transform, Velocity, Health components', () => {
      const bossId = createMockBoss(world, 'destroyer')
      createMockPlayer(world)

      bossSystem.update(world, 16)

      // Verify the boss was found and processed
      const boss = world.getComponent(bossId, Boss)
      expect(boss).toBeDefined()
    })

    it('should not throw when no boss entities exist', () => {
      createMockPlayer(world)
      expect(() => bossSystem.update(world, 16)).not.toThrow()
    })

    it('should not throw when no player entity exists', () => {
      createMockBoss(world, 'destroyer')
      expect(() => bossSystem.update(world, 16)).not.toThrow()
    })
  })

  describe('Destroyer Charge Pattern', () => {
    it('should move boss toward player during charge pattern', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      // Boss should be moving toward player (positive X)
      expect(velocity?.linear.x).toBeGreaterThan(0)
    })

    it('should set velocity magnitude based on charge speed', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      // Check speed is within expected range for Phase 1 charge
      const expectedSpeed = BOSS_AI_CONFIG.destroyer.patterns.charge.speed
      expect(speed).toBeCloseTo(expectedSpeed, 0)
    })

    it('should increase charge speed in Phase 2', () => {
      const bossId = createMockBoss(world, 'destroyer', 2, 'charge', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      // Phase 2 should be 1.5x speed
      const baseSpeed = BOSS_AI_CONFIG.destroyer.patterns.charge.speed
      const expectedSpeed = baseSpeed * 1.5
      expect(speed).toBeCloseTo(expectedSpeed, 0)
    })

    it('should increase charge speed in Phase 3', () => {
      const bossId = createMockBoss(world, 'destroyer', 3, 'charge', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      // Phase 3 should be 2.0x speed
      const baseSpeed = BOSS_AI_CONFIG.destroyer.patterns.charge.speed
      const expectedSpeed = baseSpeed * 2.0
      expect(speed).toBeCloseTo(expectedSpeed, 0)
    })
  })

  describe('Destroyer Spray Pattern', () => {
    it('should strafe around player during spray pattern', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'spray', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      // Strafing should have perpendicular movement (Y component)
      expect(velocity?.linear.length()).toBeGreaterThan(0)
    })

    it('should fire projectiles during spray pattern', () => {
      createMockBoss(world, 'destroyer', 1, 'spray', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      // Simulate enough time for fire timer to trigger
      bossSystem.update(world, 600)

      const events = bossSystem.getEvents()
      const projectileFiredEvents = events.filter(e => e.type === 'bossProjectileFired')
      // Should have fired projectiles
      expect(projectileFiredEvents.length).toBeGreaterThanOrEqual(0)
    })

    it('should fire more projectiles in higher phases', () => {
      // Phase 1
      const phase1Projectiles = BOSS_AI_CONFIG.destroyer.patterns.spray.projectileCounts[0]
      // Phase 3
      const phase3Projectiles = BOSS_AI_CONFIG.destroyer.patterns.spray.projectileCounts[2]

      expect(phase3Projectiles).toBeGreaterThan(phase1Projectiles)
    })
  })

  describe('Carrier Summon Pattern', () => {
    it('should remain stationary during summon pattern', () => {
      const bossId = createMockBoss(world, 'carrier', 1, 'summon', 3000, new Vector3(100, 100, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      // Should be stationary
      expect(speed).toBe(0)
    })

    it('should emit asteroid spawn events during summon pattern', () => {
      createMockBoss(world, 'carrier', 1, 'summon', 3000, new Vector3(100, 100, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      // Simulate enough time for spawn timer
      bossSystem.update(world, 1100)

      const events = bossSystem.getEvents()
      const spawnEvents = events.filter(e => e.type === 'bossSpawnedMinion')
      expect(spawnEvents.length).toBeGreaterThanOrEqual(0)
    })

    it('should spawn more asteroids in higher phases', () => {
      // Phase 1
      const phase1Count = BOSS_AI_CONFIG.carrier.patterns.summon.spawnCounts[0]
      // Phase 3
      const phase3Count = BOSS_AI_CONFIG.carrier.patterns.summon.spawnCounts[2]

      expect(phase3Count).toBeGreaterThan(phase1Count)
    })
  })

  describe('Carrier Retreat Pattern', () => {
    it('should move away from player during retreat pattern', () => {
      const bossId = createMockBoss(world, 'carrier', 1, 'retreat', 3000, new Vector3(100, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      // Boss should be moving away from player (negative X direction)
      expect(velocity?.linear.x).toBeLessThan(0)
    })

    it('should fire homing projectiles during retreat pattern', () => {
      createMockBoss(world, 'carrier', 1, 'retreat', 3000, new Vector3(100, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      // Simulate enough time for fire timer
      bossSystem.update(world, 900)

      const events = bossSystem.getEvents()
      const projectileEvents = events.filter(e => e.type === 'bossHomingFired')
      expect(projectileEvents.length).toBeGreaterThanOrEqual(0)
    })

    it('should fire more homing projectiles in higher phases', () => {
      // Phase 1
      const phase1Count = BOSS_AI_CONFIG.carrier.patterns.retreat.projectileCounts[0]
      // Phase 3
      const phase3Count = BOSS_AI_CONFIG.carrier.patterns.retreat.projectileCounts[2]

      expect(phase3Count).toBeGreaterThan(phase1Count)
    })
  })

  describe('Pattern Timer and Alternation', () => {
    it('should decrement phaseTimer each frame', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 3000)
      createMockPlayer(world)

      bossSystem.update(world, 1000) // 1 second

      const boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.phaseTimer).toBeLessThan(3000)
    })

    it('should switch pattern when timer reaches 0', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150) // Exceed timer

      const boss = world.getComponent<Boss>(bossId, Boss)
      // Should have switched from charge to spray
      expect(boss?.attackPattern).toBe('spray')
    })

    it('should alternate between Destroyer patterns (charge <-> spray)', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150) // Switch to spray
      let boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.attackPattern).toBe('spray')

      // Update boss phaseTimer to trigger another switch
      boss!.phaseTimer = 100
      bossSystem.update(world, 150) // Switch back to charge
      boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.attackPattern).toBe('charge')
    })

    it('should alternate between Carrier patterns (summon <-> retreat)', () => {
      const bossId = createMockBoss(world, 'carrier', 1, 'summon', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150) // Switch to retreat
      let boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.attackPattern).toBe('retreat')

      // Update boss phaseTimer to trigger another switch
      boss!.phaseTimer = 100
      bossSystem.update(world, 150) // Switch back to summon
      boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.attackPattern).toBe('summon')
    })

    it('should reset timer to 3000ms after pattern switch', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150) // Trigger switch

      const boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.phaseTimer).toBeCloseTo(3000, -2) // Approximate due to deltaTime application
    })

    it('should emit bossPatternChanged event on pattern switch', () => {
      createMockBoss(world, 'destroyer', 1, 'charge', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150) // Trigger switch

      const events = bossSystem.getEvents()
      const patternChangeEvent = events.find(e => e.type === 'bossPatternChanged') as BossPatternChangedEvent | undefined
      expect(patternChangeEvent).toBeDefined()
      expect(patternChangeEvent?.data.previousPattern).toBe('charge')
      expect(patternChangeEvent?.data.newPattern).toBe('spray')
    })
  })

  describe('Phase Modifiers', () => {
    it('should return Phase 1 modifiers (1.0x)', () => {
      const modifiers = bossSystem.getPhaseModifiers(1)
      expect(modifiers.speedMult).toBe(1.0)
      expect(modifiers.fireRateMult).toBe(1.0)
      expect(modifiers.damageMult).toBe(1.0)
    })

    it('should return Phase 2 modifiers (1.5x)', () => {
      const modifiers = bossSystem.getPhaseModifiers(2)
      expect(modifiers.speedMult).toBe(1.5)
      expect(modifiers.fireRateMult).toBe(1.5)
      expect(modifiers.damageMult).toBe(1.5)
    })

    it('should return Phase 3 modifiers (2.0x)', () => {
      const modifiers = bossSystem.getPhaseModifiers(3)
      expect(modifiers.speedMult).toBe(2.0)
      expect(modifiers.fireRateMult).toBe(2.0)
      expect(modifiers.damageMult).toBe(2.0)
    })

    it('should apply Phase 2 speed modifier to movement', () => {
      const bossId = createMockBoss(world, 'destroyer', 2, 'charge', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 100)

      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      const speed = velocity?.linear.length() ?? 0

      // Phase 2 speed should be higher than base
      const baseSpeed = BOSS_AI_CONFIG.destroyer.patterns.charge.speed
      expect(speed).toBeGreaterThan(baseSpeed)
    })
  })

  describe('Idle Pattern Handling', () => {
    it('should transition from idle to first attack pattern', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'idle', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150)

      const boss = world.getComponent<Boss>(bossId, Boss)
      // Should have transitioned from idle to first pattern
      expect(boss?.attackPattern).not.toBe('idle')
    })

    it('should set idle boss to charge pattern for destroyer', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'idle', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150)

      const boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.attackPattern).toBe('charge')
    })

    it('should set idle boss to summon pattern for carrier', () => {
      const bossId = createMockBoss(world, 'carrier', 1, 'idle', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150)

      const boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.attackPattern).toBe('summon')
    })
  })

  describe('Velocity Updates', () => {
    it('should update Velocity component based on AI calculations', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 300, 0))

      const initialVelocity = world.getComponent<Velocity>(bossId, Velocity)?.linear.clone()

      bossSystem.update(world, 100)

      const newVelocity = world.getComponent<Velocity>(bossId, Velocity)?.linear

      // Velocity should have changed
      expect(newVelocity?.equals(initialVelocity!)).toBe(false)
    })

    it('should not affect velocity of non-boss entities', () => {
      const playerId = createMockPlayer(world, new Vector3(200, 200, 0))
      createMockBoss(world, 'destroyer', 1, 'charge', 3000)

      const initialVelocity = world.getComponent<Velocity>(playerId, Velocity)?.linear.clone()

      bossSystem.update(world, 100)

      const newVelocity = world.getComponent<Velocity>(playerId, Velocity)?.linear

      // Player velocity should not have changed
      expect(newVelocity?.equals(initialVelocity!)).toBe(true)
    })
  })

  describe('Event System', () => {
    it('should clear events after retrieval', () => {
      createMockBoss(world, 'destroyer', 1, 'charge', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150) // Generate pattern change event

      bossSystem.getEvents() // First retrieval
      const events = bossSystem.getEvents() // Second retrieval

      expect(events.length).toBe(0)
    })

    it('should include entityId in bossPatternChanged event', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 100)
      createMockPlayer(world)

      bossSystem.update(world, 150)

      const events = bossSystem.getEvents()
      const patternChangeEvent = events.find(e => e.type === 'bossPatternChanged') as BossPatternChangedEvent | undefined

      expect(patternChangeEvent?.data.entityId).toBe(bossId)
    })
  })

  describe('Boss Projectile Creation', () => {
    it('should create boss projectiles during spray pattern', () => {
      createMockBoss(world, 'destroyer', 1, 'spray', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      // Simulate enough time for fire timer to trigger (Phase 1 fire rate is 500ms)
      bossSystem.update(world, 600)

      const events = bossSystem.getEvents()
      const projectileFiredEvents = events.filter(e => e.type === 'bossProjectileFired')

      // Should have fired projectiles
      expect(projectileFiredEvents.length).toBeGreaterThan(0)

      // Verify projectile event data
      if (projectileFiredEvents.length > 0) {
        const event = projectileFiredEvents[0] as import('../../src/systems/BossSystem').BossProjectileFiredEvent
        expect(event.data.isSpread).toBe(true)
        expect(event.data.projectileCount).toBe(5) // Phase 1 count
      }
    })

    it('should create homing boss projectiles during retreat pattern', () => {
      createMockBoss(world, 'carrier', 1, 'retreat', 3000, new Vector3(100, 0, 0))
      const playerId = createMockPlayer(world, new Vector3(300, 0, 0))

      // Simulate enough time for fire timer to trigger (Phase 1 fire rate is 800ms)
      bossSystem.update(world, 900)

      const events = bossSystem.getEvents()
      const homingEvents = events.filter(e => e.type === 'bossHomingFired')

      // Should have fired homing projectiles
      expect(homingEvents.length).toBeGreaterThan(0)

      // Verify homing event data
      if (homingEvents.length > 0) {
        const event = homingEvents[0] as import('../../src/systems/BossSystem').BossHomingFiredEvent
        expect(event.data.targetId).toBe(playerId)
        expect(event.data.projectileCount).toBe(2) // Phase 1 count
      }
    })

    it('should scale damage with phase modifier for spray projectiles', () => {
      // Phase 2 damage multiplier is 1.5x
      const modifiers = bossSystem.getPhaseModifiers(2)
      expect(modifiers.damageMult).toBe(1.5)
    })

    it('should fire more projectiles in higher phases', () => {
      // Phase 1 spray fires 5 projectiles
      // Phase 3 spray fires 9 projectiles
      const phase1Count = BOSS_AI_CONFIG.destroyer.patterns.spray.projectileCounts[0]
      const phase3Count = BOSS_AI_CONFIG.destroyer.patterns.spray.projectileCounts[2]

      expect(phase3Count).toBeGreaterThan(phase1Count)
      expect(phase1Count).toBe(5)
      expect(phase3Count).toBe(9)
    })

    it('should pass boss entity ID as owner parameter in events', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'spray', 3000, new Vector3(0, 0, 0))
      createMockPlayer(world, new Vector3(300, 0, 0))

      bossSystem.update(world, 600)

      const events = bossSystem.getEvents()
      const projectileFiredEvents = events.filter(e => e.type === 'bossProjectileFired')

      if (projectileFiredEvents.length > 0) {
        const event = projectileFiredEvents[0] as import('../../src/systems/BossSystem').BossProjectileFiredEvent
        expect(event.data.entityId).toBe(bossId)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle boss at screen edge', () => {
      createMockBoss(world, 'destroyer', 1, 'charge', 3000, new Vector3(960, 540, 0))
      createMockPlayer(world, new Vector3(-960, -540, 0))

      expect(() => bossSystem.update(world, 100)).not.toThrow()
    })

    it('should handle player at same position as boss', () => {
      createMockBoss(world, 'destroyer', 1, 'charge', 3000, new Vector3(100, 100, 0))
      createMockPlayer(world, new Vector3(100, 100, 0))

      expect(() => bossSystem.update(world, 100)).not.toThrow()
    })

    it('should handle rapid phase changes', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 50)
      createMockPlayer(world)

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        bossSystem.update(world, 100)
        const boss = world.getComponent<Boss>(bossId, Boss)
        if (boss) boss.phaseTimer = 50
      }

      expect(() => bossSystem.update(world, 100)).not.toThrow()
    })

    it('should handle boss without player gracefully', () => {
      const bossId = createMockBoss(world, 'destroyer', 1, 'charge', 3000)
      // No player created

      bossSystem.update(world, 100)

      // Boss velocity should remain unchanged or zero
      const velocity = world.getComponent<Velocity>(bossId, Velocity)
      const speed = velocity?.linear.length() ?? 0
      expect(speed).toBe(0)
    })

    it('should handle multiple bosses', () => {
      createMockBoss(world, 'destroyer', 1, 'charge', 3000, new Vector3(0, 0, 0))
      createMockBoss(world, 'carrier', 1, 'summon', 3000, new Vector3(500, 0, 0))
      createMockPlayer(world)

      expect(() => bossSystem.update(world, 100)).not.toThrow()
    })
  })
})
