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

import { type EntityId, World } from '../ecs'
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
import { UFOSpawnSystem } from '../systems/UFOSpawnSystem'
import { ParticleEmitterSystem } from '../systems/ParticleEmitterSystem'
import { ParticleRenderSystem } from '../systems/ParticleRenderSystem'
import { PhysicsSystem } from '../systems/PhysicsSystem'
import { PowerUpSystem } from '../systems/PowerUpSystem'
import { ProjectileSystem } from '../systems/ProjectileSystem'
import { RenderSystem } from '../systems/RenderSystem'
import { RespawnSystem } from '../systems/RespawnSystem'
import { ScoreSystem } from '../systems/ScoreSystem'
import { ShipControlSystem } from '../systems/ShipControlSystem'
import { WaveSystem } from '../systems/WaveSystem'
import { WeaponSystem } from '../systems/WeaponSystem'
import { HyperspaceSystem } from '../systems/HyperspaceSystem'
import { TensionSystem } from '../systems/TensionSystem'
import { AttractModeSystem, createPressStartOverlay } from '../systems/AttractModeSystem'

// Entities
import { createShip } from '../entities/createShip'

// Config
import { gameConfig } from '../config/gameConfig'

// Rendering
import { ParticleManager } from '../rendering/ParticleManager'
import { Starfield } from '../rendering/Starfield'

// Utils
import { EventEmitter } from '../utils/EventEmitter'

// Audio
import { AudioManager } from '../audio/AudioManager'
import { AudioSystem } from '../systems/AudioSystem'

// Types for game events
import type {
  AsteroidDestroyedEventData,
  PowerUpCollectedEventData,
  ShipThrustEventData,
  WeaponFiredEventData,
  PlayerDiedEventData,
  WaveStartedEventData,
  BossSpawnedEventData,
  BossDefeatedEventData,
  HyperspaceActivatedEventData
} from '../types/events'
import type { GameFlowState } from '../types/game'

/**
 * Game event types for particle and audio systems.
 */
