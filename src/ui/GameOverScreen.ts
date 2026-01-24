/**
 * GameOverScreen - Game Over UI Component
 *
 * Displays the game over screen with final score, wave reached,
 * and player name input for leaderboard submission.
 *
 * Features:
 * - Final score and wave display
 * - Name input field (3-20 characters)
 * - Submit button for leaderboard entry
 * - Try Again button to restart game
 * - Main Menu button to return to menu
 * - Keyboard navigation (Enter to submit, ESC to return to menu)
 *
 * @module ui/GameOverScreen
 */

import type { LeaderboardEntry } from '../types/game'

/**
 * Interface for LeaderboardStorage to save scores.
 * This allows dependency injection for testing.
 */
export interface LeaderboardStorage {
  saveScore(entry: LeaderboardEntry): void
  getTopScores(): LeaderboardEntry[]
}

/**
 * Interface for GameStateMachine to trigger transitions.
 * This allows dependency injection for testing.
 */
export interface GameStateMachineInterface {
  transition(event: string): boolean
  getCurrentStateName(): string | null
}

/**
 * GameOverScreen class for displaying game over UI.
 *
 * @example
 * ```typescript
 * const screen = new GameOverScreen(gameStateMachine, leaderboardStorage)
 * screen.mount(document.body)
 * screen.show(1500, 5) // Show with score 1500, wave 5
 * ```
 */
export class GameOverScreen {
  private container: HTMLElement
  private titleElement: HTMLElement
  private scoreElement: HTMLElement
  private waveElement: HTMLElement
  private nameLabelElement: HTMLElement
  private nameInput: HTMLInputElement
  private submitButton: HTMLButtonElement
  private tryAgainButton: HTMLButtonElement
  private mainMenuButton: HTMLButtonElement
  private parentElement: HTMLElement | null = null

  private currentScore = 0
  private currentWave = 0
  private isVisible = false
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  private readonly gameStateMachine: GameStateMachineInterface
  private readonly leaderboardStorage: LeaderboardStorage

  constructor(gameStateMachine: GameStateMachineInterface, leaderboardStorage: LeaderboardStorage) {
    this.gameStateMachine = gameStateMachine
    this.leaderboardStorage = leaderboardStorage

    this.container = this.createContainer()
    this.titleElement = this.createTitle()
    this.scoreElement = this.createScoreDisplay()
    this.waveElement = this.createWaveDisplay()
    this.nameLabelElement = this.createNameLabel()
    this.nameInput = this.createNameInput()
    this.submitButton = this.createSubmitButton()
    this.tryAgainButton = this.createTryAgainButton()
    this.mainMenuButton = this.createMainMenuButton()

    // Create content wrapper for centering
    const contentWrapper = this.createContentWrapper()

    // Add elements to content wrapper
    contentWrapper.appendChild(this.titleElement)
    contentWrapper.appendChild(this.scoreElement)
    contentWrapper.appendChild(this.waveElement)
    contentWrapper.appendChild(this.nameLabelElement)
    contentWrapper.appendChild(this.nameInput)
    contentWrapper.appendChild(this.createButtonContainer())

    // Add content wrapper to container
    this.container.appendChild(contentWrapper)

    // Setup event listeners
    this.setupEventListeners()

    // Hidden by default
    this.hide()
  }

