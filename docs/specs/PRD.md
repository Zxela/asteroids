# PRD: Fix UFO Spaceship Behavior

## Problem Statement

The UFO enemy in the game does not match the original Asteroids arcade behavior:

1. **Size**: UFOs are approximately 6x larger than they should be relative to the player ship
2. **Movement**: UFOs spawn but appear static or move incorrectly
3. **Sound**: No characteristic doppler-effect "oooOoooOO" warbling sound while UFO is active
4. **Collision**: UFO-asteroid collisions are not implemented (UFOs should destroy asteroids on contact)

In the original 1979 Asteroids arcade game, UFOs were memorable enemies that:
- Were roughly the same size as the player ship
- Flew across the screen in wave patterns
- Made a distinctive warbling sound that changed pitch based on proximity (doppler effect)
- Could collide with and destroy asteroids

## Goals

1. Scale UFO meshes to be proportional to player ship (roughly same size)
2. Ensure UFO movement AI is functioning correctly
3. Add continuous doppler-effect sound while UFO is on screen
4. Add UFO-asteroid collision handling

## Non-Goals

- NG-001: Changing UFO shooting behavior (already implemented correctly)
- NG-002: Changing UFO spawn timing/frequency
- NG-003: Changing UFO point values
- NG-004: Adding new UFO types beyond large/small

## User Stories

### US-1: Properly Sized UFO
**As a** player
**I want** the UFO to be similarly sized to my ship
**So that** the game feels authentic to the original Asteroids

**Acceptance Criteria:**
- [ ] Large UFO visual radius must be 15-20 units (currently ~75 units with scale)
- [ ] Small UFO visual radius must be 10-12 units
- [ ] UFO collider radius must match new visual size
- [ ] UFO should appear proportional to player ship on screen

### US-2: UFO Movement
**As a** player
**I want** the UFO to fly across the screen in a wave pattern
**So that** it's a challenging moving target

**Acceptance Criteria:**
- [ ] UFO must move horizontally across screen at configured speed (80/120 units/s)
- [ ] UFO must have slight vertical oscillation while moving
- [ ] UFO must wrap or exit at screen edge correctly
- [ ] Movement must be smooth without stuttering

### US-3: UFO Doppler Sound
**As a** player
**I want** to hear the UFO's distinctive warbling sound
**So that** I know when a UFO is on screen and can gauge its proximity

**Acceptance Criteria:**
- [ ] Continuous warbling "oooOoooOO" sound must play while UFO is active
- [ ] Sound pitch must vary based on UFO's horizontal position (doppler effect simulation)
- [ ] Sound must be louder when UFO is closer to player
- [ ] Sound must stop when UFO is destroyed or exits screen
- [ ] Large and small UFOs must have different base pitches

### US-4: UFO-Asteroid Collision
**As a** player
**I want** UFOs to destroy asteroids they collide with
**So that** the gameplay matches the original Asteroids

**Acceptance Criteria:**
- [ ] UFO collider must include 'asteroid' in its collision mask
- [ ] When UFO hits asteroid, asteroid must be destroyed (splits if large/medium)
- [ ] UFO must NOT be damaged by asteroid collision
- [ ] Collision must generate visual feedback (explosion particles)

## Success Metrics

| Metric | Target |
|--------|--------|
| UFO size ratio to ship | 1:1 to 1.5:1 (currently ~6:1) |
| UFO movement speed | Matches config (80/120 units/s) |
| Doppler sound frequency range | 0.8x to 1.2x base pitch |
| UFO-asteroid collision detection | 100% of contacts detected |

## Technical Context

### Current Implementation
- `src/components/UFO.ts`: UFO_CONFIG defines speed, collider radius (25/15)
- `src/rendering/MeshFactory.ts`: createUFOLarge uses radius 25 + scale 1.5 in createUFO
- `src/systems/UFOSystem.ts`: Movement AI exists but may not be applied correctly
- `src/entities/createUFO.ts`: Scale factor of 1.5 for large, 1.0 for small
- `src/config/audioConfig.ts`: Only has `ufoWarning` sound, no continuous UFO sound

### Ship Reference
- Ship collider radius: 12 units
- Ship mesh: ~20 units tall (cone geometry)
