---
id: "004"
title: "Handle attract mode music correctly"
status: pending
depends_on: ["003"]
test_file: tests/unit/AudioSystem.test.ts
---

# 004: Handle attract mode music correctly

## Objective

Ensure that attract mode (demo) keeps menu music playing instead of switching to gameplay music. The attract mode is essentially a preview shown on the menu, so it should maintain the menu atmosphere.

## Acceptance Criteria

- [ ] AudioSystem recognizes 'attractMode' state
- [ ] Attract mode keeps menu music playing (doesn't switch to background music)
- [ ] When exiting attract mode back to menu, music continues uninterrupted
- [ ] When starting real game from attract mode, music transitions to background
- [ ] No audio glitches during attract mode start/stop

## Technical Notes

From TECHNICAL_DESIGN.md:
```typescript
private onGameStateChanged(event: { state: string }): void {
  switch (event.state) {
    case 'mainMenu':
    case 'attractMode':  // Demo keeps menu music
      this.audioManager.playMusic('music_menu', { volume: 1.0 })
      break
    case 'playing':
      this.audioManager.playMusic('music_background', { volume: 0.8, fadeIn: 1000 })
      break
    case 'gameOver':
      this.audioManager.stopMusic({ fadeOut: 500 })
      this.audioManager.playSFX('gameOver')
      break
  }
}
```

From PRD.md US-4:
- Attract Mode (Demo): menu.mp3 continues (it's still menu context)

## Test Requirements

Add to `tests/unit/AudioSystem.test.ts`:
- Test attractMode state keeps menu music (calls playMusic with 'music_menu')
- Test transition from mainMenu to attractMode doesn't restart music
- Test transition from attractMode to playing switches to background music
