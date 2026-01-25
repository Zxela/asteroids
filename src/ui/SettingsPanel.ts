/**
 * Settings Panel Component
 *
 * Provides volume controls (SFX and Music sliders 0-100),
 * visual theme selection (classic, neon, retro),
 * and mesh quality toggle (classic vs modern) with localStorage persistence.
 * Designed to be reused by both MainMenu and PauseMenu.
 *
 * @module ui/SettingsPanel
 */

import { MeshFactory, type MeshQuality } from '../rendering/MeshFactory'
import { THEME_IDS, type ThemeId, ThemeManager } from '../themes'

/** Storage keys for settings persistence */
const STORAGE_KEYS = {
  SFX_VOLUME: 'asteroids-sfx-volume',
  MUSIC_VOLUME: 'asteroids-music-volume'
} as const

/** Theme display names for UI */
const THEME_DISPLAY_NAMES: Record<ThemeId, string> = {
  classic: 'Classic Vector',
  neon: 'Neon Glow',
  retro: 'Retro CRT'
}

/**
 * SettingsPanel - Modal settings panel with volume controls and theme selection.
 *
 * @example
 * ```typescript
 * const panel = new SettingsPanel()
 * panel.mount(document.body)
 * panel.show(() => console.log('Settings closed'))
 * ```
 */
export class SettingsPanel {
  private container: HTMLElement
  private sfxSlider: HTMLInputElement
  private musicSlider: HTMLInputElement
  private sfxValueDisplay: HTMLElement
  private musicValueDisplay: HTMLElement
  private themeSelect: HTMLSelectElement
  private themeDescription: HTMLElement
  private meshQualityToggle: HTMLButtonElement
  private meshQualityLabel: HTMLElement
  private backButton: HTMLButtonElement
  private onCloseCallback: (() => void) | null = null
  private parentElement: HTMLElement | null = null

  constructor() {
    this.container = this.createContainer()
    this.sfxSlider = this.createSlider('sfx')
    this.musicSlider = this.createSlider('music')
    this.sfxValueDisplay = this.createValueDisplay('sfx')
    this.musicValueDisplay = this.createValueDisplay('music')
    this.themeSelect = this.createThemeSelect()
    this.themeDescription = this.createThemeDescription()
    this.meshQualityToggle = this.createMeshQualityToggle()
    this.meshQualityLabel = this.createMeshQualityLabel()
    this.backButton = this.createBackButton()

    this.assemblePanel()
    this.loadSettings()
    this.setupEventListeners()
  }

  /**
   * Creates the main container element.
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'settings-panel'
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.display = 'none'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'center'
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
    container.style.zIndex = '2000'
    container.style.fontFamily = 'monospace'
    container.style.color = 'white'
    return container
  }

  /**
   * Creates a volume slider.
   */
  private createSlider(type: 'sfx' | 'music'): HTMLInputElement {
    const slider = document.createElement('input')
    slider.setAttribute('type', 'range')
    slider.setAttribute('min', '0')
    slider.setAttribute('max', '100')
    slider.setAttribute('value', '100')
    slider.setAttribute('data-settings', `${type}-slider`)
    // Set value property after attributes for JSDOM compatibility
    slider.value = '100'
    slider.style.width = '200px'
    slider.style.cursor = 'pointer'
    return slider
  }

  /**
   * Creates a value display element for a slider.
   */
  private createValueDisplay(type: 'sfx' | 'music'): HTMLElement {
    const display = document.createElement('span')
    display.setAttribute('data-settings', `${type}-value`)
    display.textContent = '100'
    display.style.marginLeft = '10px'
    display.style.minWidth = '30px'
    display.style.display = 'inline-block'
    return display
  }

