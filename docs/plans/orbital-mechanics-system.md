# Orbital Mechanics System

## Overview
Ensures proper scaling and positioning of celestial objects across all view modes (explorational, navigational, profile, scientific), preventing orbiting objects from rendering inside parents.

## Problem Statement

### Before
- Objects orbited inside parents when orbital distances < parent visual radii.
- Inconsistent scaling logic across view modes.
- Moon systems problematic (moons inside planets).
- Belt objects intersected parent stars.
- No unified safe orbital distance calculation.

### After
- **Guaranteed Safe Orbits**: All orbiting objects positioned outside parent's visual radius with configurable safety margins.
- **Unified Scaling**: Single system handles all object types and view modes consistently.
- **View Mode Specific Behavior**: Each view mode has its own scaling profile, sharing safety logic.
- **Hierarchical Spacing**: Objects orbiting same parent properly spaced in navigational/profile modes.

## Core Components

### 1. View Mode Scaling Configurations

Each view mode has its own scaling profile:

```typescript
const VIEW_MODE_SCALINGS: Record<ViewType, ViewModeScaling> = {
  explorational: {
    // Proportional scaling based on actual sizes
    objectScaling: { star: 0.000001, planet: 0.0001, moon: 0.0002 },
    orbitScaling: 1.0, // Keep AU distances proportional
    minSizes: { star: 0.5, planet: 0.08, moon: 0.02 }
  },
  navigational: {
    // Fixed sizes for consistent navigation
    objectScaling: { star: 0.0, planet: 0.0, moon: 0.0 }, // Use fixed sizes
    orbitScaling: 0.6, // Compress orbits for better navigation
    minSizes: { star: 2.0, planet: 1.2, moon: 0.6 } // Fixed sizes
  },
  profile: {
    // Compact sizes for profile view
    objectScaling: { star: 0.0, planet: 0.0, moon: 0.0 }, // Use fixed sizes
    orbitScaling: 0.4, // More compressed for profile view
    minSizes: { star: 1.5, planet: 0.8, moon: 0.4 } // Smaller fixed sizes
  },
  scientific: {
    // True-to-life astronomical scaling
    objectScaling: { star: 1.0, planet: 1.0, moon: 1.0 }, // No artificial scaling
    orbitScaling: 1.0, // True astronomical distances
    minSizes: { star: 0.00001, planet: 0.00001, moon: 0.00001 } // Minimal visibility threshold
  }
};
```

### 2. Safety Multipliers

Minimum safe distances as multiples of parent visual radius:

```typescript
const ORBITAL_SAFETY_MULTIPLIERS = {
  explorational: 2.5,    // 2.5x parent radius minimum
  navigational: 3.0, // 3x parent radius minimum
  profile: 3.5,      // 3.5x parent radius minimum (more spacing needed)
  scientific: 1.1,   // 1.1x parent radius minimum (minimal for scientific accuracy)
};
```

### 3. Object Classification

Intelligent classification based on properties:

```typescript
export function classifyObject(object: CelestialObject): ObjectClass {
  // Uses object.classification first, then fallbacks to size-based classification
  // Supports: star, planet, moon, asteroid, belt, barycenter
}
```

## Key Functions

### `calculateVisualRadius(object, viewType)`
Calculates visual rendering radius for any object in any view mode:
- **Explorational Mode**: Scaled actual radius with minimum sizes.
- **Navigational/Profile**: Fixed sizes per object type.
- **Scientific Mode**: True-to-life scaling with minimal size thresholds.
- Ensures minimum visibility.

### `calculateSafeOrbitDistance(child, parent, viewType)`
Ensures orbital distance is always outside parent's visual radius:
- Calculates base orbital distance from AU data.
- Applies safety multiplier based on parent's visual radius.
- Returns larger of: scaled orbit, safe distance, or absolute minimum.

### `calculateSafeBeltOrbit(belt, parent, viewType)`
Specialized handling for belt objects:
- Ensures inner radius is outside parent.
- Maintains proper belt width proportions.
- Handles asteroid/Kuiper belts consistently.

### `calculateHierarchicalSpacing(objects, parentId, parent, viewType)`
For navigational/profile modes, creates evenly spaced orbits:
- Sorts objects by original orbital distance.
- Applies consistent spacing.
- Ensures objects are outside parent with proper gaps.

### `calculateSystemOrbitalMechanics(objects, viewType)`
Main function processing an entire system:
- Calculates visual radii for all objects.
- Groups objects by parent.
- Applies spacing logic per view mode.
- Returns complete mechanics data.

## Usage Examples

### Basic Usage

