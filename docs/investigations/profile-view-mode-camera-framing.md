# Profile View Mode Camera Framing Investigation

**Date**: 2025-06-21  
**Issue**: Objects with moons not being framed properly in profile view mode  
**Status**: Root cause identified - Race condition between camera framing and orbital positioning  
**Confidence Level**: Very High  

## Problem Statement

In profile view mode, objects like Mercury and Venus (without moons) are framed properly by the camera. However, objects with moons (Earth, Mars, Jupiter, etc.) show the planet not even in frame, with the camera appearing to point at nothing/empty space.

## Investigation Methodology

Two parallel agent-based investigations were conducted:
1. **Agent 1**: Camera framing logic analysis
2. **Agent 2**: Object positioning system analysis

## Key Findings

### Agent 1: Camera Framing Logic Analysis

**Primary Discovery**: Parent-child relationship matching failure in `engine/components/system-viewer/unified-camera-controller.tsx`

#### Evidence:
- Lines 363-370: The code attempts to find child objects (moons) using:
  ```typescript
  const childObjects = systemData.objects?.filter((obj: any) => 
    obj.orbit?.parent === focusName.toLowerCase() || 
    obj.orbit?.parent === focusedObjectId
  ) || []
  ```

- **Issue**: Moon objects likely have `orbit.parent` set to the planet's ID format (e.g., "earth-planet"), not just the name ("earth")
- **Result**: System incorrectly thinks planets have no children
- **Consequence**: Triggers fake outermost point logic (lines 407-439) instead of proper multi-object framing

#### Fake Offset Logic Problem:
When no children are found, the camera creates a fake outermost point very close to the focal object:
```typescript
const objectScale = focusObject?.scale?.x || 1.0
const fakeOffset = objectScale * 3
outermostCenter = focalCenter.clone().add(new THREE.Vector3(fakeOffset, 0, 0))
```

This results in camera positioning that misses the actual moons.

### Agent 2: Object Positioning System Analysis

**Primary Discovery**: Nested coordinate system complications in orbital positioning

#### Evidence:
- `OrbitalPath` component creates nested coordinate systems for moon objects
- Lines 251-256 in `orbital-path.tsx`:
  ```typescript
  const parent = objectRefsMap.current.get(parentObjectId)
  if (parent && groupRef.current.position) {
    const parentWorldPos = new THREE.Vector3()
    parent.getWorldPosition(parentWorldPos)
    groupRef.current.position.copy(parentWorldPos)
  }
  ```

- **Issue**: Moons are positioned in a nested coordinate space relative to their parent planet
- **Result**: Camera framing calculations may not properly account for coordinate transformations

## Root Cause Analysis - UPDATED

### Initial Hypothesis (Disproven)
**Parent-child relationship ID matching failure** was initially suspected but testing proved this works correctly.

### Actual Root Cause (Very High Confidence)
**Race condition between camera framing and orbital positioning**

#### Evidence from Testing:
1. **Parent-child matching works correctly** - Tests show the matching logic properly finds moons
2. **The real issue is timing** - Camera frames objects before moon positions are updated

#### The Race Condition:
1. **Camera Effect** (`unified-camera-controller.tsx` line 338):
   - Uses `requestAnimationFrame` to wait one frame
   - Expects moon positions to be set after this wait
   
2. **Orbital Path Effect** (`orbital-path.tsx` line 247-256):
   - Sets moon group positions to parent's world position
   - Runs in a separate useEffect that may execute AFTER camera framing

#### What Happens:
1. Profile mode is activated
2. Camera effect runs and waits one frame via `requestAnimationFrame`
3. Camera calculates positions - moons are still at origin (0,0,0)
4. Camera frames incorrect midpoint between planet and origin
5. THEN orbital path effect runs, moving moons to correct positions
6. But camera has already framed the wrong location

### Why It Works for Objects Without Moons:
- No timing dependency on child object positioning
- Camera correctly frames the single object
- No race condition can occur

## Impact Analysis

### Working Cases:
- **Mercury, Venus**: Work correctly because they genuinely have no children
- Fake outermost point logic creates reasonable framing distance
- Camera positioned to show single object properly

### Failing Cases:
- **Earth, Mars, Jupiter, etc.**: Fail because:
  1. Parent-child relationship matching fails due to ID format mismatches
  2. System incorrectly treats planets as having no children  
  3. Fake outermost point created close to planet
  4. Camera frames space between planet and fake point
  5. Actual moons positioned correctly but outside camera view

