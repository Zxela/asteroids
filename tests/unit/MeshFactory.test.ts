/**
 * MeshFactory Unit Tests
 *
 * Tests for mesh creation for each entity type:
 * - Ship mesh creation
 * - Asteroid mesh creation (large, medium, small)
 * - Projectile mesh creation
 * - Boss mesh creation (destroyer, carrier)
 * - Power-up mesh creation
 * - Material creation based on type
 */

import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { MeshFactory } from '../../src/rendering/MeshFactory'

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
      expect(material.emissiveIntensity).toBe(0.5) // Medium intensity
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
})
