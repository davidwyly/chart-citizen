# 🪐 Chart Citizen – Interactive Celestial System Explorer

Chart Citizen is an interactive web application for exploring and visualizing celestial systems in 3D. Built with **Next.js 14**, **React Three Fiber**, and a custom **Celestial Rendering Engine**, it provides scientifically accurate and game-inspired universe simulations.

## 🗂️ Project Structure

```text
chart-citizen/
├── app/                    # Next.js 13+ App Router (pages, layouts, routes)
│   ├── [mode]/            # Dynamic mode routing (realistic, star-citizen)
│   │   ├── realistic/     # Realistic universe simulation mode
│   │   └── star-citizen/  # Star Citizen game-inspired mode  
│   ├── viewer/            # Celestial viewer pages
│   ├── test-*/            # Development test pages
│   └── layout.tsx         # Root application layout
├── engine/                # Celestial Rendering Engine
│   ├── object-factory.tsx          # Main factory for creating celestial objects
│   ├── system-loader.ts            # System data loading and management
│   ├── renderers/                  # All rendering components organized by object type
│   │   ├── stars/                  # Star rendering system
│   │   │   ├── star-renderer.tsx   # Main star renderer component
│   │   │   ├── materials/          # Star-specific shader materials
│   │   │   │   ├── sun-material.ts
│   │   │   │   ├── prominence-material.ts
│   │   │   │   ├── star-corona-material.ts
│   │   │   │   └── lens-flare-shader.ts
│   │   │   └── effects/            # Star visual effects
│   │   │       ├── solar-prominences.tsx
│   │   │       ├── star-corona.tsx
│   │   │       └── procedural-lens-flare.tsx
│   │   ├── planets/                # Planet rendering system
│   │   │   ├── planet-renderer.tsx     # Basic terrestrial planet renderer
│   │   │   ├── gas-giant-renderer.tsx  # Specialized gas giant renderer
│   │   │   ├── materials/              # Planet-specific shader materials
│   │   │   │   ├── gas-giant-material.ts
│   │   │   │   └── storm-material.ts
│   │   │   └── effects/                # Planet visual effects
│   │   │       └── atmospheric-storms.tsx
│   │   ├── moons/                  # Moon rendering system (future)
│   │   ├── belts/                  # Asteroid belt rendering (future)
│   │   └── stations/               # Space station rendering (future)
│   ├── components/        # 3D React components & system viewers
│   │   ├── celestial-viewer/ # Individual celestial object viewer.
│   │   ├── system-viewer/    # Components related to the system viewer.
│   │   │   └── components/   # System viewer sub-components including orbital-path.
│   │   ├── debug-panel.tsx   # Panel for displaying debug information.
│   │   ├── performance-warning.tsx # Component to display performance-related warnings.
│   │   ├── debug-viewer.tsx  # Provides a debug view for the celestial system.
│   │   ├── catalog-object-wrapper.tsx # Wraps catalog objects for rendering.
│   │   └── theme-provider.tsx # Provides theme context to components.
│   ├── core/              # Core engine systems (mode system, loaders)
│   ├── factories/         # Object factory patterns
│   ├── utils/             # Engine utilities and calculations
│   └── types/             # Engine type definitions
├── components/            # Shared React UI components
│   ├── ui/                # Contains various UI elements such as buttons, modals, and toasts.
│   ├── starmap/           # Components related to the interactive starmap feature.
│   └── system-viewer.tsx  # Renders the main celestial system view, handling camera controls and object interactions.
├── lib/                   # Framework-agnostic utilities
│   └── types/            # Shared TypeScript types & effects-level definitions
├── hooks/                 # Shared React hooks
├── public/               # Static assets (textures, data, models)
│   └── data/             # Universe data (realistic/, star-citizen/, shared/)
├── docs/                 # Architecture & feature documentation
├── __tests__/            # Integration tests
└── styles/               # Global styles and design system
```

