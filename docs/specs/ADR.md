# Architecture Decision Record: Persistent AudioSystem & Powerup Fixes

## Status

Proposed

## Context

The game has two architectural issues:

### Issue 1: AudioSystem Lifecycle
Currently, `AudioSystem` is created inside `initializeGameplay()` which only runs when the player clicks "Play". This means:
- No event listener exists when transitioning to main menu
- The `gameStateChanged` event fires but has no subscriber
- Menu music never plays
- Each new game creates a fresh AudioSystem, losing state

### Issue 2: MultiShot Not Wired
`PowerUpSystem` correctly tracks the multiShot effect but `WeaponSystem` never checks for it. The systems are decoupled but the integration point was never implemented.

## Decision Drivers

- Menu music must play before any gameplay occurs
- AudioSystem must persist across game sessions (menu → play → game over → menu)
- PowerUpSystem and WeaponSystem need a clean integration pattern
- Solution must work with existing ECS architecture
- Browser autoplay policies require user interaction before audio

## Options Considered

### Option 1: Direct AudioManager Calls (Rejected)
Have `MainMenu` and `Game` directly call `audioManager.playMusic()`.

**Pros:**
- Simple, immediate fix
- No architectural changes

**Cons:**
- Bypasses event system, creating inconsistency
- Music logic scattered across multiple files
- Harder to maintain and debug

### Option 2: Minimal AudioSystem Move (Rejected)
Create AudioSystem earlier in Game constructor.

**Pros:**
- Small change
- Fixes immediate problem

**Cons:**
- Still recreates AudioSystem each game
- Event emitter lifecycle still problematic
- Doesn't address root cause

### Option 3: Persistent AudioSystem (Selected)
Create AudioSystem once during `AudioManager.init()` and keep it alive for the entire application lifecycle.

**Pros:**
- Single source of truth for audio state
- Clean event handling for all game states
- No recreation/cleanup complexity
- Matches how AudioManager already works (singleton)

**Cons:**
- Larger refactor
- Need to ensure proper event subscription lifecycle

## Decision

**Implement Option 3: Persistent AudioSystem**

The AudioSystem will be:
1. Created once during game initialization (before main menu)
2. Subscribed to a global event emitter that persists across game sessions
3. Responsible for all music state transitions

For the MultiShot integration:
1. WeaponSystem will receive a reference to PowerUpSystem
2. During firing, check `powerUpSystem.hasActiveEffect(entityId, 'multiShot')`
3. If active, use spread-shot firing logic instead of single-shot

## Consequences

### Positive
- Menu music plays immediately
- Consistent audio behavior across all game states
- Single AudioSystem instance simplifies debugging
- Clear integration pattern for PowerUpSystem → WeaponSystem

### Negative
- Requires refactoring Game.ts initialization order
- Need to create a persistent event emitter separate from gameplay events
- WeaponSystem gains dependency on PowerUpSystem

### Risks
- Browser autoplay may still block initial music (mitigated by existing user interaction flow)
- Event emitter memory leaks if not properly managed (mitigated by singleton pattern)

## Implementation Notes

### AudioSystem Changes
```typescript
// Create persistent event emitter in Game class (not per-session)
class Game {
  private globalEventEmitter: EventEmitter  // Persists across sessions
  private audioSystem: AudioSystem          // Created once, never destroyed

  constructor() {
    this.globalEventEmitter = new EventEmitter()
    this.audioSystem = new AudioSystem(audioManager, this.globalEventEmitter)
    // ...
  }
}
```

### WeaponSystem Changes
```typescript
class WeaponSystem {
  constructor(inputSystem: InputSystem, powerUpSystem: PowerUpSystem) {
    this.powerUpSystem = powerUpSystem
  }

  private handleStandardFiring(...) {
    const hasMultiShot = this.powerUpSystem?.hasActiveEffect(entityId, 'multiShot')
    if (hasMultiShot || weapon.currentWeapon === 'spread') {
      this.fireSpreadShot(...)
    } else {
      this.fireSingleShot(...)
    }
  }
}
```

## Related Documents

- PRD.md - Product requirements
- TECHNICAL_DESIGN.md - Detailed implementation plan
