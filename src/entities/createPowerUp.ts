/**
 * Power-up Entity Factory
 *
 * Creates power-up entities that spawn on asteroid destruction.
 * Power-ups are collectible items that drift slowly and despawn after a duration.
 * Four types: Shield, RapidFire, MultiShot, and ExtraLife.
 *
 * @module entities/createPowerUp
 */

import { Vector3 } from 'three'
import { Collider, Lifetime, PowerUp, Renderable } from '../components'
import { Transform } from '../components/Transform'
import { Velocity } from '../components/Velocity'
import type { EntityId, World } from '../ecs/types'
import type { MeshType, PowerUpType } from '../types/components'
import { randomRange } from '../utils/random'

/**
 * Spawn chance for power-ups on asteroid destruction.
 * 10% chance to spawn a power-up.
 */
export const POWER_UP_SPAWN_CHANCE = 0.1

/**
 * Power-up configuration constants.
 */
const POWER_UP_CONFIG = {
  /** Collision radius for pickup detection */
  radius: 10,
  /** Minimum drift speed in units/second */
  minDriftSpeed: 10,
  /** Maximum drift speed in units/second */
  maxDriftSpeed: 30,
  /** Default lifetime in milliseconds */
  defaultLifetime: 3000,
  /** Angular velocity for visual rotation */
  angularSpeed: 2
} as const

/**
 * Options for creating a power-up entity.
 */
export interface CreatePowerUpOptions {
  /** Spawn position in world space */
  position: Vector3
  /** Type of power-up effect */
  powerUpType: PowerUpType
  /** Lifetime in milliseconds (default: 3000) */
  lifetime?: number
  /** Custom velocity (default: slow random drift) */
  velocity?: Vector3
}

/**
 * Maps power-up types to mesh types for rendering.
 */
const POWER_UP_MESH_TYPES: Record<PowerUpType, MeshType> = {
  shield: 'powerup_shield',
  rapidFire: 'powerup_rapidfire',
  multiShot: 'powerup_multishot',
  extraLife: 'powerup_extralife'
}

/**
 * All available power-up types for random selection.
 */
const ALL_POWER_UP_TYPES: readonly PowerUpType[] = [
  'shield',
  'rapidFire',
  'multiShot',
  'extraLife'
] as const

/**
 * Creates a power-up entity with all required components.
 *
 * The power-up is created at the specified position with a slow drift velocity.
 * Power-ups despawn after their lifetime expires if not collected.
 *
 * @param world - The ECS world to create the entity in
 * @param options - Configuration options for the power-up
 * @returns The EntityId of the newly created power-up
 *
 * @example
 * ```typescript
 * const world = new World()
 * const powerUpId = createPowerUp(world, {
 *   position: new Vector3(100, 200, 0),
 *   powerUpType: 'shield',
 * })
 * // Power-up is now ready with all components configured
 * ```
 */
export function createPowerUp(world: World, options: CreatePowerUpOptions): EntityId {
  const { position, powerUpType, lifetime = POWER_UP_CONFIG.defaultLifetime, velocity } = options

  const powerUpId = world.createEntity()

  // Calculate velocity: use custom or generate random slow drift
  let linearVelocity: Vector3
  if (velocity) {
    linearVelocity = velocity.clone()
  } else {
    // Random direction with slow speed
    const angle = randomRange(0, Math.PI * 2)
    const speed = randomRange(POWER_UP_CONFIG.minDriftSpeed, POWER_UP_CONFIG.maxDriftSpeed)
    linearVelocity = new Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0)
  }

  // Transform: Position at spawn point, default rotation and scale
  world.addComponent(
    powerUpId,
    new Transform(position.clone(), new Vector3(0, 0, 0), new Vector3(1, 1, 1))
  )

  // Velocity: Slow drift with angular rotation for visual appeal
  world.addComponent(
    powerUpId,
    new Velocity(
      linearVelocity,
      new Vector3(0, 0, randomRange(-POWER_UP_CONFIG.angularSpeed, POWER_UP_CONFIG.angularSpeed))
    )
  )

  // Collider: Sphere shape, only collides with player
  world.addComponent(
    powerUpId,
    new Collider('sphere', POWER_UP_CONFIG.radius, 'powerup', ['player'])
  )

  // PowerUp: Identifies the power-up type for effect application
  world.addComponent(powerUpId, new PowerUp(powerUpType))

  // Renderable: Emissive material for visual distinction
  world.addComponent(powerUpId, new Renderable(POWER_UP_MESH_TYPES[powerUpType], 'emissive', true))

  // Lifetime: Despawn after duration
  world.addComponent(powerUpId, new Lifetime(lifetime))

  return powerUpId
}

/**
 * Determines whether a power-up should spawn based on probability.
 *
 * Uses POWER_UP_SPAWN_CHANCE (10%) to randomly decide.
 *
 * @returns true if a power-up should spawn, false otherwise
 *
 * @example
 * ```typescript
 * if (shouldSpawnPowerUp()) {
 *   const type = getRandomPowerUpType()
 *   createPowerUp(world, { position, powerUpType: type })
 * }
 * ```
 */
export function shouldSpawnPowerUp(): boolean {
  return Math.random() < POWER_UP_SPAWN_CHANCE
}

/**
 * Selects a random power-up type with equal probability.
 *
 * Each type (shield, rapidFire, multiShot, extraLife) has 25% chance.
 *
 * @returns A random PowerUpType
 *
 * @example
 * ```typescript
 * const type = getRandomPowerUpType()
 * // type is one of: 'shield', 'rapidFire', 'multiShot', 'extraLife'
 * ```
 */
export function getRandomPowerUpType(): PowerUpType {
  const random = Math.random()
  const index = Math.floor(random * ALL_POWER_UP_TYPES.length)
  // Ensure index is within bounds (for edge case when random returns exactly 1.0)
  const safeIndex = Math.min(index, ALL_POWER_UP_TYPES.length - 1)
  // Use non-null assertion since we know the index is valid
  return ALL_POWER_UP_TYPES[safeIndex] as PowerUpType
}
