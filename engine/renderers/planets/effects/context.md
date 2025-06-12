# Planet Effects Context

This directory contains visual effects specific to planets, enhancing their appearance and realism.

## Effect Components

### `atmospheric-storms.tsx`
- Renders atmospheric storm systems on planets
- Uses custom shader for dynamic cloud movement
- Supports different storm types (cyclones, bands, etc.)
- Animated based on planet rotation and storm properties
- Includes color variations based on atmospheric composition

## Implementation Guidelines

1. Effects should respect planet rotation and scale
2. Use appropriate atmospheric models
3. Handle different planet types (gas giants vs terrestrial)
4. Support view mode-specific scaling
5. Maintain performance with multiple instances

## Performance Considerations

1. Use instancing for similar effects
2. Implement distance-based LOD
3. Optimize shader calculations
4. Use appropriate texture resolutions
5. Consider atmospheric density in calculations

## Future Effects

1. Volcanic activity for terrestrial planets
2. Aurora effects for planets with magnetic fields
3. Atmospheric scattering and refraction
4. Cloud layer dynamics
5. Weather system visualization 