/**
 * ORBITAL MECHANICS CALCULATOR
 * ============================
 * 
 * This module calculates visual radii and orbital positions for celestial objects across different view modes.
 * It handles complex dependencies between parent-child relationships, moon systems, and collision detection.
 * 
 * CRITICAL ORDER OF OPERATIONS:
 * =============================
 * 
 * The calculation follows a strict 5-step process to resolve circular dependencies and ensure collision-free layouts:
 * 
 * 1. VISUAL RADIUS CALCULATION (Two-Pass)
 *    ├── Pass 1: Calculate visual radii for all non-moon objects (stars, planets, belts)
 *    │   - Uses logarithmic scaling in explorational mode
 *    │   - Uses fixed sizes in navigational/profile modes
 *    │   - Must be done first as moons depend on parent sizes
 *    └── Pass 2: Calculate visual radii for moons
 *        - In explorational mode: proportional to parent size
 *        - In other modes: uses fixed moon size
 *        - Requires parent visual radii to be calculated first
 * 
 * 2. ORBITAL POSITION CALCULATION (Two-Pass Algorithm)
 *    ├── Pass 1: Calculate all moon orbits within their parent systems
 *    │   - Sorts moons by original AU distance
 *    │   - Places moons with proper spacing and safety factors
 *    │   - Records orbitDistance for each moon
 *    │   - CRITICAL: Must be done before planets to avoid circular dependency
 *    └── Pass 2: Calculate planet and belt orbits
 *        - Uses effective orbital radius (including moon systems)
 *        - Now works correctly because moon positions are known
 *        - Handles collision avoidance between sibling objects
 * 
 * 3. GLOBAL COLLISION DETECTION AND ADJUSTMENT
 *    - Checks for overlaps between objects orbiting the same parent
 *    - Uses ACTUAL calculated positions (not raw AU values)
 *    - Adjusts orbits outward to prevent collisions
 *    - Handles both regular orbits and belt objects
 * 
 * 4. PARENT-CHILD SIZE HIERARCHY ENFORCEMENT
 *    - Ensures parents are larger than their children
 *    - Scales objects proportionally when needed
 *    - Respects view mode constraints
 * 
 * 5. MEMOIZATION AND CACHING
 *    - Caches results to avoid recalculation
 *    - Uses object configuration + view mode as cache key
 * 
 * DEPENDENCY RESOLUTION:
 * ======================
 * 
 * The two-pass algorithm in step 2 solves a critical circular dependency:
 * 
 * PROBLEM:
 * - To calculate Earth's orbit position, we need its effective orbital radius (including moons)
 * - To calculate effective orbital radius, we need moon orbit distances
 * - But moon orbit distances depend on Earth's position being calculated first
 * 
 * SOLUTION:
 * - Pass 1: Calculate all moon orbits independently within their parent systems
 * - Pass 2: Calculate planet orbits using the now-available moon positions
 * 
 * This ensures that when calculateEffectiveOrbitalRadius() is called for planets,
 * all moon orbitDistance values are already available.
 * 
 * VIEW MODE DIFFERENCES:
 * ======================
 * 
 * - EXPLORATIONAL (orbitScaling: 8.0): Logarithmic size scaling, proportional moon sizes
 * - NAVIGATIONAL (orbitScaling: 6.0): Fixed sizes, higher safety factors
 * - PROFILE (orbitScaling: 4.0): Fixed sizes, compact layout
 * 
 * Each mode has different scaling factors and safety multipliers to achieve
 * the desired visual appearance while maintaining collision-free layouts.
 * 
 * COLLISION PREVENTION:
 * =====================
 * 
 * The system prevents three types of collisions:
 * 1. Parent-child collisions (moons inside planets, planets inside stars)
 * 2. Sibling collisions (adjacent planets, adjacent moons)
 * 3. Moon system overlaps (one planet's moon system overlapping another planet)
 * 
 * The effective orbital radius calculation ensures that when placing objects,
 * the full extent of their moon systems is considered.
 */

import { ViewType } from '@lib/types/effects-level';
import { CelestialObject, isOrbitData, isBeltOrbitData } from '@/engine/types/orbital-system';
import { getOrbitalMechanicsConfig } from '@/engine/core/view-modes/compatibility';
// Import view modes to ensure they are registered
import '@/engine/core/view-modes';

