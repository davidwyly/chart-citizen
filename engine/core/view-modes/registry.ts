/**
 * View Mode Registry
 * ==================
 * Central registry for all view mode definitions
 */

import type { ViewModeDefinition } from './types'

class ViewModeRegistry {
  private modes = new Map<string, ViewModeDefinition>()

  register(mode: ViewModeDefinition, options?: { validate?: boolean }): boolean {
    if (options?.validate && !this.validateMode(mode)) {
      console.error(`Invalid view mode definition for "${mode.id}"`)
      return false
    }
    
    this.modes.set(mode.id, mode)
    console.log(`✅ Registered view mode: ${mode.name} (${mode.id})`)
    return true
  }

  get(id: string): ViewModeDefinition | undefined {
    return this.modes.get(id)
  }

  has(id: string): boolean {
    return this.modes.has(id)
  }

  getAll(): ViewModeDefinition[] {
    return Array.from(this.modes.values())
  }

  private validateMode(mode: ViewModeDefinition): boolean {
    return !!(
      mode.id &&
      mode.name &&
      mode.category &&
      mode.scaling &&
      mode.objectScaling &&
      mode.orbital &&
      mode.camera
    )
  }

  getStats() {
    const modes = this.getAll()
    const byCategory = modes.reduce((acc, mode) => {
      acc[mode.category] = (acc[mode.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalModes: modes.length,
      byCategory,
      modeList: modes.map(m => ({ id: m.id, name: m.name, category: m.category }))
    }
  }
}

export const viewModeRegistry = new ViewModeRegistry()

export function requireViewMode(id: string): ViewModeDefinition {
  const mode = viewModeRegistry.get(id)
  if (!mode) {
    throw new Error(`View mode "${id}" not found in registry`)
  }
  return mode
}