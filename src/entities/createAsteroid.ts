/**
 * Asteroid Entity Factory
 *
 * Creates asteroid entities with all required components.
 * Asteroids spawn from screen edges with randomized trajectories.
 *
 * Size-based properties:
 * - Large: radius 30, mass 3, speed 50, points 25
 * - Medium: radius 20, mass 2, speed 75, points 50
 * - Small: radius 10, mass 1, speed 100, points 100
 */

import { Vector3 } from 'three'
import { Collider, Health, Physics, Renderable, Transform, Velocity } from '../components'
import { Asteroid } from '../components/Asteroid'
import { gameConfig } from '../config'
import type { EntityId, World } from '../ecs/types'
import type { AsteroidSize } from '../types/components'
import { randomRange } from '../utils/random'

/**
 * Asteroid configuration by size.
 */
const ASTEROID_CONFIG = {
  large: {
    radius: 30,
    mass: 3,
    points: 25,
    speed: 50,
    scale: 2,
    maxSpeed: 100,
    health: 30
  },
  medium: {
    radius: 20,
    mass: 2,
    points: 50,
    speed: 75,
    scale: 1.5,
    maxSpeed: 150,
    health: 20
  },
  small: {
    radius: 10,
    mass: 1,
    points: 100,
    speed: 100,
    scale: 1,
    maxSpeed: 200,
    health: 10
  }
} as const

/**
 * Creates an asteroid entity with all required components.
 *
 * The asteroid is created at the specified position with a randomized
 * velocity direction based on its size configuration. Smaller asteroids
 * move faster than larger ones.
 *
 * @param world - The ECS world to create the entity in
 * @param position - Spawn position in world space
 * @param size - Asteroid size ('large', 'medium', 'small'), defaults to 'large'
 * @returns The EntityId of the newly created asteroid
 *
 * @example
 * ```typescript
 * const world = new World()
 * const asteroidId = createAsteroid(world, new Vector3(500, 300, 0), 'large')
 * // Asteroid is now ready with all components configured
 * ```
 */
export function createAsteroid(
  world: World,
  position: Vector3,
  size: AsteroidSize = 'large'
): EntityId {
  const config = ASTEROID_CONFIG[size]
  const asteroidId = world.createEntity()

  // Random direction for velocity
  const angle = randomRange(0, Math.PI * 2)
  const speed = config.speed
  const velocity = new Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0)

  // Transform: Position at spawn point, random rotation
  world.addComponent(
    asteroidId,
    new Transform(
      position.clone(),
      new Vector3(
        randomRange(0, Math.PI * 2),
        randomRange(0, Math.PI * 2),
        randomRange(0, Math.PI * 2)
      ),
      new Vector3(config.scale, config.scale, config.scale)
    )
  )

  // Velocity: Random direction and speed, with angular rotation
  world.addComponent(asteroidId, new Velocity(velocity, new Vector3(0, 0, randomRange(-2, 2))))

  // Physics: Size-based properties
  world.addComponent(
    asteroidId,
    new Physics(
      config.mass,
      gameConfig.physics.damping,
      config.maxSpeed,
      true // wrapScreen = true
    )
  )

  // Collider: Size-based collision
  world.addComponent(
    asteroidId,
    new Collider('sphere', config.radius, 'asteroid', ['projectile', 'player', 'boss'])
  )

  // Renderable: Size-based mesh type
  world.addComponent(asteroidId, new Renderable(`asteroid_${size}`, 'standard', true))

  // Asteroid: Size and point value
  world.addComponent(asteroidId, new Asteroid(size, config.points))

  // Health: Size-based health for destruction tracking
  world.addComponent(asteroidId, new Health(config.health, config.health))

  return asteroidId
}

/**
 * Gets the collision radius for an asteroid size.
 *
 * @param size - Asteroid size
 * @returns Collision radius in units
 */
export function getAsteroidRadius(size: AsteroidSize): number {
  return ASTEROID_CONFIG[size].radius
}

/**
 * Gets the point value for destroying an asteroid of a given size.
 *
 * @param size - Asteroid size
 * @returns Point value
 */
export function getAsteroidPoints(size: AsteroidSize): number {
  return ASTEROID_CONFIG[size].points
}
