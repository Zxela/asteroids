# Task: Audio Manager and Sound Effects

Metadata:
- Phase: 5 (Enhanced Features)
- Task: 5.1
- Dependencies: Task 4.1 (Game State Machine)
- Provides: AudioManager implementation, audio configuration, src/audio/ directory structure
- Size: Medium (3-4 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement Howler.js wrapper for audio playback and volume control. AudioManager provides centralized audio management with lazy loading for non-critical sounds, volume control with localStorage persistence, and proper handling of browser autoplay policies. Critical sounds (shoot, explosion, powerup, thrust) preload immediately while background music loads on demand.

*Reference dependencies: Game class (Task 2.1), GameStateMachine for state-aware audio*

## Target Files

- [x] `src/audio/AudioManager.ts` - Howler.js wrapper with sound management
- [x] `src/config/audioConfig.ts` - Sound definitions and configuration
- [x] `tests/unit/AudioManager.test.ts` - Audio manager unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for AudioManager
- [x] Write failing test for AudioManager initialization
- [x] Write failing test for preloading critical sounds on init
- [x] Write failing test for lazy-loading non-critical sounds
- [x] Write failing test for playSound(id) plays SFX
- [x] Write failing test for playMusic(id) plays with loop
- [x] Write failing test for setVolume('sfx', level) updates SFX volume
- [x] Write failing test for setVolume('music', level) updates music volume
- [x] Write failing test for volume level clamped to 0-1 range
- [x] Write failing test for volume persistence to localStorage
- [x] Write failing test for volume restoration from localStorage
- [x] Write failing test for AudioContext resume on user interaction
- [x] Write failing test for stopping all sounds
- [x] Write failing test for mute/unmute functionality
- [x] Verify all tests fail (Red state)

### 2. Green Phase

**Create Audio Configuration**:
- [x] Create `src/config/audioConfig.ts`:
  - Interface SoundDefinition: id, src, volume, loop, preload
  - Define critical sounds (preload: true):
    - 'shoot': Single projectile fire
    - 'explosion': Asteroid/enemy destruction
    - 'powerup': Power-up collection
    - 'thrust': Ship engine thrust
  - Define lazy-load sounds (preload: false):
    - 'backgroundMusic': Main game music
    - 'bossTheme': Boss encounter music
    - 'menuMusic': Main menu music
    - 'gameOver': Game over sound
  - Export SOUND_CONFIG array with all definitions

**Implement AudioManager**:
- [x] Create `src/audio/AudioManager.ts`:
  - Class AudioManager (singleton pattern):
    - Private sounds: Map<string, Howl>
    - Private sfxVolume: number (0-1)
    - Private musicVolume: number (0-1)
    - Private muted: boolean
    - Private initialized: boolean
  - Method: init()
    - Load critical sounds immediately (Howl with preload)
    - Set up lazy-loading for non-critical sounds
    - Load volume settings from localStorage
    - Add user interaction listener for AudioContext resume
  - Method: playSound(id: string, options?: { volume?: number })
    - Check if sound exists, lazy-load if needed
    - Play sound with current sfxVolume * options.volume
    - Handle playback errors gracefully
  - Method: playMusic(id: string, options?: { volume?: number, fadeIn?: number })
    - Stop current music if playing
    - Load music if not loaded (lazy-load)
    - Play with loop enabled
    - Apply musicVolume setting
  - Method: stopMusic(fadeOut?: number)
    - Fade out and stop current music
  - Method: setVolume(type: 'sfx' | 'music', level: number)
    - Clamp level to 0-1
    - Update internal volume
    - Update all playing sounds of that type
    - Persist to localStorage
  - Method: getVolume(type: 'sfx' | 'music'): number
  - Method: mute(muted: boolean)
    - Mute/unmute all sounds
  - Method: stopAllSounds()
    - Stop all active sound effects

**Create unit tests**:
- [x] Create `tests/unit/AudioManager.test.ts`:
  - Test initialization (sounds loaded)
  - Test critical sounds preloaded
  - Test lazy-load sounds not preloaded initially
  - Test playSound plays correct sound
  - Test playMusic starts with loop
  - Test setVolume updates and persists
  - Test getVolume returns correct value
  - Test volume clamping (values outside 0-1)
  - Test localStorage persistence
  - Test localStorage restoration
  - Test mute/unmute
  - Test stopAllSounds
  - Mock Howler.js for unit testing

### 3. Refactor Phase
- [x] Verify all sound definitions complete
- [x] Optimize preloading strategy
- [x] Add error handling for missing audio files
- [x] Ensure volume changes apply immediately
- [x] Confirm all tests pass

## Completion Criteria

- [x] Howler.js initialized with multiple sounds
- [x] Critical sounds (shoot, explosion, powerup, thrust) preload on init
- [x] Non-critical sounds (music) lazy-load on first play
- [x] playSound(id) plays sound effects correctly
- [x] playMusic(id) plays music with looping
- [x] setVolume works for both 'sfx' and 'music' types
- [x] Volume levels clamped to 0-1 range
- [x] Volume settings persist to localStorage
- [x] Volume settings restore from localStorage on init
- [x] AudioContext resumes on user interaction (autoplay policy)
- [x] Mute/unmute functionality works
- [x] Unit tests passing (15+ test cases)
- [x] Build succeeds with no errors
- [x] Type checking passes

## Verification Method

**L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- AudioManager.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (during integration)
# Expected: Sounds play correctly, volume persists across sessions
```

**Success Indicators**:
- All unit tests passing (15+ test cases)
- Type checking passes
- Build succeeds
- Volume settings persist after page reload
- Critical sounds play without delay

## Notes

- Howler.js used for cross-browser audio compatibility
- Critical sounds must preload for responsive gameplay
- Lazy-loading prevents blocking initial page load
- Volume stored in localStorage under 'asteroids-audio-settings'
- AudioContext requires user interaction to start (browser autoplay policy)
- Singleton pattern ensures single audio manager instance
- Sound effects are fire-and-forget (no tracking needed)
- Music requires loop management and crossfade support

## Impact Scope

**Allowed Changes**: Sound definitions, volume defaults, preload strategy
**Protected Areas**: Howler.js API usage patterns
**Areas Affected**: Audio playback, settings persistence, user experience

## Deliverables

- AudioManager class with full Howler.js integration
- Audio configuration with sound definitions
- Volume control with localStorage persistence
- Comprehensive unit tests for audio management
- Ready for Task 5.2 (AudioSystem integration with game events)
