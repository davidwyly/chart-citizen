# Star Effects Context

This directory contains visual effects specific to stars, enhancing their appearance and realism.

## Effect Components

### `star-corona.tsx`
- Renders the star's corona (outer atmosphere)
- Uses a 2D sprite with custom shader
- Positioned in front of the star to prevent z-fighting
- Scales based on star size and distance
- Includes animation for dynamic appearance

### `solar-prominences.tsx`
- Renders solar prominences (plasma loops)
- Uses particle systems for dynamic movement
- Animated based on star properties
- Includes color variations based on temperature

## Implementation Guidelines

1. Effects should be positioned correctly relative to the star
2. Use appropriate scaling based on view mode
3. Optimize performance for multiple instances
4. Handle distance-based LOD (Level of Detail)
5. Maintain consistent visual style

## Performance Considerations

1. Use instancing for multiple stars
2. Implement distance-based culling
3. Optimize shader calculations
4. Use appropriate texture sizes
5. Consider view mode when calculating effects 