interface GameEvents extends Record<string, unknown> {
  asteroidDestroyed: AsteroidDestroyedEventData
  shipThrust: ShipThrustEventData
  weaponFired: WeaponFiredEventData
  powerUpCollected: PowerUpCollectedEventData
  playerDied: PlayerDiedEventData
  waveStarted: WaveStartedEventData
  bossSpawned: BossSpawnedEventData
  bossDefeated: BossDefeatedEventData
  gameStateChanged: { state: GameFlowState }
  hyperspaceActivated: HyperspaceActivatedEventData
}

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

  // Systems (stored for inter-system event passing)
  private inputSystem: InputSystem | null = null
  private waveSystem: WaveSystem | null = null
  private renderSystem: RenderSystem | null = null
  private collisionSystem: CollisionSystem | null = null
  private asteroidDestructionSystem: AsteroidDestructionSystem | null = null
  private scoreSystem: ScoreSystem | null = null
  private respawnSystem: RespawnSystem | null = null
  private powerUpSystem: PowerUpSystem | null = null
  private shipControlSystem: ShipControlSystem | null = null
  private weaponSystem: WeaponSystem | null = null
  private ufoSpawnSystem: UFOSpawnSystem | null = null
  private hyperspaceSystem: HyperspaceSystem | null = null
  private tensionSystem: TensionSystem | null = null
  private attractModeSystem: AttractModeSystem | null = null
  private pressStartOverlay: HTMLElement | null = null
  private attractModeActive = false

  // Particle systems
  private particleManager: ParticleManager | null = null
  private particleEmitterSystem: ParticleEmitterSystem | null = null
  private particleRenderSystem: ParticleRenderSystem | null = null
  private eventEmitter: EventEmitter<GameEvents> | null = null

  // Background
  private starfield: Starfield | null = null

  // Audio
  private audioManager: AudioManager | null = null
  private audioSystem: AudioSystem | null = null
  private globalEventEmitter: EventEmitter<GameEvents>

  // Game state
  private shipEntityId: number | null = null
  private gameplayInitialized = false

  constructor() {
    this.world = new World()
    this.sceneManager = new SceneManager()
    this.fsm = new GameStateMachine()
    // Create global event emitter (persists across game sessions)
    this.globalEventEmitter = new EventEmitter<GameEvents>()
  }

  /**
   * Initialize the game.
   * Must be called before start().
   */
  async initialize(): Promise<void> {
    // Initialize SceneManager (async for WebGPU)
    await this.sceneManager.init()

    // Initialize AudioManager
    this.audioManager = AudioManager.getInstance()
    await this.audioManager.init()

    // Create AudioSystem immediately after AudioManager init
    // This ensures AudioSystem is ready to receive gameStateChanged events
    // AudioSystem subscribes to globalEventEmitter for music state changes
    this.audioSystem = new AudioSystem(this.audioManager, this.globalEventEmitter)

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

    // Create starfield background (persists across game sessions)
    this.starfield = new Starfield(this.sceneManager.getScene(), this.sceneManager.getCamera())

    // Initialize attract mode system
    this.attractModeSystem = new AttractModeSystem()
    this.attractModeSystem.onStart(() => this.startAttractMode())
    this.attractModeSystem.onExit(() => this.exitAttractMode())
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

    // Wire up main menu interaction callback to reset attract mode idle timer
    this.mainMenu.onInteraction(() => {
      this.attractModeSystem?.resetIdleTimer()
    })
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
    const camera = this.sceneManager.getCamera()

    // Create event emitter for inter-system communication (session-scoped)
    this.eventEmitter = new EventEmitter<GameEvents>()

    // Create particle infrastructure
    this.particleManager = new ParticleManager(500)
    this.particleEmitterSystem = new ParticleEmitterSystem(this.particleManager, this.eventEmitter)
    this.particleRenderSystem = new ParticleRenderSystem(this.particleManager, scene, camera)

    // Connect AudioSystem to session event emitter for gameplay SFX
    // AudioSystem was already created in initialize() with globalEventEmitter for music
    // Now we also connect it to session events for gameplay sounds
    if (this.audioSystem && this.eventEmitter) {
      this.audioSystem.setSessionEventBus(this.eventEmitter)
    }

    // Create and register systems
    this.inputSystem = new InputSystem()
    this.waveSystem = new WaveSystem()
    this.renderSystem = new RenderSystem(scene)

    // Create systems that need references for event passing
    this.collisionSystem = new CollisionSystem()
    this.asteroidDestructionSystem = new AsteroidDestructionSystem()
    this.scoreSystem = new ScoreSystem()
    this.respawnSystem = new RespawnSystem()

    // Create systems that emit events
    this.shipControlSystem = new ShipControlSystem(this.inputSystem, this.eventEmitter)
    this.weaponSystem = new WeaponSystem(this.inputSystem)
    this.hyperspaceSystem = new HyperspaceSystem(this.inputSystem, this.eventEmitter)

    // Register all systems with the world (order matters!)
    this.world.registerSystem(this.shipControlSystem)
    this.world.registerSystem(this.hyperspaceSystem)
    this.world.registerSystem(new PhysicsSystem())
    this.world.registerSystem(this.collisionSystem)
    this.world.registerSystem(new DamageSystem(this.collisionSystem))
    this.world.registerSystem(this.weaponSystem)
    this.world.registerSystem(new ProjectileSystem())
    this.world.registerSystem(this.waveSystem)
    this.world.registerSystem(this.asteroidDestructionSystem)
    this.world.registerSystem(this.scoreSystem)
    this.world.registerSystem(this.respawnSystem)
    this.powerUpSystem = new PowerUpSystem()
    this.world.registerSystem(this.powerUpSystem)
    this.ufoSpawnSystem = new UFOSpawnSystem(this.audioManager)
    this.world.registerSystem(this.ufoSpawnSystem)
    this.tensionSystem = new TensionSystem(this.audioManager)
    this.world.registerSystem(this.tensionSystem)
    this.world.registerSystem(this.particleEmitterSystem)
    this.world.registerSystem(this.renderSystem)
    // Note: ParticleRenderSystem is not an ECS system, it's called manually

    // Create the player ship
    this.shipEntityId = createShip(this.world)

    this.gameplayInitialized = true
    console.log('Gameplay initialized - ship created:', this.shipEntityId)
  }

  /**
   * Reset gameplay for a new game.
   * Clears all entities, meshes, and system state.
   */
  private resetGameplay(): void {
    // Dispose particle render system before clearing scene
    if (this.particleRenderSystem) {
      this.particleRenderSystem.dispose()
    }

    // Clear all meshes from the scene
    this.sceneManager.clearGameObjects()

    // Create a new world (clears all entities and systems)
    this.world = new World()

    // Clear system references
    this.inputSystem = null
    this.waveSystem = null
    this.renderSystem = null
    this.collisionSystem = null
    this.asteroidDestructionSystem = null
    this.scoreSystem = null
    this.respawnSystem = null
    this.powerUpSystem = null
    this.shipControlSystem = null
    this.weaponSystem = null
    this.ufoSpawnSystem = null
    this.hyperspaceSystem = null
    this.tensionSystem = null

    // Clear particle systems
    this.particleManager = null
    this.particleEmitterSystem = null
    this.particleRenderSystem = null

    // Clear session event emitter
    // Note: AudioSystem is NOT destroyed - it persists across sessions
    // We just disconnect it from the old session event bus
    this.eventEmitter = null

    // Reset game state
    this.shipEntityId = null
    this.gameplayInitialized = false
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

    // Emit game state change event to global event emitter for music
    // This ensures AudioSystem receives state changes even before session starts
    this.globalEventEmitter.emit('gameStateChanged', { state: newState as GameFlowState })

    // Show appropriate UI for new state
    switch (newState) {
      case 'mainMenu':
        this.mainMenu?.show()
        break
      case 'playing':
        // Initialize or reset gameplay for new game
        this.initializeGameplay()
        // Emit state change again to global emitter after gameplay initialized
        this.globalEventEmitter.emit('gameStateChanged', { state: 'playing' as GameFlowState })
        this.hud?.show()
        // Reset HUD to initial values
        this.hud?.updateScore(0)
        this.hud?.updateLives(gameConfig.gameplay.initialLives)
        this.hud?.updateWave(1)
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
   * Start attract mode (demo gameplay).
   */
  private startAttractMode(): void {
    if (this.attractModeActive) return

    this.attractModeActive = true

    // Initialize gameplay for demo
    this.initializeGameplay()

    // Create and show press start overlay
    this.pressStartOverlay = createPressStartOverlay()
    document.body.appendChild(this.pressStartOverlay)

    // Activate attract mode AI
    this.attractModeSystem?.activate()

    // Hide main menu but keep title visible would require changes
    // For now, just hide the main menu
    this.mainMenu?.hide()
  }

  /**
   * Exit attract mode and return to menu.
   */
  private exitAttractMode(): void {
    if (!this.attractModeActive) return

    this.attractModeActive = false

    // Deactivate attract mode
    this.attractModeSystem?.deactivate()

    // Remove press start overlay
    if (this.pressStartOverlay?.parentElement) {
      this.pressStartOverlay.parentElement.removeChild(this.pressStartOverlay)
    }
    this.pressStartOverlay = null

    // Reset gameplay state
    this.resetGameplay()

    // Show main menu
    this.mainMenu?.show()

    // Reset idle timer
    this.attractModeSystem?.resetIdleTimer()
  }

  /**
   * Update attract mode gameplay with AI control.
   * @param deltaTimeMs - Time step in milliseconds
   */
  private updateAttractMode(deltaTimeMs: number): void {
    if (!this.attractModeSystem) return

    // Get AI input from attract mode system
    const aiInput = this.attractModeSystem.update(this.world, deltaTimeMs)

    // Apply AI input to ship control system
    if (this.shipControlSystem && this.inputSystem) {
      // Override input system with AI input
      this.inputSystem.setOverrideInput({
        movement: aiInput.movement,
        shoot: aiInput.shoot
      })
    }

    // Pass events between systems
    this.passSystemEvents()

    // Update all registered systems
    this.world.update(deltaTimeMs)

    // Update particle physics
    if (this.particleManager) {
      this.particleManager.updateParticles(deltaTimeMs)
    }

    // Update particle rendering
    if (this.particleRenderSystem) {
      this.particleRenderSystem.update(this.world, deltaTimeMs)
    }

    // Update starfield parallax
    if (this.starfield) {
      this.starfield.update(deltaTimeMs)
    }

    // In attract mode, if player dies, just respawn immediately
    // without game over - it's a demo
    if (this.respawnSystem) {
      const events = this.respawnSystem.getEvents()
      for (const event of events) {
        if (event.type === 'playerDied') {
          // Just restart attract mode with fresh gameplay
          this.resetGameplay()
          this.initializeGameplay()
        }
      }
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
    const currentState = this.fsm.getCurrentStateName()
    const deltaTimeMs = deltaTime * 1000

    // Handle attract mode idle timer on main menu
    if (currentState === 'mainMenu' && !this.attractModeActive) {
      if (this.attractModeSystem?.updateIdleTimer(deltaTimeMs)) {
        this.startAttractMode()
      }
      return
    }

    // Handle attract mode gameplay
    if (this.attractModeActive) {
      this.updateAttractMode(deltaTimeMs)
      return
    }

    // Only update gameplay systems when in playing state
    if (currentState !== 'playing') {
      return
    }

    // Pass events between systems BEFORE update (uses events from previous frame)
    this.passSystemEvents()

    // Update all registered systems through the ECS World
    this.world.update(deltaTimeMs)

    // Update particle physics (position based on velocity, lifetime)
    if (this.particleManager) {
      this.particleManager.updateParticles(deltaTimeMs)
    }

    // Update particle rendering (sync mesh instances with active particles)
    if (this.particleRenderSystem) {
      this.particleRenderSystem.update(this.world, deltaTimeMs)
    }

    // Update starfield parallax
    if (this.starfield) {
      this.starfield.update(deltaTimeMs)
    }

    // Handle game over from respawn system
    this.handleRespawnEvents()

    // Handle score updates for HUD
    this.handleScoreEvents()

    // Handle wave progression for HUD
    this.handleWaveEvents()
  }

  /**
   * Pass events between producer and consumer systems.
   * Called before world.update() to propagate events from previous frame.
   */
  private passSystemEvents(): void {
    // Pass asteroid destroyed events to score system, wave system, and particle emitter
    if (this.asteroidDestructionSystem && this.scoreSystem) {
      const asteroidEvents = this.asteroidDestructionSystem.getEvents()
      this.scoreSystem.setAsteroidDestroyedEvents(asteroidEvents)

      // Notify wave system of asteroid destructions for wave progression
      if (this.waveSystem) {
        for (const _event of asteroidEvents) {
          this.waveSystem.recordAsteroidDestruction()
        }
      }

      // Also emit to particle system via EventEmitter
      if (this.eventEmitter) {
        for (const event of asteroidEvents) {
          this.eventEmitter.emit('asteroidDestroyed', event.data)
        }
      }
    }

    // Pass collision events to power-up system
    if (this.collisionSystem && this.powerUpSystem) {
      const collisions = this.collisionSystem.getCollisions()
      this.powerUpSystem.setCollisions(collisions)
    }

    // Pass weapon fired events to particle system
    if (this.weaponSystem && this.eventEmitter) {
      const weaponEvents = this.weaponSystem.getEvents()
      for (const event of weaponEvents) {
        this.eventEmitter.emit('weaponFired', {
          entityId: 0 as EntityId, // WeaponFiredEvent doesn't include entityId in the event
          weaponType: event.weaponType as 'single' | 'spread' | 'laser' | 'homing' | 'boss',
          position: event.position,
          direction: event.direction
        })
      }
    }
  }

  /**
   * Handle events from respawn system (game over, HUD updates).
   */
  private handleRespawnEvents(): void {
    if (!this.respawnSystem) return

    const events = this.respawnSystem.getEvents()
    for (const event of events) {
      if (event.type === 'playerDied') {
        // Transition to game over state
        this.fsm.transition('playerDied')
        this.onStateChange('gameOver', { score: event.finalScore, wave: event.wavesReached })
      } else if (event.type === 'shipDamaged') {
        // Update HUD lives display
        this.hud?.updateLives(event.remainingLives)
      }
    }
  }

  /**
   * Handle events from score system (HUD score display).
   */
  private handleScoreEvents(): void {
    if (!this.scoreSystem) return

    const events = this.scoreSystem.getEvents()
    for (const event of events) {
      // Update HUD score display
      this.hud?.updateScore(event.data.newScore)
    }

    // Handle bonus life events (update lives on HUD)
    const livesEvents = this.scoreSystem.getLivesEvents()
    for (const event of livesEvents) {
      // Update HUD lives display for bonus life
      this.hud?.updateLives(event.data.newLives)
    }
  }

  /**
   * Handle events from wave system (HUD wave display).
   */
  private handleWaveEvents(): void {
    if (!this.waveSystem) return

    const events = this.waveSystem.getEvents()
    for (const event of events) {
      // Update HUD wave display
      this.hud?.updateWave(event.data.newWave)

      // Trigger screen flash for wave start (classic arcade effect)
      this.hud?.triggerWaveFlash()
    }
  }
}
