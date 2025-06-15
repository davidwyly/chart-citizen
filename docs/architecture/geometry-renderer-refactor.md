# Geometry Renderer Refactoring

## Overview

This document outlines the refactoring of the Chart-Citizen rendering system to support individual geometry-specific renderers based on the orbital system JSON specification. The refactoring replaces the monolithic "planet" renderer approach with specialized renderers for each geometry type.

## Previous Architecture

- **CelestialObjectRenderer**: Simple geometry/material switching based on `geometry_type`
- **ObjectFactory**: Complex logic using `engine_object` and `category` fields
- **Mixed approaches**: Some specialized renderers (TerrestrialPlanetRenderer, GasGiantRenderer) alongside generic ones

## New Architecture

### Geometry Renderer Factory Pattern

The new system uses a factory pattern with the `GeometryRendererFactory` component that routes to geometry-specific renderers based on the `geometry_type` field from the orbital system JSON spec.

```typescript
// Factory routes based on geometry_type
switch (geometryType) {
  case "terrestrial": return <TerrestrialRenderer {...props} />
  case "rocky": return <RockyRenderer {...props} />
  case "gas_giant": return <GasGiantRenderer {...props} />
  case "star": return <StarRenderer {...props} />
  case "compact": return <CompactRenderer {...props} />
  case "ring": return <RingRenderer {...props} />
  case "belt": return <BeltRenderer {...props} />
  case "none": return <InvisibleRenderer {...props} />
}
```

## Geometry Types & Renderers

| Geometry Type | Renderer | Description | Ring Support |
|---------------|----------|-------------|--------------|
| `terrestrial` | TerrestrialRenderer | Earth-like planets, moons w/ atmospheres | ✅ Yes |
| `rocky` | RockyRenderer | Moons, Mercury-like bodies | ✅ Yes (rare) |
| `gas_giant` | GasGiantRenderer | Jupiter-like planets | ✅ Yes (common) |
| `star` | StarRenderer | Stellar bodies | ❌ No |
| `compact` | CompactRenderer | Neutron stars, white dwarfs | ❌ No |
| `exotic` | ExoticRenderer | Black holes, pulsars, other phenomena | ❌ No |
| `ring` | RingRenderer | Standalone ring systems | ❌ No (is rings) |
| `belt` | BeltRenderer | Asteroid/Kuiper belts | ❌ No |
| `none` | InvisibleRenderer | Barycenters | ❌ No |

## Ring Attachment System

### Ring-Capable Renderers

Renderers that support rings check for the `rings` array property on the CelestialObject and render PlanetRingsRenderer components for each ring definition:

```typescript
{object.rings && object.rings.length > 0 && (
  <group>
    {object.rings.map((ring, index) => (
      <PlanetRingsRenderer
        key={ring.id}
        planetRadius={radius}
        innerRadius={ring.radius_start}
        outerRadius={ring.radius_end}
        color={ring.color || "#c0c0c0"}
        transparency={1 - (ring.opacity || 70) / 100}
        // ... other ring properties
      />
    ))}
  </group>
)}
```

### Ring Properties Mapping

Ring properties from the orbital system JSON spec are mapped to renderer parameters:

- `ring.density` → dustDensity (sparse/moderate/dense → 0.3/0.6/0.9)
- `ring.opacity` → transparency (0-100 → inverted for Three.js)
- `ring.color` → color (hex color string)
- `ring.radius_start/radius_end` → innerRadius/outerRadius

## Implementation Details

### Common Interface

All geometry renderers implement the `GeometryRendererProps` interface:

```typescript
interface GeometryRendererProps {
  object: CelestialObject
  scale: number
  starPosition?: [number, number, number]
  position?: [number, number, number]
  isSelected?: boolean
  timeMultiplier?: number
  isPaused?: boolean
  onHover?: (objectId: string | null) => void
  onSelect?: (id: string, object: THREE.Object3D, name: string) => void
  onFocus?: (object: THREE.Object3D, name: string, size: number, radius?: number, mass?: number, orbitRadius?: number) => void
  registerRef: (id: string, ref: THREE.Object3D) => void
}
```

### Properties Extraction

Each renderer extracts relevant properties from the unified `properties` object:

