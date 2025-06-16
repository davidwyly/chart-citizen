export interface ViewModeConfig {
  // Object scaling factors by type
  objectScaling: {
    star: number
    planet: number
    moon: number
    gasGiant: number
    asteroid: number
    default: number
  }
  
  // Orbit scaling configuration
  orbitScaling: {
    factor: number
    minDistance: number
    maxDistance: number
  }
  
  // Camera behavior configuration
  cameraConfig: {
    // Single radius-based distance calculation
    radiusMultiplier: number  // Multiplier applied to visible radius for optimal distance
    minDistanceMultiplier: number  // Minimum distance as multiple of visible radius
    maxDistanceMultiplier: number  // Maximum distance as multiple of visible radius
    absoluteMinDistance: number    // Absolute minimum distance regardless of radius
    absoluteMaxDistance: number    // Absolute maximum distance regardless of radius
    
    // Camera angles and positioning
    viewingAngles: {
      defaultElevation: number  // Default downward angle in degrees
      birdsEyeElevation: number // Birds-eye view angle in degrees
    }
    
    // Animation settings
    animation: {
      focusDuration: number     // Time to focus on object
      birdsEyeDuration: number  // Time to birds-eye view
      easingFunction: 'linear' | 'easeOut' | 'easeInOut' | 'leap'
    }
  }
}

export interface DualObjectProperties {
  // Real properties (from actual data)
  realRadius: number
  realOrbitRadius: number
  realMass: number
  
  // Visual properties (calculated for current view mode)
  visualRadius: number
  visualOrbitRadius: number
  visualScale: number
  
  // Object type classification
  objectType: 'star' | 'planet' | 'moon' | 'gasGiant' | 'asteroid'
  
  // Calculated camera properties (now purely radius-based)
  optimalViewDistance: number
  minViewDistance: number
  maxViewDistance: number
}

// View mode configurations
export const VIEW_MODE_CONFIGS: Record<string, ViewModeConfig> = {
  explorational: {
    objectScaling: {
      star: 2.5,
      planet: 1.8,
      moon: 1.2,
      gasGiant: 2.2,
      asteroid: 0.8,
      default: 1.0
    },
    orbitScaling: {
      factor: 0.8,
      minDistance: 0.5,
      maxDistance: 50.0
    },
    cameraConfig: {
      radiusMultiplier: 4.0,        // Camera positioned at 4x the visible radius
      minDistanceMultiplier: 2.5,   // Never closer than 2.5x visible radius
      maxDistanceMultiplier: 15.0,  // Never farther than 15x visible radius
      absoluteMinDistance: 0.3,     // Absolute minimum 0.3 units
      absoluteMaxDistance: 100,     // Absolute maximum 100 units
      viewingAngles: {
        defaultElevation: 30,
        birdsEyeElevation: 40
      },
      animation: {
        focusDuration: 800,
        birdsEyeDuration: 1200,
        easingFunction: 'leap'
      }
    }
  },
  
  navigational: {
    objectScaling: {
      star: 1.8,
      planet: 1.5,
      moon: 1.0,
      gasGiant: 1.8,
      asteroid: 0.6,
      default: 1.0
    },
    orbitScaling: {
      factor: 1.0,
      minDistance: 1.0,
      maxDistance: 30.0
    },
    cameraConfig: {
      radiusMultiplier: 3.5,        // Closer for navigation
      minDistanceMultiplier: 2.0,   // Minimum 2x visible radius
      maxDistanceMultiplier: 12.0,  // Maximum 12x visible radius
      absoluteMinDistance: 0.2,     // Absolute minimum 0.2 units
      absoluteMaxDistance: 80,      // Absolute maximum 80 units
      viewingAngles: {
        defaultElevation: 35,
        birdsEyeElevation: 45
      },
      animation: {
        focusDuration: 600,
        birdsEyeDuration: 1000,
        easingFunction: 'easeOut'
      }
    }
  },
  
  profile: {
    objectScaling: {
      star: 1.5,    // Still larger than others
      planet: 1.0,  // Base scale
      moon: 0.8,    // Smaller than planets
      gasGiant: 1.2, // Between stars and planets
      asteroid: 0.5, // Smallest
      default: 1.0
    },
    orbitScaling: {
      factor: 1.2,
      minDistance: 2.0,
      maxDistance: 15.0
    },
    cameraConfig: {
      radiusMultiplier: 2.5,        // Closer for detailed view
      minDistanceMultiplier: 1.8,   // Minimum 1.8x visible radius
      maxDistanceMultiplier: 8.0,   // Maximum 8x visible radius
      absoluteMinDistance: 0.15,    // Absolute minimum 0.15 units
      absoluteMaxDistance: 60,      // Absolute maximum 60 units
      viewingAngles: {
        defaultElevation: 0,  // Top-down for profile view
        birdsEyeElevation: 0
      },
      animation: {
        focusDuration: 400,
        birdsEyeDuration: 600,
        easingFunction: 'easeInOut'
      }
    }
  }
}

