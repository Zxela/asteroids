/**
 * Utilities Module
 *
 * Utility functions for math operations, random generation, and event handling.
 * These are foundational utilities used by all subsequent game systems.
 *
 * @module utils
 */

// Math utilities - vector operations, angle calculations
export {
  normalizeVector2,
  distance,
  magnitude,
  angleBetween,
  wrapAngle,
  clamp,
  lerp
} from './math'

// Random utilities - seeded random number generation
export {
  setSeed,
  randomRange,
  randomInt,
  randomDirection,
  randomChoice
} from './random'

// Event system - subscription and publication
export { EventEmitter } from './EventEmitter'
export type { EventHandler } from './EventEmitter'

// Object pooling for performance optimization
export { ObjectPool } from './ObjectPool'

// Spatial partitioning for collision detection
export { SpatialGrid, type SpatialGridConfig } from './SpatialGrid'

// Leaderboard persistence
export { LeaderboardStorage, type RankedLeaderboardEntry } from './LeaderboardStorage'
