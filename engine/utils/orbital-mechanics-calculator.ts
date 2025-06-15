import { ViewType } from '@lib/types/effects-level';
import { CelestialObject, isOrbitData, isBeltOrbitData } from '@/engine/types/orbital-system';

// Simple view mode configurations - FIXED and reliable scaling
export const VIEW_CONFIGS = {
  realistic: {
    maxVisualSize: 2.0,
    minVisualSize: 0.02,
    orbitScaling: 8.0, // Keep realistic as baseline
    safetyMultiplier: 2.5,
    minDistance: 0.1,
  },
  navigational: {
    maxVisualSize: 2.5,
    minVisualSize: 0.05,
    orbitScaling: 6.0, // Adjusted from 4.0 to be more proportional (3/4 of realistic)
    safetyMultiplier: 3.0,
    minDistance: 0.2,
    fixedSizes: {
      star: 2.0,
      planet: 1.2,
      moon: 0.6,
      asteroid: 0.3,
      belt: 0.8,
      barycenter: 0.0,
    },
  },
  profile: {
    maxVisualSize: 1.5,
    minVisualSize: 0.03,
    orbitScaling: 4.0, // Adjusted from 2.5 to be more proportional (1/2 of realistic)
    safetyMultiplier: 3.5,
    minDistance: 0.3,
    fixedSizes: {
      star: 1.5,
      planet: 0.8,
      moon: 0.4,
      asteroid: 0.2,
      belt: 0.6,
      barycenter: 0.0,
    },
  },
};

// Memoized results - calculate once, use forever
let memoizedResults: Map<string, {
  visualRadius: number;
  orbitDistance?: number;
  beltData?: { innerRadius: number; outerRadius: number; centerRadius: number };
}> | null = null;

let lastCalculationKey = '';

/**
 * Generate a key for memoization based on objects and view type
 */
function generateCalculationKey(objects: CelestialObject[], viewType: ViewType): string {
  const objectsKey = objects.map(obj => `${obj.id}-${obj.properties.radius}-${obj.orbit?.parent || 'root'}`).join('|');
  return `${viewType}-${objectsKey}`;
}

/**
 * Calculate visual radius for an object with proportional parent-child scaling
 */
function calculateVisualRadius(
  object: CelestialObject, 
  viewType: ViewType, 
  sizeAnalysis: { logMinRadius: number; logRange: number },
  allObjects: CelestialObject[],
  results: Map<string, any>
): number {
  const config = VIEW_CONFIGS[viewType];
  const radiusKm = object.properties.radius || 1;
  
  // Use fixed sizes for non-realistic modes - IMPROVED CLASSIFICATION LOGIC
  if (viewType !== 'realistic' && 'fixedSizes' in config) {
    // Use geometry_type for better differentiation, fallback to classification
    let sizeKey = object.classification || 'asteroid';
    
    // Special handling for gas giants vs terrestrial planets
    if (object.classification === 'planet') {
      if (object.geometry_type === 'gas_giant') {
        // Gas giants get larger size - use planet size * 1.5
        const planetSize = config.fixedSizes.planet || 1.2;
        return planetSize * 1.5; // Gas giants are 1.5x terrestrial planets
      } else {
        sizeKey = 'planet'; // terrestrial planets
      }
    }
    
    // Get fixed size by classification
    let fixedSize = config.fixedSizes[sizeKey as keyof typeof config.fixedSizes];
    
    // Final fallback to asteroid size if classification not found
    if (fixedSize === undefined) {
      fixedSize = config.fixedSizes.asteroid;
    }
    
    return fixedSize;
  }
  
  // REALISTIC MODE: Implement proportional parent-child scaling
  if (viewType === 'realistic') {
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
    
    // For non-child objects (planets and stars), use logarithmic scaling
    if (radiusKm <= 0) return config.minVisualSize;
    
    const logRadius = Math.log10(radiusKm);
    const normalizedSize = Math.max(0, Math.min(1, (logRadius - sizeAnalysis.logMinRadius) / sizeAnalysis.logRange));
    
    return config.minVisualSize + (normalizedSize * (config.maxVisualSize - config.minVisualSize));
  }
  
  // Fallback to original logarithmic scaling
  if (radiusKm <= 0) return config.minVisualSize;
  
  const logRadius = Math.log10(radiusKm);
  const normalizedSize = Math.max(0, Math.min(1, (logRadius - sizeAnalysis.logMinRadius) / sizeAnalysis.logRange));
  
  return config.minVisualSize + (normalizedSize * (config.maxVisualSize - config.minVisualSize));
}

