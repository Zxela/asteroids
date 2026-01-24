/**
 * Game - Main Game Class and Loop Orchestrator
 *
 * The Game class is the main entry point that orchestrates:
 * - ECS World for entity/component/system management
 * - SceneManager for Three.js rendering
 * - GameStateMachine for game flow control
 * - UI components (MainMenu, PauseMenu, GameOverScreen, HUD)
 * - Fixed timestep game loop for physics consistency
 *
 * Uses fixed timestep (60 Hz) for physics with variable render rate.
 * This ensures deterministic physics regardless of frame rate.
 */

import { World } from '../ecs'
import { SceneManager } from '../rendering/SceneManager'
import { GameStateMachine } from '../state/GameStateMachine'
import { GameOverState } from '../state/states/GameOverState'
import { LoadingState } from '../state/states/LoadingState'
import { MainMenuState } from '../state/states/MainMenuState'
import { PausedState } from '../state/states/PausedState'
import { PlayingState } from '../state/states/PlayingState'
import { GameOverScreen } from '../ui/GameOverScreen'
import { HUD } from '../ui/HUD'
import { MainMenu } from '../ui/MainMenu'
import { PauseMenu } from '../ui/PauseMenu'
import { LeaderboardStorage } from '../utils/LeaderboardStorage'

import { AsteroidDestructionSystem } from '../systems/AsteroidDestructionSystem'
import { CollisionSystem } from '../systems/CollisionSystem'
import { DamageSystem } from '../systems/DamageSystem'
// Systems
import { InputSystem } from '../systems/InputSystem'
import { PhysicsSystem } from '../systems/PhysicsSystem'
import { PowerUpSystem } from '../systems/PowerUpSystem'
import { ProjectileSystem } from '../systems/ProjectileSystem'
import { RenderSystem } from '../systems/RenderSystem'
import { RespawnSystem } from '../systems/RespawnSystem'
import { ScoreSystem } from '../systems/ScoreSystem'
import { ShipControlSystem } from '../systems/ShipControlSystem'
import { WaveSystem } from '../systems/WaveSystem'
import { WeaponSystem } from '../systems/WeaponSystem'

// Entities
import { createShip } from '../entities/createShip'

/**
 * Main game orchestrator class.
 *
 * Usage:
 * ```typescript
 * const game = new Game()
 * await game.initialize()
 * game.start()
 * ```
 */
export class Game {
  private world: World
  private sceneManager: SceneManager
  private fsm: GameStateMachine
  private running = false
  private lastTime = 0
  private accumulator = 0
  private readonly fixedTimestep: number = 1 / 60 // 60 Hz physics

  // UI Components
  private mainMenu: MainMenu | null = null
  private pauseMenu: PauseMenu | null = null
  private gameOverScreen: GameOverScreen | null = null
  private hud: HUD | null = null

  // Systems
  private inputSystem: InputSystem | null = null
  private waveSystem: WaveSystem | null = null
  private renderSystem: RenderSystem | null = null
  private collisionSystem: CollisionSystem | null = null

  // Game state
  private shipEntityId: number | null = null
  private gameplayInitialized = false

  constructor() {
    this.world = new World()
    this.sceneManager = new SceneManager()
    this.fsm = new GameStateMachine()
  }

  /**
   * Initialize the game.
   * Must be called before start().
   */
  async initialize(): Promise<void> {
    // Initialize SceneManager (async for WebGPU)
    await this.sceneManager.init()

    // Register game states
    this.fsm.registerState('loading', new LoadingState())
    this.fsm.registerState('mainMenu', new MainMenuState())
    this.fsm.registerState('playing', new PlayingState())
    this.fsm.registerState('paused', new PausedState())
    this.fsm.registerState('gameOver', new GameOverState())

    // Initialize UI components
    this.initializeUI()

    // Set up keyboard listeners for state transitions
    this.setupInputHandlers()
  }

  /**
   * Initialize UI components and mount them.
   */
  private initializeUI(): void {
    // Create HUD first (needed by PauseMenu)
    this.hud = new HUD()

    // Create a wrapper for FSM that triggers UI updates
    const fsmWrapper = {
      transition: (event: string) => {
        const result = this.fsm.transition(event as Parameters<typeof this.fsm.transition>[0])
        if (result) {
          const newState = this.fsm.getCurrentStateName()
          if (newState) {
            this.onStateChange(newState)
          }
        }
        return result
      },
      getCurrentStateName: () => this.fsm.getCurrentStateName()
    }

    // Create UI components with FSM wrapper for state transitions
    this.mainMenu = new MainMenu(fsmWrapper)
    this.pauseMenu = new PauseMenu(fsmWrapper, this.hud)
    this.gameOverScreen = new GameOverScreen(fsmWrapper, new LeaderboardStorage())

    // Mount all UI to document body
    this.mainMenu.mount(document.body)
    this.pauseMenu.mount(document.body)
    this.gameOverScreen.mount(document.body)
    this.hud.mount(document.body)
  }

