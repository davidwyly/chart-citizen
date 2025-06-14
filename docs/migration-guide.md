# Migration Guide: Unified Camera and View Logic System

This guide explains how to migrate from the old hardcoded camera system to the new unified configuration-driven approach.

## Overview

The new unified system replaces hardcoded camera logic with a flexible configuration system that supports all view modes (realistic, navigational, profile) through a single interface.

## Key Changes

### Before (Old System)
```typescript
// Hardcoded distance multipliers
let distanceMultiplier = 3 // Default for regular planets/moons
if (isStar) {
  distanceMultiplier = 8 // Stars need more distance
} else if (isGasGiant) {
  distanceMultiplier = 5 // Gas giants need a bit more distance than rocky planets
}

// Hardcoded min/max distances
const minDistance = isStar ? 2.0 : isGasGiant ? 1.0 : 0.5
const maxDistance = isStar ? 100 : isGasGiant ? 30 : 20

// Name-based object detection
const isStar = focusName ? focusName.toLowerCase().includes('star') : false
const isGasGiant = focusName ? focusName.toLowerCase().includes('jupiter') || ... : false
```

### After (New System)
```typescript
// Configuration-driven approach
import { createDualProperties } from '@/engine/types/view-mode-config'

const objectProperties = createDualProperties(
  focusRadius || 1.0,      // realRadius
  focusOrbitRadius || 0,   // realOrbitRadius  
  focusMass || 1.0,        // realMass
  focusName,               // objectName
  viewMode,                // viewType
  systemScale              // systemScale
)

// All camera distances calculated automatically
const targetDistance = objectProperties.optimalViewDistance
```

## Migration Steps

### 1. Update Component Props

**Old:**
```typescript
interface CameraControllerProps {
  focusObject: THREE.Object3D | null
  focusName?: string | null
  focusRadius?: number
}
```

**New:**  
```typescript
interface UnifiedCameraControllerProps {
  focusObject: THREE.Object3D | null
  focusName?: string | null
  focusRadius?: number
  focusMass?: number           // Add mass data
  focusOrbitRadius?: number    // Add orbit data
  viewMode: ViewType           // Add view mode
  systemScale?: number         // Add system scaling
}
```

### 2. Replace Camera Controller

**Old:**
```typescript
import { CameraController } from './camera-controller'

<CameraController
  focusObject={focusedObject}
  focusName={focusedName}
  focusRadius={focusedObjectRadius}
  ref={cameraControllerRef}
/>
```

**New:**
```typescript
import { UnifiedCameraController } from './unified-camera-controller'

<UnifiedCameraController
  focusObject={focusedObject}
  focusName={focusedName}
  focusRadius={focusedObjectRadius}
  focusMass={focusedObjectMass}
  focusOrbitRadius={focusedObjectOrbitRadius}
  viewMode={currentViewMode}
  systemScale={systemScale}
  ref={cameraControllerRef}
/>
```

### 3. Update Data Passing

Ensure you pass the additional object properties (mass, orbit radius) to the camera controller:

```typescript
// Extract from system data or catalog data
const focusedObjectMass = selectedObjectData?.mass
const focusedObjectOrbitRadius = selectedObjectData?.orbit?.semi_major_axis

// Pass to unified camera controller
<UnifiedCameraController
  // ... other props
  focusMass={focusedObjectMass}
  focusOrbitRadius={focusedObjectOrbitRadius}
/>
```

### 4. Remove Hardcoded Logic

Delete any hardcoded camera logic from other components:

```typescript
// Remove these patterns:
- Name-based object type detection
- Hardcoded distance multipliers
- Hardcoded min/max constraints
- View mode specific camera logic scattered across components
```

## Configuration Customization

### Adjusting View Mode Behavior

To modify how objects behave in different view modes, edit the configurations in `engine/types/view-mode-config.ts`:

```typescript
export const VIEW_MODE_CONFIGS = {
  realistic: {
    objectScaling: {
      star: 1.0,      // Adjust star scaling
      planet: 0.5,    // Adjust planet scaling
      // ...
    },
    cameraConfig: {
      distanceMultipliers: {
        star: 8.0,    // Adjust camera distance for stars
        planet: 3.0,  // Adjust camera distance for planets
        // ...
      },
      viewingAngles: {
        defaultElevation: 30,    // Adjust camera angle
        birdsEyeElevation: 40,   // Adjust birds-eye angle
      },
      // ...
    }
  }
  // ... other view modes
}
```

### Adding New Object Types

To add a new object type (e.g., space stations):

1. **Add to object scaling configs:**
```typescript
objectScaling: {
  // ... existing types
  spaceStation: 0.8,
  default: 1.0
}
```

2. **Add to camera configs:**
```typescript
distanceMultipliers: {
  // ... existing types
  spaceStation: 2.5,
  default: 3.0
},
distanceConstraints: {
  // ... existing types  
  spaceStation: { min: 0.3, max: 15 },
  default: { min: 0.5, max: 20 }
}
```

3. **Update object type determination:**
```typescript
export function determineObjectType(name: string, ...): ObjectType {
  const lowerName = name.toLowerCase()
  
  // Add new detection logic
  if (lowerName.includes('station') || lowerName.includes('outpost')) {
    return 'spaceStation'  
  }
  
  // ... existing logic
}
```

## Testing Migration

### 1. Unit Tests
Run the unified camera system tests:
```bash
npm test engine/components/system-viewer/__tests__/unified-camera-controller.test.ts
```

### 2. Integration Testing
Test camera behavior across all view modes:
- Focus on different object types (stars, planets, moons, gas giants)
- Switch between view modes (realistic ↔ navigational ↔ profile)  
- Verify camera distances are appropriate for each object type
- Test birds-eye view and reset functionality

### 3. Visual Testing
- Compare camera behavior before and after migration
- Ensure smooth transitions between focus targets
- Verify appropriate viewing distances for all object types
- Test edge cases (very small/large objects)

## Benefits After Migration

✅ **Consistent Behavior**: All camera operations use the same underlying logic  
✅ **Maintainable**: Camera behavior centralized in configuration files  
✅ **Extensible**: New view modes and object types easily added  
✅ **Predictable**: No more hardcoded magic numbers or name-based logic  
✅ **Testable**: Configuration-driven system is easier to test and validate  
✅ **Performance**: Eliminates redundant calculations and string comparisons  

## Rollback Plan

If issues arise during migration:

1. **Keep old camera controller** as `legacy-camera-controller.tsx`
2. **Use feature flag** to switch between old and new systems  
3. **Gradual rollout** by view mode (start with one mode, then expand)
4. **Monitor metrics** for camera behavior consistency

## Common Issues

### Missing Object Data
**Problem**: `focusMass` or `focusOrbitRadius` is undefined  
**Solution**: Provide fallback values or enhance data loading to include these properties

### Performance Impact  
**Problem**: Configuration system seems slower than hardcoded logic  
**Solution**: The configuration system is actually faster - it eliminates string comparisons and redundant calculations

### Different Camera Behavior
**Problem**: Camera distances seem different after migration  
**Solution**: This is expected - the new system provides more consistent and appropriate distances. Configurations can be adjusted if needed.

## Support

For questions or issues during migration:
1. Check the comprehensive test suite for expected behavior
2. Review configuration options in `view-mode-config.ts`  
3. Refer to component documentation in context files
4. Test changes incrementally rather than migrating everything at once 