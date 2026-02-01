---
id: "003"
title: "Create AudioSystem before main menu"
status: pending
depends_on: ["002"]
test_file: tests/unit/AudioSystem.test.ts
---

# 003: Create AudioSystem before main menu

## Objective

Move AudioSystem creation to happen immediately after AudioManager.init(), before the main menu state transition. This ensures there's a listener for the gameStateChanged event when transitioning to mainMenu, enabling menu music to play.

## Acceptance Criteria

- [ ] AudioSystem created in `Game.start()` after `AudioManager.init()` completes
- [ ] AudioSystem subscribes to globalEventEmitter (not session eventEmitter)
- [ ] AudioSystem is NOT destroyed/recreated between game sessions
- [ ] Menu music plays when entering mainMenu state
- [ ] Background music plays when entering playing state
- [ ] Music stops/fades on gameOver state
- [ ] AudioSystem handles state transitions without errors

## Technical Notes

From TECHNICAL_DESIGN.md:
```typescript
async start() {
  await this.audioManager.init()
  // Create AudioSystem immediately after AudioManager is ready
  this.audioSystem = new AudioSystem(this.audioManager, this.globalEventEmitter)
  // Now main menu transition will have a listener
  this.onStateChange('mainMenu')
}
```

Current flow (broken):
1. Game.start() → AudioManager.init()
2. onStateChange('mainMenu') → event fires, no listener
3. User clicks Play → initializeGameplay() → AudioSystem created (too late!)

Target flow (fixed):
1. Game.start() → AudioManager.init()
2. AudioSystem created, subscribes to globalEventEmitter
3. onStateChange('mainMenu') → event fires, AudioSystem receives it
4. Menu music plays!

## Test Requirements

Add to `tests/unit/AudioSystem.test.ts`:
- Test AudioSystem receives gameStateChanged events from emitter
- Test playMusic called with 'music_menu' on mainMenu state
- Test playMusic called with 'music_background' on playing state
- Test stopMusic called on gameOver state
