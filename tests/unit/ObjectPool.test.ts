/**
 * ObjectPool Unit Tests
 *
 * Tests for object pooling functionality:
 * - Pool initialization
 * - Object acquisition from pool
 * - Object release back to pool
 * - Pool size tracking
 * - Factory function invocation
 * - Reset function invocation
 */

import { describe, it, expect, vi } from 'vitest'
import { ObjectPool } from '../../src/utils/ObjectPool'

describe('ObjectPool', () => {
  describe('Initialization', () => {
    it('should create pool with zero initial size', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset)
      const size = pool.getPoolSize()

      expect(size.available).toBe(0)
      expect(size.inUse).toBe(0)
      expect(factory).not.toHaveBeenCalled()
    })

    it('should create pool with pre-allocated objects', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 5)
      const size = pool.getPoolSize()

      expect(size.available).toBe(5)
      expect(size.inUse).toBe(0)
      expect(factory).toHaveBeenCalledTimes(5)
    })
  })

  describe('Acquisition', () => {
    it('should acquire object from pre-allocated pool', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 3)
      const obj = pool.acquire()
      const size = pool.getPoolSize()

      expect(obj).toBeDefined()
      expect(size.available).toBe(2)
      expect(size.inUse).toBe(1)
    })

    it('should create new object when pool is empty', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 0)
      const obj = pool.acquire()
      const size = pool.getPoolSize()

      expect(obj).toBeDefined()
      expect(factory).toHaveBeenCalledTimes(1)
      expect(size.available).toBe(0)
      expect(size.inUse).toBe(1)
    })

    it('should track multiple acquired objects', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 5)
      pool.acquire()
      pool.acquire()
      pool.acquire()
      const size = pool.getPoolSize()

      expect(size.available).toBe(2)
      expect(size.inUse).toBe(3)
    })

    it('should return distinct objects', () => {
      let counter = 0
      const factory = () => ({ id: ++counter })
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 3)
      const obj1 = pool.acquire()
      const obj2 = pool.acquire()
      const obj3 = pool.acquire()

      expect(obj1.id).not.toBe(obj2.id)
      expect(obj2.id).not.toBe(obj3.id)
      expect(obj1.id).not.toBe(obj3.id)
    })
  })

  describe('Release', () => {
    it('should release object back to pool', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 1)
      const obj = pool.acquire()

      expect(pool.getPoolSize().available).toBe(0)
      expect(pool.getPoolSize().inUse).toBe(1)

      pool.release(obj)

      expect(pool.getPoolSize().available).toBe(1)
      expect(pool.getPoolSize().inUse).toBe(0)
    })

    it('should call reset function on release', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 1)
      const obj = pool.acquire()
      pool.release(obj)

      expect(reset).toHaveBeenCalledWith(obj)
    })

    it('should not release object that is not in use', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 1)
      const otherObj = { value: 99 }

      pool.release(otherObj)

      // Should not add to available since it was never acquired
      expect(pool.getPoolSize().available).toBe(1)
      expect(reset).not.toHaveBeenCalled()
    })

    it('should allow re-acquiring released objects', () => {
      let counter = 0
      const factory = vi.fn(() => ({ id: ++counter }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 0)

      const obj1 = pool.acquire() // Creates object with id 1
      pool.release(obj1)

      const obj2 = pool.acquire() // Should reuse released object

      expect(obj2).toBe(obj1)
      expect(factory).toHaveBeenCalledTimes(1) // Only called once
    })
  })

  describe('Clear', () => {
    it('should clear all objects from pool', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 5)
      pool.acquire()
      pool.acquire()

      pool.clear()
      const size = pool.getPoolSize()

      expect(size.available).toBe(0)
      expect(size.inUse).toBe(0)
    })
  })

  describe('Pool Size', () => {
    it('should report correct pool size', () => {
      const factory = vi.fn(() => ({ value: 0 }))
      const reset = vi.fn()

      const pool = new ObjectPool(factory, reset, 10)

      pool.acquire()
      pool.acquire()
      pool.acquire()

      const size = pool.getPoolSize()

      expect(size.available).toBe(7)
      expect(size.inUse).toBe(3)
    })
  })
})
