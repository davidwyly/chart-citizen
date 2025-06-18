import type { ViewModeDefinition } from '../types'

export const explorationalMode: ViewModeDefinition = {
  id: 'explorational',
  name: 'Explorational',
  category: 'educational',
  description: 'Astronomical distances modified for human interpretation',
  
  scaling: {
    maxVisualSize: 0.8,
    minVisualSize: 0.02,
    orbitScaling: 8.0,
    safetyMultiplier: 2.5,
    minDistance: 0.1,
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
    factor: 8.0,
    minDistance: 0.1,
    maxDistance: 100.0
  },
  
  camera: {
    radiusMultiplier: 3.0,
    minDistanceMultiplier: 1.0,
    maxDistanceMultiplier: 10.0,
    absoluteMinDistance: 0.1,
    absoluteMaxDistance: 1000,
    viewingAngles: {
      defaultElevation: 15,
      birdsEyeElevation: 45
    },
    animation: {
      focusDuration: 1000,
      birdsEyeDuration: 1500,
      easingFunction: 'easeOut'
    }
  }
}