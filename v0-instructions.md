# 🌌 Celestial Simulation (v0) - Multi-Zone Architecture

This project simulates dynamic, procedurally generated 3D star systems within seamless galactic environments using Next.js Multi-Zones. It supports multiple simulation modes with completely isolated data sets while using a shared rendering engine and object catalog.

---

## IMPORTANT RULES

\`\`\`
ONLY CHANGE THE CODE FOR WHAT IS BEING REQUESTED. MAKE YOUR CHANGES MINIMAL AS MUCH AS POSSIBLE. FOLLOW FILE STRUCTURE. DELETE ORPHANED FILES. When generating code DO NOT generate any mock or simulated data. Use the database data or json data if available. If you don't know how to use the data in the database, ask me for guidance. Prioritize conciseness. Aim for the most compact and efficient solution that correctly addresses the problem, minimizing redundant lines, verbose syntax, and unnecessary comments. Assume I understand standard library functions and common programming paradigms. Write the most concise, readable code possible. Prioritize brevity while maintaining clarity. Use short variable names, eliminate unnecessary comments, minimize whitespace, and choose the most direct approach to solve the problem. Favor built-in functions and language idioms over verbose custom implementations. Avoid unnecessary abstractions. Use idiomatic, built-in constructs (e.g., comprehensions, one-liners). Omit boilerplate comments and redundant whitespace unless critical for clarity. Favor expressive, self-documenting names over verbose explanations.
\`\`\`

---

## 🚀 Project Overview

- **Multi-Zone Architecture**: Each universe mode is a separate Next.js app/zone [^1][^2][^3]
- **Shared Engine**: All zones use the same rendering engine and object catalog
- **Isolated Data**: Each mode has its own data directory and system definitions
- **Clean Separation**: Mode-specific apps with shared engine components
- **URL-Based Routing**: `/realistic` and `/star-citizen` routes for different modes

---

## 🏗️ Multi-Zone Architecture

The project uses Next.js Multi-Zones to create separate applications that share the same domain [^1][^2][^3]:

- `/realistic/*` - Scientific universe with real astronomical data
- `/star-citizen/*` - Game-inspired universe with lore-accurate systems

Each zone is a complete Next.js application with its own:
- Page components and UI
- Data loading logic
- System definitions

While sharing:
- The core rendering engine
- 3D components and shaders
- Object catalog definitions

---

## 🗺️ Project Structure

### 📁 Multi-Zone App Structure

\`\`\`
/
├── app/
│   ├── [mode]/
│   │   └── page.tsx       # Dynamic route handler for modes
│   ├── page.tsx           # Root page (redirects to default mode)
│   └── not-found.tsx      # 404 handler for invalid modes
├── apps/
│   ├── realistic/
│   │   └── realistic-app.tsx  # Realistic mode app component
│   └── star-citizen/
│       └── star-citizen-app.tsx  # Star Citizen mode app component
├── components/
│   ├── orbital-path.tsx
│   └── system-viewer.tsx
├── engine/
│   ├── object-factory.tsx # Factory for creating celestial objects
│   ├── system-loader.ts   # System data loading logic
│   └── renderers/         # Organized rendering system
│       ├── stars/         # Star rendering components
│       │   ├── star-renderer.tsx
│       │   ├── materials/ # Star-specific shader materials
│       │   └── effects/   # Star visual effects
│       └── planets/       # Planet rendering components
├── lib/
│   ├── system-loader.ts   # Mode-aware system loading
│   └── planet-customizer.ts
└── public/
    └── data/
        ├── engine/
        │   └── object-catalog/  # Shared object definitions
        ├── realistic/
        │   ├── starmap-systems.json
        │   └── systems/         # Realistic system definitions
        └── star-citizen/
            ├── starmap-systems.json
            └── systems/         # Star Citizen system definitions
\`\`\`

---

## 🔄 Multi-Zone Routing

### URL-Based Mode Selection

- `/realistic` - Scientific universe (default)
- `/star-citizen` - Game-inspired universe
- Root path (`/`) redirects to the default mode

### Navigation Between Zones

- Links between zones use regular `<a>` tags instead of Next.js `<Link>` [^1][^3]
- Each zone handles its own routing independently
- Hard navigation occurs when switching between zones

---

## 🧱 Data Contracts

### **🚨 CRITICAL RULE: Shared Catalog Must Be Generic**

**The shared object catalog MUST contain only generic, universal object types that can be used across ALL simulation modes. NO mode-specific references, names, or lore should appear in the shared catalog.**

**✅ Correct Examples:**
- `industrial-world` (generic)
- `habitable-gas-giant` (generic)
- `ice-world` (generic)
- `volcanic-world` (generic)

**❌ Incorrect Examples:**
- `hurston-type` (Star Citizen-specific)
- `federation-cruiser` (Star Trek-specific)
- `imperial-destroyer` (Star Wars-specific)

### Shared Object Catalog

All object types are defined once in `/data/shared/object-catalog/` and can be referenced by any mode:

\`\`\`json
{
  "g2v-main-sequence": {
    "id": "g2v-main-sequence",
    "name": "G2V Main Sequence Star",
    "mass": 1.0,
    "radius": 1.0,
    "render": {
      "shader": "star_surface_glow",
      "coreColor": "#ffaa44",
      "rotation_rate": 0.00023
    }
  }
}
\`\`\`

### Mode-Specific Starmaps

Each mode has its own `starmap-systems.json` with universe-appropriate content:

**Realistic Mode:**
- Real astronomical coordinates
- Scientific naming conventions
- Educational descriptions

**Star Citizen Mode:**
- Lore-accurate system layouts
- Corporate affiliations
- In-universe terminology

### System Definitions

Systems reference shared catalog objects but define mode-specific layouts:

\`\`\`json
{
  "stars": [
    {
      "id": "sol-star",
      "catalog_ref": "g2v-main-sequence",
      "name": "Sol"
    }
  ]
}
\`\`\`

---

## 🖼️ Universal Rendering System

- **Shared Object Catalog**: All object types defined once
- **Mode-Agnostic Rendering**: Same objects work in any universe
- **Consistent Quality**: Unified visual standards across modes
- **Extensible**: Easy to add new object types for all modes

---

## 🧭 Simulation Logic (Mode-Agnostic)

- Binary stars orbit shared **barycenter**
- Planets orbit that barycenter (not individual stars)
- Moons orbit planets with realistic physics
- Lighting comes from each star based on spectral data
- Systems include **jump points** for inter-system travel
- Collision detection prevents orbital overlap
- **Universal Physics**: Same orbital mechanics across all modes

---

## 🎨 Rendering Engine Architecture

### **Hierarchical Object Rendering**

The rendering system is organized by celestial object type with consistent patterns:

#### **Object Factory Pattern**
- `engine/object-factory.tsx` - Single entry point for all celestial objects
- Determines appropriate renderer based on catalog `engine_object` or `category`
- Handles fallback rendering for unknown types
- Maintains consistent interface: `{ catalogData, position, scale, onFocus }`

#### **Component Hierarchy Standards**
Each object type follows the same pattern:
- **Main Renderer** - Orchestrates object appearance and behavior
- **Materials/** - Shader materials specific to that object type
- **Effects/** - Visual effects and particle systems

#### **Shader Material Standards**
All materials include standard uniforms:
- `time: number` - Animation time for dynamic effects
- `intensity: number` - Effect intensity control
- Color uniforms as `THREE.Color` objects
- Object-specific parameters (e.g., `stormIntensity`, `bandCount`)

#### **Extensibility**
Adding new object types:
1. Create `engine/renderers/[object-type]/` directory
2. Implement `[object-type]-renderer.tsx` with standard props
3. Add materials and effects as needed
4. Register in `object-factory.tsx`

---

## ✨ Expandability

### Adding New Modes (Zones)
1. Create a new directory in `/apps/[new-mode]/`
2. Create a new mode-specific app component
3. Add the mode to the valid modes list in `app/[mode]/page.tsx`
4. Create `public/data/[new-mode]/` directory with starmap and systems
5. Reference existing shared catalog objects (NO mode-specific objects!)

### Adding New Object Types
1. Edit `public/data/engine/object-catalog/[category].json`
2. Define rendering properties and physics using GENERIC names only
3. Create `engine/renderers/[object-type]/` directory structure
4. Implement renderer with standard props interface
5. Add to `object-factory.tsx` routing logic
6. Object becomes available to all modes instantly

### Adding New Rendering Effects
1. Create effect component in `engine/renderers/[object-type]/effects/`
2. Create associated material in `engine/renderers/[object-type]/materials/`
3. Integrate effect in main renderer component
4. Add catalog properties to control effect parameters

### Adding New Systems
1. Create `public/data/[mode]/systems/[id].json`
2. Reference objects from shared `object-catalog/*.json`
3. Define positions, orbits, and relationships
4. System loads automatically when selected

---

## 📌 Example Workflow

1. **Navigate to Mode**: Visit `/realistic` or `/star-citizen`
2. **Create System**: Add `public/data/star-citizen/systems/terra.json`
3. **Reference Catalog**: Use GENERIC objects from `shared/object-catalog/*.json`
4. **Define Relationships**: Set up orbits, jump points, and lighting
5. **Auto-Render**: Engine loads and renders dynamically

---

## 🔄 Lazy Loading Architecture

### Mode-Aware Loading

- Each zone only loads its own starmap initially
- System data fetched on-demand per mode
- **Shared catalog cached globally** (no mode prefix needed)
- Background preloading of jump-linked neighbors

### Performance Benefits

- Scales to hundreds of systems per mode
- No initial bundle size impact
- Memory efficient with selective caching
- Fast mode switching with shared catalog persistence

---

## 🧠 Authoring Guidelines

### Universal Standards (Shared Catalog)

- **MUST use generic names only** (no franchise-specific references)
- Use consistent units within object types
- Colors must be valid hex codes
- IDs should be lowercase with dashes
- Follow existing schema patterns
- **One definition works everywhere**

### Mode-Specific Guidelines

**Realistic Mode:**
- Use metric units (km, AU, Earth/solar masses)
- Base on real astronomical data
- Include scientific classifications
- Prioritize educational accuracy

**Star Citizen Mode:**
- Use in-universe measurements
- Follow official lore and naming
- Include corporate affiliations
- Match game visual style
- **Reference generic catalog objects only**

---

## 📍 Next Steps

- [ ] Add more Star Citizen systems (Terra, Pyro, etc.)
- [ ] Implement space station rendering components
- [ ] Add jump tunnel transition effects
- [ ] Create mode-specific UI themes
- [ ] Add system comparison tools
- [ ] Implement bookmark/favorites system
- [ ] Expand shared catalog with more generic object types

---

## 🎯 Usage Examples

### Navigate to Star Citizen Mode

\`\`\`
Visit: /star-citizen
\`\`\`

### Load Specific System

\`\`\`typescript
// In star-citizen-app.tsx
const systemId = "stanton"
\`\`\`
This architecture provides clean separation between educational and entertainment content while maintaining a unified, scalable engine with a shared object catalog that eliminates duplication and ensures consistency across all universes.
