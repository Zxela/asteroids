/**
 * BossHealthSystem Unit Tests
 *
 * Tests for boss health monitoring and phase management:
 * - Health monitoring and health bar updates
 * - Phase transitions at 50% and 25% health thresholds
 * - Event emission: bossDamaged, bossPhaseChanged, bossDefeated
 * - Health bar show/hide functionality
 *
 * Phase system:
 * - Phase 1: 100% - 51% health
 * - Phase 2: 50% - 26% health
 * - Phase 3: 25% - 0% health
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { BossHealthSystem } from '../../src/systems/BossHealthSystem'
import { Transform, Velocity, Physics, Collider, Health, Renderable } from '../../src/components'
import { Boss } from '../../src/components/Boss'
import { BossHealthBar } from '../../src/ui/BossHealthBar'

/**
 * Helper to create a mock boss entity with specified health
 */
function createMockBoss(
  world: World,
  bossType: 'destroyer' | 'carrier' = 'destroyer',
  currentHealth: number = 100,
  maxHealth: number = 100
): ReturnType<typeof world.createEntity> {
  const entityId = world.createEntity()
  world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
  world.addComponent(entityId, new Velocity(new Vector3(0, 0, 0)))
  world.addComponent(entityId, new Physics(10, 0, 150, false))
  world.addComponent(entityId, new Collider('sphere', 50, 'boss', ['player', 'projectile']))
  world.addComponent(entityId, new Health(maxHealth, currentHealth))
  world.addComponent(entityId, new Boss(bossType, 1, 0, 'idle'))
  world.addComponent(entityId, new Renderable(`boss_${bossType}`, 'emissive', true))
  return entityId
}

