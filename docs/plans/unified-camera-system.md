# Unified Camera and View Logic System

## User Story

Consistent, predictable camera behavior across view modes (explorational, navigational, profile) to avoid jarring changes in object focus, animations, or viewing angles.

## Problem Statement

Previous system suffered from:
- **Hardcoded Logic**: Scattered distance multipliers, min/max constraints, object type detection.
- **Inconsistent Behavior**: Different camera controllers with duplicate logic.
- **Name-Based Detection**: Unreliable object type detection (e.g., "star", "jupiter").
- **Unmaintainable Code**: Difficult-to-test magic numbers and conditional logic.
- **Fragmented Architecture**: Separate camera controllers with overlapping responsibilities.

## Solution Overview

Unified camera system uses a **configuration-driven architecture**:

1. **Dual Properties System**: Tracks "real" (astronomical) and "visual" (rendering) properties for celestial objects.
2. **View Mode Profiles**: Defines specific configuration profiles for each view mode.
3. **Object Classification**: Intelligently determines object types from names, mass, and radius data.
4. **Unified Camera Controller**: Single controller handles all view modes using configuration profiles.
5. **Consistent API**: Same interface and behavior patterns across all view modes.

## Acceptance Criteria

### ✅ Configuration-Driven Behavior
- [ ] Camera distances, scaling factors, animations defined in configuration objects.
- [ ] No hardcoded distance multipliers or object type checks in camera logic.
- [ ] New view modes added via configuration profiles.
- [ ] Object types determined by intelligent classification, not string matching.

### ✅ Cross-Mode Consistency  
- [ ] Same camera controller works for all view modes.
- [ ] Smooth transitions when switching view modes.
- [ ] Consistent animation durations and easing functions per view mode.
- [ ] Predictable camera distances for same object types across modes.

### ✅ Dual Properties Support
- [ ] Objects have real (astronomical) and visual (rendering) properties.
- [ ] Real properties remain constant across view modes.
- [ ] Visual properties adapt based on view mode configuration.
- [ ] System scaling affects visual properties but preserves real properties.

### ✅ Intelligent Object Classification
- [ ] Objects classified as star, planet, moon, gasGiant, or asteroid.
- [ ] Classification uses name patterns, mass, and radius data.
- [ ] Fallback classification for unknown objects.
- [ ] Consistent camera behavior per object type.

### ✅ Maintainable Architecture
- [ ] Camera behavior centralized in configuration files.
- [ ] No duplicate camera logic across components.
- [ ] Comprehensive test coverage for all view modes and object types.
- [ ] Clear migration path from legacy system.

## Implementation Strategy

### 1. Configuration System (`engine/types/view-mode-config.ts`)
```typescript
// View mode profiles with all camera behavior
export const VIEW_MODE_CONFIGS = {
  explorational: { /* config */ },
  navigational: { /* config */ },
  profile: { /* config */ }
}

// Dual properties for objects
export interface DualObjectProperties {
  realRadius: number        // Astronomical radius
  visualRadius: number      // Rendering radius
  realOrbitRadius: number   // Astronomical orbit
  visualOrbitRadius: number // Rendering orbit
  optimalViewDistance: number // Calculated camera distance
  // ...
}
```

### 2. Unified Camera Controller (`engine/components/system-viewer/unified-camera-controller.tsx`)
- Single controller for all view modes.
- Uses configuration profiles for behavior.
- Supports all camera operations (focus, birds-eye, following).
- Configurable animations and easing functions.

### 3. Enhanced View Mode Logic (Now integrated into `view-mode-config.ts` and `camera-animations.ts`)
- Logic for calculating visual properties and camera distances is now part of `createDualProperties` in `view-mode-config.ts` and `CameraPositionCalculator` in `camera-animations.ts`.
- Removed separate `view-mode-calculator.ts` as its functionality has been absorbed into more appropriate, cohesive modules.

### 4. Comprehensive Testing (`engine/components/system-viewer/__tests__/unified-camera-controller.test.ts`)
- Unit tests for all configuration profiles.
- Object type classification validation.
- Cross-mode consistency testing.
- Edge case handling.

## High-Level Testing Approach

### Unit Testing
- **Configuration Validation**: All view mode configs have required properties.
- **Object Classification**: Correct type determination for various object names.
- **Dual Properties**: Real vs. visual property calculations work correctly.
- **Distance Constraints**: Camera distances respect min/max bounds.

### Integration Testing  
- **View Mode Switching**: Smooth transitions between explorational ↔ navigational ↔ profile.
- **Object Focus**: Appropriate camera distances for all object types.
- **Animation Consistency**: Correct easing functions and durations per view mode.
- **System Scaling**: Properties scale correctly with system size.

### Visual Testing
- **Distance Appropriateness**: Camera positions look good for all object types.
- **Transition Smoothness**: No jarring movements when switching focus or modes.
- **Angle Consistency**: Viewing angles appropriate for each view mode.
- **Edge Cases**: Very large/small objects handled gracefully.

## Benefits

### For Users
- **Predictable Experience**: Consistent camera behavior across all modes.
- **Smooth Transitions**: No jarring changes when switching views or focus.
- **Appropriate Distances**: Optimal viewing distances for all object types.
- **Faster Navigation**: Improved animation timing and smoother movements.

### For Developers  
- **Maintainable Code**: Camera behavior centralized in configuration files.
- **Extensible System**: New view modes added by creating config profiles.
- **Testable Architecture**: Configuration-driven system easier to test.
- **No Magic Numbers**: All values defined in clear, documented configurations.
- **Performance**: Eliminates string comparisons and redundant calculations.

## Migration Status

### ✅ Completed
- [x] Unified configuration system implemented.
- [x] Unified camera controller created.
- [x] Enhanced view mode calculator with backward compatibility.
- [x] Comprehensive test suite.
- [x] Documentation and migration guide.
- [x] Integration with system viewer components.
- [x] Migration from legacy camera controller.
- [x] Testing with real system data.
- [x] Robust null checks in animation logic to prevent `TypeError: Cannot read properties of null (reading 'target')` errors.

### 🔄 In Progress  
- [ ] None

### ⏳ Planned
- [ ] Performance optimization.
- [ ] Additional object type support (space stations, etc.).

## Configuration Examples

### Adding a New Object Type
```typescript
// 1. Add to object scaling
objectScaling: {
  spaceStation: 0.6,
  // ...
}

// 2. Add to camera config  
distanceMultipliers: {
  spaceStation: 2.0,
  // ...
},
distanceConstraints: {
  spaceStation: { min: 0.3, max: 12 },
  // ...
}

// 3. Update classification logic
if (lowerName.includes('station')) {
  return 'spaceStation'
}
```

### Adjusting View Mode Behavior
```typescript
// Modify camera angles
viewingAngles: {
  defaultElevation: 25,     // Adjust default angle
  birdsEyeElevation: 35,    // Adjust birds-eye angle
}

// Modify animation timing
animation: {
  focusDuration: 600,       // Faster focus transitions
  birdsEyeDuration: 800,    // Faster birds-eye transitions
  easingFunction: 'easeOut' // Different easing
}
```

## Future Enhancements

1. **Dynamic Configuration**: Runtime configuration changes via UI.
2. **User Preferences**: Personalized camera behavior settings.
3. **Context-Aware Behavior**: Camera adapts based on system complexity.
4. **Advanced Animations**: More sophisticated easing and transition effects.
5. **Multi-Object Focus**: Camera handling for multiple selected objects.

---

This unified camera system significantly improves architecture, eliminates technical debt, enhances user experience, and provides a foundation for future camera features. 