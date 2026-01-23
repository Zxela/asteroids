/**
 * Unit tests for utility functions
 *
 * Tests math utilities, random generation, and EventEmitter.
 * Following TDD: Red phase - create failing tests first.
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import * as THREE from "three"

// ============================================
// Math Utilities Tests
// ============================================

describe("Math Utilities", () => {
  describe("normalizeVector2", () => {
    it("returns unit vector for non-zero vector", async () => {
      const { normalizeVector2 } = await import("../../src/utils/math")
      const v = new THREE.Vector2(3, 4)
      const result = normalizeVector2(v)

      expect(result.length()).toBeCloseTo(1, 5)
      expect(result.x).toBeCloseTo(0.6, 5)
      expect(result.y).toBeCloseTo(0.8, 5)
    })

    it("returns [0,0] for zero vector", async () => {
      const { normalizeVector2 } = await import("../../src/utils/math")
      const v = new THREE.Vector2(0, 0)
      const result = normalizeVector2(v)

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it("does not mutate the original vector", async () => {
      const { normalizeVector2 } = await import("../../src/utils/math")
      const v = new THREE.Vector2(3, 4)
      normalizeVector2(v)

      expect(v.x).toBe(3)
      expect(v.y).toBe(4)
    })
  })

  describe("distance", () => {
    it("returns correct Euclidean distance for Vector2", async () => {
      const { distance } = await import("../../src/utils/math")
      const a = new THREE.Vector2(0, 0)
      const b = new THREE.Vector2(3, 4)

      expect(distance(a, b)).toBeCloseTo(5, 5)
    })

    it("returns correct Euclidean distance for Vector3", async () => {
      const { distance } = await import("../../src/utils/math")
      const a = new THREE.Vector3(0, 0, 0)
      const b = new THREE.Vector3(1, 2, 2)

      expect(distance(a, b)).toBeCloseTo(3, 5)
    })

    it("returns 0 for same point", async () => {
      const { distance } = await import("../../src/utils/math")
      const a = new THREE.Vector2(5, 5)
      const b = new THREE.Vector2(5, 5)

      expect(distance(a, b)).toBe(0)
    })
  })

  describe("magnitude", () => {
    it("returns correct length for Vector2", async () => {
      const { magnitude } = await import("../../src/utils/math")
      const v = new THREE.Vector2(3, 4)

      expect(magnitude(v)).toBeCloseTo(5, 5)
    })

    it("returns correct length for Vector3", async () => {
      const { magnitude } = await import("../../src/utils/math")
      const v = new THREE.Vector3(1, 2, 2)

      expect(magnitude(v)).toBeCloseTo(3, 5)
    })

    it("returns 0 for zero vector", async () => {
      const { magnitude } = await import("../../src/utils/math")
      const v = new THREE.Vector2(0, 0)

      expect(magnitude(v)).toBe(0)
    })
  })

  describe("angleBetween", () => {
    it("returns angle in radians between two vectors", async () => {
      const { angleBetween } = await import("../../src/utils/math")
      const a = new THREE.Vector2(1, 0) // pointing right (0 radians)
      const b = new THREE.Vector2(0, 1) // pointing up (PI/2 radians)

      expect(angleBetween(a, b)).toBeCloseTo(Math.PI / 2, 5)
    })

    it("returns negative angle for clockwise rotation", async () => {
      const { angleBetween } = await import("../../src/utils/math")
      const a = new THREE.Vector2(0, 1) // pointing up
      const b = new THREE.Vector2(1, 0) // pointing right

      expect(angleBetween(a, b)).toBeCloseTo(-Math.PI / 2, 5)
    })

    it("returns 0 for same direction", async () => {
      const { angleBetween } = await import("../../src/utils/math")
      const a = new THREE.Vector2(1, 0)
      const b = new THREE.Vector2(2, 0)

      expect(angleBetween(a, b)).toBeCloseTo(0, 5)
    })
  })

  describe("wrapAngle", () => {
    it("wraps angle to [0, 2*PI] range", async () => {
      const { wrapAngle } = await import("../../src/utils/math")

      expect(wrapAngle(0)).toBeCloseTo(0, 5)
      expect(wrapAngle(Math.PI)).toBeCloseTo(Math.PI, 5)
      expect(wrapAngle(2 * Math.PI)).toBeCloseTo(0, 5)
    })

    it("wraps negative angles correctly", async () => {
      const { wrapAngle } = await import("../../src/utils/math")

      expect(wrapAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 5)
      expect(wrapAngle(-Math.PI)).toBeCloseTo(Math.PI, 5)
    })

    it("wraps angles greater than 2*PI", async () => {
      const { wrapAngle } = await import("../../src/utils/math")

      expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 5)
      expect(wrapAngle(4 * Math.PI)).toBeCloseTo(0, 5)
    })
  })

  describe("clamp", () => {
    it("restricts value to range", async () => {
      const { clamp } = await import("../../src/utils/math")

      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it("handles edge cases at boundaries", async () => {
      const { clamp } = await import("../../src/utils/math")

      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })

    it("works with negative ranges", async () => {
      const { clamp } = await import("../../src/utils/math")

      expect(clamp(-5, -10, -1)).toBe(-5)
      expect(clamp(0, -10, -1)).toBe(-1)
    })
  })

  describe("lerp", () => {
    it("interpolates between two values", async () => {
      const { lerp } = await import("../../src/utils/math")

      expect(lerp(0, 10, 0)).toBe(0)
      expect(lerp(0, 10, 1)).toBe(10)
      expect(lerp(0, 10, 0.5)).toBe(5)
    })

    it("handles negative values", async () => {
      const { lerp } = await import("../../src/utils/math")

      expect(lerp(-10, 10, 0.5)).toBe(0)
      expect(lerp(-10, 10, 0.25)).toBe(-5)
    })

    it("extrapolates beyond 0-1 range", async () => {
      const { lerp } = await import("../../src/utils/math")

      expect(lerp(0, 10, 1.5)).toBe(15)
      expect(lerp(0, 10, -0.5)).toBe(-5)
    })
  })
})

// ============================================
// Random Utilities Tests
// ============================================

describe("Random Utilities", () => {
  describe("randomRange", () => {
    it("returns value within range", async () => {
      const { randomRange } = await import("../../src/utils/random")

      for (let i = 0; i < 100; i++) {
        const result = randomRange(0, 10)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(10)
      }
    })

    it("produces reproducible results with seed", async () => {
      const { randomRange, setSeed } = await import("../../src/utils/random")

      setSeed(12345)
      const result1 = randomRange(0, 100)

      setSeed(12345)
      const result2 = randomRange(0, 100)

      expect(result1).toBe(result2)
    })

    it("handles negative ranges", async () => {
      const { randomRange } = await import("../../src/utils/random")

      for (let i = 0; i < 100; i++) {
        const result = randomRange(-10, -5)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-5)
      }
    })
  })

  describe("randomInt", () => {
    it("returns integer within range (inclusive)", async () => {
      const { randomInt } = await import("../../src/utils/random")

      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 6)
        expect(Number.isInteger(result)).toBe(true)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(6)
      }
    })

    it("can return min and max values", async () => {
      const { randomInt, setSeed } = await import("../../src/utils/random")
      const results = new Set<number>()

      // Run many times to ensure we can hit both bounds
      for (let i = 0; i < 1000; i++) {
        setSeed(i)
        results.add(randomInt(1, 3))
      }

      expect(results.has(1)).toBe(true)
      expect(results.has(3)).toBe(true)
    })
  })

  describe("randomDirection", () => {
    it("returns normalized Vector2", async () => {
      const { randomDirection } = await import("../../src/utils/random")

      for (let i = 0; i < 100; i++) {
        const result = randomDirection()
        expect(result.length()).toBeCloseTo(1, 5)
      }
    })

    it("produces various directions", async () => {
      const { randomDirection, setSeed } = await import("../../src/utils/random")
      const directions: THREE.Vector2[] = []

      for (let i = 0; i < 10; i++) {
        setSeed(i * 1000)
        directions.push(randomDirection())
      }

      // Verify we get different directions
      const uniqueAngles = new Set(
        directions.map((d) => Math.round(Math.atan2(d.y, d.x) * 100) / 100)
      )
      expect(uniqueAngles.size).toBeGreaterThan(1)
    })
  })

  describe("randomChoice", () => {
    it("returns element from array", async () => {
      const { randomChoice } = await import("../../src/utils/random")
      const array = ["a", "b", "c", "d"]

      for (let i = 0; i < 100; i++) {
        const result = randomChoice(array)
        expect(array).toContain(result)
      }
    })

    it("can return any element with different seeds", async () => {
      const { randomChoice, setSeed } = await import("../../src/utils/random")
      const array = [1, 2, 3]
      const results = new Set<number>()

      for (let i = 0; i < 1000; i++) {
        setSeed(i)
        results.add(randomChoice(array))
      }

      expect(results.has(1)).toBe(true)
      expect(results.has(2)).toBe(true)
      expect(results.has(3)).toBe(true)
    })
  })

  describe("Seeded random reproducibility", () => {
    it("produces same sequence after setSeed", async () => {
      const { randomRange, setSeed } = await import("../../src/utils/random")

      setSeed(42)
      const seq1 = [
        randomRange(0, 100),
        randomRange(0, 100),
        randomRange(0, 100),
      ]

      setSeed(42)
      const seq2 = [
        randomRange(0, 100),
        randomRange(0, 100),
        randomRange(0, 100),
      ]

      expect(seq1).toEqual(seq2)
    })

    it("different seeds produce different sequences", async () => {
      const { randomRange, setSeed } = await import("../../src/utils/random")

      setSeed(1)
      const result1 = randomRange(0, 100)

      setSeed(2)
      const result2 = randomRange(0, 100)

      expect(result1).not.toBe(result2)
    })
  })
})

// ============================================
// EventEmitter Tests
// ============================================

describe("EventEmitter", () => {
  describe("instantiation", () => {
    it("can be instantiated", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter()

      expect(emitter).toBeDefined()
      expect(emitter).toBeInstanceOf(EventEmitter)
    })
  })

  describe("on", () => {
    it("registers listener", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string }>()
      const handler = vi.fn()

      emitter.on("test", handler)
      emitter.emit("test", "data")

      expect(handler).toHaveBeenCalledWith("data")
    })
  })

  describe("emit", () => {
    it("calls all registered listeners", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string }>()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      emitter.on("test", handler1)
      emitter.on("test", handler2)
      emitter.emit("test", "data")

      expect(handler1).toHaveBeenCalledWith("data")
      expect(handler2).toHaveBeenCalledWith("data")
    })

    it("does not call handlers for different event types", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string; other: number }>()
      const handler = vi.fn()

      emitter.on("test", handler)
      emitter.emit("other", 42)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe("off", () => {
    it("unregisters listener", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string }>()
      const handler = vi.fn()

      emitter.on("test", handler)
      emitter.off("test", handler)
      emitter.emit("test", "data")

      expect(handler).not.toHaveBeenCalled()
    })

    it("only removes the specific handler", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string }>()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      emitter.on("test", handler1)
      emitter.on("test", handler2)
      emitter.off("test", handler1)
      emitter.emit("test", "data")

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledWith("data")
    })
  })

  describe("multiple listeners", () => {
    it("all listeners for same event are called", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string }>()
      const handlers = [vi.fn(), vi.fn(), vi.fn()]

      handlers.forEach((h) => emitter.on("test", h))
      emitter.emit("test", "data")

      handlers.forEach((h) => {
        expect(h).toHaveBeenCalledTimes(1)
        expect(h).toHaveBeenCalledWith("data")
      })
    })
  })

  describe("listener receives emitted data", () => {
    it("passes complex data to handler", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{
        collision: { entityA: number; entityB: number }
      }>()
      const handler = vi.fn()

      emitter.on("collision", handler)
      emitter.emit("collision", { entityA: 1, entityB: 2 })

      expect(handler).toHaveBeenCalledWith({ entityA: 1, entityB: 2 })
    })
  })

  describe("listeners can unregister during emit", () => {
    it("handles unregistration during emit without errors", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string }>()

      const handler1 = vi.fn(() => {
        emitter.off("test", handler1)
      })
      const handler2 = vi.fn()

      emitter.on("test", handler1)
      emitter.on("test", handler2)

      // Should not throw and handler2 should still be called
      expect(() => emitter.emit("test", "data")).not.toThrow()
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      // Second emit - handler1 should not be called (unregistered)
      emitter.emit("test", "data2")
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(2)
    })
  })

  describe("clear", () => {
    it("clears all listeners for a specific event", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string; other: number }>()
      const testHandler = vi.fn()
      const otherHandler = vi.fn()

      emitter.on("test", testHandler)
      emitter.on("other", otherHandler)
      emitter.clear("test")

      emitter.emit("test", "data")
      emitter.emit("other", 42)

      expect(testHandler).not.toHaveBeenCalled()
      expect(otherHandler).toHaveBeenCalledWith(42)
    })

    it("clears all listeners when called without argument", async () => {
      const { EventEmitter } = await import("../../src/utils/EventEmitter")
      const emitter = new EventEmitter<{ test: string; other: number }>()
      const testHandler = vi.fn()
      const otherHandler = vi.fn()

      emitter.on("test", testHandler)
      emitter.on("other", otherHandler)
      emitter.clear()

      emitter.emit("test", "data")
      emitter.emit("other", 42)

      expect(testHandler).not.toHaveBeenCalled()
      expect(otherHandler).not.toHaveBeenCalled()
    })
  })
})
