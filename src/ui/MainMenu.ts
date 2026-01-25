/**
 * Main Menu Component
 *
 * Displays the main menu interface with Play, Settings, Leaderboard,
 * and Instructions buttons. Supports keyboard navigation (arrow keys)
 * and state transitions via GameStateMachine.
 *
 * @module ui/MainMenu
 */

import { SettingsPanel } from './SettingsPanel'

/**
 * Minimal interface for GameStateMachine to allow testing with mocks.
 */
interface GameStateMachineLike {
  transition(event: string): boolean
}

/** Button configuration */
interface MenuButton {
  label: string
  className: string
  action: () => void
}

/**
 * MainMenu - Main menu UI component with navigation support.
 *
 * @example
 * ```typescript
 * const menu = new MainMenu(gameStateMachine)
 * menu.mount(document.body)
 * menu.show()
 * ```
 */
export class MainMenu {
  private container: HTMLElement
  private buttons: HTMLButtonElement[] = []
  private focusedIndex = 0
  private parentElement: HTMLElement | null = null
  private settingsPanel: SettingsPanel
  private leaderboardOverlay: HTMLElement | null = null
  private instructionsOverlay: HTMLElement | null = null
  private readonly gameStateMachine: GameStateMachineLike

  /** Callback when user interacts with menu (for idle timer reset) */
  private onInteractionCallback: (() => void) | null = null

  constructor(gameStateMachine: GameStateMachineLike) {
    this.gameStateMachine = gameStateMachine
    this.container = this.createContainer()
    this.settingsPanel = new SettingsPanel()

    this.assembleMenu()
    this.setupEventListeners()
  }

  /**
   * Sets callback for when user interacts with the menu.
   * Used to reset attract mode idle timer.
   * @param callback - The callback function
   */
  onInteraction(callback: () => void): void {
    this.onInteractionCallback = callback
  }

  /**
   * Triggers the interaction callback if set.
   */
  private notifyInteraction(): void {
    if (this.onInteractionCallback) {
      this.onInteractionCallback()
    }
  }

  /**
   * Creates the main container element.
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'main-menu'
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.display = 'none'
    container.style.flexDirection = 'column'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'center'
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
    container.style.zIndex = '1000'
    container.style.fontFamily = 'monospace'
    container.style.color = 'white'
    return container
  }

  /**
   * Creates a menu button.
   */
  private createButton(config: MenuButton): HTMLButtonElement {
    const button = document.createElement('button')
    button.className = `menu-button ${config.className}`
    button.textContent = config.label
    button.style.padding = '15px 60px'
    button.style.fontSize = '20px'
    button.style.cursor = 'pointer'
    button.style.backgroundColor = 'transparent'
    button.style.border = '2px solid #00ffff'
    button.style.color = '#00ffff'
    button.style.fontFamily = 'monospace'
    button.style.margin = '10px'
    button.style.minWidth = '250px'
    button.style.transition = 'all 0.2s ease'

    button.addEventListener('click', config.action)

    return button
  }

  /**
   * Assembles all menu elements.
   */
  private assembleMenu(): void {
    // Title
    const title = document.createElement('h1')
    title.setAttribute('data-menu', 'title')
    title.textContent = 'ASTEROIDS'
    title.style.fontSize = '64px'
    title.style.marginBottom = '60px'
    title.style.color = '#00ffff'
    title.style.textShadow = '0 0 20px #00ffff, 0 0 40px #00ffff'
    title.style.letterSpacing = '10px'
    this.container.appendChild(title)

    // Button container
    const buttonContainer = document.createElement('div')
    buttonContainer.style.display = 'flex'
    buttonContainer.style.flexDirection = 'column'
    buttonContainer.style.alignItems = 'center'

    // Create buttons
    const buttonConfigs: MenuButton[] = [
      {
        label: 'Play',
        className: 'play-button',
        action: () => this.handlePlayClick()
      },
      {
        label: 'Settings',
        className: 'settings-button',
        action: () => this.handleSettingsClick()
      },
      {
        label: 'Leaderboard',
        className: 'leaderboard-button',
        action: () => this.handleLeaderboardClick()
      },
      {
        label: 'Instructions',
        className: 'instructions-button',
        action: () => this.handleInstructionsClick()
      }
    ]

    for (const config of buttonConfigs) {
      const button = this.createButton(config)
      this.buttons.push(button)
      buttonContainer.appendChild(button)
    }

    this.container.appendChild(buttonContainer)
  }

