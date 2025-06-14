import { ViewType } from '@lib/types/effects-level';
import { CelestialObject, isOrbitData, isBeltOrbitData } from '@/engine/types/orbital-system';

// Constants for minimum safe orbital distances
const ORBITAL_SAFETY_MULTIPLIERS = {
  // Minimum multiplier of parent visual radius for orbital distance  
  realistic: 2.5,      // Realistic mode: 2.5x parent radius minimum
  navigational: 3.0,   // Navigational mode: 3x parent radius minimum
  profile: 3.5,        // Profile mode: 3.5x parent radius minimum (more spacing needed)
};

// Minimum absolute orbital distances (in visual units)
const MIN_ORBITAL_DISTANCES = {
  realistic: 0.1,      // Minimum 0.1 units
  navigational: 0.2,   // Minimum 0.2 units  
  profile: 0.3,        // Minimum 0.3 units
};

// Object classification for fallback logic only
export type ObjectClass = 'star' | 'planet' | 'moon' | 'asteroid' | 'belt' | 'barycenter';

// View mode configurations - now focused on size ranges rather than object types
interface ViewModeScaling {
  // Visual size range for the system (largest to smallest object)
  maxVisualSize: number;
  minVisualSize: number;
  // Orbital distance scaling factors (from AU to visual units)
  orbitScaling: number;
  // Fixed sizes for non-realistic modes by object type (fallback only)
  fixedSizes?: {
    star: number;
    planet: number;
    moon: number;
    asteroid: number;
    belt: number;
    barycenter: number;
  };
}

