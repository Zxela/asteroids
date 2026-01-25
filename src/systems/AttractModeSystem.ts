/**
 * AttractModeSystem - Classic arcade attract/demo mode
 *
 * Activates after 30 seconds idle on main menu.
 * Features:
 * - AI-controlled ship with simple asteroid-hunting behavior
 * - "PRESS START" overlay display
 * - Any input returns to menu
 *
 * AI Behavior:
 * - Rotate toward nearest asteroid
 * - Thrust when roughly facing target
 * - Fire when aligned with target
 *
 * Following ADR-0001: ECS architecture for game entity management.
 *
 * @module systems/AttractModeSystem
 */

import { Vector3 } from 'three'
import { Asteroid } from '../components/Asteroid'
import { Player } from '../components/Player'
import { Transform } from '../components/Transform'
import type { ComponentClass, EntityId, System, World } from '../ecs/types'

// Type assertions for component classes
const AsteroidClass = Asteroid as unknown as ComponentClass<Asteroid>
const PlayerClass = Player as unknown as ComponentClass<Player>
const TransformClass = Transform as unknown as ComponentClass<Transform>

/** Idle time before attract mode activates (milliseconds) */
const ATTRACT_IDLE_TIME = 30000 // 30 seconds

/** Angle threshold for "facing" target (radians) */
const FACING_THRESHOLD = 0.3 // ~17 degrees

/** Angle threshold for firing (radians) */
const FIRE_THRESHOLD = 0.15 // ~8.5 degrees

/** Fire cooldown (milliseconds) */
const AI_FIRE_COOLDOWN = 300

/**
 * AI input state that mimics InputSystem interface.
 */
export interface AIInputState {
  movement: { x: number; y: number }
  shoot: boolean
}

/**
 * AttractModeSystem - Manages attract/demo mode gameplay.
 *
 * Provides AI ship control and tracks input for returning to menu.
 *
 * @example
 * ```typescript
 * const attractMode = new AttractModeSystem()
 * attractMode.activate(world)
 *
 * // In game loop
 * const aiInput = attractMode.update(world, deltaTime)
 * // Apply aiInput to ship control system
 * ```
 */
export class AttractModeSystem implements System {
  /** System type identifier */
  readonly systemType = 'attractMode' as const

  /** Required components */
  readonly requiredComponents: string[] = []

  /** Whether attract mode is currently active */
  private active = false

  /** Idle time accumulator (when not in attract mode) */
  private idleTime = 0

  /** Callback when user input detected (to exit attract mode) */
  private onExitCallback: (() => void) | null = null

  /** AI fire cooldown timer */
  private fireCooldown = 0

  /** Key press handler for detecting input */
  private keyHandler: ((e: KeyboardEvent) => void) | null = null
  private mouseHandler: ((e: MouseEvent) => void) | null = null

  /**
   * Set callback for when attract mode should start.
   * Note: Currently unused - Game.ts checks updateIdleTimer return value instead.
   * Keeping this method for potential future use.
   */
  onStart(_callback: () => void): void {
    // Not used - Game.ts polls updateIdleTimer() return value
  }

  /**
   * Set callback for when user input exits attract mode.
   */
  onExit(callback: () => void): void {
    this.onExitCallback = callback
  }

  /**
   * Reset idle timer (call when user interacts with menu).
   */
  resetIdleTimer(): void {
    this.idleTime = 0
  }

  /**
   * Update idle timer when on main menu (not in attract mode).
   *
   * @param deltaTime - Time since last frame in milliseconds
   * @returns True if attract mode should start
   */
  updateIdleTimer(deltaTime: number): boolean {
    if (this.active) return false

    this.idleTime += deltaTime

    if (this.idleTime >= ATTRACT_IDLE_TIME) {
      this.idleTime = 0
      return true
    }

    return false
  }

  /**
   * Activate attract mode.
   * Starts listening for input to exit.
   */
  activate(): void {
    this.active = true
    this.fireCooldown = 0
    this.setupInputListeners()
  }

  /**
   * Deactivate attract mode.
   */
  deactivate(): void {
    this.active = false
    this.removeInputListeners()
  }

  /**
   * Check if attract mode is active.
   */
  isActive(): boolean {
    return this.active
  }

  /**
   * Set up input listeners to detect user interaction.
   */
  private setupInputListeners(): void {
    this.keyHandler = (_e: KeyboardEvent) => {
      if (this.active && this.onExitCallback) {
        this.onExitCallback()
      }
    }

    this.mouseHandler = (_e: MouseEvent) => {
      if (this.active && this.onExitCallback) {
        this.onExitCallback()
      }
    }

    document.addEventListener('keydown', this.keyHandler)
    document.addEventListener('mousedown', this.mouseHandler)
  }

