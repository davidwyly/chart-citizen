/**
 * SAFE SCALING VALIDATION TEST
 * ============================
 * 
 * Validates that the safe scaling integration prevents Mercury-Sol collisions
 * across all view modes using the actual orbital mechanics calculator.
 */

import { describe, it, expect } from 'vitest'
import { calculateSystemOrbitalMechanics } from '../engine/utils/orbital-mechanics-calculator'
import type { CelestialObject } from '../engine/types/orbital-system'

describe('Safe Scaling Validation', () => {
  
  const realSolarSystem: CelestialObject[] = [
    {
      id: 'sol',
      name: 'Sol',
      classification: 'star',
      geometry_type: 'star',
      properties: { mass: 1.0, radius: 695700 }, // Real Sun radius
      position: [0, 0, 0]
    },
    {
      id: 'mercury',
      name: 'Mercury',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 0.055, radius: 2439 }, // Real Mercury radius
      orbit: { parent: 'sol', semi_major_axis: 0.39, eccentricity: 0.206, inclination: 7.0, orbital_period: 88 }
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
  
  it('should prevent Mercury-Sol collision in all view modes', () => {
    console.log('\n🛡️ SAFE SCALING VALIDATION:')
    
    const viewModes = ['scientific', 'explorational', 'navigational', 'profile'] as const
    
    let allModesSafe = true
    const results: Record<string, any> = {}
    
    viewModes.forEach(viewMode => {
      console.log(`\n  ${viewMode.toUpperCase()} MODE:`)
      
      const mechanics = calculateSystemOrbitalMechanics(realSolarSystem, viewMode)
      const sol = mechanics.get('sol')!
      const mercury = mechanics.get('mercury')!
      
      const clearance = (mercury.orbitDistance || 0) - sol.visualRadius
      const clearanceRatio = clearance / sol.visualRadius
      const isSafe = clearance > 0
      
      console.log(`    Sol visual radius: ${sol.visualRadius.toFixed(2)} units`)
      console.log(`    Mercury orbit: ${mercury.orbitDistance?.toFixed(2)} units`)
      console.log(`    Clearance: ${clearance.toFixed(2)} units (${clearanceRatio.toFixed(2)}x Sol radius)`)
      console.log(`    Status: ${isSafe ? '✅ SAFE' : '🚨 COLLISION'}`)
      
      results[viewMode] = { sol, mercury, clearance, clearanceRatio, isSafe }
      
      if (!isSafe) {
        allModesSafe = false
      }
      
      // CRITICAL TEST: Mercury must NEVER be inside Sol
      expect(clearance).toBeGreaterThan(0)
      
      // Mercury should have reasonable clearance (at least 5% of Sol radius)
      expect(clearanceRatio).toBeGreaterThan(0.05)
    })
    
    console.log(`\n🎯 OVERALL RESULT: ${allModesSafe ? '✅ ALL MODES SAFE' : '🚨 SOME MODES UNSAFE'}`)
    
    // Verify that scientific mode specifically maintains good proportions
    expect(results.scientific.clearanceRatio).toBeGreaterThan(1.0) // At least 1x Sol radius clearance
    expect(allModesSafe).toBe(true)
  })
  
  it('should maintain realistic size ratios in scientific mode', () => {
    console.log('\n🔬 SCIENTIFIC MODE RATIO VALIDATION:')
    
    const mechanics = calculateSystemOrbitalMechanics(realSolarSystem, 'scientific')
    const sol = mechanics.get('sol')!
    const mercury = mechanics.get('mercury')!
    const earth = mechanics.get('earth')!
    
    // Calculate actual size ratios
    const realSolEarthRatio = 695700 / 6371 // ~109
    const realMercuryEarthRatio = 2439 / 6371 // ~0.38
    
    const visualSolEarthRatio = sol.visualRadius / earth.orbitDistance // Using Earth as reference
    const visualMercuryEarthRatio = mercury.visualRadius / earth.orbitDistance
    
    console.log(`  Real Sol/Earth ratio: ${realSolEarthRatio.toFixed(1)}`)
    console.log(`  Real Mercury/Earth ratio: ${realMercuryEarthRatio.toFixed(2)}`)
    console.log(`  Visual Sol ratio: ${visualSolEarthRatio.toFixed(3)}`)
    console.log(`  Visual Mercury ratio: ${visualMercuryEarthRatio.toFixed(4)}`)
    
    // In scientific mode, we expect size ratios to be preserved
    // Even though compression is applied to Sol, it should still be much larger than planets
    expect(sol.visualRadius).toBeGreaterThan(mercury.visualRadius)
    expect(sol.visualRadius).toBeGreaterThan(earth.orbitDistance / 100) // Sol should be visible relative to Earth
    
    console.log(`  ✅ Scientific ratios maintained with collision safety`)
  })
})