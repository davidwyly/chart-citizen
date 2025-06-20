/**
 * View Mode Registry
 * ==================
 * 
 * Core registry system for managing view modes dynamically.
 * Provides registration, validation, and lookup functionality.
 * Supports hot-swapping and extension of view modes without code changes.
 */

import type {
  ViewModeDefinition,
  ViewModeId,
  ViewModeCategory,
  ViewModeValidationResult,
  ViewModeRegistrationOptions,
  CalculationContext,
  RenderContext,
  ObjectState,
  StyleConfig
} from './types'
import type { CelestialObject } from '@/engine/types/orbital-system'

// ============================================================================
// DEFAULT BEHAVIOR FUNCTIONS
// ============================================================================

/**
 * Default visual radius calculation using logarithmic scaling
 */
function defaultCalculateVisualRadius(
  object: CelestialObject, 
  context: CalculationContext
): number {
  const { mode, sizeAnalysis } = context
  const radiusKm = object.properties.radius || 1
  const config = mode.scaling
  
  // Use fixed sizes for modes that define them
  if (config.fixedSizes && mode.id !== 'explorational' && mode.id !== 'scientific') {
    const sizeKey = object.classification || 'asteroid'
    let fixedSize = config.fixedSizes[sizeKey as keyof typeof config.fixedSizes]
    
    // Special handling for gas giants
    if (object.classification === 'planet' && object.geometry_type === 'gas_giant') {
      fixedSize = (config.fixedSizes.planet || 1.2) * 1.5
    }
    
    return fixedSize || config.fixedSizes.asteroid
  }
  
  // Scientific mode: minimal scaling for true-to-life representation
  if (mode.id === 'scientific') {
    const logRadius = Math.log10(radiusKm + 1)
    const normalizedLog = (logRadius - sizeAnalysis.logMinRadius) / sizeAnalysis.logRange
    const visualRadius = config.minVisualSize + (normalizedLog * (config.maxVisualSize - config.minVisualSize))
    return Math.max(visualRadius, config.minVisualSize)
  }
  
  // Explorational mode: proportional parent-child scaling
  if (mode.id === 'explorational' && object.orbit?.parent && object.classification === 'moon') {
    const parent = context.allObjects.find(obj => obj.id === object.orbit!.parent)
    if (parent) {
      // This would need access to results - will be handled in actual implementation
      // For now, use standard logarithmic scaling
    }
  }
  
  // Default logarithmic scaling
  if (radiusKm <= 0) return config.minVisualSize
  
  const logRadius = Math.log10(radiusKm)
  const normalizedSize = Math.max(0, Math.min(1, (logRadius - sizeAnalysis.logMinRadius) / sizeAnalysis.logRange))
  
  return config.minVisualSize + (normalizedSize * (config.maxVisualSize - config.minVisualSize))
}

/**
 * Default feature visibility logic
 */
function defaultShouldShowFeature(
  feature: keyof ViewModeDefinition['features'],
  context: RenderContext,
  mode: ViewModeDefinition
): boolean {
  return mode.features[feature] ?? false
}

/**
 * Default object styling
 */
