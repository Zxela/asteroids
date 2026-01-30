# Architecture Decision Record: Soundtrack Implementation

## Status

Accepted

## Context

The Asteroids 3D game needs background music. The audio infrastructure already exists:
- `AudioManager` handles loading, playback, volume, muting
- `AudioSystem` triggers music based on game state (mainMenu, playing, boss events)
- `audioConfig` defines music slots with paths and volume levels
- Placeholder MP3 files exist in `public/assets/audio/`

The question is: how do we source the music and integrate it?

## Options Considered

### Option 1: AI-Generated Music (Suno/Udio)
- **Pros:** Custom tracks tailored exactly to game feel, unique
- **Cons:** Requires interactive account access, copyright ambiguity, quality inconsistent

### Option 2: Commission Original Music
- **Pros:** Fully custom, clear ownership
- **Cons:** Requires payment, time, external coordination

### Option 3: Royalty-Free Library Sourcing
- **Pros:** Immediate availability, legal clarity, no cost, good quality options
- **Cons:** Not unique, may need to search for cohesive set

### Option 4: Keep Placeholders
- **Pros:** No effort
- **Cons:** Game lacks atmosphere, incomplete experience

## Decision

**Option 3: Royalty-Free Library Sourcing**

We will source synthwave tracks from royalty-free libraries (Pixabay, Free Music Archive, OpenGameArt). This provides:
- Immediate implementation
- Legal clarity for distribution
- Quality tracks with consistent style
- No cost or external dependencies

## Implementation Approach

1. **Search** royalty-free libraries for synthwave tracks
2. **Curate** three tracks with escalating energy (chill → driving → intense)
3. **Download** tracks to `public/assets/audio/` replacing placeholders
4. **Verify** playback works with existing AudioManager/AudioSystem
5. **Adjust** volume levels in `audioConfig.ts` if needed

## Consequences

### Positive
- Quick implementation with existing infrastructure
- No code changes required (or minimal volume tweaks)
- Legally clear for distribution
- Professional quality music available

### Negative
- Tracks not unique to this game
- May not find perfect "variations of a theme" (same artist/album)
- Dependent on what's available in free libraries

### Mitigations
- Search for artist collections or albums to maximize cohesion
- Prioritize production style consistency over exact thematic matching
- Can replace tracks later if better options found

## References

- Existing AudioManager: `src/audio/AudioManager.ts`
- Existing AudioSystem: `src/systems/AudioSystem.ts`
- Audio config: `src/config/audioConfig.ts`
- Audio assets: `public/assets/audio/`
