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

## Dev Lifecyle

You MUST explicitly follow the dev lifecycle found within `/DEV-LIFECYCLE.md`
If you're uncertain about what to do, ASK.

## Guidelines

1. Comment frequently, especially if there are downstream considerations or serious side-effects
2. The __tests__ folder for vitest tests in each root directory for files being tested in that folder
3. If we ever update a file, update or create the appropriate test file to capture the change in functionality
4. Remove all legacy code, duplicated code, or legacy code fallbacks and run tests to confirm afterwards
5. DO NOT RUN `npm run dev` as it just starts a server that waits for browser connections, you can't
  test the browser hot reload behavior from this CLI environment.

## Essential Commands

```bash
# Testing (vitest) - Due to large test suite (190+ files), run specific tests instead of all
npm run lint
# Run specific test files or folders instead of global test suite
npm test -- --run --watch=false engine/path/to/specific/folder
npm test -- --run --watch=false engine/path/to/specific/test.ts
# Examples of focused testing:
npm test -- --run --watch=false engine/renderers
npm test -- --watch=false engine/components/system-viewer
npm test -- --run --watch=false engine/utils/__tests__/orbital-mechanics
# Only run full suite if absolutely necessary (may timeout):
# npm test -- --run --watch=false

# AI Development Workflow - Context-Preserving Development

## Quick Context Loading (ALWAYS START HERE)
cat AI-CONTEXT.md                     # Quick architectural reference (30 seconds)
cat analysis-results/project-status.md # Current health status

## Daily Development Workflow  
npm run ai-toolkit impact "target"    # Before changing specific files
npm run ai-toolkit context "symbol"   # Before component/function changes
npm run ai-toolkit imports project    # Run a quick check for broken imports
npm run ai-toolkit dead-code          # Identify unused files or duplicates
npm run ai-toolkit schema "file:type" # Extract a specific type or interface

## Comprehensive Analysis (Before Major Changes)
npm run ai-toolkit full-analysis      # Full project health assessment and recommendations
npm run ai-toolkit deps               # Analyze project dependencies for issues

## Architecture Overview

### Key Architectural Patterns

1. **Rendering Pipeline**: `ViewModeStrategy → VisualSizeCalculator → ObjectFactory → Renderer`
   - ViewModeStrategy calculates object scaling based on scientific/visual requirements
   - VisualSizeCalculator applies view-specific scaling and constraints
   - ObjectFactory selects appropriate renderer based on catalog data
   - Renderer implements standardized RendererProps interface
   
2. **Standard Renderer Interface**: All renderers implement `RendererProps` from `engine/renderers/renderer-props.ts`
   - Base: `RendererProps` (catalogData, position, scale, onFocus)
   - Extended: `InteractiveRendererProps` (adds onHover, onSelect)
   - Extended: `ShaderRendererProps` (adds shaderScale, effectIntensity)
   - Extended: `SystemRendererProps` (full system context with interactions)

3. **Object Factory Pattern**: All celestial objects created via `engine/object-factory.tsx`
   - Single entry point for object creation
   - Automatic renderer selection based on catalog data
   - Handles fallback rendering
   - Uses standardized interfaces throughout

4. **Renderer Organization**: `/engine/renderers/[type]/[object]-renderer.tsx`
   - Separation by object type (stars, planets, moons, etc.)
   - Consistent structure: Renderer → Materials → Effects
   - Standard naming conventions

5. **Scientific Scaling**: Real astronomical data via `AstronomicalScalingService`
   - Earth-based reference scaling (1.0 unit radius, 100 units orbit)
   - True proportional relationships (Mars = 0.532x Earth, Jupiter = 10.97x Earth)
   - Intelligent logarithmic scaling for extreme sizes (Sun = 109x Earth)
   - Replaces legacy hardcoded scaling factors with real astronomical constants

6. **No Global Post-Processing**: All effects at material/object level for performance
   - No screen-space effects (bloom, chromatic aberration, DOF, vignette)
   - Object-level effects only (coronas, atmospheres, particles)
   - Material-based visual enhancements

7. **Mode System**: Seamless switching between Reality and Star Citizen modes
   - Educational content with real astronomical data
   - Game-inspired simulation with lore-accurate systems

8. **View Modes**: 
   - **Explorational**: Astronomical distances modified for human interpretation
   - **Navigational**: Equidistant orbital paths in 3D for easier navigation
   - **Profile**: Top-down diagrammatic view with orthographic projection (future)
   - **Scientific**: True-to-life scale of all celestial objects with accurate astronomical distances

### Important Interfaces

```typescript
// Standard renderer interface from engine/renderers/renderer-props.ts
interface RendererProps {
  readonly catalogData: CatalogObject;
  readonly position?: [number, number, number];
  readonly scale?: number;
  readonly onFocus?: (object: THREE.Object3D, name: string) => void;
}

