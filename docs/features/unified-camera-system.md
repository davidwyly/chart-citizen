# Unified Camera and View Logic System

## User Story

As a user navigating between different view modes (realistic, navigational, profile), I want the camera behavior to be consistent and predictable, so that I don't experience jarring changes in object focus distances, animations, or viewing angles when switching modes or focusing on different types of celestial objects.

## Problem Statement

The previous system suffered from:
- **Hardcoded Logic**: Distance multipliers, min/max constraints, and object type detection scattered throughout the codebase
- **Inconsistent Behavior**: Different camera controllers for different view modes with duplicate logic
- **Name-Based Detection**: Unreliable object type detection using string matching ("star", "jupiter", etc.)
- **Unmaintainable Code**: Magic numbers and conditional logic that was difficult to test and modify
- **Fragmented Architecture**: Separate camera controllers with overlapping responsibilities

## Solution Overview

The unified camera system implements a **configuration-driven architecture** that:

1. **Dual Properties System**: Tracks both "real" (astronomical) and "visual" (rendering) properties for all celestial objects
2. **View Mode Profiles**: Defines specific configuration profiles for each view mode
3. **Object Classification**: Intelligently determines object types from names, mass, and radius data
4. **Unified Camera Controller**: Single controller that handles all view modes using configuration profiles
5. **Consistent API**: Same interface and behavior patterns across all view modes

## Acceptance Criteria

### ✅ Configuration-Driven Behavior
- [ ] All camera distances, scaling factors, and animations are defined in configuration objects
- [ ] No hardcoded distance multipliers or object type checks in camera logic
- [ ] New view modes can be added by creating configuration profiles
- [ ] Object types are determined by intelligent classification, not string matching

### ✅ Cross-Mode Consistency  
- [ ] Same camera controller works for all view modes (realistic, navigational, profile)
- [ ] Smooth transitions when switching between view modes
- [ ] Consistent animation durations and easing functions per view mode
- [ ] Predictable camera distances for same object types across modes

### ✅ Dual Properties Support
- [ ] Objects have both real (astronomical) and visual (rendering) properties
- [ ] Real properties remain constant across view modes
- [ ] Visual properties adapt based on view mode configuration
- [ ] System scaling affects visual properties but preserves real properties

### ✅ Intelligent Object Classification
- [ ] Objects classified as star, planet, moon, gasGiant, or asteroid
- [ ] Classification uses name patterns, mass, and radius data
- [ ] Fallback classification for unknown objects
- [ ] Consistent camera behavior per object type

### ✅ Maintainable Architecture
- [ ] Camera behavior centralized in configuration files
- [ ] No duplicate camera logic across components
- [ ] Comprehensive test coverage for all view modes and object types
- [ ] Clear migration path from legacy system

## Implementation Strategy

### 1. Configuration System (`engine/types/view-mode-config.ts`)
```typescript
// View mode profiles with all camera behavior
export const VIEW_MODE_CONFIGS = {
  realistic: { /* config */ },
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
- Single controller for all view modes
- Uses configuration profiles for behavior
- Supports all camera operations (focus, birds-eye, following)
- Configurable animations and easing functions

### 3. Enhanced View Mode Calculator (`engine/components/system-viewer/view-mode-calculator.ts`)
- Backward compatibility with legacy system
- Integration with unified configuration system
- Helper functions for configuration-driven calculations

### 4. Comprehensive Testing (`engine/components/system-viewer/__tests__/unified-camera-controller.test.ts`)
- Unit tests for all configuration profiles
- Object type classification validation
- Cross-mode consistency testing
- Edge case handling

## High-Level Testing Approach

### Unit Testing
- **Configuration Validation**: All view mode configs have required properties
- **Object Classification**: Correct type determination for various object names
- **Dual Properties**: Real vs visual property calculations work correctly
- **Distance Constraints**: Camera distances respect min/max bounds

### Integration Testing  
- **View Mode Switching**: Smooth transitions between realistic ↔ navigational ↔ profile
- **Object Focus**: Appropriate camera distances for all object types
- **Animation Consistency**: Correct easing functions and durations per view mode
- **System Scaling**: Properties scale correctly with system size

### Visual Testing
- **Distance Appropriateness**: Camera positions look good for all object types
- **Transition Smoothness**: No jarring movements when switching focus or modes
- **Angle Consistency**: Viewing angles appropriate for each view mode
- **Edge Cases**: Very large/small objects handled gracefully

## Benefits

### For Users
- **Predictable Experience**: Consistent camera behavior across all modes
- **Smooth Transitions**: No jarring changes when switching views or focus
- **Appropriate Distances**: Optimal viewing distances for all object types
- **Faster Navigation**: Improved animation timing and smoother movements

### For Developers  
- **Maintainable Code**: Camera behavior centralized in configuration files
- **Extensible System**: New view modes added by creating config profiles
- **Testable Architecture**: Configuration-driven system easier to test
- **No Magic Numbers**: All values defined in clear, documented configurations
- **Performance**: Eliminates string comparisons and redundant calculations

## Migration Status

### ✅ Completed
- [x] Unified configuration system implemented
- [x] Unified camera controller created
- [x] Enhanced view mode calculator with backward compatibility
- [x] Comprehensive test suite
- [x] Documentation and migration guide

### 🔄 In Progress  
- [ ] Integration with system viewer components
- [ ] Migration from legacy camera controller
- [ ] Testing with real system data

### ⏳ Planned
- [ ] Remove legacy camera controller
- [ ] Performance optimization
- [ ] Additional object type support (space stations, etc.)

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

1. **Dynamic Configuration**: Runtime configuration changes via UI
2. **User Preferences**: Personalized camera behavior settings
3. **Context-Aware Behavior**: Camera adapts based on system complexity
4. **Advanced Animations**: More sophisticated easing and transition effects
5. **Multi-Object Focus**: Camera handling for multiple selected objects

---

This unified camera system represents a significant architectural improvement that eliminates technical debt, improves user experience, and provides a foundation for future camera-related features. 