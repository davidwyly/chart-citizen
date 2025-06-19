# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chart Citizen is an interactive 3D celestial system explorer built with:
- Next.js 15 + React 19 with TypeScript
- React Three Fiber for 3D rendering
- Custom Celestial Rendering Engine
- Radix UI + Tailwind CSS for UI
- Vitest for testing

The app provides both scientifically accurate ("Reality" mode) and game-inspired ("Star Citizen" mode) universe simulations, as well as an interactive 3D model viewer ("Celestial Viewer"). These apps are all designed to be be independent of one another, using the celestial rendering engine as a dependency, and the celestial rendering engine should have no tight coupling with the other apps.

## Mandatory Rules

1. Fully research the task before making any changes.
2. Understand all data flows, causes, and effects.
3. Plan thoroughly before taking action.
4. Make small, confident, low-risk changes.
5. Use TDD for tests (red, green, refactor).
6. Write clean, SOLID, DRY, testable code.
7. Check README.md or search through the /docs folder when unsure.

## Guidelines

1. Comment frequently, especially if there are downstream considerations or serious side-effects
2. The __tests__ folder for vitest tests in each root directory for files being tested in that folder
3. If we ever update a file, update or create the appropriate test file to capture the change in functionality

## Essential Commands

```bash
# Testing is with vitest, NOT jest
npm test -- --run --reporter=summary
npm test -- engine/components/system-viewer/ (example)
npm test -- engine/components/system-viewer/hooks/__tests__/use-object-selection.test.ts (example)
```

## Architecture Overview

### Key Architectural Patterns

1. **Object Factory Pattern**: All celestial objects created via `engine/object-factory.tsx`
   - Single entry point for object creation
   - Automatic renderer selection based on catalog data
   - Handles fallback rendering
   - Maintains consistent interface
2. **Renderer Organization**: `/engine/renderers/[type]/[object]-renderer.tsx`
   - Separation by object type (stars, planets, moons, etc.)
   - Consistent structure: Renderer → Materials → Effects
   - Standard naming conventions
3. **No Global Post-Processing**: All effects at material/object level for performance
   - No screen-space effects (bloom, chromatic aberration, DOF, vignette)
   - Object-level effects only (coronas, atmospheres, particles)
   - Material-based visual enhancements
4. **Mode System**: Seamless switching between Reality and Star Citizen modes
   - Educational content with real astronomical data
   - Game-inspired simulation with lore-accurate systems
5. **View Modes**: 
   - **Explorational**: Astronomical distances modified for human interpretation
   - **Navigational**: Equidistant orbital paths in 3D for easier navigation
   - **Profile**: Top-down diagrammatic view with orthographic projection (future)
   - **Scientific**: True-to-life scale of all celestial objects with accurate astronomical distances

### Important Interfaces

```typescript
// All renderers must implement
interface RendererProps {
  catalogData: CatalogObject
  position?: [number, number, number]
  scale?: number
  onFocus?: (object: THREE.Object3D, name: string) => void
}
```

### Testing Strategy
- Unit tests alongside source files (`__tests__` directories)
- Integration tests in `__tests__/suites/`
- Use `describe.concurrent` for independent tests
- Mock Three.js objects when needed

### Performance Guidelines
- Distance-based detail levels
- View-specific asset loading
- Automatic quality scaling
- No full-screen post-processing effects

### Error Handling
- Custom error hierarchy in `/engine/types/errors.ts`
- Centralized error reporting via `ErrorReporter` service
- React Error Boundaries for graceful UI fallbacks
- Comprehensive validation framework in `engine/validation/`
- Enhanced error recovery with intelligent retry mechanisms
- Offline error queue with retry logic

## Renderer Standards

### File Naming Conventions
- Renderers: `[object-type]-renderer.tsx`
- Materials: `[purpose]-material.ts`
- Effects: `[effect-name].tsx`

### Material Uniforms
Standard uniforms for all materials:
- `time: number` - Animation timing
- `intensity: number` - Effect intensity
- Color uniforms as `THREE.Color` objects

### External Libraries
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Helper components for R3F
- `three` - 3D graphics library
- Next.js 15 + React 19 with TypeScript
- Radix UI + Tailwind CSS for UI