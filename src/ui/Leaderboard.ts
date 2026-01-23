/**
 * Leaderboard - Leaderboard Display UI Component
 *
 * Displays the top 10 scores in a table format with rank, name, score, and wave.
 * Supports highlighting a specific player's entry and ESC key to close.
 *
 * Features:
 * - Display top 10 scores sorted by score descending
 * - Columns: Rank, Name, Score, Wave
 * - Gold/Silver/Bronze styling for top 3 ranks
 * - Highlight player entry if just submitted
 * - Back button and ESC key to close
 * - Score formatting with commas
 * - Empty state message when no scores exist
 *
 * @module ui/Leaderboard
 */

import type { RankedLeaderboardEntry } from '../utils/LeaderboardStorage'

/**
 * Interface for LeaderboardStorage dependency injection.
 */
export interface LeaderboardStorageInterface {
  getTopScores(count?: number): RankedLeaderboardEntry[]
  loadScores(): Array<{ name: string; score: number; wave: number; date: string }>
  saveScore(entry: { name: string; score: number; wave: number; date: string }): void
  clearAllScores(): void
  isInTopTen(score: number): boolean
}

/**
 * Leaderboard class for displaying high scores.
 *
 * @example
 * ```typescript
 * const leaderboard = new Leaderboard(leaderboardStorage)
 * leaderboard.mount(document.body)
 * leaderboard.show('PlayerName') // Highlight PlayerName's entry
 * ```
 */
export class Leaderboard {
  private container: HTMLElement
  private tableBody: HTMLTableSectionElement
  private emptyMessage: HTMLElement
  private parentElement: HTMLElement | null = null
  private isVisible = false
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  private readonly storage: LeaderboardStorageInterface

  constructor(storage: LeaderboardStorageInterface) {
    this.storage = storage

    this.container = this.createContainer()
    this.tableBody = document.createElement('tbody')
    this.emptyMessage = this.createEmptyMessage()

    this.assembleUI()
    this.setupEventListeners()

    // Hidden by default
    this.hide()
  }

  /**
   * Creates the main container element with overlay styling.
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'leaderboard'
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
    container.style.display = 'flex'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'center'
    container.style.zIndex = '1500'
    container.style.fontFamily = 'monospace'
    container.style.color = 'white'
    return container
  }

  /**
   * Creates the empty message element.
   */
  private createEmptyMessage(): HTMLElement {
    const message = document.createElement('div')
    message.setAttribute('data-testid', 'empty-message')
    message.textContent = 'No scores yet. Play to set a high score!'
    message.style.color = '#888888'
    message.style.fontStyle = 'italic'
    message.style.padding = '20px'
    message.style.textAlign = 'center'
    return message
  }

  /**
   * Assembles all UI elements.
   */
  private assembleUI(): void {
    // Content wrapper
    const wrapper = document.createElement('div')
    wrapper.style.display = 'flex'
    wrapper.style.flexDirection = 'column'
    wrapper.style.alignItems = 'center'
    wrapper.style.gap = '20px'
    wrapper.style.padding = '40px'
    wrapper.style.backgroundColor = 'rgba(20, 20, 40, 0.95)'
    wrapper.style.borderRadius = '10px'
    wrapper.style.border = '2px solid #00ffff'
    wrapper.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.3)'
    wrapper.style.minWidth = '500px'
    wrapper.style.maxHeight = '80vh'
    wrapper.style.overflow = 'auto'

    // Title
    const title = document.createElement('h1')
    title.setAttribute('data-testid', 'leaderboard-title')
    title.textContent = 'HIGH SCORES'
    title.style.fontSize = '36px'
    title.style.color = '#00ffff'
    title.style.textShadow = '0 0 20px #00ffff'
    title.style.margin = '0'
    title.style.letterSpacing = '5px'
    wrapper.appendChild(title)

    // Table container
    const tableContainer = document.createElement('div')
    tableContainer.style.width = '100%'

    // Table
    const table = document.createElement('table')
    table.style.width = '100%'
    table.style.borderCollapse = 'collapse'
    table.style.marginTop = '20px'

    // Table header
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    const headers = ['RANK', 'NAME', 'SCORE', 'WAVE']
    for (const headerText of headers) {
      const th = document.createElement('th')
      th.textContent = headerText
      th.style.padding = '10px 15px'
      th.style.borderBottom = '2px solid #00ffff'
      th.style.textAlign = headerText === 'NAME' ? 'left' : 'center'
      th.style.color = '#00ffff'
      th.style.fontSize = '14px'
      th.style.letterSpacing = '2px'
      headerRow.appendChild(th)
    }
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Table body
    table.appendChild(this.tableBody)

    tableContainer.appendChild(table)
    tableContainer.appendChild(this.emptyMessage)
    wrapper.appendChild(tableContainer)

