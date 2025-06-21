/**
 * View Mode Compatibility Layer
 * =============================
 * 
 * This module provides compatibility functions to help existing code work
 * with the new view mode registry while we gradually migrate the system.
 * It bridges between the old hardcoded configurations and the new registry.
 */

import { viewModeRegistry, requireViewMode } from './registry'
import type { ViewModeDefinition } from './types'

// ============================================================================
// LEGACY FORMAT COMPATIBILITY
// ============================================================================

/**
 * Convert new ViewModeDefinition to old VIEW_CONFIGS format
 * This helps the orbital mechanics calculator work with the new system
 */
export function getOrbitalMechanicsConfig(modeId: string) {
  // Use safe fallback instead of throwing error
  const mode = viewModeRegistry.get(modeId)
  
  // If mode not found, return explorational fallback config
  if (!mode) {
    console.warn(`View mode "${modeId}" not found in registry, using explorational fallback`)
    return {
      maxVisualSize: 0.8,
      minVisualSize: 0.02,
      orbitScaling: 8.0,
      safetyMultiplier: 2.5,
      minDistance: 0.1,
      fixedSizes: undefined
    }
  }
  
  const result: any = {
    maxVisualSize: mode.scaling.maxVisualSize,
    minVisualSize: mode.scaling.minVisualSize,
    orbitScaling: mode.scaling.orbitScaling,
    safetyMultiplier: mode.scaling.safetyMultiplier,
    minDistance: mode.scaling.minDistance,
  }
  
  // Only include fixedSizes if it actually exists in the mode definition
  if ('fixedSizes' in mode.scaling && mode.scaling.fixedSizes !== undefined) {
    result.fixedSizes = mode.scaling.fixedSizes
  }
  
  return result
}

/**
 * Convert new ViewModeDefinition to old VIEW_MODE_CONFIGS format
 * This helps components that use the old configuration format
 */
export function getViewModeConfig(modeId: string) {
  // Use safe fallback instead of throwing error
  const mode = viewModeRegistry.get(modeId)
  
  // If mode not found, return explorational fallback config
  if (!mode) {
    console.warn(`View mode "${modeId}" not found in registry, using explorational fallback`)
    return {
      objectScaling: { star: 1.0, planet: 1.0, moon: 1.0 },
      orbitScaling: { factor: 8.0, minDistance: 0.1 },
      cameraConfig: { 
        radiusMultiplier: 3.0,
        maxZoom: 100.0,
        bookmarkDistance: 50.0
      }
    }
  }
  
  const result = {
    objectScaling: mode.objectScaling,
    orbitScaling: mode.orbital,
    cameraConfig: mode.camera
  }
  
  return result
}

/**
 * Get camera configuration in the format expected by existing components
 */
export function getCameraConfig(modeId: string) {
  // Use safe fallback instead of throwing error
  const mode = viewModeRegistry.get(modeId)
  
  // If mode not found, return safe camera fallback
  if (!mode) {
    console.warn(`View mode "${modeId}" not found in registry, using camera fallback`)
    return {
      radiusMultiplier: 3.0,
      maxZoom: 100.0,
      bookmarkDistance: 50.0
    }
  }
  
  return mode.camera
}

/**
 * Get scaling configuration in the format expected by existing components
 */
export function getScalingConfig(modeId: string) {
  // Use safe fallback instead of throwing error
  const mode = viewModeRegistry.get(modeId)
  
  // If mode not found, return safe scaling fallback
  if (!mode) {
    console.warn(`View mode "${modeId}" not found in registry, using scaling fallback`)
    return {
      maxVisualSize: 0.8,
      minVisualSize: 0.02,
      orbitScaling: 8.0,
      safetyMultiplier: 2.5,
      minDistance: 0.1
    }
  }
  
  return mode.scaling
}

/**
 * Get object scaling configuration in the format expected by existing components
 */
