# Camera Framing Consistency System

## Overview

The camera framing consistency system ensures that objects with the same **visual size** in the 3D scene receive the same camera distance, providing consistent visual framing across all view modes and interaction methods.

## Core Principle

**Objects with the same visual size = Same camera distance**

This means that if two objects appear the same size in the 3D scene (regardless of their real-world dimensions), the camera will position itself at the same distance from both objects when focused.

## Key Components

### 1. Visual Size Calculation
- Each view mode calculates different visual sizes for objects
- Explorational mode: Proportional to real size with scaling
- Navigational mode: Standardized sizes by object class
- The visual size determines camera positioning

### 2. Race Condition Prevention
- Breadcrumb navigation calls `handleObjectFocus` then `handleObjectSelect`
- `handleObjectSelect` preserves existing `focusedObjectSize` instead of resetting it
- This prevents the camera from losing the correct visual size

### 3. View Mode Switching
- `currentViewModeFocusSize` automatically calculates correct visual size for current view mode
- Camera controller receives updated `focusSize` when view mode changes
- No manual timeout or async logic needed

## Critical Code Locations

### ⚠️ useObjectSelection Hook
**File**: `engine/components/system-viewer/hooks/use-object-selection.ts`

```typescript
// CRITICAL: Preserve existing focus properties to avoid race conditions
focusedObjectSize: prev.focusedObjectSize, // Preserve existing or will be set by renderer
```

**Warning**: Do NOT reset `focusedObjectSize` to `null` in `handleObjectSelect`. This breaks breadcrumb navigation.

### ⚠️ SystemViewer Component
**File**: `engine/components/system-viewer.tsx`

```typescript
// CRITICAL: Calculate the correct focus size for the current view mode
const currentViewModeFocusSize = useMemo(() => {
  // Gets visual size for current view mode
}, [selectedObjectId, focusedObject, viewType, getObjectSizing, focusedObjectSize])

// CRITICAL: Use currentViewModeFocusSize instead of focusedObjectSize
<UnifiedCameraController focusSize={currentViewModeFocusSize} />
```

**Warning**: Do NOT use `focusedObjectSize` directly in UnifiedCameraController. It contains stale data from previous view modes.

### ⚠️ SystemBreadcrumb Component
**File**: `engine/components/system-viewer/system-breadcrumb.tsx`

```typescript
// CRITICAL: Call onObjectFocus BEFORE onObjectSelect to avoid race conditions
onObjectFocus(object, name, visualSize, radius)
if (onObjectSelect) {
  onObjectSelect(objectId, object, name)
}
```

**Warning**: The order of these calls matters. Focus must set the visual size before select preserves it.

### ⚠️ UnifiedCameraController
**File**: `engine/components/system-viewer/unified-camera-controller.tsx`

```typescript
// CRITICAL: Base camera distance on the VISUAL size with consistent multiplier
const actualVisualSize = focusSize || focusObject.scale?.x || 1.0
```

**Warning**: Do NOT use real radius or view-mode-specific multipliers. This breaks framing consistency.

### ⚠️ Geometry Renderers
**File**: `engine/renderers/geometry-renderers/*.tsx`

```typescript
// CRITICAL: Pass visualSize parameter to onFocus for camera framing consistency
onFocus={(obj, name, visualSize) =>
  onFocus?.(obj, name, visualSize || scale, properties.radius, properties.mass, 0)
}
```

**Warning**: All geometry renderers must pass `visualSize` to maintain consistency.

## Common Pitfalls

### 1. **Using Real Radius for Camera Distance**
```typescript
// ❌ WRONG - breaks consistency
const distance = realRadius * multiplier

// ✅ CORRECT - maintains consistency  
const distance = visualSize * CONSISTENT_MULTIPLIER
```

### 2. **View-Mode-Specific Camera Multipliers**
```typescript
// ❌ WRONG - same visual size gets different distances
const multiplier = viewMode === 'explorational' ? 4.0 : 3.5

// ✅ CORRECT - same visual size gets same distance
const CONSISTENT_MULTIPLIER = 4.0
```

### 3. **Resetting Focus Properties**
```typescript
// ❌ WRONG - loses visual size from breadcrumb navigation
focusedObjectSize: null

// ✅ CORRECT - preserves visual size
focusedObjectSize: prev.focusedObjectSize
```

### 4. **Manual View Mode Switch Logic**
```typescript
// ❌ WRONG - causes race conditions
setTimeout(() => {
  enhancedObjectFocus(object, name, newVisualSize)
}, 100)

// ✅ CORRECT - automatic via memoized value
const currentViewModeFocusSize = useMemo(() => {
  return getObjectSizing(selectedObjectId).visualSize
}, [viewType, selectedObjectId])
```

## Testing the System

To verify camera framing consistency:

1. **Same Visual Size Test**: Focus on objects with same visual size in different view modes - camera distance should be identical
2. **View Mode Switch Test**: Focus on object, switch view modes - camera should adjust automatically
3. **Breadcrumb Test**: Use breadcrumb navigation in different view modes - should get correct distance immediately
4. **Direct Click Test**: Click objects directly - should match breadcrumb behavior

## Debug Information

The system includes debug logging (when enabled) that shows:
- Visual size calculations per view mode
- Camera controller focus parameters
- Race condition prevention in action

Enable debug logging by uncommenting debug statements in the relevant files.

## Maintenance Notes

- Always test camera framing when modifying view mode logic
- Preserve the memoization dependencies in `currentViewModeFocusSize`
- Keep geometry renderers consistent in their `onFocus` parameter passing
- Avoid adding manual focus logic to `setViewType` - it's handled automatically

This system ensures a consistent, predictable camera experience across all interaction methods and view modes. 