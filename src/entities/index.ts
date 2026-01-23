/**
 * Entities Module
 *
 * Entity factory functions for creating game entities with predefined
 * component configurations. Each factory creates an entity and adds
 * all required components with proper initial values.
 */

export { createShip } from './createShip'
export {
  createAsteroid,
  getAsteroidRadius,
  getAsteroidPoints,
  type AsteroidSize
} from './createAsteroid'
export {
  createProjectile,
  type ProjectileConfig,
  type ProjectileType
} from './createProjectile'
