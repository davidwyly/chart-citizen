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

## Essential Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm dev:realistic          # Dev server in realistic mode
pnpm dev:star-citizen       # Dev server in Star Citizen mode

# Testing
pnpm test                   # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm test:engine           # Test engine only
pnpm test:modes            # Test mode system
pnpm test:ui               # Test UI components
pnpm test:view-modes       # Test view mode functionality
pnpm test:shaders          # Test shader compilation
pnpm test:camera           # Test camera systems
pnpm test:data             # Test data integrity
pnpm test:objects          # Test object creation
pnpm test:setup            # Test setup configurations
pnpm test:features         # Test feature integrations
pnpm test:coverage         # Run tests with coverage
pnpm test:profile          # Run profiling tests
pnpm vitest run [file]     # Run specific test file

# Code Quality
pnpm lint                  # Run ESLint
pnpm type-check           # Check TypeScript types
pnpm build                # Production build
pnpm start                 # Start production server
```

## Architecture Overview

### Directory Structure
- `/app` - Next.js 13+ App Router pages and routing
  - `[mode]/` - Dynamic mode routing (realistic, star-citizen)
  - `viewer/` - Celestial viewer pages
  - `test-*/` - Development test pages
- `/engine` - Celestial Rendering Engine (all 3D logic)
  - `object-factory.tsx` - Factory for creating celestial objects
  - `system-loader.ts` - System data loading and management
  - `renderers/` - Type-specific renderers organized by object type
    - `stars/` - Star rendering system with materials and effects
    - `planets/` - Planet rendering including gas giants
    - `moons/` - Moon rendering (future)
    - `belts/` - Asteroid belt rendering (future)
    - `stations/` - Space station rendering (future)
  - `components/` - 3D React components
    - `celestial-viewer/` - Individual object viewer
    - `system-viewer/` - System view components
    - `debug-panel.tsx` - Debug information display
    - `performance-warning.tsx` - Performance alerts
  - `core/` - Core systems (mode, camera, state)
  - `factories/` - Object factory patterns
  - `utils/` - Engine utilities and calculations
  - `types/` - Engine type definitions
- `/components` - Shared React UI components
  - `ui/` - UI elements (buttons, modals, toasts)
  - `starmap/` - Interactive starmap feature
  - `system-viewer.tsx` - Main celestial system view
- `/lib` - Framework-agnostic utilities
  - `types/` - Shared TypeScript types
- `/public/data` - Universe data organized by mode
  - `realistic/` - Real astronomical data
  - `star-citizen/` - Game-inspired data
  - `shared/` - Common data across modes
- `/hooks` - Shared React hooks
- `/docs` - Architecture & feature documentation
- `/__tests__` - Integration tests
- `/styles` - Global styles and design system

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

## Prerequisites & Dependencies

### System Requirements
- Node.js 18+ and pnpm (recommended)

### External Libraries
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Helper components for R3F
- `three` - 3D graphics library
- Next.js 15 + React 19 with TypeScript
- Radix UI + Tailwind CSS for UI

## Future Expansions

### Planned Object Types
- Moons (full rendering system)
- Asteroid Belts
- Space Stations
- Anomalies

### Planned Features
- Level of Detail (LOD) system
- Instancing for performance
- Physics Integration
- Advanced Lighting Systems