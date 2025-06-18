/**
 * Scientific View Mode
 * ===================
 * 
 * True-to-life astronomical scales and properties for scientific accuracy.
 * Minimal visual scaling to preserve actual proportions and distances.
 */

import type { ViewModeDefinition } from '../types'

export const scientificMode: ViewModeDefinition = {
  id: 'scientific',
  name: 'Scientific',
  description: 'True-to-life astronomical scales and properties for scientific accuracy',
  icon: '🔬',
  category: 'scientific',
  
  scaling: {
    maxVisualSize: 0.001,
    minVisualSize: 0.00001,
    orbitScaling: 1.0,
    safetyMultiplier: 1.1,
    minDistance: 0.001,
  },
  
  camera: {
    radiusMultiplier: 10.0,
    minDistanceMultiplier: 5.0,
    maxDistanceMultiplier: 1000.0,
    absoluteMinDistance: 0.001,
    absoluteMaxDistance: 10000,
    nearPlane: 0.0001,  // Much smaller near plane for tiny objects
    farPlane: 100000,   // Larger far plane for vast distances
    viewingAngles: {
      defaultElevation: 15,
      birdsEyeElevation: 25
    },
    animation: {
      focusDuration: 1500,
      birdsEyeDuration: 2000,
      easingFunction: 'easeInOut'
    }
  },
  
  orbital: {
    factor: 1.0,
    minDistance: 0.001,
    maxDistance: 1000.0
  },
  
  objectScaling: {
    star: 1.0,
    planet: 1.0,
    moon: 1.0,
    gasGiant: 1.0,
    asteroid: 1.0,
    default: 1.0
  },
  
  features: {
    orbitalPaths: true,
    stellarZones: false,
    scientificLabels: true,
    atmosphericEffects: false,
    particleEffects: false,
    coronaEffects: false,
    educationalContent: false,
    debugInfo: true
  },
  
  ui: {
    showDistances: true,
    showMasses: true,
    showOrbitalPeriods: true,
    labelStyle: 'scientific',
    colorScheme: 'scientific'
  },
  
  // Custom styling for scientific mode
  getObjectStyle: (object, state) => ({
    opacity: state.isSelected ? 1.0 : 0.8,
    wireframe: true,  // Scientific mode shows wireframes for accuracy
  })
}