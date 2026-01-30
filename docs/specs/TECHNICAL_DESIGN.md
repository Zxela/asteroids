# Technical Design: Powerups & Music System

## Architecture Overview

This design addresses two subsystems:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Game Lifecycle                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │ AudioManager │───▶│   AudioSystem    │◀───│ GlobalEvents │  │
│  │  (Singleton) │    │   (Persistent)   │    │   Emitter    │  │
│  └──────────────┘    └──────────────────┘    └──────────────┘  │
│                              │                      ▲           │
│                              ▼                      │           │
│  ┌──────────────────────────────────────────────────┘          │
│  │                                                              │
│  │   MainMenu ──emit('mainMenu')──▶ plays menu.mp3             │
│  │   Playing  ──emit('playing')───▶ plays background.mp3       │
│  │   GameOver ──emit('gameOver')──▶ plays gameOver.mp3         │
│  │                                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Powerup Integration                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ PowerUpSystem│────────▶│ WeaponSystem │                     │
│  │              │  query  │              │                     │
│  │ hasActiveEffect()      │ fireSpread() │                     │
│  └──────────────┘         └──────────────┘                     │
│         │                        │                              │
│         ▼                        ▼                              │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │PowerUpEffect │         │  Projectile  │                     │
│  │  Component   │         │   Entities   │                     │
│  └──────────────┘         └──────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Changes

### 1. Game.ts - Persistent Audio Architecture

**Current State:**
```typescript
// eventEmitter created in initializeGameplay() - too late
private eventEmitter: EventEmitter | null = null

private initializeGameplay() {
  this.eventEmitter = new EventEmitter()
  this.audioSystem = new AudioSystem(this.audioManager, this.eventEmitter)
}
```

**Target State:**
```typescript
// Global event emitter created at game start
private globalEventEmitter: EventEmitter
private audioSystem: AudioSystem | null = null

constructor() {
  this.globalEventEmitter = new EventEmitter()
}

async start() {
  await this.audioManager.init()
  // Create AudioSystem immediately after AudioManager is ready
  this.audioSystem = new AudioSystem(this.audioManager, this.globalEventEmitter)
  // Now main menu transition will have a listener
  this.onStateChange('mainMenu')
}

private onStateChange(state: GameState) {
  // Use globalEventEmitter instead of session-scoped eventEmitter
  this.globalEventEmitter.emit('gameStateChanged', { state })
}
```

### 2. AudioSystem.ts - State Handling

**Current State:** Already handles states correctly, just never receives menu events.

**Changes Needed:**
- Ensure `onGameStateChanged` handles attract mode correctly
- Add crossfade support for smoother transitions

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

### 3. WeaponSystem.ts - MultiShot Integration

**Current State:**
```typescript
constructor(inputSystem: InputSystem) {
  this.inputSystem = inputSystem
}
```

**Target State:**
```typescript
constructor(inputSystem: InputSystem, powerUpSystem?: PowerUpSystem) {
  this.inputSystem = inputSystem
  this.powerUpSystem = powerUpSystem ?? null
}

private handleStandardFiring(world, entityId, transform, weapon) {
  // Check for multiShot powerup effect
  const hasMultiShot = this.powerUpSystem?.hasActiveEffect(entityId, 'multiShot') ?? false

  // Use spread pattern if multiShot active OR weapon is spread type
  if (hasMultiShot || weapon.currentWeapon === 'spread') {
    this.fireSpreadShot(world, entityId, transform, weapon)
  } else if (weapon.currentWeapon === 'homing') {
    this.fireHomingMissile(world, entityId, transform, weapon)
  } else {
    this.fireSingleShot(world, entityId, transform, weapon)
  }
}
```

### 4. PowerUpSystem.ts - Visual Feedback Events

**Add new event types for visual feedback:**

```typescript
interface PowerUpCollectedEventData {
  entityId: EntityId
  powerUpType: PowerUpType
  position: Vector3
  // Add for visual feedback
  color: number  // Hex color for particles/flash
}

private collectPowerUp(world, playerId, powerUpId) {
  const powerUpType = powerUpComponent.powerUpType
  const color = this.getPowerUpColor(powerUpType)

  // Emit enhanced event for visual system
  this.events.push({
    type: 'powerUpCollected',
    data: {
      entityId: playerId,
      powerUpType,
      position: transform.position.clone(),
      color
    }
  })
}

private getPowerUpColor(type: PowerUpType): number {
  const colors = {
    shield: 0x00ffff,    // Cyan
    rapidFire: 0xff8800, // Orange
    multiShot: 0xff00ff, // Magenta
    extraLife: 0x00ff00  // Green
  }
  return colors[type] ?? 0xffffff
}
```