## 🌌 Architecture Overview

### **1. Next.js Application Layer (`app/`)**
- **Dynamic Routing**: `/[mode]` routes handle different universe simulations
- **Mode Components**: Self-contained mode views for realistic and Star Citizen universes
- **Proper SSG**: Static generation with metadata optimization per mode

### **2. Celestial Rendering Engine (`engine/`)**
The Celestial Rendering Engine is designed with a clear architectural structure for scalability, maintainability, and clear separation of concerns.

#### **Architectural Principles**
- **Separation by Object Type**: Each celestial object type has its own dedicated renderer directory (`stars/`, `planets/`, `moons/`, `belts/`, `stations/`).
- **Component Hierarchy**: Each object type follows a consistent structure: **Renderer** (main component), **Materials** (shader materials), and **Effects** (visual effects and particle systems).
- **Factory Pattern**: The `object-factory.tsx` serves as the single entry point for creating any celestial object, determining the appropriate renderer based on catalog data, handling fallback rendering, and maintaining a consistent interface.
- **Material Organization**: Shader materials are organized by object type and purpose (Base, Effect, Utility Materials).
- **No Global Post-Processing**: The engine deliberately avoids screen-space post-processing passes (e.g., chromatic aberration, bloom). All visual effects are implemented at the material or object level to maintain clarity and performance.

#### **Rendering Pipeline**
1. **Object Factory** receives catalog data and determines object type.
2. **Specific Renderer** is instantiated based on object type.
3. **Materials and Effects** are composed within the renderer.
4. **Shader Materials** handle the visual appearance.
5. **Effect Components** add dynamic visual elements.

#### **Standards and Conventions**
- **File Naming**:
    - Renderers: `[object-type]-renderer.tsx`
    - Materials: `[purpose]-material.ts`
    - Effects: `[effect-name].tsx`
- **Component Props**: All renderers must accept:
    ```typescript
    interface RendererProps {
      catalogData: CatalogObject
      position?: [number, number, number]
      scale?: number
      onFocus?: (object: THREE.Object3D, name: string) => void
    }
    ```
- **Material Uniforms**: Standard uniforms for all materials: `time: number`, `intensity: number`, Color uniforms as `THREE.Color` objects.

#### **Dependencies**
- **External Libraries**: `@react-three/fiber`, `@react-three/drei`, `three`
- **Internal Dependencies**: `@/lib/system-loader`, Shared catalog objects from `/public/data/`

### **3. Presentation Layer (`components/`, `hooks/`)**
- **Reusable Components**: UI components that work across different modes
    - `system-viewer.tsx`: Renders the main celestial system view, handling camera controls and object interactions.
    - `engine/components/celestial-viewer/celestial-viewer.tsx`: Displays a single celestial object in detail, used for individual object viewing pages.
    - `ui/`: Contains various UI elements such as buttons, modals, and toasts.
    - `starmap/`: Components related to the interactive starmap feature.
- **State Management**: React hooks for managing application state
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

### **4. Shared Utilities (`lib/`)**
- **Type Safety**: Comprehensive TypeScript types for effects and view modes
- **Performance**: Built-in performance monitoring and optimization utilities
- **Pure Functions**: Framework-agnostic utilities for calculations and data processing

## 🎮 Simulation Modes

### **Realistic Mode** (`/realistic`)
- Scientifically accurate astronomical data
- Real-world physics and scaling
- Educational content and scientific information
- Data sourced from astronomical catalogs

### **Star Citizen Mode** (`/star-citizen`)
- Game-inspired universe simulation
- Star Citizen lore-accurate systems
- Gameplay-oriented interface and interactions
- Enhanced visual effects for immersion

## 🚫 Post-Processing Policy

**Full-screen post-processing effects are permanently disabled.**