/**
 * Analyze system size range for logarithmic scaling
 */
function analyzeSystemSizes(objects: CelestialObject[]): { logMinRadius: number; logRange: number } {
  let minRadius = Infinity;
  let maxRadius = 0;
  
  for (const obj of objects) {
    const radius = obj.properties.radius || 1;
    if (radius > 0) {
      minRadius = Math.min(minRadius, radius);
      maxRadius = Math.max(maxRadius, radius);
    }
  }
  
  if (minRadius === Infinity) minRadius = 1;
  if (maxRadius === 0) maxRadius = 1000;
  if (maxRadius / minRadius < 10) maxRadius = minRadius * 10;
  
  const logMinRadius = Math.log10(minRadius);
  const logMaxRadius = Math.log10(maxRadius);
  const logRange = Math.max(logMaxRadius - logMinRadius, 1);
  
  return { logMinRadius, logRange };
}

/**
 * Calculate the effective orbital radius of an object including its moons
 * This is the radius that other objects need to clear when orbiting the same parent
 */
function calculateEffectiveOrbitalRadius(
  object: CelestialObject,
  allObjects: CelestialObject[],
  results: Map<string, any>,
  config: any
): number {
  const objectVisualRadius = results.get(object.id)?.visualRadius || 0;

  // Handle belts specifically: their effective radius is their outer_radius
  if (object.orbit && isBeltOrbitData(object.orbit)) {
    const beltData = results.get(object.id)?.beltData;
    if (beltData) {
      // The effective radius for a belt should be its outer radius from the parent
      // This is crucial for other objects to clear the entire belt.
      return beltData.outerRadius;
    }
  }
  
  // Find all moons orbiting this object
  const moons = allObjects.filter(moon => 
    moon.orbit?.parent === object.id && isOrbitData(moon.orbit)
  );
  
  if (moons.length === 0) {
    // No moons, just return the object's visual radius
    return objectVisualRadius;
  }
  
  // Find the outermost moon orbit
  let outermostMoonDistance = 0;
  for (const moon of moons) {
    if (moon.orbit && isOrbitData(moon.orbit)) {
      const moonOrbitDistance = (results.get(moon.id)?.orbitDistance !== undefined)
        ? (results.get(moon.id)!.orbitDistance as number)
        : moon.orbit.semi_major_axis * config.orbitScaling;
      const moonVisualRadius = results.get(moon.id)?.visualRadius || 0;
      
      // The moon's outer edge is its orbit distance plus its visual radius
      const moonOuterEdge = moonOrbitDistance + moonVisualRadius;
      outermostMoonDistance = Math.max(outermostMoonDistance, moonOuterEdge);
    }
  }
  
  // Return the larger of the object's visual radius or its outermost moon system
  return Math.max(objectVisualRadius, outermostMoonDistance);
}

/**
 * Calculate the effective orbital clearance needed for an object
 * This includes the object's own radius plus any moons it might have
 */
function calculateEffectiveOrbitalClearance(
  object: CelestialObject,
  allObjects: CelestialObject[],
  results: Map<string, any>,
  config: any
): number {
  const objectVisualRadius = results.get(object.id)?.visualRadius || 0;
  
  // Find all moons that will orbit this object
  const moons = allObjects.filter(moon => 
    moon.orbit?.parent === object.id && isOrbitData(moon.orbit)
  );
  
  if (moons.length === 0) {
    // No moons, just return the object's visual radius
    return objectVisualRadius;
  }
  
  // Find the innermost moon orbit (this determines minimum clearance needed)
  let innermostMoonDistance = Infinity;
  for (const moon of moons) {
    if (moon.orbit && isOrbitData(moon.orbit)) {
      const moonOrbitDistance = (results.get(moon.id)?.orbitDistance !== undefined)
        ? (results.get(moon.id)!.orbitDistance as number)
        : moon.orbit.semi_major_axis * config.orbitScaling;
      const moonVisualRadius = results.get(moon.id)?.visualRadius || 0;
      
      // The moon's inner edge is its orbit distance minus its visual radius
      const moonInnerEdge = moonOrbitDistance - moonVisualRadius;
      innermostMoonDistance = Math.min(innermostMoonDistance, moonInnerEdge);
    }
  }
  
  // If we have moons, we need clearance to the innermost moon's inner edge
  // Otherwise, just use the object's visual radius
  return innermostMoonDistance === Infinity ? objectVisualRadius : innermostMoonDistance;
}

