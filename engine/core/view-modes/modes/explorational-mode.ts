/**
 * Explorational View Mode
 * ======================
 * 
 * Educational content with real astronomical data, optimized for exploration and learning.
 * Uses logarithmic scaling with proportional parent-child relationships.
 */

import type { ViewModeDefinition } from '../types'

export const explorationalMode: ViewModeDefinition = {
  id: 'explorational',
  name: 'Explorational',
  description: 'Educational content with real astronomical data, optimized for exploration and learning',
  icon: '🔭',
  category: 'educational',
  
  scaling: {
    maxVisualSize: 8.0,     // Allow gas giants while keeping UI manageable
    minVisualSize: 0.1,     // Use optimal Three.js range minimum
    orbitScaling: 50.0,     // COORDINATED: Scaled with visual sizes (Earth=50, Jupiter=260)
    safetyMultiplier: 2.5,  // Buffer for educational content spacing
    minDistance: 0.1,       // Allow closer inspection
    // DESIGN NOTE: With smaller max visual sizes, we can use tighter orbit scaling
    // Jupiter ~8 units visual, 260 units orbit = 32x clearance (very comfortable)
  },
  
  camera: {
    radiusMultiplier: 4.0,
    minDistanceMultiplier: 2.5,
    maxDistanceMultiplier: 15.0,
    absoluteMinDistance: 0.3,
    absoluteMaxDistance: 100,
    nearPlane: 0.1,
    farPlane: 5000,
    viewingAngles: {
      defaultElevation: 30,
      birdsEyeElevation: 40
    },
    animation: {
      focusDuration: 800,
      birdsEyeDuration: 1200,
      easingFunction: 'leap'
    }
  },
  
  orbital: {
    factor: 0.8,
    minDistance: 0.5,
    maxDistance: 50.0
  },
  
  objectScaling: {
    star: 2.5,
    planet: 1.8,
    moon: 1.2,
    gasGiant: 2.2,
    asteroid: 0.8,
    default: 1.0
  },
  
  features: {
    orbitalPaths: true,
    stellarZones: true,
    scientificLabels: true,
    atmosphericEffects: true,
    particleEffects: true,
    coronaEffects: true,
    educationalContent: true,
    debugInfo: false
  },
  
  ui: {
    showDistances: true,
    showMasses: true,
    showOrbitalPeriods: true,
    labelStyle: 'detailed',
    colorScheme: 'educational'
  }
}