/**
 * 3D Asteroids Game - Entry Point
 *
 * Main application entry point that initializes and starts the game.
 * Uses the Game class to orchestrate all game systems.
 */

import { Game } from './game/Game'

/**
 * Main entry point function.
 * Initializes and starts the game.
 */
async function main(): Promise<void> {
  const canvas = document.getElementById('game') as HTMLCanvasElement | null
  const loadingElement = document.getElementById('loading')

  if (!canvas) {
    console.error('Canvas element #game not found')
    return
  }

  try {
    // Create and initialize the game
    const game = new Game()
    await game.initialize()

    // Hide loading indicator after initialization
    if (loadingElement) {
      loadingElement.classList.add('hidden')
    }

    // Start the game loop
    game.start()

    console.log('3D Asteroids - Game started')
  } catch (error) {
    console.error('Failed to initialize game:', error)

    // Show error message to user
    if (loadingElement) {
      loadingElement.textContent = 'Failed to load game. Please refresh.'
    }
  }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    main().catch(console.error)
  })
} else {
  main().catch(console.error)
}

export { main }
