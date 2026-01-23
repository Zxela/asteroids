/**
 * MeshFactory - Three.js mesh creation for game entities
 *
 * Creates procedural Three.js meshes for each entity type:
 * - Ship: Cone geometry pointing forward
 * - Asteroids: Icosahedron geometry with size variants
 * - Projectiles: Small sphere geometry
 * - Boss: Box/Octahedron geometry for boss variants
 * - Power-ups: Dodecahedron geometry
 *
 * Materials are created based on type: standard, transparent, emissive.
 */

import * as THREE from 'three'
import type { MaterialType, MeshType } from '../types/components'

// Asteroid radius constants for different sizes
const ASTEROID_LARGE_RADIUS = 30
const ASTEROID_MEDIUM_RADIUS = 20
const ASTEROID_SMALL_RADIUS = 10

/**
 * Create a mesh for the specified mesh type and material.
 *
 * @param meshType - The type of mesh to create
 * @param materialType - The material type to apply
 * @returns A Three.js Object3D with a unique UUID
 *
 * @example
 * ```typescript
 * const shipMesh = MeshFactory.createMesh('ship', 'standard');
 * const asteroidMesh = MeshFactory.createMesh('asteroid_large', 'standard');
 * ```
 */
function createMesh(meshType: MeshType, materialType: MaterialType): THREE.Object3D {
  const material = createMaterial(materialType)
  const mesh = createGeometry(meshType, material)
  mesh.uuid = THREE.MathUtils.generateUUID()
  return mesh
}

/**
 * Create geometry based on mesh type.
 */
function createGeometry(meshType: MeshType, material: THREE.Material): THREE.Object3D {
  switch (meshType) {
    case 'ship':
      return createShip(material)

    case 'asteroid_large':
      return createAsteroid(ASTEROID_LARGE_RADIUS, material)

    case 'asteroid_medium':
      return createAsteroid(ASTEROID_MEDIUM_RADIUS, material)

    case 'asteroid_small':
      return createAsteroid(ASTEROID_SMALL_RADIUS, material)

    case 'projectile_default':
    case 'projectile_spread':
      return createProjectile(material)

    case 'projectile_laser':
      return createLaserProjectile(material)

    case 'projectile_missile':
      return createMissileProjectile(material)

    case 'boss_destroyer':
      return createBossDestroyer(material)

    case 'boss_carrier':
      return createBossCarrier(material)

    case 'powerup_shield':
    case 'powerup_rapidfire':
    case 'powerup_multishot':
    case 'powerup_extralife':
      return createPowerUp(meshType, material)

    default:
      return createDefault(material)
  }
}

/**
 * Create ship mesh - cone pointing forward.
 */
function createShip(material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.ConeGeometry(5, 20, 8)
  const mesh = new THREE.Mesh(geometry, material)
  // Rotate so cone points in positive X direction (forward)
  mesh.rotation.z = -Math.PI / 2
  return mesh
}

/**
 * Create asteroid mesh - icosahedron with specified radius.
 */
function createAsteroid(radius: number, material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.IcosahedronGeometry(radius, 1)
  return new THREE.Mesh(geometry, material)
}

/**
 * Create projectile mesh - small sphere.
 */
function createProjectile(material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(2, 8, 8)
  return new THREE.Mesh(geometry, material)
}

/**
 * Create laser projectile mesh - elongated cylinder.
 */
function createLaserProjectile(material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(1, 1, 15, 8)
  const mesh = new THREE.Mesh(geometry, material)
  // Rotate to point forward
  mesh.rotation.z = Math.PI / 2
  return mesh
}

/**
 * Create missile projectile mesh - small cone.
 */
function createMissileProjectile(material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.ConeGeometry(2, 8, 6)
  const mesh = new THREE.Mesh(geometry, material)
  // Rotate to point forward
  mesh.rotation.z = -Math.PI / 2
  return mesh
}

/**
 * Create boss destroyer mesh - large box.
 */
function createBossDestroyer(material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(40, 40, 40)
  return new THREE.Mesh(geometry, material)
}

/**
 * Create boss carrier mesh - octahedron.
 */
function createBossCarrier(material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.OctahedronGeometry(35, 1)
  return new THREE.Mesh(geometry, material)
}

/**
 * Create power-up mesh - dodecahedron.
 */
function createPowerUp(meshType: MeshType, material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.DodecahedronGeometry(8, 0)
  const mesh = new THREE.Mesh(geometry, material)
  // Store powerup type for later reference (animation, color)
  mesh.userData.powerupType = meshType.replace('powerup_', '')
  return mesh
}

/**
 * Create default mesh - sphere for unknown types.
 */
function createDefault(material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(10, 16, 16)
  return new THREE.Mesh(geometry, material)
}

/**
 * Create material based on material type.
 */
function createMaterial(materialType: MaterialType): THREE.Material {
  switch (materialType) {
    case 'standard':
      return new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x222222,
        shininess: 100
      })

    case 'transparent':
      return new THREE.MeshPhongMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.7
      })

    case 'emissive':
      return new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.5
      })

    default:
      return new THREE.MeshPhongMaterial({ color: 0x888888 })
  }
}

/**
 * MeshFactory namespace for creating Three.js meshes for game entities.
 * Exposes the createMesh function as a static-like interface.
 */
export const MeshFactory = {
  createMesh
}