const VIEW_MODE_SCALINGS: Record<ViewType, ViewModeScaling> = {
  realistic: {
    maxVisualSize: 2.0,      // Largest object (usually star) gets this size
    minVisualSize: 0.02,     // Smallest object gets this size  
    orbitScaling: 8.0,       // Scale AU distances to match visual object scale (1 AU = 8 visual units)
  },
  navigational: {
    maxVisualSize: 2.5,      // Slightly larger for navigation
    minVisualSize: 0.05,     // Slightly larger minimum for visibility
    orbitScaling: 0.6,       // Compress orbits for better navigation
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
    maxVisualSize: 1.5,      // Smaller for profile view
    minVisualSize: 0.03,     // Smaller minimum for profile
    orbitScaling: 0.4,       // More compressed for profile view
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

// System size analysis results
interface SystemSizeAnalysis {
  minRadius: number;      // Smallest object radius in km
  maxRadius: number;      // Largest object radius in km
  logMinRadius: number;   // log10 of smallest radius
  logMaxRadius: number;   // log10 of largest radius
  logRange: number;       // Range of log values
}

/**
 * Analyzes the size range of all objects in a system
 */
function analyzeSystemSizes(objects: CelestialObject[]): SystemSizeAnalysis {
  let minRadius = Infinity;
  let maxRadius = 0;
  
  for (const obj of objects) {
    const radius = obj.properties.radius || 1;
    if (radius > 0) {
      minRadius = Math.min(minRadius, radius);
      maxRadius = Math.max(maxRadius, radius);
    }
  }
  
  // Ensure we have valid ranges
  if (minRadius === Infinity) minRadius = 1;
  if (maxRadius === 0) maxRadius = 1000;
  
  // Ensure minimum range for log scaling
  if (maxRadius / minRadius < 10) {
    maxRadius = minRadius * 10;
  }
  
  const logMinRadius = Math.log10(minRadius);
  const logMaxRadius = Math.log10(maxRadius);
  const logRange = logMaxRadius - logMinRadius;
  
  return {
    minRadius,
    maxRadius,
    logMinRadius,
    logMaxRadius,
    logRange: Math.max(logRange, 1), // Ensure minimum range
  };
}

/**
 * Calculates unified visual radius using logarithmic scaling
 * This ensures proper proportional relationships regardless of object type
 */
function calculateUnifiedVisualRadius(
  radiusKm: number,
  sizeAnalysis: SystemSizeAnalysis,
  viewConfig: ViewModeScaling
): number {
  if (radiusKm <= 0) return viewConfig.minVisualSize;
  
  // Use logarithmic scaling to handle the huge range of celestial object sizes
  const logRadius = Math.log10(radiusKm);
  
  // Normalize to 0-1 range based on system's size range
  const normalizedSize = (logRadius - sizeAnalysis.logMinRadius) / sizeAnalysis.logRange;
  
  // Clamp to valid range
  const clampedSize = Math.max(0, Math.min(1, normalizedSize));
  
  // Map to visual size range
  const visualRadius = viewConfig.minVisualSize + 
    (clampedSize * (viewConfig.maxVisualSize - viewConfig.minVisualSize));
  
  return visualRadius;
}

/**
 * Classifies an object based on its properties (for fallback logic only)
 */
export function classifyObject(object: CelestialObject): ObjectClass {
  const classification = object.classification;
  const radius = object.properties.radius || 1;
  
  switch (classification) {
    case 'star':
      return 'star';
    case 'planet':
      return 'planet';
    case 'moon':
      return 'moon';
    case 'belt':
      return 'belt';
    case 'barycenter':
      return 'barycenter';
    default:
      // Fallback classification based on size
      if (radius > 50000) return 'star';
      if (radius > 2000) return 'planet';
      if (radius > 100) return 'moon';
      return 'asteroid';
  }
}

/**
 * Calculates the visual radius for an object with unified scaling
 */
export function calculateVisualRadius(
  object: CelestialObject, 
  viewType: ViewType, 
  sizeAnalysis: SystemSizeAnalysis
): number {
  const config = VIEW_MODE_SCALINGS[viewType];
  const radiusKm = object.properties.radius || 1;
  
  // For navigational and profile modes, we can use fixed sizes if preferred
  if ((viewType === 'navigational' || viewType === 'profile') && config.fixedSizes) {
    const objectClass = classifyObject(object);
    return config.fixedSizes[objectClass];
  }
  
  // For realistic mode (and as fallback), use unified logarithmic scaling
  return calculateUnifiedVisualRadius(radiusKm, sizeAnalysis, config);
}

/**
 * Calculates the safe orbital distance with orbit clearing
 * Ensures objects can "clear their orbit" without intersecting other objects
 */
export function calculateSafeOrbitDistance(
  child: CelestialObject,
  parent: CelestialObject,
  viewType: ViewType,
  sizeAnalysis: SystemSizeAnalysis,
  allObjects?: CelestialObject[],
  configOverride?: ViewModeScaling
): number {
  if (!child.orbit || !isOrbitData(child.orbit)) {
    return 0;
  }
  
  const config = configOverride || VIEW_MODE_SCALINGS[viewType];
  const safetyMultiplier = ORBITAL_SAFETY_MULTIPLIERS[viewType];
  const minDistance = MIN_ORBITAL_DISTANCES[viewType];
  
  // Get parent and child visual radii
  const parentVisualRadius = calculateVisualRadius(parent, viewType, sizeAnalysis);
  const childVisualRadius = calculateVisualRadius(child, viewType, sizeAnalysis);
  
  // Calculate base orbital distance from AU
  const orbitAU = child.orbit.semi_major_axis;
  const baseOrbitDistance = orbitAU * config.orbitScaling;
  
  // Calculate minimum safe distance (parent radius + safety margin + child radius)
  const minSafeDistance = parentVisualRadius * safetyMultiplier + childVisualRadius;
  
  // Check for orbit clearing - ensure this object doesn't intersect with siblings
  let orbitClearingDistance = minSafeDistance;
  
  if (allObjects && child.orbit.parent) {
    // Find all siblings (objects orbiting the same parent)
    const siblings = allObjects.filter(obj => 
      obj.id !== child.id && 
      obj.orbit && 
      isOrbitData(obj.orbit) && 
      obj.orbit.parent === child.orbit!.parent
    );
    
    // Check each sibling for potential intersections
    for (const sibling of siblings) {
      const siblingOrbitAU = (sibling.orbit as any).semi_major_axis;
      const siblingBaseOrbit = siblingOrbitAU * config.orbitScaling;
      const siblingVisualRadius = calculateVisualRadius(sibling, viewType, sizeAnalysis);
      
             // If this object's orbit is close to a sibling's orbit, ensure clearing
       const orbitDifference = Math.abs(baseOrbitDistance - siblingBaseOrbit);
       const requiredClearance = childVisualRadius + siblingVisualRadius + 0.1; // Small buffer
       
       if (orbitDifference < requiredClearance) {
         // Adjust orbit to clear the sibling
         if (baseOrbitDistance <= siblingBaseOrbit) {
           // Move this object inward to clear, but ensure it's still outside parent
           const inwardPosition = siblingBaseOrbit - siblingVisualRadius - childVisualRadius - 0.1;
           if (inwardPosition > minSafeDistance) {
             orbitClearingDistance = Math.max(orbitClearingDistance, inwardPosition);
           } else {
             // Can't move inward safely, move outward instead
             orbitClearingDistance = Math.max(
               orbitClearingDistance,
               siblingBaseOrbit + siblingVisualRadius + childVisualRadius + 0.1
             );
           }
         } else {
           // Move this object outward to clear
           orbitClearingDistance = Math.max(
             orbitClearingDistance,
             siblingBaseOrbit + siblingVisualRadius + childVisualRadius + 0.1
           );
         }
       }
    }
  }
  
  // Use the larger of: scaled orbit, safe distance, orbit clearing distance, or absolute minimum
  const safeOrbitDistance = Math.max(
    baseOrbitDistance,
    minSafeDistance,
    orbitClearingDistance,
    minDistance
  );
  
  return safeOrbitDistance;
}

/**
 * Calculates belt orbital parameters with safe distances
 */
export function calculateSafeBeltOrbit(
  belt: CelestialObject,
  parent: CelestialObject,
  viewType: ViewType,
  sizeAnalysis: SystemSizeAnalysis,
  configOverride?: ViewModeScaling
): { innerRadius: number; outerRadius: number; centerRadius: number } {
  if (!belt.orbit || !isBeltOrbitData(belt.orbit)) {
    return { innerRadius: 1, outerRadius: 2, centerRadius: 1.5 };
  }
  
  const config = configOverride || VIEW_MODE_SCALINGS[viewType];
  const safetyMultiplier = ORBITAL_SAFETY_MULTIPLIERS[viewType];
  const minDistance = MIN_ORBITAL_DISTANCES[viewType];
  
  // Get parent visual radius
  const parentVisualRadius = calculateVisualRadius(parent, viewType, sizeAnalysis);
  
  // Calculate base orbital distances from AU
  const innerAU = belt.orbit.inner_radius;
  const outerAU = belt.orbit.outer_radius;
  const baseInnerRadius = innerAU * config.orbitScaling;
  const baseOuterRadius = outerAU * config.orbitScaling;
  
  // Calculate minimum safe inner distance
  const minSafeInnerDistance = parentVisualRadius * safetyMultiplier;
  
  // Ensure inner radius is safe
  const safeInnerRadius = Math.max(
    baseInnerRadius,
    minSafeInnerDistance,
    minDistance
  );
  
  // Ensure outer radius maintains proper proportion
  const originalWidth = baseOuterRadius - baseInnerRadius;
  const safeOuterRadius = safeInnerRadius + Math.max(originalWidth, 0.2);
  
  return {
    innerRadius: safeInnerRadius,
    outerRadius: safeOuterRadius,
    centerRadius: (safeInnerRadius + safeOuterRadius) / 2,
  };
}

/**
 * Calculates order-preserving orbital placement for realistic mode
 * Maintains astronomical ordering while ensuring safe orbital clearance
 */
export function calculateOrderPreservingOrbitalPlacement(
  children: CelestialObject[],
  parent: CelestialObject,
  viewType: ViewType,
  sizeAnalysis: SystemSizeAnalysis,
  dynamicConfig: ViewModeScaling
): Map<string, number> {
  const placementMap = new Map<string, number>();
  
  if (children.length === 0) {
    return placementMap;
  }
  
  // Sort children by their actual orbital distance (AU) to preserve astronomical order
  const sortedChildren = [...children].sort((a, b) => {
    const aAU = a.orbit && isOrbitData(a.orbit) ? a.orbit.semi_major_axis : 0;
    const bAU = b.orbit && isOrbitData(b.orbit) ? b.orbit.semi_major_axis : 0;
    return aAU - bAU;
  });
  
  const parentVisualRadius = calculateVisualRadius(parent, viewType, sizeAnalysis);
  const safetyMultiplier = ORBITAL_SAFETY_MULTIPLIERS[viewType];
  const minDistance = MIN_ORBITAL_DISTANCES[viewType];
  
  // Start placement after the parent's safe zone
  let currentPlacementDistance = Math.max(
    parentVisualRadius * safetyMultiplier,
    minDistance
  );
  
  for (let i = 0; i < sortedChildren.length; i++) {
    const child = sortedChildren[i];
    const childVisualRadius = calculateVisualRadius(child, viewType, sizeAnalysis);
    
    if (!child.orbit || !isOrbitData(child.orbit)) {
      continue;
    }
    
    // Calculate the desired orbital distance based on AU
    const desiredOrbitDistance = child.orbit.semi_major_axis * dynamicConfig.orbitScaling;
    
    // Use the desired distance if it's safe, otherwise use current placement
    const safeOrbitDistance = Math.max(
      desiredOrbitDistance,
      currentPlacementDistance,
      minDistance
    );
    
    placementMap.set(child.id, safeOrbitDistance);
    
    // Update current placement for the next object
    // Ensure next object is placed with sufficient clearance
    currentPlacementDistance = safeOrbitDistance + childVisualRadius * 2 + 0.5;
  }
  
  return placementMap;
}

/**
 * Calculates hierarchical orbital spacing for navigational and profile modes
 * Ensures consistent spacing between objects orbiting the same parent
 */
export function calculateHierarchicalSpacing(
  objects: CelestialObject[],
  parentId: string,
  parent: CelestialObject,
  viewType: ViewType,
  sizeAnalysis: SystemSizeAnalysis
): Map<string, number> {
  const spacingMap = new Map<string, number>();
  
  // Get all objects orbiting this parent
  const childObjects = objects.filter(obj => 
    obj.orbit?.parent === parentId && isOrbitData(obj.orbit)
  );
  
  if (childObjects.length === 0) {
    return spacingMap;
  }
  
  // Sort by original orbital distance
  childObjects.sort((a, b) => {
    const aOrbit = a.orbit as any;
    const bOrbit = b.orbit as any;
    return aOrbit.semi_major_axis - bOrbit.semi_major_axis;
  });
  
  const parentVisualRadius = calculateVisualRadius(parent, viewType, sizeAnalysis);
  const safetyMultiplier = ORBITAL_SAFETY_MULTIPLIERS[viewType];
  const minDistance = MIN_ORBITAL_DISTANCES[viewType];
  
  // Calculate first object distance
  let currentDistance = Math.max(
    parentVisualRadius * safetyMultiplier,
    minDistance
  );
  
  for (let i = 0; i < childObjects.length; i++) {
    const child = childObjects[i];
    const childVisualRadius = calculateVisualRadius(child, viewType, sizeAnalysis);
    
    spacingMap.set(child.id, currentDistance);
    
    // Calculate next position with safe spacing (child radius + gap + next child radius)
    if (i < childObjects.length - 1) {
      const nextChild = childObjects[i + 1];
      const nextChildVisualRadius = calculateVisualRadius(nextChild, viewType, sizeAnalysis);
      const baseSpacing = viewType === 'profile' ? 1.0 : 1.5;
      
      currentDistance += childVisualRadius + baseSpacing + nextChildVisualRadius;
    }
  }
  
  return spacingMap;
}

/**
 * Main function to calculate all orbital mechanics for a system
 */
export function calculateSystemOrbitalMechanics(
  objects: CelestialObject[],
  viewType: ViewType
): Map<string, {
  visualRadius: number;
  orbitDistance?: number;
  beltData?: { innerRadius: number; outerRadius: number; centerRadius: number };
}> {
  const results = new Map();
  const objectsById = new Map<string, CelestialObject>();
  
  // Index objects by ID
  for (const obj of objects) {
    objectsById.set(obj.id, obj);
  }
  
  // Analyze system size range for unified scaling
  const sizeAnalysis = analyzeSystemSizes(objects);
  
  // Calculate visual radii for all objects using unified scaling
  for (const obj of objects) {
    const visualRadius = calculateVisualRadius(obj, viewType, sizeAnalysis);
    results.set(obj.id, { visualRadius });
  }
  
  // Calculate dynamic orbital scaling for realistic mode
  let dynamicConfig = VIEW_MODE_SCALINGS[viewType];
  if (viewType === 'realistic') {
    // Find the largest object (usually the central star) to base orbital scaling on
    let largestVisualRadius = 0;
    for (const obj of objects) {
      const data = results.get(obj.id);
      if (data && data.visualRadius > largestVisualRadius) {
        largestVisualRadius = data.visualRadius;
      }
    }
    
    // Scale orbits so that 1 AU is roughly 4-5x the largest object's visual radius
    // This ensures proper spacing while maintaining proportional relationships
    const dynamicOrbitScaling = largestVisualRadius * 4.0;
    
    dynamicConfig = {
      ...VIEW_MODE_SCALINGS[viewType],
      orbitScaling: dynamicOrbitScaling
    };
  }
  
  // Group objects by parent for orbital calculations
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
  
  // Calculate orbital positions
  parentGroups.forEach((children, parentId) => {
    const parent = objectsById.get(parentId);
    if (!parent) return;
    
    // For navigational and profile modes, use hierarchical spacing
    if (viewType === 'navigational' || viewType === 'profile') {
      const spacingMap = calculateHierarchicalSpacing(objects, parentId, parent, viewType, sizeAnalysis);
      
      for (const child of children) {
        const existingData = results.get(child.id);
        const orbitDistance = spacingMap.get(child.id);
        
        if (child.orbit && isBeltOrbitData(child.orbit)) {
          const beltData = calculateSafeBeltOrbit(child, parent, viewType, sizeAnalysis, dynamicConfig);
          results.set(child.id, { ...existingData, beltData });
        } else {
          results.set(child.id, { ...existingData, orbitDistance });
        }
      }
    } else {
      // For realistic mode, use order-preserving orbital placement
      const orderedPlacement = calculateOrderPreservingOrbitalPlacement(children, parent, viewType, sizeAnalysis, dynamicConfig);
      
      for (const child of children) {
        const existingData = results.get(child.id);
        
        if (child.orbit && isBeltOrbitData(child.orbit)) {
          const beltData = calculateSafeBeltOrbit(child, parent, viewType, sizeAnalysis, dynamicConfig);
          results.set(child.id, { ...existingData, beltData });
        } else {
          const orbitDistance = orderedPlacement.get(child.id);
          results.set(child.id, { ...existingData, orbitDistance });
        }
      }
    }
  });
  
  return results;
}

/**
 * Legacy compatibility function - converts old radius/orbit values to new safe values
 */
export function convertLegacyToSafeOrbitalMechanics(
  objects: CelestialObject[],
  viewType: ViewType,
  legacyScales: {
    STAR_SCALE: number;
    PLANET_SCALE: number;
    ORBITAL_SCALE: number;
  }
): {
  getObjectVisualSize: (objectId: string) => number;
  getObjectOrbitDistance: (objectId: string) => number;
} {
  const mechanicsData = calculateSystemOrbitalMechanics(objects, viewType);
  
  return {
    getObjectVisualSize: (objectId: string) => {
      return mechanicsData.get(objectId)?.visualRadius || 1.0;
    },
    getObjectOrbitDistance: (objectId: string) => {
      const data = mechanicsData.get(objectId);
      return data?.orbitDistance || data?.beltData?.centerRadius || 0;
    },
  };
} 