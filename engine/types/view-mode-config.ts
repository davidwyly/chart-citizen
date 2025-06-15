export interface ViewModeConfig {
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
  
  // Calculated camera properties (now purely radius-based)
  optimalViewDistance: number
  minViewDistance: number
  maxViewDistance: number
}

// View mode configurations
export const VIEW_MODE_CONFIGS: Record<string, ViewModeConfig> = {
  realistic: {
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
    if (mass < 0.001) return 'asteroid'
  }
  
  // Default to planet if no clear classification
  return 'planet'
}

export function createDualProperties(
  realRadius: number,
  realOrbitRadius: number,
  realMass: number,
  visualRadius: number,
  visualOrbitRadius: number,
  objectName: string,
  viewMode: string,
): DualObjectProperties {
  const config = VIEW_MODE_CONFIGS[viewMode] || VIEW_MODE_CONFIGS.realistic
  
  // Calculate optimal view distance based purely on visual radius and configuration
  const optimalViewDistance = visualRadius * config.cameraConfig.radiusMultiplier;
  const minViewDistance = Math.max(visualRadius * config.cameraConfig.minDistanceMultiplier, config.cameraConfig.absoluteMinDistance);
  const maxViewDistance = Math.min(visualRadius * config.cameraConfig.maxDistanceMultiplier, config.cameraConfig.absoluteMaxDistance);

  // Ensure min <= optimal <= max
  let finalMinDistance = minViewDistance;
  let finalMaxDistance = maxViewDistance;
  let finalOptimalDistance = optimalViewDistance;

  if (finalMinDistance > finalOptimalDistance) finalOptimalDistance = finalMinDistance;
  if (finalOptimalDistance > finalMaxDistance) finalOptimalDistance = finalMaxDistance;
  if (finalMinDistance > finalMaxDistance) finalMinDistance = finalMaxDistance; // Should not happen with current logic, but as a safeguard

  return {
    realRadius,
    realOrbitRadius,
    realMass,
    visualRadius,
    visualOrbitRadius,
    visualScale: 1.0, // This is now primarily handled by the orbital mechanics calculator
    optimalViewDistance: finalOptimalDistance,
    minViewDistance: finalMinDistance,
    maxViewDistance: finalMaxDistance
  }
} 