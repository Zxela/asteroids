/**
 * Starfield Unit Tests
 *
 * Tests for the static star background with parallax effect.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { Starfield } from '../../src/rendering/Starfield'

describe('Starfield', () => {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let starfield: Starfield

  beforeEach(() => {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
    camera.position.set(0, 0, 500)
  })

  describe('Initialization', () => {
    it('should create starfield with default configuration', () => {
      starfield = new Starfield(scene, camera)

      expect(starfield).toBeDefined()
      expect(starfield.getStarCount()).toBe(500)
    })

    it('should create starfield with custom star count', () => {
      starfield = new Starfield(scene, camera, { starCount: 100 })

      expect(starfield.getStarCount()).toBe(100)
    })

    it('should add points to scene', () => {
      starfield = new Starfield(scene, camera)

      const points = starfield.getPoints()
      expect(scene.children).toContain(points)
    })

    it('should create points with correct position count', () => {
      starfield = new Starfield(scene, camera, { starCount: 100 })

      const points = starfield.getPoints()
      const geometry = points.geometry as THREE.BufferGeometry
      const positionAttribute = geometry.getAttribute('position')

      // 100 stars * 3 components (x, y, z) = 300 values
      expect(positionAttribute.count).toBe(100)
    })

    it('should position starfield behind game plane', () => {
      starfield = new Starfield(scene, camera)

      const points = starfield.getPoints()
      expect(points.position.z).toBeLessThan(0)
    })
  })

  describe('Star Positions', () => {
    it('should generate stars within specified width bounds', () => {
      const width = 1000
      starfield = new Starfield(scene, camera, { starCount: 100, width })

      const points = starfield.getPoints()
      const geometry = points.geometry as THREE.BufferGeometry
      const positions = geometry.getAttribute('position').array as Float32Array

      for (let i = 0; i < 100; i++) {
        const x = positions[i * 3]
        expect(x).toBeGreaterThanOrEqual(-width / 2)
        expect(x).toBeLessThanOrEqual(width / 2)
      }
    })

    it('should generate stars within specified height bounds', () => {
      const height = 1000
      starfield = new Starfield(scene, camera, { starCount: 100, height })

      const points = starfield.getPoints()
      const geometry = points.geometry as THREE.BufferGeometry
      const positions = geometry.getAttribute('position').array as Float32Array

      for (let i = 0; i < 100; i++) {
        const y = positions[i * 3 + 1]
        expect(y).toBeGreaterThanOrEqual(-height / 2)
        expect(y).toBeLessThanOrEqual(height / 2)
      }
    })

    it('should generate stars with negative Z values (behind plane)', () => {
      const depth = 500
      starfield = new Starfield(scene, camera, { starCount: 100, depth })

      const points = starfield.getPoints()
      const geometry = points.geometry as THREE.BufferGeometry
      const positions = geometry.getAttribute('position').array as Float32Array

      for (let i = 0; i < 100; i++) {
        const z = positions[i * 3 + 2]
        expect(z).toBeLessThanOrEqual(0)
        expect(z).toBeGreaterThanOrEqual(-depth)
      }
    })
  })

  describe('Material Properties', () => {
    it('should have white color', () => {
      starfield = new Starfield(scene, camera)

      const points = starfield.getPoints()
      const material = points.material as THREE.PointsMaterial
      expect(material.color.getHex()).toBe(0xffffff)
    })

    it('should have transparency enabled', () => {
      starfield = new Starfield(scene, camera)

      const points = starfield.getPoints()
      const material = points.material as THREE.PointsMaterial
      expect(material.transparent).toBe(true)
    })

    it('should use additive blending', () => {
      starfield = new Starfield(scene, camera)

      const points = starfield.getPoints()
      const material = points.material as THREE.PointsMaterial
      expect(material.blending).toBe(THREE.AdditiveBlending)
    })
  })

  describe('Parallax Effect', () => {
    it('should not modify positions when parallax is disabled', () => {
      starfield = new Starfield(scene, camera, {
        starCount: 10,
        parallaxFactor: 0
      })

      const points = starfield.getPoints()
      const geometry = points.geometry as THREE.BufferGeometry
      const positions = geometry.getAttribute('position').array as Float32Array
      const initialPositions = new Float32Array(positions)

      // Move camera
      camera.position.x = 100
      camera.position.y = 100

      // Update
      starfield.update(16)

      // Positions should remain unchanged
      for (let i = 0; i < positions.length; i++) {
        expect(positions[i]).toBe(initialPositions[i])
      }
    })

    it('should modify positions based on camera movement when parallax enabled', () => {
      starfield = new Starfield(scene, camera, {
        starCount: 10,
        parallaxFactor: 0.5
      })

      const points = starfield.getPoints()
      const geometry = points.geometry as THREE.BufferGeometry
      const positions = geometry.getAttribute('position').array as Float32Array
      const initialPositions = new Float32Array(positions)

      // Move camera significantly
      camera.position.x = 100
      camera.position.y = 100

      // Update
      starfield.update(16)

      // At least some positions should change (X and Y components)
      let hasChanged = false
      for (let i = 0; i < 10; i++) {
        const i3 = i * 3
        if (
          positions[i3] !== initialPositions[i3] ||
          positions[i3 + 1] !== initialPositions[i3 + 1]
        ) {
          hasChanged = true
          break
        }
      }
      expect(hasChanged).toBe(true)
    })

    it('should mark position attribute as needing update', () => {
      starfield = new Starfield(scene, camera, {
        starCount: 10,
        parallaxFactor: 0.5
      })

      const points = starfield.getPoints()
      const geometry = points.geometry as THREE.BufferGeometry
      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute

      // Get initial version (Three.js increments version when needsUpdate = true)
      const initialVersion = positionAttribute.version

      // Move camera
      camera.position.x = 100
      starfield.update(16)

      // Version should have incremented (needsUpdate = true was called)
      expect(positionAttribute.version).toBeGreaterThan(initialVersion)
    })
  })

  describe('Disposal', () => {
    it('should remove points from scene on dispose', () => {
      starfield = new Starfield(scene, camera)

      const points = starfield.getPoints()
      expect(scene.children).toContain(points)

      starfield.dispose()

      expect(scene.children).not.toContain(points)
    })

    it('should dispose geometry on dispose', () => {
      starfield = new Starfield(scene, camera)

      const points = starfield.getPoints()
      const geometry = points.geometry as THREE.BufferGeometry
      const disposeSpy = vi.spyOn(geometry, 'dispose')

      starfield.dispose()

      expect(disposeSpy).toHaveBeenCalled()
    })

    it('should dispose material on dispose', () => {
      starfield = new Starfield(scene, camera)

      const points = starfield.getPoints()
      const material = points.material as THREE.PointsMaterial
      const disposeSpy = vi.spyOn(material, 'dispose')

      starfield.dispose()

      expect(disposeSpy).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero star count', () => {
      starfield = new Starfield(scene, camera, { starCount: 0 })

      expect(starfield.getStarCount()).toBe(0)
    })

    it('should handle very large star count', () => {
      starfield = new Starfield(scene, camera, { starCount: 10000 })

      expect(starfield.getStarCount()).toBe(10000)
    })

    it('should handle update with zero delta time', () => {
      starfield = new Starfield(scene, camera, { parallaxFactor: 0.5 })

      expect(() => {
        starfield.update(0)
      }).not.toThrow()
    })

    it('should handle camera at origin', () => {
      camera.position.set(0, 0, 0)
      starfield = new Starfield(scene, camera, { parallaxFactor: 0.5 })

      expect(() => {
        starfield.update(16)
      }).not.toThrow()
    })
  })
})
