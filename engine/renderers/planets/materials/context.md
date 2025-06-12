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