  /**
   * Creates the theme select dropdown.
   */
  private createThemeSelect(): HTMLSelectElement {
    const select = document.createElement('select')
    select.setAttribute('data-settings', 'theme-select')
    select.style.padding = '8px 16px'
    select.style.fontSize = '14px'
    select.style.cursor = 'pointer'
    select.style.backgroundColor = '#001428'
    select.style.border = '2px solid #00ffff'
    select.style.color = '#00ffff'
    select.style.fontFamily = 'monospace'
    select.style.minWidth = '160px'
    select.style.borderRadius = '4px'

    // Add options for each theme
    for (const themeId of THEME_IDS) {
      const option = document.createElement('option')
      option.value = themeId
      option.textContent = THEME_DISPLAY_NAMES[themeId]
      option.style.backgroundColor = '#001428'
      option.style.color = '#00ffff'
      select.appendChild(option)
    }

    return select
  }

  /**
   * Creates the theme description element.
   */
  private createThemeDescription(): HTMLElement {
    const description = document.createElement('span')
    description.setAttribute('data-settings', 'theme-description')
    description.style.marginLeft = '10px'
    description.style.fontSize = '14px'
    description.style.color = '#888888'
    return description
  }

  /**
   * Creates the mesh quality toggle button.
   */
  private createMeshQualityToggle(): HTMLButtonElement {
    const button = document.createElement('button')
    button.setAttribute('data-settings', 'mesh-quality-toggle')
    button.style.padding = '8px 20px'
    button.style.fontSize = '14px'
    button.style.cursor = 'pointer'
    button.style.backgroundColor = 'transparent'
    button.style.border = '2px solid #00ffff'
    button.style.color = '#00ffff'
    button.style.fontFamily = 'monospace'
    button.style.minWidth = '100px'
    return button
  }

  /**
   * Creates the mesh quality label element.
   */
  private createMeshQualityLabel(): HTMLElement {
    const label = document.createElement('span')
    label.setAttribute('data-settings', 'mesh-quality-label')
    label.style.marginLeft = '10px'
    label.style.fontSize = '14px'
    label.style.color = '#888888'
    return label
  }

  /**
   * Creates the back button.
   */
  private createBackButton(): HTMLButtonElement {
    const button = document.createElement('button')
    button.setAttribute('data-settings', 'back-button')
    button.textContent = 'Back'
    button.style.padding = '10px 30px'
    button.style.fontSize = '18px'
    button.style.cursor = 'pointer'
    button.style.backgroundColor = 'transparent'
    button.style.border = '2px solid #00ffff'
    button.style.color = '#00ffff'
    button.style.fontFamily = 'monospace'
    button.style.marginTop = '30px'
    return button
  }

  /**
   * Assembles all panel elements.
   */
  private assemblePanel(): void {
    const panelContent = document.createElement('div')
    panelContent.style.backgroundColor = 'rgba(0, 20, 40, 0.95)'
    panelContent.style.padding = '40px'
    panelContent.style.borderRadius = '10px'
    panelContent.style.border = '2px solid #00ffff'
    panelContent.style.textAlign = 'center'
    panelContent.style.minWidth = '350px'

    // Title
    const title = document.createElement('h2')
    title.setAttribute('data-settings', 'title')
    title.textContent = 'SETTINGS'
    title.style.marginBottom = '30px'
    title.style.fontSize = '28px'
    title.style.color = '#00ffff'
    title.style.textShadow = '0 0 10px #00ffff'
    panelContent.appendChild(title)

    // SFX Volume
    const sfxRow = this.createSliderRow('SFX Volume', 'sfx', this.sfxSlider, this.sfxValueDisplay)
    panelContent.appendChild(sfxRow)

    // Music Volume
    const musicRow = this.createSliderRow(
      'Music Volume',
      'music',
      this.musicSlider,
      this.musicValueDisplay
    )
    panelContent.appendChild(musicRow)

    // Visual Theme
    const themeRow = this.createThemeRow()
    panelContent.appendChild(themeRow)

    // Mesh Quality
    const meshQualityRow = this.createMeshQualityRow()
    panelContent.appendChild(meshQualityRow)

    // Back button
    panelContent.appendChild(this.backButton)

    this.container.appendChild(panelContent)
  }

