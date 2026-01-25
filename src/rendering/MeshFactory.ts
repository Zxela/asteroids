/**
 * MeshFactory - Three.js mesh creation for game entities
 *
 * Creates procedural Three.js meshes for each entity type:
 * - Ship: Cone geometry pointing forward with theme-based emissive
 * - Asteroids: Icosahedron geometry with theme-based emissive glow
 * - Projectiles: Small sphere geometry with weapon-type colored emissive
 * - Boss: Box/Octahedron geometry with phase-based color
 * - Power-ups: Dodecahedron geometry with type-based color
 *
 * Supports two mesh quality modes:
 * - Classic: Low-poly meshes matching original arcade aesthetics
 * - Modern: High-poly detailed meshes with procedural variations
 *
 * Materials are created using the active visual theme from ThemeManager.
 * Supports multiple themes: classic, neon, retro.
 * Per Task 7.4: Visual Polish Pass
 */

import * as THREE from 'three'
import { ThemeManager } from '../themes'
import type { ThemeConfig } from '../themes'
import type { MaterialType, MeshType } from '../types/components'

// ============================================
// Mesh Quality System
// ============================================

/**
 * Mesh quality setting type.
 * - classic: Low-poly meshes for retro arcade feel
 * - modern: High-poly detailed meshes with procedural appearance
 */
export type MeshQuality = 'classic' | 'modern'

/** Storage key for mesh quality preference */
const MESH_QUALITY_STORAGE_KEY = 'asteroids-mesh-quality'

/** Default mesh quality when no preference is saved */
const DEFAULT_MESH_QUALITY: MeshQuality = 'classic'

/** Current mesh quality setting (cached for performance) */
let currentMeshQuality: MeshQuality = DEFAULT_MESH_QUALITY

/**
 * Gets the current mesh quality setting.
 * @returns The current mesh quality
 */
function getMeshQuality(): MeshQuality {
  return currentMeshQuality
}

/**
 * Sets the mesh quality and persists to localStorage.
 * @param quality - The mesh quality to set
 */
function setMeshQuality(quality: MeshQuality): void {
  currentMeshQuality = quality
  try {
    localStorage.setItem(MESH_QUALITY_STORAGE_KEY, quality)
  } catch {
    // localStorage not available, quality still set in memory
  }
}

/**
 * Loads mesh quality preference from localStorage.
 * Called on module initialization.
 */
function loadMeshQuality(): void {
  try {
    const stored = localStorage.getItem(MESH_QUALITY_STORAGE_KEY)
    if (stored === 'classic' || stored === 'modern') {
      currentMeshQuality = stored
    }
  } catch {
    // localStorage not available, use default
  }
}

// Load quality preference on module load
loadMeshQuality()

// Asteroid radius constants for different sizes
const ASTEROID_LARGE_RADIUS = 30
const ASTEROID_MEDIUM_RADIUS = 20
const ASTEROID_SMALL_RADIUS = 10

// Number of asteroid variants for modern mode
const ASTEROID_VARIANT_COUNT = 5

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
 * Respects the current mesh quality setting.
 */