/**
 * Calculate absolute position of an object from the system center
 */
function calculateAbsolutePosition(
  object: CelestialObject,
  objects: CelestialObject[],
  results: Map<string, any>
): number {
  if (!object.orbit?.parent) {
    // Root object (star) is at position 0
    return 0;
  }
  
  // Find parent and get its absolute position
  const parent = objects.find(obj => obj.id === object.orbit!.parent);
  if (!parent) return 0;
  
  const parentAbsolutePosition = calculateAbsolutePosition(parent, objects, results);
  // For belts, use the centerRadius from beltData, otherwise use orbitDistance
  const objectOrbitDistance = (object.orbit && isBeltOrbitData(object.orbit))
    ? results.get(object.id)?.beltData?.centerRadius || 0
    : results.get(object.id)?.orbitDistance || 0;
  
  return parentAbsolutePosition + objectOrbitDistance;
}

/**
 * Global collision detection and adjustment
 * Ensures no moon systems extend beyond other planetary orbits
 */
function adjustForGlobalCollisions(
  objects: CelestialObject[],
  viewType: ViewType,
  results: Map<string, any>,
  config: any
): void {
  // Get all objects that orbit the primary star (planets, belts)
  const primaryStar = objects.find(obj => !obj.orbit?.parent);
  if (!primaryStar) return;
  
  const primaryOrbiters = objects.filter(obj => obj.orbit?.parent === primaryStar.id);
  
  // Sort by absolute position
  const sortedOrbiters = primaryOrbiters.map(obj => ({
    object: obj,
    absolutePosition: calculateAbsolutePosition(obj, objects, results),
    outermostEffectiveRadius: calculateEffectiveOrbitalRadius(obj, objects, results, config),
    innermostEffectiveRadius: calculateEffectiveOrbitalClearance(obj, objects, results, config)
  })).sort((a, b) => a.absolutePosition - b.absolutePosition);
  
  // Check for overlaps and adjust
  for (let i = 1; i < sortedOrbiters.length; i++) {
    const current = sortedOrbiters[i];
    const previous = sortedOrbiters[i - 1];
    
    // The outer edge of the previous object's system
    const previousOuterEdge = previous.absolutePosition + previous.outermostEffectiveRadius;
    
    // The required center of the current object's orbit
    const requiredCenterPosition = previousOuterEdge + config.minDistance + current.innermostEffectiveRadius;

    if (current.absolutePosition < requiredCenterPosition) {
      // Collision detected! Adjust this object's orbit
      const adjustment = requiredCenterPosition - current.absolutePosition;
      const currentOrbitDistance = results.get(current.object.id)?.orbitDistance || 0;
      
      results.get(current.object.id)!.orbitDistance = currentOrbitDistance + adjustment;
      
      // Update the sorted array for subsequent checks
      current.absolutePosition = requiredCenterPosition;
      // Recalculate effective radius if orbit distance changed, as it depends on it.
      // This recursive call ensures that if an adjustment causes further ripple effects,
      // they are also accounted for.
      current.outermostEffectiveRadius = calculateEffectiveOrbitalRadius(current.object, objects, results, config);
      current.innermostEffectiveRadius = calculateEffectiveOrbitalClearance(current.object, objects, results, config);
    }
  }
}

/**
 * Simple orbit clearing algorithm - the heart of the system
 */
