/**
 * Boss Health Bar UI Component
 *
 * HTML overlay positioned at top center of screen.
 * Displays boss name, health bar, and health percentage.
 *
 * Features:
 * - Width: 400px, Height: 30px
 * - Positioned 50px from top
 * - Color gradient: red (low) -> yellow (mid) -> green (high)
 * - Dark background with border
 *
 * @module ui/BossHealthBar
 */

/**
 * BossHealthBar class for displaying boss health.
 *
 * @example
 * ```typescript
 * const healthBar = new BossHealthBar()
 * healthBar.mount(document.body)
 * healthBar.show('Destroyer')
 * healthBar.update(50, 100)  // 50% health
 * healthBar.hide()
 * ```
 */
export class BossHealthBar {
  private container: HTMLElement
  private nameElement: HTMLElement
  private barContainer: HTMLElement
  private barFill: HTMLElement
  private percentageElement: HTMLElement
  private parentElement: HTMLElement | null = null

  /** Health bar width in pixels */
  private static readonly BAR_WIDTH = 400

  /** Health bar height in pixels */
  private static readonly BAR_HEIGHT = 30

  /** Top offset in pixels */
  private static readonly TOP_OFFSET = 50

  constructor() {
    this.container = this.createContainer()
    this.nameElement = this.createNameDisplay()
    this.barContainer = this.createBarContainer()
    this.barFill = this.createBarFill()
    this.percentageElement = this.createPercentageDisplay()

    // Assemble the component
    this.barContainer.appendChild(this.barFill)
    this.container.appendChild(this.nameElement)
    this.container.appendChild(this.barContainer)
    this.container.appendChild(this.percentageElement)

    // Initially hidden
    this.container.style.display = 'none'
  }

  /**
   * Creates the main container element.
   *
   * @returns The container HTMLElement
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'boss-health-bar'
    container.style.position = 'fixed'
    container.style.top = `${BossHealthBar.TOP_OFFSET}px`
    container.style.left = '50%'
    container.style.transform = 'translateX(-50%)'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.alignItems = 'center'
    container.style.gap = '4px'
    container.style.pointerEvents = 'none'
    container.style.zIndex = '1001'
    container.style.fontFamily = 'monospace'
    container.style.color = 'white'
    container.style.textShadow = '2px 2px 4px black'
    return container
  }

  /**
   * Creates the boss name display element.
   *
   * @returns The name HTMLElement
   */
  private createNameDisplay(): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('data-boss-ui', 'name')
    element.style.fontSize = '20px'
    element.style.fontWeight = 'bold'
    element.style.textTransform = 'uppercase'
    element.style.letterSpacing = '2px'
    return element
  }

  /**
   * Creates the health bar container element.
   *
   * @returns The bar container HTMLElement
   */
  private createBarContainer(): HTMLElement {
    const container = document.createElement('div')
    container.setAttribute('data-boss-ui', 'bar-container')
    container.style.width = `${BossHealthBar.BAR_WIDTH}px`
    container.style.height = `${BossHealthBar.BAR_HEIGHT}px`
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    container.style.border = '2px solid white'
    container.style.borderRadius = '4px'
    container.style.overflow = 'hidden'
    return container
  }

  /**
   * Creates the health bar fill element.
   *
   * @returns The bar fill HTMLElement
   */
  private createBarFill(): HTMLElement {
    const fill = document.createElement('div')
    fill.setAttribute('data-boss-ui', 'bar-fill')
    fill.style.width = '100%'
    fill.style.height = '100%'
    fill.style.backgroundColor = '#00ff00' // Start green (full health)
    fill.style.transition = 'width 0.2s ease-out, background-color 0.3s ease-out'
    return fill
  }

  /**
   * Creates the percentage display element.
   *
   * @returns The percentage HTMLElement
   */
  private createPercentageDisplay(): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('data-boss-ui', 'percentage')
    element.style.fontSize = '14px'
    return element
  }

  /**
   * Gets the color for a given health percentage.
   * Uses gradient from green (high) to yellow (mid) to red (low).
   *
   * @param percentage - Health percentage (0-100)
   * @returns CSS color string
   */
  private getHealthColor(percentage: number): string {
    // Green (>66%) -> Yellow (33-66%) -> Orange (15-33%) -> Red (<15%)
    if (percentage > 66) {
      return '#00ff00' // Green
    }
    if (percentage > 33) {
      return '#ffff00' // Yellow
    }
    if (percentage > 15) {
      return '#ff8800' // Orange
    }
    return '#ff0000' // Red
  }

  /**
   * Shows the health bar with the given boss name.
   *
   * @param bossName - Name to display above health bar
   */
  show(bossName: string): void {
    this.nameElement.textContent = bossName
    this.container.style.display = 'flex'
  }

  /**
   * Hides the health bar.
   */
  hide(): void {
    this.container.style.display = 'none'
  }

  /**
   * Updates the health bar display.
   *
   * @param current - Current health value
   * @param max - Maximum health value
   */
  update(current: number, max: number): void {
    const percentage = max > 0 ? (current / max) * 100 : 0
    const clampedPercentage = Math.max(0, Math.min(100, percentage))

    // Update bar width
    this.barFill.style.width = `${clampedPercentage}%`

    // Update bar color
    this.barFill.style.backgroundColor = this.getHealthColor(clampedPercentage)

    // Update percentage text
    this.percentageElement.textContent = `${Math.floor(clampedPercentage)}%`
  }

  /**
   * Mounts the health bar to a parent element.
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
   * Unmounts the health bar from its parent element.
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

  /**
   * Checks if the health bar is currently visible.
   *
   * @returns True if visible
   */
  isVisible(): boolean {
    return this.container.style.display !== 'none'
  }
}
