/**
 * SOL SIZE DEBUG TEST
 * ===================
 * 
 * Debug why Sol is still 40 units after compression fix
 */

import { describe, it, expect } from 'vitest'
import { calculateVisualSize, getVisualSizeConfigForViewMode } from '../engine/utils/visual-size-calculator'
import type { CelestialObject } from '../engine/types/orbital-system'

describe('Sol Size Debug', () => {
  
  const solarSystem: CelestialObject[] = [
    {
      id: 'sol',
      name: 'Sol',
      classification: 'star',
      geometry_type: 'star',
      properties: { mass: 1.0, radius: 695700 }, // 109x Earth radius
      position: [0, 0, 0]
    },
    {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 1.0, radius: 6371 },
      orbit: { parent: 'sol', semi_major_axis: 1.0, eccentricity: 0.017, inclination: 0, orbital_period: 365.25 }
    }
  ]
  
  it('should debug Sol visual size calculation', () => {
    console.log('\n🌟 SOL SIZE DEBUG:')
    
    const solObject = solarSystem[0]
    const earthRadiusKm = 6371
    const solRadiusKm = 695700
    const earthRatio = solRadiusKm / earthRadiusKm
    
    console.log(`  Sol real radius: ${solRadiusKm.toLocaleString()} km`)
    console.log(`  Earth real radius: ${earthRadiusKm.toLocaleString()} km`)
    console.log(`  Sol/Earth ratio: ${earthRatio.toFixed(1)}x`)
    
    const sizeConfig = getVisualSizeConfigForViewMode('scientific')
    console.log(`\n  Size config:`)
    console.log(`    earthTargetSize: ${sizeConfig.earthTargetSize}`)
    console.log(`    maxVisualSize: ${sizeConfig.maxVisualSize}`)
    console.log(`    minVisualSize: ${sizeConfig.minVisualSize}`)
    
    const calculation = calculateVisualSize(solObject, sizeConfig, solarSystem, 'scientific')
    
    console.log(`\n  Calculation result:`)
    console.log(`    visualSize: ${calculation.visualSize}`)
    console.log(`    earthRatio: ${calculation.earthRatio.toFixed(1)}`)
    console.log(`    compressionApplied: ${calculation.compressionApplied}`)
    console.log(`    compressionType: ${calculation.metadata.compressionType}`)
    console.log(`    clampedToMinimum: ${calculation.metadata.clampedToMinimum}`)
    console.log(`    earthTargetSize: ${calculation.metadata.earthTargetSize}`)
    
    // Check if it's being clamped to maxVisualSize
    if (calculation.visualSize === sizeConfig.maxVisualSize) {
      console.log(`\n  ⚠️  CLAMPED TO MAX: Visual size clamped to ${sizeConfig.maxVisualSize}`)
      console.log(`  🔧 FIX: Increase maxVisualSize or adjust compression`)
    }
    
    // Manual calculation to verify compression
    const earthTargetSize = 3.0
    const compressedRatio = 50 + Math.log10(earthRatio / 50) * 3
    const expectedSize = earthTargetSize * compressedRatio
    
    console.log(`\n  Manual compression check:`)
    console.log(`    Expected compressed ratio: ${compressedRatio.toFixed(2)}`)
    console.log(`    Expected visual size: ${expectedSize.toFixed(2)}`)
    console.log(`    Actual visual size: ${calculation.visualSize}`)
    
    if (expectedSize > sizeConfig.maxVisualSize) {
      console.log(`    🚨 ISSUE: Calculation (${expectedSize.toFixed(1)}) exceeds maxVisualSize (${sizeConfig.maxVisualSize})`)
    }
  })
})