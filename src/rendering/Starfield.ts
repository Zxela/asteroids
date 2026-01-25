/**
 * Starfield - Static star background with optional parallax
 *
 * Creates a starfield background using THREE.Points for efficient rendering.
 * Features:
 * - Randomly distributed stars in a large volume
 * - Multiple star sizes for depth perception
 * - Optional parallax effect based on camera movement
 *
 * Following ADR-0003: Rendering Strategy with Three.js.
 *
 * @module rendering/Starfield
 */

import * as THREE from 'three'

/**
 * Configuration for starfield generation.
 */
interface StarfieldConfig {
  /** Number of stars to generate (default: 500) */
  starCount?: number
  /** Width of the star volume (default: 2000) */
  width?: number
  /** Height of the star volume (default: 2000) */
  height?: number
  /** Depth range for stars (default: 1000) */
  depth?: number
  /** Minimum star size (default: 1) */
  minSize?: number
  /** Maximum star size (default: 3) */
  maxSize?: number
  /** Parallax factor (0 = no parallax, 1 = full camera movement) */
  parallaxFactor?: number
}

/**
 * Default starfield configuration.
 */
const DEFAULT_CONFIG: Required<StarfieldConfig> = {
  starCount: 500,
  width: 2000,
  height: 2000,
  depth: 1000,
  minSize: 1,
  maxSize: 3,
  parallaxFactor: 0.1
}

/**
 * Starfield creates a static star background for the game.
 *
 * Uses THREE.Points for efficient rendering of many small particles.
 * Stars are positioned at random locations within a defined volume
 * behind the game plane (negative Z values).
 *
 * @example
 * ```typescript
 * const scene = new THREE.Scene()
 * const camera = new THREE.PerspectiveCamera(...)
 *
 * const starfield = new Starfield(scene, camera)
 *
 * // Optional: update for parallax effect
 * starfield.update(deltaTime)
 *
 * // Cleanup
 * starfield.dispose()
 * ```
 */
export class Starfield {
  /** Reference to the scene */
  private scene: THREE.Scene

  /** Reference to camera for parallax calculations */
  private camera: THREE.Camera

  /** The points object containing all stars */
  private points: THREE.Points

  /** Geometry holding star positions */
  private geometry: THREE.BufferGeometry

  /** Material for rendering stars */
  private material: THREE.PointsMaterial

  /** Configuration values */
  private config: Required<StarfieldConfig>

  /** Base positions for parallax offset calculation */
  private basePositions: Float32Array

  /**
   * Create a new Starfield.
   *
   * @param scene - Three.js scene to add starfield to
   * @param camera - Camera for parallax calculations
   * @param config - Optional configuration
   */
  constructor(scene: THREE.Scene, camera: THREE.Camera, config: StarfieldConfig = {}) {
    this.scene = scene
    this.camera = camera
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Create geometry with star positions
    this.geometry = new THREE.BufferGeometry()
    this.basePositions = this.generateStarPositions()

    // Clone for actual positions (modified by parallax)
    const positions = new Float32Array(this.basePositions)
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Generate star sizes
    const sizes = this.generateStarSizes()
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // Create material
    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    // Create points object
    this.points = new THREE.Points(this.geometry, this.material)

    // Position behind game plane
    this.points.position.z = -500

    // Add to scene
    this.scene.add(this.points)
  }

  /**
   * Generate random star positions.
   *
   * @returns Float32Array of x, y, z positions
   */
  private generateStarPositions(): Float32Array {
    const { starCount, width, height, depth } = this.config
    const positions = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      // Random X: -width/2 to +width/2
      positions[i3] = (Math.random() - 0.5) * width
      // Random Y: -height/2 to +height/2
      positions[i3 + 1] = (Math.random() - 0.5) * height
      // Random Z: 0 to -depth (behind the main plane)
      positions[i3 + 2] = -Math.random() * depth
    }

    return positions
  }

  /**
   * Generate random star sizes for depth variation.
   *
   * @returns Float32Array of star sizes
   */
  private generateStarSizes(): Float32Array {
    const { starCount, minSize, maxSize } = this.config
    const sizes = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      sizes[i] = minSize + Math.random() * (maxSize - minSize)
    }

    return sizes
  }

  /**
   * Update starfield (for parallax effect).
   *
   * @param _deltaTime - Time since last update in milliseconds (unused currently)
   */
  update(_deltaTime: number): void {
    if (this.config.parallaxFactor === 0) {
      return
    }

    // Get camera position for parallax offset
    const cameraX = this.camera.position.x
    const cameraY = this.camera.position.y

    // Apply parallax offset to star positions
    const positionAttribute = this.geometry.getAttribute('position') as THREE.BufferAttribute
    const positions = positionAttribute.array as Float32Array

    for (let i = 0; i < this.config.starCount; i++) {
      const i3 = i * 3
      // Get base position
      const baseX = this.basePositions[i3]
      const baseY = this.basePositions[i3 + 1]
      const baseZ = this.basePositions[i3 + 2]

      // Stars further away (more negative Z) move less
      const depthFactor = baseZ !== undefined ? baseZ / -this.config.depth : 0.5
      const parallaxAmount = this.config.parallaxFactor * (1 - depthFactor)

      // Apply offset opposite to camera movement
      if (baseX !== undefined && baseY !== undefined) {
        positions[i3] = baseX - cameraX * parallaxAmount
        positions[i3 + 1] = baseY - cameraY * parallaxAmount
      }
    }

    positionAttribute.needsUpdate = true
  }

  /**
   * Get the THREE.Points object.
   *
   * @returns The points object
   */
  getPoints(): THREE.Points {
    return this.points
  }

  /**
   * Get the current star count.
   *
   * @returns Number of stars
   */
  getStarCount(): number {
    return this.config.starCount
  }

  /**
   * Clean up resources.
   * Removes from scene and disposes geometry and material.
   */
  dispose(): void {
    this.scene.remove(this.points)
    this.geometry.dispose()
    this.material.dispose()
  }
}
