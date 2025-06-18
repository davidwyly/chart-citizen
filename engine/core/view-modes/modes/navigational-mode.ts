import type { ViewModeDefinition } from '../types'

export const navigationalMode: ViewModeDefinition = {
  id: 'navigational',
  name: 'Navigational',
  category: 'navigation',
  description: 'Equidistant orbital paths in 3D for easier navigation',
  
  scaling: {
    maxVisualSize: 2.5,
    minVisualSize: 0.05,
    orbitScaling: 0.6,
    safetyMultiplier: 3.0,
    minDistance: 0.2,
    fixedSizes: {
      star: 2.0,
      planet: 1.2,
      moon: 0.6,
      asteroid: 0.3,
      belt: 0.8,
      barycenter: 0.0,
    }
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
    factor: 0.6,
    minDistance: 0.2,
    maxDistance: 50.0
  },
  
  camera: {
    radiusMultiplier: 2.5,
    minDistanceMultiplier: 1.5,
    maxDistanceMultiplier: 15.0,
    absoluteMinDistance: 0.5,
    absoluteMaxDistance: 500,
    viewingAngles: {
      defaultElevation: 20,
      birdsEyeElevation: 40
    },
    animation: {
      focusDuration: 1200,
      birdsEyeDuration: 1800,
      easingFunction: 'easeInOut'
    }
  }
}