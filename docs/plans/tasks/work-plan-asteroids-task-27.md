# Task: Audio System Integration

Metadata:
- Phase: 5 (Enhanced Features)
- Task: 5.2
- Dependencies: Task 5.1 (Audio Manager), Task 3.2 (Weapon System), Task 3.3 (Asteroid Destruction)
- Provides: AudioSystem ECS integration, event-driven audio playback
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Connect audio playback to game events through an AudioSystem that listens for game events and triggers appropriate sounds. The system subscribes to weaponFired, asteroidDestroyed, powerUpCollected, shipThrust, and other game events, playing corresponding audio through the AudioManager. This creates immersive audio feedback for all gameplay actions.

*Reference dependencies: AudioManager (Task 5.1), EventBus, WeaponSystem events, AsteroidDestructionSystem events*

## Target Files

- [ ] `src/systems/AudioSystem.ts` - Event listener and audio trigger system
- [ ] `tests/unit/AudioSystem.test.ts` - Audio system unit tests

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [ ] Create test file for AudioSystem
- [ ] Write failing test for AudioSystem initialization with AudioManager
- [ ] Write failing test for weaponFired event triggers shoot sound
- [ ] Write failing test for asteroidDestroyed event triggers explosion sound
- [ ] Write failing test for powerUpCollected event triggers powerup sound
- [ ] Write failing test for shipThrust event triggers thrust sound
- [ ] Write failing test for playerDied event triggers game over sound
- [ ] Write failing test for waveStarted event triggers wave start sound
- [ ] Write failing test for bossSpawned event triggers boss theme music
- [ ] Write failing test for bossDefeated event stops boss theme
- [ ] Write failing test for game state change triggers appropriate music
- [ ] Write failing test for system respects volume settings
- [ ] Write failing test for system handles missing AudioManager gracefully
- [ ] Verify all tests fail (Red state)

### 2. Green Phase

**Implement AudioSystem**:
- [ ] Create `src/systems/AudioSystem.ts`:
  - Class AudioSystem implements System:
    - Private audioManager: AudioManager
    - Private eventBus: EventBus
    - Private thrustSoundPlaying: boolean
  - Constructor:
    - Accept AudioManager and EventBus dependencies
    - Subscribe to all relevant game events
  - Event handlers:
    - onWeaponFired(event: WeaponFiredEvent):
      - Play 'shoot' sound
      - Vary pitch slightly based on weapon type
    - onAsteroidDestroyed(event: AsteroidDestroyedEvent):
      - Play 'explosion' sound
      - Scale volume based on asteroid size
    - onPowerUpCollected(event: PowerUpCollectedEvent):
      - Play 'powerup' sound
    - onShipThrust(event: ShipThrustEvent):
      - Play 'thrust' sound if not already playing
      - Loop while thrusting, stop when thrust ends
    - onPlayerDied(event: PlayerDiedEvent):
      - Play 'gameOver' sound
      - Stop background music
    - onWaveStarted(event: WaveStartedEvent):
      - Play subtle wave start sound (if defined)
    - onBossSpawned(event: BossSpawnedEvent):
      - Crossfade to 'bossTheme' music
    - onBossDefeated(event: BossDefeatedEvent):
      - Crossfade back to 'backgroundMusic'
    - onGameStateChanged(state: GameFlowState):
      - MainMenu: Play 'menuMusic'
      - Playing: Play 'backgroundMusic'
      - Paused: Lower music volume or pause
      - GameOver: Stop music, play game over
  - Method: update(deltaTime: number)
    - Handle continuous sounds (thrust loop)
    - Manage music transitions
  - Method: destroy()
    - Unsubscribe from all events
    - Stop all sounds

**Integrate into game loop**:
- [ ] Register AudioSystem with Game class
- [ ] Initialize after AudioManager
- [ ] Call update() each frame

**Create unit tests**:
- [ ] Create `tests/unit/AudioSystem.test.ts`:
  - Test initialization with AudioManager
  - Test weaponFired triggers shoot sound
  - Test asteroidDestroyed triggers explosion
  - Test powerUpCollected triggers powerup
  - Test shipThrust starts/stops correctly
  - Test playerDied triggers game over
  - Test bossSpawned starts boss theme
  - Test bossDefeated returns to background music
  - Test game state music changes
  - Test volume settings respected
  - Test destroy cleans up subscriptions
  - Mock AudioManager and EventBus for testing

### 3. Refactor Phase
- [ ] Verify all event subscriptions complete
- [ ] Optimize thrust sound loop handling
- [ ] Add sound cooldowns for rapid events (prevent spam)
- [ ] Ensure music crossfades are smooth
- [ ] Confirm all tests pass

## Completion Criteria

- [ ] Audio plays on weapon fire (shoot sound)
- [ ] Audio plays on asteroid destruction (explosion sound)
- [ ] Audio plays on power-up collection (powerup sound)
- [ ] Audio plays on ship thrust (thrust loop)
- [ ] Audio plays on player death (game over sound)
- [ ] Boss theme plays during boss encounters
- [ ] Background music changes with game state
- [ ] Volume levels appropriate and configurable
- [ ] Sound selection appropriate for each event type
- [ ] No audio spam on rapid events
- [ ] Unit tests passing (15+ test cases)
- [ ] Build succeeds with no errors
- [ ] Type checking passes

## Verification Method

**L1: Functional Operation Verification + L2: Test Operation Verification**

```bash
# Run unit tests
npm test -- AudioSystem.test.ts

# Run type checking
npm run type-check

# Run build
npm run build

# Manual verification (functional check)
# Expected: All game actions produce appropriate audio feedback
```

**Success Indicators**:
- Shooting plays shoot sound immediately
- Explosions play on asteroid destruction
- Power-up collection plays feedback sound
- Thrust sound loops while thrusting
- Music transitions smoothly between states
- All unit tests passing (15+ test cases)

## Notes

- AudioSystem is an ECS system that processes no entities directly
- Acts as bridge between game events and AudioManager
- Thrust sound requires special handling (loop while active)
- Boss music crossfades to maintain atmosphere
- Sound cooldowns prevent audio spam (e.g., rapid fire)
- Music volume may lower during paused state
- System should gracefully handle AudioManager unavailability
- Event subscriptions must be cleaned up on destroy

## Impact Scope

**Allowed Changes**: Event mappings, sound selections, volume levels
**Protected Areas**: AudioManager interface, EventBus contracts, existing game events
**Areas Affected**: Audio playback timing, game atmosphere, player feedback

## Deliverables

- AudioSystem class connecting events to audio
- Event-driven sound playback for all game actions
- Music management for game states and boss encounters
- Comprehensive unit tests for audio integration
- Ready for Phase 5 integration testing