  /**
   * Creates a row with label, slider, and value display.
   */
  private createSliderRow(
    labelText: string,
    type: 'sfx' | 'music',
    slider: HTMLInputElement,
    valueDisplay: HTMLElement
  ): HTMLElement {
    const row = document.createElement('div')
    row.style.marginBottom = '20px'
    row.style.textAlign = 'left'

    const label = document.createElement('label')
    label.setAttribute('data-settings', `${type}-label`)
    label.textContent = labelText
    label.style.display = 'block'
    label.style.marginBottom = '8px'
    label.style.fontSize = '16px'

    const sliderContainer = document.createElement('div')
    sliderContainer.style.display = 'flex'
    sliderContainer.style.alignItems = 'center'
    sliderContainer.appendChild(slider)
    sliderContainer.appendChild(valueDisplay)

    row.appendChild(label)
    row.appendChild(sliderContainer)

    return row
  }

  /**
   * Creates the visual theme selection row.
   */
  private createThemeRow(): HTMLElement {
    const row = document.createElement('div')
    row.style.marginBottom = '20px'
    row.style.textAlign = 'left'

    const label = document.createElement('label')
    label.setAttribute('data-settings', 'theme-label')
    label.textContent = 'Visual Theme'
    label.style.display = 'block'
    label.style.marginBottom = '8px'
    label.style.fontSize = '16px'

    const selectContainer = document.createElement('div')
    selectContainer.style.display = 'flex'
    selectContainer.style.alignItems = 'center'
    selectContainer.style.flexWrap = 'wrap'
    selectContainer.appendChild(this.themeSelect)
    selectContainer.appendChild(this.themeDescription)

    row.appendChild(label)
    row.appendChild(selectContainer)

    return row
  }

  /**
   * Creates the mesh quality toggle row.
   */
  private createMeshQualityRow(): HTMLElement {
    const row = document.createElement('div')
    row.style.marginBottom = '20px'
    row.style.textAlign = 'left'

    const label = document.createElement('label')
    label.setAttribute('data-settings', 'mesh-quality-row-label')
    label.textContent = 'Mesh Quality'
    label.style.display = 'block'
    label.style.marginBottom = '8px'
    label.style.fontSize = '16px'

    const toggleContainer = document.createElement('div')
    toggleContainer.style.display = 'flex'
    toggleContainer.style.alignItems = 'center'
    toggleContainer.appendChild(this.meshQualityToggle)
    toggleContainer.appendChild(this.meshQualityLabel)

    row.appendChild(label)
    row.appendChild(toggleContainer)

    return row
  }

  /**
   * Sets up event listeners for sliders and buttons.
   */
  private setupEventListeners(): void {
    // SFX slider events
    this.sfxSlider.addEventListener('input', () => {
      this.sfxValueDisplay.textContent = this.sfxSlider.value
    })

    this.sfxSlider.addEventListener('change', () => {
      this.saveSettings()
    })

    // Music slider events
    this.musicSlider.addEventListener('input', () => {
      this.musicValueDisplay.textContent = this.musicSlider.value
    })

    this.musicSlider.addEventListener('change', () => {
      this.saveSettings()
    })

    // Theme select
    this.themeSelect.addEventListener('change', () => {
      this.handleThemeChange()
    })

    // Mesh quality toggle
    this.meshQualityToggle.addEventListener('click', () => {
      this.toggleMeshQuality()
    })

    // Back button
    this.backButton.addEventListener('click', () => {
      this.hide()
      if (this.onCloseCallback) {
        this.onCloseCallback()
      }
    })
  }

  /**
   * Handles theme selection change.
   */
  private handleThemeChange(): void {
    const selectedTheme = this.themeSelect.value as ThemeId
    ThemeManager.getInstance().setTheme(selectedTheme)
    this.updateThemeDescription(selectedTheme)
  }