// Helper function to get object type from name or properties
export function determineObjectType(
  name: string, 
  mass?: number, 
  radius?: number,
  catalogData?: any
): 'star' | 'planet' | 'moon' | 'gasGiant' | 'asteroid' {
  const lowerName = name.toLowerCase()
  
  // Check for star indicators
  if (lowerName.includes('star') || lowerName.includes('sun') || 
      lowerName.includes('centauri') || lowerName.includes('proxima')) {
    return 'star'
  }
  
  // Check for gas giant indicators
  if (lowerName.includes('jupiter') || lowerName.includes('saturn') || 
      lowerName.includes('uranus') || lowerName.includes('neptune') ||
      lowerName.includes('gas giant')) {
    return 'gasGiant'
  }
  
  // Check for moon indicators (including known moon names)
  if (lowerName.includes('moon') || lowerName.includes('satellite') ||
      lowerName.includes('europa') || lowerName.includes('io') ||
      lowerName.includes('ganymede') || lowerName.includes('callisto') ||
      lowerName.includes('titan') || lowerName.includes('enceladus')) {
    return 'moon'
  }
  
  // Check for asteroid indicators (including known asteroid names)
  if (lowerName.includes('asteroid') || lowerName.includes('belt') ||
      lowerName.includes('ceres') || lowerName.includes('vesta') ||
      lowerName.includes('pallas') || lowerName.includes('juno')) {
    return 'asteroid'
  }
  
  // Use mass and radius to determine type if available
  if (mass && radius) {
    // Simplified classification for example
    if (mass > 100) return 'star'
    if (mass > 10) return 'gasGiant'
    if (mass > 0.5) return 'planet'
    if (mass < 0.1) return 'moon'
    if (mass < 0.001) return 'asteroid'
  }
  
  // Default to planet if no clear classification
  return 'planet'
}

export function createDualProperties(
  realRadius: number,
  realOrbitRadius: number,
  realMass: number,
  objectName: string,
  viewMode: string,
  systemScale: number = 1.0
): DualObjectProperties {
  const config = VIEW_MODE_CONFIGS[viewMode] || VIEW_MODE_CONFIGS.explorational
  const objectType = determineObjectType(objectName, realMass, realRadius)
  
  // Calculate visual properties based on object type scaling
  const objectScaling = config.objectScaling[objectType] || config.objectScaling.default
  const visualRadius = Math.max(realRadius * objectScaling * systemScale, 0.01) // Ensure minimum visual radius
  const visualOrbitRadius = realOrbitRadius * config.orbitScaling.factor * systemScale
  
  // Calculate optimal view distance based purely on visual radius and configuration
  const optimalViewDistance = visualRadius * config.cameraConfig.radiusMultiplier;
  const minViewDistance = Math.max(
    visualRadius * config.cameraConfig.minDistanceMultiplier, 
    config.cameraConfig.absoluteMinDistance
  );
  const maxViewDistance = Math.min(
    visualRadius * config.cameraConfig.maxDistanceMultiplier, 
    config.cameraConfig.absoluteMaxDistance
  );

  // Ensure min <= optimal <= max and handle edge cases
  let finalMinDistance = minViewDistance;
  let finalMaxDistance = maxViewDistance;
  let finalOptimalDistance = Math.max(optimalViewDistance, config.cameraConfig.absoluteMinDistance);

  if (finalMinDistance > finalOptimalDistance) finalOptimalDistance = finalMinDistance;
  if (finalOptimalDistance > finalMaxDistance) finalOptimalDistance = finalMaxDistance;
  if (finalMinDistance > finalMaxDistance) finalMinDistance = finalMaxDistance;

  return {
    realRadius,
    realOrbitRadius,
    realMass,
    visualRadius,
    visualOrbitRadius,
    visualScale: objectScaling * systemScale,
    objectType,
    optimalViewDistance: finalOptimalDistance,
    minViewDistance: finalMinDistance,
    maxViewDistance: finalMaxDistance
  }
} 