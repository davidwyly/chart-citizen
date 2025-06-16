# Celestial Viewer Implementation Roadmap

## Executive Summary

Based on analysis of the existing codebase, we have a solid foundation for implementing geometry-specific parameter controls. The orbital system JSON spec already supports most needed properties, the geometry renderers are in place, and the control infrastructure exists.

**Key Finding**: We need to extend existing properties rather than rebuild from scratch.

---

## Current State Assessment

### ✅ What's Already Working
- **Geometry-based rendering system** via `GeometryRendererFactory`
- **Basic parameter controls** in `ObjectControls.tsx`
- **JSON property system** in orbital system spec
- **Catalog objects** with many required properties
- **Shader integration** in geometry renderers

### 🔧 What Needs Extension
- **Missing JSON properties** for complete parameter coverage
- **Hard-coded object ID detection** → geometry type detection
- **Mixed parameter systems** → unified property-based system
- **Generic controls** → geometry-specific controls

---

## Implementation Phases

### Phase 1: Extend JSON Properties ⏱️ 2-3 hours

#### 1.1 Update Orbital System JSON Spec
**File**: `docs/architecture/orbital-system-json-spec.md`

Add missing properties to each geometry type section:

```diff
#### Terrestrial Planets
* `water`: 0–100 (ocean/ice coverage)
* `tectonics`: 0–100 (terrain roughness)
* `flora`: 0–100 (vegetation tint)
* `population`: 0–100 (city lights/urban sprawl)
* `atmosphere`: 0–100 (visual shell thickness)
+ * `soil_tint`: 0–100 (surface color variation)
+ * `temperature_class`: 0–100 (0-33: ice, 34-66: temperate, 67-100: hot)
+ * `geomagnetism`: 0–100 (aurora effects)

#### Stars
* `color_temperature`: 2000–40000 (Kelvin)
* `luminosity`: 0–100
+ * `solar_activity`: 0–100 (flares and spots)
+ * `corona_thickness`: 0–100 (corona visibility)
+ * `variability`: 0–100 (brightness fluctuation)

#### Gas Giants
* `band_contrast`: 0–100
+ * `storm_intensity`: 0–100 (great red spot activity)
* `cloud_opacity`: 0–100
* `hue_shift`: 0–100 (color offset)
+ * `rotation_speed`: 0–100 (visual rotation rate)

#### Rocky Bodies
* `albedo`: 0–100 (surface reflectivity)
* `surface_variance`: 0–100 (bumpiness)
* `crater_density`: 0–100
* `regolith_depth`: 0–100
* `surface_color`: hex (e.g. "#aaaaaa")
+ * `soil_tint`: 0–100 (surface color variation)
+ * `ice_coverage`: 0–100 (polar ice caps)
+ * `temperature_class`: 0–100 (extreme temperature range)

#### Exotic Objects (NEW SECTION)
+ * `intensity`: 0–100 (overall effect strength)
+ * `distortion`: 0–100 (gravitational lensing)
+ * `disk_speed`: 0–100 (accretion disk rotation)
+ * `disk_brightness`: 0–100 (accretion disk glow)
```

#### 1.2 Update TypeScript Types
**File**: `engine/types/orbital-system.ts`

Add new properties to the `CelestialObject['properties']` interface.

#### 1.3 Update Catalog Objects
**File**: `engine/components/celestial-viewer/celestial-viewer.tsx`

Add missing properties to existing objects in `createCatalogCelestialObject`:

```typescript
// Example: Extend existing terrestrial objects
'earth-like': {
  id: 'earth-like',
  name: 'Earth-like World',
  classification: 'planet',
  geometry_type: 'terrestrial',
  properties: {
    // Existing properties
    mass: 1.0,
    radius: 6371,
    temperature: 288,
    atmosphere: 70,
    water: 70,
    tectonics: 50,
    population: 80,
    // NEW properties
    soil_tint: 45,           // Moderate earth-like soil
    temperature_class: 60,   // Temperate zone
    geomagnetism: 75,        // Strong magnetic field
    flora: 80                // Rich vegetation
  }
}
```

### Phase 2: Create Geometry-Specific Controls ⏱️ 6-8 hours

#### 2.1 Create Control Components
**Directory**: `engine/components/celestial-viewer/controls/`

Create individual control components:

**TerrestrialControls.tsx**:
```typescript
interface TerrestrialControlsProps {
  properties: CelestialObject['properties']
  onChange: (property: string, value: number) => void
}

export function TerrestrialControls({ properties, onChange }: TerrestrialControlsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
        Terrestrial Properties
      </h3>
      <ParameterSlider
        id="soil_tint"
        label="Soil Tint"
        value={properties.soil_tint || 45}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('soil_tint', value)}
        unit="%"
      />
      <ParameterSlider
        id="water"
        label="Water Coverage"
        value={properties.water || 50}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('water', value)}
        unit="% (0=desert, 100=ocean)"
      />
      {/* ... more controls */}
    </div>
  )
}
```

Create similar components for:
- `RockyControls.tsx`
- `GasGiantControls.tsx` 
- `StarControls.tsx`
- `ExoticControls.tsx`

#### 2.2 Create Shared Components
**ParameterSlider.tsx**:
```typescript
interface ParameterSliderProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  unit?: string
  description?: string
}

export function ParameterSlider({ id, label, value, min, max, step, onChange, unit, description }: ParameterSliderProps) {
  return (
    <div className="space-y-2 mb-4">
      <label htmlFor={id} className="block text-sm text-gray-300">
        {label}: {value.toFixed(step < 1 ? 3 : 2)}{unit || ""}
      </label>
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  )
}
```

