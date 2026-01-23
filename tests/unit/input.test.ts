/**
 * Unit tests for InputSystem
 *
 * Tests keyboard input tracking, movement normalization, and action detection.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { InputSystem, type GameAction } from '../../src/systems/InputSystem'

/**
 * Mock event target for testing keyboard input without DOM.
 * Simulates document.addEventListener/removeEventListener.
 */
class MockEventTarget {
  private keydownListeners: Array<(event: KeyboardEvent) => void> = []
  private keyupListeners: Array<(event: KeyboardEvent) => void> = []

  addEventListener(
    type: 'keydown' | 'keyup',
    listener: (event: KeyboardEvent) => void
  ): void {
    if (type === 'keydown') {
      this.keydownListeners.push(listener)
    } else if (type === 'keyup') {
      this.keyupListeners.push(listener)
    }
  }

  removeEventListener(
    type: 'keydown' | 'keyup',
    listener: (event: KeyboardEvent) => void
  ): void {
    if (type === 'keydown') {
      this.keydownListeners = this.keydownListeners.filter((l) => l !== listener)
    } else if (type === 'keyup') {
      this.keyupListeners = this.keyupListeners.filter((l) => l !== listener)
    }
  }

  simulateKeyDown(key: string): void {
    const event = { key, preventDefault: () => {} } as KeyboardEvent
    for (const listener of this.keydownListeners) {
      listener(event)
    }
  }

  simulateKeyUp(key: string): void {
    const event = { key, preventDefault: () => {} } as KeyboardEvent
    for (const listener of this.keyupListeners) {
      listener(event)
    }
  }

  hasListeners(): boolean {
    return this.keydownListeners.length > 0 || this.keyupListeners.length > 0
  }
}