function calculateClearedOrbits(
  objects: CelestialObject[],
  results: Map<string, any>,
  config: typeof VIEW_CONFIGS[keyof typeof VIEW_CONFIGS]
): void {
  // Group objects by parent
  const parentGroups = new Map<string, CelestialObject[]>();
  
  for (const obj of objects) {
    if (obj.orbit?.parent) {
      const parentId = obj.orbit.parent;
      if (!parentGroups.has(parentId)) {
        parentGroups.set(parentId, []);
      }
      parentGroups.get(parentId)!.push(obj);
    }
  }
  
  // Process each parent's children
  parentGroups.forEach((children, parentId) => {
    const parent = objects.find(obj => obj.id === parentId);
    if (!parent) return;
    
    const parentVisualRadius = results.get(parentId)?.visualRadius || 0;
    
    // Sort children by their original orbital distance (AU)
    children.sort((a, b) => {
      const aAU = a.orbit && isOrbitData(a.orbit) ? a.orbit.semi_major_axis : 
                  a.orbit && isBeltOrbitData(a.orbit) ? a.orbit.inner_radius : 0;
      const bAU = b.orbit && isOrbitData(b.orbit) ? b.orbit.semi_major_axis :
                  b.orbit && isBeltOrbitData(b.orbit) ? b.orbit.inner_radius : 0;
      return aAU - bAU;
    });
    
    // Start placing orbits after the parent's safe zone
    let nextAvailableDistance = Math.max(
      parentVisualRadius * config.safetyMultiplier,
      config.minDistance
    );

    // Keep track of previously placed child so we can account for its full size
    let previousChild: { actualDistance: number; effectiveRadius: number } | null = null;

    for (const child of children) {
      const childVisualRadius = results.get(child.id)?.visualRadius || 0;

      if (child.orbit && isOrbitData(child.orbit)) {
        // Regular orbit - desired position based on raw AU scaling
        const desiredDistance = child.orbit.semi_major_axis * config.orbitScaling;

        // Minimum inner edge required for this child to not intersect the previous object's system
        // `previousChild.actualDistance + previousChild.effectiveRadius` is the outer edge of the previous system.
        // `config.minDistance` is the required clearance.
        const requiredInnerEdge = previousChild
          ? previousChild.actualDistance + previousChild.effectiveRadius + config.minDistance
          : nextAvailableDistance; // For the very first child, this is based on parent's safe zone

        // The center of the child's orbit should be its required inner edge plus its visual radius
        const requiredCenter = requiredInnerEdge + childVisualRadius;

        // The actual distance (center of orbit) should be at least its desired distance, and
        // also at least the required center to avoid collision.
        const actualDistance = Math.max(desiredDistance, requiredCenter);

        // Record the final orbit distance
        results.get(child.id)!.orbitDistance = actualDistance;

        // How much space does this object (plus moons) need
        const effectiveOrbitalRadius = calculateEffectiveOrbitalRadius(child, objects, results, config);

        // Update trackers for the next child in the loop
        previousChild = {
          actualDistance,
          effectiveRadius: effectiveOrbitalRadius,
        };

        // Next orbit must clear this object's entire system with a small margin
        // This nextAvailableDistance now represents the *outer edge* of the current object's system + minDistance
        nextAvailableDistance = actualDistance + effectiveOrbitalRadius + config.minDistance;

      } else if (child.orbit && isBeltOrbitData(child.orbit)) {
        // Belt objects
        const desiredInnerRadius = child.orbit.inner_radius * config.orbitScaling;
        const desiredOuterRadius = child.orbit.outer_radius * config.orbitScaling;
        const beltWidth = desiredOuterRadius - desiredInnerRadius;

        // Also account for previous object clearance
        const clearanceFromPrevious = previousChild
          ? previousChild.actualDistance + previousChild.effectiveRadius + config.minDistance
          : 0;

        const actualInnerRadius = Math.max(desiredInnerRadius, nextAvailableDistance, clearanceFromPrevious);
        const actualOuterRadius = actualInnerRadius + Math.max(beltWidth, config.minDistance); // Ensure minimum belt width

        results.set(child.id, {
          ...results.get(child.id),
          beltData: {
            innerRadius: actualInnerRadius,
            outerRadius: actualOuterRadius,
            centerRadius: (actualInnerRadius + actualOuterRadius) / 2,
          }
        });

        previousChild = {
          actualDistance: (actualInnerRadius + actualOuterRadius) / 2,
          effectiveRadius: (actualOuterRadius - actualInnerRadius) / 2,
        };

        // Next orbit must clear the belt's outer edge
        nextAvailableDistance = actualOuterRadius + config.minDistance;
      }
    }
  });
}

/**
 * Enforce parent-child size hierarchy while preserving view mode design intentions
 */