  /**
   * Remove input listeners.
   */
  private removeInputListeners(): void {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler)
      this.keyHandler = null
    }
    if (this.mouseHandler) {
      document.removeEventListener('mousedown', this.mouseHandler)
      this.mouseHandler = null
    }
  }

  /**
   * Update attract mode AI and generate input state.
   *
   * @param world - The ECS world
   * @param deltaTime - Time since last frame in milliseconds
   * @returns AI input state to apply to ship
   */
  update(world: World, deltaTime: number): AIInputState {
    const input: AIInputState = {
      movement: { x: 0, y: 0 },
      shoot: false
    }

    if (!this.active) return input

    // Update fire cooldown
    this.fireCooldown = Math.max(0, this.fireCooldown - deltaTime)

    // Find player ship
    const players = world.query(PlayerClass)
    if (players.length === 0 || players[0] === undefined) return input

    const shipId = players[0]
    const shipTransform = world.getComponent(shipId, TransformClass)
    if (!shipTransform) return input

    // Find nearest asteroid
    const asteroids = world.query(AsteroidClass)
    if (asteroids.length === 0) return input

    const target = this.findNearestAsteroid(world, shipTransform.position, asteroids)
    if (!target) return input

    // Calculate angle to target
    const toTarget = new Vector3().subVectors(target.position, shipTransform.position)
    const targetAngle = Math.atan2(toTarget.y, toTarget.x)

    // Current ship facing angle (assuming ship faces +Y, rotation is around Z)
    // Ship faces +Y direction, so forward angle is rotation.z + PI/2
    const shipAngle = shipTransform.rotation.z + Math.PI / 2

    // Calculate angle difference (normalized to -PI to PI)
    let angleDiff = targetAngle - shipAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    // Rotate toward target (AI uses simple direction-based control)
    if (angleDiff > 0.01) {
      input.movement.x = -1 // Rotate counter-clockwise (left)
    } else if (angleDiff < -0.01) {
      input.movement.x = 1 // Rotate clockwise (right)
    }

    // Thrust when roughly facing target
    if (Math.abs(angleDiff) < FACING_THRESHOLD) {
      input.movement.y = 1 // Thrust forward
    }

    // Fire when well-aligned and cooldown is ready
    if (Math.abs(angleDiff) < FIRE_THRESHOLD && this.fireCooldown <= 0) {
      input.shoot = true
      this.fireCooldown = AI_FIRE_COOLDOWN
    }

    return input
  }

  /**
   * Find the nearest asteroid to the given position.
   */
  private findNearestAsteroid(
    world: World,
    shipPosition: Vector3,
    asteroids: EntityId[]
  ): { position: Vector3; distance: number } | null {
    let nearest: { position: Vector3; distance: number } | null = null
    let minDistance = Infinity

    for (const asteroidId of asteroids) {
      const transform = world.getComponent(asteroidId, TransformClass)
      if (!transform) continue

      const distance = shipPosition.distanceTo(transform.position)
      if (distance < minDistance) {
        minDistance = distance
        nearest = {
          position: transform.position.clone(),
          distance
        }
      }
    }

    return nearest
  }

  /**
   * Destroy the system and clean up resources.
   */
  destroy(): void {
    this.deactivate()
    this.onExitCallback = null
  }
}

/**
 * Creates the "PRESS START" overlay element.
 */
export function createPressStartOverlay(): HTMLElement {
  const overlay = document.createElement('div')
  overlay.id = 'press-start-overlay'
  overlay.style.position = 'fixed'
  overlay.style.top = '0'
  overlay.style.left = '0'
  overlay.style.width = '100%'
  overlay.style.height = '100%'
  overlay.style.display = 'flex'
  overlay.style.justifyContent = 'center'
  overlay.style.alignItems = 'flex-end'
  overlay.style.paddingBottom = '100px'
  overlay.style.pointerEvents = 'none'
  overlay.style.zIndex = '1100'

  const text = document.createElement('div')
  text.textContent = 'PRESS ANY KEY TO START'
  text.style.fontSize = '32px'
  text.style.fontFamily = 'monospace'
  text.style.color = '#00ffff'
  text.style.textShadow = '0 0 20px #00ffff'
  text.style.letterSpacing = '5px'
  text.style.animation = 'blink 1s infinite'

  // Add blink animation style
  const style = document.createElement('style')
  style.textContent = `
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `
  document.head.appendChild(style)

  overlay.appendChild(text)
  return overlay
}
