/**
 * HUD - Heads-Up Display for game state information
 *
 * Displays score, lives, wave number, and current weapon using HTML elements.
 * Positions elements according to standard game HUD layout:
 * - Score: Top left
 * - Lives: Top left (below score)
 * - Wave: Top center
 * - Weapon: Top right
 *
 * This is a pure presentation component with no game logic.
 *
 * @module ui/HUD
 */

import type { ActivePowerUp, PowerUpType, WeaponType } from '../types/components'

/**
 * Interface for tracking power-up icon elements in the HUD.
 */
interface PowerUpIconElement {
  container: HTMLElement
  icon: HTMLElement
  timer: HTMLElement
  type: PowerUpType
}

/**
 * HUD class for displaying game state information.
 *
 * @example
 * ```typescript
 * const hud = new HUD()
 * hud.mount(document.body)
 * hud.updateScore(1000)
 * hud.updateLives(3)
 * hud.updateWave(5)
 * hud.updateWeapon('spread')
 * ```
 */
export class HUD {
  private container: HTMLElement
  private scoreElement: HTMLElement
  private livesElement: HTMLElement
  private waveElement: HTMLElement
  private weaponElement: HTMLElement
  private energyBarContainer: HTMLElement
  private energyBarFill: HTMLElement
  private ammoDisplayContainer: HTMLElement
  private ammoDisplayValue: HTMLElement
  private powerUpDisplayContainer: HTMLElement
  private activeIcons: Map<PowerUpType, PowerUpIconElement> = new Map()
  private parentElement: HTMLElement | null = null

  /** Display order for power-ups to ensure consistent visual order */
  private static readonly POWER_UP_ORDER: PowerUpType[] = [
    'shield',
    'rapidFire',
    'multiShot',
    'extraLife'
  ]

  constructor() {
    this.container = this.createContainer()
    this.scoreElement = this.createScoreDisplay()
    this.livesElement = this.createLivesDisplay()
    this.waveElement = this.createWaveDisplay()
    this.weaponElement = this.createWeaponDisplay()
    const energyBar = this.createEnergyBar()
    this.energyBarContainer = energyBar.container
    this.energyBarFill = energyBar.fill
    const ammoDisplay = this.createAmmoDisplay()
    this.ammoDisplayContainer = ammoDisplay.container
    this.ammoDisplayValue = ammoDisplay.value
    this.powerUpDisplayContainer = this.createPowerUpDisplay()

    // Add elements to container
    this.container.appendChild(this.scoreElement)
    this.container.appendChild(this.livesElement)
    this.container.appendChild(this.waveElement)
    this.container.appendChild(this.weaponElement)
    this.container.appendChild(this.energyBarContainer)
    this.container.appendChild(this.ammoDisplayContainer)
    this.container.appendChild(this.powerUpDisplayContainer)

    // Initialize with default values
    this.updateScore(0)
    this.updateLives(3)
    this.updateWave(1)
    this.updateWeapon('single')
    this.updateEnergyBar(100, 100)
    this.updateAmmoDisplay('infinite')
  }

