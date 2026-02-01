# Architecture Decision Record: UFO Behavior Fixes

## Status

Proposed

## Context

The UFO enemy implementation has several issues that deviate from the original Asteroids arcade behavior:

### Issue 1: UFO Size
The UFO mesh is created with a body radius of 25 units (large) or 15 units (small), then scaled by 1.5x for large UFOs. Combined with the ring and dome geometry, the effective visual size is ~75 units - roughly 6x larger than the player ship (12 unit collider, ~20 unit visual).

### Issue 2: UFO Movement
The `UFOSystem.updateMovement()` method exists and sets velocity, but the UFOs may appear static if the velocity isn't being applied by `PhysicsSystem` or if the movement logic has a bug.

### Issue 3: No Continuous UFO Sound
The original Asteroids had a distinctive warbling sound that played continuously while a UFO was on screen. Currently, only a `ufoWarning` sound exists (beat that plays before spawn). No sound plays while the UFO is active.

### Issue 4: No UFO-Asteroid Collision
UFO colliders only collide with `['player', 'projectile']`. In the original game, UFOs could destroy asteroids by flying into them.

## Decision Drivers

- Match original Asteroids arcade behavior for authenticity
- Maintain existing ECS architecture patterns
- UFO should feel like a threatening enemy, not a background prop
- Audio implementation must work with Howler.js

## Options Considered

### Option 1: Simple Parameter Tweaks (Selected for Size/Movement)
Adjust UFO mesh geometry dimensions and remove the 1.5x scale multiplier.

**Pros:**
- Minimal code changes
- Easy to verify visually
- No architectural changes

**Cons:**
- May need to adjust multiple places (mesh, collider, config)

### Option 2: New UFOAudioSystem (Selected for Sound)
Create a new system that tracks active UFOs and manages their continuous audio with pitch modulation.

**Pros:**
- Clean separation of concerns
- Can handle doppler effect calculation
- Follows existing system pattern

**Cons:**
- New system to maintain
- Needs integration with AudioManager

### Option 3: Extend AudioSystem (Rejected)
Add UFO sound handling directly to AudioSystem.

**Cons:**
- AudioSystem already complex
- UFO-specific logic doesn't belong there

## Decision

1. **Size Fix**: Reduce UFO mesh geometry dimensions by ~60% and remove the scale factor in `createUFO.ts`. Adjust `UFO_CONFIG.colliderRadius` to match new sizes.

2. **Movement Fix**: Debug `UFOSystem.updateMovement()` to ensure velocity is properly applied. Verify `PhysicsSystem` processes UFO entities.

3. **Doppler Sound**: Add continuous UFO sound with pitch modulation:
   - Add `ufoSound` audio definition (looping warble)
   - `UFOSystem` starts sound on UFO spawn, stops on destroy
   - Pitch varies from 0.8x (left edge) to 1.2x (right edge)
   - Volume varies with distance to player

4. **UFO-Asteroid Collision**: Add `'asteroid'` to UFO collision mask. Handle collision in `DamageSystem` to destroy asteroid without damaging UFO.

## Consequences

### Positive
- UFOs match original Asteroids proportions
- Distinctive audio feedback when UFO appears
- More authentic gameplay with UFO-asteroid interactions
- Clear audio cues for UFO position

### Negative
- Need to source/create UFO warble sound effect
- Additional complexity in UFOSystem for audio management
- DamageSystem gains new collision case

### Risks
- Sound pitch modulation may not work well on all browsers (mitigated by fallback to constant pitch)
- UFO-asteroid collision may make game easier (mitigated by UFO rarity)

## Implementation Notes

### Size Changes
```typescript
// UFO_CONFIG (new values)
large: { colliderRadius: 15 },  // was 25
small: { colliderRadius: 10 }   // was 15

// MeshFactory createUFOLarge (new dimensions)
bodyGeometry = new THREE.SphereGeometry(12, 16, 12)  // was 25
ringGeometry = new THREE.TorusGeometry(10, 2, 8, 24)  // was 22, 3

// createUFO.ts - remove scale factor
const scale = 1.0  // was 1.5 for large
```

### Audio Implementation
```typescript
// audioConfig.ts
ufoLoop: {
  id: 'ufoLoop',
  path: '/assets/audio/ufo_loop.mp3',
  volume: 0.5,
  preload: true
}

// UFOSystem - play/stop on UFO lifecycle
private ufoSoundId: number | null = null

onUFOSpawned(ufo: UFO) {
  this.ufoSoundId = this.audioManager.playSound('ufoLoop', {
    loop: true,
    rate: ufo.ufoSize === 'small' ? 1.2 : 1.0
  })
}

onUFODestroyed() {
  this.audioManager.stopSound(this.ufoSoundId)
}

// Pitch modulation in update()
const pitch = 0.8 + (position.x + SCREEN_HALF_WIDTH) / (SCREEN_HALF_WIDTH * 2) * 0.4
this.audioManager.setSoundRate(this.ufoSoundId, pitch)
```

### Collision Mask Change
```typescript
// createUFO.ts
new Collider('sphere', config.colliderRadius, 'ufo', ['player', 'projectile', 'asteroid'])
```

## Related Documents

- PRD.md - Product requirements
- TECHNICAL_DESIGN.md - Detailed implementation plan
