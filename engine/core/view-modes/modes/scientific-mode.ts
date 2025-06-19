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
    maxVisualSize: 40.0,    // Allow realistic gas giant sizes (Jupiter ~33 units)
    minVisualSize: 0.1,     // Minimum for good Three.js precision
    orbitScaling: 80.0,     // COORDINATED: Scaled up with visual sizes to prevent cramping
    safetyMultiplier: 1.1,  // Small buffer for collision detection
    minDistance: 0.1,       // Allow close inspection of small objects
    // DESIGN NOTE: orbitScaling 80x gives Earth orbit = 80 units, Jupiter orbit = 416 units
    // With Jupiter visual size = 33 units, this provides 5x clearance ratio
  },
  
  camera: {
    radiusMultiplier: 10.0,
    minDistanceMultiplier: 2.0,   // Reduced to allow closer zoom
    maxDistanceMultiplier: 1000.0,
    absoluteMinDistance: 0.01,    // Reduced to allow closer inspection of small objects
    absoluteMaxDistance: 10000,
    nearPlane: 0.001,   // Increased from 0.0001 to prevent clipping with new min sizes
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