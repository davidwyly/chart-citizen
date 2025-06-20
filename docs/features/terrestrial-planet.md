# Terrestrial Planet Shader

High-performance shader for realistic terrestrial planets with dynamic effects.

## Features

- Procedural terrain generation
- Animated cloud systems with realistic movement
- Ocean/land masking with specular highlights
- Dynamic night lights for inhabited areas
- Atmospheric effects and lighting

## Usage

```typescript
import { TerrestrialPlanetRenderer } from '@/engine/renderers/planets/terrestrial-planet-renderer'
import { CatalogObject } from '@/engine/system-loader'

interface MyComponentProps {
  planetData: CatalogObject
}

function MyComponent({ planetData }: MyComponentProps) {
  return (
    <TerrestrialPlanetRenderer
      catalogData={planetData}
      position={[0, 0, 0]}
      scale={1}
      onFocus={(obj, name) => console.log(`Focused on ${name}`)}
    />
  )
}
```

## Example Configurations

### Earth-like Planet
```typescript
// The TerrestrialPlanetRenderer now directly takes catalogData
// and derives properties like colors and feature flags from it.
// Example of catalogData that would render an Earth-like planet:
const earthCatalogData = {
  name: "Earth",
  physical: {
    radius: 1.0,
    atmospheric_pressure: 1.0,
  },
  features: {
    ocean_coverage: 0.7,
    cloud_coverage: 0.6,
    city_lights: true,
    terrain_roughness: 1.0,
    rotation_period: 24.0,
  },
  appearance: {
    ocean_color: "#1e90ff",
    land_color: "#8fbc8f",
    sand_color: "#daa520",
    cloud_color: "#ffffff",
    city_light_color: "#ffff99",
    atmosphere_color: "#87ceeb",
  }
}

<TerrestrialPlanetRenderer catalogData={earthCatalogData} />
```

### Arid Planet
```typescript
// Example of catalogData that would render an Arid planet:
const aridCatalogData = {
  name: "Arid Planet",
  physical: {
    radius: 0.8,
    atmospheric_pressure: 0.5,
  },
  features: {
    ocean_coverage: 0.05,
    cloud_coverage: 0.2,
    city_lights: false,
    terrain_roughness: 1.5,
    rotation_period: 30.0,
  },
  appearance: {
    ocean_color: "#1e90ff",
    land_color: "#604010",
    sand_color: "#807040",
    cloud_color: "#d0d0d0",
    city_light_color: "#ffff99",
    atmosphere_color: "#c0a080",
  }
}

<TerrestrialPlanetRenderer catalogData={aridCatalogData} />
```

## Performance Monitoring

`TerrestrialPlanetRenderer` does not directly expose performance monitoring hooks. Performance is managed at a higher level, and the component is efficient.

## Best Practices

1. **Data-Driven Configuration**
   - Configure planet appearance/features via `catalogData` prop.
   - Ensure `CatalogObject` accurately reflects desired planet characteristics.

2. **Component Usage**
   - Render terrestrial planets using `<TerrestrialPlanetRenderer />` component, not direct material creation.

3. **Memory Management**
   - Component handles material disposal; no manual disposal needed.

## Troubleshooting

### Common Issues

1. **Low FPS**
   - Ensure `CatalogObject` values (e.g., `terrain_roughness`, `cloud_coverage`) are reasonable.
   - Optimize overall scene complexity if many planets rendered.

2. **Visual Artifacts**
   - Verify `catalogData` values within expected ranges.
   - Check for console errors related to WebGL.

3. **Unexpected Appearance**
   - Double-check `appearance`/`features` properties in `catalogData`.
   - Ensure color values are valid hexadecimal strings. 