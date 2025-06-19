/**
 * DYNAMIC CAMERA CALCULATOR
 * =========================
 * 
 * Calculates optimal camera settings based on actual object scales and distances
 * in each view mode to prevent clipping and ensure proper zoom functionality.
 */

import type { CelestialObject } from '../types/orbital-system'
import { calculateSystemOrbitalMechanics } from './orbital-mechanics-calculator'
import type { ViewType } from '@lib/types/effects-level'

export interface DynamicCameraSettings {
  nearPlane: number
  farPlane: number
  absoluteMinDistance: number
  absoluteMaxDistance: number
  // Additional metadata for debugging
  _metadata?: {
    minVisualSize: number
    maxVisualSize: number
    minOrbitDistance: number
    maxOrbitDistance: number
    minCameraDistance: number
    maxCameraDistance: number
    scaleRange: number
  }
}

/**
 * Calculate dynamic camera settings based on actual object scales in the system
 */
export function calculateDynamicCameraSettings(
  systemData: CelestialObject[],
  viewType: ViewType
): DynamicCameraSettings {
  // Calculate orbital mechanics for this view mode
  const mechanics = calculateSystemOrbitalMechanics(systemData, viewType)
  
  // Analyze the actual scales in the system
  let minVisualSize = Number.MAX_VALUE
  let maxVisualSize = 0
  let minOrbitDistance = Number.MAX_VALUE
  let maxOrbitDistance = 0
  
  systemData.forEach(obj => {
    const objMechanics = mechanics.get(obj.id)
    if (objMechanics) {
      const visual = objMechanics.visualRadius
      const orbit = objMechanics.orbitDistance || 0
      
      minVisualSize = Math.min(minVisualSize, visual)
      maxVisualSize = Math.max(maxVisualSize, visual)
      
      if (orbit > 0) {
        minOrbitDistance = Math.min(minOrbitDistance, orbit)
        maxOrbitDistance = Math.max(maxOrbitDistance, orbit)
      }
    }
  })
  
  // Handle edge cases
  if (minOrbitDistance === Number.MAX_VALUE) {
    minOrbitDistance = maxVisualSize * 10 // Fallback
    maxOrbitDistance = maxVisualSize * 100
  }
  
  // Calculate camera distance range (based on standard 4x multiplier)
  const minCameraDistance = minVisualSize * 4.0
  const maxCameraDistance = maxVisualSize * 4.0
  
  // Calculate frustum settings with safety margins
  const baseFrustum = calculateBaseFrustum(
    minCameraDistance,
    maxCameraDistance,
    minOrbitDistance,
    maxOrbitDistance
  )
  
  // Apply view-mode-specific adjustments
  const settings = applyViewModeAdjustments(baseFrustum, viewType)
  
  // Add metadata for debugging
  settings._metadata = {
    minVisualSize,
    maxVisualSize,
    minOrbitDistance,
    maxOrbitDistance,
    minCameraDistance,
    maxCameraDistance,
    scaleRange: maxVisualSize / minVisualSize
  }
  
  return settings
}

/**
 * Calculate base frustum settings from scene bounds
 * Positions cameras in the middle range of Three.js precision for optimal rendering
 */
function calculateBaseFrustum(
  minCameraDistance: number,
  maxCameraDistance: number,
  minOrbitDistance: number,
  maxOrbitDistance: number
): DynamicCameraSettings {
  // Target the sweet spot of Three.js precision: 0.1 to 1000 units
  // Scale everything to fit comfortably in this range
  
  const sceneSize = Math.max(maxOrbitDistance, maxCameraDistance, 1.0)
  
  // Scale factor to bring scene into optimal range (target max ~500 units)
  const targetMaxSize = 500
  const scaleFactor = Math.min(targetMaxSize / sceneSize, 1.0)
  
  // Apply scaling to all distances
  const scaledMinCamera = minCameraDistance * scaleFactor
  const scaledMaxCamera = maxCameraDistance * scaleFactor
  const scaledMaxOrbit = maxOrbitDistance * scaleFactor
  
  // Near plane: 1% of scaled camera distance, staying in good precision range
  const near = Math.max(scaledMinCamera * 0.01, 0.1)
  
  // Far plane: Generous margin for skybox, but not extreme
  const far = Math.max(scaledMaxOrbit * 10.0, 2000)
  
  // Zoom constraints: Allow reasonable inspection without extremes
  const minDistance = Math.max(scaledMinCamera * 0.3, 0.1)  // Allow closer for small objects
  const maxDistance = Math.max(scaledMaxOrbit * 3.0, far * 0.3)
  
  return {
    nearPlane: near,
    farPlane: far,
    absoluteMinDistance: minDistance,
    absoluteMaxDistance: maxDistance
  }
}

/**
 * Apply view-mode-specific adjustments to base settings
 */
function applyViewModeAdjustments(
  base: DynamicCameraSettings,
  viewType: ViewType
): DynamicCameraSettings {
  // All view modes stay in optimal Three.js range - no extreme adjustments
  switch (viewType) {
    case 'scientific':
      // Scientific: Closer inspection but stay in optimal range
      return {
        nearPlane: Math.max(base.nearPlane * 0.5, 0.1), // Closer near but not extreme
        farPlane: base.farPlane, // Keep skybox-safe
        absoluteMinDistance: Math.max(base.absoluteMinDistance * 0.2, 0.05), // Much closer zoom for tiny objects
        absoluteMaxDistance: base.absoluteMaxDistance * 1.5 // Wider zoom range
      }
      
    case 'explorational':
      // Explorational: Balanced settings in optimal range
      return base
      
    case 'navigational':
      // Navigational: Conservative but not extreme
      return {
        nearPlane: Math.max(base.nearPlane * 1.5, 0.2),
        farPlane: base.farPlane,
        absoluteMinDistance: Math.max(base.absoluteMinDistance * 1.5, 1.0),
        absoluteMaxDistance: base.absoluteMaxDistance * 0.8
      }
      
    case 'profile':
      // Profile: Top-down view with reasonable constraints
      return {
        nearPlane: Math.max(base.nearPlane * 2.0, 0.5),
        farPlane: base.farPlane,
        absoluteMinDistance: Math.max(base.absoluteMinDistance * 2.0, 2.0),
        absoluteMaxDistance: base.absoluteMaxDistance * 0.7
      }
      
    default:
      return base
  }
}

