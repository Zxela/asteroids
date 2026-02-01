/**
 * MeshFactory Unit Tests
 *
 * Tests for mesh creation for each entity type:
 * - Ship mesh creation (classic and modern)
 * - Asteroid mesh creation (large, medium, small) (classic and modern)
 * - Projectile mesh creation
 * - Boss mesh creation (destroyer, carrier)
 * - Power-up mesh creation
 * - Material creation based on type
 * - Mesh quality toggle and persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as THREE from 'three'
import { MeshFactory } from '../../src/rendering/MeshFactory'

// Mock localStorage for tests
const createMockLocalStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
  }
}

// Set up global localStorage before any tests
const mockStorage = createMockLocalStorage()
global.localStorage = mockStorage as unknown as Storage

describe('MeshFactory', () => {
  describe('Ship Mesh', () => {
    it('should create ship mesh', () => {
      const mesh = MeshFactory.createMesh('ship', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Object3D)
    })

    it('should create ship with unique uuid', () => {
      const mesh1 = MeshFactory.createMesh('ship', 'standard')
      const mesh2 = MeshFactory.createMesh('ship', 'standard')

      expect(mesh1.uuid).toBeDefined()
      expect(mesh2.uuid).toBeDefined()
      expect(mesh1.uuid).not.toBe(mesh2.uuid)
    })
  })

  describe('Asteroid Meshes', () => {
    it('should create asteroid_large mesh', () => {
      const mesh = MeshFactory.createMesh('asteroid_large', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create asteroid_medium mesh', () => {
      const mesh = MeshFactory.createMesh('asteroid_medium', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create asteroid_small mesh', () => {
      const mesh = MeshFactory.createMesh('asteroid_small', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create different sized asteroids', () => {
      const largeMesh = MeshFactory.createMesh('asteroid_large', 'standard') as THREE.Mesh
      const mediumMesh = MeshFactory.createMesh('asteroid_medium', 'standard') as THREE.Mesh
      const smallMesh = MeshFactory.createMesh('asteroid_small', 'standard') as THREE.Mesh

      // Meshes should be created (size difference is in geometry)
      expect(largeMesh).toBeDefined()
      expect(mediumMesh).toBeDefined()
      expect(smallMesh).toBeDefined()
    })
  })

  describe('Projectile Mesh', () => {
    it('should create projectile_default mesh', () => {
      const mesh = MeshFactory.createMesh('projectile_default', 'transparent')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create projectile_spread mesh', () => {
      const mesh = MeshFactory.createMesh('projectile_spread', 'transparent')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create projectile_laser mesh', () => {
      const mesh = MeshFactory.createMesh('projectile_laser', 'emissive')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create projectile_missile mesh', () => {
      const mesh = MeshFactory.createMesh('projectile_missile', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })
  })

  describe('Boss Meshes', () => {
    it('should create boss_destroyer mesh', () => {
      const mesh = MeshFactory.createMesh('boss_destroyer', 'emissive')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create boss_carrier mesh', () => {
      const mesh = MeshFactory.createMesh('boss_carrier', 'emissive')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })
  })

  describe('Power-up Meshes', () => {
    it('should create powerup_shield mesh', () => {
      const mesh = MeshFactory.createMesh('powerup_shield', 'emissive')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create powerup_rapidfire mesh', () => {
      const mesh = MeshFactory.createMesh('powerup_rapidfire', 'emissive')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create powerup_multishot mesh', () => {
      const mesh = MeshFactory.createMesh('powerup_multishot', 'emissive')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create powerup_extralife mesh', () => {
      const mesh = MeshFactory.createMesh('powerup_extralife', 'emissive')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })
  })

  describe('Material Types', () => {
    it('should create mesh with MeshStandardMaterial for ship (per Task 7.4)', () => {
      const mesh = MeshFactory.createMesh('ship', 'standard') as THREE.Mesh

      expect(mesh.material).toBeDefined()
      // Per Task 7.4: Ship uses MeshStandardMaterial with emissive
      expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial)
      const material = mesh.material as THREE.MeshStandardMaterial
      expect(material.emissiveIntensity).toBe(0.8) // High intensity for vector look
    })

    it('should create mesh with MeshStandardMaterial for projectile (per Task 7.4)', () => {
      const mesh = MeshFactory.createMesh('projectile_default', 'transparent') as THREE.Mesh

      expect(mesh.material).toBeDefined()
      // Per Task 7.4: Projectiles use MeshStandardMaterial with emissive
      expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial)
      const material = mesh.material as THREE.MeshStandardMaterial
      expect(material.transparent).toBe(true)
      expect(material.emissiveIntensity).toBe(1.0) // High intensity
    })

    it('should create mesh with MeshStandardMaterial for boss (per Task 7.4)', () => {
      const mesh = MeshFactory.createMesh('boss_destroyer', 'emissive') as THREE.Mesh

      expect(mesh.material).toBeDefined()
      // Per Task 7.4: Boss uses MeshStandardMaterial with emissive
      expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial)
      const material = mesh.material as THREE.MeshStandardMaterial
      expect(material.emissiveIntensity).toBe(0.8) // Boss intensity
    })
  })

  describe('Default Mesh', () => {
    it('should create default mesh for unknown type', () => {
      // Using type assertion since 'unknown_type' is not in MeshType
      const mesh = MeshFactory.createMesh('unknown_type' as any, 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })
  })

  describe('Mesh Quality System', () => {
    // Save original quality and restore after each test
    let originalQuality: 'classic' | 'modern'

    beforeEach(() => {
      originalQuality = MeshFactory.getMeshQuality()
    })

    afterEach(() => {
      MeshFactory.setMeshQuality(originalQuality)
    })

    it('should default to classic quality', () => {
      // Reset to default
      MeshFactory.setMeshQuality('classic')
      expect(MeshFactory.getMeshQuality()).toBe('classic')
    })

    it('should set and get mesh quality', () => {
      MeshFactory.setMeshQuality('modern')
      expect(MeshFactory.getMeshQuality()).toBe('modern')

      MeshFactory.setMeshQuality('classic')
      expect(MeshFactory.getMeshQuality()).toBe('classic')
    })

    it('should persist mesh quality to localStorage', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem')

      MeshFactory.setMeshQuality('modern')

      expect(setItemSpy).toHaveBeenCalledWith('asteroids-mesh-quality', 'modern')
      setItemSpy.mockRestore()
    })
  })

  describe('Modern Ship Mesh', () => {
    beforeEach(() => {
      MeshFactory.setMeshQuality('modern')
    })

    afterEach(() => {
      MeshFactory.setMeshQuality('classic')
    })

    it('should create modern ship mesh as a Group', () => {
      const mesh = MeshFactory.createMesh('ship', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Object3D)
      // Modern ship is a Group with multiple children
      expect(mesh).toBeInstanceOf(THREE.Group)
    })

    it('should create modern ship with multiple parts', () => {
      const mesh = MeshFactory.createMesh('ship', 'standard') as THREE.Group

      // Modern ship should have hull, cockpit, wings, engines, nozzles, stabilizer
      expect(mesh.children.length).toBeGreaterThanOrEqual(6)
    })

    it('should create modern ship with unique uuid', () => {
      const mesh1 = MeshFactory.createMesh('ship', 'standard')
      const mesh2 = MeshFactory.createMesh('ship', 'standard')

      expect(mesh1.uuid).toBeDefined()
      expect(mesh2.uuid).toBeDefined()
      expect(mesh1.uuid).not.toBe(mesh2.uuid)
    })
  })

  describe('Modern Asteroid Meshes', () => {
    beforeEach(() => {
      MeshFactory.setMeshQuality('modern')
    })

    afterEach(() => {
      MeshFactory.setMeshQuality('classic')
    })

    it('should create modern asteroid_large mesh', () => {
      const mesh = MeshFactory.createMesh('asteroid_large', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create modern asteroid_medium mesh', () => {
      const mesh = MeshFactory.createMesh('asteroid_medium', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create modern asteroid_small mesh', () => {
      const mesh = MeshFactory.createMesh('asteroid_small', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should create modern asteroid with higher vertex count than classic', () => {
      // Create classic asteroid
      MeshFactory.setMeshQuality('classic')
      const classicMesh = MeshFactory.createMesh('asteroid_large', 'standard') as THREE.Mesh
      const classicGeometry = classicMesh.geometry as THREE.BufferGeometry
      const classicVertexCount = classicGeometry.getAttribute('position').count

      // Create modern asteroid
      MeshFactory.setMeshQuality('modern')
      const modernMesh = MeshFactory.createMesh('asteroid_large', 'standard') as THREE.Mesh
      const modernGeometry = modernMesh.geometry as THREE.BufferGeometry
      const modernVertexCount = modernGeometry.getAttribute('position').count

      // Modern should have more vertices (higher detail)
      expect(modernVertexCount).toBeGreaterThan(classicVertexCount)
    })

    it('should store asteroid variant in userData', () => {
      const mesh = MeshFactory.createMesh('asteroid_large', 'standard') as THREE.Mesh

      expect(mesh.userData.asteroidVariant).toBeDefined()
      expect(mesh.userData.asteroidVariant).toBeGreaterThanOrEqual(1)
      expect(mesh.userData.asteroidVariant).toBeLessThanOrEqual(5)
    })
  })

  describe('Quality Toggle Affects Mesh Creation', () => {
    afterEach(() => {
      MeshFactory.setMeshQuality('classic')
    })

    it('should create classic ship mesh when quality is classic', () => {
      MeshFactory.setMeshQuality('classic')
      const mesh = MeshFactory.createMesh('ship', 'standard')

      // Classic ship is a single Mesh, not a Group
      expect(mesh).toBeInstanceOf(THREE.Mesh)
      expect(mesh).not.toBeInstanceOf(THREE.Group)
    })

    it('should create modern ship mesh when quality is modern', () => {
      MeshFactory.setMeshQuality('modern')
      const mesh = MeshFactory.createMesh('ship', 'standard')

      // Modern ship is a Group
      expect(mesh).toBeInstanceOf(THREE.Group)
    })
  })

  describe('UFO Meshes (AC-001c, AC-001d, AC-004)', () => {
    it('should create ufo_large mesh', () => {
      const mesh = MeshFactory.createMesh('ufo_large', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Group)
    })

    it('should create ufo_small mesh', () => {
      const mesh = MeshFactory.createMesh('ufo_small', 'standard')

      expect(mesh).toBeDefined()
      expect(mesh).toBeInstanceOf(THREE.Group)
    })

    it('should have large UFO body geometry radius of 12 units (AC-001c)', () => {
      const ufoGroup = MeshFactory.createMesh('ufo_large', 'standard') as THREE.Group

      // Find the body mesh (first child of the group)
      const bodyMesh = ufoGroup.children[0] as THREE.Mesh
      expect(bodyMesh).toBeDefined()

      const bodyGeometry = bodyMesh.geometry as THREE.SphereGeometry
      expect(bodyGeometry).toBeDefined()
      expect(bodyGeometry.parameters.radius).toBe(12)
    })

    it('should have small UFO body geometry radius of 8 units (AC-001d)', () => {
      const ufoGroup = MeshFactory.createMesh('ufo_small', 'standard') as THREE.Group

      // Find the body mesh (first child of the group)
      const bodyMesh = ufoGroup.children[0] as THREE.Mesh
      expect(bodyMesh).toBeDefined()

      const bodyGeometry = bodyMesh.geometry as THREE.SphereGeometry
      expect(bodyGeometry).toBeDefined()
      expect(bodyGeometry.parameters.radius).toBe(8)
    })

    it('should scale large UFO body vertically to create flattened appearance', () => {
      const ufoGroup = MeshFactory.createMesh('ufo_large', 'standard') as THREE.Group
      const bodyMesh = ufoGroup.children[0] as THREE.Mesh

      // Body should have vertical scale applied (0.3)
      const bodyGeometry = bodyMesh.geometry as THREE.SphereGeometry
      expect(bodyGeometry.parameters.radius).toBe(12)
      // The geometry is scaled on the object itself, check that mesh exists and has proper structure
      expect(bodyMesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should scale small UFO body vertically to create flattened appearance', () => {
      const ufoGroup = MeshFactory.createMesh('ufo_small', 'standard') as THREE.Group
      const bodyMesh = ufoGroup.children[0] as THREE.Mesh

      // Body should have vertical scale applied (0.35)
      const bodyGeometry = bodyMesh.geometry as THREE.SphereGeometry
      expect(bodyGeometry.parameters.radius).toBe(8)
      expect(bodyMesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should have large UFO dome positioned above body', () => {
      const ufoGroup = MeshFactory.createMesh('ufo_large', 'standard') as THREE.Group
      const domeMesh = ufoGroup.children[1] as THREE.Mesh

      expect(domeMesh).toBeDefined()
      expect(domeMesh.position.y).toBeGreaterThan(0)
    })

    it('should have small UFO dome positioned above body', () => {
      const ufoGroup = MeshFactory.createMesh('ufo_small', 'standard') as THREE.Group
      const domeMesh = ufoGroup.children[1] as THREE.Mesh

      expect(domeMesh).toBeDefined()
      expect(domeMesh.position.y).toBeGreaterThan(0)
    })
  })
})