#### 2.3 Refactor ObjectControls
**File**: `engine/components/celestial-viewer/object-controls.tsx`

Replace hard-coded conditions with geometry-type routing:

```typescript
// Remove these lines:
// const isProtostar = selectedObjectId === 'protostar'
// const isBlackHole = selectedObjectId === 'black-hole'  
// const isHabitablePlanet = ['earth', 'earth-like', ...].includes(selectedObjectId)

// Add this:
const getGeometryControls = (celestialObject: CelestialObject) => {
  if (!celestialObject) return null
  
  switch (celestialObject.geometry_type) {
    case 'terrestrial':
      return (
        <TerrestrialControls 
          properties={celestialObject.properties}
          onChange={onPropertyChange}
        />
      )
    case 'rocky':
      return (
        <RockyControls 
          properties={celestialObject.properties}
          onChange={onPropertyChange}
        />
      )
    case 'gas_giant':
      return (
        <GasGiantControls 
          properties={celestialObject.properties}
          onChange={onPropertyChange}
        />
      )
    case 'star':
      return (
        <StarControls 
          properties={celestialObject.properties}
          onChange={onPropertyChange}
        />
      )
    case 'exotic':
      return (
        <ExoticControls 
          properties={celestialObject.properties}
          onChange={onPropertyChange}
        />
      )
    default:
      return <GenericControls properties={celestialObject.properties} onChange={onPropertyChange} />
  }
}
```

### Phase 3: Update State Management ⏱️ 3-4 hours

#### 3.1 Consolidate Parameter State
**File**: `engine/components/celestial-viewer/celestial-viewer.tsx`

Replace separate parameter states with unified property updates:

```typescript
// Remove:
// const [habitabilityParams, setHabitabilityParams] = useState({...})
// const [shaderParams, setShaderParams] = useState({...})

// Add:
const [objectPropertyOverrides, setObjectPropertyOverrides] = useState<Record<string, any>>({})

const handlePropertyChange = (property: string, value: number) => {
  setObjectPropertyOverrides(prev => ({
    ...prev,
    [property]: value
  }))
}

// Merge base properties with overrides
const effectiveProperties = {
  ...celestialObject?.properties,
  ...objectPropertyOverrides
}
```

#### 3.2 Update Props Passed to Renderers
Pass the effective properties instead of separate parameter objects:

```typescript
<CelestialObjectRenderer
  object={{
    ...celestialObject,
    properties: effectiveProperties
  }}
  // Remove shaderParams and habitabilityParams props
/>
```

### Phase 4: Update Geometry Renderers ⏱️ 4-5 hours

#### 4.1 Enhance Shader Material Integration
**Files**: Each geometry renderer

Update renderers to read parameters from `object.properties` instead of separate props:

```typescript
// In TerrestrialRenderer.tsx
const { properties } = object

// Replace hardcoded values with property-driven values
const soilTint = (properties.soil_tint || 45) / 100
const waterCoverage = (properties.water || 50) / 100
const temperatureClass = (properties.temperature_class || 50) / 100
const tectonics = (properties.tectonics || 50) / 100
const geomagnetism = (properties.geomagnetism || 30) / 100
const population = (properties.population || 0) / 100
const flora = (properties.flora || 30) / 100

// Pass to shader material
<terrestrialPlanetMaterial
  soilTint={soilTint}
  waterCoverage={waterCoverage}
  temperatureClass={temperatureClass}
  tectonics={tectonics}
  geomagnetism={geomagnetism}
  population={population}
  flora={flora}
/>
```

#### 4.2 Update Shader Materials
Enhance existing shader materials to accept and use the new parameters.

### Phase 5: Testing & Polish ⏱️ 2-3 hours

#### 5.1 Create Tests
- Test geometry-type detection
- Test parameter propagation
- Test visual changes with parameter adjustments

#### 5.2 Documentation Updates
- Update component documentation
- Add parameter descriptions
- Create usage examples

---

## Priority Order

1. **Phase 1.3**: Update catalog objects with missing properties (Quick win)
2. **Phase 2.2**: Create shared ParameterSlider component (Foundation)
3. **Phase 2.1**: Create TerrestrialControls (Most common geometry type)
4. **Phase 2.3**: Update ObjectControls routing (Core integration)
5. **Phase 3**: Update state management (Data flow)
6. **Phase 4.1**: Update TerrestrialRenderer (Visual validation)
7. **Remaining phases**: Complete other geometry types

---

## Success Criteria

- [ ] Each geometry type shows appropriate parameters
- [ ] Parameter changes immediately affect 3D rendering
- [ ] No hard-coded object ID checks remain
- [ ] All controls are driven by `geometry_type`
- [ ] Properties are stored in standardized JSON format
- [ ] System is extensible for future geometry types

**Timeline**: 17-23 hours total (~3-4 working days)

---

## Risk Mitigation

**Risk**: Breaking existing functionality  
**Mitigation**: Implement incrementally, maintain backward compatibility during transition

**Risk**: Performance impact from real-time updates  
**Mitigation**: Use React.memo and optimized state updates

**Risk**: Complex shader parameter mapping  
**Mitigation**: Start with simple parameter pass-through, enhance gradually

This roadmap provides a clear path to implement the documented parameter system strategy while building on our existing strong foundation. 