import { ViewType } from '@lib/types/effects-level';

// View mode configurations for objects with radius in kilometers
interface ViewModeConfig {
  name: string;
  description: string;
  // Scaling factors to convert km radius to appropriate visual size
  starScale: number;      // Stars (sun = 695,700 km)
  planetScale: number;    // Large planets (Jupiter = 69,911 km, Earth = 6,371 km)
  moonScale: number;      // Moons (Luna = 1,737 km)
  asteroidScale: number;  // Small objects (< 1000 km)
  beltScale: number;      // Belt objects
  
  // Orbital distance scaling
  orbitScale: number;     // Multiply AU distances by this factor
  
  // Minimum visual sizes to ensure visibility
  minStarSize: number;
  minPlanetSize: number;
  minMoonSize: number;
  minAsteroidSize: number;
}

const VIEW_MODE_CONFIGS: Record<ViewType, ViewModeConfig> = {
  realistic: {
    name: 'Realistic',
    description: 'Proportional sizes with some scaling for visibility',
    
    // Use logarithmic scaling to maintain relative proportions while ensuring visibility
    starScale: 0.000001,      // 695,700 km -> 0.696 units
    planetScale: 0.00005,     // Jupiter 69,911 km -> 3.5 units, Earth 6,371 km -> 0.32 units
    moonScale: 0.0005,        // Luna 1,737 km -> 0.87 units
    asteroidScale: 0.001,     // 500 km -> 0.5 units
    beltScale: 0.0008,        // 1000 km -> 0.8 units
    
    orbitScale: 1.0,          // Keep AU distances as-is
    
    minStarSize: 0.5,
    minPlanetSize: 0.1,
    minMoonSize: 0.05,
    minAsteroidSize: 0.02,
  },
  
  navigational: {
    name: 'Navigational',
    description: 'Standardized sizes by object type for clear navigation',
    
    // Fixed sizes per object type regardless of actual radius
    starScale: 0,             // Will use fixed size instead
    planetScale: 0,           // Will use fixed size instead  
    moonScale: 0,             // Will use fixed size instead
    asteroidScale: 0,         // Will use fixed size instead
    beltScale: 0,             // Will use fixed size instead
    
    orbitScale: 0.8,          // Compress orbits slightly for better navigation
    
    // Fixed sizes for navigational mode
    minStarSize: 2.0,         // All stars same size
    minPlanetSize: 1.0,       // All planets same size
    minMoonSize: 0.5,         // All moons same size
    minAsteroidSize: 0.25,    // All asteroids same size
  },
  
  profile: {
    name: 'Profile',
    description: 'Hierarchical orthographic view with standardized sizing',
    
    // Similar to navigational but slightly smaller for profile view
    starScale: 0,             // Will use fixed size instead
    planetScale: 0,           // Will use fixed size instead
    moonScale: 0,             // Will use fixed size instead
    asteroidScale: 0,         // Will use fixed size instead
    beltScale: 0,             // Will use fixed size instead
    
    orbitScale: 0.6,          // More compressed for profile view
    
    // Fixed sizes for profile mode
    minStarSize: 1.5,         // Slightly smaller stars
    minPlanetSize: 0.8,       // Slightly smaller planets
    minMoonSize: 0.4,         // Slightly smaller moons
    minAsteroidSize: 0.2,     // Slightly smaller asteroids
  }
};

// Object type classification based on radius (in km)
function classifyObjectByRadius(radiusKm: number, classification: string): 'star' | 'planet' | 'moon' | 'asteroid' | 'belt' {
  if (classification === 'star') return 'star';
  if (classification === 'belt') return 'belt';
  
  // Classify by size
  if (radiusKm > 100000) return 'star';        // > 100,000 km
  if (radiusKm > 2000) return 'planet';        // > 2,000 km (larger than largest moon)
  if (radiusKm > 200) return 'moon';           // > 200 km (significant moons)
  return 'asteroid';                           // < 200 km (small objects)
}

// Calculate visual size for an object
export function calculateVisualSize(
  radiusKm: number, 
  classification: string, 
  viewType: ViewType
): number {
  const config = VIEW_MODE_CONFIGS[viewType];
  const objectType = classifyObjectByRadius(radiusKm, classification);
  
  // For navigational and profile modes, use fixed sizes
  if (viewType === 'navigational' || viewType === 'profile') {
    switch (objectType) {
      case 'star': return config.minStarSize;
      case 'planet': return config.minPlanetSize;
      case 'moon': return config.minMoonSize;
      case 'belt': return config.minAsteroidSize;
      case 'asteroid': return config.minAsteroidSize;
    }
  }
  
  // For realistic mode, use scaled sizes with minimums
  let scaledSize: number;
  switch (objectType) {
    case 'star':
      scaledSize = radiusKm * config.starScale;
      return Math.max(scaledSize, config.minStarSize);
    case 'planet':
      scaledSize = radiusKm * config.planetScale;
      return Math.max(scaledSize, config.minPlanetSize);
    case 'moon':
      scaledSize = radiusKm * config.moonScale;
      return Math.max(scaledSize, config.minMoonSize);
    case 'belt':
      scaledSize = radiusKm * config.beltScale;
      return Math.max(scaledSize, config.minAsteroidSize);
    case 'asteroid':
      scaledSize = radiusKm * config.asteroidScale;
      return Math.max(scaledSize, config.minAsteroidSize);
    default:
      return config.minAsteroidSize;
  }
}

// Calculate orbital distance scaling
export function calculateOrbitalDistance(distanceAU: number, viewType: ViewType): number {
  const config = VIEW_MODE_CONFIGS[viewType];
  return distanceAU * config.orbitScale;
}

// Enhanced moon orbit distance calculation to fix moon placement issues
export function calculateMoonOrbitDistance(
  parentRadiusKm: number,
  moonOrbitAU: number,
  viewType: ViewType
): number {
  const config = VIEW_MODE_CONFIGS[viewType];
  const parentVisualSize = calculateVisualSize(parentRadiusKm, 'planet', viewType);
  
  // Convert AU to km for calculation (1 AU ≈ 149,597,871 km)
  const orbitDistanceKm = moonOrbitAU * 149597871;
  
  // Ensure moon orbit is outside parent visual radius
  const minOrbitDistance = parentVisualSize * 2.5; // Minimum distance from parent surface
  
  // Scale the orbit distance appropriately for the view mode
  let scaledOrbitDistance: number;
  
  if (viewType === 'realistic') {
    // Use actual scaled distance but ensure it's visible
    scaledOrbitDistance = orbitDistanceKm * 0.000001; // Scale similar to planet scaling
  } else {
    // For navigational/profile modes, use standardized orbit distances
    scaledOrbitDistance = parentVisualSize * 3.0; // Fixed multiple of parent size
  }
  
  // Always ensure minimum distance
  return Math.max(scaledOrbitDistance, minOrbitDistance);
}

// Get configuration for a view mode
export function getViewModeConfig(viewType: ViewType): ViewModeConfig {
  return VIEW_MODE_CONFIGS[viewType] || VIEW_MODE_CONFIGS.realistic;
}

// Legacy compatibility function
export function calculateViewModeScaling(viewType: ViewType) {
  const config = VIEW_MODE_CONFIGS[viewType];
  
  return {
    STAR_SCALE: config.starScale || 1.0,
    PLANET_SCALE: config.planetScale || 1.0,
    ORBITAL_SCALE: config.orbitScale || 1.0,
    STAR_SHADER_SCALE: config.starScale || 1.0
  };
}

// Export configurations for external use
export { VIEW_MODE_CONFIGS }; 