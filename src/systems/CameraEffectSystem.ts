/**
 * CameraEffectSystem - Screen Shake Camera Effect
 *
 * Provides visual feedback on collisions through camera shake effects:
 * - Listens for collision events
 * - Calculates shake magnitude based on collision severity
 * - Applies random X/Y offset to camera position with decay
 * - Multiple shakes stack (additive magnitude)
 * - Camera returns to original position after shake expires
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/CameraEffectSystem
 */

import { Vector3 } from 'three'
import type { System, World } from '../ecs/types'
import type { CollisionLayer } from '../types/components'
import type { EventEmitter } from '../utils/EventEmitter'

/**
 * Collision event data from CollisionSystem.
 */
interface CollisionEventData {
  type: 'collision'
  entity1: number
  entity2: number
  layer1: CollisionLayer
  layer2: CollisionLayer
  distance: number
}

/**
 * Active camera shake effect.
 */
export interface CameraShake {
  /** Shake magnitude (max offset in units) */
  magnitude: number
  /** Total shake duration in milliseconds */
  duration: number
  /** Time elapsed since shake started in milliseconds */
  elapsed: number
}

/**
 * Screen shake configuration.
 */
export interface ScreenShakeConfig {
  /** Base intensity for shake magnitude */
  intensity: number
  /** Default shake duration in milliseconds */
  duration: number
}

/**
 * Interface for camera access (from SceneManager).
 */
interface Camera {
  position: Vector3
}

/**
 * Interface for scene manager providing camera access.
 */
interface SceneManagerLike {
  getCamera(): Camera
}

/**
 * Default screen shake configuration.
 */
const DEFAULT_CONFIG: ScreenShakeConfig = {
  intensity: 5,
  duration: 100
}

/**
 * Magnitude mapping for collision type pairs.
 * Values are based on impact severity per Design Doc.
 */
const COLLISION_MAGNITUDES: Record<string, number> = {
  // Ship collisions (higher impact)
  'player-boss': 7,
  'boss-player': 7,
  'player-bossProjectile': 6,
  'bossProjectile-player': 6,
  'player-asteroid': 5,
  'asteroid-player': 5,

  // Projectile collisions (lower impact)
  'projectile-boss': 3,
  'boss-projectile': 3,
  'projectile-asteroid': 2,
  'asteroid-projectile': 2,

  // Non-damage collisions (no shake)
  'player-powerup': 0,
  'powerup-player': 0
}

/**
 * System for camera shake effects on collisions.
 *
 * Creates screen shake feedback when collisions occur:
 * - Ship-boss collision: magnitude 7 (most severe)
 * - Ship-bossProjectile: magnitude 6
 * - Ship-asteroid collision: magnitude 5
 * - Projectile-boss: magnitude 3
 * - Projectile-asteroid: magnitude 2 (subtle)
 * - Ship-powerup: no shake
 *
 * @example
 * ```typescript
 * const cameraEffectSystem = new CameraEffectSystem(eventEmitter, sceneManager)
 *
 * // Each frame in game loop
 * cameraEffectSystem.update(deltaTime)
 * ```
 */
export class CameraEffectSystem implements System {
  /** System type identifier */
  readonly systemType = 'cameraEffect' as const

  /** Required components - none, operates on camera directly */
  readonly requiredComponents: string[] = []

  /** Active shake effects */
  private activeShakes: CameraShake[] = []

  /** Original camera position before shakes */
  private originalCameraPosition: Vector3 = new Vector3()

  /** Whether original position has been stored */
  private hasStoredOriginalPosition = false

  /** Event emitter for collision events */
  private eventEmitter: EventEmitter

  /** Scene manager for camera access */
  private sceneManager: SceneManagerLike

  /** Screen shake configuration */
  private config: ScreenShakeConfig

  /**
   * Create a new CameraEffectSystem.
   *
   * @param eventEmitter - Event emitter for collision events
   * @param sceneManager - Scene manager providing camera access
   * @param config - Optional screen shake configuration
   */
  constructor(
    eventEmitter: EventEmitter,
    sceneManager: SceneManagerLike,
    config?: Partial<ScreenShakeConfig>
  ) {
    this.eventEmitter = eventEmitter
    this.sceneManager = sceneManager
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Subscribe to collision events
    this.subscribeToCollisionEvents()
  }

  /**
   * Subscribe to collision events from EventEmitter.
   */
  private subscribeToCollisionEvents(): void {
    // Type assertion needed as EventEmitter is generic
    this.eventEmitter.on('collision', (event: unknown) => {
      this.onCollision(event as CollisionEventData)
    })
  }

