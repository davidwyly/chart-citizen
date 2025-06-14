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
    // Distance multipliers for different object types
    distanceMultipliers: {
      star: number
      planet: number
      moon: number
      gasGiant: number
      asteroid: number
      default: number
    }
    
    // Minimum and maximum camera distances
    distanceConstraints: {
      star: { min: number; max: number }
      planet: { min: number; max: number }
      moon: { min: number; max: number }
      gasGiant: { min: number; max: number }
      asteroid: { min: number; max: number }
      default: { min: number; max: number }
    }
    
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
  
  // Object classification
  objectType: 'star' | 'planet' | 'moon' | 'gasGiant' | 'asteroid'
  
  // Calculated camera properties
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
      distanceMultipliers: {
        star: 8.0,
        planet: 3.0,
        moon: 2.0,
        gasGiant: 5.0,
        asteroid: 2.0,
        default: 3.0
      },
      distanceConstraints: {
        star: { min: 2.0, max: 100 },
        planet: { min: 0.5, max: 20 },
        moon: { min: 0.3, max: 10 },
        gasGiant: { min: 1.0, max: 30 },
        asteroid: { min: 0.2, max: 5 },
        default: { min: 0.5, max: 20 }
      },
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
      distanceMultipliers: {
        star: 6.0,
        planet: 2.5,
        moon: 1.8,
        gasGiant: 4.0,
        asteroid: 1.8,
        default: 2.5
      },
      distanceConstraints: {
        star: { min: 1.5, max: 80 },
        planet: { min: 0.4, max: 15 },
        moon: { min: 0.2, max: 8 },
        gasGiant: { min: 0.8, max: 25 },
        asteroid: { min: 0.15, max: 4 },
        default: { min: 0.4, max: 15 }
      },
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
      distanceMultipliers: {
        star: 4.0,
        planet: 2.0,
        moon: 1.5,
        gasGiant: 3.0,
        asteroid: 1.5,
        default: 2.0
      },
      distanceConstraints: {
        star: { min: 1.0, max: 60 },
        planet: { min: 0.3, max: 12 },
        moon: { min: 0.15, max: 6 },
        gasGiant: { min: 0.6, max: 20 },
        asteroid: { min: 0.1, max: 3 },
        default: { min: 0.3, max: 12 }
      },
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
  if (lowerName.includes('star') || lowerName.includes('sun')) {
    return 'star'
  }
  
  // Check for gas giant indicators
  if (lowerName.includes('jupiter') || lowerName.includes('saturn') || 
      lowerName.includes('uranus') || lowerName.includes('neptune') ||
      lowerName.includes('gas giant')) {
    return 'gasGiant'
  }
  
  // Check for moon indicators
  if (lowerName.includes('moon') || lowerName.includes('satellite')) {
    return 'moon'
  }
  
  // Check for asteroid indicators
  if (lowerName.includes('asteroid') || lowerName.includes('belt')) {
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
  
  // Calculate camera distances
  const distanceMultiplier = config.cameraConfig.distanceMultipliers[objectType] || 
                           config.cameraConfig.distanceMultipliers.default
  const constraints = config.cameraConfig.distanceConstraints[objectType] || 
                      config.cameraConfig.distanceConstraints.default
  
  const optimalViewDistance = Math.max(
    Math.min(visualRadius * distanceMultiplier, constraints.max),
    constraints.min
  )
  
  return {
    realRadius,
    realOrbitRadius,
    realMass,
    visualRadius,
    visualOrbitRadius,
    visualScale: objectScaling,
    objectType,
    optimalViewDistance,
    minViewDistance: constraints.min,
    maxViewDistance: constraints.max
  }
} 