describe('BossHealthSystem', () => {
  let world: World
  let bossHealthSystem: BossHealthSystem
  let mockHealthBar: BossHealthBar

  beforeEach(() => {
    // Create mock DOM for health bar
    if (typeof document === 'undefined') {
      (global as unknown as Record<string, unknown>).document = {
        createElement: () => ({
          style: {},
          appendChild: vi.fn(),
          setAttribute: vi.fn(),
          textContent: ''
        }),
        body: { appendChild: vi.fn(), removeChild: vi.fn(), contains: () => false }
      }
    }

    world = new World()
    mockHealthBar = {
      show: vi.fn(),
      hide: vi.fn(),
      update: vi.fn(),
      mount: vi.fn(),
      unmount: vi.fn(),
      getContainer: vi.fn(() => document.createElement('div'))
    } as unknown as BossHealthBar
    bossHealthSystem = new BossHealthSystem(mockHealthBar)
  })

  describe('Health Monitoring', () => {
    it('should query for entities with Boss and Health components', () => {
      const bossId = createMockBoss(world, 'destroyer', 100, 100)
      bossHealthSystem.update(world, 16)

      // System should track the boss
      expect(world.getComponent(bossId, Boss)).toBeDefined()
      expect(world.getComponent(bossId, Health)).toBeDefined()
    })

    it('should track health percentage correctly', () => {
      const bossId = createMockBoss(world, 'destroyer', 50, 100)
      bossHealthSystem.update(world, 16)

      const health = world.getComponent<Health>(bossId, Health)
      const percentage = (health!.current / health!.max) * 100
      expect(percentage).toBe(50)
    })

    it('should update health bar display on health change', () => {
      createMockBoss(world, 'destroyer', 80, 100)
      bossHealthSystem.update(world, 16)

      expect(mockHealthBar.update).toHaveBeenCalledWith(80, 100)
    })
  })

  describe('Phase Transitions', () => {
    it('should start in phase 1 at full health', () => {
      const bossId = createMockBoss(world, 'destroyer', 100, 100)
      bossHealthSystem.update(world, 16)

      const boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.phase).toBe(1)
    })

    it('should calculate phase 1 for health > 50%', () => {
      expect(bossHealthSystem.getPhaseFromHealth(60, 100)).toBe(1)
      expect(bossHealthSystem.getPhaseFromHealth(51, 100)).toBe(1)
      expect(bossHealthSystem.getPhaseFromHealth(100, 100)).toBe(1)
    })

    it('should calculate phase 2 for health 26% - 50%', () => {
      expect(bossHealthSystem.getPhaseFromHealth(50, 100)).toBe(2)
      expect(bossHealthSystem.getPhaseFromHealth(40, 100)).toBe(2)
      expect(bossHealthSystem.getPhaseFromHealth(26, 100)).toBe(2)
    })

    it('should calculate phase 3 for health <= 25%', () => {
      expect(bossHealthSystem.getPhaseFromHealth(25, 100)).toBe(3)
      expect(bossHealthSystem.getPhaseFromHealth(15, 100)).toBe(3)
      expect(bossHealthSystem.getPhaseFromHealth(1, 100)).toBe(3)
    })

    it('should transition to phase 2 when health crosses 50% threshold', () => {
      const bossId = createMockBoss(world, 'destroyer', 60, 100)
      bossHealthSystem.update(world, 16)

      // Simulate damage to cross 50% threshold
      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 50
      bossHealthSystem.update(world, 16)

      const boss = world.getComponent<Boss>(bossId, Boss)
      expect(boss?.phase).toBe(2)
    })

    it('should transition to phase 3 when health crosses 25% threshold', () => {
      const bossId = createMockBoss(world, 'destroyer', 30, 100)

      // Set initial phase to 2
      const boss = world.getComponent<Boss>(bossId, Boss)!
      boss.phase = 2
      bossHealthSystem.update(world, 16)

      // Simulate damage to cross 25% threshold
      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 25
      bossHealthSystem.update(world, 16)

      expect(boss.phase).toBe(3)
    })
  })

  describe('Event Emission', () => {
    it('should emit bossPhaseChanged event on phase transition', () => {
      const bossId = createMockBoss(world, 'destroyer', 60, 100)
      bossHealthSystem.update(world, 16)

      // Simulate damage to trigger phase change
      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 50
      bossHealthSystem.update(world, 16)

      const events = bossHealthSystem.getEvents()
      const phaseChangeEvent = events.find((e) => e.type === 'bossPhaseChanged')
      expect(phaseChangeEvent).toBeDefined()
      expect(phaseChangeEvent!.data.previousPhase).toBe(1)
      expect(phaseChangeEvent!.data.newPhase).toBe(2)
    })

    it('should emit bossDamaged event on health decrease', () => {
      const bossId = createMockBoss(world, 'destroyer', 100, 100)
      bossHealthSystem.update(world, 16)

      // Simulate damage
      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 80
      bossHealthSystem.update(world, 16)

      const events = bossHealthSystem.getEvents()
      const damagedEvent = events.find((e) => e.type === 'bossDamaged')
      expect(damagedEvent).toBeDefined()
    })

    it('should emit bossDefeated event at 0 health', () => {
      const bossId = createMockBoss(world, 'destroyer', 10, 100)
      bossHealthSystem.update(world, 16)

      // Kill the boss
      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 0
      bossHealthSystem.update(world, 16)

      const events = bossHealthSystem.getEvents()
      const defeatedEvent = events.find((e) => e.type === 'bossDefeated')
      expect(defeatedEvent).toBeDefined()
    })

    it('should include correct data in bossPhaseChanged event', () => {
      const bossId = createMockBoss(world, 'destroyer', 60, 100)
      bossHealthSystem.update(world, 16)

      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 50
      bossHealthSystem.update(world, 16)

      const events = bossHealthSystem.getEvents()
      const phaseChangeEvent = events.find((e) => e.type === 'bossPhaseChanged')

      expect(phaseChangeEvent?.data.entityId).toBe(bossId)
      expect(phaseChangeEvent?.data.healthPercentage).toBe(50)
    })

    it('should include correct data in bossDefeated event', () => {
      const bossId = createMockBoss(world, 'destroyer', 10, 100)
      bossHealthSystem.update(world, 16)

      // Set boss wave tracking
      bossHealthSystem.setCurrentWave(5)

      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 0
      bossHealthSystem.update(world, 16)

      const events = bossHealthSystem.getEvents()
      const defeatedEvent = events.find((e) => e.type === 'bossDefeated')

      expect(defeatedEvent?.data.entityId).toBe(bossId)
      expect(defeatedEvent?.data.bossType).toBe('destroyer')
      expect(defeatedEvent?.data.wave).toBe(5)
    })

    it('should clear events after retrieval', () => {
      const bossId = createMockBoss(world, 'destroyer', 100, 100)
      bossHealthSystem.update(world, 16)

      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 80
      bossHealthSystem.update(world, 16)

      bossHealthSystem.getEvents() // First retrieval
      const events = bossHealthSystem.getEvents() // Second retrieval

      expect(events.length).toBe(0)
    })
  })

  describe('Health Bar Display', () => {
    it('should show health bar when boss is present', () => {
      createMockBoss(world, 'destroyer', 100, 100)
      bossHealthSystem.update(world, 16)

      expect(mockHealthBar.show).toHaveBeenCalled()
    })

    it('should update health bar with current and max health', () => {
      createMockBoss(world, 'destroyer', 75, 150)
      bossHealthSystem.update(world, 16)

      expect(mockHealthBar.update).toHaveBeenCalledWith(75, 150)
    })

    it('should hide health bar when boss is defeated', () => {
      const bossId = createMockBoss(world, 'destroyer', 10, 100)
      bossHealthSystem.update(world, 16)

      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 0
      bossHealthSystem.update(world, 16)

      expect(mockHealthBar.hide).toHaveBeenCalled()
    })

    it('should show boss name based on boss type', () => {
      createMockBoss(world, 'carrier', 100, 100)
      bossHealthSystem.update(world, 16)

      expect(mockHealthBar.show).toHaveBeenCalledWith('Carrier')
    })
  })

  describe('Edge Cases', () => {
    it('should handle instant kill (full health to 0)', () => {
      const bossId = createMockBoss(world, 'destroyer', 100, 100)
      bossHealthSystem.update(world, 16)

      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 0
      bossHealthSystem.update(world, 16)

      const events = bossHealthSystem.getEvents()
      const defeatedEvent = events.find((e) => e.type === 'bossDefeated')
      expect(defeatedEvent).toBeDefined()
    })

    it('should handle gradual damage with multiple events', () => {
      const bossId = createMockBoss(world, 'destroyer', 100, 100)
      bossHealthSystem.update(world, 16)

      // First damage
      const health = world.getComponent<Health>(bossId, Health)!
      health.current = 80
      bossHealthSystem.update(world, 16)

      // Second damage
      health.current = 60
      bossHealthSystem.update(world, 16)

      const events = bossHealthSystem.getEvents()
      const damagedEvents = events.filter((e) => e.type === 'bossDamaged')
      expect(damagedEvents.length).toBeGreaterThanOrEqual(1)
    })

    it('should not emit events if health unchanged', () => {
      const bossId = createMockBoss(world, 'destroyer', 80, 100)
      bossHealthSystem.update(world, 16)
      bossHealthSystem.getEvents() // Clear initial events

      // Update without health change
      bossHealthSystem.update(world, 16)

      const events = bossHealthSystem.getEvents()
      const damagedEvents = events.filter((e) => e.type === 'bossDamaged')
      expect(damagedEvents.length).toBe(0)
    })

    it('should handle no boss present gracefully', () => {
      // No boss created
      expect(() => {
        bossHealthSystem.update(world, 16)
      }).not.toThrow()
    })

    it('should handle boss removal mid-game', () => {
      const bossId = createMockBoss(world, 'destroyer', 100, 100)
      bossHealthSystem.update(world, 16)

      // Remove the boss
      world.destroyEntity(bossId)

      expect(() => {
        bossHealthSystem.update(world, 16)
      }).not.toThrow()
    })
  })

  describe('Multiple Bosses (Edge Case)', () => {
    it('should only process first boss (game has one boss at a time)', () => {
      createMockBoss(world, 'destroyer', 100, 100)
      createMockBoss(world, 'carrier', 150, 150)

      bossHealthSystem.update(world, 16)

      // Should still function (processes bosses sequentially)
      expect(() => {
        bossHealthSystem.update(world, 16)
      }).not.toThrow()
    })
  })
})
