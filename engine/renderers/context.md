# Engine Renderers Context

This directory contains the core rendering components for different types of celestial objects.

## Renderer Types

### Stars (`stars/`)
- `star-renderer.tsx`: Main renderer for stars, handling their visual representation
- `effects/`: Visual effects specific to stars (corona, glow, etc.)
- `materials/`: Custom materials and shaders for star rendering

### Planets (`planets/`)
- `planet-renderer.tsx`: Base renderer for all planets
- `gas-giant-renderer.tsx`: Specialized renderer for gas giants
- `terrestrial-planet-renderer.tsx`: Specialized renderer for terrestrial planets
- `materials/`: Custom materials and shaders for planet rendering

## Renderer Organization

1. Each celestial object type has its own directory
2. Renderers are organized by complexity and specialization
3. Shared materials and effects are in their respective directories
4. Each renderer type has its own test suite

## Development Guidelines

1. Keep rendering logic separate from component logic
2. Use appropriate materials and shaders for each object type
3. Follow Three.js best practices for performance
4. Document shader code thoroughly
5. Maintain clear separation between different renderer types
6. Keep effects and materials modular and reusable 