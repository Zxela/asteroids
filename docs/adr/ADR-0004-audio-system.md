# ADR-0004: Audio System

## Status

Proposed

## Context

The 3D Asteroids game requires audio for:
- Sound effects: shooting, explosions, power-up collection, thruster sounds
- Background music: looping ambient music with potential intensity variations
- Volume controls: separate sliders for SFX and music
- Cross-browser compatibility with autoplay policy handling

Audio must work reliably across all target browsers (Chrome, Firefox, Safari, Edge) and handle modern browser autoplay restrictions gracefully.

## Decision

### Decision Details

| Item | Content |
|------|---------|
| **Decision** | Use Howler.js for cross-browser audio management |
| **Why now** | Audio architecture affects asset loading strategy and game loop integration |
| **Why this** | Howler.js abstracts browser inconsistencies while providing Web Audio API power |
| **Known unknowns** | Whether 3D spatial audio (for positional sounds) will be needed |
| **Kill criteria** | If Howler.js limitations block >2 required audio features |

## Rationale

Howler.js provides:
- Automatic Web Audio API usage with HTML5 Audio fallback
- Built-in handling of browser autoplay policies
- Audio sprites for efficient sound effect management
- Cross-browser compatibility battle-tested over years
- Small footprint (~10KB minified+gzipped)
- Direct Web Audio API access when advanced features needed

### Options Considered

1. **Direct Web Audio API**
   - Pros: Full control; no dependencies; all features available; most performant option
   - Cons: Significant browser inconsistencies; complex autoplay handling; verbose API for common operations; must handle fallbacks manually; higher development time

2. **Tone.js**
   - Pros: Powerful synthesis and music features; excellent for procedural audio; good scheduling API
   - Cons: Larger bundle size (~150KB); overkill for sound effects and music playback; music synthesis focus vs game audio; steeper learning curve

3. **Howler.js (Selected)**
   - Pros: Battle-tested cross-browser support; simple API for common game audio needs; automatic autoplay policy handling; audio sprites for SFX efficiency; small bundle size; Web Audio API access when needed; active maintenance; extensive documentation
   - Cons: Limited advanced synthesis features; 3D audio requires manual setup; adds external dependency

## Consequences

### Positive Consequences

- Consistent audio behavior across all target browsers
- Autoplay restrictions handled transparently
- Audio sprites reduce HTTP requests and improve load time
- Volume control implementation straightforward
- Sound pooling built into library for rapid fire effects
- Direct Web Audio API access available if advanced features needed

### Negative Consequences

- External dependency added to project
- Must learn Howler.js API (though simple)
- Some Web Audio API features require bypassing Howler abstractions

### Neutral Consequences

- Audio assets should be in MP3 format for best compatibility (Howler handles format fallback)
- Sound preloading strategy needed for gameplay-critical effects
- Music looping handled by library configuration

## Implementation Guidance

- Preload all gameplay-critical sound effects before game starts
- Use audio sprites for small, frequently-played effects (shoot, hit)
- Implement sound pooling for effects that may overlap (explosions)
- Create AudioManager singleton to centralize volume controls and sound playback
- Handle audio context resume on first user interaction (click/keypress)
- Persist volume settings to localStorage
- Consider lazy-loading non-critical audio (music, ambient) after initial game load
- Expose Howler's underlying Web Audio nodes if 3D positional audio becomes needed

## Related Information

- [Howler.js Official Site](https://howlerjs.com/)
- [Howler.js GitHub](https://github.com/goldfire/howler.js)
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Dynamic Music in Games using Web Audio](https://cschnack.de/blog/2020/webaudio/)
