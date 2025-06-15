import { useMemo } from 'react'
import { calculateHabitableZoneAndSnowLine } from '@/engine/utils/stellar-zones'
import type { ViewType } from '@lib/types/effects-level'
import type { OrbitalSystemData, CelestialObject } from '@/engine/types/orbital-system'

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
  return 'G2V'
}

/**
 * Infer spectral type from temperature using standard stellar classification
 * 
 * @param temperature - Temperature in Kelvin
 * @returns Spectral type string
 */
function inferSpectralTypeFromTemperature(temperature: number): string {
  if (temperature > 30000) return 'O5V'
  if (temperature > 10000) return 'B5V'
  if (temperature > 7500) return 'A5V'
  if (temperature > 6000) return 'F5V'
  if (temperature > 5200) return 'G2V'
  if (temperature > 3700) return 'K5V'
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
  switch (viewType) {
    case 'realistic':
      return {
        habitableZone: 0.15,
        snowLine: 0.3
      }
    case 'navigational':
      return {
        habitableZone: 0.25,
        snowLine: 0.5
      }
    case 'profile':
      return {
        habitableZone: 0.2,
        snowLine: 0.4
      }
    default:
      return {
        habitableZone: 0.2,
        snowLine: 0.4
      }
  }
} 