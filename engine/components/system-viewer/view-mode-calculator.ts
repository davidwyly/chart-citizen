"use client"

import type { ViewType } from '@lib/types/effects-level'
import { VIEW_MODE_CONFIGS, createDualProperties, type DualObjectProperties, type ViewModeConfig } from '@/engine/types/view-mode-config'

export interface ObjectSizing {
  actualSize: number
  visualSize: number
  dualProperties: DualObjectProperties
}

export interface ViewModeScaling {
  STAR_SCALE: number
  PLANET_SCALE: number
  ORBITAL_SCALE: number
  STAR_SHADER_SCALE: number
}

// Legacy function for backward compatibility - now powered by unified config
export function calculateViewModeScaling(viewType: ViewType): ViewModeScaling {
  const config = VIEW_MODE_CONFIGS[viewType] || VIEW_MODE_CONFIGS.realistic
  
  return {
    STAR_SCALE: config.objectScaling.star,
    PLANET_SCALE: config.objectScaling.planet,
    ORBITAL_SCALE: config.orbitScaling.multiplier,
    STAR_SHADER_SCALE: config.objectScaling.star
  }
}

// Main function using the unified configuration system
export function calculateUnifiedObjectProperties(
  objectName: string,
  baseRadius: number,
  orbitRadius: number,
  mass: number,
  viewType: ViewType,
  systemScale: number = 1.0
): DualObjectProperties {
  return createDualProperties(
    baseRadius,
    orbitRadius,
    mass,
    objectName,
    viewType,
    systemScale
  )
}

// Enhanced object sizing calculation using unified system
export function calculateObjectSizing(
  objectType: string,
  baseRadius: number,
  viewType: ViewType,
  systemScale: number,
  objectName?: string,
  orbitRadius?: number,
  mass?: number
): ObjectSizing {
  const validBaseRadius = typeof baseRadius === "number" && !isNaN(baseRadius) && baseRadius > 0 ? baseRadius : 1.0
  const validSystemScale = typeof systemScale === "number" && !isNaN(systemScale) && systemScale > 0 ? systemScale : 1.0
  
  // Use unified system with intelligent defaults
  const name = objectName || `Unknown ${objectType}`
  const orbit = orbitRadius || 0
  const objMass = mass || (objectType === 'star' ? 100 : objectType === 'planet' ? 1 : 0.1)
  
  const dualProperties = calculateUnifiedObjectProperties(
    name,
    validBaseRadius,
    orbit,
    objMass,
    viewType,
    validSystemScale
  )
  
  return {
    actualSize: dualProperties.realRadius * validSystemScale,
    visualSize: dualProperties.visualRadius,
    dualProperties
  }
}

// Helper function to ensure valid scale values
export function validateScale(scale: number | undefined, fallback = 1.0): number {
  if (scale === undefined || typeof scale !== "number" || isNaN(scale) || scale <= 0) {
    return fallback
  }
  return scale
}

// Calculate profile layout positions with validation
export function calculateProfileLayout(
  objectCount: number,
  viewportWidth: number,
  centralObjectRadius: number,
): { positions: number[]; maxDistance: number } {
  // Validate inputs
  const validObjectCount = Math.max(1, Math.floor(objectCount))
  const validViewportWidth = validateScale(viewportWidth, 1000)
  const validCentralObjectRadius = validateScale(centralObjectRadius, 50)

  const leftMargin = validCentralObjectRadius * 2 + 50 // Space for central object plus margin
  const rightMargin = 50
  const availableWidth = validViewportWidth - leftMargin - rightMargin

  const positions: number[] = []
  const spacing = availableWidth / Math.max(1, validObjectCount - 1)

  for (let i = 0; i < validObjectCount; i++) {
    const position = leftMargin + i * spacing
    positions.push(validateScale(position))
  }

  const maxDistance = validateScale(positions[positions.length - 1] || leftMargin)

  return { positions, maxDistance }
}

// New utility functions for the unified system

// Get view mode configuration
export function getViewModeConfig(viewType: ViewType): ViewModeConfig {
  return VIEW_MODE_CONFIGS[viewType] || VIEW_MODE_CONFIGS.realistic
}

// Calculate camera distance for an object using the unified system
export function calculateCameraDistance(
  objectName: string,
  radius: number,
  viewType: ViewType,
  mass?: number,
  orbitRadius?: number
): { optimal: number; min: number; max: number } {
  const dualProperties = createDualProperties(
    radius,
    orbitRadius || 0,
    mass || 1.0,
    objectName,
    viewType
  )
  
  return {
    optimal: dualProperties.optimalViewDistance,
    min: dualProperties.minViewDistance,
    max: dualProperties.maxViewDistance
  }
}

// Check if an object should use unified calculations
export function shouldUseUnifiedCalculations(
  objectName?: string,
  radius?: number,
  mass?: number,
  orbitRadius?: number
): boolean {
  return !!(objectName && radius !== undefined && mass !== undefined)
}
