import type { ViewModeDefinition } from '../types'

export const profileMode: ViewModeDefinition = {
  id: 'profile',
  name: 'Profile',
  category: 'educational',
  description: 'Top-down diagrammatic view with orthographic projection',
  
  scaling: {
    maxVisualSize: 1.5,
    minVisualSize: 0.03,
    orbitScaling: 0.3,
    safetyMultiplier: 3.5,
    minDistance: 0.3,
    fixedSizes: {
      star: 1.5,
      planet: 0.8,
      moon: 0.4,
      asteroid: 0.2,
      belt: 0.6,
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
    factor: 0.3,
    minDistance: 0.3,
    maxDistance: 30.0
  },
  
  camera: {
    radiusMultiplier: 4.0,
    minDistanceMultiplier: 2.0,
    maxDistanceMultiplier: 20.0,
    absoluteMinDistance: 1.0,
    absoluteMaxDistance: 300,
    viewingAngles: {
      defaultElevation: 90,
      birdsEyeElevation: 90
    },
    animation: {
      focusDuration: 800,
      birdsEyeDuration: 1200,
      easingFunction: 'easeOut'
    }
  }
}