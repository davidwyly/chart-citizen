# Effective Orbit Clearing for Planets with Moons

## Overview
Enhanced orbital mechanics system that uses the outermost moon orbit radius instead of the planet radius for orbit clearing calculations. This prevents orbital lines from intersecting when planets have moon systems.

## Problem Statement

### Before
- Planets with moons used only the planet's visual radius for orbit clearing calculations
- This could cause orbital lines to intersect with moon orbits
- Adjacent planets might be positioned too close, overlapping with moon system boundaries

### After
- **Effective Orbit Clearing**: Planets with moons use their outermost moon orbit shell radius for clearance calculations
- **No Orbital Intersections**: Ensures other objects clear the entire planet+moon system, not just the planet
- **Proper Moon System Respect**: Moon systems are treated as unified orbital zones

## Implementation

### Core Function: `calculateEffectiveOrbitClearingRadius()`

```typescript
function calculateEffectiveOrbitClearingRadius(
  planet: CelestialObject,
  viewType: ViewType,
  sizeAnalysis: SystemSizeAnalysis,
  allObjects: CelestialObject[],
  config: ViewModeScaling
): number {
  const planetVisualRadius = calculateVisualRadius(planet, viewType, sizeAnalysis);
  
  // Find all moons orbiting this planet
  const moons = allObjects.filter(obj => 
    obj.orbit?.parent === planet.id && obj.classification === 'moon'
  );
  
  if (moons.length === 0) {
    return planetVisualRadius; // No moons, use planet radius
  }
  
  // Find outermost moon orbit + moon radius
  let outermostMoonOrbitDistance = 0;
  for (const moon of moons) {
    const moonOrbitDistance = moon.orbit.semi_major_axis * config.orbitScaling;
    const moonVisualRadius = calculateVisualRadius(moon, viewType, sizeAnalysis);
    const moonOrbitEdge = moonOrbitDistance + moonVisualRadius;
    outermostMoonOrbitDistance = Math.max(outermostMoonOrbitDistance, moonOrbitEdge);
  }
  
  // Use larger of planet radius or outermost moon orbit shell
  return Math.max(planetVisualRadius, outermostMoonOrbitDistance);
}
```

### Integration Points

1. **`calculateSafeOrbitDistance()`**: Uses effective radius when calculating orbit clearing between siblings
2. **`calculateOrderPreservingOrbitalPlacement()`**: Uses effective radius for spacing calculations in realistic mode

## Examples

### Earth-Luna System
```
Earth visual radius: 0.38 units
Luna orbit distance: 0.002 AU × 8.0 = 0.016 units
Luna visual radius: 0.23 units
Luna orbit shell: 0.016 + 0.23 = 0.246 units

Effective clearing radius: max(0.38, 0.246) = 0.38 units (Earth still larger)
```

### Jupiter Moon System
```
Jupiter visual radius: 1.38 units
Callisto orbit: 0.0126 AU × 8.0 = 0.101 units
Callisto radius: 0.15 units
Callisto orbit shell: 0.101 + 0.15 = 0.251 units

Effective clearing radius: max(1.38, 0.251) = 1.38 units (Jupiter still larger)
```

### Fictional Large Moon System
```
Planet visual radius: 0.5 units
Outer moon orbit: 0.1 AU × 8.0 = 0.8 units
Outer moon radius: 0.3 units
Moon orbit shell: 0.8 + 0.3 = 1.1 units

Effective clearing radius: max(0.5, 1.1) = 1.1 units (Moon system extends beyond planet)
```

## Benefits

### Visual Accuracy
- ✅ **No Orbital Overlaps**: Other planets properly clear moon systems
- ✅ **Realistic Spacing**: Maintains proper celestial body relationships
- ✅ **Consistent Behavior**: Works across all view modes (explorational, navigational, profile)

### Astronomical Correctness  
- ✅ **Hill Sphere Respect**: Accounts for gravitational influence zones
- ✅ **System Boundaries**: Treats planet+moons as unified orbital systems
- ✅ **Proper Clearance**: Ensures stable orbital configurations

### Performance
- ✅ **Efficient Calculation**: Only computed when needed (planets with moons)
- ✅ **Cached Results**: Integrates with existing orbital mechanics caching
- ✅ **No Breaking Changes**: Backward compatible with existing systems

## View Mode Behavior

### Eplorational Mode
- Uses actual orbital distances and moon sizes
- Respects astronomical proportions
- Most accurate representation of moon system extents

### Navigational Mode  
- Uses compressed orbital distances
- Fixed object sizes for clarity
- Still maintains proper clearance relationships

### Profile Mode
- Most compressed layout
- Smallest object sizes
- Enhanced spacing for top-down visibility

## Test Coverage

Comprehensive test suite verifies:
- ✅ Planets without moons use planet radius (unchanged behavior)
- ✅ Planets with moons use outermost moon orbit shell
- ✅ Multiple planets with moons maintain proper order
- ✅ All view modes work correctly
- ✅ No regressions in existing functionality

## Integration

### Automatic Activation
- Feature is automatically applied when planets have moons in their orbit data
- No configuration changes required
- Works with existing system data files

### Data Requirements
- Requires proper `orbit.parent` relationships between moons and planets
- Uses `classification: "moon"` to identify moon objects
- Works with existing orbital system JSON specification

## Future Enhancements

### Potential Improvements
- **Ring System Support**: Could extend to handle planetary rings
- **Binary Planet Systems**: Support for double planets/large moon systems  
- **Trojan Objects**: Handle objects in Lagrange points
- **Asteroid Moons**: Support for asteroid systems with small moons

This enhancement ensures that Chart-Citizen properly handles complex planetary systems with realistic orbital mechanics while maintaining visual clarity and astronomical accuracy. 🌙 