function defaultGetObjectStyle(
  object: CelestialObject,
  state: ObjectState,
  mode: ViewModeDefinition
): StyleConfig {
  return {
    opacity: state.isSelected ? 1.0 : 0.9,
    wireframe: mode.id === 'scientific',
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateViewModeDefinition(mode: ViewModeDefinition): ViewModeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required fields
  if (!mode.id || typeof mode.id !== 'string') {
    errors.push('View mode must have a valid string ID')
  }
  
  if (!mode.name || typeof mode.name !== 'string') {
    errors.push('View mode must have a valid string name')
  }
  
  if (!mode.category || !['scientific', 'educational', 'gaming', 'navigation', 'custom'].includes(mode.category)) {
    errors.push('View mode must have a valid category')
  }
  
  // Configuration validation
  if (!mode.scaling || typeof mode.scaling !== 'object') {
    errors.push('View mode must have scaling configuration')
  } else {
    if (typeof mode.scaling.maxVisualSize !== 'number' || mode.scaling.maxVisualSize <= 0) {
      errors.push('scaling.maxVisualSize must be a positive number')
    }
    if (typeof mode.scaling.minVisualSize !== 'number' || mode.scaling.minVisualSize <= 0) {
      errors.push('scaling.minVisualSize must be a positive number')
    }
    if (mode.scaling.maxVisualSize <= mode.scaling.minVisualSize) {
      warnings.push('maxVisualSize should be greater than minVisualSize')
    }
  }
  
  if (!mode.camera || typeof mode.camera !== 'object') {
    errors.push('View mode must have camera configuration')
  }
  
  if (!mode.features || typeof mode.features !== 'object') {
    errors.push('View mode must have features configuration')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// MAIN REGISTRY CLASS
// ============================================================================

export class ViewModeRegistry {
  private modes = new Map<ViewModeId, ViewModeDefinition>()
  private listeners = new Set<(eventType: string, modeId: string) => void>()
  
  /**
   * Register a new view mode
   */
  register(mode: ViewModeDefinition, options: ViewModeRegistrationOptions = {}): boolean {
    const { replace = false, validate = true } = options
    
    // Validate if requested
    if (validate) {
      const validation = validateViewModeDefinition(mode)
      if (!validation.isValid) {
        console.error(`Failed to register view mode "${mode.id}":`, validation.errors)
        return false
      }
      
      if (validation.warnings.length > 0) {
        console.warn(`Warnings for view mode "${mode.id}":`, validation.warnings)
      }
    }
    
    // Check for existing mode
    if (this.modes.has(mode.id) && !replace) {
      // In development mode (Next.js hot reload), silently replace instead of erroring
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Hot reload: Replacing view mode "${mode.id}"`)
        // Allow replacement in development
      } else {
        console.error(`View mode "${mode.id}" already exists. Use replace: true to overwrite.`)
        return false
      }
    }
    
    // Fill in default behavior functions if not provided
    const completeMode: ViewModeDefinition = {
      ...mode,
      calculateVisualRadius: mode.calculateVisualRadius || defaultCalculateVisualRadius,
      shouldShowFeature: mode.shouldShowFeature || ((feature, context) => 
        defaultShouldShowFeature(feature, context, mode)
      ),
      getObjectStyle: mode.getObjectStyle || ((object, state) => 
        defaultGetObjectStyle(object, state, mode)
      ),
      getOrbitStyle: mode.getOrbitStyle || mode.getObjectStyle || ((object, state) => 
        defaultGetObjectStyle(object, state, mode)
      ),
    }
    
    this.modes.set(mode.id, completeMode)
    this.notifyListeners('registered', mode.id)
    
    console.log(`✅ Registered view mode: ${mode.name} (${mode.id})`)
    return true
  }
  
  /**
   * Unregister a view mode
   */
  unregister(modeId: ViewModeId): boolean {
    if (this.modes.has(modeId)) {
      this.modes.delete(modeId)
      this.notifyListeners('unregistered', modeId)
      console.log(`🗑️ Unregistered view mode: ${modeId}`)
      return true
    }
    return false
  }
  
  /**
   * Get a specific view mode by ID
   */
  get(modeId: ViewModeId): ViewModeDefinition | undefined {
    return this.modes.get(modeId)
  }
  
  /**
   * Check if a view mode exists
   */
  has(modeId: ViewModeId): boolean {
    return this.modes.has(modeId)
  }
  
  /**
   * Get all registered view modes
   */
  getAll(): ViewModeDefinition[] {
    return Array.from(this.modes.values())
  }
  
  /**
   * Get view modes by category
   */
  getByCategory(category: ViewModeCategory): ViewModeDefinition[] {
    return this.getAll().filter(mode => mode.category === category)
  }
  
  /**
   * Get all mode IDs
   */
  getIds(): ViewModeId[] {
    return Array.from(this.modes.keys())
  }
  
  /**
   * Get mode count
   */
  getCount(): number {
    return this.modes.size
  }
  
  /**
   * Clear all modes (useful for testing)
   */
  clear(): void {
    const modeIds = this.getIds()
    this.modes.clear()
    modeIds.forEach(id => this.notifyListeners('unregistered', id))
  }
  
  /**
   * Validate a mode definition without registering it
   */
  validate(mode: ViewModeDefinition): ViewModeValidationResult {
    return validateViewModeDefinition(mode)
  }
  
  /**
   * Add event listener for registry changes
   */
  addListener(listener: (eventType: string, modeId: string) => void): void {
    this.listeners.add(listener)
  }
  
  /**
   * Remove event listener
   */
  removeListener(listener: (eventType: string, modeId: string) => void): void {
    this.listeners.delete(listener)
  }
  
  private notifyListeners(eventType: string, modeId: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, modeId)
      } catch (error) {
        console.error('Error in view mode registry listener:', error)
      }
    })
  }
  
  /**
   * Get registry statistics
   */
  getStats(): {
    totalModes: number
    byCategory: Record<ViewModeCategory, number>
    modeList: { id: string; name: string; category: ViewModeCategory }[]
  } {
    const modes = this.getAll()
    const byCategory = modes.reduce((acc, mode) => {
      acc[mode.category] = (acc[mode.category] || 0) + 1
      return acc
    }, {} as Record<ViewModeCategory, number>)
    
    return {
      totalModes: modes.length,
      byCategory,
      modeList: modes.map(mode => ({
        id: mode.id,
        name: mode.name,
        category: mode.category
      }))
    }
  }
}

// ============================================================================
// GLOBAL REGISTRY INSTANCE
// ============================================================================

export const viewModeRegistry = new ViewModeRegistry()

// Auto-initialize built-in view modes when registry is imported
let initialized = false

function initializeBuiltinModes(): void {
  if (initialized) return
  initialized = true
  
  // Lazy import to avoid circular dependencies
  Promise.resolve().then(async () => {
    try {
      const [
        { explorationalMode },
        { navigationalMode }, 
        { profileMode },
        { scientificMode }
      ] = await Promise.all([
        import('./modes/explorational-mode'),
        import('./modes/navigational-mode'),
        import('./modes/profile-mode'),
        import('./modes/scientific-mode')
      ])
      
      const builtInModes = [explorationalMode, navigationalMode, profileMode, scientificMode]
      let registeredCount = 0
      
      for (const mode of builtInModes) {
        try {
          const success = viewModeRegistry.register(mode, { validate: true, replace: false })
          if (success) registeredCount++
        } catch (error) {
          console.error(`Failed to register view mode "${mode.id}":`, error)
        }
      }
      
      console.log(`✅ Auto-initialized ${registeredCount}/${builtInModes.length} view modes`)
    } catch (error) {
      console.error('Failed to auto-initialize view modes:', error)
    }
  })
}

// Initialize immediately when registry is imported
initializeBuiltinModes()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Type guard for view mode validation
 */
export function isValidViewMode(modeId: string): boolean {
  return viewModeRegistry.has(modeId)
}

/**
 * Get view mode with fallback
 */
export function getViewModeWithFallback(
  modeId: string, 
  fallbackId: string = 'explorational'
): ViewModeDefinition | undefined {
  return viewModeRegistry.get(modeId) || viewModeRegistry.get(fallbackId)
}

/**
 * Safe view mode getter that throws descriptive errors
 */
export function requireViewMode(modeId: string): ViewModeDefinition {
  const mode = viewModeRegistry.get(modeId)
  if (!mode) {
    const available = viewModeRegistry.getIds().join(', ')
    throw new Error(
      `View mode "${modeId}" not found. Available modes: ${available}`
    )
  }
  return mode
}