/**
 * ArcadeInitials - Classic arcade 3-character initial entry
 *
 * Provides the classic arcade high score name entry experience:
 * - 3 character positions (AAA style)
 * - Up/down arrows cycle through A-Z
 * - Left/right arrows move between positions
 * - Blinking cursor on current position
 * - Enter key to confirm
 *
 * @module ui/ArcadeInitials
 */

/** Callback when initials are confirmed */
export type InitialsConfirmedCallback = (initials: string) => void

/**
 * ArcadeInitials class for classic 3-character initial entry.
 *
 * @example
 * ```typescript
 * const initials = new ArcadeInitials((name) => {
 *   console.log('Player name:', name)
 * })
 * initials.mount(document.body)
 * initials.reset()
 * ```
 */
export class ArcadeInitials {
  private container: HTMLElement
  private charElements: HTMLElement[] = []
  private currentPosition = 0
  private characters: string[] = ['A', 'A', 'A']
  private blinkInterval: number | null = null
  private blinkState = true
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private isActive = false

  private readonly onConfirm: InitialsConfirmedCallback

  /** Available characters (A-Z) */
  private static readonly CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  constructor(onConfirm: InitialsConfirmedCallback) {
    this.onConfirm = onConfirm
    this.container = this.createContainer()
    this.setupKeyboardHandler()
  }

  /**
   * Creates the main container with 3 character slots.
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.gap = '10px'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'center'

    // Create 3 character slots
    for (let i = 0; i < 3; i++) {
      const slot = this.createCharSlot(i)
      this.charElements.push(slot)
      container.appendChild(slot)
    }

    return container
  }

  /**
   * Creates a single character slot element.
   */
  private createCharSlot(index: number): HTMLElement {
    const slot = document.createElement('div')
    slot.setAttribute('data-testid', `initial-slot-${index}`)
    slot.style.width = '50px'
    slot.style.height = '60px'
    slot.style.display = 'flex'
    slot.style.justifyContent = 'center'
    slot.style.alignItems = 'center'
    slot.style.fontSize = '48px'
    slot.style.fontFamily = 'monospace'
    slot.style.fontWeight = 'bold'
    slot.style.color = '#00ffff'
    slot.style.textShadow = '0 0 10px #00ffff'
    slot.style.borderBottom = '4px solid transparent'
    slot.style.transition = 'border-color 0.1s'
    slot.textContent = this.characters[index] ?? 'A'
    return slot
  }

  /**
   * Sets up keyboard event handling.
   */
  private setupKeyboardHandler(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.isActive) return

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          this.cycleCharacter(1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          this.cycleCharacter(-1)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          this.moveCursor(-1)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          this.moveCursor(1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          this.confirm()
          break
      }
    }
  }

  /**
   * Cycles the current character up or down through A-Z.
   */
  private cycleCharacter(direction: number): void {
    const chars = ArcadeInitials.CHARS
    const currentChar = this.characters[this.currentPosition] ?? 'A'
    const currentIndex = chars.indexOf(currentChar)
    let newIndex = currentIndex + direction

    // Wrap around
    if (newIndex < 0) newIndex = chars.length - 1
    if (newIndex >= chars.length) newIndex = 0

    this.characters[this.currentPosition] = chars[newIndex] ?? 'A'
    this.updateDisplay()
  }

  /**
   * Moves the cursor left or right.
   */
  private moveCursor(direction: number): void {
    this.currentPosition += direction

    // Clamp to valid range
    if (this.currentPosition < 0) this.currentPosition = 0
    if (this.currentPosition > 2) this.currentPosition = 2

    this.updateDisplay()
  }

  /**
   * Confirms the entered initials.
   */
  private confirm(): void {
    const initials = this.characters.join('')
    this.onConfirm(initials)
  }

  /**
   * Updates the visual display of all character slots.
   */
  private updateDisplay(): void {
    for (let i = 0; i < 3; i++) {
      const slot = this.charElements[i]
      if (!slot) continue

      slot.textContent = this.characters[i] ?? 'A'

      // Show cursor on current position
      if (i === this.currentPosition && this.blinkState) {
        slot.style.borderBottomColor = '#00ffff'
        slot.style.color = '#ffffff'
      } else {
        slot.style.borderBottomColor = 'transparent'
        slot.style.color = i === this.currentPosition ? '#ffffff' : '#00ffff'
      }
    }
  }

  /**
   * Starts the cursor blink animation.
   */
  private startBlink(): void {
    if (this.blinkInterval) return

    this.blinkInterval = window.setInterval(() => {
      this.blinkState = !this.blinkState
      this.updateDisplay()
    }, 400)
  }

  /**
   * Stops the cursor blink animation.
   */
  private stopBlink(): void {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval)
      this.blinkInterval = null
    }
  }

  /**
   * Resets the initials to AAA and activates input.
   */
  reset(): void {
    this.characters = ['A', 'A', 'A']
    this.currentPosition = 0
    this.blinkState = true
    this.updateDisplay()
  }

  /**
   * Activates the initials input (enables keyboard handling).
   */
  activate(): void {
    this.isActive = true
    this.startBlink()
    if (this.keydownHandler) {
      document.addEventListener('keydown', this.keydownHandler)
    }
  }

  /**
   * Deactivates the initials input.
   */
  deactivate(): void {
    this.isActive = false
    this.stopBlink()
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
    }
  }

  /**
   * Gets the current initials string.
   */
  getInitials(): string {
    return this.characters.join('')
  }

  /**
   * Gets the container element.
   */
  getContainer(): HTMLElement {
    return this.container
  }

  /**
   * Mounts the component to a parent element.
   */
  mount(parent: HTMLElement): void {
    if (!parent.contains(this.container)) {
      parent.appendChild(this.container)
    }
  }

  /**
   * Unmounts the component.
   */
  unmount(): void {
    this.deactivate()
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
  }

  /**
   * Destroys the component and cleans up resources.
   */
  destroy(): void {
    this.deactivate()
    this.unmount()
  }
}
