---
id: "004"
title: "Adjust volume levels in audioConfig if needed"
status: completed
depends_on: ["003"]
test_file: null
no_test_reason: "configuration only - static values with no logic to test"
completed_at: "2026-02-01T12:05:00Z"
notes: "No adjustment needed - volume levels balanced as-is"
---

# 004: Adjust Volume Levels

## Objective

Based on playback testing, adjust the volume levels in `audioConfig.ts` if the new tracks are too loud or too quiet relative to sound effects.

## Acceptance Criteria

- [x] Music volume doesn't overpower sound effects
- [x] Music is audible but not distracting during gameplay
- [x] Volume levels feel balanced across all three tracks
- [x] Menu music slightly quieter than gameplay (already configured: 0.4 vs 0.5)

## Technical Notes

**Current configuration** (from `src/config/audioConfig.ts`):

```typescript
music: {
  background: { volume: 0.5 },  // Gameplay
  boss: { volume: 0.5 },        // Boss battle
  menu: { volume: 0.4 }         // Main menu (slightly quieter)
}
```

**Adjustment guidelines:**
- If music overpowers SFX: reduce by 0.1-0.2
- If music too quiet: increase by 0.1-0.2
- Keep menu < gameplay for atmospheric feel
- Boss can match or exceed gameplay for intensity

## Conditional Execution

This task is **optional** - only execute if testing in task 003 reveals volume issues.

If volumes are balanced as-is:
- Mark this task as completed with note "No adjustment needed"

If adjustment is needed:
1. Edit `src/config/audioConfig.ts`
2. Modify the `volume` property for affected tracks
3. Re-test to verify improvement
4. Commit the change

## Example Edit

If menu music is too loud:

```typescript
// Before
menu: {
  id: 'music_menu',
  path: '/assets/audio/menu.mp3',
  volume: 0.4,  // Current
  preload: false
}

// After
menu: {
  id: 'music_menu',
  path: '/assets/audio/menu.mp3',
  volume: 0.3,  // Reduced
  preload: false
}
```

## Verification

- Play game and confirm music/SFX balance feels right
- All three tracks have appropriate relative volumes
