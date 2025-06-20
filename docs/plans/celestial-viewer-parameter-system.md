# Celestial Viewer Parameter System Strategy

## Overview

The celestial viewer should dynamically present different parameter controls based on the geometry type of the selected object. Each geometry type has specific visual parameters that control shader behavior and appearance.

## Current State Analysis

### What We Have
- Left panel: Object catalog (✅ Good)
- Right panel: Object controls (✅ Good) 
- Basic parameter system with `habitabilityParams` and `shaderParams`
- Orbital system JSON spec with many properties already defined
- Geometry renderers that use some properties

### What We Need
- **Geometry-specific parameter sets** that map to visual controls
- **Dynamic control panels** that show relevant parameters for each geometry type
- **Enhanced JSON property mapping** for missing parameters
- **Shader integration** to use all parameters effectively

### Current Implementation Analysis

Looking at `object-controls.tsx`, we currently have:

1. **Hard-coded object detection**:
   ```typescript
   const isProtostar = selectedObjectId === 'protostar'
   const isBlackHole = selectedObjectId === 'black-hole'
   const isHabitablePlanet = ['earth', 'earth-like', 'desert-world', 'ocean-world-habitable', 'ice-world'].includes(selectedObjectId)
   ```

2. **Mixed parameter systems**:
   - `shaderParams`: Generic parameters used for all objects
   - `habitabilityParams`: Specific to habitable planets only

3. **Repetitive rendering code**: Same slider component repeated with different labels

**Problems with Current Approach**:
- Hard-coded object IDs instead of using `geometry_type`
- Mixed/unclear parameter semantics
- No extensibility for new geometry types
- Generic shader parameters with confusing names

---

## Parameter Sets by Geometry Type

### 1. Terrestrial Planets (`geometry_type: "terrestrial"`)

#### Visual Parameters (0-100 scale):
1. **Soil Tint**: `soil_tint` (0-100) - Different soil color variations
2. **Water Coverage**: `water` (0-100) - Ocean/ice coverage percentage
   - 0% = Desert world
   - 100% = Ocean world
3. **Temperature**: `temperature_class` (0-100) - Surface temperature class
   - 0-33: Ice world (water only as ice)
   - 34-66: Temperate (liquid water possible)
   - 67-100: Hot world (no liquid water)
4. **Tectonics**: `tectonics` (0-100) - Surface height variation/roughness
5. **Geomagnetism**: `geomagnetism` (0-100) - Aurora effects at poles
6. **Population**: `population` (0-100) - City lights and urban sprawl
7. **Flora**: `flora` (0-100) - Vegetation coverage and tint

#### JSON Mapping:
```json
"properties": {
  "soil_tint": 45,           // NEW: 0-100 soil color variation
  "water": 71,               // EXISTING: ocean/ice coverage
  "temperature_class": 60,   // NEW: 0-100 temperature class
  "tectonics": 40,           // EXISTING: terrain roughness
  "geomagnetism": 85,        // EXISTING: aurora effects
  "population": 80,          // EXISTING: city lights
  "flora": 60                // EXISTING: vegetation
}
```

**Migration from Current System**:
- `habitabilityParams.humidity` → `properties.water`
- `habitabilityParams.temperature` → `properties.temperature_class`
- `habitabilityParams.population` → `properties.population`
- Add: `soil_tint`, `geomagnetism`, `flora`

### 2. Rocky Bodies (`geometry_type: "rocky"`)

#### Visual Parameters (0-100 scale):
1. **Soil Tint**: `soil_tint` (0-100) - Surface color variations
2. **Ice Coverage**: `ice_coverage` (0-100) - Polar ice caps only
   - Confined to poles, affected by temperature
3. **Temperature**: `temperature_class` (0-100) - Extreme temperature range
   - Maps to -200°C to +400°C range
4. **Tectonics**: `surface_variance` (0-100) - Surface height variation