  /**
   * Sets up keyboard event listeners.
   */
  private setupEventListeners(): void {
    // Keyboard listener will be handled by handleKeyDown method
  }

  /**
   * Handles Play button click.
   */
  private handlePlayClick(): void {
    this.gameStateMachine.transition('startGame')
  }

  /**
   * Handles Settings button click.
   */
  private handleSettingsClick(): void {
    if (this.parentElement) {
      this.settingsPanel.mount(this.parentElement)
    }
    this.settingsPanel.show(() => {
      // Settings closed callback
    })
  }

  /**
   * Handles Leaderboard button click.
   */
  private handleLeaderboardClick(): void {
    this.showLeaderboardOverlay()
  }

  /**
   * Handles Instructions button click.
   */
  private handleInstructionsClick(): void {
    this.showInstructionsOverlay()
  }

  /**
   * Shows the leaderboard overlay.
   */
  private showLeaderboardOverlay(): void {
    if (!this.leaderboardOverlay) {
      this.leaderboardOverlay = this.createOverlay(
        'leaderboard-overlay',
        'LEADERBOARD',
        this.createLeaderboardContent()
      )
    }

    if (this.parentElement && !this.parentElement.contains(this.leaderboardOverlay)) {
      this.parentElement.appendChild(this.leaderboardOverlay)
    }
    this.leaderboardOverlay.style.display = 'flex'
  }

  /**
   * Shows the instructions overlay.
   */
  private showInstructionsOverlay(): void {
    if (!this.instructionsOverlay) {
      this.instructionsOverlay = this.createOverlay(
        'instructions-overlay',
        'INSTRUCTIONS',
        this.createInstructionsContent()
      )
    }

    if (this.parentElement && !this.parentElement.contains(this.instructionsOverlay)) {
      this.parentElement.appendChild(this.instructionsOverlay)
    }
    this.instructionsOverlay.style.display = 'flex'
  }

  /**
   * Creates an overlay element.
   */
  private createOverlay(id: string, title: string, content: HTMLElement): HTMLElement {
    const overlay = document.createElement('div')
    overlay.id = id
    overlay.style.position = 'fixed'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.display = 'none'
    overlay.style.justifyContent = 'center'
    overlay.style.alignItems = 'center'
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
    overlay.style.zIndex = '1500'
    overlay.style.fontFamily = 'monospace'
    overlay.style.color = 'white'

    const panel = document.createElement('div')
    panel.style.backgroundColor = 'rgba(0, 20, 40, 0.95)'
    panel.style.padding = '40px'
    panel.style.borderRadius = '10px'
    panel.style.border = '2px solid #00ffff'
    panel.style.textAlign = 'center'
    panel.style.minWidth = '400px'
    panel.style.maxHeight = '80vh'
    panel.style.overflow = 'auto'

    const titleElement = document.createElement('h2')
    titleElement.textContent = title
    titleElement.style.marginBottom = '30px'
    titleElement.style.fontSize = '28px'
    titleElement.style.color = '#00ffff'
    titleElement.style.textShadow = '0 0 10px #00ffff'
    panel.appendChild(titleElement)

    panel.appendChild(content)

    const backButton = document.createElement('button')
    backButton.textContent = 'Back'
    backButton.style.padding = '10px 30px'
    backButton.style.fontSize = '18px'
    backButton.style.cursor = 'pointer'
    backButton.style.backgroundColor = 'transparent'
    backButton.style.border = '2px solid #00ffff'
    backButton.style.color = '#00ffff'
    backButton.style.fontFamily = 'monospace'
    backButton.style.marginTop = '30px'
    backButton.addEventListener('click', () => {
      overlay.style.display = 'none'
    })
    panel.appendChild(backButton)

    overlay.appendChild(panel)
    return overlay
  }

  /**
   * Creates leaderboard content.
   */
  private createLeaderboardContent(): HTMLElement {
    const content = document.createElement('div')
    content.style.textAlign = 'left'

    const placeholder = document.createElement('p')
    placeholder.textContent = 'No scores yet. Play to set a high score!'
    placeholder.style.color = '#888'
    content.appendChild(placeholder)

    return content
  }

