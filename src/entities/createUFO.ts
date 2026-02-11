/**
 * UFO Entity Factory
 *
 * Creates UFO entities with all required components.
 * Supports two UFO sizes: Large and Small.
 *
 * UFO Types:
 * - Large: Slower (80 units/s), less accurate, 200 points
 * - Small: Faster (120 units/s), more accurate, 1000 points
 *
 * Components:
 * - Transform: Random edge spawn position
 * - Velocity: Horizontal movement with slight vertical variation
 * - Physics: Mass 1, no damping, size-based maxSpeed, screen wrap enabled
 * - Collider: Sphere, size-based radius, layer "ufo", mask ["player", "projectile", "asteroid"]
 * - Health: 1 (one-hit kill)
 * - UFO: Size type, shoot timer, points
 * - Renderable: ufo_${size} mesh, emissive material
 */

import { Vector3 } from 'three'
import { Collider, Health, Physics, Renderable, Transform, Velocity } from '../components'
import { UFO, type UFOSize, UFO_CONFIG } from '../components/UFO'
import { gameConfig } from '../config'
import type { EntityId, World } from '../ecs/types'
import type { MeshType } from '../types/components'

/** UFO mass (light unit) */
const UFO_MASS = 1

/** UFO damping (no friction - UFO maintains speed) */
const UFO_DAMPING = 0

const { halfWidth: SCREEN_HALF_WIDTH, halfHeight: SCREEN_HALF_HEIGHT } = gameConfig.worldBounds

/**
 * Options for UFO creation.
 */
export interface CreateUFOOptions {
  /** UFO size type */
  size: UFOSize
  /** Optional spawn position (default: random edge) */
  position?: Vector3
  /** Optional movement direction (default: calculated from spawn) */
  direction?: Vector3
}

/**
 * Calculates a random spawn position at screen edge.
 * UFOs spawn from left or right edge with random Y position.
 *
 * @returns Spawn position and direction
 */
function calculateSpawnPosition(): { position: Vector3; direction: Vector3 } {
  // Randomly choose left or right edge
  const fromLeft = Math.random() < 0.5
  const x = fromLeft ? -SCREEN_HALF_WIDTH - 50 : SCREEN_HALF_WIDTH + 50

  // Random Y position within screen bounds
  const y = (Math.random() - 0.5) * SCREEN_HALF_HEIGHT * 1.5

  // Direction is opposite to spawn side with slight vertical variation
  const dirX = fromLeft ? 1 : -1
  const dirY = (Math.random() - 0.5) * 0.4 // +/- 0.2 vertical variation

  return {
    position: new Vector3(x, y, 0),
    direction: new Vector3(dirX, dirY, 0).normalize()
  }
}

/**
 * Creates a UFO entity with all required components.
 *
 * The UFO spawns at the screen edge and flies across in a semi-random pattern.
 * UFO sizes have different speeds, accuracy, and point values:
 * - Large: 80 units/s, 30% accuracy, 200 points
 * - Small: 120 units/s, 80% accuracy, 1000 points
 *
 * @param world - The ECS world to create the entity in
 * @param options - UFO creation options
 * @returns The EntityId of the newly created UFO
 *
 * @example
 * ```typescript
 * const world = new World()
 * const ufoId = createUFO(world, { size: 'large' })
 * // UFO is now spawned at screen edge, flying across
 *
 * const smallUfoId = createUFO(world, { size: 'small' })
 * // Small UFO is faster and more accurate
 * ```
 */
export function createUFO(world: World, options: CreateUFOOptions): EntityId {
  const { size } = options
  const config = UFO_CONFIG[size]

  const ufoId = world.createEntity()

  // Calculate spawn position and direction if not provided
  const spawn = calculateSpawnPosition()
  const position = options.position ?? spawn.position
  const direction = options.direction ?? spawn.direction

  // No scale factor - mesh is already correctly sized
  const scale = 1.0

  // Transform: Position at spawn point, no rotation, scale 1.0
  world.addComponent(
    ufoId,
    new Transform(position.clone(), new Vector3(0, 0, 0), new Vector3(scale, scale, scale))
  )

  // Velocity: Direction * speed
  const velocity = direction.clone().multiplyScalar(config.speed)
  world.addComponent(ufoId, new Velocity(velocity, new Vector3(0, 0, 0)))

  // Physics: Light unit, no damping, screen wrap enabled
  world.addComponent(ufoId, new Physics(UFO_MASS, UFO_DAMPING, config.speed, true))

  // Collider: Sphere, size-based radius, ufo layer, collides with player, projectiles, and asteroids
  world.addComponent(
    ufoId,
    new Collider('sphere', config.colliderRadius, 'ufo', ['player', 'projectile', 'asteroid'])
  )

  // Health: One-hit kill
  world.addComponent(ufoId, new Health(1, 1))

  // UFO: Size type, shoot timer, points
  world.addComponent(ufoId, new UFO(size))

  // Renderable: UFO mesh with emissive material, visible
  const meshType = `ufo_${size}` as MeshType
  world.addComponent(ufoId, new Renderable(meshType, 'emissive', true))

  return ufoId
}

/**
 * Determines UFO size based on current score.
 * Small UFOs appear more frequently at higher scores.
 *
 * @param score - Current player score
 * @returns UFO size to spawn
 */
export function getUFOSizeForScore(score: number): UFOSize {
  // Small UFO chance increases with score
  // Base 20% chance, increases by 10% per 10000 points, max 70%
  const baseChance = 0.2
  const scoreBonus = Math.min(0.5, (score / 10000) * 0.1)
  const smallChance = baseChance + scoreBonus

  return Math.random() < smallChance ? 'small' : 'large'
}