function createGeometry(meshType: MeshType, material: THREE.Material): THREE.Object3D {
  const quality = getMeshQuality()
  const useModern = quality === 'modern'

  switch (meshType) {
    case 'ship':
      return useModern ? createModernShip(material) : createShip(material)

    case 'ship_debris':
      return createShipDebris(material)

    case 'asteroid_large':
      return useModern
        ? createModernAsteroid(ASTEROID_LARGE_RADIUS, material)
        : createAsteroid(ASTEROID_LARGE_RADIUS, material)

    case 'asteroid_medium':
      return useModern
        ? createModernAsteroid(ASTEROID_MEDIUM_RADIUS, material)
        : createAsteroid(ASTEROID_MEDIUM_RADIUS, material)

    case 'asteroid_small':
      return useModern
        ? createModernAsteroid(ASTEROID_SMALL_RADIUS, material)
        : createAsteroid(ASTEROID_SMALL_RADIUS, material)

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

    case 'ufo_large':
      return createUFOLarge(material)

    case 'ufo_small':
      return createUFOSmall(material)

    case 'projectile_ufo':
      return createProjectile(material)

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
 * Create ship mesh - classic Asteroids triangle with thruster notch.
 * Uses BufferGeometry for a classic vector-style ship silhouette.
 */
function createShip(material: THREE.Material): THREE.Object3D {
  // Classic Asteroids ship shape: triangle with notch at back
  // Points arranged for a ship facing +Y direction
  const shape = new THREE.Shape()

  // Ship dimensions (roughly 20 units tall, 16 units wide)
  const tipY = 12 // Front tip
  const backY = -8 // Back corners
  const notchY = -4 // Thruster notch depth
  const wingX = 8 // Wing width
  const notchX = 3 // Notch width

  // Draw ship outline: start at front tip, go clockwise
  shape.moveTo(0, tipY) // Front tip
  shape.lineTo(wingX, backY) // Right wing
  shape.lineTo(notchX, notchY) // Right notch
  shape.lineTo(0, backY + 2) // Center back
  shape.lineTo(-notchX, notchY) // Left notch
  shape.lineTo(-wingX, backY) // Left wing
  shape.closePath() // Back to front tip

  // Extrude for 3D depth
  const extrudeSettings = {
    depth: 4,
    bevelEnabled: false
  }
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)

  // Center the geometry
  geometry.center()

  const mesh = new THREE.Mesh(geometry, material)
  // No rotation needed - ship faces +Y which matches forward direction
  return mesh
}

/**
 * Create ship debris mesh - tumbling line segment/wedge piece.
 * Classic Asteroids ship breaks into vector-style line segments.
 * Each debris piece is a simple line or small wedge shape.
 */
function createShipDebris(material: THREE.Material): THREE.Object3D {
  // Create a simple line/wedge shape for vector-style debris
  // Randomly choose between a few debris shapes for variety
  const shapeType = Math.floor(Math.random() * 3)

  const shape = new THREE.Shape()

  switch (shapeType) {
    case 0:
      // Wing fragment - triangular piece
      shape.moveTo(0, 6)
      shape.lineTo(4, -3)
      shape.lineTo(-1, -2)
      shape.closePath()
      break
    case 1:
      // Nose fragment - elongated triangle
      shape.moveTo(0, 8)
      shape.lineTo(2, -2)
      shape.lineTo(-2, -2)
      shape.closePath()
      break
    case 2:
    default:
      // Body fragment - quadrilateral
      shape.moveTo(-2, 4)
      shape.lineTo(3, 2)
      shape.lineTo(2, -3)
      shape.lineTo(-3, -2)
      shape.closePath()
      break
  }

  const extrudeSettings = {
    depth: 2,
    bevelEnabled: false
  }
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  geometry.center()

  // Scale down to appropriate debris size
  const mesh = new THREE.Mesh(geometry, material)
  mesh.scale.setScalar(0.6)

  return mesh
}

/**
 * Create asteroid mesh - jagged irregular polygon like classic Asteroids.
 * Uses random vertex displacement on a low-poly sphere for rocky appearance.
 */
function createAsteroid(radius: number, material: THREE.Material): THREE.Mesh {
  // Use low-poly icosahedron (detail=0) for angular look
  const geometry = new THREE.IcosahedronGeometry(radius, 0)

  // Displace vertices randomly for irregular rocky shape
  const positionAttribute = geometry.getAttribute('position')
  const vertex = new THREE.Vector3()

  // Use radius as seed for consistent randomization per size
  const seed = radius * 7
  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.fromBufferAttribute(positionAttribute, i)

    // Pseudo-random displacement based on vertex position and seed
    const noise = Math.sin(vertex.x * seed) * Math.cos(vertex.y * seed) * Math.sin(vertex.z * seed)
    const displacement = 1 + noise * 0.3 // +/- 30% variation

    vertex.normalize().multiplyScalar(radius * displacement)
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, material)
}

// ============================================
// Modern High-Poly Mesh Creation Functions
// ============================================

/**
 * Create modern high-poly ship mesh - detailed spacecraft geometry.
 * Features a sleek futuristic design with cockpit, wings, and engine details.
 */
