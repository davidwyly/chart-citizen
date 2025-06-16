import type { ViewType } from '@lib/types/effects-level'

/**
 * Zone type enumeration for different types of stellar zones
 */
export type StellarZoneType = 'habitable' | 'frost' | 'sublimation' | 'custom'

/**
 * Zone visibility configuration
 */
export interface ZoneVisibilityConfig {
  habitable: boolean
  frost: boolean
  sublimation?: boolean
  custom?: boolean
}

/**
 * Zone styling configuration
 */
export interface ZoneStyleConfig {
  color: string | number
  opacity: number
  wireframe?: boolean
  segments?: number
}

/**
 * Individual zone configuration
 */
export interface ZoneConfig {
  id: string
  type: StellarZoneType
  name: string
  style: ZoneStyleConfig
  enabled: boolean
}

/**
 * Complete stellar zones configuration
 */
export interface StellarZonesConfig {
  visibility: ZoneVisibilityConfig
  styles: {
    habitable: ZoneStyleConfig
    frost: ZoneStyleConfig
    sublimation?: ZoneStyleConfig
    custom?: ZoneStyleConfig[]
  }
  opacity: {
    [K in ViewType]: {
      habitable: number
      frost: number
      sublimation?: number
    }
  }
  renderOrder: number
  segments: number
}

/**
 * Zone calculation result
 */
export interface ZoneCalculationResult {
  type: StellarZoneType
  innerRadius: number
  outerRadius?: number // Optional for line-type zones like frost line
  centerRadius?: number // For line-type zones
}

/**
 * Complete zone data for rendering
 */
export interface StellarZoneRenderData {
  spectralType: string
  luminosity: number
  zones: ZoneCalculationResult[]
  metadata: {
    systemId: string
    starId: string
    calculatedAt: number
  }
}

/**
 * Default stellar zones configuration
 */
export const DEFAULT_STELLAR_ZONES_CONFIG: StellarZonesConfig = {
  visibility: {
    habitable: true,
    frost: true,
    sublimation: false,
    custom: false
  },
  styles: {
    habitable: {
      color: 0x00ff00, // Green
      opacity: 0.2,
      segments: 64
    },
    frost: {
      color: 0x87ceeb, // Sky blue
      opacity: 0.4,
      segments: 64
    },
    sublimation: {
      color: 0xff6b6b, // Light red
      opacity: 0.3,
      segments: 64
    }
  },
  opacity: {
    explorational: {
      habitable: 0.15,
      frost: 0.3,
      sublimation: 0.25
    },
    navigational: {
      habitable: 0.25,
      frost: 0.5,
      sublimation: 0.4
    },
    profile: {
      habitable: 0.2,
      frost: 0.4,
      sublimation: 0.35
    }
  },
  renderOrder: -1, // Render behind objects
  segments: 64
}

/**
 * Predefined zone type configurations
 */
export const ZONE_TYPE_CONFIGS: Record<StellarZoneType, Partial<ZoneConfig>> = {
  habitable: {
    type: 'habitable',
    name: 'Habitable Zone',
    style: {
      color: 0x00ff00,
      opacity: 0.2,
      segments: 64
    },
    enabled: true
  },
  frost: {
    type: 'frost',
    name: 'Frost Line',
    style: {
      color: 0x87ceeb,
      opacity: 0.4,
      segments: 64
    },
    enabled: true
  },
  sublimation: {
    type: 'sublimation',
    name: 'Sublimation Zone',
    style: {
      color: 0xff6b6b,
      opacity: 0.3,
      segments: 64
    },
    enabled: false
  },
  custom: {
    type: 'custom',
    name: 'Custom Zone',
    style: {
      color: 0xffffff,
      opacity: 0.2,
      segments: 64
    },
    enabled: false
  }
} 