- ❌ No screen-space effects (bloom, chromatic aberration, depth-of-field, vignette)
- ✅ Object-level effects only (star coronas, atmospheric storms, particle systems)
- ✅ Material-based visual enhancements and per-object shaders
- **Rationale**: Maintains performance and visual clarity across all devices

## 🔧 Key Technical Features

### **🎯 Dynamic View Modes**
- Realistic Mode: Displays star systems considering astronomical distances and size, modified for human interpretation.
- Navigational Mode: Provides equidistant orbital paths in 3D perspective for easier navigation.
- Profile Mode: Top-down diagrammatic view with equidistant orbital paths and orthographic projection, designed for understanding orbital hierarchy and easily drilling down into points of interest (future)

### **🏭 Object Factory Pattern**
```typescript
// Automatic renderer selection based on object type
const renderer = ObjectFactory.createRenderer(catalogObject)
```

### **📊 Performance Monitoring**
- Real-time FPS tracking
- Automatic quality scaling
- Memory usage optimization
- Performance-based feature toggling

### **🚀 Future Expansions**
- **Planned Object Types**: Moons, Belts, Stations, Anomalies
- **Planned Features**: Level of Detail (LOD), Instancing, Physics Integration, Lighting Systems

### **🧪 Testing Infrastructure**
- **Engine Tests**: `engine/__tests__/` - Core rendering and calculation tests
- **Component Tests**: Component-specific test files alongside source
- **Integration Tests**: `__tests__/suites/` - End-to-end feature testing
- **Quality Assurance**: Automated linting and type checking

## 🚀 Getting Started

### **Prerequisites**
```bash
Node.js 18+ and pnpm (recommended)
```

### **Installation & Development**
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### **Available Routes**
- `/` - Landing page
- `/realistic` - Realistic universe simulation
- `/star-citizen` - Star Citizen universe simulation
- `/viewer/[objectType]` - Individual celestial viewer

## 📁 Adding New Features

### **New Celestial Object Type**
1. Create `engine/renderers/[object-type]/` directory
2. Implement renderer component with proper TypeScript types
3. Add to `engine/object-factory.tsx` registry
4. Add catalog data to `public/data/shared/object-catalog/`
5. Write tests in `engine/renderers/[object-type]/__tests__/`

### **Adding Visual Effects**
1. Create Effect Component: In `engine/renderers/[object-type]/effects/`, create `[effect-name].tsx`.
2. Create Associated Material (if needed): In `engine/renderers/[object-type]/materials/`, create `[purpose]-material.ts`.
3. Integrate in Renderer: In the main renderer component, add `<NewEffect ... />`.

### **New UI Component**
1. Create component in appropriate `components/` subdirectory
2. Export from `components/index.ts` if reusable
3. Add context entry to local `context.md`
4. Include tests alongside component file

### **New Mode/Universe**
1. Add mode directory under `app/[mode]/[new-mode]/`
2. Create mode view component
3. Add data files under `public/data/[new-mode]/`
4. Update mode validation in `app/[mode]/page.tsx`
5. Add feature documentation in `docs/features/`

## 🏗️ Architecture Principles

1. **Separation of Concerns**: Clear boundaries between UI, engine, and data layers
2. **Type Safety**: Comprehensive TypeScript coverage with strict configuration
3. **Performance First**: Built-in monitoring and automatic quality scaling
4. **Modular Design**: Component-based architecture for maintainability
5. **Test-Driven**: Tests alongside all features and critical functionality
6. **Documentation**: Living documentation that stays current with code

## 🤝 Contributing

1. **Read Context Files**: Each directory has a `context.md` explaining its purpose
2. **Follow Patterns**: Use existing patterns for file organization and naming
3. **Update Documentation**: Keep `context.md` files current when adding/changing files
4. **Write Tests**: Include tests for new functionality
5. **Type Safety**: Ensure all new code has proper TypeScript types
6. **Performance**: Consider performance impact of new features

---

**🌟 Chart Citizen** - Explore the universe, one star system at a time. 