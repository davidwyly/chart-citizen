# Planet Renderers Context

This directory contains specialized renderers for different types of planets and celestial bodies.

## Files

- `terrestrial-planet-renderer.tsx`: Advanced shader-based renderer for Earth-like rocky planets with procedural terrain, oceans, clouds, and dynamic lighting from passed star positions
- `habitable-planet-renderer.tsx`: Specialized renderer for habitable worlds with quality-based features (land/ocean, atmosphere/clouds, night lights) and customizable habitability parameters (humidity, temperature, population)
- `gas-giant-renderer.tsx`: Specialized renderer for Jupiter-like gas giants with atmospheric bands, storm systems, and ring support
- `planet-renderer.tsx`: General-purpose planet renderer using standard Three.js materials for basic planetary objects
- `planet-rings-renderer.tsx`: Dedicated renderer for planetary ring systems with procedural density variation and realistic lighting
- `habitable-planet-material.ts`: This file defines the shader material for habitable planets, including procedural terrain, biomes with sharpened sea-land edges and increased temperature/humidity variation, geographical humidity adjustments, clouds, temperature-based ice cap formation, and natural diffuse lighting without ambient light, improving visual realism.

## Subdirectories

- `materials/`: Shader materials specific to planet rendering
- `effects/`: Visual effects components for atmospheric and surface phenomena

## Rendering Approach

Each renderer is optimized for specific planet types:
- **Habitable**: Advanced procedural shader with quality levels (low: land/ocean, medium: +clouds, high: +night lights) and habitability parameters (humidity 0-100, temperature 0-100, population 0-100)
- **Terrestrial**: Custom shaders for realistic surface features and atmospheric effects
- **Gas Giant**: Procedural atmospheric bands and storm systems
- **Basic**: Standard materials for simple planetary objects
- **Rings**: Specialized ring geometry with dust and gap simulation

All renderers support dynamic lighting from star positions passed through the component hierarchy for realistic illumination. 