  /**
   * Creates the main container element with overlay styling.
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'game-over-screen'
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'
    container.style.display = 'flex'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'center'
    container.style.zIndex = '2000'
    container.style.fontFamily = 'monospace'
    container.style.color = 'white'
    return container
  }

  /**
   * Creates the content wrapper for centering elements.
   */
  private createContentWrapper(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.style.display = 'flex'
    wrapper.style.flexDirection = 'column'
    wrapper.style.alignItems = 'center'
    wrapper.style.gap = '20px'
    wrapper.style.padding = '40px'
    wrapper.style.backgroundColor = 'rgba(20, 20, 40, 0.9)'
    wrapper.style.borderRadius = '10px'
    wrapper.style.border = '2px solid #00ffff'
    wrapper.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.3)'
    return wrapper
  }

  /**
   * Creates the GAME OVER title element.
   */
  private createTitle(): HTMLElement {
    const title = document.createElement('h1')
    title.setAttribute('data-testid', 'game-over-title')
    title.textContent = 'GAME OVER'
    title.style.fontSize = '48px'
    title.style.color = '#ff4444'
    title.style.textShadow = '0 0 20px #ff0000'
    title.style.margin = '0'
    return title
  }

  /**
   * Creates the score display element.
   */
  private createScoreDisplay(): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('data-testid', 'final-score')
    element.style.fontSize = '24px'
    element.style.color = '#ffff00'
    return element
  }

  /**
   * Creates the wave display element.
   */
  private createWaveDisplay(): HTMLElement {
    const element = document.createElement('div')
    element.setAttribute('data-testid', 'wave-reached')
    element.style.fontSize = '20px'
    element.style.color = '#00ffff'
    return element
  }

  /**
   * Creates the name input label element.
   */
  private createNameLabel(): HTMLElement {
    const label = document.createElement('label')
    label.setAttribute('data-testid', 'name-label')
    label.textContent = 'Enter your name:'
    label.style.fontSize = '18px'
    label.style.color = '#ffffff'
    label.style.marginTop = '10px'
    return label
  }

  /**
   * Creates the name input field.
   */
  private createNameInput(): HTMLInputElement {
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'Player'
    input.maxLength = 20
    input.style.padding = '10px 20px'
    input.style.fontSize = '18px'
    input.style.width = '200px'
    input.style.textAlign = 'center'
    input.style.border = '2px solid #00ffff'
    input.style.borderRadius = '5px'
    input.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    input.style.color = '#ffffff'
    input.style.outline = 'none'
    return input
  }

  /**
   * Creates the button container.
   */
  private createButtonContainer(): HTMLElement {
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.gap = '15px'
    container.style.marginTop = '20px'
    container.appendChild(this.submitButton)
    container.appendChild(this.tryAgainButton)
    container.appendChild(this.mainMenuButton)
    return container
  }

  /**
   * Creates a styled button with neon effect.
   */
  private createButton(text: string, className: string, color: string): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = text
    button.className = `button ${className}`
    button.style.padding = '12px 24px'
    button.style.fontSize = '16px'
    button.style.cursor = 'pointer'
    button.style.border = `2px solid ${color}`
    button.style.borderRadius = '5px'
    button.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    button.style.color = color
    button.style.textTransform = 'uppercase'
    button.style.letterSpacing = '1px'
    button.style.transition = 'all 0.2s'
    return button
  }

  /**
   * Creates the Submit button.
   */
  private createSubmitButton(): HTMLButtonElement {
    return this.createButton('Submit', 'submit-button', '#00ff00')
  }

  /**
   * Creates the Try Again button.
   */
  private createTryAgainButton(): HTMLButtonElement {
    return this.createButton('Try Again', 'try-again-button', '#ffff00')
  }

  /**
   * Creates the Main Menu button.
   */
  private createMainMenuButton(): HTMLButtonElement {
    return this.createButton('Main Menu', 'main-menu-button', '#00ffff')
  }

  /**
   * Sets up event listeners for buttons and keyboard.
   */
  private setupEventListeners(): void {
    // Submit button click
    this.submitButton.addEventListener('click', () => {
      this.handleSubmit()
    })

    // Try Again button click
    this.tryAgainButton.addEventListener('click', () => {
      this.handleTryAgain()
    })

    // Main Menu button click
    this.mainMenuButton.addEventListener('click', () => {
      this.handleMainMenu()
    })

    // Enter key in name input
    this.nameInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.handleSubmit()
      }
    })

    // Global keyboard handler for ESC key
    this.keydownHandler = (e: KeyboardEvent) => {
      if (this.isVisible && e.key === 'Escape') {
        this.handleMainMenu()
      }
    }
  }

  /**
   * Handles the submit action.
   * Validates name length and saves to leaderboard.
   */
  private handleSubmit(): void {
    const name = this.nameInput.value.trim()

    // Validate name length (3-20 characters)
    if (name.length < 3) {
      // Invalid name, don't submit
      this.nameInput.style.borderColor = '#ff4444'
      return
    }

    // Create leaderboard entry
    const entry: LeaderboardEntry = {
      name,
      score: this.currentScore,
      wave: this.currentWave,
      date: new Date().toISOString()
    }

    // Save to leaderboard
    this.leaderboardStorage.saveScore(entry)

    // Show success feedback and disable form
    this.submitButton.textContent = 'Saved!'
    this.submitButton.disabled = true
    this.submitButton.style.borderColor = '#00ff00'
    this.submitButton.style.color = '#00ff00'
    this.nameInput.disabled = true
    this.nameInput.style.borderColor = '#00ff00'
  }

  /**
   * Handles the Try Again action.
   * Triggers restart transition in game state machine.
   */
  private handleTryAgain(): void {
    this.gameStateMachine.transition('restart')
  }

  /**
   * Handles the Main Menu action.
   * Triggers returnToMenu transition in game state machine.
   */
  private handleMainMenu(): void {
    this.gameStateMachine.transition('returnToMenu')
  }

  /**
   * Shows the game over screen with final stats.
   *
   * @param finalScore - The player's final score
   * @param waveReached - The wave number reached
   */
  show(finalScore: number, waveReached: number): void {
    this.currentScore = finalScore
    this.currentWave = waveReached

    // Update displays
    this.scoreElement.textContent = `Final Score: ${finalScore}`
    this.waveElement.textContent = `Wave Reached: ${waveReached}`

    // Reset name input and submit button
    this.nameInput.value = ''
    this.nameInput.disabled = false
    this.nameInput.style.borderColor = '#00ffff'
    this.submitButton.textContent = 'Submit'
    this.submitButton.disabled = false
    this.submitButton.style.borderColor = '#00ff00'
    this.submitButton.style.color = '#00ff00'

    // Show container
    this.container.style.display = 'flex'
    this.isVisible = true

    // Add global keyboard listener
    if (this.keydownHandler) {
      document.addEventListener('keydown', this.keydownHandler)
    }

    // Focus name input
    setTimeout(() => this.nameInput.focus(), 100)
  }

  /**
   * Hides the game over screen.
   */
  hide(): void {
    this.container.style.display = 'none'
    this.isVisible = false

    // Remove global keyboard listener
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
    }
  }

  /**
   * Update method for frame updates.
   * Currently handles keyboard/mouse input if needed.
   *
   * @param _deltaTime - Time elapsed since last update
   */
  update(_deltaTime: number): void {
    // Handle any per-frame updates if needed
    // Currently no per-frame logic required
  }

  /**
   * Mounts the screen to a parent element.
   *
   * @param parent - The parent HTMLElement to mount to
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
   * Unmounts the screen from its parent element.
   */
  unmount(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }

    // Remove keyboard listener
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
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
