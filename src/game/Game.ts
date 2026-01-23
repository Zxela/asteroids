/**
 * Game - Main Game Class and Loop Orchestrator
 *
 * The Game class is the main entry point that orchestrates:
 * - ECS World for entity/component/system management
 * - SceneManager for Three.js rendering
 * - Fixed timestep game loop for physics consistency
 *
 * Uses fixed timestep (60 Hz) for physics with variable render rate.
 * This ensures deterministic physics regardless of frame rate.
 */

import { World } from '../ecs'
import { SceneManager } from '../rendering/SceneManager'

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
  private running = false
  private lastTime = 0
  private accumulator = 0
  private readonly fixedTimestep: number = 1 / 60 // 60 Hz physics

  constructor() {
    this.world = new World()
    this.sceneManager = new SceneManager()
  }

  /**
   * Initialize the game.
   * Must be called before start().
   */
  async initialize(): Promise<void> {
    // Initialize SceneManager (async for WebGPU)
    await this.sceneManager.init()

    // Future initialization:
    // - Register systems (InputSystem, PhysicsSystem, RenderSystem, etc.)
    // - Create initial entities (ship, asteroids)
    // - Load assets
  }

  /**
   * Start the game loop.
   */
  start(): void {
    if (this.running) return

    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0
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
    // Update all registered systems through the ECS World
    this.world.update(deltaTime)
  }
}
