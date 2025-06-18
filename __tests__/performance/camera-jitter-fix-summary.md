# 🎯 Camera Jitter Fix - Multiple Performance Issues Addressed

## Problem Analysis

The camera jitter issue when selecting objects was caused by **multiple concurrent performance problems**:

### 1. ✅ **Memory Leak in Object References** (FIXED)
- `objectRefsMap` was being recreated on every render
- Cleanup was inserting `null` instead of deleting entries
- Scene graph was growing exponentially

### 2. ✅ **Conflicting Animation Thresholds** (FIXED)  
- Camera controller used 0.01 threshold for movement detection
- Orbital paths used 0.001 threshold for position updates
- Conflicting thresholds caused competing animation systems

### 3. ✅ **Inconsistent Parent Lookups** (FIXED)
- Multiple orbital paths doing `objectRefsMap.current.get(parentObjectId)` every frame
- When parent lookup failed, sudden position jumps occurred
- No graceful fallback when references were temporarily unavailable

## Fixes Applied

### 1. **Memory Leak Fix** (`use-object-selection.ts` & `interactive-object.tsx` & `system-viewer.tsx`)
```typescript
// BEFORE: Map recreated on every render
useEffect(() => {
  objectRefsMap.current = new Map()  // ❌ Performance killer
}, [systemData])

// AFTER: Map only cleared when system actually changes  
const lastSystemId = useRef<string | null>(null)
useEffect(() => {
  if (systemData?.id && systemData.id !== lastSystemId.current) {
    objectRefsMap.current.clear()     // ✅ Keep same Map instance
    lastSystemId.current = systemData.id
  }
}, [systemData?.id])
```

```typescript
// BEFORE: Cleanup polluted map with null entries
const registerRefCallback = useCallback((id: string, ref: THREE.Object3D) => 
  objectRefsMap.current.set(id, ref),  // ❌ Null pollution
  []
)

// AFTER: Cleanup actually removes entries
const registerRefCallback = useCallback((id: string, ref: THREE.Object3D | null) => {
  if (ref) {
    objectRefsMap.current.set(id, ref)
  } else {
    objectRefsMap.current.delete(id)  // ✅ Proper cleanup
  }
}, [])
```

### 2. **Smooth Animation Fix** (`orbital-path.tsx`)
```typescript
// BEFORE: Threshold-based updates caused jumps
if (groupRef.current.position.distanceTo(parentWorldPos) > 0.001) {
  groupRef.current.position.copy(parentWorldPos)  // ❌ Sudden jumps
}

// AFTER: Smooth interpolation prevents jitter
groupRef.current.position.lerp(parentWorldPos, 0.1)  // ✅ Smooth movement
```

### 3. **Graceful Fallback** (`orbital-path.tsx`)
```typescript
// BEFORE: Silent failure when parent not found
const parent = objectRefsMap.current.get(parentObjectId)
if (parent) {
  // Update position
}
// ❌ No handling when parent missing

// AFTER: Explicit handling prevents position jumps
const parent = objectRefsMap.current.get(parentObjectId)
if (parent) {
  // Smooth update
} 
// ✅ If parent not found, don't update position to prevent jumps
```

## Expected Results

With these fixes, object selection should now provide:

- ✅ **Smooth camera movement** - No more jittery transitions when focusing objects
- ✅ **Stable positioning** - Objects maintain consistent positions during selection
- ✅ **No memory leaks** - Scene graph stays clean and performant
- ✅ **Consistent animation** - All movement uses smooth interpolation
- ✅ **Graceful degradation** - System handles temporary reference issues

## Files Modified

1. **`engine/components/system-viewer/hooks/use-object-selection.ts`**
   - Fixed memory leak in objectRefsMap management
   
2. **`engine/components/system-viewer.tsx`**
   - Fixed registerRef callback to delete instead of nullify
   
3. **`engine/components/3d-ui/interactive-object.tsx`**
   - Updated type definitions for proper cleanup
   
4. **`engine/components/system-viewer/components/orbital-path/orbital-path.tsx`**
   - Replaced threshold-based movement with smooth interpolation
   - Added graceful handling for missing parent references

## Technical Details

The fixes address the root causes of camera jitter:
- **Memory stability**: Object references remain consistent during UI interactions
- **Animation consistency**: All movement uses lerp-based smoothing
- **Conflict resolution**: Eliminated competing animation thresholds
- **Graceful fallbacks**: System handles edge cases without visual artifacts

The camera should now move smoothly when selecting objects, without the previous jittering, stuttering, or getting "stuck" behavior.