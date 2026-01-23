/**
 * Math Utilities
 *
 * Vector operations, angle calculations, and mathematical helper functions
 * for game physics and rendering calculations.
 *
 * @module utils/math
 */

import * as THREE from 'three'

/**
 * Normalizes a 2D vector to unit length.
 * Returns a new vector without mutating the original.
 *
 * @param v - The vector to normalize
 * @returns A new normalized vector, or [0,0] if input is zero vector
 *
 * @example
 * const direction = normalizeVector2(new THREE.Vector2(3, 4))
 * // Returns Vector2(0.6, 0.8) with length 1
 */
export function normalizeVector2(v: THREE.Vector2): THREE.Vector2 {
  const copy = v.clone()
  if (copy.length() > 0) {
    copy.normalize()
  }
  return copy
}

/**
 * Calculates the Euclidean distance between two Vector2 points.
 *
 * @param a - First point
 * @param b - Second point
 * @returns The distance between the two points
 *
 * @example
 * const dist = distance(new THREE.Vector2(0, 0), new THREE.Vector2(3, 4))
 * // Returns 5
 */
export function distance(a: THREE.Vector2, b: THREE.Vector2): number
/**
 * Calculates the Euclidean distance between two Vector3 points.
 *
 * @param a - First point
 * @param b - Second point
 * @returns The distance between the two points
 *
 * @example
 * const dist = distance(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 2, 2))
 * // Returns 3
 */
export function distance(a: THREE.Vector3, b: THREE.Vector3): number
export function distance(
  a: THREE.Vector2 | THREE.Vector3,
  b: THREE.Vector2 | THREE.Vector3
): number {
  // Both Vector2 and Vector3 have distanceTo method with same signature
  // Use type assertion to handle the union type
  if (a instanceof THREE.Vector2 && b instanceof THREE.Vector2) {
    return a.distanceTo(b)
  }
  if (a instanceof THREE.Vector3 && b instanceof THREE.Vector3) {
    return a.distanceTo(b)
  }
  // Fallback for mixed types - calculate manually
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = ('z' in a ? a.z : 0) - ('z' in b ? b.z : 0)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Returns the magnitude (length) of a vector.
 *
 * @param v - The vector
 * @returns The magnitude of the vector
 *
 * @example
 * const len = magnitude(new THREE.Vector2(3, 4))
 * // Returns 5
 */
export function magnitude(v: THREE.Vector2 | THREE.Vector3): number {
  return v.length()
}

/**
 * Calculates the signed angle between two 2D vectors.
 * The angle is measured from vector a to vector b, with positive
 * values indicating counter-clockwise rotation.
 *
 * @param a - First vector (reference direction)
 * @param b - Second vector (target direction)
 * @returns The angle in radians from a to b
 *
 * @example
 * const angle = angleBetween(
 *   new THREE.Vector2(1, 0),  // pointing right
 *   new THREE.Vector2(0, 1)   // pointing up
 * )
 * // Returns PI/2 (90 degrees counter-clockwise)
 */
export function angleBetween(a: THREE.Vector2, b: THREE.Vector2): number {
  const angleA = Math.atan2(a.y, a.x)
  const angleB = Math.atan2(b.y, b.x)
  return angleB - angleA
}

/**
 * Wraps an angle to the range [0, 2*PI).
 * Useful for keeping rotation values within a normalized range.
 *
 * @param angle - The angle in radians to wrap
 * @returns The angle wrapped to [0, 2*PI)
 *
 * @example
 * wrapAngle(-Math.PI / 2)  // Returns 3*PI/2
 * wrapAngle(3 * Math.PI)   // Returns PI
 */
export function wrapAngle(angle: number): number {
  const twoPi = 2 * Math.PI
  return ((angle % twoPi) + twoPi) % twoPi
}

/**
 * Clamps a value to a specified range.
 *
 * @param value - The value to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The value clamped to [min, max]
 *
 * @example
 * clamp(15, 0, 10)  // Returns 10
 * clamp(-5, 0, 10)  // Returns 0
 * clamp(5, 0, 10)   // Returns 5
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Linearly interpolates between two values.
 *
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0 = a, 1 = b)
 * @returns The interpolated value
 *
 * @example
 * lerp(0, 10, 0.5)  // Returns 5
 * lerp(0, 10, 0.25) // Returns 2.5
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