    // Back button
    const backButton = document.createElement('button')
    backButton.textContent = 'Back'
    backButton.className = 'back-button'
    backButton.style.padding = '12px 40px'
    backButton.style.fontSize = '18px'
    backButton.style.cursor = 'pointer'
    backButton.style.border = '2px solid #00ffff'
    backButton.style.borderRadius = '5px'
    backButton.style.backgroundColor = 'transparent'
    backButton.style.color = '#00ffff'
    backButton.style.marginTop = '20px'
    backButton.style.transition = 'all 0.2s'
    backButton.addEventListener('click', () => this.hide())
    wrapper.appendChild(backButton)

    this.container.appendChild(wrapper)
  }

  /**
   * Sets up event listeners.
   */
  private setupEventListeners(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (this.isVisible && e.key === 'Escape') {
        this.hide()
      }
    }
  }

  /**
   * Renders the scores in the table.
   */
  private renderScores(highlightPlayerName?: string): void {
    // Clear existing rows
    this.tableBody.innerHTML = ''

    const topScores = this.storage.getTopScores(10)

    if (topScores.length === 0) {
      this.emptyMessage.style.display = 'block'
      return
    }

    this.emptyMessage.style.display = 'none'

    for (const entry of topScores) {
      const row = this.createScoreRow(entry, highlightPlayerName)
      this.tableBody.appendChild(row)
    }
  }

  /**
   * Creates a table row for a score entry.
   */
  private createScoreRow(
    entry: RankedLeaderboardEntry,
    highlightPlayerName?: string
  ): HTMLTableRowElement {
    const row = document.createElement('tr')

    // Apply highlight if this is the player's entry
    const isHighlighted = highlightPlayerName && entry.name === highlightPlayerName
    if (isHighlighted) {
      row.classList.add('highlighted')
      row.style.backgroundColor = 'rgba(0, 255, 255, 0.2)'
      row.style.boxShadow = 'inset 0 0 10px rgba(0, 255, 255, 0.3)'
    }

    // Apply rank-specific styling
    if (entry.rank === 1) {
      row.classList.add('rank-gold')
    } else if (entry.rank === 2) {
      row.classList.add('rank-silver')
    } else if (entry.rank === 3) {
      row.classList.add('rank-bronze')
    }

    // Rank cell
    const rankCell = document.createElement('td')
    rankCell.textContent = String(entry.rank)
    rankCell.style.padding = '10px 15px'
    rankCell.style.textAlign = 'center'
    rankCell.style.fontWeight = 'bold'
    rankCell.style.color = this.getRankColor(entry.rank)
    if (entry.rank <= 3) {
      rankCell.classList.add(
        `rank-${entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : 'bronze'}`
      )
    }
    row.appendChild(rankCell)

    // Name cell
    const nameCell = document.createElement('td')
    nameCell.textContent = entry.name
    nameCell.style.padding = '10px 15px'
    nameCell.style.textAlign = 'left'
    row.appendChild(nameCell)

    // Score cell (formatted with commas)
    const scoreCell = document.createElement('td')
    scoreCell.textContent = this.formatNumber(entry.score)
    scoreCell.style.padding = '10px 15px'
    scoreCell.style.textAlign = 'center'
    scoreCell.style.color = '#ffff00'
    row.appendChild(scoreCell)

    // Wave cell
    const waveCell = document.createElement('td')
    waveCell.textContent = String(entry.wave)
    waveCell.style.padding = '10px 15px'
    waveCell.style.textAlign = 'center'
    row.appendChild(waveCell)

    return row
  }

  /**
   * Gets the color for a rank.
   */
  private getRankColor(rank: number): string {
    switch (rank) {
      case 1:
        return '#ffd700' // Gold
      case 2:
        return '#c0c0c0' // Silver
      case 3:
        return '#cd7f32' // Bronze
      default:
        return '#ffffff'
    }
  }

  /**
   * Formats a number with commas for thousands separator.
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('en-US')
  }

  /**
   * Shows the leaderboard.
   *
   * @param highlightPlayerName - Optional player name to highlight
   */
  show(highlightPlayerName?: string): void {
    this.renderScores(highlightPlayerName)
    this.container.style.display = 'flex'
    this.isVisible = true

    if (this.keydownHandler) {
      document.addEventListener('keydown', this.keydownHandler)
    }
  }

  /**
   * Hides the leaderboard.
   */
  hide(): void {
    this.container.style.display = 'none'
    this.isVisible = false

    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
    }
  }

  /**
   * Update method for frame updates.
   *
   * @param _deltaTime - Time elapsed since last update
   */
  update(_deltaTime: number): void {
    // No per-frame updates required
  }

  /**
   * Mounts the leaderboard to a parent element.
   *
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
   * Unmounts the leaderboard from its parent.
   */
  unmount(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }

    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
    }

    this.parentElement = null
  }

  /**
   * Gets the container element.
   *
   * @returns The container HTMLElement
   */
  getContainer(): HTMLElement {
    return this.container
  }
}
