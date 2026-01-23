/**
 * Input System
 *
 * Handles keyboard input tracking for movement and game actions.
 * Provides a frame-synchronized interface for game logic to query input state.
 *
 * This is a utility pattern (not registered as ECS System) - a single global
 * instance is used by the game to track keyboard state.
 *
 * Key mappings:
 * - Movement: WASD or Arrow keys
 * - Shoot: Spacebar
 * - Pause: ESC
 * - Weapon switching: 1, 2, 3
 */
import { Vector2 } from 'three'

/**
 * Game actions that can be triggered by keyboard input.
 */
export type GameAction =
  | 'shoot'
  | 'pause'
  | 'switchWeapon1'
  | 'switchWeapon2'
  | 'switchWeapon3'
  | 'switchWeapon4'
  | 'switchWeaponPrev'
  | 'switchWeaponNext'

/**
 * Interface for objects that can receive keyboard events.
 * Compatible with Document and EventTarget.
 */
interface KeyboardEventTarget {
  addEventListener(type: 'keydown' | 'keyup', listener: (event: KeyboardEvent) => void): void
  removeEventListener(type: 'keydown' | 'keyup', listener: (event: KeyboardEvent) => void): void
}

/**
 * InputSystem class for tracking keyboard input.
 *
 * Movement input is normalized to a unit circle (diagonal movement
 * produces vector of length 1, not sqrt(2)).
 */
export class InputSystem {
  /** Set of currently pressed keys (lowercase normalized) */
  private keysPressed: Set<string> = new Set()

  /** Current movement input vector */
  private movementInput: Vector2 = new Vector2(0, 0)

  /** Currently active game actions */
  private currentActions: Set<GameAction> = new Set()

  /** Bound event handlers for cleanup */
  private readonly boundKeyDown: (event: KeyboardEvent) => void
  private readonly boundKeyUp: (event: KeyboardEvent) => void

  /** Flag to track if listeners are active */
  private isActive = true

  /** Event target for keyboard events (injected for testability) */
  private readonly eventTarget: KeyboardEventTarget

  /**
   * Creates a new InputSystem instance and registers keyboard event listeners.
   * @param eventTarget - Optional event target for keyboard events (defaults to document in browser)
   */
  constructor(eventTarget?: KeyboardEventTarget) {
    this.eventTarget =
      eventTarget ?? (typeof document !== 'undefined' ? document : this.createNoOpTarget())
    this.boundKeyDown = this.onKeyDown.bind(this)
    this.boundKeyUp = this.onKeyUp.bind(this)
    this.setupListeners()
  }

  /**
   * Creates a no-op event target for environments without document.
   */
  private createNoOpTarget(): KeyboardEventTarget {
    return {
      addEventListener: () => {},
      removeEventListener: () => {}
    }
  }

  /**
   * Sets up keyboard event listeners on the event target.
   */
  private setupListeners(): void {
    this.eventTarget.addEventListener('keydown', this.boundKeyDown)
    this.eventTarget.addEventListener('keyup', this.boundKeyUp)
  }

  /**
   * Handles keydown events - adds key to pressed set and triggers actions.
   * @param event - The keyboard event
   */
  private onKeyDown(event: KeyboardEvent): void {
    if (!this.isActive) return

    const key = event.key.toLowerCase()
    this.keysPressed.add(key)

    // Map keys to actions
    if (key === ' ') {
      this.currentActions.add('shoot')
      event.preventDefault()
    }
    if (key === 'escape') {
      this.currentActions.add('pause')
    }
    if (key === '1') {
      this.currentActions.add('switchWeapon1')
    }
    if (key === '2') {
      this.currentActions.add('switchWeapon2')
    }
    if (key === '3') {
      this.currentActions.add('switchWeapon3')
    }
    if (key === '4') {
      this.currentActions.add('switchWeapon4')
    }
    if (key === 'z') {
      this.currentActions.add('switchWeaponPrev')
    }
    if (key === 'x') {
      this.currentActions.add('switchWeaponNext')
    }
  }

  /**
   * Handles keyup events - removes key from pressed set and clears actions.
   * @param event - The keyboard event
   */
  private onKeyUp(event: KeyboardEvent): void {
    if (!this.isActive) return

    const key = event.key.toLowerCase()
    this.keysPressed.delete(key)

    // Remove actions
    if (key === ' ') {
      this.currentActions.delete('shoot')
    }
    if (key === 'escape') {
      this.currentActions.delete('pause')
    }
    if (key === '1') {
      this.currentActions.delete('switchWeapon1')
    }
    if (key === '2') {
      this.currentActions.delete('switchWeapon2')
    }
    if (key === '3') {
      this.currentActions.delete('switchWeapon3')
    }
    if (key === '4') {
      this.currentActions.delete('switchWeapon4')
    }
    if (key === 'z') {
      this.currentActions.delete('switchWeaponPrev')
    }
    if (key === 'x') {
      this.currentActions.delete('switchWeaponNext')
    }
  }

  /**
   * Gets the current movement input as a normalized Vector2.
   *
   * X-axis: -1 (left) to 1 (right)
   * Y-axis: -1 (down) to 1 (up)
   *
   * Diagonal movement is normalized to unit length.
   *
   * @returns A clone of the movement input vector (normalized to unit circle)
   */
  public getMovementInput(): Vector2 {
    // Reset movement vector
    this.movementInput.set(0, 0)

    // Horizontal (rotation) - left/right
    if (this.keysPressed.has('arrowleft') || this.keysPressed.has('a')) {
      this.movementInput.x -= 1
    }
    if (this.keysPressed.has('arrowright') || this.keysPressed.has('d')) {
      this.movementInput.x += 1
    }

    // Vertical (thrust) - up/down
    if (this.keysPressed.has('arrowup') || this.keysPressed.has('w')) {
      this.movementInput.y += 1
    }
    if (this.keysPressed.has('arrowdown') || this.keysPressed.has('s')) {
      this.movementInput.y -= 1
    }

    // Normalize to unit vector for diagonal movement
    // This ensures diagonal movement isn't faster than cardinal movement
    if (this.movementInput.length() > 0) {
      this.movementInput.normalize()
    }

    // Return a clone to prevent external mutation
    return this.movementInput.clone()
  }

  /**
   * Gets the currently active game actions.
   *
   * @returns A new Set containing all currently active actions
   */
  public getActions(): Set<GameAction> {
    return new Set(this.currentActions)
  }

  /**
   * Checks if a specific action is currently active.
   *
   * @param action - The action to check
   * @returns True if the action is currently active
   */
  public hasAction(action: GameAction): boolean {
    return this.currentActions.has(action)
  }

  /**
   * Update method called each frame by the game loop.
   * Currently a no-op as key states are updated via event handlers.
   * Reserved for future per-frame input processing if needed.
   */
  public update(): void {
    // Input system updates are event-driven
    // This method exists for game loop integration consistency
  }

  /**
   * Removes event listeners and cleans up the input system.
   * Should be called when the input system is no longer needed.
   */
  public destroy(): void {
    this.isActive = false
    this.eventTarget.removeEventListener('keydown', this.boundKeyDown)
    this.eventTarget.removeEventListener('keyup', this.boundKeyUp)
    this.keysPressed.clear()
    this.currentActions.clear()
    this.movementInput.set(0, 0)
  }
}