#### JSON Mapping:
```json
"properties": {
  "soil_tint": 30,           // NEW: 0-100 surface color
  "ice_coverage": 15,        // NEW: polar ice percentage  
  "temperature_class": 25,   // NEW: extreme temp range
  "surface_variance": 80,    // EXISTING: bumpiness
  "crater_density": 90,      // EXISTING: crater coverage
  "albedo": 12               // EXISTING: reflectivity
}
```

### 3. Gas Giants (`geometry_type: "gas_giant"`)

#### Visual Parameters (0-100 scale):
1. **Atmospheric Banding**: `band_contrast` (0-100) - Band visibility
2. **Storm Activity**: `storm_intensity` (0-100) - Great spots and storms
3. **Cloud Opacity**: `cloud_opacity` (0-100) - Atmospheric opacity
4. **Hue Shift**: `hue_shift` (0-100) - Color temperature shift
5. **Rotation Speed**: `rotation_speed` (0-100) - Visual rotation rate

#### JSON Mapping:
```json
"properties": {
  "band_contrast": 80,       // EXISTING: atmospheric bands
  "storm_intensity": 65,     // NEW: storm activity level
  "cloud_opacity": 90,       // EXISTING: cloud visibility
  "hue_shift": 25,          // EXISTING: color offset
  "rotation_speed": 85       // NEW: visual rotation rate
}
```

### 4. Stars (`geometry_type: "star"`)

#### Visual Parameters:
1. **Color Temperature**: `color_temperature` (2000-40000K) - Stellar class
2. **Luminosity**: `luminosity` (0-100) - Brightness intensity
3. **Solar Activity**: `solar_activity` (0-100) - Flares and spots
4. **Corona Thickness**: `corona_thickness` (0-100) - Corona visibility
5. **Variability**: `variability` (0-100) - Brightness fluctuation

#### JSON Mapping:
```json
"properties": {
  "color_temperature": 5778,  // EXISTING: stellar temperature
  "luminosity": 100,          // EXISTING: brightness
  "solar_activity": 50,       // EXISTING: flare activity
  "corona_thickness": 30,     // EXISTING: corona size
  "variability": 10           // EXISTING: brightness variation
}
```

**Migration from Current System**:
- Replace generic `shaderParams` for protostars with specific star properties

### 5. Exotic Objects (`geometry_type: "exotic"`)

#### Visual Parameters:
1. **Intensity**: `intensity` (0-100) - Overall effect strength
2. **Distortion**: `distortion` (0-100) - Gravitational lensing
3. **Disk Speed**: `disk_speed` (0-100) - Accretion disk rotation
4. **Disk Brightness**: `disk_brightness` (0-100) - Accretion disk glow

#### JSON Mapping:
```json
"properties": {
  "intensity": 100,          // NEW: effect intensity
  "distortion": 66,          // NEW: lensing strength
  "disk_speed": 75,          // NEW: disk rotation
  "disk_brightness": 80      // NEW: disk luminosity
}
```

**Migration from Current System**:
- Current black hole `shaderParams` → geometry-specific exotic properties

---

## Implementation Strategy

### Phase 1: Extend JSON Specification ✅
1. **Add missing properties** to orbital system JSON spec
2. **Update existing celestial objects** with new parameters
3. **Create parameter validation** and range checking

### Phase 2: Dynamic Control Panels
1. **Replace hard-coded object ID checks** with `geometry_type` detection
2. **Create geometry-specific control components**:
   ```typescript
   // New structure in ObjectControls.tsx
   const getParameterControls = (geometryType: GeometryType, properties: CelestialObject['properties']) => {
     switch (geometryType) {
       case 'terrestrial':
         return <TerrestrialControls properties={properties} onChange={onParameterChange} />
       case 'rocky':
         return <RockyControls properties={properties} onChange={onParameterChange} />
       case 'gas_giant':
         return <GasGiantControls properties={properties} onChange={onParameterChange} />
       case 'star':
         return <StarControls properties={properties} onChange={onParameterChange} />
       case 'exotic':
         return <ExoticControls properties={properties} onChange={onParameterChange} />
       default:
         return <GenericControls properties={properties} onChange={onParameterChange} />
     }
   }
   ```

