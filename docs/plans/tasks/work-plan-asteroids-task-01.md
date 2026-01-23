# Task: Project Setup and Build Configuration

Metadata:
- Phase: 1 (Foundation)
- Dependencies: None
- Provides: Build system ready, directory structure created
- Size: Small (2-3 files modified)
- Estimated Duration: 1 day

## Implementation Content

Initialize Vite configuration, TypeScript configuration, package.json dependencies, and directory structure. This is the foundation task for all subsequent phases.

## Target Files

- [x] `vite.config.ts` - Vite configuration with Three.js module resolution
- [x] `tsconfig.json` - TypeScript configuration with strict mode
- [x] `package.json` - Dependencies and build scripts
- [x] `index.html` - Entry point with canvas element
- [x] `src/main.ts` - Application entry point (stub)
- [x] `src/` directory structure created

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase
- [x] Create test file for build configuration verification
- [x] Test that `npm run build` can be executed
- [x] Test that `npm run type-check` passes
- [x] Test that project structure matches expected layout

### 2. Green Phase
- [x] Create `vite.config.ts`:
  - Configure for Three.js module resolution
  - Set entry point to `index.html`
  - Configure asset handling for game assets
  - Target ES2020, enable sourcemaps for development

- [x] Create `tsconfig.json`:
  - Enable strict mode
  - Set module resolution to node
  - Target ES2020
  - Declare strict null checks, strict function types
  - Configure paths for `@/*` aliases (future use)

- [x] Update `package.json`:
  - Install core dependencies: Three.js r171+, Howler.js, Vitest, Vite, TypeScript
  - Add build scripts:
    - `build`: Vite build for production
    - `dev`: Vite dev server
    - `type-check`: TypeScript type checking
    - `test`: Vitest runner
    - `check`: Biome lint and format
  - Configure Vitest for unit testing

- [x] Create `index.html`:
  - Canvas element with id="game"
  - Script tag for `src/main.ts`
  - Basic styling for full-screen canvas
  - Viewport meta tags for mobile

- [x] Create `src/main.ts`:
  - Empty entry point (will be implemented in Task 2.1)

- [x] Create directory structure:
  - `src/` (application code)
  - `src/ecs/` (Entity-Component-System)
  - `src/components/` (Component definitions)
  - `src/systems/` (System implementations)
  - `src/entities/` (Entity factories)
  - `src/rendering/` (Three.js integration)
  - `src/game/` (Game loop and orchestration)
  - `src/ui/` (User interface)
  - `src/utils/` (Utility functions)
  - `src/types/` (Type definitions)
  - `src/config/` (Configuration)
  - `src/audio/` (Audio management)
  - `src/state/` (Game state machine)
  - `tests/unit/` (Unit tests)
  - `tests/integration/` (Integration tests)
  - `public/assets/` (Game assets placeholder)

### 3. Refactor Phase
- [x] Verify all configuration is clean and follows project conventions
- [x] Ensure no hardcoded values in configs
- [x] Remove unused dependencies
- [x] Optimize build output configuration

## Completion Criteria

- [x] `npm run build` succeeds with no errors
- [x] `npm run type-check` passes with no errors
- [x] All directories created as specified
- [x] Entry point `src/main.ts` exists and can be loaded
- [x] HTML canvas renders without errors
- [x] Vite dev server starts without errors
- [x] No console errors on page load

## Verification Method

**L3: Build Success Verification**

```bash
# Navigate to project directory
cd /home/zxela/asteroids

# Install dependencies
npm install

# Verify build
npm run build

# Verify type checking
npm run type-check

# Start dev server and verify it loads
npm run dev
# Open browser to http://localhost:5173/
# Verify no console errors, canvas renders
```

**Success Indicators**:
- Build completes without errors
- TypeScript type-check passes
- Dev server starts successfully
- Browser console shows no errors
- Canvas element visible on page

## Notes

- This is prerequisite for all subsequent tasks
- No game logic yet, just build infrastructure
- Configuration templates available in project references
- Browser compatibility for dev server only (Vite handles)
- Asset paths will be configured in later phases

## Impact Scope

**Allowed Changes**: Build configuration, npm scripts, directory structure
**Protected**: None (greenfield)
**Areas Affected**: All subsequent phases depend on this task's successful completion

## Deliverables

- Working Vite build system
- TypeScript configuration with strict mode
- Directory structure for entire project
- Ready for Phase 1 Task 1.2 (ECS implementation)
