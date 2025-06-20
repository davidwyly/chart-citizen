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
npm test -- --run --watch=false engine/components/system-viewer
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
npm run coordinate-agents --quick     # Weekly architectural health check

## Comprehensive Analysis (Before Major Changes)
npm run coordinate-agents             # Full project health assessment
npm run project-intel --update        # Update architectural intelligence
npm run ai-toolkit full-analysis      # Individual tool deep-dive
```

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

A comprehensive suite of AI-optimized code analysis tools designed to maximize efficiency and minimize token usage for complex development tasks. Essential for refactoring, cleanup, testing, and understanding large codebases.

### Overview

The toolkit provides unified access to 5 specialized analysis tools through a single interface:

```bash
npm run ai-toolkit <command> [options]
```

### Quick Start

```bash
# Show complete help and documentation
npm run ai-toolkit help

# Hunt for dead code and unused files
npm run ai-toolkit dead-code

# Analyze refactoring impact for a component
npm run ai-toolkit impact "ComponentName"

# Trace data flow and relationships
npm run ai-toolkit context "handleSubmit" --flow=both

# Find test coverage gaps
npm run ai-toolkit test-gaps --focus=components

# Analyze git changes efficiently
npm run ai-toolkit diff HEAD~1

# Run comprehensive codebase analysis
npm run ai-toolkit full-analysis
```

### 🏹 Dead Code Hunter

**Purpose**: Find unused files, duplicates, and legacy code  
**Command**: `npm run ai-toolkit dead-code [--no-tests]`

**What it finds**:
- Files with no imports (safe to delete)
- Suspicious files (need manual review)
- Legacy systems with @deprecated markers
- Duplicate files with identical content

**AI Value**: Single command replaces 50+ manual searches (~12x token reduction)

### 🔍 Refactor Impact Analyzer

**Purpose**: Understand the blast radius of code changes  
**Command**: `npm run ai-toolkit impact "ComponentName"`

**What it analyzes**:
- Direct impacts (files that import the target)
- Cascading impacts (files affected by changes)
- Test coverage for the target
- Risk assessment and refactor plan

**AI Value**: Complete refactoring context in one analysis

### 🧬 Context Tracer

**Purpose**: Understand data flow and component relationships  
**Command**: `npm run ai-toolkit context "ComponentName" [options]`

**Options**:
- `--flow=up` - Trace where data comes FROM
- `--flow=down` - Trace where data goes TO
- `--flow=both` - Trace both directions (default)
- `--depth=N` - Maximum depth to trace (default: 4)

**What it traces**:
- Data flow (upstream sources, downstream targets)
- Component relationships (parents, children)
- State management patterns
- Event handling chains
- Prop drilling detection

**AI Value**: Understand complex interactions without manual tracing

### 🧪 Test Gap Analyzer

**Purpose**: Find missing test coverage and testing blind spots  
**Command**: `npm run ai-toolkit test-gaps [--focus=type]`

**Focus types**: `components`, `utils`, `hooks`, `services`, `all`

**What it finds**:
- Untested files with criticality scores
- Missing test types (unit, integration, component)
- Critical gaps (high-risk files without tests)
- Test coverage by file type

**AI Value**: Prioritized testing roadmap with impact assessment

### 📈 Git Diff Analyzer

**Purpose**: Analyze code changes between commits efficiently  
**Command**: `npm run ai-toolkit diff [comparison]`

**Examples**:
- `npm run ai-toolkit diff HEAD~1` - Compare with previous commit
- `npm run ai-toolkit diff main..HEAD` - Compare branch with main
- `npm run ai-toolkit diff abc123..def456` - Compare specific commits

**What it analyzes**:
- Change complexity and file impact assessment
- Critical, high, medium, and low impact changes
- File operations (added, deleted, modified, renamed)
- Change distribution by file type

**AI Value**: Instant change review context without reading full diffs

### 🔬 Full Analysis

**Purpose**: Comprehensive codebase health assessment  
**Command**: `npm run ai-toolkit full-analysis [target]`

**Provides**:
- Codebase health score (0-100)
- Unified recommendations
- Priority action items
- Cross-analysis insights

**AI Value**: Complete picture for major refactoring or cleanup

### Output Structure

All tools generate results in `analysis-results/` folder:

```
analysis-results/
├── ai-toolkit-report.md      # Main unified report
├── ai-toolkit-results.json   # Raw data for programmatic access
├── dead-code-analysis.md     # Detailed dead code findings
├── impact-analysis.md        # Detailed refactor impact
├── context-analysis.md       # Detailed context tracing
└── test-gap-analysis.md      # Detailed test gap analysis
```

### Cleanup

```bash
# Remove all analysis results when done
rm -rf analysis-results
```

### AI Workflow Optimization

**Token Efficiency**:
- **Before**: 50+ tool calls, 25,000+ tokens
- **After**: 1 command, ~2,000 tokens
- **12x reduction** in token usage

**Perfect for AI tasks**:
- Refactoring complex code
- Understanding unfamiliar codebases
- Planning test strategies
- Code cleanup and maintenance
- Architecture analysis

### Advanced Usage

```bash
# Focused dead code analysis (exclude tests)
npm run ai-toolkit dead-code --no-tests

# Context tracing with custom depth
npm run ai-toolkit context "MyHook" --depth=6 --flow=up

# Test gap analysis for specific file types
npm run ai-toolkit test-gaps --focus=services

# Full analysis with specific target
npm run ai-toolkit full-analysis "CriticalComponent"
```

This toolkit is specifically designed to maximize AI efficiency for complex development workflows.