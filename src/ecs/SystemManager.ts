/**
 * SystemManager - Manages system registration and update orchestration.
 *
 * Responsible for:
 * - System registration and removal
 * - Executing systems in registration order
 * - Passing world and deltaTime to each system
 */

import type { System, World } from './types'

/**
 * Manages the collection of systems and their execution order.
 * Systems are executed in the order they are registered.
 */
export class SystemManager {
  /** Ordered array of registered systems */
  private systems: System[] = []

  /**
   * Register a system to be updated each frame.
   * Systems are executed in registration order.
   * @param system - The system to register
   */
  registerSystem(system: System): void {
    this.systems.push(system)
  }

  /**
   * Remove a system from the update loop.
   * Safe to call if system is not registered.
   * @param system - The system to remove
   */
  removeSystem(system: System): void {
    const index = this.systems.indexOf(system)
    if (index !== -1) {
      this.systems.splice(index, 1)
    }
  }

  /**
   * Update all registered systems in order.
   * @param world - The ECS world instance
   * @param deltaTime - Time elapsed since last frame in milliseconds
   */
  updateAll(world: World, deltaTime: number): void {
    for (const system of this.systems) {
      system.update(world, deltaTime)
    }
  }

  /**
   * Get the list of registered systems.
   * @returns Array of registered systems (read-only copy)
   */
  getSystems(): readonly System[] {
    return [...this.systems]
  }

  /**
   * Get the number of registered systems.
   * @returns Count of registered systems
   */
  getSystemCount(): number {
    return this.systems.length
  }
}