  /**
   * Initialize gameplay systems and create initial entities.
   * Called when transitioning to 'playing' state.
   */
  private initializeGameplay(): void {
    if (this.gameplayInitialized) {
      // Reset for new game
      this.resetGameplay()
    }

    const scene = this.sceneManager.getScene()

    // Create and register systems
    this.inputSystem = new InputSystem()
    this.waveSystem = new WaveSystem()
    this.renderSystem = new RenderSystem(scene)

    // Register all systems with the world
    this.world.registerSystem(new ShipControlSystem(this.inputSystem))
    this.world.registerSystem(new PhysicsSystem())
    this.collisionSystem = new CollisionSystem()
    this.world.registerSystem(this.collisionSystem)
    this.world.registerSystem(new DamageSystem(this.collisionSystem))
    this.world.registerSystem(new WeaponSystem(this.inputSystem))
    this.world.registerSystem(new ProjectileSystem())
    this.world.registerSystem(this.waveSystem)
    this.world.registerSystem(new AsteroidDestructionSystem())
    this.world.registerSystem(new ScoreSystem())
    this.world.registerSystem(new RespawnSystem())
    this.world.registerSystem(new PowerUpSystem())
    this.world.registerSystem(this.renderSystem)

    // Create the player ship
    this.shipEntityId = createShip(this.world)

    this.gameplayInitialized = true
    console.log('Gameplay initialized - ship created:', this.shipEntityId)
  }

  /**
   * Reset gameplay for a new game.
   */
  private resetGameplay(): void {
    // Clear all entities
    // Note: Full reset would require clearing the world and re-registering systems
    // For now, this is a placeholder
    this.shipEntityId = null
  }

  /**
   * Set up input handlers for game state transitions.
   */
  private setupInputHandlers(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const currentState = this.fsm.getCurrentStateName()

      // Handle ESC for pause/resume
      if (event.key === 'Escape') {
        if (currentState === 'playing') {
          this.fsm.transition('pause')
          this.onStateChange('paused')
        } else if (currentState === 'paused') {
          this.fsm.transition('resume')
          this.onStateChange('playing')
        }
        return
      }

      // Forward keyboard events to active UI
      if (currentState === 'mainMenu' && this.mainMenu) {
        this.mainMenu.handleKeyDown(event)
      } else if (currentState === 'paused' && this.pauseMenu) {
        this.pauseMenu.handleKeyDown(event)
      }
      // GameOverScreen handles its own keyboard events via input field
    })
  }

  /**
   * Handle state changes - show/hide appropriate UI.
   * @param newState - The new state name
   * @param data - Optional data for state (score/wave for gameOver)
   */
  private onStateChange(newState: string, data?: { score?: number; wave?: number }): void {
    // Hide all UI first
    this.mainMenu?.hide()
    this.pauseMenu?.hide()
    this.gameOverScreen?.hide()
    this.hud?.hide()

    // Show appropriate UI for new state
    switch (newState) {
      case 'mainMenu':
        this.mainMenu?.show()
        break
      case 'playing':
        // Initialize gameplay systems and entities if not already done
        if (!this.gameplayInitialized) {
          this.initializeGameplay()
        }
        this.hud?.show()
        break
      case 'paused':
        this.hud?.show()
        this.pauseMenu?.show()
        break
      case 'gameOver':
        // Show game over screen with final score and wave
        this.gameOverScreen?.show(data?.score ?? 0, data?.wave ?? 1)
        break
    }
  }

  /**
   * Start the game loop.
   */
  start(): void {
    if (this.running) return

    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0

    // Start FSM in loading state, then transition to menu
    this.fsm.start('loading')
    // Since we have no async assets, immediately go to main menu
    this.fsm.transition('loadComplete')
    this.onStateChange('mainMenu')

    this.gameLoop()
  }

  /**
   * Stop the game loop.
   */
  stop(): void {
    this.running = false
  }

  /**
   * Check if the game is currently running.
   */
  isRunning(): boolean {
    return this.running
  }

  /**
   * Get the ECS World.
   */
  getWorld(): World {
    return this.world
  }

  /**
   * Get the SceneManager.
   */
  getSceneManager(): SceneManager {
    return this.sceneManager
  }

  /**
   * Get the fixed timestep value (in seconds).
   */
  getFixedTimestep(): number {
    return this.fixedTimestep
  }

  /**
   * Main game loop using fixed timestep for physics.
   *
   * Physics updates run at a fixed rate (60 Hz) for determinism,
   * while rendering happens at the display refresh rate.
   *
   * The accumulator pattern prevents the "spiral of death" by
   * capping the maximum deltaTime to 100ms.
   */
  private gameLoop = (): void => {
    if (!this.running) return

    requestAnimationFrame(this.gameLoop)

    const currentTime = performance.now()
    // Convert to seconds and cap at 100ms to prevent spiral of death
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1)
    this.lastTime = currentTime

    // Accumulate time for fixed timestep physics
    this.accumulator += deltaTime

    // Run physics updates at fixed timestep
    while (this.accumulator >= this.fixedTimestep) {
      this.update(this.fixedTimestep)
      this.accumulator -= this.fixedTimestep
    }

    // Render at variable rate (every frame)
    this.sceneManager.render()
  }

  /**
   * Update game state (called at fixed timestep).
   * @param deltaTime - Fixed time step in seconds
   */
  private update(deltaTime: number): void {
    // Only update gameplay systems when in playing state
    const currentState = this.fsm.getCurrentStateName()
    if (currentState !== 'playing') {
      return
    }

    // Convert deltaTime to milliseconds (systems expect ms)
    const deltaTimeMs = deltaTime * 1000

    // Update all registered systems through the ECS World
    this.world.update(deltaTimeMs)
  }
}
