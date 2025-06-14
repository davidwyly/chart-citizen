# Planet Renderers Context

This directory contains specialized renderers for different types of planets and celestial bodies.

## Files

- `terrestrial-planet-renderer.tsx`: Advanced shader-based renderer for Earth-like rocky planets with procedural terrain, oceans, clouds, and dynamic lighting from passed star positions
- `gas-giant-renderer.tsx`: Specialized renderer for Jupiter-like gas giants with atmospheric bands, storm systems, and ring support
- `planet-renderer.tsx`: General-purpose planet renderer using standard Three.js materials for basic planetary objects
- `planet-rings-renderer.tsx`: Dedicated renderer for planetary ring systems with procedural density variation and realistic lighting

## Subdirectories

- `materials/`: Shader materials specific to planet rendering
- `effects/`: Visual effects components for atmospheric and surface phenomena

## Rendering Approach

Each renderer is optimized for specific planet types:
- **Terrestrial**: Custom shaders for realistic surface features and atmospheric effects
- **Gas Giant**: Procedural atmospheric bands and storm systems
- **Basic**: Standard materials for simple planetary objects
- **Rings**: Specialized ring geometry with dust and gap simulation

All renderers support dynamic lighting from star positions passed through the component hierarchy for realistic illumination. 