# Product Requirements Document: Powerups & Music System

## Problem Statement

The Asteroids game has two interconnected issues affecting player experience:

1. **Broken MultiShot Powerup**: The MultiShot powerup is collected and tracked but has no gameplay effect. Players collect a glowing magenta orb expecting triple-shot capability, but nothing changes. This breaks player trust in the powerup system.

2. **Silent Menus**: Menu music never plays because the AudioSystem is architecturally tied to gameplay initialization. Players experience silence on the main menu and during attract mode demo, missing critical audio atmosphere that sets the game's tone.

## Goals

1. **Fix MultiShot powerup** to fire 3 projectiles in a spread pattern when active
2. **Add visual feedback** for all powerup collections (particles, effects)
3. **Review and balance** powerup spawn rates, durations, and effect strengths
4. **Refactor AudioSystem** to persist across the entire game lifecycle
5. **Enable menu music** to play immediately when entering main menu
6. **Enable proper music transitions** between game states (menu → playing → game over)

## Non-Goals

- Adding new powerup types (scope limited to existing 4 types)
- Changing the core weapon switching system (1-4, Z/X keys)
- Fixing stars/skins visual bug (tracked separately for later)
- Adding new music tracks
- Implementing audio settings UI

## User Stories

### US-1: MultiShot Powerup Works
**As a** player
**I want** the MultiShot powerup to fire 3 projectiles in a spread
**So that** I can destroy multiple asteroids at once

**Acceptance Criteria:**
- Collecting MultiShot powerup activates spread-fire for 15 seconds
- While active, pressing fire shoots 3 projectiles (center, +15°, -15°)
- Effect stacks with RapidFire (faster triple shots)
- Visual indicator shows MultiShot is active on HUD
- Effect expires after 15 seconds, reverting to single shot

### US-2: Powerup Collection Feedback
**As a** player
**I want** clear visual feedback when I collect a powerup
**So that** I know the powerup was collected and what effect I received

**Acceptance Criteria:**
- Particle burst effect on powerup collection
- Brief screen flash/tint matching powerup color
- Powerup icon appears on HUD with countdown timer
- Audio confirmation already plays (existing)

### US-3: Menu Music Plays
**As a** player
**I want** music to play on the main menu
**So that** the game feels polished and atmospheric from the start

**Acceptance Criteria:**
- Menu music starts playing when main menu appears
- Music loops until player starts game
- Smooth transition/crossfade to gameplay music when starting
- Music respects volume settings

### US-4: Music State Transitions
**As a** player
**I want** appropriate music for each game state
**So that** the audio matches what's happening in the game

**Acceptance Criteria:**
- Main Menu: menu.mp3 loops
- Playing: background.mp3 loops
- Attract Mode (Demo): menu.mp3 continues (it's still menu context)
- Game Over: music fades, gameOver.mp3 plays once
- Return to Menu: menu.mp3 resumes

### US-5: Balanced Powerup System
**As a** player
**I want** powerups to feel impactful but not overpowered
**So that** the game remains challenging and fun

**Acceptance Criteria:**
- Powerup spawn rate feels rewarding but not trivial (review 10% rate)
- Effect durations provide meaningful advantage without trivializing gameplay
- Shield duration balanced against typical asteroid encounter rate
- RapidFire cooldown reduction feels noticeably faster

## Success Metrics

- MultiShot powerup produces 3 projectiles when collected and fired
- Menu music plays within 1 second of main menu appearing
- All 4 powerup types have working effects
- Visual feedback appears for every powerup collection
- Music transitions occur without gaps or overlaps
- No audio-related console errors

## Technical Constraints

- Must work with existing ECS architecture
- Must maintain browser autoplay policy compliance (user interaction required)
- Must not break existing powerup tests
- Audio files already exist (menu.mp3, background.mp3, etc.)