describe('InputSystem', () => {
  let inputSystem: InputSystem
  let mockTarget: MockEventTarget

  beforeEach(() => {
    mockTarget = new MockEventTarget()
    inputSystem = new InputSystem(mockTarget)
  })

  afterEach(() => {
    inputSystem.destroy()
  })

  describe('instantiation', () => {
    it('should be instantiable', () => {
      expect(inputSystem).toBeDefined()
      expect(inputSystem).toBeInstanceOf(InputSystem)
    })

    it('should initialize with no movement input', () => {
      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(0)
      expect(movement.y).toBe(0)
    })

    it('should initialize with empty actions set', () => {
      const actions = inputSystem.getActions()
      expect(actions.size).toBe(0)
    })
  })

  describe('keyboard event tracking', () => {
    it('should track keydown events', () => {
      mockTarget.simulateKeyDown('ArrowUp')

      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(1)
    })

    it('should track keyup events', () => {
      mockTarget.simulateKeyDown('ArrowUp')
      mockTarget.simulateKeyUp('ArrowUp')

      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(0)
    })
  })

  describe('getMovementInput()', () => {
    it('should return Vector2 with x=0, y=0 when no keys pressed', () => {
      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(0)
      expect(movement.y).toBe(0)
    })

    it('should return y=1 for ArrowUp', () => {
      mockTarget.simulateKeyDown('ArrowUp')
      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(1)
    })

    it('should return y=1 for W key', () => {
      mockTarget.simulateKeyDown('w')
      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(1)
    })

    it('should return y=-1 for ArrowDown', () => {
      mockTarget.simulateKeyDown('ArrowDown')
      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(-1)
    })

    it('should return y=-1 for S key', () => {
      mockTarget.simulateKeyDown('s')
      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(-1)
    })

    it('should return x=-1 for ArrowLeft', () => {
      mockTarget.simulateKeyDown('ArrowLeft')
      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(-1)
    })

    it('should return x=-1 for A key', () => {
      mockTarget.simulateKeyDown('a')
      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(-1)
    })

    it('should return x=1 for ArrowRight', () => {
      mockTarget.simulateKeyDown('ArrowRight')
      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(1)
    })

    it('should return x=1 for D key', () => {
      mockTarget.simulateKeyDown('d')
      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(1)
    })
  })

  describe('movement vector normalization', () => {
    it('should normalize diagonal movement to unit length', () => {
      // Simulate diagonal input (up + left)
      mockTarget.simulateKeyDown('ArrowUp')
      mockTarget.simulateKeyDown('ArrowLeft')

      const movement = inputSystem.getMovementInput()
      const length = movement.length()

      // Should be approximately 1.0 (normalized)
      expect(Math.abs(length - 1.0)).toBeLessThan(0.001)
    })

    it('should normalize up-right diagonal', () => {
      mockTarget.simulateKeyDown('w')
      mockTarget.simulateKeyDown('d')

      const movement = inputSystem.getMovementInput()
      const length = movement.length()

      expect(Math.abs(length - 1.0)).toBeLessThan(0.001)
    })

    it('should normalize down-left diagonal', () => {
      mockTarget.simulateKeyDown('s')
      mockTarget.simulateKeyDown('a')

      const movement = inputSystem.getMovementInput()
      const length = movement.length()

      expect(Math.abs(length - 1.0)).toBeLessThan(0.001)
    })

    it('should normalize down-right diagonal', () => {
      mockTarget.simulateKeyDown('ArrowDown')
      mockTarget.simulateKeyDown('ArrowRight')

      const movement = inputSystem.getMovementInput()
      const length = movement.length()

      expect(Math.abs(length - 1.0)).toBeLessThan(0.001)
    })

    it('should clamp movement vector to [-1, 1]', () => {
      // Even with multiple keys in same direction, should not exceed 1
      mockTarget.simulateKeyDown('ArrowUp')
      mockTarget.simulateKeyDown('w')

      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBeLessThanOrEqual(1)
      expect(movement.y).toBeGreaterThanOrEqual(-1)
    })
  })

  describe('multiple movement keys handling', () => {
    it('should handle opposite horizontal keys (cancels out)', () => {
      mockTarget.simulateKeyDown('ArrowLeft')
      mockTarget.simulateKeyDown('ArrowRight')

      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(0)
    })

    it('should handle opposite vertical keys (cancels out)', () => {
      mockTarget.simulateKeyDown('ArrowUp')
      mockTarget.simulateKeyDown('ArrowDown')

      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(0)
    })

    it('should handle mixed WASD and Arrow keys', () => {
      mockTarget.simulateKeyDown('w')
      mockTarget.simulateKeyDown('ArrowRight')

      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBeGreaterThan(0)
      expect(movement.x).toBeGreaterThan(0)
    })
  })

  describe('getActions()', () => {
    it('should return Set of active actions', () => {
      const actions = inputSystem.getActions()
      expect(actions).toBeInstanceOf(Set)
    })

    it('should return empty set when no action keys pressed', () => {
      const actions = inputSystem.getActions()
      expect(actions.size).toBe(0)
    })
  })

  describe('shoot action', () => {
    it('should detect shoot action on spacebar press', () => {
      mockTarget.simulateKeyDown(' ')

      const actions = inputSystem.getActions()
      expect(actions.has('shoot')).toBe(true)
    })

    it('should remove shoot action on spacebar release', () => {
      mockTarget.simulateKeyDown(' ')
      expect(inputSystem.hasAction('shoot')).toBe(true)

      mockTarget.simulateKeyUp(' ')
      expect(inputSystem.hasAction('shoot')).toBe(false)
    })
  })

  describe('pause action', () => {
    it('should detect pause action on ESC press', () => {
      mockTarget.simulateKeyDown('Escape')

      const actions = inputSystem.getActions()
      expect(actions.has('pause')).toBe(true)
    })

    it('should remove pause action on ESC release', () => {
      mockTarget.simulateKeyDown('Escape')
      expect(inputSystem.hasAction('pause')).toBe(true)

      mockTarget.simulateKeyUp('Escape')
      expect(inputSystem.hasAction('pause')).toBe(false)
    })
  })

  describe('weapon switching actions', () => {
    it('should detect switchWeapon1 on key 1', () => {
      mockTarget.simulateKeyDown('1')

      const actions = inputSystem.getActions()
      expect(actions.has('switchWeapon1')).toBe(true)
    })

    it('should detect switchWeapon2 on key 2', () => {
      mockTarget.simulateKeyDown('2')

      const actions = inputSystem.getActions()
      expect(actions.has('switchWeapon2')).toBe(true)
    })

    it('should detect switchWeapon3 on key 3', () => {
      mockTarget.simulateKeyDown('3')

      const actions = inputSystem.getActions()
      expect(actions.has('switchWeapon3')).toBe(true)
    })

    it('should remove weapon switch action on key release', () => {
      mockTarget.simulateKeyDown('1')
      expect(inputSystem.hasAction('switchWeapon1')).toBe(true)

      mockTarget.simulateKeyUp('1')
      expect(inputSystem.hasAction('switchWeapon1')).toBe(false)
    })
  })

  describe('hasAction()', () => {
    it('should return true when action is active', () => {
      mockTarget.simulateKeyDown(' ')
      expect(inputSystem.hasAction('shoot')).toBe(true)
    })

    it('should return false when action is not active', () => {
      expect(inputSystem.hasAction('shoot')).toBe(false)
    })
  })

  describe('getActions() returns copy', () => {
    it('should return a copy of actions set (not reference)', () => {
      mockTarget.simulateKeyDown(' ')

      const actions1 = inputSystem.getActions()
      const actions2 = inputSystem.getActions()

      expect(actions1).not.toBe(actions2)
      expect(actions1).toEqual(actions2)
    })
  })

  describe('getMovementInput() returns clone', () => {
    it('should return a clone of movement vector (not reference)', () => {
      mockTarget.simulateKeyDown('ArrowUp')

      const movement1 = inputSystem.getMovementInput()
      const movement2 = inputSystem.getMovementInput()

      expect(movement1).not.toBe(movement2)
      expect(movement1.x).toBe(movement2.x)
      expect(movement1.y).toBe(movement2.y)
    })
  })

  describe('case insensitivity', () => {
    it('should handle uppercase W key', () => {
      mockTarget.simulateKeyDown('W')
      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(1)
    })

    it('should handle uppercase A key', () => {
      mockTarget.simulateKeyDown('A')
      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(-1)
    })

    it('should handle uppercase S key', () => {
      mockTarget.simulateKeyDown('S')
      const movement = inputSystem.getMovementInput()
      expect(movement.y).toBe(-1)
    })

    it('should handle uppercase D key', () => {
      mockTarget.simulateKeyDown('D')
      const movement = inputSystem.getMovementInput()
      expect(movement.x).toBe(1)
    })
  })

  describe('update method', () => {
    it('should have update method for game loop integration', () => {
      expect(typeof inputSystem.update).toBe('function')
    })

    it('should accept no parameters and return void', () => {
      const result = inputSystem.update()
      expect(result).toBeUndefined()
    })
  })

  describe('destroy method', () => {
    it('should have destroy method for cleanup', () => {
      expect(typeof inputSystem.destroy).toBe('function')
    })

    it('should stop responding to events after destroy', () => {
      inputSystem.destroy()

      mockTarget.simulateKeyDown('ArrowUp')
      const movement = inputSystem.getMovementInput()

      expect(movement.y).toBe(0)
    })
  })
})