3. **Consolidate parameter state management**:
   ```typescript
   // Replace separate shaderParams and habitabilityParams with unified system
   const [objectProperties, setObjectProperties] = useState<CelestialObject['properties']>({})
   ```

### Phase 3: Shader Integration
1. **Update geometry renderers** to receive properties from JSON instead of separate parameter objects
2. **Enhance shader materials** to accept new parameters
3. **Implement real-time parameter updates** in useFrame loops

### Phase 4: Parameter Mapping System
1. **Create parameter mapping utilities** that convert JSON properties to shader uniforms
2. **Implement parameter inheritance** from catalog defaults
3. **Add parameter reset/randomization** functionality

---

## Migration Plan from Current System

### Step 1: Update Data Flow
**Current**:
```
CelestialViewer → ObjectControls (shaderParams, habitabilityParams) → Renderers
```

**Target**:
```
CelestialViewer → ObjectControls (celestialObject.properties) → Renderers
```

### Step 2: Parameter Mapping
```typescript
// Current habitabilityParams to properties mapping
const migrateHabitabilityParams = (habitabilityParams: HabitabilityParams): Partial<CelestialObject['properties']> => ({
  water: habitabilityParams.humidity,
  temperature_class: habitabilityParams.temperature,
  population: habitabilityParams.population,
  tectonics: habitabilityParams.volcanism || 40, // Default tectonics
  // Add new parameters with defaults
  soil_tint: 50,
  geomagnetism: 30,
  flora: habitabilityParams.population > 50 ? 60 : 20 // Flora correlates with habitability
})
```

### Step 3: Control Component Refactoring
**Current structure** (hard-coded conditions):
```typescript
{isHabitablePlanet && habitabilityParams && (
  <div>Habitability Controls</div>
)}
```

**Target structure** (geometry-type based):
```typescript
{celestialObject.geometry_type === 'terrestrial' && (
  <TerrestrialControls 
    properties={celestialObject.properties}
    onChange={onPropertiesChange}
  />
)}
```

---

## Control Panel Architecture

### Dynamic Panel Structure:
```typescript
// ObjectControls.tsx
const getControlsForGeometryType = (geometryType: GeometryType) => {
  switch (geometryType) {
    case 'terrestrial':
      return <TerrestrialControls />
    case 'rocky':
      return <RockyControls />
    case 'gas_giant':
      return <GasGiantControls />
    case 'star':
      return <StarControls />
    case 'exotic':
      return <ExoticControls />
    default:
      return <GenericControls />
  }
}
```

### Parameter State Management:
```typescript
// Consolidate all parameter types into single state
const [objectParameters, setObjectParameters] = useState<{
  terrestrial?: TerrestrialParams
  rocky?: RockyParams
  gas_giant?: GasGiantParams
  star?: StarParams
  exotic?: ExoticParams
}>({})
```

---

## Expected Benefits

1. **Intuitive Controls**: Each object type shows only relevant parameters
2. **Real-time Feedback**: Changes immediately affect the 3D object
3. **Educational Value**: Parameters correspond to real astronomical properties
4. **Extensible System**: Easy to add new geometry types and parameters
5. **JSON Consistency**: All parameters stored in standardized format
6. **Clean Architecture**: No more hard-coded object ID checks

---

## Next Steps

1. **✅ Approve this strategy** and parameter definitions
2. **Implement Phase 1**: Extend JSON specification with missing properties
3. **Create geometry-specific control components** 
4. **Migrate existing parameter systems** to unified approach
5. **Integrate with existing shader system**
6. **Test with all geometry types**

This system will provide a comprehensive, educational, and visually compelling celestial object viewer that accurately represents astronomical properties through interactive parameters. 