// Memoized results - calculate once, use forever
let memoizedResults: Map<string, {
  visualRadius: number;
  orbitDistance?: number;
  beltData?: { innerRadius: number; outerRadius: number; centerRadius: number };
}> | null = null;

let lastCalculationKey = '';

/**
 * Generate a key for memoization based on objects, view type, and paused state
 */
function generateCalculationKey(objects: CelestialObject[], viewType: ViewType, isPaused: boolean): string {
  const objectsKey = objects.map(obj => `${obj.id}-${obj.properties.radius}-${obj.orbit?.parent || 'root'}`).join('|');
  return `${viewType}-${isPaused}-${objectsKey}`;
}

/**
 * Calculate visual radius for an object with proportional parent-child scaling
 */
function calculateVisualRadius(
  object: CelestialObject, 
  viewType: ViewType, 
  sizeAnalysis: { logMinRadius: number; logRange: number },
  allObjects: CelestialObject[],
  results: Map<string, any>,
  config: any
): number {
  const radiusKm = object.properties.radius || 1;
  
  // SCIENTIFIC MODE: Use true-to-life scaling with actual radius values
  if (viewType === 'scientific') {
    // Scale the actual radius directly with minimal visual scaling
    const logRadius = Math.log10(radiusKm + 1);
    const normalizedLog = (logRadius - sizeAnalysis.logMinRadius) / sizeAnalysis.logRange;
    const visualRadius = config.minVisualSize + (normalizedLog * (config.maxVisualSize - config.minVisualSize));
    return Math.max(visualRadius, config.minVisualSize);
  }
  
  // Use fixed sizes for non-explorational/non-scientific modes
  if (viewType !== 'explorational' && viewType !== 'scientific' && 'fixedSizes' in config) {
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
  
  // EXPLORATIONAL MODE: Implement proportional parent-child scaling
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
  config: any,
  viewType?: ViewType
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
  
  // In profile mode, use much smaller effective radius to maintain tight spacing
  if (viewType === 'profile') {
    // For profile mode, just use the object's visual radius plus a small buffer
    // This ignores moon systems to keep planets close together
    const profileEffectiveRadius = objectVisualRadius * 2; // Small multiplier for minimal clearance
    
    // DEBUG: Log effective radius calculation
    console.log(`🌙 EFFECTIVE RADIUS (${object.name}): profile mode = ${profileEffectiveRadius} (visual: ${objectVisualRadius})`);
    
    return profileEffectiveRadius;
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
  
  // In navigational mode, use more compact spacing
  if (viewType === 'navigational') {
    // Use a reduced effective radius to keep objects closer together
    const compactRadius = Math.max(objectVisualRadius, outermostMoonDistance * 0.5);
    return compactRadius;
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
  config: any,
  viewType?: ViewType
): number {
  // Handle belts specially - they have their own clearance logic
  if (results.get(object.id)?.beltData) {
    const beltData = results.get(object.id)?.beltData;
    return (beltData.outerRadius - beltData.innerRadius) / 2; // Half the belt width
  }

  // In navigational mode, use more compact clearances to maintain tight spacing
  if (viewType === 'navigational') {
    const objectVisualRadius = results.get(object.id)?.visualRadius || 0;
    // Use just the visual radius plus a small buffer for navigational mode
    return objectVisualRadius * 1.2;
  }

  // For any non-belt object, the clearance required on its inner side is the same as its
  // effective orbital radius on the outer side. This includes the full extent of its moon system.
  return calculateEffectiveOrbitalRadius(object, allObjects, results, config, viewType);
}

/**
 * Calculate absolute position of an object from the system center based on RAW orbit data, not cleared results.
 * This is used for the initial global collision check.
 */
function calculateRawAbsolutePosition(
  object: CelestialObject,
  objects: CelestialObject[],
  config: any
): number {
  if (!object.orbit?.parent) {
    return 0;
  }
  
  const parent = objects.find(obj => obj.id === object.orbit!.parent);
  if (!parent) return 0;
  
  const parentAbsolutePosition = calculateRawAbsolutePosition(parent, objects, config);

  const objectOrbitAU = (object.orbit && isBeltOrbitData(object.orbit))
    ? (object.orbit.inner_radius + object.orbit.outer_radius) / 2
    : (object.orbit && isOrbitData(object.orbit)) ? object.orbit.semi_major_axis : 0;
  
  return parentAbsolutePosition + (objectOrbitAU * config.orbitScaling);
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
  
  // Sort by ACTUAL calculated orbit distances, not raw AU values
  const sortedOrbiters = primaryOrbiters.map(obj => {
    // Use the actual calculated orbit distance if available, otherwise fall back to raw calculation
    let actualPosition: number;
    
    if (obj.orbit && isBeltOrbitData(obj.orbit)) {
      const beltData = results.get(obj.id)?.beltData;
      actualPosition = beltData ? beltData.centerRadius : calculateRawAbsolutePosition(obj, objects, config);
    } else {
      const orbitDistance = results.get(obj.id)?.orbitDistance;
      actualPosition = orbitDistance !== undefined ? orbitDistance : calculateRawAbsolutePosition(obj, objects, config);
    }
    
    return {
      object: obj,
      absolutePosition: actualPosition,
      outermostEffectiveRadius: calculateEffectiveOrbitalRadius(obj, objects, results, config, viewType),
      innermostEffectiveRadius: calculateEffectiveOrbitalClearance(obj, objects, results, config, viewType)
    };
  }).sort((a, b) => a.absolutePosition - b.absolutePosition);
  
  // Check for overlaps and adjust
  for (let i = 1; i < sortedOrbiters.length; i++) {
    const current = sortedOrbiters[i];
    const previous = sortedOrbiters[i - 1];
    
    // The outer edge of the previous object's system
    const previousOuterEdge = previous.absolutePosition + previous.outermostEffectiveRadius;
    
    // The required center of the current object's orbit
    // In navigational mode, use tighter spacing to maintain compact layout
    const spacingMultiplier = viewType === 'navigational' ? 0.5 : 1.0;
    const requiredCenterPosition = previousOuterEdge + (config.minDistance * spacingMultiplier) + current.innermostEffectiveRadius;

    if (current.absolutePosition < requiredCenterPosition) {
      // Collision detected! But be smart about belt adjustments
      let adjustment = requiredCenterPosition - current.absolutePosition;
      
      // SMART BELT HANDLING: If the previous object is a belt, use much more conservative spacing
      if (previous.object.classification === 'belt') {
        
        console.log(`🔍 BELT COLLISION DEBUG for ${current.object.name}:`);
        console.log(`  📊 Previous belt: ${previous.object.name}`);
        console.log(`  📍 Belt center: ${previous.absolutePosition}`);
        console.log(`  📏 Belt outer radius: ${previous.outermostEffectiveRadius}`);
        console.log(`  📍 Belt outer edge: ${previous.absolutePosition + previous.outermostEffectiveRadius}`);
        console.log(`  📍 Current object position: ${current.absolutePosition}`);
        console.log(`  📏 Current object clearance: ${current.innermostEffectiveRadius}`);
        console.log(`  📐 Normal required position: ${requiredCenterPosition}`);
        console.log(`  📐 Normal adjustment: ${requiredCenterPosition - current.absolutePosition}`);
        
        // For belts, use minimal spacing regardless of view mode
        const minimalSpacing = config.minDistance * 0.2; // Very tight spacing after belts
        const conservativePosition = previous.absolutePosition + previous.outermostEffectiveRadius + minimalSpacing + current.innermostEffectiveRadius;
        
        console.log(`  🎯 Conservative position: ${conservativePosition}`);
        console.log(`  🎯 Conservative adjustment: ${conservativePosition - current.absolutePosition}`);
        
        if (conservativePosition < requiredCenterPosition) {
          adjustment = conservativePosition - current.absolutePosition;
          console.log(`✅ SMART BELT SPACING: Using reduced adjustment ${adjustment} instead of ${requiredCenterPosition - current.absolutePosition}`);
        } else {
          console.log(`❌ Conservative position is still larger than required, using normal adjustment`);
        }
      }
      
      if (current.object.name === 'Neptune') {
        console.log(`🚨 NEPTUNE COLLISION DETECTED:`);
        console.log(`  📍 Current position: ${current.absolutePosition}`);
        console.log(`  📍 Required position: ${requiredCenterPosition}`);
        console.log(`  ⬆️ Adjustment needed: ${adjustment}`);
        console.log(`  📊 Previous object:`, previous.object.name);
        console.log(`  📏 Previous outer edge: ${previousOuterEdge}`);
      }
      
      if (current.object.orbit && isBeltOrbitData(current.object.orbit)) {
        // Adjust belt position
        const beltData = results.get(current.object.id)?.beltData;
        if (beltData) {
          const beltWidth = beltData.outerRadius - beltData.innerRadius;
          const newCenterRadius = requiredCenterPosition;
          const newInnerRadius = newCenterRadius - beltWidth / 2;
          const newOuterRadius = newCenterRadius + beltWidth / 2;
          
          results.set(current.object.id, {
            ...results.get(current.object.id),
            beltData: {
              innerRadius: newInnerRadius,
              outerRadius: newOuterRadius,
              centerRadius: newCenterRadius,
            }
          });
        }
      } else {
        // Adjust regular orbit
        const currentOrbitDistance = results.get(current.object.id)?.orbitDistance || 0;
        const newOrbitDistance = currentOrbitDistance + adjustment;
        
        if (current.object.name === 'Neptune') {
          console.log(`🚨 NEPTUNE ORBIT ADJUSTMENT:`);
          console.log(`  📍 Current orbit distance: ${currentOrbitDistance}`);
          console.log(`  ⬆️ Adding adjustment: ${adjustment}`);
          console.log(`  🎯 New orbit distance: ${newOrbitDistance}`);
        }
        results.get(current.object.id)!.orbitDistance = newOrbitDistance;
      }
      
      // Update the sorted array for subsequent checks
      current.absolutePosition = current.absolutePosition + adjustment;
      // Recalculate effective radius if orbit distance changed, as it depends on it.
      // This recursive call ensures that if an adjustment causes further ripple effects,
      // they are also accounted for.
      current.outermostEffectiveRadius = calculateEffectiveOrbitalRadius(current.object, objects, results, config, viewType);
      current.innermostEffectiveRadius = calculateEffectiveOrbitalClearance(current.object, objects, results, config, viewType);
    }
  }
}

/**
 * CORE ORBITAL POSITIONING ALGORITHM (Two-Pass System)
 * =====================================================
 * 
 * This function implements the critical two-pass algorithm that resolves the circular dependency
 * between planet positions and moon positions. This is the heart of the collision-free layout system.
 * 
 * CIRCULAR DEPENDENCY PROBLEM:
 * - To place Earth correctly, we need to know its effective orbital radius (including Luna)
 * - To calculate effective orbital radius, we need Luna's orbit distance
 * - But Luna's orbit distance depends on Earth's position being calculated first
 * 
 * TWO-PASS SOLUTION:
 * - Pass 1: Calculate ALL moon orbits independently within their parent systems
 * - Pass 2: Calculate planet/belt orbits using the now-available moon positions
 * 
 * This ensures that when calculateEffectiveOrbitalRadius() is called for planets,
 * all moon orbitDistance values are already available, breaking the circular dependency.
 * 
 * @param objects - All celestial objects in the system
 * @param results - Map containing visual radii (calculated in previous step)
 * @param config - View mode configuration with scaling factors
 */
function calculateClearedOrbits(
  objects: CelestialObject[],
  results: Map<string, any>,
  config: any,
  viewType: ViewType
): void {
  // Group objects by their parent for efficient processing
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
  
  // ========================================================================
  // PASS 1: MOON ORBIT CALCULATION
  // ========================================================================
  // Calculate all moon orbits FIRST to break the circular dependency.
  // This ensures that when we calculate planet effective orbital radii in Pass 2,
  // all moon positions are already known.
  
  parentGroups.forEach((children, parentId) => {
    const parent = objects.find(obj => obj.id === parentId);
    if (!parent) return;
    
    // Only process moons in this pass - planets and belts are handled in Pass 2
    const moons = children.filter(child => child.classification === 'moon');
    if (moons.length === 0) return;
    
    const parentVisualRadius = results.get(parentId)?.visualRadius || 0;
    
    // Sort moons by their original orbital distance (AU) to maintain natural ordering
    moons.sort((a, b) => {
      const aAU = a.orbit && isOrbitData(a.orbit) ? a.orbit.semi_major_axis : 0;
      const bAU = b.orbit && isOrbitData(b.orbit) ? b.orbit.semi_major_axis : 0;
      return aAU - bAU;
    });
    
    // Start placing moon orbits after the parent's safe zone
    let nextAvailableDistance = Math.max(
      parentVisualRadius * config.safetyMultiplier,
      config.minDistance
    );

    // Place each moon with proper spacing to prevent moon-to-moon collisions
    for (const moon of moons) {
      if (moon.orbit && isOrbitData(moon.orbit)) {
        const moonVisualRadius = results.get(moon.id)?.visualRadius || 0;
        
        let actualDistance: number;
        
        if (viewType === 'profile') {
          // Profile mode: Use equidistant spacing, ignoring astronomical distances
          actualDistance = nextAvailableDistance;
        } else {
          // Other modes: Use scaled astronomical distances
          const desiredDistance = moon.orbit.semi_major_axis * config.orbitScaling;
          actualDistance = Math.max(desiredDistance, nextAvailableDistance);
        }
        
        // CRITICAL: Record the final orbit distance for use in Pass 2
        results.get(moon.id)!.orbitDistance = actualDistance;
        
        // Next moon must clear this moon's outer edge with proper minimum distance
        // Use a larger safety factor for moons to prevent collisions
        const moonSafetyFactor = Math.max(config.safetyMultiplier, 2.0); // At least 2x safety
        nextAvailableDistance = actualDistance + (moonVisualRadius * moonSafetyFactor) + config.minDistance;
      }
    }
  });

  // ========================================================================
  // PASS 2: PLANET AND BELT ORBIT CALCULATION
  // ========================================================================
  // Now that all moon positions are known, we can safely calculate planet orbits
  // using their effective orbital radii (which include their moon systems).
  
  parentGroups.forEach((children, parentId) => {
    const parent = objects.find(obj => obj.id === parentId);
    if (!parent) return;
    
    const parentVisualRadius = results.get(parentId)?.visualRadius || 0;
    
    // Only process non-moon children in this pass (planets, belts)
    const nonMoonChildren = children.filter(child => child.classification !== 'moon');
    if (nonMoonChildren.length === 0) return;
    
    // Sort children by their original orbital distance (AU) to maintain natural ordering
    nonMoonChildren.sort((a, b) => {
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

    // Place each planet/belt with collision avoidance
    for (const child of nonMoonChildren) {
      const childVisualRadius = results.get(child.id)?.visualRadius || 0;

      if (child.orbit && isOrbitData(child.orbit)) {
        // REGULAR PLANET ORBIT CALCULATION
        // =================================
        
        // CRITICAL: Calculate effective orbital radius including moon systems
        // This now works correctly because all moon positions were calculated in Pass 1
        const effectiveOrbitalRadius = calculateEffectiveOrbitalRadius(child, objects, results, config, viewType);

        // Calculate minimum clearance needed from previous object
        const requiredInnerEdge = previousChild
          ? previousChild.actualDistance + previousChild.effectiveRadius + config.minDistance
          : nextAvailableDistance;

        // The center of the child's orbit should account for its own moon system clearance
        const requiredCenter = requiredInnerEdge + effectiveOrbitalRadius;

        let actualDistance: number;
        
        if (viewType === 'profile') {
          // Profile mode: Use equidistant spacing, ignoring astronomical distances
          actualDistance = requiredCenter;
          
          // DEBUG: Log profile mode planet placement
          console.log(`🪐 PROFILE PLANET: ${child.name}`);
          console.log(`  📏 Child visual radius: ${childVisualRadius}`);
          console.log(`  🌙 Effective orbital radius: ${effectiveOrbitalRadius}`);
          console.log(`  📍 Previous child: ${previousChild ? `${previousChild.actualDistance} + ${previousChild.effectiveRadius}` : 'none'}`);
          console.log(`  📐 Required inner edge: ${requiredInnerEdge}`);
          console.log(`  🎯 Required center: ${requiredCenter}`);
          console.log(`  ✅ Final distance: ${actualDistance}`);
          console.log(`  📏 Gap from previous: ${previousChild ? actualDistance - (previousChild.actualDistance + previousChild.effectiveRadius) : 'N/A'}`);
        } else {
          // Other modes: Use scaled astronomical distances
          const desiredDistance = child.orbit.semi_major_axis * config.orbitScaling;
          actualDistance = Math.max(desiredDistance, requiredCenter);
        }

        // Record the final orbit distance
        if (child.name === 'Neptune') {
          console.log(`🔥 NEPTUNE RESULT ASSIGNMENT: Setting orbitDistance to ${actualDistance}`);
        }
        results.get(child.id)!.orbitDistance = actualDistance;
        if (child.name === 'Neptune') {
          console.log(`🔥 NEPTUNE RESULT AFTER ASSIGNMENT:`, results.get(child.id));
        }

        // Update tracking for next object
        previousChild = {
          actualDistance,
          effectiveRadius: effectiveOrbitalRadius,
        };

        nextAvailableDistance = actualDistance + effectiveOrbitalRadius + config.minDistance;

      } else if (child.orbit && isBeltOrbitData(child.orbit)) {
        // BELT OBJECT CALCULATION
        // =======================
        
        // Account for previous object clearance
        const clearanceFromPrevious = previousChild
          ? previousChild.actualDistance + previousChild.effectiveRadius + config.minDistance
          : 0;

        let actualInnerRadius: number;
        let actualOuterRadius: number;

        if (viewType === 'profile') {
          // Profile mode: Use equidistant spacing for belts too
          actualInnerRadius = Math.max(nextAvailableDistance, clearanceFromPrevious);
          // Use a very minimal belt width for profile mode to maintain tight spacing
          const profileBeltWidth = config.minDistance * 0.25; // Just 0.25x minDistance for very compact appearance
          actualOuterRadius = actualInnerRadius + profileBeltWidth;
          
          // DEBUG: Log profile mode belt placement
          console.log(`⚫ PROFILE BELT: ${child.name}`);
          console.log(`  📐 Next available distance: ${nextAvailableDistance}`);
          console.log(`  📐 Clearance from previous: ${clearanceFromPrevious}`);
          console.log(`  📍 Inner radius: ${actualInnerRadius}`);
          console.log(`  📏 Belt width: ${profileBeltWidth}`);
          console.log(`  📍 Outer radius: ${actualOuterRadius}`);
          console.log(`  🎯 Center: ${(actualInnerRadius + actualOuterRadius) / 2}`);
          console.log(`  📏 Effective radius: ${(actualOuterRadius - actualInnerRadius) / 2}`);
          
        } else {
          // Other modes: Use scaled astronomical distances with reasonable belt width limits
          const desiredInnerRadius = child.orbit.inner_radius * config.orbitScaling;
          const desiredOuterRadius = child.orbit.outer_radius * config.orbitScaling;
          let beltWidth = desiredOuterRadius - desiredInnerRadius;
          
          // CRITICAL: Limit belt width to prevent massive gaps in the system
          // Belt width should be visually reasonable, not astronomically accurate
          // In explorational mode, belts should be thin visual elements, not massive obstacles
          const maxBeltWidth = viewType === 'explorational' ? config.minDistance * 2 : config.orbitScaling * 0.5;
          if (beltWidth > maxBeltWidth) {
            console.log(`🎯 BELT WIDTH LIMITATION: ${child.name} belt width reduced from ${beltWidth} to ${maxBeltWidth}`);
            beltWidth = maxBeltWidth;
          }
          
          // For explorational mode, belts should be placed close to the previous object
          // to avoid creating massive gaps in the system
          if (viewType === 'explorational') {
            // Place belt just beyond the previous object with minimal spacing
            actualInnerRadius = Math.max(nextAvailableDistance, clearanceFromPrevious);
          } else {
            actualInnerRadius = Math.max(desiredInnerRadius, nextAvailableDistance, clearanceFromPrevious);
          }
          actualOuterRadius = actualInnerRadius + Math.max(beltWidth, config.minDistance);
        }

        // Store belt data
        results.set(child.id, {
          ...results.get(child.id),
          beltData: {
            innerRadius: actualInnerRadius,
            outerRadius: actualOuterRadius,
            centerRadius: (actualInnerRadius + actualOuterRadius) / 2,
          }
        });

        // Update tracking for next object
        previousChild = {
          actualDistance: (actualInnerRadius + actualOuterRadius) / 2,
          effectiveRadius: (actualOuterRadius - actualInnerRadius) / 2,
        };

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
  const config = getOrbitalMechanicsConfig(viewType);
  
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
        const maxAllowedParentSize = viewType === 'explorational' 
          ? Math.min(minParentSize, config.maxVisualSize)
          : minParentSize;
        
        // Update parent size
        parentData.visualRadius = maxAllowedParentSize;
        
        // If parent is now too large for explorational mode orbital mechanics, 
        // we need to scale down the child instead
        if (viewType === 'explorational' && parentObj.classification === 'star' && maxAllowedParentSize > 1.0) {
          // For stars in explorational mode, prefer to scale down children rather than make star too large
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
 * Calculates the visual and orbital parameters for a system of celestial objects.
 * This is the main entry point for the orbital mechanics calculations.
 * 
 * CRITICAL: This function follows a strict 5-step process to resolve circular dependencies.
 * The order of operations MUST NOT be changed without understanding the dependency chain.
 * 
 * @param objects - Array of celestial objects to calculate positions for
 * @param viewType - View mode that determines scaling and sizing behavior
 * @param isPaused - Whether the system is paused (for rendering compatibility)
 * @returns Map of object IDs to their calculated visual and orbital properties
 */
export function calculateSystemOrbitalMechanics(
  objects: CelestialObject[],
  viewType: ViewType,
  isPaused: boolean = false
): Map<string, {
  visualRadius: number;
  orbitDistance?: number;
  beltData?: { innerRadius: number; outerRadius: number; centerRadius: number };
  animationSpeed?: number;
}> {
  // STEP 0: Check memoization cache
  // ===============================
  // Avoid recalculation if we've already processed this exact configuration
  const calculationKey = generateCalculationKey(objects, viewType, isPaused);
  if (memoizedResults && lastCalculationKey === calculationKey) {
    return memoizedResults;
  }
  
  const results = new Map();
  
  // STEP 1: VISUAL RADIUS CALCULATION (Two-Pass)
  // =============================================
  // Must be done first as all subsequent calculations depend on visual sizes
  
  // Analyze the size range for logarithmic scaling in explorational mode
  const sizeAnalysis = analyzeSystemSizes(objects);
  
  // Get the configuration for this view type
  const config = getOrbitalMechanicsConfig(viewType);
  
  // PASS 1A: Calculate visual radii for all non-moon objects (stars, planets, belts)
  // This must be done first because moons in explorational mode scale proportionally to their parents
  for (const obj of objects) {
    if (!obj.orbit?.parent || obj.classification !== 'moon') {
      const visualRadius = calculateVisualRadius(obj, viewType, sizeAnalysis, objects, results, config);
      results.set(obj.id, { visualRadius });
    }
  }
  
  // PASS 1B: Calculate visual radii for moons using their parent's visual radius
  // This depends on parents being calculated first (above)
  for (const obj of objects) {
    if (obj.orbit?.parent && obj.classification === 'moon') {
      const visualRadius = calculateVisualRadius(obj, viewType, sizeAnalysis, objects, results, config);
      results.set(obj.id, { visualRadius });
    }
  }
  
  // STEP 2: ORBITAL POSITION CALCULATION (Two-Pass Algorithm)
  // ==========================================================
  // This is the core of the dependency resolution system
  
  // Use the config already declared above
  const orbitConfig = { ...config };
  
  // CRITICAL: calculateClearedOrbits uses a two-pass algorithm to resolve circular dependencies:
  // - Pass 1: Calculate all moon orbits first (independent of planet positions)
  // - Pass 2: Calculate planet orbits using the now-available moon positions
  // This prevents the circular dependency where planets need moon positions but moons need planet positions
  calculateClearedOrbits(objects, results, orbitConfig, viewType);
  
  // STEP 3: GLOBAL COLLISION DETECTION AND ADJUSTMENT
  // ==================================================
  // TODO: Implement proper collision detection that handles belts correctly
  // Temporarily disabled per user decision to revisit later with better implementation
  // The current collision detection system causes spacing issues with asteroid belts
  // if (viewType !== 'profile') {
  //   adjustForGlobalCollisions(objects, viewType, results, orbitConfig);
  // }
  
  // STEP 4: PARENT-CHILD SIZE HIERARCHY ENFORCEMENT
  // ================================================
  // Ensure visual hierarchy is maintained (parents larger than children)
  // This is done last to avoid interfering with collision calculations
  enforceParentChildSizeHierarchy(objects, results, viewType);
  
  // STEP 5: ANIMATION SPEED CALCULATION
  // ====================================
  // Calculate animation speeds based on orbital periods
  for (const obj of objects) {
    const result = results.get(obj.id);
    if (result && obj.orbit && 'orbital_period' in obj.orbit && obj.orbit.orbital_period) {
      // Animation speed is inversely proportional to orbital period
      // Base speed for Earth (365 days) = 1.0
      const baseSpeed = 1.0;
      const earthPeriod = 365; // days
      result.animationSpeed = baseSpeed * (earthPeriod / obj.orbit.orbital_period);
    }
  }
  
  // STEP 6: MEMOIZATION AND CACHING
  // ================================
  // Cache the results for future calls with the same configuration
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