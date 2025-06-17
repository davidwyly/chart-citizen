import { useMemo } from 'react'
import { calculateHabitableZoneAndSnowLine } from '@/engine/utils/stellar-zones'
import type { ViewType } from '@lib/types/effects-level'
import type { OrbitalSystemData, CelestialObject } from '@/engine/types/orbital-system'

// Stellar classification temperature thresholds (in Kelvin)
const STELLAR_TEMPERATURE_THRESHOLDS = {
  O_CLASS: 30000,   // O-type stars (blue-white, very hot)
  B_CLASS: 10000,   // B-type stars (blue-white, hot)
  A_CLASS: 7500,    // A-type stars (white)
  F_CLASS: 6000,    // F-type stars (yellow-white)
  G_CLASS: 5200,    // G-type stars (yellow, like our Sun)
  K_CLASS: 3700,    // K-type stars (orange)
  // M-type stars (red, coolest) are below K_CLASS threshold
} as const

// Zone opacity constants for different view types
const ZONE_OPACITY_CONFIGS = {
  explorational: {
    habitableZone: 0.2,
    snowLine: 0.4
  },
  navigational: {
    habitableZone: 0.25,
    snowLine: 0.5
  },
  profile: {
    habitableZone: 0.2,
    snowLine: 0.4
  }
} as const

// Default fallback values
const DEFAULT_SPECTRAL_TYPE = 'G2V' // Sun-like star
const DEFAULT_OPACITY = {
  habitableZone: 0.2,
  snowLine: 0.4
} as const

// Type definitions for zone data
export interface StellarZoneData {
  habitableZone: {
    inner: number
    outer: number
  }
  snowLine: number
  spectralType: string
}

export interface StellarZoneConfig {
  showZones: boolean
  orbitalScale: number
  viewType: ViewType
}

/**
 * Custom hook for calculating stellar zones (habitable zone and snow line)
 * Handles spectral type inference, zone calculations, and scaling
 * 
 * @param systemData - The orbital system data containing stars
 * @param config - Configuration for zone display and scaling
 * @returns Zone data or null if no valid star found
 */
export function useStellarZones(
  systemData: OrbitalSystemData,
  config: StellarZoneConfig
): StellarZoneData | null {
  return useMemo(() => {
    if (!config.showZones) return null

    // Find primary star in the system
    const stars = systemData.objects.filter(
      (obj): obj is CelestialObject => obj.classification === 'star'
    )
    
    if (stars.length === 0) return null

    const primaryStar = stars[0]
    if (!primaryStar) return null

    try {
      // Get or infer spectral type
      const spectralType = inferSpectralType(primaryStar)
      
      // Calculate zones using stellar zones utility
      const zoneData = calculateHabitableZoneAndSnowLine(spectralType)
      
      // Apply orbital scaling
      return {
        habitableZone: {
          inner: zoneData.habitableZone.inner * config.orbitalScale,
          outer: zoneData.habitableZone.outer * config.orbitalScale
        },
        snowLine: zoneData.snowLine * config.orbitalScale,
        spectralType
      }
    } catch (error) {
      console.warn('Failed to calculate stellar zones:', error)
      return null
    }
  }, [
    systemData.objects,
    config.orbitalScale,
    config.showZones,
    config.viewType // Include viewType for potential future opacity/rendering differences
  ])
}

/**
 * Infer spectral type from star properties
 * Prioritizes explicit spectral_type, falls back to temperature-based inference
 * 
 * @param star - The star object to analyze
 * @returns Inferred spectral type string
 */
function inferSpectralType(star: CelestialObject): string {
  // Use explicit spectral type if available
  if (star.properties.spectral_type) {
    return star.properties.spectral_type
  }

  // Infer from temperature
  const temp = star.properties.color_temperature || star.properties.temperature
  if (temp) {
    return inferSpectralTypeFromTemperature(temp)
  }

  // Default to Sun-like star
  return DEFAULT_SPECTRAL_TYPE
}

/**
 * Infer spectral type from temperature using standard stellar classification
 * 
 * @param temperature - Temperature in Kelvin
 * @returns Spectral type string
 */
function inferSpectralTypeFromTemperature(temperature: number): string {
  if (temperature > STELLAR_TEMPERATURE_THRESHOLDS.O_CLASS) return 'O5V'
  if (temperature > STELLAR_TEMPERATURE_THRESHOLDS.B_CLASS) return 'B5V'
  if (temperature > STELLAR_TEMPERATURE_THRESHOLDS.A_CLASS) return 'A5V'
  if (temperature > STELLAR_TEMPERATURE_THRESHOLDS.F_CLASS) return 'F5V'
  if (temperature > STELLAR_TEMPERATURE_THRESHOLDS.G_CLASS) return 'G2V'
  if (temperature > STELLAR_TEMPERATURE_THRESHOLDS.K_CLASS) return 'K5V'
  return 'M5V'
}

/**
 * Calculate zone opacity based on view type
 * Different view modes may have different zone visibility preferences
 * 
 * @param viewType - Current view mode
 * @returns Opacity configuration for zones
 */
export function calculateZoneOpacity(viewType: ViewType): {
  habitableZone: number
  snowLine: number
} {
  return ZONE_OPACITY_CONFIGS[viewType] || DEFAULT_OPACITY
} 