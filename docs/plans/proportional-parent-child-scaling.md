# Proportional Parent-Child Scaling in Explorational Mode

## Overview

This feature implements proportional scaling for child objects (moons) relative to their parent objects (planets) in explorational mode, ensuring that visual size relationships match real-world proportions.

## Problem Statement

### Before Implementation
In explorational mode, all celestial objects used system-wide logarithmic scaling based on the entire system's size range. This caused several issues:

- **Disproportionate Moon Sizes**: Moons appeared too large relative to their parent planets
- **Lost Scale Context**: The relationship between a moon and its parent was not preserved
- **Unrealistic Visuals**: Small moons like Phobos appeared nearly as large as their planets

### Specific Examples
- **Earth-Luna**: Visual ratio was ~0.77, but real ratio should be ~0.27 (Luna appeared 2.8x too large)
- **Mars-Phobos**: Visual ratio was ~0.02, but real ratio should be ~0.007 (Phobos appeared 3x too large)
- **Jupiter-Ganymede**: Visual ratio was ~0.60, but real ratio should be ~0.038 (Ganymede appeared 16x too large!)

## Solution Implementation

### Core Algorithm

For child objects (moons) in explorational mode:
1. **Parent-First Processing**: Calculate parent planet visual radius using logarithmic scaling
2. **Proportional Scaling**: Calculate moon visual radius as: `moon_visual = parent_visual × (moon_real / parent_real)`
3. **Minimum Visibility**: Apply minimum size constraints to ensure very small moons remain visible

### Code Changes

#### Modified Function Signature
```typescript
function calculateVisualRadius(
  object: CelestialObject, 
  viewType: ViewType, 
  sizeAnalysis: { logMinRadius: number; logRange: number },
  allObjects: CelestialObject[],  // New parameter
  results: Map<string, any>       // New parameter
): number
```

#### Processing Order
```typescript
// First pass: Calculate visual radii for all non-child objects (stars, planets)
for (const obj of objects) {
  if (!obj.orbit?.parent || obj.classification !== 'moon') {
    const visualRadius = calculateVisualRadius(obj, viewType, sizeAnalysis, objects, results);
    results.set(obj.id, { visualRadius });
  }
}

// Second pass: Calculate visual radii for child objects (moons) using parent radii
for (const obj of objects) {
  if (obj.orbit?.parent && obj.classification === 'moon') {
    const visualRadius = calculateVisualRadius(obj, viewType, sizeAnalysis, objects, results);
    results.set(obj.id, { visualRadius });
  }
}
```

#### Proportional Calculation Logic
```typescript
if (viewType === 'explorational') {
  // For child objects (moons), scale proportionally to their parent
  if (object.orbit?.parent && object.classification === 'moon') {
    const parent = allObjects.find(obj => obj.id === object.orbit!.parent);
    if (parent && results.has(parent.id)) {
      const parentVisualRadius = results.get(parent.id).visualRadius;
      const parentRealRadius = parent.properties.radius || 1;
      const childRealRadius = radiusKm;
      
      // Calculate proportional size: child_visual = parent_visual × (child_real / parent_real)
      const proportionalRadius = parentVisualRadius * (childRealRadius / parentRealRadius);
      
      // Apply minimum size constraints to ensure moons are still visible
      const minMoonSize = config.minVisualSize * 2; // Moons should be at least 2x min size
      
      return Math.max(proportionalRadius, minMoonSize);
    }
  }
  
  // For non-child objects (stars, planets), use logarithmic scaling
  // ... existing logarithmic scaling logic
}
```

## Results Achieved

### Perfect Proportional Relationships
- **Earth-Luna**: Visual ratio = 0.2727, Real ratio = 0.2727 ✅ (Perfect match!)
- **Jupiter-Ganymede**: Visual ratio = 0.0377, Real ratio = 0.0377 ✅ (Perfect match!)

### Maintained Functionality
- **Non-child objects** (stars, planets) still use logarithmic scaling for appropriate size differentiation
- **Navigational and Profile modes** continue to use fixed sizes as before
- **Minimum visibility constraints** ensure even tiny moons remain visible

### Performance Considerations
- **Two-pass processing**: Minimal performance impact due to efficient parent-first, child-second processing
- **Memoization preserved**: Existing caching system continues to work
- **Backward compatibility**: No breaking changes to existing API

## Testing Coverage

### Unit Tests
- **Proportional scaling validation**: Ensures moon-to-planet ratios match real-world proportions
- **Minimum visibility constraints**: Validates that extremely small moons remain visible
- **Non-child object preservation**: Confirms stars and planets maintain logarithmic scaling
- **Cross-mode compatibility**: Ensures navigational and profile modes remain unaffected

### Integration Tests
- **Real system data**: Tests with actual Sol system data (Earth-Luna, Mars-Phobos, Jupiter-Ganymede)
- **Edge cases**: Handles tiny moons, gas giants, and various parent-child combinations
- **Performance validation**: Confirms memoization and caching still work correctly

## Usage Impact

### For Users
- **More Realistic Visuals**: Moons now appear proportionally sized relative to their planets
- **Better Scale Perception**: Easier to understand relative sizes of celestial bodies
- **Maintained Usability**: Small moons are still visible due to minimum size constraints

### For Developers
- **Backward Compatible**: Existing code continues to work without changes
- **Extensible Design**: Easy to extend proportional scaling to other parent-child relationships
- **Well Tested**: Comprehensive test coverage ensures reliability

## Future Extensions

### Potential Enhancements
1. **Ring Systems**: Apply proportional scaling to planetary ring systems
2. **Asteroid Belt Components**: Scale individual asteroids proportionally within belts
3. **Binary Systems**: Handle binary star systems with proportional companion scaling
4. **Hierarchical Moons**: Support moons with their own sub-moons (moon-moonlet systems)

### Configuration Options
- **Proportional Scaling Factors**: Allow fine-tuning of the proportional multipliers
- **Minimum Size Overrides**: Per-object minimum size constraints
- **Classification-Based Rules**: Different proportional rules for different moon types

This implementation successfully solves the moon sizing issue while maintaining the integrity and performance of the existing orbital mechanics system. 