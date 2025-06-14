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

### HabitablePlanetMaterial
- **Purpose**: Specialized shader for habitable worlds with quality-based features and customizable habitability parameters (humidity, temperature, population) affecting biome distribution, ice caps, mountain ranges, and civilization lighting
- **Key Features**:
  - **Dynamic Water Level System**: Linear humidity-controlled sea level - at 0% humidity water is completely absent, water begins appearing at 1% humidity pooling at lowest points, progressively rising linearly with humidity, at 100% complete water planet coverage with water above highest mountain peaks  
  - **Latitudinal Temperature Variation**: Temperature decreases from equator to poles, creating realistic climate zones with warmer equatorial regions and colder polar areas
  - **Elevation-Based Climate Adjustment**: Temperature and humidity values are modified by elevation (temperature lapse rate, orographic effects) affecting biome selection at different altitudes
  - **25 Discrete Biome Types**: Complete implementation of all terrain types from design document with proper temperature/humidity mapping
  - **Intelligent Population Distribution**: Population concentrates in hospitable temperatures, lower elevations, and near (but not in) water, with no effect on biome colors - purely affects night light distribution
  - **Advanced Mountain Ranges**: Multi-scale terrain generation with minimum natural variation at 0% volcanism, and tectonic plate-based extreme features at 100% volcanism creating isolated mountain ranges and deep valleys
  - **Dynamic Ice Caps**: Temperature-responsive polar ice that grows/shrinks organically with patchy, realistic edges
  - **Elevation-Based Snow Lines**: Mountains show realistic snow coverage that retreats/advances with temperature
  - **Proper Storm Swirls**: Uses existing Spiral logic for realistic cyclone and storm patterns in clouds
  - **Organic Temperature Zones**: Patchy, non-linear climate distribution instead of straight latitude bands
  - **Mountain Depth**: Three-tier elevation system (snow peaks → green mid-elevation → desert/grassland low elevation)
  - **Extreme Climate Handling**: Temperature 0 = ice world, temperature 100 = desert world
  - **High Humidity Storm Systems**: Global cloud coverage with enhanced spiral storm patterns, with improved cloud rendering maintaining white/bright colors regardless of lighting conditions
  - **Dynamic Lava Flows**: Volcanism and temperature-driven procedural lava flows, with animated movement and concentration in lower elevations and cracks.
  - **Debug Topographic Lines**: Optional contour line visualization showing height variation with regular intervals (3 units) and major contours (15 units), displayed as black lines on land and blue lines underwater - automatically disables clouds when enabled for clearer terrain visualization
  - **Multi-octave Perlin noise for terrain, clouds, and population centers
  - Real-time star position-based illumination with day/night terminator

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
- `habitable-planet-material.ts`: Specialized shader for habitable worlds with quality-based features and customizable habitability parameters (humidity, temperature, population) affecting biome distribution, ice caps, and civilization lighting
- `gas-giant-material.ts`: Shader material for gas giant atmospheres with procedural band generation and storm systems
- `storm-material.ts`: Specialized material for atmospheric storm effects on gas giants
- `__tests__/shader-compilation.test.tsx`: Comprehensive test suite for validating shader compilation, uniform handling, and GLSL syntax correctness. Note that these tests perform static analysis and do not simulate actual GLSL compilation in a WebGL context, meaning runtime compilation errors will not be caught by these tests.

All materials support dynamic lighting from star positions passed through the component hierarchy for realistic illumination. 

# Context

- habitable-planet-material.ts: This file defines the HabitablePlanetMaterial shader, which procedurally generates planet surfaces with noisy biome blending, without snow glow or cloud ambient light, darker water near shorelines, city lights as discrete pinpricks for enhanced realism, and dynamic lava flows based on volcanism and temperature. It also handles procedural planet rendering with biomes, effects, and dynamic clouds that cap size at 100°C, turn dark gray, and become more opaque up to 200°C. 