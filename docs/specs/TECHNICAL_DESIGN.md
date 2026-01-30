# Technical Design: Background Music Soundtrack

## Architecture Overview

The audio infrastructure is already implemented. This feature requires:
1. Sourcing appropriate music files
2. Replacing placeholder files
3. Optional volume tuning

```
┌─────────────────────────────────────────────────────────────┐
│                      Game States                             │
│  mainMenu → playing → paused → playing → bossSpawned → ...  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     AudioSystem                              │
│  - Listens to gameStateChanged events                       │
│  - Calls audioManager.playMusic() with appropriate track    │
│  - Handles boss spawn/defeat transitions                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AudioManager                              │
│  - Loads music via Howler.js                                │
│  - Manages playback, looping, volume                        │
│  - Handles crossfades and stops                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Audio Files                               │
│  public/assets/audio/                                       │
│  ├── menu.mp3        (mainMenu state)                       │
│  ├── background.mp3  (playing state)                        │
│  └── boss.mp3        (boss battles)                         │
└─────────────────────────────────────────────────────────────┘
```

## File Specifications

### Required Files

| File | Purpose | Target Energy | Duration |
|------|---------|---------------|----------|
| `menu.mp3` | Main menu background | Chill/ambient | 2-5 min loop |
| `background.mp3` | Gameplay background | Driving/active | 3-5 min loop |
| `boss.mp3` | Boss battle music | Intense/climactic | 2-4 min loop |

### Audio Format Requirements

- **Format:** MP3 (already configured in audioConfig)
- **Sample Rate:** 44.1kHz (standard)
- **Bitrate:** 128-192kbps (balance quality/size)
- **Channels:** Stereo
- **Target Size:** <3MB per track for reasonable web loading

## Existing Configuration

From `src/config/audioConfig.ts`:

```typescript
music: {
  background: {
    id: 'music_background',
    path: '/assets/audio/background.mp3',
    volume: 0.5,
    preload: false  // Lazy-loaded
  },
  boss: {
    id: 'music_boss',
    path: '/assets/audio/boss.mp3',
    volume: 0.5,
    preload: false
  },
  menu: {
    id: 'music_menu',
    path: '/assets/audio/menu.mp3',
    volume: 0.4,
    preload: false
  }
}
```

## State Transitions (Already Implemented)

From `src/systems/AudioSystem.ts`:

| Game State | Music Action |
|------------|--------------|
| `mainMenu` | Play `music_menu` |
| `playing` | Play `music_background` |
| `paused` | Lower volume to 30% |
| `gameOver` | Stop music |
| `bossSpawned` event | Switch to `music_boss` |
| `bossDefeated` event | Return to `music_background` |

## Implementation Tasks

### Task 1: Source Music Tracks
- Search royalty-free libraries for synthwave tracks
- Find tracks with escalating energy levels
- Verify licensing allows game distribution

### Task 2: Download and Replace
- Download selected tracks
- Rename to `menu.mp3`, `background.mp3`, `boss.mp3`
- Place in `public/assets/audio/`

### Task 3: Verify Playback
- Start game, verify menu music plays
- Start gameplay, verify background music plays
- Trigger boss (if possible), verify boss music plays
- Test volume controls and mute

### Task 4: Volume Tuning (If Needed)
- Adjust `volume` values in `audioConfig.ts` if tracks are too loud/quiet
- Ensure music doesn't overpower sound effects

## Testing Strategy

### Manual Testing
1. Load game → menu music should play
2. Start game → music should transition to gameplay track
3. Pause game → music volume should decrease
4. Resume game → music volume should restore
5. Game over → music should stop
6. Mute toggle → all music should mute/unmute
7. Volume slider → music volume should change

### Edge Cases
- Music files missing: AudioManager already handles gracefully (warns, doesn't block)
- Very large files: May cause slow initial playback (keep <3MB)
- Browser autoplay: AudioManager already handles AudioContext resume

## Rollback Plan

If new tracks cause issues:
1. Revert audio files to placeholders
2. No code changes needed (same filenames)

## Dependencies

- Howler.js (already installed)
- Browser with Web Audio API support (standard)
