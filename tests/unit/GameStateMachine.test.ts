/**
 * Game State Machine Unit Tests
 *
 * Tests for FSM controlling game flow states:
 * - Loading -> MainMenu -> Playing -> Paused -> GameOver
 * - State transitions via events
 * - State lifecycle (onEnter, onUpdate, onExit)
 * - Invalid transition rejection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameStateMachine, GameState } from '../../src/state/GameStateMachine'
import { LoadingState } from '../../src/state/states/LoadingState'
import { MainMenuState } from '../../src/state/states/MainMenuState'
import { PlayingState } from '../../src/state/states/PlayingState'
import { PausedState } from '../../src/state/states/PausedState'
import { GameOverState } from '../../src/state/states/GameOverState'
import type { GameFlowState, GameFlowEvent } from '../../src/types/game'

// Mock state implementation for testing
class MockState implements GameState {
  readonly name: string
  onEnterCalled = false
  onExitCalled = false
  updateCount = 0
  lastDeltaTime = 0

  constructor(name: string) {
    this.name = name
  }

  onEnter(): void {
    this.onEnterCalled = true
  }

  onUpdate(deltaTime: number): void {
    this.updateCount++
    this.lastDeltaTime = deltaTime
  }

  onExit(): void {
    this.onExitCalled = true
  }

  reset(): void {
    this.onEnterCalled = false
    this.onExitCalled = false
    this.updateCount = 0
    this.lastDeltaTime = 0
  }
}

describe('GameStateMachine', () => {
  let fsm: GameStateMachine

  beforeEach(() => {
    fsm = new GameStateMachine()
  })

  describe('State Registration', () => {
    it('should register a state successfully', () => {
      const loadingState = new MockState('loading')
      fsm.registerState('loading', loadingState)

      // Verify by starting with the state
      fsm.start('loading')
      expect(fsm.getCurrentStateName()).toBe('loading')
    })

    it('should replace existing state when registering with same name', () => {
      const state1 = new MockState('loading')
      const state2 = new MockState('loading')

      fsm.registerState('loading', state1)
      fsm.registerState('loading', state2)
      fsm.start('loading')

      expect(state1.onEnterCalled).toBe(false)
      expect(state2.onEnterCalled).toBe(true)
    })
  })

  describe('State Initialization', () => {
    it('should start with null current state before initialization', () => {
      expect(fsm.getCurrentState()).toBeNull()
      expect(fsm.getCurrentStateName()).toBeNull()
    })

    it('should initialize to specified state on start', () => {
      const loadingState = new MockState('loading')
      fsm.registerState('loading', loadingState)

      fsm.start('loading')

      expect(fsm.getCurrentStateName()).toBe('loading')
      expect(fsm.getCurrentState()).toBe(loadingState)
    })

    it('should call onEnter when starting in a state', () => {
      const loadingState = new MockState('loading')
      fsm.registerState('loading', loadingState)

      fsm.start('loading')

      expect(loadingState.onEnterCalled).toBe(true)
    })

    it('should throw error when starting with unregistered state', () => {
      expect(() => fsm.start('loading')).toThrow('State "loading" is not registered')
    })
  })

  describe('Valid Transitions', () => {
    let loadingState: MockState
    let mainMenuState: MockState
    let playingState: MockState
    let pausedState: MockState
    let gameOverState: MockState

    beforeEach(() => {
      loadingState = new MockState('loading')
      mainMenuState = new MockState('mainMenu')
      playingState = new MockState('playing')
      pausedState = new MockState('paused')
      gameOverState = new MockState('gameOver')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)
      fsm.registerState('playing', playingState)
      fsm.registerState('paused', pausedState)
      fsm.registerState('gameOver', gameOverState)
    })

    it('should transition from Loading to MainMenu on loadComplete', () => {
      fsm.start('loading')

      const result = fsm.transition('loadComplete')

      expect(result).toBe(true)
      expect(fsm.getCurrentStateName()).toBe('mainMenu')
    })

    it('should transition from MainMenu to Playing on startGame', () => {
      fsm.start('loading')
      fsm.transition('loadComplete')

      const result = fsm.transition('startGame')

      expect(result).toBe(true)
      expect(fsm.getCurrentStateName()).toBe('playing')
    })

    it('should transition from Playing to Paused on pause', () => {
      fsm.start('loading')
      fsm.transition('loadComplete')
      fsm.transition('startGame')

      const result = fsm.transition('pause')

      expect(result).toBe(true)
      expect(fsm.getCurrentStateName()).toBe('paused')
    })

    it('should transition from Paused to Playing on resume', () => {
      fsm.start('loading')
      fsm.transition('loadComplete')
      fsm.transition('startGame')
      fsm.transition('pause')

      const result = fsm.transition('resume')

      expect(result).toBe(true)
      expect(fsm.getCurrentStateName()).toBe('playing')
    })

    it('should transition from Paused to MainMenu on returnToMenu', () => {
      fsm.start('loading')
      fsm.transition('loadComplete')
      fsm.transition('startGame')
      fsm.transition('pause')

      const result = fsm.transition('returnToMenu')

      expect(result).toBe(true)
      expect(fsm.getCurrentStateName()).toBe('mainMenu')
    })

    it('should transition from Playing to GameOver on playerDied', () => {
      fsm.start('loading')
      fsm.transition('loadComplete')
      fsm.transition('startGame')

      const result = fsm.transition('playerDied')

      expect(result).toBe(true)
      expect(fsm.getCurrentStateName()).toBe('gameOver')
    })

    it('should transition from GameOver to Playing on restart', () => {
      fsm.start('loading')
      fsm.transition('loadComplete')
      fsm.transition('startGame')
      fsm.transition('playerDied')

      const result = fsm.transition('restart')

      expect(result).toBe(true)
      expect(fsm.getCurrentStateName()).toBe('playing')
    })

    it('should transition from GameOver to MainMenu on returnToMenu', () => {
      fsm.start('loading')
      fsm.transition('loadComplete')
      fsm.transition('startGame')
      fsm.transition('playerDied')

      const result = fsm.transition('returnToMenu')

      expect(result).toBe(true)
      expect(fsm.getCurrentStateName()).toBe('mainMenu')
    })
  })

  describe('Invalid Transitions', () => {
    let loadingState: MockState
    let mainMenuState: MockState
    let playingState: MockState

    beforeEach(() => {
      loadingState = new MockState('loading')
      mainMenuState = new MockState('mainMenu')
      playingState = new MockState('playing')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)
      fsm.registerState('playing', playingState)
    })

    it('should reject invalid transition from Loading (not loadComplete)', () => {
      fsm.start('loading')

      const result = fsm.transition('startGame')

      expect(result).toBe(false)
      expect(fsm.getCurrentStateName()).toBe('loading')
    })

    it('should reject invalid transition from MainMenu (not startGame)', () => {
      fsm.start('loading')
      fsm.transition('loadComplete')

      const result = fsm.transition('pause')

      expect(result).toBe(false)
      expect(fsm.getCurrentStateName()).toBe('mainMenu')
    })

    it('should reject transition when no current state', () => {
      const result = fsm.transition('loadComplete')

      expect(result).toBe(false)
    })

    it('should reject transition to unregistered target state', () => {
      // Only register loading, not mainMenu
      const loadingOnlyFsm = new GameStateMachine()
      loadingOnlyFsm.registerState('loading', new MockState('loading'))
      loadingOnlyFsm.start('loading')

      const result = loadingOnlyFsm.transition('loadComplete')

      expect(result).toBe(false)
      expect(loadingOnlyFsm.getCurrentStateName()).toBe('loading')
    })
  })

  describe('State Lifecycle (Entry/Exit Actions)', () => {
    let loadingState: MockState
    let mainMenuState: MockState
    let playingState: MockState

    beforeEach(() => {
      loadingState = new MockState('loading')
      mainMenuState = new MockState('mainMenu')
      playingState = new MockState('playing')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)
      fsm.registerState('playing', playingState)
    })

    it('should call onExit on current state when transitioning', () => {
      fsm.start('loading')
      loadingState.reset() // Reset after start

      fsm.transition('loadComplete')

      expect(loadingState.onExitCalled).toBe(true)
    })

    it('should call onEnter on new state when transitioning', () => {
      fsm.start('loading')

      fsm.transition('loadComplete')

      expect(mainMenuState.onEnterCalled).toBe(true)
    })

    it('should call onExit before onEnter during transition', () => {
      const callOrder: string[] = []

      const exitLoadingState: GameState = {
        name: 'loading',
        onEnter: () => {},
        onUpdate: () => {},
        onExit: () => callOrder.push('exit-loading')
      }

      const enterMainMenuState: GameState = {
        name: 'mainMenu',
        onEnter: () => callOrder.push('enter-mainMenu'),
        onUpdate: () => {},
        onExit: () => {}
      }

      fsm.registerState('loading', exitLoadingState)
      fsm.registerState('mainMenu', enterMainMenuState)
      fsm.start('loading')

      fsm.transition('loadComplete')

      expect(callOrder).toEqual(['exit-loading', 'enter-mainMenu'])
    })

    it('should not call onExit or onEnter on invalid transition', () => {
      fsm.start('loading')
      loadingState.reset()

      fsm.transition('startGame') // Invalid from loading

      expect(loadingState.onExitCalled).toBe(false)
      expect(mainMenuState.onEnterCalled).toBe(false)
    })
  })

  describe('Update Loop', () => {
    let playingState: MockState

    beforeEach(() => {
      playingState = new MockState('playing')
      const mainMenuState = new MockState('mainMenu')
      const loadingState = new MockState('loading')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)
      fsm.registerState('playing', playingState)

      fsm.start('loading')
      fsm.transition('loadComplete')
      fsm.transition('startGame')
    })

    it('should call onUpdate on current state', () => {
      fsm.update(16.67)

      expect(playingState.updateCount).toBe(1)
    })

    it('should pass deltaTime to onUpdate', () => {
      fsm.update(33.33)

      expect(playingState.lastDeltaTime).toBe(33.33)
    })

    it('should not call onUpdate when no current state', () => {
      const emptyFsm = new GameStateMachine()

      // Should not throw
      expect(() => emptyFsm.update(16.67)).not.toThrow()
    })

    it('should call onUpdate multiple times per frame if needed', () => {
      fsm.update(16.67)
      fsm.update(16.67)
      fsm.update(16.67)

      expect(playingState.updateCount).toBe(3)
    })
  })

  describe('Single Active State Enforcement', () => {
    it('should only have one active state at any time', () => {
      const loadingState = new MockState('loading')
      const mainMenuState = new MockState('mainMenu')
      const playingState = new MockState('playing')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)
      fsm.registerState('playing', playingState)

      fsm.start('loading')
      expect(fsm.getCurrentState()).toBe(loadingState)

      fsm.transition('loadComplete')
      expect(fsm.getCurrentState()).toBe(mainMenuState)
      expect(fsm.getCurrentState()).not.toBe(loadingState)

      fsm.transition('startGame')
      expect(fsm.getCurrentState()).toBe(playingState)
      expect(fsm.getCurrentState()).not.toBe(mainMenuState)
    })

    it('should update only the current state', () => {
      const loadingState = new MockState('loading')
      const mainMenuState = new MockState('mainMenu')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)

      fsm.start('loading')
      fsm.transition('loadComplete')

      // Reset counters
      loadingState.reset()
      mainMenuState.reset()

      fsm.update(16.67)

      expect(loadingState.updateCount).toBe(0)
      expect(mainMenuState.updateCount).toBe(1)
    })
  })

  describe('State History', () => {
    it('should track state history', () => {
      const loadingState = new MockState('loading')
      const mainMenuState = new MockState('mainMenu')
      const playingState = new MockState('playing')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)
      fsm.registerState('playing', playingState)

      fsm.start('loading')
      fsm.transition('loadComplete')
      fsm.transition('startGame')

      const history = fsm.getStateHistory()

      expect(history).toEqual(['loading', 'mainMenu', 'playing'])
    })

    it('should clear history when reset', () => {
      const loadingState = new MockState('loading')
      const mainMenuState = new MockState('mainMenu')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)

      fsm.start('loading')
      fsm.transition('loadComplete')

      fsm.reset()

      expect(fsm.getStateHistory()).toEqual([])
      expect(fsm.getCurrentState()).toBeNull()
    })
  })

  describe('Rapid Transitions', () => {
    it('should handle rapid valid transitions correctly', () => {
      const loadingState = new MockState('loading')
      const mainMenuState = new MockState('mainMenu')
      const playingState = new MockState('playing')
      const pausedState = new MockState('paused')

      fsm.registerState('loading', loadingState)
      fsm.registerState('mainMenu', mainMenuState)
      fsm.registerState('playing', playingState)
      fsm.registerState('paused', pausedState)

      fsm.start('loading')

      // Rapid transitions
      fsm.transition('loadComplete')
      fsm.transition('startGame')
      fsm.transition('pause')

      expect(fsm.getCurrentStateName()).toBe('paused')
      expect(fsm.getStateHistory()).toEqual(['loading', 'mainMenu', 'playing', 'paused'])
    })
  })
})

describe('Individual State Implementations', () => {
  describe('LoadingState', () => {
    it('should have correct name', () => {
      const state = new LoadingState()
      expect(state.name).toBe('loading')
    })

    it('should implement GameState interface', () => {
      const state = new LoadingState()
      expect(typeof state.onEnter).toBe('function')
      expect(typeof state.onUpdate).toBe('function')
      expect(typeof state.onExit).toBe('function')
    })
  })

  describe('MainMenuState', () => {
    it('should have correct name', () => {
      const state = new MainMenuState()
      expect(state.name).toBe('mainMenu')
    })

    it('should implement GameState interface', () => {
      const state = new MainMenuState()
      expect(typeof state.onEnter).toBe('function')
      expect(typeof state.onUpdate).toBe('function')
      expect(typeof state.onExit).toBe('function')
    })
  })

  describe('PlayingState', () => {
    it('should have correct name', () => {
      const state = new PlayingState()
      expect(state.name).toBe('playing')
    })

    it('should implement GameState interface', () => {
      const state = new PlayingState()
      expect(typeof state.onEnter).toBe('function')
      expect(typeof state.onUpdate).toBe('function')
      expect(typeof state.onExit).toBe('function')
    })
  })

  describe('PausedState', () => {
    it('should have correct name', () => {
      const state = new PausedState()
      expect(state.name).toBe('paused')
    })

    it('should implement GameState interface', () => {
      const state = new PausedState()
      expect(typeof state.onEnter).toBe('function')
      expect(typeof state.onUpdate).toBe('function')
      expect(typeof state.onExit).toBe('function')
    })
  })

  describe('GameOverState', () => {
    it('should have correct name', () => {
      const state = new GameOverState()
      expect(state.name).toBe('gameOver')
    })

    it('should implement GameState interface', () => {
      const state = new GameOverState()
      expect(typeof state.onEnter).toBe('function')
      expect(typeof state.onUpdate).toBe('function')
      expect(typeof state.onExit).toBe('function')
    })
  })
})