  /**
   * Creates the main HUD container element.
   *
   * @returns The container HTMLElement
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'game-hud'
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.pointerEvents = 'none'
    container.style.zIndex = '1000'
    container.style.fontFamily = 'monospace'
    container.style.color = 'white'
    container.style.textShadow = '2px 2px 4px black'
    container.style.fontSize = '18px'
    return container
  }

  /**
   * Creates the score display element.
   * Positioned at top left.
   *
   * @returns The score HTMLElement
   */
  private createScoreDisplay(): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('data-hud', 'score')
    element.style.position = 'absolute'
    element.style.left = '20px'
    element.style.top = '20px'
    return element
  }

  /**
   * Creates the lives display element.
   * Positioned below score in top left.
   *
   * @returns The lives HTMLElement
   */
  private createLivesDisplay(): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('data-hud', 'lives')
    element.style.position = 'absolute'
    element.style.left = '20px'
    element.style.top = '50px'
    return element
  }

  /**
   * Creates the wave display element.
   * Positioned at top center.
   *
   * @returns The wave HTMLElement
   */
  private createWaveDisplay(): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('data-hud', 'wave')
    element.style.position = 'absolute'
    element.style.left = '50%'
    element.style.top = '20px'
    element.style.transform = 'translateX(-50%)'
    return element
  }

  /**
   * Creates the weapon display element.
   * Positioned at top right.
   *
   * @returns The weapon HTMLElement
   */
  private createWeaponDisplay(): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('data-hud', 'weapon')
    element.style.position = 'absolute'
    element.style.right = '20px'
    element.style.top = '20px'
    return element
  }

  /**
   * Updates the score display.
   *
   * @param score - The current score value
   */
  updateScore(score: number): void {
    this.scoreElement.textContent = `SCORE: ${score}`
  }

  /**
   * Updates the lives display.
   *
   * @param lives - The current number of lives
   */
  updateLives(lives: number): void {
    this.livesElement.textContent = `LIVES: ${lives}`
  }

  /**
   * Updates the wave display.
   *
   * @param wave - The current wave number
   */
  updateWave(wave: number): void {
    this.waveElement.textContent = `WAVE ${wave}`
  }

  /**
   * Updates the weapon display.
   *
   * @param weapon - The current weapon type
   */
  updateWeapon(weapon: WeaponType): void {
    const weaponNames: Record<WeaponType, string> = {
      single: 'SINGLE SHOT',
      spread: 'SPREAD SHOT',
      laser: 'LASER',
      homing: 'HOMING MISSILES'
    }
    this.weaponElement.textContent = weaponNames[weapon]

    // Show/hide energy bar based on weapon type (laser only)
    this.energyBarContainer.style.display = weapon === 'laser' ? 'block' : 'none'

    // Show/hide ammo display based on weapon type (homing only)
    this.ammoDisplayContainer.style.display = weapon === 'homing' ? 'block' : 'none'
  }

  /**
   * Creates the energy bar display element.
   * Positioned below weapon indicator on the right.
   *
   * @returns Object containing container, fill, and label elements
   */
  private createEnergyBar(): { container: HTMLElement; fill: HTMLElement; label: HTMLElement } {
    // Container for the energy bar
    const container = document.createElement('div')
    container.setAttribute('data-hud', 'energy-bar')
    container.style.position = 'absolute'
    container.style.right = '20px'
    container.style.top = '50px'
    container.style.width = '150px'
    container.style.display = 'none' // Hidden by default, shown when laser selected

    // Label
    const label = document.createElement('div')
    label.style.marginBottom = '4px'
    label.style.fontSize = '14px'
    label.textContent = 'ENERGY'

    // Bar background
    const barBg = document.createElement('div')
    barBg.style.width = '100%'
    barBg.style.height = '12px'
    barBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    barBg.style.border = '1px solid white'
    barBg.style.borderRadius = '2px'

    // Bar fill
    const fill = document.createElement('div')
    fill.setAttribute('data-hud', 'energy-fill')
    fill.style.width = '100%'
    fill.style.height = '100%'
    fill.style.backgroundColor = '#00ffff' // Cyan for full
    fill.style.borderRadius = '1px'
    fill.style.transition = 'width 0.1s ease-out, background-color 0.2s ease-out'

    barBg.appendChild(fill)
    container.appendChild(label)
    container.appendChild(barBg)

    return { container, fill, label }
  }

  /**
   * Updates the energy bar display.
   *
   * @param current - Current energy value
   * @param max - Maximum energy value
   */
  updateEnergyBar(current: number, max: number): void {
    const percentage = max > 0 ? (current / max) * 100 : 0
    const clampedPercentage = Math.max(0, Math.min(100, percentage))

    // Update width
    this.energyBarFill.style.width = `${clampedPercentage}%`

    // Update color based on percentage
    // Full: cyan (#00ffff)
    // Medium: yellow (#ffff00)
    // Low: orange (#ff8800)
    // Empty: red (#ff0000)
    let color: string
    if (clampedPercentage > 66) {
      color = '#00ffff' // Cyan
    } else if (clampedPercentage > 33) {
      color = '#ffff00' // Yellow
    } else if (clampedPercentage > 10) {
      color = '#ff8800' // Orange
    } else {
      color = '#ff0000' // Red
    }
    this.energyBarFill.style.backgroundColor = color
  }

  /**
   * Creates the ammo display element.
   * Positioned below weapon indicator on the right.
   *
   * @returns Object containing container and value elements
   */
  private createAmmoDisplay(): { container: HTMLElement; value: HTMLElement } {
    // Container for the ammo display
    const container = document.createElement('div')
    container.setAttribute('data-hud', 'ammo-display')
    container.style.position = 'absolute'
    container.style.right = '20px'
    container.style.top = '50px'
    container.style.display = 'none' // Hidden by default, shown when homing selected

    // Value display
    const value = document.createElement('div')
    value.setAttribute('data-hud', 'ammo-value')
    value.style.fontSize = '14px'

    container.appendChild(value)

    return { container, value }
  }

  /**
   * Creates the power-up display container element.
   * Positioned below weapon indicator and energy bar on the right.
   *
   * @returns The power-up display container HTMLElement
   */
  private createPowerUpDisplay(): HTMLElement {
    const container = document.createElement('div')
    container.setAttribute('data-hud', 'power-up-display')
    container.style.position = 'absolute'
    container.style.right = '20px'
    container.style.top = '85px' // Below weapon (20px) and energy bar area
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.gap = '8px'
    container.style.alignItems = 'flex-end'
    return container
  }

  /**
   * Creates a power-up icon element for display.
   *
   * @param type - The type of power-up
   * @returns The PowerUpIconElement with container, icon, and timer
   */
  private createPowerUpIcon(type: PowerUpType): PowerUpIconElement {
    const container = document.createElement('div')
    container.setAttribute('data-powerup-type', type)
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.gap = '8px'
    container.style.padding = '4px 8px'
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    container.style.borderRadius = '4px'
    container.style.border = '1px solid'
    container.style.borderColor = this.getPowerUpColor(type)

    // Icon element (CSS-based)
    const icon = document.createElement('div')
    icon.setAttribute('data-hud', 'power-up-icon')
    icon.style.width = '16px'
    icon.style.height = '16px'
    icon.style.borderRadius = '4px'
    icon.style.backgroundColor = this.getPowerUpColor(type)
    icon.textContent = this.getPowerUpSymbol(type)
    icon.style.fontSize = '10px'
    icon.style.textAlign = 'center'
    icon.style.lineHeight = '16px'

    // Timer element
    const timer = document.createElement('div')
    timer.setAttribute('data-hud', 'power-up-timer')
    timer.style.fontSize = '14px'
    timer.style.color = 'white'
    timer.style.minWidth = '40px'
    timer.style.textAlign = 'right'

    container.appendChild(icon)
    container.appendChild(timer)

    return { container, icon, timer, type }
  }

  /**
   * Gets the display color for a power-up type.
   *
   * @param type - The power-up type
   * @returns The color string
   */
  private getPowerUpColor(type: PowerUpType): string {
    const colors: Record<PowerUpType, string> = {
      shield: '#00ffff', // Cyan
      rapidFire: '#ff8800', // Orange
      multiShot: '#ff00ff', // Magenta
      extraLife: '#00ff00' // Green
    }
    return colors[type]
  }

  /**
   * Gets the display symbol for a power-up type.
   *
   * @param type - The power-up type
   * @returns The symbol character
   */
  private getPowerUpSymbol(type: PowerUpType): string {
    const symbols: Record<PowerUpType, string> = {
      shield: 'S',
      rapidFire: 'R',
      multiShot: 'M',
      extraLife: '+'
    }
    return symbols[type]
  }

  /**
   * Formats time in milliseconds to display string.
   * >= 10 seconds: whole seconds (e.g., "12s")
   * < 10 seconds: one decimal (e.g., "5.5s")
   *
   * @param ms - Time in milliseconds
   * @returns Formatted time string
   */
  private formatTime(ms: number): string {
    const seconds = ms / 1000
    if (seconds >= 10) {
      return `${Math.floor(seconds)}s`
    }
    return `${seconds.toFixed(1)}s`
  }

  /**
   * Removes a power-up icon from the display.
   *
   * @param type - The power-up type to remove
   */
  private removePowerUpIcon(type: PowerUpType): void {
    const iconElement = this.activeIcons.get(type)
    if (iconElement) {
      if (iconElement.container.parentElement) {
        iconElement.container.parentElement.removeChild(iconElement.container)
      }
      this.activeIcons.delete(type)
    }
  }

  /**
   * Updates the power-up display to show active power-ups.
   * Creates icons for new power-ups, updates timers for existing ones,
   * and removes icons for expired power-ups.
   *
   * @param effects - Array of active power-up effects
   */
  updatePowerUpDisplay(effects: ActivePowerUp[]): void {
    // Create a set of active power-up types for quick lookup
    const activeTypes = new Set(effects.map((e) => e.powerUpType))

    // Remove icons for expired power-ups
    for (const [type] of this.activeIcons) {
      if (!activeTypes.has(type)) {
        this.removePowerUpIcon(type)
      }
    }

    // Sort effects by the predefined order for consistent display
    const sortedEffects = [...effects].sort((a, b) => {
      const orderA = HUD.POWER_UP_ORDER.indexOf(a.powerUpType)
      const orderB = HUD.POWER_UP_ORDER.indexOf(b.powerUpType)
      return orderA - orderB
    })

    // Clear container and re-add in order
    while (this.powerUpDisplayContainer.firstChild) {
      this.powerUpDisplayContainer.removeChild(this.powerUpDisplayContainer.firstChild)
    }

    // Update or create icons for each active effect
    for (const effect of sortedEffects) {
      const { powerUpType, remainingTime } = effect

      let iconElement = this.activeIcons.get(powerUpType)

      // Create icon if it doesn't exist
      if (!iconElement) {
        iconElement = this.createPowerUpIcon(powerUpType)
        this.activeIcons.set(powerUpType, iconElement)
      }

      // Update timer text
      iconElement.timer.textContent = this.formatTime(remainingTime)

      // Apply warning visual when time < 3 seconds
      const isWarning = remainingTime < 3000
      if (isWarning) {
        iconElement.container.classList.add('power-up-warning')
        iconElement.container.style.animation = 'pulse 0.5s ease-in-out infinite'
      } else {
        iconElement.container.classList.remove('power-up-warning')
        iconElement.container.style.animation = ''
      }

      // Add to container in sorted order
      this.powerUpDisplayContainer.appendChild(iconElement.container)
    }
  }

  /**
   * Gets the power-up display container element.
   * Primarily used for testing.
   *
   * @returns The power-up display container HTMLElement
   */
  getPowerUpDisplayContainer(): HTMLElement {
    return this.powerUpDisplayContainer
  }

  /**
   * Updates the ammo display.
   *
   * @param ammo - Current ammo value or 'infinite' for unlimited
   */
  updateAmmoDisplay(ammo: number | 'infinite'): void {
    if (ammo === 'infinite') {
      this.ammoDisplayValue.textContent = 'MISSILES: --'
      this.ammoDisplayValue.style.color = 'white'
    } else {
      this.ammoDisplayValue.textContent = `MISSILES: ${ammo}`

      // Color: red when ammo low (< 3), normal otherwise
      if (ammo < 3) {
        this.ammoDisplayValue.style.color = '#ff0000' // Red
      } else {
        this.ammoDisplayValue.style.color = 'white'
      }
    }
  }

  /**
   * Gets the ammo display container element.
   * Primarily used for testing.
   *
   * @returns The ammo display container HTMLElement
   */
  getAmmoDisplayContainer(): HTMLElement {
    return this.ammoDisplayContainer
  }

  /**
   * Gets the energy bar container element.
   * Primarily used for testing.
   *
   * @returns The energy bar container HTMLElement
   */
  getEnergyBarContainer(): HTMLElement {
    return this.energyBarContainer
  }

  /**
   * Shows the HUD.
   */
  show(): void {
    this.container.style.display = ''
  }

  /**
   * Hides the HUD.
   */
  hide(): void {
    this.container.style.display = 'none'
  }

  /**
   * Mounts the HUD to a parent element.
   * If already mounted to a different parent, unmounts first.
   *
   * @param parent - The parent HTMLElement to mount to
   */
  mount(parent: HTMLElement): void {
    // If already mounted to a different parent, unmount first
    if (this.parentElement && this.parentElement !== parent) {
      this.unmount()
    }

    // Only append if not already a child of this parent
    if (!parent.contains(this.container)) {
      parent.appendChild(this.container)
    }

    this.parentElement = parent
  }

  /**
   * Unmounts the HUD from its parent element.
   * Safe to call even if not mounted.
   */
  unmount(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
    this.parentElement = null
  }

  /**
   * Gets the container element.
   * Primarily used for testing.
   *
   * @returns The container HTMLElement
   */
  getContainer(): HTMLElement {
    return this.container
  }
}
