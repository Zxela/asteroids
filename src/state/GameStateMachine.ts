/**
 * Game State Machine
 *
 * Finite state machine for game flow management.
 * Controls transitions between game states:
 * Loading -> MainMenu -> Playing -> Paused -> GameOver
 */

import type { GameFlowEvent, GameFlowState } from '../types/game'

/**
 * Interface for game state implementations.
 */
export interface GameState {
  readonly name: string
  onEnter(): void
  onUpdate(deltaTime: number): void
  onExit(): void
}

/** Valid state names for the FSM */
export type GameStateName = GameFlowState

/** Valid events that trigger state transitions */
export type GameEvent = GameFlowEvent

/**
 * GameStateMachine - Manages game flow states and transitions.
 *
 * Implements a finite state machine pattern with:
 * - State registration
 * - Transition validation via transition table
 * - State lifecycle hooks (onEnter, onUpdate, onExit)
 * - Single active state enforcement
 */
export class GameStateMachine {
  private currentState: GameState | null = null
  private currentStateName: GameStateName | null = null
  private states: Map<GameStateName, GameState> = new Map()
  private stateHistory: GameStateName[] = []

  /**
   * Transition table defines valid state transitions.
   * Maps current state -> event -> target state
   */
  private readonly transitions: Map<GameStateName, Map<GameEvent, GameStateName>> = new Map([
    ['loading', new Map([['loadComplete', 'mainMenu']])],
    ['mainMenu', new Map([['startGame', 'playing']])],
    [
      'playing',
      new Map<GameEvent, GameStateName>([
        ['pause', 'paused'],
        ['playerDied', 'gameOver']
      ])
    ],
    [
      'paused',
      new Map<GameEvent, GameStateName>([
        ['resume', 'playing'],
        ['returnToMenu', 'mainMenu']
      ])
    ],
    [
      'gameOver',
      new Map<GameEvent, GameStateName>([
        ['restart', 'playing'],
        ['returnToMenu', 'mainMenu']
      ])
    ],
    ['victory', new Map([['returnToMenu', 'mainMenu']])]
  ])

  /**
   * Register a state implementation.
   * @param name - State identifier
   * @param state - State implementation
   */
  registerState(name: GameStateName, state: GameState): void {
    this.states.set(name, state)
  }

  /**
   * Start the FSM in the specified initial state.
   * @param initialState - The state to start in
   * @throws Error if the state is not registered
   */
  start(initialState: GameStateName): void {
    const state = this.states.get(initialState)
    if (!state) {
      throw new Error(`State "${initialState}" is not registered`)
    }

    this.currentState = state
    this.currentStateName = initialState
    this.stateHistory.push(initialState)
    state.onEnter()
  }

  /**
   * Get the current state instance.
   * @returns Current state or null if not started
   */
  getCurrentState(): GameState | null {
    return this.currentState
  }

  /**
   * Get the current state name.
   * @returns Current state name or null if not started
   */
  getCurrentStateName(): GameStateName | null {
    return this.currentStateName
  }

  /**
   * Attempt a state transition via an event.
   * @param event - The event to trigger
   * @returns true if transition succeeded, false if invalid
   */
  transition(event: GameEvent): boolean {
    if (!this.currentStateName || !this.currentState) {
      return false
    }

    const stateTransitions = this.transitions.get(this.currentStateName)
    if (!stateTransitions) {
      return false
    }

    const targetStateName = stateTransitions.get(event)
    if (!targetStateName) {
      return false
    }

    const targetState = this.states.get(targetStateName)
    if (!targetState) {
      return false
    }

    // Execute transition
    this.currentState.onExit()
    this.currentState = targetState
    this.currentStateName = targetStateName
    this.stateHistory.push(targetStateName)
    targetState.onEnter()

    return true
  }

  /**
   * Update the current state.
   * @param deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime: number): void {
    if (this.currentState) {
      this.currentState.onUpdate(deltaTime)
    }
  }

  /**
   * Get the history of state transitions.
   * @returns Array of state names in order visited
   */
  getStateHistory(): GameStateName[] {
    return [...this.stateHistory]
  }

  /**
   * Reset the FSM to initial (unstarted) state.
   */
  reset(): void {
    if (this.currentState) {
      this.currentState.onExit()
    }
    this.currentState = null
    this.currentStateName = null
    this.stateHistory = []
  }
}
