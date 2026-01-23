/**
 * Boss Entity Factory
 *
 * Creates boss entities with all required components.
 * Supports two boss types: Destroyer and Carrier.
 *
 * Boss Types:
 * - Destroyer: Base health 100, aggressive, charge attacks
 * - Carrier: Base health 150, summons minions
 *
 * Health Scaling: base * (1 + (wave - 5) * 0.2)
 *
 * Components:
 * - Transform: Position at screen center (0, 0, 0)
 * - Velocity: Zero initial velocity (AI controls movement)
 * - Physics: Mass 10, damping 0, maxSpeed 150, wrapScreen false
 * - Collider: Sphere, radius 50, layer "boss", mask ["player", "projectile"]
 * - Health: Scaled based on wave level
 * - Boss: Type, phase 1, phaseTimer 0, attackPattern 'idle'
 * - Renderable: boss_${type} mesh, emissive material
 */

import { Vector3 } from 'three'
import { Collider, Health, Physics, Renderable, Transform, Velocity } from '../components'
import { Boss } from '../components/Boss'
import type { EntityId, World } from '../ecs/types'
import type { BossType, MeshType } from '../types/components'

/**
 * Boss configuration by type.
 */
export const BOSS_CONFIG = {
  destroyer: {
    baseHealth: 100,
    scale: 3,
    meshType: 'boss_destroyer' as MeshType
  },
  carrier: {
    baseHealth: 150,
    scale: 4,
    meshType: 'boss_carrier' as MeshType
  }
} as const

/** Boss collider radius */
const BOSS_COLLIDER_RADIUS = 50

/** Boss mass (heavy unit) */
const BOSS_MASS = 10

/** Boss damping (no friction - AI controls all movement) */
const BOSS_DAMPING = 0

/** Boss maximum speed */
const BOSS_MAX_SPEED = 150

/**
 * Calculates boss health based on wave number.
 *
 * Formula: base * (1 + (wave - 5) * 0.2)
 *
 * @param baseHealth - Base health for the boss type
 * @param wave - Current wave number
 * @returns Calculated health value
 */
function calculateBossHealth(baseHealth: number, wave: number): number {
  const waveScaling = 1 + (wave - 5) * 0.2
  return Math.floor(baseHealth * waveScaling)
}

/**
 * Creates a boss entity with all required components.
 *
 * The boss spawns at screen center with health scaled by wave level.
 * Boss types have different base health values:
 * - Destroyer: 100 base health
 * - Carrier: 150 base health
 *
 * @param world - The ECS world to create the entity in
 * @param bossType - Type of boss ('destroyer' or 'carrier')
 * @param wave - Current wave number for health scaling
 * @returns The EntityId of the newly created boss
 *
 * @example
 * ```typescript
 * const world = new World()
 * const bossId = createBoss(world, 'destroyer', 5)
 * // Boss is now ready with health 100 (base, wave 5)
 *
 * const bossId2 = createBoss(world, 'carrier', 10)
 * // Boss has health 300 (150 * (1 + (10-5) * 0.2) = 150 * 2)
 * ```
 */
export function createBoss(world: World, bossType: BossType, wave: number): EntityId {
  const config = BOSS_CONFIG[bossType]
  const bossId = world.createEntity()

  // Calculate health based on wave
  const health = calculateBossHealth(config.baseHealth, wave)

  // Transform: Position at screen center, no rotation, type-based scale
  world.addComponent(
    bossId,
    new Transform(
      new Vector3(0, 0, 0), // Screen center
      new Vector3(0, 0, 0), // No initial rotation
      new Vector3(config.scale, config.scale, config.scale)
    )
  )

  // Velocity: Zero initial velocity (AI controls movement)
  world.addComponent(
    bossId,
    new Velocity(
      new Vector3(0, 0, 0), // Zero linear velocity
      new Vector3(0, 0, 0) // Zero angular velocity
    )
  )

  // Physics: Heavy unit with no damping, no screen wrap
  world.addComponent(
    bossId,
    new Physics(
      BOSS_MASS,
      BOSS_DAMPING,
      BOSS_MAX_SPEED,
      false // wrapScreen disabled - boss stays in arena
    )
  )

  // Collider: Large sphere, boss layer, collides with player and projectiles
  world.addComponent(
    bossId,
    new Collider('sphere', BOSS_COLLIDER_RADIUS, 'boss', ['player', 'projectile'])
  )

  // Health: Scaled based on wave and boss type
  world.addComponent(bossId, new Health(health, health))

  // Boss: Type, phase 1, phaseTimer 0, idle attack pattern
  world.addComponent(bossId, new Boss(bossType, 1, 0, 'idle'))

  // Renderable: Boss mesh with emissive material, visible
  world.addComponent(bossId, new Renderable(config.meshType, 'emissive', true))

  return bossId
}

/**
 * Gets the base health for a boss type.
 *
 * @param bossType - Boss type
 * @returns Base health value
 */
export function getBossBaseHealth(bossType: BossType): number {
  return BOSS_CONFIG[bossType].baseHealth
}

/**
 * Determines boss type for a given wave.
 * - Waves divisible by 10: Carrier
 * - Other boss waves (5, 15, 25...): Destroyer
 *
 * @param wave - Wave number
 * @returns Boss type for the wave
 */
export function getBossTypeForWave(wave: number): BossType {
  return wave % 10 === 0 ? 'carrier' : 'destroyer'
}