  /**
   * Updates the theme description based on selected theme.
   */
  private updateThemeDescription(themeId: ThemeId): void {
    const theme = ThemeManager.getInstance().getThemeById(themeId)
    if (theme) {
      this.themeDescription.textContent = theme.description
    }
  }

  /**
   * Toggles mesh quality between classic and modern.
   */
  private toggleMeshQuality(): void {
    const currentQuality = MeshFactory.getMeshQuality()
    const newQuality: MeshQuality = currentQuality === 'classic' ? 'modern' : 'classic'
    MeshFactory.setMeshQuality(newQuality)
    this.updateMeshQualityDisplay(newQuality)
  }

  /**
   * Updates the mesh quality toggle display.
   */
  private updateMeshQualityDisplay(quality: MeshQuality): void {
    const isModern = quality === 'modern'
    this.meshQualityToggle.textContent = isModern ? 'MODERN' : 'CLASSIC'
    this.meshQualityLabel.textContent = isModern
      ? 'High-poly detailed meshes'
      : 'Low-poly retro style'
  }

  /**
   * Loads settings from localStorage.
   */
  private loadSettings(): void {
    try {
      const sfxVolume = localStorage.getItem(STORAGE_KEYS.SFX_VOLUME)
      if (sfxVolume !== null) {
        this.sfxSlider.value = sfxVolume
        this.sfxValueDisplay.textContent = sfxVolume
      }

      const musicVolume = localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME)
      if (musicVolume !== null) {
        this.musicSlider.value = musicVolume
        this.musicValueDisplay.textContent = musicVolume
      }

      // Load theme from ThemeManager (which loads from localStorage)
      const currentThemeId = ThemeManager.getInstance().getThemeId()
      this.themeSelect.value = currentThemeId
      this.updateThemeDescription(currentThemeId)

      // Load mesh quality from MeshFactory (which loads from localStorage)
      const meshQuality = MeshFactory.getMeshQuality()
      this.updateMeshQualityDisplay(meshQuality)
    } catch {
      // localStorage not available, use defaults
      this.updateMeshQualityDisplay('classic')
      this.updateThemeDescription('neon')
    }
  }

  /**
   * Saves settings to localStorage.
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, this.sfxSlider.value)
      localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, this.musicSlider.value)
    } catch {
      // localStorage not available, ignore
    }
  }

  /**
   * Shows the settings panel.
   * @param onClose - Optional callback when panel is closed
   */
  show(onClose?: () => void): void {
    this.onCloseCallback = onClose ?? null
    this.container.style.display = 'flex'
  }

  /**
   * Hides the settings panel.
   */
  hide(): void {
    this.container.style.display = 'none'
  }

  /**
   * Handles keyboard events for the panel.
   * @param event - The keyboard event
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.hide()
      if (this.onCloseCallback) {
        this.onCloseCallback()
      }
    }
  }

  /**
   * Mounts the panel to a parent element.
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
   * Unmounts the panel from its parent.
   */
  unmount(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
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
   * Gets the current SFX volume.
   * @returns The SFX volume (0-100)
   */
  getSfxVolume(): number {
    return Number.parseInt(this.sfxSlider.value, 10)
  }

  /**
   * Gets the current music volume.
   * @returns The music volume (0-100)
   */
  getMusicVolume(): number {
    return Number.parseInt(this.musicSlider.value, 10)
  }

  /**
   * Gets the current mesh quality setting.
   * @returns The mesh quality ('classic' or 'modern')
   */
  getMeshQuality(): MeshQuality {
    return MeshFactory.getMeshQuality()
  }

  /**
   * Gets the currently selected theme ID.
   * @returns The theme ID
   */
  getSelectedTheme(): ThemeId {
    return this.themeSelect.value as ThemeId
  }
}