export function getObjectScalingConfig(modeId: string) {
  // Use safe fallback instead of throwing error
  const mode = viewModeRegistry.get(modeId)
  
  // If mode not found, return safe object scaling fallback
  if (!mode) {
    console.warn(`View mode "${modeId}" not found in registry, using object scaling fallback`)
    return {
      star: 1.0,
      planet: 1.0,
      moon: 1.0
    }
  }
  
  return mode.objectScaling
}

// ============================================================================
// FEATURE DETECTION
// ============================================================================

/**
 * Check if a feature should be shown for a given view mode
 */
export function shouldShowFeature(modeId: string, feature: keyof ViewModeDefinition['features']): boolean {
  const mode = viewModeRegistry.get(modeId)
  return mode?.features[feature] ?? false
}

/**
 * Get all enabled features for a view mode
 */
export function getEnabledFeatures(modeId: string): string[] {
  const mode = viewModeRegistry.get(modeId)
  if (!mode) return []
  
  return Object.entries(mode.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature)
}

// ============================================================================
// LEGACY VIEW_CONFIGS COMPATIBILITY
// ============================================================================

/**
 * Generate the old VIEW_CONFIGS object for complete backward compatibility
 * This allows existing code to continue working without changes
 */
export function getLegacyViewConfigs() {
  const allModes = viewModeRegistry.getAll()
  const configs: Record<string, any> = {}
  
  for (const mode of allModes) {
    configs[mode.id] = getOrbitalMechanicsConfig(mode.id)
  }
  
  return configs
}

/**
 * Generate the old VIEW_MODE_CONFIGS object for complete backward compatibility
 */
export function getLegacyViewModeConfigs() {
  const allModes = viewModeRegistry.getAll()
  const configs: Record<string, any> = {}
  
  for (const mode of allModes) {
    configs[mode.id] = getViewModeConfig(mode.id)
  }
  
  return configs
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Validate that all expected view modes are registered
 */
export function validateMigration(): {
  success: boolean
  missing: string[]
  extra: string[]
} {
  const expectedModes = ['explorational', 'navigational', 'profile', 'scientific']
  const registeredModes = viewModeRegistry.getIds()
  
  const missing = expectedModes.filter(id => !registeredModes.includes(id))
  const extra = registeredModes.filter(id => !expectedModes.includes(id))
  
  return {
    success: missing.length === 0,
    missing,
    extra
  }
}

/**
 * Log migration status for debugging
 */
export function logMigrationStatus(): void {
  const validation = validateMigration()
  const stats = viewModeRegistry.getStats()
  
  console.group('🔄 View Mode Migration Status')
  console.log('Registry Stats:', stats)
  console.log('Migration Validation:', validation)
  
  if (validation.success) {
    console.log('✅ All expected view modes are registered')
  } else {
    if (validation.missing.length > 0) {
      console.warn('⚠️ Missing view modes:', validation.missing)
    }
    if (validation.extra.length > 0) {
      console.info('ℹ️ Extra view modes:', validation.extra)
    }
  }
  
  console.groupEnd()
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Compare old and new configurations for a specific mode (development only)
 */
export function compareConfigurations(modeId: string, oldConfig: any): void {
  if (process.env.NODE_ENV !== 'development') return
  
  const newConfig = getOrbitalMechanicsConfig(modeId)
  
  console.group(`🔍 Configuration Comparison: ${modeId}`)
  console.log('Old Config:', oldConfig)
  console.log('New Config:', newConfig)
  
  // Check for differences
  const differences: string[] = []
  
  for (const key in oldConfig) {
    if (JSON.stringify(oldConfig[key]) !== JSON.stringify(newConfig[key])) {
      differences.push(key)
    }
  }
  
  if (differences.length > 0) {
    console.warn('⚠️ Differences found in:', differences)
  } else {
    console.log('✅ Configurations match')
  }
  
  console.groupEnd()
}