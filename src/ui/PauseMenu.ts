/**
 * Pause Menu Component
 *
 * Displays the pause menu interface with Resume, Settings, and Main Menu
 * buttons. Supports keyboard navigation (arrow keys), ESC key to resume,
 * and coordinates with HUD visibility during pause state.
 *
 * @module ui/PauseMenu
 */

import { SettingsPanel } from './SettingsPanel'

/**
 * Minimal interface for GameStateMachine to allow testing with mocks.
 */
interface GameStateMachineLike {
  transition(event: string): boolean
}

/**
 * Minimal interface for HUD to allow testing with mocks.
 */
interface HUDLike {
  show(): void
  hide(): void
}

/** Button configuration */
interface MenuButton {
  label: string
  className: string
  action: () => void
}

/**
 * PauseMenu - Pause menu UI component with navigation support.
 *
 * @example
 * ```typescript
 * const pauseMenu = new PauseMenu(gameStateMachine, hud)
 * pauseMenu.mount(document.body)
 * pauseMenu.show() // Shows pause menu, hides HUD
 * pauseMenu.hide() // Hides pause menu, shows HUD
 * ```
 */
export class PauseMenu {
  private container: HTMLElement
  private buttons: HTMLButtonElement[] = []
  private focusedIndex = 0
  private parentElement: HTMLElement | null = null
  private settingsPanel: SettingsPanel
  private readonly gameStateMachine: GameStateMachineLike
  private readonly hud: HUDLike

  constructor(gameStateMachine: GameStateMachineLike, hud: HUDLike) {
    this.gameStateMachine = gameStateMachine
    this.hud = hud
    this.container = this.createContainer()
    this.settingsPanel = new SettingsPanel()

    this.assembleMenu()
  }

  /**
   * Creates the main container element.
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'pause-menu'
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.display = 'none'
    container.style.flexDirection = 'column'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'center'
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
    container.style.zIndex = '1500'
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
    title.setAttribute('data-pause', 'title')
    title.textContent = 'PAUSED'
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
        label: 'Resume',
        className: 'resume-button',
        action: () => this.handleResumeClick()
      },
      {
        label: 'Settings',
        className: 'settings-button',
        action: () => this.handleSettingsClick()
      },
      {
        label: 'Main Menu',
        className: 'main-menu-button',
        action: () => this.handleMainMenuClick()
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
   * Handles Resume button click.
   */
  private handleResumeClick(): void {
    this.hide()
    this.hud.show()
    this.gameStateMachine.transition('resume')
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
   * Handles Main Menu button click.
   */
  private handleMainMenuClick(): void {
    this.gameStateMachine.transition('returnToMenu')
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
   * Shows the pause menu and hides the HUD.
   */
  show(): void {
    this.container.style.display = 'flex'
    this.focusedIndex = 0
    this.updateFocusStyling()
    this.hud.hide()
  }

  /**
   * Hides the pause menu and shows the HUD.
   */
  hide(): void {
    this.container.style.display = 'none'
    this.settingsPanel.hide()
    this.hud.show()
  }

  /**
   * Handles keyboard events.
   * @param event - The keyboard event
   */
  handleKeyDown(event: KeyboardEvent): void {
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
      case 'Escape':
        this.handleResumeClick()
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
    this.settingsPanel.hide()
    this.settingsPanel.unmount()
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
   * @returns The focused button index (0-2)
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
