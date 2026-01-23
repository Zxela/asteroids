/**
 * EventEmitter
 *
 * Type-safe event subscription and publication system for game events.
 * Supports generic event types for compile-time type checking.
 *
 * @module utils/EventEmitter
 */

/**
 * Handler function type for event listeners.
 * @template T - The type of data passed to the handler
 */
export type EventHandler<T = unknown> = (data: T) => void

/**
 * A type-safe event emitter for game events.
 *
 * Uses TypeScript generics to ensure type safety between event names
 * and their associated data types at compile time.
 *
 * @template Events - Record mapping event names to their data types
 *
 * @example
 * // Define event types
 * interface GameEvents {
 *   asteroidDestroyed: { size: string; position: Vector3 }
 *   scoreChanged: { newScore: number }
 *   collision: { entityA: number; entityB: number }
 * }
 *
 * // Create typed emitter
 * const emitter = new EventEmitter<GameEvents>()
 *
 * // Subscribe with type checking
 * emitter.on('asteroidDestroyed', (data) => {
 *   // data is typed as { size: string; position: Vector3 }
 *   console.log(data.size)
 * })
 *
 * // Emit with type checking
 * emitter.emit('asteroidDestroyed', { size: 'large', position: new Vector3() })
 */
export class EventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> {
  private listeners: Map<string, Set<EventHandler>> = new Map()

  /**
   * Registers an event listener for a specific event type.
   *
   * @param eventType - The event name to listen for
   * @param handler - The callback function to invoke when the event is emitted
   *
   * @example
   * emitter.on('asteroidDestroyed', (data) => {
   *   console.log(`Destroyed asteroid of size: ${data.size}`)
   * })
   */
  on<K extends string & keyof Events>(eventType: K, handler: EventHandler<Events[K]>): void {
    let handlers = this.listeners.get(eventType)
    if (!handlers) {
      handlers = new Set()
      this.listeners.set(eventType, handlers)
    }
    handlers.add(handler as EventHandler)
  }

  /**
   * Removes an event listener for a specific event type.
   *
   * @param eventType - The event name to stop listening for
   * @param handler - The callback function to remove
   *
   * @example
   * const handler = (data) => console.log(data)
   * emitter.on('scoreChanged', handler)
   * // Later...
   * emitter.off('scoreChanged', handler)
   */
  off<K extends string & keyof Events>(eventType: K, handler: EventHandler<Events[K]>): void {
    const handlers = this.listeners.get(eventType)
    if (handlers) {
      handlers.delete(handler as EventHandler)
    }
  }

  /**
   * Emits an event, calling all registered listeners for that event type.
   * Listeners are called synchronously in the order they were registered.
   *
   * Note: Listeners can safely unregister themselves during emit without
   * affecting other listeners in the current emit cycle.
   *
   * @param eventType - The event name to emit
   * @param data - The data to pass to all listeners
   *
   * @example
   * emitter.emit('asteroidDestroyed', {
   *   size: 'large',
   *   position: new Vector3(100, 0, 50)
   * })
   */
  emit<K extends string & keyof Events>(eventType: K, data: Events[K]): void {
    const handlers = this.listeners.get(eventType)
    if (handlers) {
      // Create a copy of handlers to allow safe removal during iteration
      const handlersCopy = Array.from(handlers)
      for (const handler of handlersCopy) {
        handler(data)
      }
    }
  }

  /**
   * Clears event listeners.
   *
   * @param eventType - If provided, clears only listeners for that event.
   *                    If omitted, clears all listeners for all events.
   *
   * @example
   * // Clear listeners for a specific event
   * emitter.clear('asteroidDestroyed')
   *
   * // Clear all listeners
   * emitter.clear()
   */
  clear(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType)
    } else {
      this.listeners.clear()
    }
  }
}
