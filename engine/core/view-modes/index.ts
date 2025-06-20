/**
 * View Mode System - Main Entry Point
 * ===================================
 * 
 * This is the main entry point for the extensible view mode system.
 * It automatically registers all built-in view modes and provides
 * the main API for working with view modes.
 */

// Re-export core types and registry
export * from './types'
export * from './registry'

// Import all built-in view modes
import { explorationalMode } from './modes/explorational-mode'
import { navigationalMode } from './modes/navigational-mode'
import { profileMode } from './modes/profile-mode'
import { scientificMode } from './modes/scientific-mode'

// Import the registry instance
import { viewModeRegistry } from './registry'

// ============================================================================
// AUTO-REGISTRATION OF BUILT-IN MODES
// ============================================================================

// Track initialization state to prevent duplicate registration
// Use globalThis to persist across hot reloads in development
declare global {
  var __VIEW_MODES_INITIALIZED__: boolean | undefined
}

const isInitialized = () => globalThis.__VIEW_MODES_INITIALIZED__ === true
const setInitialized = () => { globalThis.__VIEW_MODES_INITIALIZED__ = true }

/**
 * Initialize the view mode system by registering all built-in modes.
 * This function is called automatically when the module is imported.
 */
function initializeViewModes(): void {
  // Prevent duplicate initialization
  if (isInitialized()) {
    console.log('✅ View Mode System already initialized, skipping')
    return
  }
  
  console.log('🚀 Initializing View Mode System...')
  
  // Register all built-in view modes
  const builtInModes = [
    explorationalMode,
    navigationalMode,
    profileMode,
    scientificMode
  ]
  
  let registeredCount = 0
  
  for (const mode of builtInModes) {
    try {
      const success = viewModeRegistry.register(mode, { 
        validate: true,
        replace: process.env.NODE_ENV === 'development' // Allow replacement in development
      })
      
      if (success) {
        registeredCount++
        console.log(`✅ Registered view mode: ${mode.name} (${mode.id})`)
      }
    } catch (error) {
      console.error(`Failed to register view mode "${mode.id}":`, error)
    }
  }
  
  // Mark as initialized
  setInitialized()
  
  console.log(`✅ View Mode System initialized with ${registeredCount}/${builtInModes.length} modes`)
  
  // Log registry stats
  const stats = viewModeRegistry.getStats()
  console.log('📊 Registry Stats:', stats)
}

// Auto-initialize when this module is imported
initializeViewModes()

// ============================================================================
// CONVENIENCE EXPORTS AND LEGACY COMPATIBILITY
// ============================================================================

// Export the main registry instance
export { viewModeRegistry }

// Legacy compatibility - these can be used during migration
export const VIEW_MODE_IDS = {
  EXPLORATIONAL: 'explorational',
  NAVIGATIONAL: 'navigational', 
  PROFILE: 'profile',
  SCIENTIFIC: 'scientific'
} as const

// Helper functions for common operations
export function getAllViewModes() {
  return viewModeRegistry.getAll()
}

export function getViewMode(id: string) {
  return viewModeRegistry.get(id)
}

export function getViewModeIds(): string[] {
  return viewModeRegistry.getIds()
}

export function isValidViewModeId(id: string): boolean {
  return viewModeRegistry.has(id)
}

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Development utility to reload all view modes (useful for hot reloading)
 */
export function reloadViewModes(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Reloading view modes...')
    viewModeRegistry.clear()
    globalThis.__VIEW_MODES_INITIALIZED__ = false // Reset initialization flag
    initializeViewModes()
  }
}

/**
 * Development utility to add a custom view mode
 */
export function addCustomViewMode(mode: import('./types').ViewModeDefinition): boolean {
  if (process.env.NODE_ENV === 'development') {
    return viewModeRegistry.register(mode, { 
      validate: true,
      replace: true 
    })
  }
  return false
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Legacy type mappings for gradual migration
 * These will be removed once migration is complete
 */
export type LegacyViewType = 'explorational' | 'navigational' | 'profile' | 'scientific'
export type LegacyViewMode = string

/**
 * Convert legacy view mode string to new ViewModeDefinition
 * This helps during the migration process
 */
export function migrateLegacyViewMode(legacyMode: string): import('./types').ViewModeDefinition | undefined {
  return viewModeRegistry.get(legacyMode)
}

/**
 * Get view mode configuration in legacy format
 * This helps components that haven't been migrated yet
 */
export function getLegacyViewModeConfig(modeId: string) {
  const mode = viewModeRegistry.get(modeId)
  if (!mode) return undefined
  
  // Return in the old VIEW_MODE_CONFIGS format for compatibility
  return {
    objectScaling: mode.objectScaling,
    orbitScaling: mode.orbital,
    cameraConfig: mode.camera
  }
}

/**
 * Get scaling configuration in the old format
 */
export function getLegacyScalingConfig(modeId: string) {
  const mode = viewModeRegistry.get(modeId)
  return mode?.scaling
}