function createModernShip(material: THREE.Material): THREE.Object3D {
  const group = new THREE.Group()

  // Main hull - elongated fuselage
  const hullShape = new THREE.Shape()
  const hullLength = 16
  const hullWidth = 6

  // Streamlined hull profile
  hullShape.moveTo(0, hullLength / 2) // Nose
  hullShape.quadraticCurveTo(hullWidth / 2, hullLength / 4, hullWidth / 2, 0)
  hullShape.quadraticCurveTo(hullWidth / 2.5, -hullLength / 3, hullWidth / 4, -hullLength / 2)
  hullShape.lineTo(-hullWidth / 4, -hullLength / 2)
  hullShape.quadraticCurveTo(-hullWidth / 2.5, -hullLength / 3, -hullWidth / 2, 0)
  hullShape.quadraticCurveTo(-hullWidth / 2, hullLength / 4, 0, hullLength / 2)

  const hullExtrudeSettings = {
    depth: 3,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.3,
    bevelSegments: 3
  }

  const hullGeometry = new THREE.ExtrudeGeometry(hullShape, hullExtrudeSettings)
  hullGeometry.center()
  const hull = new THREE.Mesh(hullGeometry, material)
  group.add(hull)

  // Cockpit - raised dome
  const cockpitGeometry = new THREE.SphereGeometry(2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  const cockpit = new THREE.Mesh(cockpitGeometry, material)
  cockpit.position.set(0, 3, 2)
  cockpit.scale.set(1, 1.2, 0.8)
  group.add(cockpit)

  // Wings - swept back delta wings
  const wingGeometry = new THREE.BoxGeometry(14, 8, 0.5)
  // Taper the wings
  const wingPositions = wingGeometry.getAttribute('position')
  for (let i = 0; i < wingPositions.count; i++) {
    const x = wingPositions.getX(i)
    const y = wingPositions.getY(i)
    // Taper toward wingtips
    if (Math.abs(x) > 3) {
      const taperFactor = 1 - (Math.abs(x) - 3) / 4
      wingPositions.setY(i, y * taperFactor * 0.5)
    }
    // Sweep back
    if (Math.abs(x) > 2) {
      const sweepOffset = -Math.abs(x) * 0.4
      wingPositions.setY(i, wingPositions.getY(i) + sweepOffset)
    }
  }
  wingGeometry.computeVertexNormals()

  const wings = new THREE.Mesh(wingGeometry, material)
  wings.position.set(0, -2, 0)
  group.add(wings)

  // Engine pods - cylindrical thrusters
  const engineGeometry = new THREE.CylinderGeometry(1, 1.2, 4, 12)
  const leftEngine = new THREE.Mesh(engineGeometry, material)
  leftEngine.position.set(-3, -6, 0)
  leftEngine.rotation.x = Math.PI / 2
  group.add(leftEngine)

  const rightEngine = new THREE.Mesh(engineGeometry, material)
  rightEngine.position.set(3, -6, 0)
  rightEngine.rotation.x = Math.PI / 2
  group.add(rightEngine)

  // Engine nozzles - cones
  const nozzleGeometry = new THREE.ConeGeometry(1.3, 2, 12)
  const leftNozzle = new THREE.Mesh(nozzleGeometry, material)
  leftNozzle.position.set(-3, -8.5, 0)
  leftNozzle.rotation.x = -Math.PI / 2
  group.add(leftNozzle)

  const rightNozzle = new THREE.Mesh(nozzleGeometry, material)
  rightNozzle.position.set(3, -8.5, 0)
  rightNozzle.rotation.x = -Math.PI / 2
  group.add(rightNozzle)

  // Vertical stabilizer
  const stabilizerGeometry = new THREE.BoxGeometry(0.5, 5, 4)
  const stabilizer = new THREE.Mesh(stabilizerGeometry, material)
  stabilizer.position.set(0, -5, 2)
  group.add(stabilizer)

  return group
}

/**
 * Create modern high-poly asteroid mesh - procedural rocky appearance.
 * Uses higher subdivision with multi-octave noise for realistic rocky surface.
 * Generates one of several variants for visual variety.
 */
function createModernAsteroid(radius: number, material: THREE.Material): THREE.Mesh {
  // Use higher detail icosahedron for smoother base
  const detail = 2
  const geometry = new THREE.IcosahedronGeometry(radius, detail)

  const positionAttribute = geometry.getAttribute('position')
  const vertex = new THREE.Vector3()

  // Generate a random variant seed based on current time for variety
  const variantSeed = (Date.now() % ASTEROID_VARIANT_COUNT) + 1

  // Apply multi-octave noise for realistic rocky surface
  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.fromBufferAttribute(positionAttribute, i)
    const normalized = vertex.clone().normalize()

    // Multi-octave noise (3 octaves)
    let displacement = 0

    // Octave 1: Large features
    const freq1 = 2 + variantSeed * 0.3
    const noise1 =
      Math.sin(normalized.x * freq1 * radius * 0.1) *
      Math.cos(normalized.y * freq1 * radius * 0.1) *
      Math.sin(normalized.z * freq1 * radius * 0.1 + variantSeed)
    displacement += noise1 * 0.25

    // Octave 2: Medium detail
    const freq2 = 5 + variantSeed * 0.5
    const noise2 =
      Math.sin(normalized.x * freq2 * radius * 0.1 + 1.5) *
      Math.cos(normalized.y * freq2 * radius * 0.1 + 0.7) *
      Math.sin(normalized.z * freq2 * radius * 0.1 + variantSeed * 2)
    displacement += noise2 * 0.12

    // Octave 3: Fine detail (craters, bumps)
    const freq3 = 10 + variantSeed
    const noise3 =
      Math.sin(normalized.x * freq3 * radius * 0.1 + 3.1) *
      Math.cos(normalized.y * freq3 * radius * 0.1 + 2.2) *
      Math.sin(normalized.z * freq3 * radius * 0.1 + variantSeed * 3)
    displacement += noise3 * 0.06

    // Add some crater-like depressions
    const craterChance = Math.sin(normalized.x * 7 + normalized.y * 11 + variantSeed * 5)
    if (craterChance > 0.7) {
      displacement -= (0.15 * (craterChance - 0.7)) / 0.3
    }

    // Apply displacement
    const finalRadius = radius * (1 + displacement)
    vertex.normalize().multiplyScalar(finalRadius)
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  geometry.computeVertexNormals()

  const mesh = new THREE.Mesh(geometry, material)
  // Store variant for potential animation use
  mesh.userData.asteroidVariant = variantSeed

  return mesh
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
 * Create large UFO mesh - classic flying saucer shape.
 * Ellipsoid body with dome on top.
 */
function createUFOLarge(material: THREE.Material): THREE.Object3D {
  const group = new THREE.Group()

  // Main saucer body - flattened sphere
  const bodyGeometry = new THREE.SphereGeometry(25, 16, 12)
  bodyGeometry.scale(1, 0.3, 1) // Flatten vertically
  const body = new THREE.Mesh(bodyGeometry, material)
  group.add(body)

  // Top dome - smaller sphere
  const domeGeometry = new THREE.SphereGeometry(10, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const dome = new THREE.Mesh(domeGeometry, material)
  dome.position.y = 5
  group.add(dome)

  // Ring around saucer edge
  const ringGeometry = new THREE.TorusGeometry(22, 3, 8, 24)
  ringGeometry.rotateX(Math.PI / 2)
  const ring = new THREE.Mesh(ringGeometry, material)
  group.add(ring)

  return group
}

/**
 * Create small UFO mesh - compact flying saucer.
 * Same shape as large but more compact.
 */
function createUFOSmall(material: THREE.Material): THREE.Object3D {
  const group = new THREE.Group()

  // Main saucer body - flattened sphere (smaller)
  const bodyGeometry = new THREE.SphereGeometry(15, 12, 8)
  bodyGeometry.scale(1, 0.35, 1) // Slightly less flat
  const body = new THREE.Mesh(bodyGeometry, material)
  group.add(body)

  // Top dome - smaller sphere
  const domeGeometry = new THREE.SphereGeometry(6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)
  const dome = new THREE.Mesh(domeGeometry, material)
  dome.position.y = 4
  group.add(dome)

  // Ring around saucer edge (smaller)
  const ringGeometry = new THREE.TorusGeometry(13, 2, 6, 16)
  ringGeometry.rotateX(Math.PI / 2)
  const ring = new THREE.Mesh(ringGeometry, material)
  group.add(ring)

  return group
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
 * Get the current theme configuration from ThemeManager.
 */
function getTheme(): ThemeConfig {
  return ThemeManager.getInstance().getTheme()
}

/**
 * Create mesh-type-specific material with enhanced visual properties.
 * Uses active theme from ThemeManager for colors and properties.
 * Per Task 7.4: Visual Polish Pass requirements.
 */
function createMeshTypeMaterial(meshType: MeshType, materialType: MaterialType): THREE.Material {
  const theme = getTheme()
  const { palette, emissive, materials } = theme

  // Asteroid materials: Theme-based emissive glow
  if (meshType.startsWith('asteroid_')) {
    return new THREE.MeshStandardMaterial({
      color: palette.asteroid,
      emissive: palette.asteroidEmissive,
      emissiveIntensity: emissive.low,
      roughness: materials.roughness + 0.2,
      metalness: materials.metalness - 0.1
    })
  }

  // Ship material: Theme-based with strong emissive for vector look
  if (meshType === 'ship') {
    return new THREE.MeshStandardMaterial({
      color: palette.ship,
      emissive: palette.shipEmissive,
      emissiveIntensity: emissive.ship,
      roughness: materials.roughness,
      metalness: materials.metalness
    })
  }

  // Ship debris material: Same as ship but with transparency for fade-out
  if (meshType === 'ship_debris') {
    return new THREE.MeshStandardMaterial({
      color: palette.ship,
      emissive: palette.shipEmissive,
      emissiveIntensity: emissive.ship,
      roughness: materials.roughness,
      metalness: materials.metalness,
      transparent: true,
      opacity: 1.0
    })
  }

  // Projectile materials: Colored emissive based on weapon type
  if (meshType.startsWith('projectile_')) {
    return createProjectileMaterial(meshType, theme)
  }

  // Power-up materials: Type-specific colored emissive
  if (meshType.startsWith('powerup_')) {
    return createPowerUpMaterial(meshType, theme)
  }

  // Boss materials: Phase-based color (initial phase 1)
  if (meshType.startsWith('boss_')) {
    return new THREE.MeshStandardMaterial({
      color: palette.bossPhase1,
      emissive: palette.bossPhase1,
      emissiveIntensity: emissive.boss,
      roughness: materials.roughness,
      metalness: materials.metalness
    })
  }

  // UFO materials: Warning/orange color to distinguish from player
  if (meshType.startsWith('ufo_')) {
    return new THREE.MeshStandardMaterial({
      color: palette.projectileBoss, // Use boss projectile color (orange/red)
      emissive: palette.projectileBoss,
      emissiveIntensity: emissive.medium,
      roughness: materials.roughness,
      metalness: materials.metalness + 0.2
    })
  }

  // Fallback to legacy material creation
  return createMaterial(materialType)
}

/**
 * Create projectile material based on weapon type.
 */
function createProjectileMaterial(meshType: MeshType, theme: ThemeConfig): THREE.Material {
  const { palette, emissive, materials } = theme
  let color: number

  switch (meshType) {
    case 'projectile_default':
      color = palette.projectile
      break
    case 'projectile_spread':
      color = palette.projectileSpread
      break
    case 'projectile_laser':
      color = palette.projectileLaser
      break
    case 'projectile_missile':
      color = palette.projectileMissile
      break
    case 'projectile_boss':
      color = palette.projectileBoss
      break
    case 'projectile_ufo':
      color = palette.projectileBoss // Use same color as boss projectiles
      break
    default:
      color = 0xffffff
  }

  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: emissive.high,
    transparent: true,
    opacity: materials.projectileOpacity
  })
}

/**
 * Create power-up material based on type.
 */
function createPowerUpMaterial(meshType: MeshType, theme: ThemeConfig): THREE.Material {
  const { palette, emissive } = theme
  let color: number

  switch (meshType) {
    case 'powerup_shield':
      color = palette.powerUpShield
      break
    case 'powerup_rapidfire':
      color = palette.powerUpRapidFire
      break
    case 'powerup_multishot':
      color = palette.powerUpMultiShot
      break
    case 'powerup_extralife':
      color = palette.powerUpExtraLife
      break
    default:
      color = 0xffffff
  }

  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: emissive.high,
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
 * Exposes the createMesh function and mesh quality controls.
 */
export const MeshFactory = {
  createMesh,
  getMeshQuality,
  setMeshQuality
}
