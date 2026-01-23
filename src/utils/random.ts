/**
 * Random Utilities
 *
 * Seeded random number generation for reproducible game behavior.
 * Uses the Mulberry32 algorithm for fast, high-quality pseudo-random numbers.
 *
 * @module utils/random
 */

import * as THREE from 'three'

/**
 * Seeded random number generator using Mulberry32 algorithm.
 * Produces high-quality pseudo-random numbers with a simple implementation.
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed >>> 0
  }

  /**
   * Generates the next random number in the sequence.
   * @returns A pseudo-random number in the range [0, 1)
   */
  next(): number {
    this.seed |= 0
    this.seed = (this.seed + 0x6d2b79f5) | 0
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Global random number generator instance */
let globalRandom: SeededRandom = new SeededRandom(Date.now())

/**
 * Sets the seed for the global random number generator.
 * Calling this with the same seed will produce the same sequence
 * of random numbers, enabling reproducible game behavior.
 *
 * @param seed - The seed value (integer)
 *
 * @example
 * setSeed(12345)
 * const a = randomRange(0, 100)
 * setSeed(12345)
 * const b = randomRange(0, 100)
 * // a === b (same sequence)
 */
export function setSeed(seed: number): void {
  globalRandom = new SeededRandom(seed)
}

/**
 * Generates a random floating-point number within a range.
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns A random number in the range [min, max)
 *
 * @example
 * const speed = randomRange(50, 200)
 * // Returns a random value between 50 and 200
 */
export function randomRange(min: number, max: number): number {
  return min + globalRandom.next() * (max - min)
}

/**
 * Generates a random integer within a range (inclusive).
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns A random integer in the range [min, max]
 *
 * @example
 * const diceRoll = randomInt(1, 6)
 * // Returns 1, 2, 3, 4, 5, or 6
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1))
}

/**
 * Generates a random unit vector (normalized direction).
 * Useful for spawning asteroids with random trajectories.
 *
 * @returns A normalized Vector2 with random direction
 *
 * @example
 * const direction = randomDirection()
 * // direction.length() === 1
 */
export function randomDirection(): THREE.Vector2 {
  const angle = randomRange(0, 2 * Math.PI)
  return new THREE.Vector2(Math.cos(angle), Math.sin(angle))
}

/**
 * Selects a random element from a non-empty array.
 *
 * @param array - The non-empty array to select from
 * @returns A random element from the array
 * @throws Error if the array is empty
 *
 * @example
 * const powerUp = randomChoice(['shield', 'rapidFire', 'multiShot', 'extraLife'])
 */
export function randomChoice<T>(array: readonly T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array')
  }
  const index = randomInt(0, array.length - 1)
  return array[index] as T
}
