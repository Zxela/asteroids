/**
 * SceneManager - Three.js Renderer and Scene Setup
 *
 * Manages the Three.js rendering environment:
 * - WebGPURenderer with automatic WebGL 2 fallback (per ADR-0003)
 * - Scene with proper lighting setup
 * - PerspectiveCamera positioned for 2.5D gameplay
 * - Viewport management and resize handling
 *
 * Following ADR-0003: Rendering Strategy - Use Three.js WebGPURenderer with auto-fallback.
 */

import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'

/**
 * Renderer type returned by SceneManager.
 * Can be WebGPURenderer or WebGLRenderer depending on browser support.
 */
interface RendererLike {
  setSize(width: number, height: number): void
  setPixelRatio(ratio: number): void
  render(scene: THREE.Scene, camera: THREE.Camera): void
  domElement: HTMLCanvasElement
  info: { render: { calls: number } }
  init?(): Promise<void>
}

/**
 * SceneManager handles all Three.js rendering setup and management.
 *
 * Usage:
 * ```typescript
 * const sceneManager = new SceneManager()
 * await sceneManager.init()
 * sceneManager.render()
 * ```
 */
export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: RendererLike | null = null
  private width: number
  private height: number
  private resizeHandler: () => void

  constructor() {
    // Get initial dimensions from container or window
    const container = document.getElementById('game-container')
    this.width = container?.clientWidth ?? window.innerWidth
    this.height = container?.clientHeight ?? window.innerHeight

    // Create scene with black background
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

    // Create camera for 2.5D perspective gameplay
    const aspect = this.width / this.height
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000)
    this.camera.position.z = 750 // Position for 2.5D view

    // Setup lighting
    this.setupLighting()

    // Bind resize handler
    this.resizeHandler = this.onWindowResize.bind(this)
  }

  /**
   * Initialize the renderer asynchronously.
   * WebGPURenderer requires async initialization.
   */
  async init(): Promise<void> {
    const canvas = document.getElementById('game') as HTMLCanvasElement

    // Create WebGPURenderer (auto-fallback to WebGL 2 built-in)
    this.renderer = new WebGPURenderer({ canvas }) as RendererLike

    // WebGPURenderer requires async init
    if (this.renderer.init) {
      await this.renderer.init()
    }

    // Configure renderer
    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    // Add resize listener
    window.addEventListener('resize', this.resizeHandler)
  }

  /**
   * Setup scene lighting.
   * Per Task 7.4: Visual Polish Pass
   * - DirectionalLight: white, intensity 1.0, position (5, 10, 5)
   * - AmbientLight: dark blue (#222244), intensity 0.4
   * Creates cyberpunk/neon atmosphere while ensuring mesh visibility.
   */
  private setupLighting(): void {
    // Main directional light - white, positioned for good coverage
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 10, 5)
    this.scene.add(directionalLight)

    // Ambient light - dark blue for cyberpunk atmosphere
    const ambientLight = new THREE.AmbientLight(0x222244, 0.4)
    this.scene.add(ambientLight)
  }

  /**
   * Handle window resize events.
   * Updates viewport, camera aspect ratio, and renderer size.
   * Uses game-container dimensions to enforce minimum size.
   */
  private onWindowResize(): void {
    const container = document.getElementById('game-container')
    this.width = container?.clientWidth ?? window.innerWidth
    this.height = container?.clientHeight ?? window.innerHeight

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    if (this.renderer) {
      this.renderer.setSize(this.width, this.height)
    }
  }

  /**
   * Get the Three.js Scene.
   */
  getScene(): THREE.Scene {
    return this.scene
  }

  /**
   * Get the Three.js PerspectiveCamera.
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  /**
   * Get the Three.js Renderer.
   * @throws Error if called before init()
   */
  getRenderer(): RendererLike {
    if (!this.renderer) {
      throw new Error('SceneManager not initialized. Call init() first.')
    }
    return this.renderer
  }

  /**
   * Render the scene using the camera.
   */
  render(): void {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  /**
   * Get current viewport dimensions.
   */
  getViewportSize(): { width: number; height: number } {
    return { width: this.width, height: this.height }
  }

  /**
   * Clean up resources and remove event listeners.
   */
  dispose(): void {
    window.removeEventListener('resize', this.resizeHandler)
    this.renderer = null
  }
}
