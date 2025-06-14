export interface ViewModeConfig {
  // Object scaling configuration
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
    multiplier: number
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
  
  // Object classification (kept for object scaling only, NOT camera positioning)
  objectType: 'star' | 'planet' | 'moon' | 'gasGiant' | 'asteroid'
  
  // Calculated camera properties (now purely radius-based)
  optimalViewDistance: number
  minViewDistance: number
  maxViewDistance: number
}

// View mode configurations
export const VIEW_MODE_CONFIGS: Record<string, ViewModeConfig> = {
  realistic: {
    objectScaling: {
      star: 1.0,
      planet: 0.5,
      moon: 0.5,
      gasGiant: 0.5,
      asteroid: 0.5,
      default: 1.0
    },
    orbitScaling: {
      multiplier: 2.0,
      minDistance: 0.1,
      maxDistance: 1000
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
      star: 0.5,
      planet: 0.25,
      moon: 0.25,
      gasGiant: 0.3,
      asteroid: 0.25,
      default: 0.5
    },
    orbitScaling: {
      multiplier: 1.0,
      minDistance: 0.1,
      maxDistance: 500
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
      star: 0.75,
      planet: 0.4,
      moon: 0.4,
      gasGiant: 0.5,
      asteroid: 0.4,
      default: 0.75
    },
    orbitScaling: {
      multiplier: 1.5,
      minDistance: 0.1,
      maxDistance: 800
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
): DualObjectProperties['objectType'] {
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
    // Rough classification based on mass (in Earth masses)
    if (mass > 100) return 'star'
    if (mass > 10) return 'gasGiant'
    if (mass < 0.1) return 'moon'
  }
  
  // Default to planet
  return 'planet'
}

// Helper function to create dual properties for an object
export function createDualProperties(
  realRadius: number,
  realOrbitRadius: number,
  realMass: number,
  objectName: string,
  viewMode: string,
  systemScale: number = 1.0
): DualObjectProperties {
  const config = VIEW_MODE_CONFIGS[viewMode] || VIEW_MODE_CONFIGS.realistic
  const objectType = determineObjectType(objectName, realMass, realRadius)
  
  // Calculate visual properties based on view mode
  const objectScaling = config.objectScaling[objectType] || config.objectScaling.default
  const visualRadius = realRadius * objectScaling * systemScale
  const visualOrbitRadius = realOrbitRadius * config.orbitScaling.multiplier * systemScale
  
  // Calculate camera distances based PURELY on visual radius
  const cameraConfig = config.cameraConfig
  const optimalDistance = visualRadius * cameraConfig.radiusMultiplier
  const minDistance = visualRadius * cameraConfig.minDistanceMultiplier
  const maxDistance = visualRadius * cameraConfig.maxDistanceMultiplier
  
  // Apply absolute constraints while maintaining proper ordering (min <= optimal <= max)
  let finalMinDistance = Math.max(minDistance, cameraConfig.absoluteMinDistance)
  let finalMaxDistance = Math.min(maxDistance, cameraConfig.absoluteMaxDistance)
  
  // Ensure min <= max, if not, prioritize the radius-based calculation
  if (finalMinDistance > finalMaxDistance) {
    if (maxDistance > cameraConfig.absoluteMinDistance) {
      // Radius-based max is valid, use it
      finalMaxDistance = Math.max(maxDistance, finalMinDistance)
    } else {
      // Radius-based calculation is too small, use absolute constraints
      finalMaxDistance = Math.max(cameraConfig.absoluteMaxDistance, finalMinDistance)
    }
  }
  
  const finalOptimalDistance = Math.max(
    Math.min(optimalDistance, finalMaxDistance),
    finalMinDistance
  )
  
  return {
    realRadius,
    realOrbitRadius,
    realMass,
    visualRadius,
    visualOrbitRadius,
    visualScale: objectScaling,
    objectType,
    optimalViewDistance: finalOptimalDistance,
    minViewDistance: finalMinDistance,
    maxViewDistance: finalMaxDistance
  }
} 