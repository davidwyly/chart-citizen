/**
 * Profile View Mode
 * ================
 * 
 * Top-down diagrammatic view with orthographic projection.
 * Compact layout optimized for orbital relationship visualization.
 */

import type { ViewModeDefinition } from '../types'

export const profileMode: ViewModeDefinition = {
  id: 'profile',
  name: 'Profile',
  description: 'Top-down diagrammatic view with orthographic projection for orbital relationships',
  icon: '📊',
  category: 'educational',
  
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
  
  camera: {
    radiusMultiplier: 2.5,
    minDistanceMultiplier: 1.8,
    maxDistanceMultiplier: 8.0,
    absoluteMinDistance: 0.15,
    absoluteMaxDistance: 60,
    nearPlane: 0.1,
    farPlane: 5000,
    viewingAngles: {
      defaultElevation: 22.5,  // 22.5-degree softer angle for profile
      birdsEyeElevation: 22.5
    },
    animation: {
      focusDuration: 400,
      birdsEyeDuration: 600,
      easingFunction: 'easeInOut'
    }
  },
  
  orbital: {
    factor: 0.3,  // Much smaller factor for tighter, more linear layout
    minDistance: 4.0,  // Equidistant spacing
    maxDistance: 20.0  // Allow more spread for many objects
  },
  
  objectScaling: {
    star: 1.5,
    planet: 1.0,
    moon: 0.8,
    gasGiant: 1.2,
    asteroid: 0.5,
    default: 1.0
  },
  
  features: {
    orbitalPaths: true,  // Keep orbital paths for perspective in 45° view
    stellarZones: false,
    scientificLabels: true,
    atmosphericEffects: false,
    particleEffects: false,
    coronaEffects: false,
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