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
  getAsteroidPoints
} from './createAsteroid'
export {
  createProjectile,
  type ProjectileConfig
} from './createProjectile'
export {
  createPowerUp,
  shouldSpawnPowerUp,
  getRandomPowerUpType,
  POWER_UP_SPAWN_CHANCE,
  type CreatePowerUpOptions
} from './createPowerUp'
export {
  createBoss,
  getBossBaseHealth,
  getBossTypeForWave,
  BOSS_CONFIG
} from './createBoss'
export {
  createUFO,
  getUFOSizeForScore,
  type CreateUFOOptions
} from './createUFO'
