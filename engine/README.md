# 🌌 Celestial Rendering Engine Architecture

This document outlines the clear architectural structure for the celestial rendering engine.

## 📁 Directory Structure

\`\`\`
engine/
├── object-factory.tsx          # Main factory for creating celestial objects
├── system-loader.ts            # System data loading and management
├── renderers/                  # All rendering components organized by object type
│   ├── stars/                  # Star rendering system
│   │   ├── star-renderer.tsx   # Main star renderer component
│   │   ├── materials/          # Star-specific shader materials
│   │   │   ├── sun-material.ts
│   │   │   ├── prominence-material.ts
│   │   │   ├── star-corona-material.ts
│   │   │   └── lens-flare-shader.ts
│   │   └── effects/            # Star visual effects
│   │       ├── solar-prominences.tsx
│   │       ├── star-corona.tsx
│   │       └── procedural-lens-flare.tsx
│   ├── planets/                # Planet rendering system
│   │   ├── planet-renderer.tsx     # Basic terrestrial planet renderer
│   │   ├── gas-giant-renderer.tsx  # Specialized gas giant renderer
│   │   ├── materials/              # Planet-specific shader materials
│   │   │   ├── gas-giant-material.ts
│   │   │   └── storm-material.ts
│   │   └── effects/                # Planet visual effects
│   │       └── atmospheric-storms.tsx
│   ├── moons/                  # Moon rendering system (future)
│   ├── belts/                  # Asteroid belt rendering (future)
│   └── stations/               # Space station rendering (future)
└── README.md                   # This file
\`\`\`

## 🎯 Architectural Principles

### 1. **Separation by Object Type**
Each celestial object type has its own dedicated renderer directory:
- `stars/` - All stellar objects (main sequence, red dwarfs, variables, etc.)
- `planets/` - All planetary objects (terrestrial, gas giants, ice worlds, etc.)
- `moons/` - Natural satellites
- `belts/` - Asteroid and debris fields
- `stations/` - Artificial structures

### 2. **Component Hierarchy**
Each object type follows a consistent structure:
- **Renderer**: Main component that orchestrates the object's appearance
- **Materials**: Shader materials specific to that object type
- **Effects**: Visual effects and particle systems

### 3. **Factory Pattern**
The `object-factory.tsx` serves as the single entry point for creating any celestial object:
- Determines appropriate renderer based on catalog data
- Handles fallback rendering for unknown types
- Maintains consistent interface across all object types

### 4. **Material Organization**
Shader materials are organized by object type and purpose:
- **Base Materials**: Core appearance (e.g., `sun-material.ts`)
- **Effect Materials**: Special effects (e.g., `storm-material.ts`)
- **Utility Materials**: Shared utilities (e.g., `lens-flare-shader.ts`)

### 5. **No Global Post-Processing**
The engine deliberately avoids screen-space post-processing passes (e.g., chromatic aberration, bloom). All visual effects are implemented at the material or object level to maintain clarity and performance.

## 🔧 Usage Patterns

### Creating a New Object Type

1. **Create Renderer Directory**:
   \`\`\`
   engine/renderers/[object-type]/
   ├── [object-type]-renderer.tsx
   ├── materials/
   └── effects/
   \`\`\`

2. **Implement Renderer Component**:
   \`\`\`typescript
   export function ObjectTypeRenderer({ catalogData, position, scale, onFocus }) {
     // Renderer implementation
   }
   \`\`\`

3. **Add to Object Factory**:
   \`\`\`typescript
   // In object-factory.tsx
   if (engineObject === "new-object-type") {
     return <ObjectTypeRenderer catalogData={catalogData} ... />
   }
   \`\`\`

### Adding Visual Effects

1. **Create Effect Component**:
   \`\`\`typescript
   // In engine/renderers/[object-type]/effects/
   export function NewEffect({ ... }) {
     // Effect implementation
   }
   \`\`\`

2. **Create Associated Material** (if needed):
   \`\`\`typescript
   // In engine/renderers/[object-type]/materials/
   export const NewEffectMaterial = shaderMaterial(...)
   \`\`\`

3. **Integrate in Renderer**:
   \`\`\`typescript
   // In the main renderer component
   <NewEffect ... />
   \`\`\`

## 🎨 Rendering Pipeline

1. **Object Factory** receives catalog data and determines object type
2. **Specific Renderer** is instantiated based on object type
3. **Materials and Effects** are composed within the renderer
4. **Shader Materials** handle the visual appearance
5. **Effect Components** add dynamic visual elements

## 📋 Standards and Conventions

### File Naming
- Renderers: `[object-type]-renderer.tsx`
- Materials: `[purpose]-material.ts`
- Effects: `[effect-name].tsx`

### Component Props
All renderers must accept:
\`\`\`typescript
interface RendererProps {
  catalogData: CatalogObject
  position?: [number, number, number]
  scale?: number
  onFocus?: (object: THREE.Object3D, name: string) => void
}
\`\`\`

### Material Uniforms
Standard uniforms for all materials:
- `time: number` - Animation time
- `intensity: number` - Effect intensity
- Color uniforms as `THREE.Color` objects

## 🚀 Future Expansions

### Planned Object Types
- **Moons**: Natural satellites with specialized rendering
- **Belts**: Asteroid and debris field systems
- **Stations**: Artificial structures and space stations
- **Anomalies**: Exotic phenomena and special effects

### Planned Features
- **Level of Detail (LOD)**: Distance-based rendering optimization
- **Instancing**: Efficient rendering of multiple similar objects
- **Physics Integration**: Realistic orbital mechanics
- **Lighting Systems**: Advanced stellar illumination models

## 🔗 Dependencies

### External Libraries
- `@react-three/fiber` - React Three.js integration
- `@react-three/drei` - Three.js utilities and helpers
- `three` - Core 3D graphics library

### Internal Dependencies
- `@/lib/system-loader` - System data management
- Shared catalog objects from `/public/data/`

This architecture ensures scalability, maintainability, and clear separation of concerns while providing a consistent interface for all celestial object rendering.
