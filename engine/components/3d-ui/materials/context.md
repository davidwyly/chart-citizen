# 3D Materials Context

This directory contains custom Three.js shader materials for 3D objects.

## Shader Materials

### `terrestrial-planet-material.ts`
- Custom shader material for terrestrial planets with surface textures and atmospheric effects

### `black-hole-material.ts`
- Basic black hole material for simple black hole rendering (legacy)

### `smog-planet-material.ts`
- Shader material for planets with atmospheric smog and pollution effects

### `space-curvature-material.ts`
- Material for visualizing space-time curvature effects around massive objects

## Implementation Guidelines

1. All materials extend THREE.ShaderMaterial
2. Include proper uniform management
3. Handle texture loading and disposal
4. Support customization parameters
5. Implement proper cleanup methods 