  /**
   * Creates instructions content.
   */
  private createInstructionsContent(): HTMLElement {
    const content = document.createElement('div')
    content.style.textAlign = 'left'

    const instructions = [
      { key: 'W / Arrow Up', action: 'Thrust forward' },
      { key: 'A / Arrow Left', action: 'Rotate left' },
      { key: 'D / Arrow Right', action: 'Rotate right' },
      { key: 'Space', action: 'Fire weapon' },
      { key: 'ESC', action: 'Pause game' },
      { key: '1-3', action: 'Switch weapons' }
    ]

    for (const instruction of instructions) {
      const row = document.createElement('div')
      row.style.marginBottom = '10px'
      row.style.display = 'flex'
      row.style.justifyContent = 'space-between'

      const keySpan = document.createElement('span')
      keySpan.textContent = instruction.key
      keySpan.style.color = '#00ffff'
      keySpan.style.fontWeight = 'bold'

      const actionSpan = document.createElement('span')
      actionSpan.textContent = instruction.action
      actionSpan.style.marginLeft = '30px'

      row.appendChild(keySpan)
      row.appendChild(actionSpan)
      content.appendChild(row)
    }

    const objective = document.createElement('p')
    objective.textContent = 'Destroy asteroids and survive as long as possible!'
    objective.style.marginTop = '20px'
    objective.style.fontStyle = 'italic'
    content.appendChild(objective)

    return content
  }

  /**
   * Updates button focus styling.
   */
  private updateFocusStyling(): void {
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i]
      if (!button) continue

      if (i === this.focusedIndex) {
        button.classList.add('focused')
        button.style.backgroundColor = 'rgba(0, 255, 255, 0.2)'
        button.style.boxShadow = '0 0 20px #00ffff'
      } else {
        button.classList.remove('focused')
        button.style.backgroundColor = 'transparent'
        button.style.boxShadow = 'none'
      }
    }
  }

  /**
   * Shows the main menu.
   */
  show(): void {
    this.container.style.display = 'flex'
    this.focusedIndex = 0
    this.updateFocusStyling()
  }

  /**
   * Hides the main menu.
   */
  hide(): void {
    this.container.style.display = 'none'
    // Also hide any open overlays
    if (this.leaderboardOverlay) {
      this.leaderboardOverlay.style.display = 'none'
    }
    if (this.instructionsOverlay) {
      this.instructionsOverlay.style.display = 'none'
    }
    this.settingsPanel.hide()
  }

  /**
   * Handles keyboard events.
   * @param event - The keyboard event
   */
  handleKeyDown(event: KeyboardEvent): void {
    // Notify interaction for idle timer reset
    this.notifyInteraction()

    switch (event.key) {
      case 'ArrowUp':
        this.focusedIndex = this.focusedIndex <= 0 ? this.buttons.length - 1 : this.focusedIndex - 1
        this.updateFocusStyling()
        event.preventDefault()
        break
      case 'ArrowDown':
        this.focusedIndex = this.focusedIndex >= this.buttons.length - 1 ? 0 : this.focusedIndex + 1
        this.updateFocusStyling()
        event.preventDefault()
        break
      case 'Enter':
      case ' ':
        this.buttons[this.focusedIndex]?.click()
        event.preventDefault()
        break
    }
  }

  /**
   * Mounts the menu to a parent element.
   * @param parent - The parent HTMLElement
   */
  mount(parent: HTMLElement): void {
    if (this.parentElement && this.parentElement !== parent) {
      this.unmount()
    }

    if (!parent.contains(this.container)) {
      parent.appendChild(this.container)
    }

    this.parentElement = parent
  }

  /**
   * Unmounts the menu from its parent.
   */
  unmount(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
    this.settingsPanel.unmount()
    if (this.leaderboardOverlay?.parentElement) {
      this.leaderboardOverlay.parentElement.removeChild(this.leaderboardOverlay)
    }
    if (this.instructionsOverlay?.parentElement) {
      this.instructionsOverlay.parentElement.removeChild(this.instructionsOverlay)
    }
    this.parentElement = null
  }

  /**
   * Gets the container element (for testing).
   * @returns The container HTMLElement
   */
  getContainer(): HTMLElement {
    return this.container
  }

  /**
   * Gets the currently focused button index.
   * @returns The focused button index (0-3)
   */
  getFocusedButtonIndex(): number {
    return this.focusedIndex
  }

  /**
   * Gets the settings panel instance.
   * @returns The SettingsPanel instance
   */
  getSettingsPanel(): SettingsPanel {
    return this.settingsPanel
  }
}
