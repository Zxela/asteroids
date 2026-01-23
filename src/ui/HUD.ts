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

import type { WeaponType } from '../types/components'

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
  private parentElement: HTMLElement | null = null

  constructor() {
    this.container = this.createContainer()
    this.scoreElement = this.createScoreDisplay()
    this.livesElement = this.createLivesDisplay()
    this.waveElement = this.createWaveDisplay()
    this.weaponElement = this.createWeaponDisplay()
    const energyBar = this.createEnergyBar()
    this.energyBarContainer = energyBar.container
    this.energyBarFill = energyBar.fill

    // Add elements to container
    this.container.appendChild(this.scoreElement)
    this.container.appendChild(this.livesElement)
    this.container.appendChild(this.waveElement)
    this.container.appendChild(this.weaponElement)
    this.container.appendChild(this.energyBarContainer)

    // Initialize with default values
    this.updateScore(0)
    this.updateLives(3)
    this.updateWave(1)
    this.updateWeapon('single')
    this.updateEnergyBar(100, 100)
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

    // Show/hide energy bar based on weapon type
    this.energyBarContainer.style.display = weapon === 'laser' ? 'block' : 'none'
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
