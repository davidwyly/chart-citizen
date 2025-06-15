import type { EffectsLevel } from '@/lib/types/effects-level'
import { validateMaterialQualityProgression } from '@/lib/types/effects-level'
import type { ShaderMaterial } from 'three'

export interface MaterialDefinition {
  name: string
  low?: ShaderMaterial
  medium?: ShaderMaterial
  high?: ShaderMaterial
}

class MaterialRegistry {
  private materials: Map<string, MaterialDefinition> = new Map()

  registerMaterial(definition: MaterialDefinition) {
    this.materials.set(definition.name, definition)
  }

  getMaterial(name: string, quality: EffectsLevel): ShaderMaterial | undefined {
    const material = this.materials.get(name)
    if (!material) return undefined

    // Try to get the requested quality level
    const requestedMaterial = material[quality]
    if (requestedMaterial) return requestedMaterial

    // Fall back to lower quality if requested quality isn't available
    if (quality === 'high' && material.medium) return material.medium
    if ((quality === 'high' || quality === 'medium') && material.low) return material.low

    return undefined
  }

  validateMaterialProgression(name: string): boolean {
    const material = this.materials.get(name)
    if (!material) return false

    return validateMaterialQualityProgression(
      !!material.low,
      !!material.medium,
      !!material.high
    )
  }

  getAllMaterials(): MaterialDefinition[] {
    return Array.from(this.materials.values())
  }
}

// Create a singleton instance
export const materialRegistry = new MaterialRegistry() 