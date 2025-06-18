/**
 * View Mode Type Definitions
 * ==========================
 */

export interface ViewModeDefinition {
  id: string
  name: string
  category: 'educational' | 'navigation' | 'scientific'
  description: string
  
  // Scaling configuration
  scaling: {
    maxVisualSize: number
    minVisualSize: number
    orbitScaling: number
    safetyMultiplier: number
    minDistance: number
    fixedSizes?: {
      star: number
      planet: number
      moon: number
      asteroid: number
      belt: number
      barycenter: number
    }
  }
  
  // Object scaling multipliers
  objectScaling: {
    star: number
    planet: number
    moon: number
    gasGiant: number
    asteroid: number
    default: number
  }
  
  // Orbital configuration
  orbital: {
    factor: number
    minDistance: number
    maxDistance: number
  }
  
  // Camera configuration
  camera: {
    radiusMultiplier: number
    minDistanceMultiplier: number
    maxDistanceMultiplier: number
    absoluteMinDistance: number
    absoluteMaxDistance: number
    viewingAngles: {
      defaultElevation: number
      birdsEyeElevation: number
    }
    animation: {
      focusDuration: number
      birdsEyeDuration: number
      easingFunction: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
    }
  }
}