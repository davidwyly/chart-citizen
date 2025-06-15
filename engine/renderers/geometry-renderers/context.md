# Geometry Renderers Context

This directory contains specialized renderers for each geometry type defined in the orbital system JSON specification.

## Files

- `types.ts`: Common TypeScript interfaces and types for all geometry renderers
- `geometry-renderer-factory.tsx`: Main factory component that routes to appropriate geometry-specific renderers based on object.geometry_type
- `index.ts`: Export barrel for all geometry renderers and types

## Geometry-Specific Renderers

- `terrestrial-renderer.tsx`: Earth-like planets with atmospheres, oceans, clouds, night lights, and ring support
- `rocky-renderer.tsx`: Moons and Mercury-like bodies with cratered surfaces, basic materials, and optional ring support  
- `gas-giant-renderer.tsx`: Jupiter-like planets with atmospheric bands, storm systems, and prominent ring systems
- `star-renderer.tsx`: Stellar bodies with emissive materials, corona effects, color temperature, and variable brightness
- `compact-renderer.tsx`: Neutron stars and black holes with accretion disks and gravitational effects
- `ring-renderer.tsx`: Standalone ring systems (not attached to planets)
- `belt-renderer.tsx`: Asteroid and Kuiper belts with torus geometry and particle density variation

## Ring Support

Renderers that support ring attachment:
- **TerrestrialRenderer**: supportsRings = true  
- **RockyRenderer**: supportsRings = true (rare but possible for large moons)
- **GasGiantRenderer**: supportsRings = true (most common)

Renderers that don't support rings:
- **StarRenderer**: supportsRings = false
- **CompactRenderer**: supportsRings = false  
- **RingRenderer**: supportsRings = false (is the ring itself)
- **BeltRenderer**: supportsRings = false (is already a debris field)

## Ring Attachment System

Rings are attached by reading the `rings` array property from CelestialObject and rendering PlanetRingsRenderer components for each ring definition. Ring properties like density, composition, radius, and opacity are mapped from the orbital system JSON spec to renderer parameters.

## Orbital System JSON Mapping

Each renderer extracts properties from the unified `properties` object:
- Physical properties: mass, radius, temperature, rotation_period, axial_tilt
- Visual properties: specific to geometry type (water, tectonics for terrestrial; band_contrast for gas giants; etc.)
- Ring properties: ring_density, ring_opacity, ring_color for supported renderers 