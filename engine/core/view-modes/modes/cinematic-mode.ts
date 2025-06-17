/**
 * Cinematic View Mode - DEMONSTRATION
 * ==================================
 * 
 * This is a demonstration of how easy it is to add a new view mode
 * with the new extensible architecture. This mode doesn't require
 * ANY changes to existing code - it's completely self-contained.
 * 
 * This mode is optimized for dramatic visuals and storytelling.
 */

import type { ViewModeDefinition, CalculationContext, RenderContext, ObjectState, StyleConfig } from '../types'
import type { CelestialObject } from '@/engine/types/orbital-system'

export const cinematicMode: ViewModeDefinition = {
  id: 'cinematic',
  name: 'Cinematic',
  description: 'Dramatic visuals optimized for storytelling and presentation',
  icon: '🎬',
  category: 'gaming',
  
  scaling: {
    maxVisualSize: 3.0,  // Larger objects for dramatic effect
    minVisualSize: 0.1,  // Minimum size ensures visibility
    orbitScaling: 2.0,   // Moderately compressed orbits
    safetyMultiplier: 2.0,
    minDistance: 0.2,
    fixedSizes: {
      star: 3.0,        // Large, dramatic stars
      planet: 2.0,      // Prominent planets
      moon: 1.0,        // Visible moons
      asteroid: 0.5,    // Small but visible asteroids
      belt: 1.5,        // Prominent belts
      barycenter: 0.0,
    }
  },
  
  camera: {
    radiusMultiplier: 3.0,        // Closer for dramatic effect
    minDistanceMultiplier: 1.5,   // Close-up views allowed
    maxDistanceMultiplier: 8.0,   // Not too far for drama
    absoluteMinDistance: 0.2,
    absoluteMaxDistance: 150,
    nearPlane: 0.1,
    farPlane: 10000,
    viewingAngles: {
      defaultElevation: 25,  // Slightly dramatic angle
      birdsEyeElevation: 35
    },
    animation: {
      focusDuration: 1200,    // Slower, more dramatic transitions
      birdsEyeDuration: 1800,
      easingFunction: 'leap'  // Dramatic easing
    }
  },
  
  orbital: {
    factor: 1.5,
    minDistance: 1.0,
    maxDistance: 40.0
  },
  
  objectScaling: {
    star: 2.5,      // Prominent stars
    planet: 2.0,    // Large planets
    moon: 1.5,      // Visible moons
    gasGiant: 3.0,  // Massive gas giants
    asteroid: 1.0,  // Visible asteroids
    default: 1.5
  },
  
  features: {
    orbitalPaths: true,
    stellarZones: false,      // No distracting zones
    scientificLabels: false,  // Keep it clean for cinema
    atmosphericEffects: true, // Beautiful atmospheres
    particleEffects: true,    // Dramatic particle effects
    coronaEffects: true,      // Stellar coronas for drama
    educationalContent: false,
    debugInfo: false
  },
  
  ui: {
    showDistances: false,     // Clean cinematic UI
    showMasses: false,
    showOrbitalPeriods: false,
    labelStyle: 'minimal',
    colorScheme: 'default'
  },
  
  // Custom behavior: Enhanced visual styling for cinematic effect
  getObjectStyle: (object: CelestialObject, state: ObjectState): StyleConfig => {
    const baseStyle: StyleConfig = {
      opacity: state.isSelected ? 1.0 : 0.95,
      wireframe: false,
    }
    
    // Enhanced lighting and materials for drama
    if (object.classification === 'star') {
      return {
        ...baseStyle,
        emissive: new (require('three')).Color(0xffaa44), // Warm glow
        opacity: 1.0, // Stars always full opacity
      }
    }
    
    if (object.classification === 'planet') {
      return {
        ...baseStyle,
        metalness: 0.1,
        roughness: 0.3, // Slightly reflective for drama
      }
    }
    
    return baseStyle
  },
  
  // Custom visual radius calculation for dramatic effect
  calculateVisualRadius: (object: CelestialObject, context: CalculationContext): number => {
    const { mode } = context
    const radiusKm = object.properties.radius || 1
    const config = mode.scaling
    
    // Use fixed sizes with dramatic scaling
    if (config.fixedSizes) {
      let sizeKey = object.classification || 'asteroid'
      
      // Special dramatic scaling for gas giants
      if (object.classification === 'planet' && object.geometry_type === 'gas_giant') {
        return (config.fixedSizes.planet || 2.0) * 2.0 // Even larger for drama!
      }
      
      let fixedSize = config.fixedSizes[sizeKey as keyof typeof config.fixedSizes]
      return fixedSize || config.fixedSizes.asteroid
    }
    
    // Fallback to enhanced logarithmic scaling
    const logRadius = Math.log10(radiusKm)
    const enhancedSize = Math.max(0, Math.min(1, logRadius / 10)) // Enhanced scaling curve
    
    return config.minVisualSize + (enhancedSize * (config.maxVisualSize - config.minVisualSize))
  },
  
  // Custom properties for future extensibility
  custom: {
    cinematicVersion: '1.0',
    dramaticMultiplier: 1.5,
    preferredLighting: 'dramatic',
    cameraEffects: ['bloom', 'vignette'],
    author: 'Chart Citizen Team',
  }
}

// Note: This mode would be auto-registered if imported in the main index.ts
// For now, it's just a demonstration of the extensibility