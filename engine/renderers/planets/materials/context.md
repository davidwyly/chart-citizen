# Planet Materials

This directory contains shader materials used for rendering different types of celestial bodies in the Chart-Citizen application.

## Material Types

### TerrestrialPlanetMaterial
- **Purpose**: Renders Earth-like rocky planets with procedural terrain, oceans, and atmospheres
- **Key Features**:
  - Procedural terrain generation using 3D Perlin noise
  - Dynamic ocean rendering with specular highlights
  - Animated cloud layers
  - Night-side city lights
  - Quality level scaling for performance optimization
  - Atmospheric scattering effects
  - Dynamic lighting from actual star positions in the system

### GasGiantMaterial
- **Purpose**: Renders Jupiter-like gas giants with swirling atmospheric bands
- **Key Features**:
  - Banded cloud formations with dynamic movement
  - Great spot storms and smaller turbulent features
  - Atmospheric lighting effects
  - Procedural color variation
  - Animated cloud flows based on latitude

### StormMaterial
- **Purpose**: Creates storm systems for gas giants and other planets
- **Key Features**:
  - Procedural storm patterns
  - Eye and spiral arm generation
  - Support for different storm types (major/minor)
  - Dynamic rotation and turbulence

### PlanetRingsMaterial
- **Purpose**: Renders ring systems around planets like Saturn
- **Key Features**:
  - Procedural ring density variation
  - Multiple ring divisions with gaps
  - Noise-based detail for realistic appearance
  - Dynamic lighting with proper shadows
  - Customizable inner and outer radii

## Implementation Details

Each shader follows a similar structure:
1. **Uniforms**: Parameters that can be adjusted from JavaScript
2. **Vertex Shader**: Handles geometry transformation and passes necessary data to fragment shader
3. **Fragment Shader**: Creates the visual appearance with procedural generation

Most materials support quality scaling to maintain performance across different devices. Higher quality settings enable more noise iterations and detail, while lower quality settings reduce computational complexity.

## Usage Guidelines

When creating a new planet renderer:
1. Select the appropriate material based on the planet type
2. Configure material parameters based on the catalog object properties
3. Update parameters in animation frames for dynamic effects
4. Consider performance implications and use appropriate quality levels

For custom planet types, extend these base materials or create new ones following the established patterns. 

## Files

- `terrestrial-planet-material.ts`: Advanced procedural shader for Earth-like rocky planets with terrain generation, ocean rendering, cloud systems, and night lights
- `gas-giant-material.ts`: Shader material for gas giant atmospheres with procedural band generation and storm systems
- `storm-material.ts`: Specialized material for atmospheric storm effects on gas giants
- `__tests__/shader-compilation.test.tsx`: Comprehensive test suite for validating shader compilation, uniform handling, and GLSL syntax correctness. Note that these tests perform static analysis and do not simulate actual GLSL compilation in a WebGL context, meaning runtime compilation errors will not be caught by these tests.

All materials support dynamic lighting from star positions passed through the component hierarchy for realistic illumination. 

# Context

- terrestrial-planet-material.ts: This file defines the TerrestrialPlanetMaterial shader, which procedurally generates planet surfaces with noisy biome blending, without snow glow or cloud ambient light, darker water near shorelines, city lights as discrete pinpricks for enhanced realism, and dynamic lava flows based on volcanism and temperature. It also handles procedural planet rendering with biomes, effects, and dynamic clouds that cap size at 100°C, turn dark gray, and become more opaque up to 200°C. 