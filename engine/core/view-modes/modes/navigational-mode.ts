/**
 * Navigational View Mode
 * =====================
 * 
 * Optimized for navigation with equidistant orbital paths and consistent object sizes.
 * Uses fixed sizes for better navigation experience.
 */

import type { ViewModeDefinition } from '../types'

export const navigationalMode: ViewModeDefinition = {
  id: 'navigational',
  name: 'Navigational',
  description: 'Optimized for navigation with equidistant orbital paths and consistent object sizes',
  icon: '🧭',
  category: 'navigation',
  
  scaling: {
    maxVisualSize: 6.0,     // Increased to maintain proportions with larger orbits
    minVisualSize: 0.2,     // Use optimal Three.js range minimum
    orbitScaling: 40.0,     // COORDINATED: Increased to prevent crowding (Earth=40, Jupiter=208)
    safetyMultiplier: 3.0,  // Large buffer for navigation clarity
    minDistance: 1.0,       // Stay in optimal range
    fixedSizes: {
      star: 2.0,
      planet: 1.2,
      moon: 0.6,
      asteroid: 0.3,
      belt: 0.8,
      barycenter: 0.0,
    }
  },
  
  camera: {
    radiusMultiplier: 3.5,
    minDistanceMultiplier: 2.0,
    maxDistanceMultiplier: 12.0,
    absoluteMinDistance: 0.2,
    absoluteMaxDistance: 80,
    nearPlane: 0.1,
    farPlane: 5000,
    viewingAngles: {
      defaultElevation: 35,
      birdsEyeElevation: 45
    },
    animation: {
      focusDuration: 600,
      birdsEyeDuration: 1000,
      easingFunction: 'easeOut'
    }
  },
  
  orbital: {
    factor: 1.0,
    minDistance: 1.0,
    maxDistance: 30.0
  },
  
  objectScaling: {
    star: 1.8,
    planet: 1.5,
    moon: 1.0,
    gasGiant: 1.8,
    asteroid: 0.6,
    default: 1.0
  },
  
  features: {
    orbitalPaths: true,
    stellarZones: false,
    scientificLabels: false,
    atmosphericEffects: true,
    particleEffects: false,
    coronaEffects: true,
    educationalContent: false,
    debugInfo: false
  },
  
  ui: {
    showDistances: true,
    showMasses: false,
    showOrbitalPeriods: false,
    labelStyle: 'minimal',
    colorScheme: 'default'
  }
}