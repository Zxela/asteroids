# Technical Design: Fix UFO Spaceship Behavior

## Architecture Overview

This design addresses four UFO behavior issues:

```
┌─────────────────────────────────────────────────────────────────┐
│                         UFO System Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ UFOSpawnSys  │───▶│   createUFO  │───▶│    UFOSystem     │  │
│  │              │    │   (entity)   │    │    (AI/Audio)    │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                              │                    │              │
│                              ▼                    ▼              │
│                       ┌──────────────┐    ┌──────────────┐      │
│                       │   Collider   │    │ AudioManager │      │
│                       │ +asteroid    │    │  (doppler)   │      │
│                       └──────────────┘    └──────────────┘      │
│                              │                                   │
│                              ▼                                   │
│                       ┌──────────────┐                          │
│                       │ DamageSystem │                          │
│                       │ UFO-asteroid │                          │
│                       └──────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Changes

### 1. UFO_CONFIG Size Adjustments

**File:** `src/components/UFO.ts`

**Current State:**
```typescript
export const UFO_CONFIG = {
  large: {
    speed: 80,
    shootInterval: 2000,
    accuracy: 0.3,
    points: 200,
    colliderRadius: 25  // Too large!
  },
  small: {
    speed: 120,
    shootInterval: 1500,
    accuracy: 0.8,
    points: 1000,
    colliderRadius: 15  // Too large!
  }
}
```

**Target State:**
```typescript
export const UFO_CONFIG = {
  large: {
    speed: 80,
    shootInterval: 2000,
    accuracy: 0.3,
    points: 200,
    colliderRadius: 15  // Reduced from 25
  },
  small: {
    speed: 120,
    shootInterval: 1500,
    accuracy: 0.8,
    points: 1000,
    colliderRadius: 10  // Reduced from 15
  }
}
```

### 2. MeshFactory UFO Mesh Scaling

**File:** `src/rendering/MeshFactory.ts`

**Current State (createUFOLarge):**
```typescript
function createUFOLarge(material: THREE.Material): THREE.Object3D {
  const group = new THREE.Group()
  const bodyGeometry = new THREE.SphereGeometry(25, 16, 12)  // Too large!
  const ringGeometry = new THREE.TorusGeometry(22, 3, 8, 24)  // Too large!
  // ...
}
```

**Target State:**
```typescript
function createUFOLarge(material: THREE.Material): THREE.Object3D {
  const group = new THREE.Group()
  // Reduced body from 25 to 12 units radius
  const bodyGeometry = new THREE.SphereGeometry(12, 16, 12)
  bodyGeometry.scale(1, 0.3, 1)
  const body = new THREE.Mesh(bodyGeometry, material)
  group.add(body)

  // Reduced dome from 10 to 5 units
  const domeGeometry = new THREE.SphereGeometry(5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const dome = new THREE.Mesh(domeGeometry, material)
  dome.position.y = 2.5
  group.add(dome)

  // Reduced ring from 22 to 10 units
  const ringGeometry = new THREE.TorusGeometry(10, 1.5, 8, 24)
  ringGeometry.rotateX(Math.PI / 2)
  const ring = new THREE.Mesh(ringGeometry, material)
  group.add(ring)

  return group
}

function createUFOSmall(material: THREE.Material): THREE.Object3D {
  const group = new THREE.Group()
  // Reduced body from 15 to 8 units radius
  const bodyGeometry = new THREE.SphereGeometry(8, 12, 8)
  bodyGeometry.scale(1, 0.35, 1)
  const body = new THREE.Mesh(bodyGeometry, material)
  group.add(body)

  // Reduced dome from 6 to 3 units
  const domeGeometry = new THREE.SphereGeometry(3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)
  const dome = new THREE.Mesh(domeGeometry, material)
  dome.position.y = 2
  group.add(dome)

  // Reduced ring from 13 to 7 units
  const ringGeometry = new THREE.TorusGeometry(7, 1, 6, 16)
  ringGeometry.rotateX(Math.PI / 2)
  const ring = new THREE.Mesh(ringGeometry, material)
  group.add(ring)

  return group
}
```

### 3. createUFO Entity Scale Removal

**File:** `src/entities/createUFO.ts`

**Current State:**
```typescript
// Calculate scale based on size
const scale = size === 'large' ? 1.5 : 1.0

world.addComponent(
  ufoId,
  new Transform(position.clone(), new Vector3(0, 0, 0), new Vector3(scale, scale, scale))
)
```

**Target State:**
```typescript
// No scale factor - mesh is already correctly sized
const scale = 1.0

world.addComponent(
  ufoId,
  new Transform(position.clone(), new Vector3(0, 0, 0), new Vector3(scale, scale, scale))
)
```

### 4. UFO-Asteroid Collision Mask

**File:** `src/entities/createUFO.ts`

**Current State:**
```typescript
world.addComponent(
  ufoId,
  new Collider('sphere', config.colliderRadius, 'ufo', ['player', 'projectile'])
)
```

**Target State:**
```typescript
world.addComponent(
  ufoId,
  new Collider('sphere', config.colliderRadius, 'ufo', ['player', 'projectile', 'asteroid'])
)
```

### 5. DamageSystem UFO-Asteroid Handling

**File:** `src/systems/DamageSystem.ts`

**Add new collision handler:**
```typescript
// Handle UFO-asteroid collisions (UFO destroys asteroid, UFO unharmed)
if (
  (layer1 === 'ufo' && layer2 === 'asteroid') ||
  (layer1 === 'asteroid' && layer2 === 'ufo')
) {
  const asteroidId = layer1 === 'asteroid' ? entity1 : entity2
  // Only damage the asteroid, not the UFO
  this.applyDamage(world, asteroidId, 999)  // Instant kill
  continue
}
```

### 6. Audio Configuration for UFO Loop

**File:** `src/config/audioConfig.ts`

**Add to sfx section:**
```typescript
sfx: {
  // ... existing sfx ...
  ufoLoop: {
    id: 'ufoLoop',
    path: '/assets/audio/ufo_loop.mp3',
    volume: 0.4,
    preload: true
  }
}
```

### 7. UFOSystem Audio Integration

**File:** `src/systems/UFOSystem.ts`

**Add audio manager and sound state:**
```typescript
export class UFOSystem implements System {
  private events: UFOSystemEvent[] = []
  private ufoStates: Map<EntityId, UFOState> = new Map()
  private audioManager: AudioManager | null = null
  private activeSoundId: number | null = null
  private activeUfoId: EntityId | null = null

  constructor(audioManager?: AudioManager | null) {
    this.audioManager = audioManager ?? null
  }

  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager
  }
```

**Start sound when UFO spawns (in update method):**
```typescript
// Initialize state tracking if needed
let state = this.ufoStates.get(ufoId)
if (!state) {
  state = {
    directionChangeTimer: this.randomDirectionChangeTime(),
    verticalDirection: 0
  }
  this.ufoStates.set(ufoId, state)

  // Start UFO loop sound for first UFO
  if (this.activeUfoId === null && this.audioManager) {
    this.activeUfoId = ufoId
    const basePitch = ufo.ufoSize === 'small' ? 1.3 : 1.0
    this.activeSoundId = this.audioManager.playSound('ufoLoop', {
      loop: true,
      volume: 0.4,
      rate: basePitch
    })
  }
}
```

**Update pitch based on position (doppler effect):**
```typescript
// Update movement
this.updateMovement(ufo, transform, velocity, state, deltaTime)

// Update doppler effect
if (ufoId === this.activeUfoId && this.audioManager && this.activeSoundId !== null) {
  // Calculate pitch: 0.8 at left edge, 1.2 at right edge
  const normalizedX = (transform.position.x + SCREEN_HALF_WIDTH) / (SCREEN_HALF_WIDTH * 2)
  const pitch = 0.8 + normalizedX * 0.4
  const basePitch = ufo.ufoSize === 'small' ? 1.3 : 1.0
  this.audioManager.setSoundRate(this.activeSoundId, pitch * basePitch)

  // Update volume based on distance to player
  if (playerPos) {
    const distance = transform.position.distanceTo(playerPos)
    const maxDistance = SCREEN_HALF_WIDTH * 2
    const volume = Math.max(0.2, 0.6 * (1 - distance / maxDistance))
    this.audioManager.setSoundVolume(this.activeSoundId, volume)
  }
}
```

**Stop sound when UFO destroyed:**
```typescript
// Check if UFO is destroyed
if (health.current <= 0) {
  this.emitUFODestroyed(ufoId, transform.position.clone(), ufo.ufoSize, ufo.points)
  this.stopUfoSound(ufoId)
  world.destroyEntity(ufoId)
  this.ufoStates.delete(ufoId)
  continue
}

// ...

// Check if UFO has left screen bounds
if (this.isOutOfBounds(transform.position)) {
  this.stopUfoSound(ufoId)
  world.destroyEntity(ufoId)
  this.ufoStates.delete(ufoId)
}
```

**Add helper method:**
```typescript
private stopUfoSound(ufoId: EntityId): void {
  if (ufoId === this.activeUfoId && this.audioManager && this.activeSoundId !== null) {
    this.audioManager.stopSound(this.activeSoundId)
    this.activeSoundId = null
    this.activeUfoId = null
  }
}
```

## Data Flow

### UFO Lifecycle with Audio

```
UFOSpawnSystem.update()
    │
    ▼
createUFO() ─────────────────────┐
    │                            │
    ▼                            ▼
┌─────────────────┐    ┌─────────────────┐
│ Transform       │    │ Collider        │
│ (no scale)      │    │ mask: +asteroid │
└─────────────────┘    └─────────────────┘
    │
    ▼
UFOSystem.update()
    │
    ├──────────────────────────┐
    │                          │
    ▼                          ▼
┌─────────────────┐    ┌─────────────────┐
│ First UFO?      │    │ Update movement │
│ Start audio     │    │ Update doppler  │
└─────────────────┘    └─────────────────┘
    │
    ▼
Collision detected (by CollisionSystem)
    │
    ▼
DamageSystem.update()
    │
    ├─────────────────┬─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
UFO-Player       UFO-Projectile    UFO-Asteroid
(kill player)    (destroy UFO)     (destroy asteroid)
    │                 │
    │                 ▼
    │         UFO destroyed
    │                 │
    │                 ▼
    │         Stop audio
    ▼
```

### Doppler Effect Calculation

```
Screen Position:
  Left Edge (-960)  ────────────────────  Right Edge (+960)
       │                                        │
       ▼                                        ▼
    Pitch: 0.8x                            Pitch: 1.2x

Formula:
  normalizedX = (position.x + 960) / 1920  // 0.0 to 1.0
  pitch = 0.8 + (normalizedX * 0.4)        // 0.8 to 1.2

Small UFO bonus:
  finalPitch = pitch * 1.3  // Higher base pitch for small UFO
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/UFO.ts` | Modify | Reduce colliderRadius values |
| `src/rendering/MeshFactory.ts` | Modify | Reduce UFO mesh geometry sizes |
| `src/entities/createUFO.ts` | Modify | Remove scale factor, add asteroid collision mask |
| `src/systems/UFOSystem.ts` | Modify | Add audio manager, doppler effect |
| `src/systems/DamageSystem.ts` | Modify | Add UFO-asteroid collision handling |
| `src/config/audioConfig.ts` | Modify | Add ufoLoop sound definition |
| `tests/unit/UFOSystem.test.ts` | Modify | Add size and audio tests |
| `tests/unit/DamageSystem.test.ts` | Modify | Add UFO-asteroid collision tests |

## Testing Strategy

### Unit Tests

1. **UFO Size Tests**
   - Test large UFO collider radius is 15 units
   - Test small UFO collider radius is 10 units
   - Test UFO Transform scale is 1.0 (no scaling)

2. **UFO Movement Tests**
   - Test UFO velocity is applied correctly
   - Test UFO vertical oscillation works
   - Test UFO screen bounds handling

3. **UFO Audio Tests**
   - Test audio starts when UFO spawns
   - Test pitch changes based on x position
   - Test audio stops when UFO destroyed
   - Test audio stops when UFO exits screen

4. **UFO-Asteroid Collision Tests**
   - Test asteroid is destroyed on UFO contact
   - Test UFO is NOT destroyed on asteroid contact
   - Test collision triggers asteroid split (if large/medium)

### Visual Verification

1. UFO should appear roughly same size as player ship
2. UFO should visibly move across screen
3. Pitch should noticeably change as UFO moves left/right

## Audio Asset Requirements

**ufo_loop.mp3**
- Duration: 2-3 seconds (will loop)
- Content: Warbling/oscillating tone ("oooOoooOO")
- Frequency: ~200-400Hz base tone with modulation
- Format: MP3, 44.1kHz, mono acceptable
- Note: Can be synthesized or sourced from royalty-free library

## Dependencies

- Three.js (existing) - for mesh geometry
- Howler.js (existing) - for audio playback with rate control
- No new dependencies required