#### Terrestrial Renderer
- `water`: Ocean/ice coverage (0-100)
- `tectonics`: Terrain roughness (0-100)
- `flora`: Vegetation coverage (0-100)
- `population`: City lights/urban areas (0-100)
- `atmosphere`: Atmospheric shell thickness (0-100)

#### Rocky Renderer
- `surface_color`: Base surface color (hex)
- `crater_density`: Number of craters (0-100)
- `surface_variance`: Surface bumpiness (0-100)
- `albedo`: Surface reflectivity (0-100)

#### Gas Giant Renderer
- `band_contrast`: Atmospheric band visibility (0-100)
- `cloud_opacity`: Cloud layer opacity (0-100)
- `hue_shift`: Color variation (0-100)

#### Star Renderer
- `color_temperature`: Stellar temperature (2000-40000K)
- `luminosity`: Brightness (0-100)
- `solar_activity`: Surface activity/flares (0-100)
- `corona_thickness`: Corona size (0-100)
- `variability`: Brightness variation (0-100)

## Integration Points

### SystemObjectsRenderer

The main system objects renderer now uses the geometry renderer factory:

```typescript
// OLD: Complex geometry switching in CelestialObjectRenderer
const renderConfig = useMemo(() => {
  switch (geometry_type) {
    case "star": return { geometry: <sphereGeometry />, material: <meshBasicMaterial /> }
    // ... many cases
  }
}, [geometry_type, properties])

// NEW: Simple factory delegation
return (
  <GeometryRendererFactory
    object={object}
    scale={scale}
    starPosition={starPosition}
    // ... other props
  />
)
```

### Object Factory (Legacy)

The existing ObjectFactory component can be gradually migrated to use geometry types instead of engine_object types, or kept for backward compatibility during transition.

## Migration Strategy

1. **Phase 1**: New geometry renderers created alongside existing system
2. **Phase 2**: SystemObjectsRenderer updated to use GeometryRendererFactory
3. **Phase 3**: Data layer updated to provide geometry_type fields consistently
4. **Phase 4**: Legacy ObjectFactory and engine_object logic phased out

## Benefits

1. **Cleaner Architecture**: Each geometry type has dedicated rendering logic
2. **Better Ring Support**: Unified ring attachment system for applicable renderers
3. **Orbital System Spec Compliance**: Direct mapping from JSON spec to renderers
4. **Easier Maintenance**: Isolated renderer components are easier to modify and test
5. **Performance**: Specialized renderers can optimize for their specific use cases
6. **Extensibility**: New geometry types can be added by creating new renderers

## Testing Strategy

Due to the nature of Three.js and React Three Fiber components, traditional DOM-based testing with `@testing-library/react` for visual assertions (e.g., `toBeInTheDocument`, `toHaveAttribute`) is often impractical and unreliable within a JSDOM environment. Instead, a hybrid testing strategy is employed:

1.  **Direct Three.js Logic Testing**: Core Three.js functionalities, such as geometry creation, material property calculations, vector mathematics, and transformations, are tested directly using the `three` library. This approach focuses on the underlying mathematical and geometric correctness, independent of React component rendering. An example can be found in `engine/renderers/geometry-renderers/__tests__/geometry-logic.test.ts`.

2.  **Component Instantiation and Prop Forwarding Tests**: For React components like `GeometryRendererFactory` and individual geometry renderers (e.g., `TerrestrialRenderer`), tests focus on verifying that the correct components are instantiated and receive the appropriate props. This is achieved by mocking the individual renderer components as Vitest `vi.fn()` mocks and asserting that these mocks were `toHaveBeenCalledWith` the expected arguments. This ensures correct data flow and component selection logic. An example can be found in `engine/renderers/geometry-renderers/__tests__/geometry-renderer-factory.test.tsx`.

This strategy provides robust test coverage for both the underlying 3D logic and the React component integration, while avoiding the complexities of visual rendering in a test environment.

## Future Enhancements

- Custom shader materials for each geometry type
- Level-of-detail (LOD) systems per geometry type
- Procedural generation parameters per geometry type
- Physics simulation integration per geometry type
- Advanced ring dynamics and interactions 