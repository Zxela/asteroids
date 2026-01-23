/**
 * 3D Asteroids Game - Entry Point
 *
 * This is the main entry point for the 3D Asteroids game.
 * Game initialization and loop will be implemented in Task 2.1 (Renderer Setup).
 */

function main(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement | null
  const loadingElement = document.getElementById('loading')

  if (!canvas) {
    console.error('Canvas element #game not found')
    return
  }

  // Hide loading indicator
  if (loadingElement) {
    loadingElement.classList.add('hidden')
  }

  // Game initialization will be implemented in subsequent tasks
  // Task 2.1: Three.js Renderer Setup with WebGPU Support
  // Task 2.2: Input System Implementation
  // etc.

  console.log('3D Asteroids - Entry point loaded')
  console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}

export { main }
