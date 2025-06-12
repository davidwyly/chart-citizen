# Shader Lab Catalog Objects Guide

## Overview

The Shader Lab system allows developers to experiment with different celestial object shaders and their parameters. This system relies on two key components:

1. **Local object definitions** in `components/debug-viewer/object-catalog.ts`
2. **Engine catalog objects** in `public/data/engine/object-catalog/*.json`

For the Shader Lab to work correctly, all objects defined in the local object catalog must have corresponding entries in the engine catalog files.

## Catalog Structure

### Local Object Catalog (object-catalog.ts)

This TypeScript file defines the objects available in the Shader Lab, with default settings for:
- Scale
- Shader scale
- Shader parameters (intensity, speed, distortion, colors)

```typescript
export const objectCatalog: Record<string, ObjectConfig> = {
  'g2v-main-sequence': { ... },
  'm2v-red-dwarf': { ... },
  'smog-planet': { ... },
  // etc.
}
```

### Engine Catalog Files

The engine catalog files in `public/data/engine/object-catalog/` contain the detailed specifications for different types of celestial objects:

- `stars.json` - Star definitions
- `planets.json` - Planet definitions
- `moons.json` - Moon definitions
- `compact-objects.json` - Black holes, neutron stars, etc.
- `belts.json` - Asteroid belts and rings
- `space-stations.json` - Space stations and artificial structures
- `artificial-satellites.json` - Satellites and smaller artificial objects
- `exotic.json` - Exotic phenomena like wormholes

## Validation

A validation script is provided to ensure all objects in the local catalog have corresponding entries in the engine catalog files:

```bash
node scripts/verify-catalog-objects.js
```

This script:
1. Extracts all object keys from `object-catalog.ts`
2. Searches for each key in all catalog JSON files
3. Reports any missing objects

## Common Issues

### Missing Catalog Objects

If you encounter an error like:

```
Error: ❌ Failed to load catalog object: m2v-red-dwarf
```

This means an object defined in the local catalog is missing from the engine catalog files. To fix this:

1. Determine which catalog file should contain the object (e.g., stars, planets, compact-objects)
2. Add the missing object definition to the appropriate file following the schema of similar objects
3. Run the validation script to confirm the fix

### Schema Reference

Each object type follows a specific schema. Here are the key schemas:

#### Stars
```json
{
  "id": "star-id",
  "name": "Star Name",
  "category": "main_sequence|giant|etc",
  "subtype": "spectral-type",
  "engine_object": "star-renderer-type",
  "physical": { /* physical properties */ },
  "composition": { /* composition percentages */ },
  "features": { /* feature properties */ },
  "appearance": { /* visual properties */ }
}
```

#### Planets
```json
{
  "id": "planet-id",
  "name": "Planet Name",
  "category": "terrestrial|jovian|etc",
  "subtype": "specific-type",
  "engine_object": "planet-renderer-type",
  "physical": { /* physical properties */ },
  "features": { /* feature properties */ },
  "appearance": { /* visual properties */ },
  "render": { /* rendering properties */ }
}
```

#### Compact Objects (Black Holes, etc.)
```json
{
  "id": "object-id",
  "name": "Object Name",
  "mass": 1000,
  "radius": 0.1,
  "type": "black_hole|neutron_star|etc",
  "subtype": "specific-type",
  "render": { /* rendering properties */ }
}
```

## Adding New Objects

When adding new objects to the Shader Lab:

1. Add the object definition to `components/debug-viewer/object-catalog.ts`
2. Add a corresponding entry to the appropriate engine catalog JSON file
3. Run the validation script to ensure everything is properly connected
4. Test the object in the Shader Lab UI

Following these steps will ensure the Shader Lab system continues to work correctly as new objects are added. 