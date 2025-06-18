# Skybox Directory Context

- **starfield-material.ts**: Shader material that generates procedural starfield backgrounds with galactic structure.
- **starfield-skybox.tsx**: Skybox component that renders the background starfield environment.

# Starfield Skybox Context

## Overview
The starfield skybox provides a realistic 3D space background with stars, Milky Way structure, and atmospheric effects for the Chart Citizen space viewer.

## Components

### StarfieldSkybox
- **Purpose**: Renders a 360-degree starfield background with realistic astronomical features
- **Features**:
  - Procedural star generation with twinkling effects
  - Milky Way galactic band with wispy structure and realistic colors
  - Gas clouds and dust lanes for depth
  - **NEW: Multi-colored nebula effects throughout the skybox**
- **Props**:
  - `nebulaIntensity` (optional, default 0.5): Controls the visibility/brightness of nebula effects

### StarfieldMaterial
- **Purpose**: Custom WebGL shader material for rendering the starfield
- **Shader Features**:
  - Procedural noise-based star field generation
  - Realistic Milky Way structure with multiple color regions
  - Time-based twinkling animation
  - **NEW: Advanced nebula generation with multiple colors and patterns**

## Nebula Effects (New Feature)

### Colors Available
- **Blue Nebula**: Blue emission nebula (typical of young, hot stars)
- **Purple/Magenta Nebula**: Purple nebular regions (mixed ionization)
- **Yellow/Orange Nebula**: Star-forming regions (warm dust and gas)
- **Green Nebula**: Oxygen emission lines (planetary nebulae)
- **Red Nebula**: Hydrogen alpha emission (classic red nebulae)

### Nebula Characteristics
- **Multi-scale patterns**: Uses different noise octaves for complex, realistic structures
- **Depth variation**: Farther nebulae appear dimmer for depth perception
- **Subtle animation**: Gentle movement to simulate gas dynamics
- **Wispy translucent areas**: Additional light, colorful regions for variety
- **Natural distribution**: Nebulae appear throughout the sky, not just in galactic plane

### Usage Examples
```tsx
// Subtle nebula for scientific/realistic views
<StarfieldSkybox nebulaIntensity={0.3} />

// Moderate nebula for general viewing
<StarfieldSkybox nebulaIntensity={0.6} />

// Dramatic nebula for cinematic effect
<StarfieldSkybox nebulaIntensity={1.0} />

// No nebula (classic star field only)
<StarfieldSkybox nebulaIntensity={0.0} />
```

## Technical Implementation

### Shader Uniforms
- `iTime`: Animation time for twinkling and subtle nebula movement
- `nebulaIntensity`: Master control for nebula visibility (0.0 = off, 1.0 = maximum)

### Noise Functions
- `fbmDetailed()`: Enhanced fractal Brownian motion for complex nebula structures
- `turbulence()`: Chaotic noise patterns for more realistic gas dynamics
- Multiple noise scales combined for natural-looking cloud formations

### Performance
- All calculations done in fragment shader for GPU acceleration
- Optimized noise functions for real-time performance
- Conditional nebula generation (skipped when intensity = 0)

## Integration Points
- Used in `SystemViewer` with moderate intensity (0.6)
- Used in `CelestialViewer` with subtle intensity (0.4)
- Can be customized per viewing mode or user preference