function enforceParentChildSizeHierarchy(
  objects: CelestialObject[],
  results: Map<string, any>,
  viewType: ViewType
): void {
  const config = VIEW_CONFIGS[viewType];
  
  // Build parent-child relationships
  const parentChildMap = new Map<string, string[]>();
  
  objects.forEach(obj => {
    if (obj.orbit?.parent) {
      const parent = obj.orbit.parent;
      if (!parentChildMap.has(parent)) {
        parentChildMap.set(parent, []);
      }
      parentChildMap.get(parent)!.push(obj.id);
    }
  });
  
  // Process each parent-child relationship
  parentChildMap.forEach((childIds, parentId) => {
    const parentData = results.get(parentId);
    const parentObj = objects.find(o => o.id === parentId);
    
    if (!parentData || !parentObj) return;
    
    childIds.forEach(childId => {
      const childData = results.get(childId);
      const childObj = objects.find(o => o.id === childId);
      
      if (!childData || !childObj) return;
      
      // Skip belts and rings - they are exceptions to hierarchy rules
      const isException = childObj.classification === 'belt' || 
                         childObj.classification === 'ring' ||
                         childObj.geometry_type === 'belt' ||
                         childObj.geometry_type === 'ring';
      
      if (isException) return;
      
      // Check if parent is larger than child
      if (parentData.visualRadius <= childData.visualRadius) {
        // Calculate minimum parent size to maintain hierarchy
        const minParentSize = childData.visualRadius * 1.2; // Parent should be at least 20% larger
        
        // Don't make the parent too large - respect view mode constraints
        const maxAllowedParentSize = viewType === 'realistic' 
          ? Math.min(minParentSize, config.maxVisualSize)
          : minParentSize;
        
        // Update parent size
        parentData.visualRadius = maxAllowedParentSize;
        
        // If parent is now too large for realistic mode orbital mechanics, 
        // we need to scale down the child instead
        if (viewType === 'realistic' && parentObj.classification === 'star' && maxAllowedParentSize > 1.0) {
          // For stars in realistic mode, prefer to scale down children rather than make star too large
          const maxStarSize = 1.0; // Max star size for orbital mechanics
          const scaleDownFactor = maxStarSize / maxAllowedParentSize;
          
          // Scale down the star
          parentData.visualRadius = maxStarSize;
          
          // Scale down all children proportionally
          childIds.forEach(childId => {
            const childData = results.get(childId);
            const childObj = objects.find(o => o.id === childId);
            
            if (childData && childObj) {
              const isChildException = childObj.classification === 'belt' || 
                                     childObj.classification === 'ring' ||
                                     childObj.geometry_type === 'belt' ||
                                     childObj.geometry_type === 'ring';
              
              if (!isChildException) {
                childData.visualRadius = Math.max(
                  childData.visualRadius * scaleDownFactor * 0.8, // 80% of scaled size to maintain hierarchy
                  config.minVisualSize
                );
              }
            }
          });
        }
      }
    });
  });
}

/**
 * Main function - calculate everything once and memoize
 */
export function calculateSystemOrbitalMechanics(
  objects: CelestialObject[],
  viewType: ViewType
): Map<string, {
  visualRadius: number;
  orbitDistance?: number;
  beltData?: { innerRadius: number; outerRadius: number; centerRadius: number };
}> {
  // Check if we can use memoized results
  const calculationKey = generateCalculationKey(objects, viewType);
  if (memoizedResults && lastCalculationKey === calculationKey) {
    return memoizedResults;
  }
  
  const results = new Map();
  
  // Step 1: Calculate all visual sizes first
  const sizeAnalysis = analyzeSystemSizes(objects);
  
  // Process in parent-first order to ensure parent radii are calculated before children
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
  
  // Step 2: Use FIXED orbital scaling - no more dynamic scaling
  const config = { ...VIEW_CONFIGS[viewType] };
  // REMOVED: Dynamic orbital scaling that was causing issues
  
  // Step 3: Calculate cleared orbital positions
  calculateClearedOrbits(objects, results, config);
  
  // Step 4: Global collision detection and adjustment
  adjustForGlobalCollisions(objects, viewType, results, config);
  
  // Step 5: Enforce parent-child size hierarchy
  enforceParentChildSizeHierarchy(objects, results, viewType);
  
  // Memoize the results
  memoizedResults = results;
  lastCalculationKey = calculationKey;
  
  return results;
}

/**
 * Clear memoized results (call when system data changes)
 */
export function clearOrbitalMechanicsCache(): void {
  memoizedResults = null;
  lastCalculationKey = '';
}

// Export the main calculation function for external use
export { calculateVisualRadius };