  /**
   * Handle collision event.
   *
   * Calculates shake magnitude based on collision layers
   * and creates a new shake effect if magnitude > 0.
   *
   * @param event - Collision event data
   */
  private onCollision(event: CollisionEventData): void {
    const magnitude = this.getMagnitudeForCollision(event.layer1, event.layer2)

    if (magnitude > 0) {
      const shake: CameraShake = {
        magnitude,
        duration: this.config.duration,
        elapsed: 0
      }
      this.activeShakes.push(shake)
    }
  }

  /**
   * Get shake magnitude for a collision between two layers.
   *
   * @param layer1 - First collision layer
   * @param layer2 - Second collision layer
   * @returns Shake magnitude (0 = no shake)
   */
  getMagnitudeForCollision(layer1: CollisionLayer, layer2: CollisionLayer): number {
    const key = `${layer1}-${layer2}`
    return COLLISION_MAGNITUDES[key] ?? 0
  }

  /**
   * Calculate decay factor for shake (linear decay).
   *
   * @param elapsed - Time elapsed in milliseconds
   * @param duration - Total duration in milliseconds
   * @returns Decay factor (1.0 at start, 0.0 at end)
   */
  calculateDecayFactor(elapsed: number, duration: number): number {
    if (duration <= 0) return 0
    return Math.max(0, 1.0 - elapsed / duration)
  }

  /**
   * Update camera shake effects.
   *
   * Called each frame to:
   * 1. Store original camera position if not stored
   * 2. Update elapsed time for all active shakes
   * 3. Remove expired shakes
   * 4. Calculate and apply total offset to camera
   * 5. Reset camera to original position if no active shakes
   *
   * @param _world - ECS world (unused, satisfies System interface)
   * @param deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime: number): void
  update(_world: World, deltaTime: number): void
  update(worldOrDelta: World | number, maybeTime?: number): void {
    const deltaTime = typeof worldOrDelta === 'number' ? worldOrDelta : (maybeTime ?? 0)

    const camera = this.sceneManager.getCamera()

    // Store original position on first shake
    if (this.activeShakes.length > 0 && !this.hasStoredOriginalPosition) {
      this.originalCameraPosition.copy(camera.position)
      this.hasStoredOriginalPosition = true
    }

    // Update all active shakes
    for (const shake of this.activeShakes) {
      shake.elapsed += deltaTime
    }

    // Remove expired shakes
    this.activeShakes = this.activeShakes.filter((shake) => shake.elapsed < shake.duration)

    // Apply shake offset or reset position
    if (this.activeShakes.length > 0) {
      this.applyShakeOffset(camera)
    } else if (this.hasStoredOriginalPosition) {
      // Reset to original position
      camera.position.copy(this.originalCameraPosition)
      this.hasStoredOriginalPosition = false
    }
  }

  /**
   * Apply combined shake offset to camera.
   *
   * For each active shake:
   * 1. Calculate decay factor
   * 2. Generate random offset scaled by magnitude and decay
   * 3. Accumulate offsets (additive stacking)
   *
   * @param camera - Camera to apply offset to
   */
  private applyShakeOffset(camera: Camera): void {
    let totalOffsetX = 0
    let totalOffsetY = 0

    for (const shake of this.activeShakes) {
      const decayFactor = this.calculateDecayFactor(shake.elapsed, shake.duration)

      // Random offset in range [-magnitude, magnitude] scaled by decay
      const offsetX = (Math.random() * 2 - 1) * shake.magnitude * decayFactor
      const offsetY = (Math.random() * 2 - 1) * shake.magnitude * decayFactor

      totalOffsetX += offsetX
      totalOffsetY += offsetY
    }

    // Apply offset to camera (only X and Y for 2.5D gameplay)
    camera.position.x = this.originalCameraPosition.x + totalOffsetX
    camera.position.y = this.originalCameraPosition.y + totalOffsetY
    // Z remains unchanged for 2.5D view
  }

  /**
   * Check if there are any active shakes.
   *
   * @returns True if there are active shakes
   */
  hasActiveShakes(): boolean {
    return this.activeShakes.length > 0
  }

  /**
   * Get the number of active shakes.
   *
   * @returns Count of active shakes
   */
  getActiveShakeCount(): number {
    return this.activeShakes.length
  }

  /**
   * Get all active shake effects.
   *
   * @returns Array of active shakes
   */
  getActiveShakes(): CameraShake[] {
    return [...this.activeShakes]
  }

  /**
   * Get the stored original camera position.
   *
   * @returns Original camera position vector
   */
  getOriginalCameraPosition(): Vector3 {
    return this.originalCameraPosition.clone()
  }

  /**
   * Reset the camera effect system.
   *
   * Clears all active shakes and resets state.
   */
  reset(): void {
    this.activeShakes = []
    this.hasStoredOriginalPosition = false
  }
}
