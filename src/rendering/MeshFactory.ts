/**
 * MeshFactory - Three.js mesh creation for game entities
 *
 * Creates procedural Three.js meshes for each entity type:
 * - Ship: Cone geometry pointing forward with blue emissive
 * - Asteroids: Icosahedron geometry with cyan emissive glow
 * - Projectiles: Small sphere geometry with weapon-type colored emissive
 * - Boss: Box/Octahedron geometry with phase-based color
 * - Power-ups: Dodecahedron geometry with type-based color
 *
 * Materials are created with emissive properties for cyberpunk/neon aesthetic.
 * Per Task 7.4: Visual Polish Pass
 */

import * as THREE from 'three'
import { gameConfig } from '../config/gameConfig'
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
  // Create mesh-type-specific material for enhanced visuals
  const material = createMeshTypeMaterial(meshType, materialType)
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
 * Create mesh-type-specific material with enhanced visual properties.
 * Per Task 7.4: Visual Polish Pass requirements.
 */
function createMeshTypeMaterial(meshType: MeshType, materialType: MaterialType): THREE.Material {
  const { palette, emissiveIntensity } = gameConfig.visualTheme

  // Asteroid materials: Gray with cyan emissive glow
  if (meshType.startsWith('asteroid_')) {
    return new THREE.MeshStandardMaterial({
      color: palette.neutral,
      emissive: palette.secondary, // Cyan
      emissiveIntensity: emissiveIntensity.low, // 0.3
      roughness: 0.8,
      metalness: 0.2
    })
  }

  // Ship material: White with blue emissive
  if (meshType === 'ship') {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: palette.primary, // Blue
      emissiveIntensity: emissiveIntensity.medium, // 0.5
      roughness: 0.5,
      metalness: 0.5
    })
  }

  // Projectile materials: Colored emissive based on weapon type
  if (meshType.startsWith('projectile_')) {
    return createProjectileMaterial(meshType, palette, emissiveIntensity)
  }

  // Power-up materials: Type-specific colored emissive
  if (meshType.startsWith('powerup_')) {
    return createPowerUpMaterial(meshType, palette, emissiveIntensity)
  }

  // Boss materials: Phase-based color (initial phase 1 = blue)
  if (meshType.startsWith('boss_')) {
    return new THREE.MeshStandardMaterial({
      color: palette.primary, // Blue (Phase 1)
      emissive: palette.primary,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.7
    })
  }

  // Fallback to legacy material creation
  return createMaterial(materialType)
}

/**
 * Create projectile material based on weapon type.
 */
function createProjectileMaterial(
  meshType: MeshType,
  palette: typeof gameConfig.visualTheme.palette,
  emissiveIntensity: typeof gameConfig.visualTheme.emissiveIntensity
): THREE.Material {
  let color: number

  switch (meshType) {
    case 'projectile_default':
      color = 0xff0000 // Red
      break
    case 'projectile_spread':
      color = palette.primary // Blue
      break
    case 'projectile_laser':
      color = palette.secondary // Cyan
      break
    case 'projectile_missile':
      color = palette.success // Green
      break
    case 'projectile_boss':
      color = palette.warning // Orange
      break
    default:
      color = 0xffffff
  }

  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: emissiveIntensity.high, // 1.0
    transparent: true,
    opacity: 0.8
  })
}

/**
 * Create power-up material based on type.
 */
function createPowerUpMaterial(
  meshType: MeshType,
  palette: typeof gameConfig.visualTheme.palette,
  emissiveIntensity: typeof gameConfig.visualTheme.emissiveIntensity
): THREE.Material {
  let color: number

  switch (meshType) {
    case 'powerup_shield':
      color = palette.secondary // Cyan
      break
    case 'powerup_rapidfire':
      color = 0xffff00 // Yellow
      break
    case 'powerup_multishot':
      color = palette.accent // Magenta
      break
    case 'powerup_extralife':
      color = palette.success // Green
      break
    default:
      color = 0xffffff
  }

  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: emissiveIntensity.high, // 1.0
    metalness: 0.8,
    roughness: 0.2
  })
}

/**
 * Create material based on material type (legacy fallback).
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