## Supporting Code Locations

### Key Files:
- `engine/components/system-viewer/unified-camera-controller.tsx` (lines 324-485, 625-760)
- `engine/core/view-modes/strategies/profile-strategy.ts` (lines 190-259)
- `engine/components/system-viewer/profile-layout-controller.tsx` (lines 47-50)
- `engine/components/system-viewer/components/orbital-path/orbital-path.tsx` (lines 251-256)

### Inconsistency Evidence:
The `profile-layout-controller.tsx` uses only `focalObjectId` for parent matching:
```typescript
const orbitingBodies = systemData.objects.filter(obj => 
  obj.orbit && 'parent' in obj.orbit && obj.orbit.parent === focalObjectId
)
```

While `unified-camera-controller.tsx` uses both name and ID, potentially causing inconsistencies.

## Recommended Fix Strategy

1. **Primary Fix**: Ensure orbital positions are set before camera framing
   - Option A: Add a longer delay or multiple RAF calls in camera controller
   - Option B: Use a coordination mechanism to ensure orbital positions are ready
   - Option C: Move moon positioning logic to run synchronously before camera framing

2. **Specific Implementation**: Modify `unified-camera-controller.tsx`:
   - Instead of single `requestAnimationFrame`, wait for orbital positions to be confirmed
   - Could use a promise-based approach or check for position updates
   
3. **Alternative Approach**: Modify `orbital-path.tsx`:
   - Set parent positions synchronously during render instead of in useEffect
   - Or dispatch an event when positions are updated that camera can listen for

4. **Testing**: Create integration tests that verify:
   - Moon positions are correct when camera frames
   - No race conditions occur across different React render timings

## Validation Approach

The fix can be validated by:
1. Verifying moon world positions are correct when camera frames (not at origin)
2. Testing camera framing for Earth, Mars, Jupiter in profile view mode
3. Ensuring moons are visible and properly framed alongside their parent planets
4. Creating timing tests that confirm no race conditions occur
5. Testing with different React render orders and timing scenarios

## Test Results Summary

**Tests Created:**
- ✅ `profile-view-parent-matching-logic.test.ts` - Confirms parent-child matching works
- ✅ `profile-view-timing-issue.test.ts` - Demonstrates timing scenarios
- ✅ `profile-view-race-condition.test.tsx` - Shows race condition effects
- ✅ `profile-view-race-condition-fix.test.tsx` - Tests fix approach
- ✅ `profile-view-fix-validation.test.ts` - Validates fix implementation

**Key Insights:**
- Parent-child matching is NOT the issue (all tests pass)
- The issue is confirmed to be a race condition in React useEffect timing
- Camera frames before orbital positions are updated

## Fix Implementation

**Applied Fix**: Modified `unified-camera-controller.tsx` lines 337-394

### What the Fix Does:
1. **Adaptive Waiting**: Instead of single `requestAnimationFrame`, waits intelligently
2. **Position Validation**: Checks if child objects are positioned correctly (not at origin)
3. **Safety Timeout**: Maximum 10 frames to prevent infinite loops
4. **Debug Logging**: Enhanced logging to track positioning progress

### Code Changes:
```typescript
// OLD (single frame wait):
requestAnimationFrame(() => {
  // Camera framing logic here
})

// NEW (adaptive wait for positioning):
const waitForOrbitalPositions = async () => {
  await new Promise(resolve => requestAnimationFrame(resolve))
  
  if (hasChildObjects) {
    let waitFrames = 0
    while (waitFrames < 10) {
      await new Promise(resolve => requestAnimationFrame(resolve))
      
      if (allChildrenPositionedCorrectly) {
        break
      }
      waitFrames++
    }
  }
}

waitForOrbitalPositions().then(() => {
  // Camera framing logic here
})
```

### Fix Validation:
- ✅ Objects without moons work immediately (no waiting)
- ✅ Objects with moons wait for proper positioning
- ✅ Safety timeout prevents infinite loops
- ✅ Debug logging confirms positioning status

## Investigation Quality Metrics

- **Coverage**: Analyzed both camera logic and positioning systems
- **Evidence Quality**: Specific code line references and logic flows identified
- **Reproducibility**: Issue affects all objects with moons consistently
- **Root Cause Confidence**: High - supported by multiple code analysis points