### 5. ParticleSystem.ts - Collection Effects

**Add powerup collection particle burst:**

```typescript
private handlePowerUpCollected(event: PowerUpCollectedEvent): void {
  const { position, color } = event.data

  // Create burst of particles at collection point
  this.createParticleBurst({
    position,
    color,
    count: 20,
    speed: 50,
    lifetime: 500,
    size: 3
  })
}
```

### 6. Game.ts - Screen Flash Effect

**Add brief screen flash on powerup collection:**

```typescript
private flashOverlay: HTMLElement | null = null

private setupFlashOverlay(): void {
  this.flashOverlay = document.createElement('div')
  this.flashOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s;
  `
  document.body.appendChild(this.flashOverlay)
}

private flashScreen(color: number, duration = 100): void {
  if (!this.flashOverlay) return
  const hex = '#' + color.toString(16).padStart(6, '0')
  this.flashOverlay.style.backgroundColor = hex
  this.flashOverlay.style.opacity = '0.3'
  setTimeout(() => {
    this.flashOverlay!.style.opacity = '0'
  }, duration)
}
```

## Data Flow

### Music State Transitions

```
Game Start
    │
    ▼
┌─────────────────┐
│ AudioManager    │
│ .init()         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AudioSystem     │◀──── subscribes to globalEventEmitter
│ created         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ onStateChange   │
│ ('mainMenu')    │──────▶ globalEventEmitter.emit('gameStateChanged')
└────────┬────────┘                    │
         │                             ▼
         │               ┌─────────────────────┐
         │               │ AudioSystem         │
         │               │ .onGameStateChanged │
         │               │ playMusic('menu')   │
         │               └─────────────────────┘
         ▼
    Menu Music Plays!
```

### MultiShot Firing Flow

```
Player presses Fire
         │
         ▼
┌─────────────────┐
│ WeaponSystem    │
│ .update()       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ powerUpSystem.hasActiveEffect   │
│ (entityId, 'multiShot')         │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │         │
   true     false
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ spread │ │ single │
│ shot   │ │ shot   │
└────────┘ └────────┘
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/game/Game.ts` | Modify | Add globalEventEmitter, create AudioSystem early, add flash overlay |
| `src/systems/AudioSystem.ts` | Modify | Handle attractMode state, add crossfade |
| `src/systems/WeaponSystem.ts` | Modify | Add PowerUpSystem dependency, check multiShot |
| `src/systems/PowerUpSystem.ts` | Modify | Add color to events |
| `src/systems/ParticleSystem.ts` | Modify | Add powerup collection particles |
| `tests/unit/WeaponSystem.test.ts` | Modify | Add multiShot tests |
| `tests/unit/PowerUpSystem.test.ts` | Modify | Add visual feedback tests |

## Testing Strategy

### Unit Tests

1. **WeaponSystem MultiShot**
   - Test that multiShot effect causes spread firing
   - Test that multiShot stacks with rapidFire
   - Test that multiShot expires correctly

2. **AudioSystem State Transitions**
   - Test menu music plays on mainMenu state
   - Test background music plays on playing state
   - Test music stops/changes on gameOver

3. **PowerUpSystem Events**
   - Test color is included in collected events
   - Test all powerup types emit correct colors

### Integration Tests

1. Full game flow: menu → play → collect powerup → visual feedback
2. Music transitions through full game lifecycle

## Rollout Plan

1. **Phase 1: Fix MultiShot** (Core gameplay fix)
   - Wire WeaponSystem to PowerUpSystem
   - Add unit tests

2. **Phase 2: Fix Music** (User experience)
   - Refactor to persistent AudioSystem
   - Test all state transitions

3. **Phase 3: Visual Polish** (Enhancement)
   - Add particle effects
   - Add screen flash
   - Balance review

## Dependencies

- Three.js (existing) - for particle effects
- Howler.js (existing) - for audio playback
- No new dependencies required
