export type ViewType = 'realistic' | 'navigational' | 'profile'

export type EffectsLevel = 'low' | 'medium' | 'high'

export const EFFECTS_LEVELS = {
  low: {
    description: 'Minimal visual effects for better performance',
    particleCount: 100,
    shaderQuality: 'low',
  },
  medium: {
    description: 'Balanced effects for good performance and visuals',
    particleCount: 500,
    shaderQuality: 'medium',
  },
  high: {
    description: 'Maximum visual effects for best appearance',
    particleCount: 1000,
    shaderQuality: 'high',
  },
} as const

export interface MaterialQuality {
  level: EffectsLevel
  description: string
  performanceImpact: 'low' | 'medium' | 'high'
}

export const MATERIAL_QUALITY_LEVELS: Record<EffectsLevel, MaterialQuality> = {
  low: {
    level: 'low',
    description: 'Basic effects optimized for performance',
    performanceImpact: 'low'
  },
  medium: {
    level: 'medium',
    description: 'Enhanced effects with balanced performance',
    performanceImpact: 'medium'
  },
  high: {
    level: 'high',
    description: 'Maximum visual quality with high performance impact',
    performanceImpact: 'high'
  }
}

// Helper function to validate material quality progression
export function validateMaterialQualityProgression(
  hasLow: boolean,
  hasMedium: boolean,
  hasHigh: boolean
): boolean {
  // If low exists, medium and high must exist
  if (hasLow && (!hasMedium || !hasHigh)) {
    return false
  }
  
  // If medium exists, high must exist
  if (hasMedium && !hasHigh) {
    return false
  }
  
  return true
}

export function isValidEffectsLevel(level: string): level is EffectsLevel {
  return ['low', 'medium', 'high'].includes(level as EffectsLevel)
}

export function isValidViewType(type: string): type is ViewType {
  return ['realistic', 'navigational', 'profile'].includes(type)
} 