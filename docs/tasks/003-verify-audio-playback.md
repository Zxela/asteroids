---
id: "003"
title: "Verify audio playback in game"
status: completed
depends_on: ["002"]
test_file: null
no_test_reason: "manual testing - requires running game and interacting with UI"
completed_at: "2026-02-01T12:00:00Z"
---

# 003: Verify Audio Playback

## Objective

Run the game and verify that all three music tracks play correctly at the appropriate times, loop seamlessly, and respond to volume/mute controls.

## Acceptance Criteria

- [x] Menu music plays when game loads to main menu
- [x] Gameplay music plays when game starts
- [x] Music transitions smoothly from menu to gameplay
- [x] Pause reduces music volume (to 30%)
- [x] Resume restores music volume
- [x] Game over stops music
- [x] Mute toggle works for music
- [x] Volume slider affects music level
- [x] All tracks loop without jarring gaps

## Test Procedure

### Setup
```bash
cd /home/zxela/asteroids
npm run dev
# Open browser to localhost:5173
```

### Test Cases

**TC-1: Menu Music**
1. Load game in browser
2. Wait for main menu to appear
3. Expected: Menu music starts playing (chill synthwave)

**TC-2: Gameplay Music Transition**
1. From main menu, start a new game
2. Expected: Music transitions to gameplay track (driving synthwave)

**TC-3: Pause/Resume**
1. During gameplay, pause the game
2. Expected: Music volume decreases noticeably
3. Resume game
4. Expected: Music volume restores

**TC-4: Game Over**
1. Let ship get destroyed (lose all lives)
2. Expected: Music stops

**TC-5: Volume Controls**
1. Locate volume/mute controls in UI
2. Adjust volume slider
3. Expected: Music volume changes accordingly
4. Toggle mute
5. Expected: Music mutes/unmutes

**TC-6: Loop Seamlessness**
1. Let each track play for full duration
2. Expected: Track loops without audible gap or pop

**TC-7: Boss Music (if accessible)**
1. If boss encounter is triggerable, spawn boss
2. Expected: Music switches to intense boss track
3. Defeat boss
4. Expected: Music returns to gameplay track

## Verification

All test cases pass without audio glitches, loading errors, or unexpected behavior.
