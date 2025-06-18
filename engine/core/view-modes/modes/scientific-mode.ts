import type { ViewModeDefinition } from '../types'

export const scientificMode: ViewModeDefinition = {
  id: 'scientific',
  name: 'Scientific',
  category: 'scientific',
  description: 'True-to-life scale with accurate astronomical distances',
  
  scaling: {
    maxVisualSize: 0.8,
    minVisualSize: 0.001,
    orbitScaling: 1.0,
    safetyMultiplier: 1.0,
    minDistance: 0.01,
  },
  
  objectScaling: {
    star: 1.0,
    planet: 1.0,
    moon: 1.0,
    gasGiant: 1.0,
    asteroid: 1.0,
    default: 1.0
  },
  
  orbital: {
    factor: 1.0,
    minDistance: 0.01,
    maxDistance: 1000.0
  },
  
  camera: {
    radiusMultiplier: 5.0,
    minDistanceMultiplier: 0.1,
    maxDistanceMultiplier: 100.0,
    absoluteMinDistance: 0.001,
    absoluteMaxDistance: 20000,
    viewingAngles: {
      defaultElevation: 15,
      birdsEyeElevation: 45
    },
    animation: {
      focusDuration: 2000,
      birdsEyeDuration: 3000,
      easingFunction: 'easeInOut'
    }
  }
}