# 3D Asteroids

A modern, browser-based reimagining of the classic Asteroids arcade game built with TypeScript, Three.js, and Vite.

## Features

- **Classic Gameplay** - Rotation-based ship control with inertia and momentum
- **3D Graphics** - Procedurally generated meshes with particle effects and screen shake
- **Multiple Weapons** - Single shot, spread shot, laser beam, and homing missiles
- **Power-Ups** - Shield, rapid fire, multi-shot, and extra life
- **Boss Encounters** - Unique bosses every 5 waves with distinct AI patterns
- **Wave Progression** - Increasing difficulty with asteroid count and speed scaling
- **Leaderboard** - Local high score tracking with name entry
- **Audio System** - Sound effects and background music with volume controls

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Controls

| Key | Action |
|-----|--------|
| W / Up Arrow | Thrust forward |
| A / Left Arrow | Rotate left |
| D / Right Arrow | Rotate right |
| Space | Fire weapon |
| Escape | Pause game |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run check        # Check code style
npm run lint:fix     # Fix linting issues
npm run format       # Format code
```

## Tech Stack

- **Three.js** - 3D rendering with WebGPU/WebGL 2 support
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Vitest** - Unit and integration testing
- **Howler.js** - Cross-browser audio
- **Biome** - Code formatting and linting

## Architecture

The game uses an **Entity-Component-System (ECS)** architecture:

- **Entities** - Ship, asteroids, projectiles, power-ups, bosses
- **Components** - Transform, Velocity, Physics, Collider, Health, Weapon, etc.
- **Systems** - Input, Physics, Collision, Damage, Weapon, Wave, Render, Audio, etc.

Game state is managed via a **Finite State Machine** with states: Loading, MainMenu, Playing, Paused, and GameOver.

## Project Structure

```
src/
├── main.ts              # Entry point
├── game/                # Main game loop
├── ecs/                 # ECS implementation
├── components/          # Component definitions
├── systems/             # Game systems
├── entities/            # Entity factories
├── rendering/           # Three.js rendering
├── state/               # Game state machine
├── ui/                  # UI components
├── config/              # Game configuration
└── types/               # TypeScript types
```

## Documentation

- [Product Requirements](docs/design/prd-asteroids.md)
- [Design Document](docs/design/design-asteroids.md)
- [Architecture Decision Records](docs/adr/)
- [Testing Guide](TESTING.md)

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## License

MIT