// Extended interfaces for specific needs
interface InteractiveRendererProps extends RendererProps {
  readonly onHover?: (objectId: string | null) => void;
  readonly onSelect?: (objectId: string, object: THREE.Object3D, name: string) => void;
}

interface ShaderRendererProps extends RendererProps {
  readonly shaderScale?: number;
  readonly effectIntensity?: number;
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

## AI Workflow Toolkit 🚀

A comprehensive suite of AI-optimized code analysis tools designed to maximize efficiency and minimize token usage for complex development tasks. This toolkit provides sharp, composable primitives that allow for deep, structural understanding of the codebase.

**💡 Prioritization Note for Claude:** When performing any task, **always prioritize the use of these AI Workflow Toolkit commands** before resorting to manual file reads or other exploration methods. These tools are specifically designed to provide you with highly distilled, token-efficient context, which is crucial for effective and cost-efficient problem-solving.

### Core Usage:
All tools are run through the main `ai-toolkit` script:
```bash
npm run ai-toolkit -- <command> [arguments...] [--verbose]
```

By default, the toolkit only prints essential, machine-readable output (e.g., compact JSON). The optional `--verbose` flag can be added to show human-readable status messages during execution.

### Available Commands:

#### 1. `overview`
*   **Purpose:** Provides a high-level orientation of the project's technology stack, architectural patterns, and key statistics. This command is designed to give you a foundational understanding without reading any file content.
*   **Usage:**
    ```bash
    npm run ai-toolkit overview
    ```
*   **Output:** A JSON object detailing `projectType`, `primaryFrameworks`, `keyDirectories`, and `projectStats`.

#### 2. `schema <file-path>:<symbol-name>`
*   **Purpose:** Extracts a single schema (type, interface, class, enum) from a file, providing its exact definition. This is the most efficient way to understand the shape of data without reading an entire file.
*   **Usage:**
    ```bash
    npm run ai-toolkit schema "engine/types/engine.ts:EngineConfig"
    ```

#### 3. `code-search <keyword>`
*   **Purpose:** Efficiently finds all files in the project that contain a specific keyword. It uses `ripgrep` for speed and returns a simple list of file paths.
*   **Usage:**
    ```bash
    npm run ai-toolkit code-search "myFunction"
    ```

#### 4. `imports <subcommand>`
*   **Purpose:** A comprehensive tool for analyzing and fixing import paths.
*   **Subcommands:**
    *   `check <file>`: Validates all imports in a single file.
    *   `fix <old> <new>`: Bulk replaces import patterns across the project.
    *   `project`: Scans the entire project for broken or problematic imports.
*   **Usage:**
    ```bash
    npm run ai-toolkit imports project
    ```

#### 5. `dead-code`
*   **Purpose:** Hunts for unused files, duplicate code, and legacy systems to help with codebase cleanup.
*   **Usage:**
    ```bash
    npm run ai-toolkit dead-code
    ```

#### 6. `impact <target>`
*   **Purpose:** Analyzes the potential "blast radius" of changing a specific file or symbol, showing what other parts of the codebase will be affected.
*   **Usage:**
    ```bash
    npm run ai-toolkit impact "ComponentName"
    ```

#### 7. `context <target>`
*   **Purpose:** Traces the data flow and relationships for a specific symbol to understand where data comes from and where it goes.
*   **Usage:**
    ```bash
    npm run ai-toolkit context "handleSubmit"
    ```

#### 8. `test-gaps`
*   **Purpose:** Identifies parts of the codebase that lack sufficient test coverage, helping to prioritize testing efforts.
*   **Usage:**
    ```bash
    npm run ai-toolkit test-gaps
    ```

#### 9. `diff [comparison]`
*   **Purpose:** Analyzes the changes between two git commits, providing a high-level summary of the complexity and impact without needing to read the full diff.
*   **Usage:**
    ```bash
    npm run ai-toolkit diff HEAD~1
    ```

#### 10. `deps`
*   **Purpose:** Analyzes project dependencies to find unused packages or circular dependencies.
*   **Usage:**
    ```bash
    npm run ai-toolkit deps
    ```