```typescript
import { calculateSystemOrbitalMechanics } from '@/engine/utils/orbital-mechanics-calculator';

// Calculate mechanics for entire system
const mechanics = calculateSystemOrbitalMechanics(systemData.objects, 'explorational');

// Get data for specific object
const planetData = mechanics.get('earth');
const visualRadius = planetData.visualRadius;
const orbitDistance = planetData.orbitDistance;
```

### Integration with Rendering

```typescript
// In system objects renderer
const orbitalMechanics = useMemo(() => {
  return calculateSystemOrbitalMechanics(systemData.objects, viewType);
}, [systemData.objects, viewType]);

// Use safe orbital distance
const mechanicsData = orbitalMechanics.get(object.id);
let semiMajorAxis = mechanicsData?.orbitDistance || fallbackDistance;
```

### Legacy Compatibility

```typescript
// For existing code that expects old interface
const legacy = convertLegacyToSafeOrbitalMechanics(objects, viewType, {
  STAR_SCALE: 1.0,
  PLANET_SCALE: 1.0,
  ORBITAL_SCALE: 1.0,
});

const size = legacy.getObjectVisualSize(objectId);
const orbit = legacy.getObjectOrbitDistance(objectId);
```

## View Mode Behaviors

### Explorational Mode
- **Purpose**: Proportional scaling, educational visualization.
- **Object Sizes**: Scaled from actual radius data with minimums for visibility.
- **Orbital Distances**: Proportional to actual AU distances, but safe orbital clearing.
- **Use Cases**: Educational visualization, immersive experience.

### Navigational Mode
- **Purpose**: Practical navigation, standardized objects.
- **Object Sizes**: Fixed sizes per object type (all stars same size, etc.).
- **Orbital Distances**: Hierarchically spaced for clear navigation.
- **Use Cases**: System navigation, jump point planning, quick overview.

### Profile Mode
- **Purpose**: Top-down analysis, compact layout.
- **Object Sizes**: Smaller fixed sizes optimized for profile view.
- **Orbital Distances**: Most compressed with maximum spacing.
- **Use Cases**: System hierarchy exploration, educational structure visualization.

## Safety Guarantees

### Orbital Collision Prevention
1. **Minimum Distance Check**: Every orbit is at least `safetyMultiplier × parentRadius`.
2. **Absolute Minimums**: Fallback minimum distances for small parents.
3. **Belt Safety**: Belt inner radius always outside parent with proper width.
4. **Hierarchical Safety**: Multiple objects orbiting same parent properly spaced.

### Edge Case Handling
1. **Missing Data**: Graceful fallbacks.
2. **Very Small Objects**: Minimum sizes ensure visibility.
3. **Very Large Objects**: Scaling prevents dominance.
4. **Binary Systems**: Proper handling.

## Performance Considerations

### Optimization Features
1. **Memoization**: Cached results, recalculated only on input change.
2. **Single Pass**: All objects processed efficiently.
3. **Lazy Evaluation**: Calculates only what's needed.
4. **TypeScript Optimized**: Fully typed for compile-time optimization.

### Memory Usage
- Minimal memory footprint, efficient data structures.
- Results stored in Map for O(1) lookups.
- No circular references or memory leaks.

## Testing

Comprehensive test suite covers:
- All view modes and object types.
- Safety guarantee verification.
- Edge cases and error conditions.
- Performance regression testing.
- Cross-mode consistency validation.

Run tests with:
```bash
npm test engine/utils/__tests__/orbital-mechanics-calculator.test.ts
```

## Migration Guide

### From Old System
1. Replace `calculateVisualSize` with `calculateSystemOrbitalMechanics`.
2. Use mechanics data map instead of individual calculations.
3. Update rendering code to use safe orbital distances.
4. Remove old manual safety checks.

### Integration Steps
1. Import orbital mechanics calculator.
2. Calculate mechanics data once per render cycle.
3. Use mechanics data for object sizes and orbital positions.
4. Remove legacy scaling calculations.

## Future Enhancements

### Planned Features
1. **Dynamic Configuration**: Runtime adjustment of safety multipliers.
2. **User Preferences**: Customizable scaling factors.
3. **Advanced Spacing**: More sophisticated spacing algorithms.
4. **Performance Metrics**: Built-in performance monitoring/optimization.

### Extensibility
- Easy to add new object types.
- Configurable per view mode.
- Plugin architecture for custom scaling logic.
- Event system for scaling changes.

## Conclusion

Robust, tested, comprehensive solution to scaling problem. Ensures objects never orbit inside parents, maintaining distinct view mode characteristics.

Key benefits:
- **Reliability**: Guaranteed safe orbital positioning.
- **Performance**: Optimized for real-time rendering.
- **Maintainability**: Centralized, well-tested logic.
- **Extensibility**: Easy to add new features/object types.
- **User Experience**: Consistent, predictable behavior. 