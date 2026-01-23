/**
 * ObjectPool - Generic object pooling for performance optimization
 *
 * Manages a pool of reusable objects to reduce garbage collection overhead.
 * Used for projectiles, particles, and other frequently created/destroyed entities.
 */

/**
 * Generic object pool for efficient object reuse.
 *
 * @example
 * ```typescript
 * const projectilePool = new ObjectPool(
 *   () => new THREE.Mesh(geometry, material),
 *   (mesh) => { mesh.position.set(0, 0, 0); mesh.visible = false; },
 *   50
 * );
 *
 * const mesh = projectilePool.acquire();
 * // Use mesh...
 * projectilePool.release(mesh);
 * ```
 */
export class ObjectPool<T> {
  private available: T[] = []
  private inUse: Set<T> = new Set()
  private factory: () => T
  private reset: (obj: T) => void

  /**
   * Create an object pool.
   *
   * @param factory - Factory function to create new objects
   * @param reset - Reset function to reinitialize objects on release
   * @param initialSize - Number of objects to pre-allocate (default: 0)
   */
  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 0) {
    this.factory = factory
    this.reset = reset

    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory())
    }
  }

  /**
   * Acquire an object from the pool.
   * Creates a new object if the pool is empty.
   *
   * @returns An object from the pool
   */
  acquire(): T {
    // Pop from available pool, or create new if empty
    // We check length > 0 before pop, so pop returns T (not undefined)
    const obj = this.available.length > 0 ? (this.available.pop() as T) : this.factory()

    this.inUse.add(obj)
    return obj
  }

  /**
   * Release an object back to the pool.
   * The reset function is called to reinitialize the object.
   * Only releases objects that were acquired from this pool.
   *
   * @param obj - The object to release
   */
  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj)
      this.reset(obj)
      this.available.push(obj)
    }
  }

  /**
   * Get the current pool size.
   *
   * @returns Object with available and inUse counts
   */
  getPoolSize(): { available: number; inUse: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size
    }
  }

  /**
   * Clear all objects from the pool.
   * Removes both available and in-use objects.
   */
  clear(): void {
    this.available = []
    this.inUse.clear()
  }
}
