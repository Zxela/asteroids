/**
 * SceneManager - Three.js Renderer and Scene Setup
 *
 * Manages the Three.js rendering environment:
 * - WebGPURenderer with automatic WebGL 2 fallback (per ADR-0003)
 * - Scene with proper lighting setup
 * - PerspectiveCamera positioned for 2.5D gameplay
 * - Viewport management and resize handling
 * - Theme-aware background and lighting (subscribes to ThemeManager)
 *
 * Following ADR-0003: Rendering Strategy - Use Three.js WebGPURenderer with auto-fallback.
 */

import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { ThemeManager } from '../themes'
import type { ThemeConfig } from '../themes'

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
  private themeUnsubscribe: (() => void) | null = null
  private directionalLight: THREE.DirectionalLight | null = null
  private ambientLight: THREE.AmbientLight | null = null

  constructor() {
    // Get initial dimensions from container or window
    const container = document.getElementById('game-container')
    this.width = container?.clientWidth ?? window.innerWidth
    this.height = container?.clientHeight ?? window.innerHeight

    // Create scene
    this.scene = new THREE.Scene()

    // Apply initial theme
    const theme = ThemeManager.getInstance().getTheme()
    this.applyTheme(theme)

    // Create camera for 2.5D perspective gameplay
    const aspect = this.width / this.height
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000)
    this.camera.position.z = 750 // Position for 2.5D view

    // Setup lighting with theme colors
    this.setupLighting(theme)

    // Subscribe to theme changes
    this.themeUnsubscribe = ThemeManager.getInstance().subscribe((newTheme) => {
      this.applyTheme(newTheme)
    })

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
   * Apply visual theme to scene background and lighting.
   * Called on construction and when theme changes.
   */
  private applyTheme(theme: ThemeConfig): void {
    // Update background color
    this.scene.background = new THREE.Color(theme.background.color)

    // Update lighting if already created
    if (this.directionalLight) {
      this.directionalLight.color.setHex(theme.background.directionalLight)
      this.directionalLight.intensity = theme.background.directionalIntensity
    }

    if (this.ambientLight) {
      this.ambientLight.color.setHex(theme.background.ambientLight)
      this.ambientLight.intensity = theme.background.ambientIntensity
    }
  }

  /**
   * Setup scene lighting.
   * Uses theme configuration for colors and intensities.
   * Per Task 7.4: Visual Polish Pass
   * Creates atmosphere while ensuring mesh visibility.
   */
  private setupLighting(theme: ThemeConfig): void {
    // Main directional light - positioned for good coverage
    this.directionalLight = new THREE.DirectionalLight(
      theme.background.directionalLight,
      theme.background.directionalIntensity
    )
    this.directionalLight.position.set(5, 10, 5)
    this.scene.add(this.directionalLight)

    // Ambient light - for atmospheric fill
    this.ambientLight = new THREE.AmbientLight(
      theme.background.ambientLight,
      theme.background.ambientIntensity
    )
    this.scene.add(this.ambientLight)
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
   * Clear all game objects from the scene.
   * Preserves lights and cameras.
   */
  clearGameObjects(): void {
    // Collect objects to remove (can't modify array while iterating)
    const objectsToRemove: THREE.Object3D[] = []

    this.scene.traverse((child) => {
      // Keep lights and cameras
      if (child instanceof THREE.Light || child instanceof THREE.Camera) {
        return
      }
      // Keep the scene itself
      if (child === this.scene) {
        return
      }
      objectsToRemove.push(child)
    })

    // Remove collected objects
    for (const obj of objectsToRemove) {
      this.scene.remove(obj)
      // Dispose of geometry and materials to free memory
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose()
        if (Array.isArray(obj.material)) {
          for (const m of obj.material) {
            m.dispose()
          }
        } else if (obj.material) {
          obj.material.dispose()
        }
      }
    }
  }

  /**
   * Clean up resources and remove event listeners.
   */
  dispose(): void {
    window.removeEventListener('resize', this.resizeHandler)
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe()
      this.themeUnsubscribe = null
    }
    this.renderer = null
  }
}
