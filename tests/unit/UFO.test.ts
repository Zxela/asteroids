/**
 * UFO Component Unit Tests
 *
 * Tests for UFO component and configuration:
 * - UFO_CONFIG collider radii
 * - UFO component instantiation
 * - UFO size types and properties
 */

import { describe, it, expect } from 'vitest'
import { UFO, UFO_CONFIG, type UFOSize } from '../../src/components/UFO'

describe('UFO Component', () => {
  describe('UFO_CONFIG', () => {
    it('should have large UFO with correct colliderRadius', () => {
      expect(UFO_CONFIG.large.colliderRadius).toBe(15)
    })

    it('should have small UFO with correct colliderRadius', () => {
      expect(UFO_CONFIG.small.colliderRadius).toBe(10)
    })

    it('should have correct speed values', () => {
      expect(UFO_CONFIG.large.speed).toBe(80)
      expect(UFO_CONFIG.small.speed).toBe(120)
    })

    it('should have correct shootInterval values', () => {
      expect(UFO_CONFIG.large.shootInterval).toBe(2000)
      expect(UFO_CONFIG.small.shootInterval).toBe(1500)
    })

    it('should have correct accuracy values', () => {
      expect(UFO_CONFIG.large.accuracy).toBe(0.3)
      expect(UFO_CONFIG.small.accuracy).toBe(0.8)
    })

    it('should have correct points values', () => {
      expect(UFO_CONFIG.large.points).toBe(200)
      expect(UFO_CONFIG.small.points).toBe(1000)
    })
  })

  describe('constructor', () => {
    it('should create large UFO with default values', () => {
      const ufo = new UFO('large')

      expect(ufo.type).toBe('ufo')
      expect(ufo.ufoSize).toBe('large')
      expect(ufo.shootTimer).toBe(UFO_CONFIG.large.shootInterval)
      expect(ufo.points).toBe(UFO_CONFIG.large.points)
    })

    it('should create small UFO with default values', () => {
      const ufo = new UFO('small')

      expect(ufo.type).toBe('ufo')
      expect(ufo.ufoSize).toBe('small')
      expect(ufo.shootTimer).toBe(UFO_CONFIG.small.shootInterval)
      expect(ufo.points).toBe(UFO_CONFIG.small.points)
    })

    it('should use default large UFO when no size specified', () => {
      const ufo = new UFO()

      expect(ufo.ufoSize).toBe('large')
      expect(ufo.shootTimer).toBe(UFO_CONFIG.large.shootInterval)
      expect(ufo.points).toBe(UFO_CONFIG.large.points)
    })

    it('should allow custom shootTimer', () => {
      const ufo = new UFO('large', 1000)

      expect(ufo.shootTimer).toBe(1000)
    })

    it('should support all UFO sizes', () => {
      const sizes: UFOSize[] = ['large', 'small']

      for (const size of sizes) {
        const ufo = new UFO(size)
        expect(ufo.ufoSize).toBe(size)
        expect(ufo.points).toBe(UFO_CONFIG[size].points)
      }
    })
  })

  describe('type property', () => {
    it('should have type "ufo"', () => {
      const ufo = new UFO()
      expect(ufo.type).toBe('ufo')
    })
  })
})
