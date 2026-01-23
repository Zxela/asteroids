# Task: Configuration Constants

Metadata:
- Phase: 1 (Foundation)
- Dependencies: Task 1.3 (Type Definitions)
- Provides: gameConfig, audioConfig exports
- Size: Small (2 files)
- Estimated Duration: 0.5 days

## Implementation Content

Implement game configuration with all physics, gameplay, audio, and visual constants. This centralizes all magic numbers for easy tuning.

## Target Files

- [ ] `src/config/gameConfig.ts` - Game physics and gameplay constants
- [ ] `src/config/audioConfig.ts` - Audio and sound definitions
- [ ] `src/config/index.ts` - Configuration exports

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [ ] Create test file for configuration structure
- [ ] Verify all config constants are accessible
- [ ] Test that config values match Design Doc specifications

### 2. Green Phase

**Implement game configuration**:

- [ ] Create `src/config/gameConfig.ts`:
  ```typescript
  export interface GameConfig {
    // Physics constants
    physics: {
      shipAcceleration: number;      // 0.5
      shipMaxSpeed: number;          // 300
      shipRotationSpeed: number;     // π rad/s
      damping: number;               // 0.99 per frame
      asteroidSpeeds: {
        large: number;               // Base speed
        medium: number;              // Faster
        small: number;               // Even faster
      };
    };

    // Gameplay constants
    gameplay: {
      initialLives: number;          // 3
      invulnerabilityDuration: number; // 3000ms
      waveTransitionDelay: number;   // 3000ms
      scoring: {
        largeAsteroid: number;       // 25
        mediumAsteroid: number;      // 50
        smallAsteroid: number;       // 100
        bossMultiplier: number;      // 1000
      };
    };

    // Wave progression
    wave: {
      baseAsteroidCount: number;     // 3
      asteroidIncrement: number;     // +2 per wave
      speedMultiplier: number;       // 1.05 per wave, capped at 2.0
      bossWaveInterval: number;      // Every 5 waves
    };

    // Power-up configuration
    powerups: {
      spawnChance: number;           // 0.1 (10%)
      shield: {
        duration: number;            // 10000ms
      };
      rapidFire: {
        duration: number;            // 15000ms
        cooldownMultiplier: number;  // 0.5
      };
      multiShot: {
        duration: number;            // 15000ms
        projectileCount: number;     // 3
      };
    };

    // Visual constants
    visual: {
      particlePoolSize: number;      // 500
      projectilePoolSize: number;    // 50
      maxProjectiles: number;        // 200
      asteroidPoolSize: number;      // 30
    };

    // Performance targets
    performance: {
      targetFPS: number;             // 60
      targetDrawCalls: number;       // <100
      collisionBroadPhaseGridSize: number; // 100 units
    };
  }

  export const gameConfig: GameConfig = {
    physics: {
      shipAcceleration: 0.5,
      shipMaxSpeed: 300,
      shipRotationSpeed: Math.PI,
      damping: 0.99,
      asteroidSpeeds: {
        large: 50,
        medium: 75,
        small: 100,
      },
    },
    gameplay: {
      initialLives: 3,
      invulnerabilityDuration: 3000,
      waveTransitionDelay: 3000,
      scoring: {
        largeAsteroid: 25,
        mediumAsteroid: 50,
        smallAsteroid: 100,
        bossMultiplier: 1000,
      },
    },
    wave: {
      baseAsteroidCount: 3,
      asteroidIncrement: 2,
      speedMultiplier: 1.05,
      bossWaveInterval: 5,
    },
    powerups: {
      spawnChance: 0.1,
      shield: { duration: 10000 },
      rapidFire: { duration: 15000, cooldownMultiplier: 0.5 },
      multiShot: { duration: 15000, projectileCount: 3 },
    },
    visual: {
      particlePoolSize: 500,
      projectilePoolSize: 50,
      maxProjectiles: 200,
      asteroidPoolSize: 30,
    },
    performance: {
      targetFPS: 60,
      targetDrawCalls: 100,
      collisionBroadPhaseGridSize: 100,
    },
  };
  ```

- [ ] Create `src/config/audioConfig.ts`:
  ```typescript
  export interface AudioDefinition {
    id: string;
    path: string;
    volume: number;
    preload: boolean;
  }

  export interface AudioConfig {
    sfx: {
      shoot: AudioDefinition;
      explosion: AudioDefinition;
      powerup: AudioDefinition;
      thrust: AudioDefinition;
    };
    music: {
      background: AudioDefinition;
      boss: AudioDefinition;
    };
  }

  export const audioConfig: AudioConfig = {
    sfx: {
      shoot: {
        id: 'shoot',
        path: '/assets/audio/shoot.mp3',
        volume: 0.7,
        preload: true,
      },
      explosion: {
        id: 'explosion',
        path: '/assets/audio/explosion.mp3',
        volume: 0.8,
        preload: true,
      },
      powerup: {
        id: 'powerup',
        path: '/assets/audio/powerup.mp3',
        volume: 0.6,
        preload: true,
      },
      thrust: {
        id: 'thrust',
        path: '/assets/audio/thrust.mp3',
        volume: 0.4,
        preload: true,
      },
    },
    music: {
      background: {
        id: 'music_background',
        path: '/assets/audio/background.mp3',
        volume: 0.5,
        preload: false,
      },
      boss: {
        id: 'music_boss',
        path: '/assets/audio/boss.mp3',
        volume: 0.5,
        preload: false,
      },
    },
  };
  ```

- [ ] Create `src/config/index.ts`:
  ```typescript
  export { gameConfig } from './gameConfig';
  export type { GameConfig } from './gameConfig';
  export { audioConfig } from './audioConfig';
  export type { AudioConfig, AudioDefinition } from './audioConfig';
  ```

### 3. Refactor Phase
- [ ] Verify all magic numbers are in config (no hardcoded values elsewhere)
- [ ] Check consistency with Design Doc specifications
- [ ] Ensure configuration is immutable (const or readonly)
- [ ] Document any configuration rationale in JSDoc

## Completion Criteria

- [ ] All physics constants defined and match Design Doc specs
- [ ] All gameplay constants match AC requirements
- [ ] Audio configuration with preload/lazy-load strategy
- [ ] Configuration values are centralized (not hardcoded elsewhere)
- [ ] Configuration is type-safe and exported
- [ ] TypeScript strict mode passes

## Verification Method

**L3: Build Success Verification**

```bash
# Type checking
npm run type-check

# Build verification
npm run build

# Import and verify configuration is accessible
# In a test file:
import { gameConfig, audioConfig } from 'src/config';
console.log(gameConfig.gameplay.initialLives); // Should be 3
```

**Success Indicators**:
- Build succeeds with no errors
- TypeScript passes
- Configuration accessible from `src/config/index.ts`
- All constants match Design Doc

## Notes

- Configuration is read-only after initialization
- Physics constants match Design Doc specifications
- Audio paths placeholder (actual audio not required for Phase 1)
- Easy tuning: all gameplay constants in one place
- No initialization logic in config (pure data)

## Impact Scope

**Allowed Changes**: Configuration values, new config sections
**Protected Areas**: Configuration interface structure (changes break all systems)
**Areas Affected**: Physics system, wave system, scoring, power-ups, audio

## Deliverables

- Centralized game configuration
- Audio configuration with preload strategy
- Ready for Task 1.5 (Utilities) and Phase 2 tasks
