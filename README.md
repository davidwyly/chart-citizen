# 🪐 Chart Citizen – Interactive Celestial System Explorer

Chart Citizen is an interactive web application for exploring and visualizing celestial systems in 3D. Built with **Next.js 14**, **React Three Fiber**, and a custom **Celestial Rendering Engine**, it provides scientifically accurate and game-inspired universe simulations.

## 🗂️ Project Structure

```text
chart-citizen/
├── app/                    # Next.js 13+ App Router (pages, layouts, routes)
│   ├── [mode]/            # Dynamic mode routing (realistic, star-citizen)
│   │   ├── realistic/     # Realistic universe simulation mode
│   │   └── star-citizen/  # Star Citizen game-inspired mode  
│   ├── viewer/            # Object viewer pages
│   ├── test-*/            # Development test pages
│   └── layout.tsx         # Root application layout
├── engine/                # Celestial Rendering Engine
│   ├── components/        # 3D React components & system viewers
│   ├── renderers/         # Object-specific renderers (stars, planets, etc.)
│   ├── core/              # Core engine systems (mode system, loaders)
│   ├── factories/         # Object factory patterns
│   ├── utils/             # Engine utilities and calculations
│   └── types/             # Engine type definitions
├── components/            # Shared React UI components
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
- **Component-Based**: React Three Fiber components for 3D objects and systems
- **Renderer Pattern**: Specialized renderers for different celestial object types
- **Mode System**: Intelligent switching between realistic and game-inspired simulations
- **Performance Optimized**: Quality scaling and performance monitoring built-in

### **3. Presentation Layer (`components/`, `hooks/`)**
- **Reusable Components**: UI components that work across different modes
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
```typescript
type ViewMode = 'realistic' | 'navigational' | 'profile'
type EffectsLevel = 'low' | 'medium' | 'high'
```

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
- `/viewer/[objectType]` - Individual object viewer

## 📁 Adding New Features

### **New Celestial Object Type**
1. Create `engine/renderers/[object-type]/` directory
2. Implement renderer component with proper TypeScript types
3. Add to `engine/object-factory.tsx` registry
4. Add catalog data to `public/data/shared/object-catalog/`
5. Write tests in `engine/renderers/[object-type]/__tests__/`

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