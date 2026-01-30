---
id: "002"
title: "Add persistent global event emitter to Game"
status: pending
depends_on: ["001"]
test_file: tests/unit/Game.test.ts
---

# 002: Add persistent global event emitter to Game

## Objective

Create a global event emitter in the Game class that persists across game sessions. This is the foundation for the persistent AudioSystem - it ensures events are emitted before gameplay starts and continue working through menu → play → game over → menu cycles.

## Acceptance Criteria

- [ ] `globalEventEmitter` property added to Game class
- [ ] Created in Game constructor (not in initializeGameplay)
- [ ] `onStateChange()` emits `gameStateChanged` event on globalEventEmitter
- [ ] Event includes state name: `{ state: 'mainMenu' | 'playing' | 'gameOver' | 'attractMode' }`
- [ ] Existing session-scoped eventEmitter preserved for gameplay events
- [ ] Events emit correctly when transitioning to mainMenu at game start

## Technical Notes

From TECHNICAL_DESIGN.md:
```typescript
// Global event emitter created at game start
private globalEventEmitter: EventEmitter

constructor() {
  this.globalEventEmitter = new EventEmitter()
}

private onStateChange(state: GameState) {
  // Use globalEventEmitter instead of session-scoped eventEmitter
  this.globalEventEmitter.emit('gameStateChanged', { state })
}
```

Key insight: The current eventEmitter is created in `initializeGameplay()` which runs when the player clicks Play. By then, the mainMenu state change has already happened with no listener.

## Test Requirements

Add to `tests/unit/Game.test.ts` (or create if needed):
- Test globalEventEmitter exists after Game construction
- Test gameStateChanged event fires when transitioning to mainMenu
- Test gameStateChanged event fires for all state transitions
- Test event contains correct state name
