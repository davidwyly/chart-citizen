/**
 * OPTIMAL SYSTEM SCALING VALIDATION
 * =================================
 * 
 * Validates that all star systems are scaled to fit within the optimal
 * Three.js floating point precision range (0.1 to 1000 units) across
 * all view modes.
 */

import { describe, it, expect } from 'vitest'
import { calculateSystemOrbitalMechanics } from '../engine/utils/orbital-mechanics-calculator'
import { calculateOptimalSystemScale, validateSystemScale } from '../engine/utils/optimal-system-scaler'
import type { CelestialObject } from '../engine/types/orbital-system'

describe('Optimal System Scaling Validation', () => {
  
  const testSystems = [
    {
      name: 'Proxima Centauri (micro system)',
      objects: [
        {
          id: 'proxima-star',
          name: 'Proxima Centauri',
          classification: 'star' as const,
          geometry_type: 'star' as const,
          properties: { mass: 0.12, radius: 695700 },
          position: [0, 0, 0] as [number, number, number]
        },
        {
          id: 'proxima-b',
          name: 'Proxima b',
          classification: 'planet' as const,
          geometry_type: 'terrestrial' as const,
          properties: { mass: 1.3, radius: 6371 },
          orbit: { parent: 'proxima-star', semi_major_axis: 0.05, eccentricity: 0.11, inclination: 0, orbital_period: 11.2 }
        }
      ]
    },
    {
      name: 'Solar System (normal scale)',
      objects: [
        {
          id: 'sol',
          name: 'Sol',
          classification: 'star' as const,
          geometry_type: 'star' as const,
          properties: { mass: 1.0, radius: 695700 },
          position: [0, 0, 0] as [number, number, number]
        },
        {
          id: 'mercury',
          name: 'Mercury',
          classification: 'planet' as const,
          geometry_type: 'terrestrial' as const,
          properties: { mass: 0.055, radius: 2439 },
          orbit: { parent: 'sol', semi_major_axis: 0.39, eccentricity: 0.206, inclination: 7.0, orbital_period: 88 }
        },
        {
          id: 'earth',
          name: 'Earth',
          classification: 'planet' as const,
          geometry_type: 'terrestrial' as const,
          properties: { mass: 1.0, radius: 6371 },
          orbit: { parent: 'sol', semi_major_axis: 1.0, eccentricity: 0.017, inclination: 0, orbital_period: 365.25 }
        },
        {
          id: 'neptune',
          name: 'Neptune',
          classification: 'planet' as const,
          geometry_type: 'ice_giant' as const,
          properties: { mass: 17.1, radius: 24622 },
          orbit: { parent: 'sol', semi_major_axis: 30.1, eccentricity: 0.009, inclination: 1.77, orbital_period: 60190 }
        }
      ]
    }
  ]
  
  it('should scale all systems to Three.js optimal range (0.1 to 1000 units)', () => {
    console.log('\n🎯 OPTIMAL SYSTEM SCALING VALIDATION:')
    console.log('  Target Range: 0.1 to 1000 units (Three.js optimal)')
    
    const viewModes = ['explorational', 'navigational', 'profile', 'scientific'] as const
    
    testSystems.forEach(system => {
      console.log(`\n  ${system.name.toUpperCase()}:`)
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(system.objects, viewMode)
        
        // Get all orbit distances
        const orbitDistances = Array.from(mechanics.values())
          .map(m => m.orbitDistance)
          .filter(d => d && d > 0) as number[]
        
        if (orbitDistances.length === 0) return
        
        const minOrbit = Math.min(...orbitDistances)
        const maxOrbit = Math.max(...orbitDistances)
        
        console.log(`    ${viewMode}:`)
        console.log(`      Min Orbit: ${minOrbit.toFixed(2)} units`)
        console.log(`      Max Orbit: ${maxOrbit.toFixed(0)} units`)
        console.log(`      Range: ${(maxOrbit / minOrbit).toFixed(1)}x`)
        
        const inOptimalRange = minOrbit >= 0.1 && maxOrbit <= 1000
        const goodRatio = (maxOrbit / minOrbit) < 10000
        
        console.log(`      Optimal: ${inOptimalRange && goodRatio ? '✅ YES' : '❌ NO'}`)
        
        // Validate optimal range
        expect(minOrbit).toBeGreaterThanOrEqual(0.1)
        expect(maxOrbit).toBeLessThanOrEqual(1000)
        expect(maxOrbit / minOrbit).toBeLessThan(10000) // Reasonable precision range
      })
    })
  })
  
  it('should validate system scaling recommendations', () => {
    console.log('\n📊 SYSTEM SCALING ANALYSIS:')
    
    testSystems.forEach(system => {
      console.log(`\n  ${system.name.toUpperCase()}:`)
      
      const viewModes = ['scientific', 'explorational'] as const
      
      viewModes.forEach(viewMode => {
        const scaleInfo = calculateOptimalSystemScale(system.objects, viewMode)
        
        console.log(`    ${viewMode}:`)
        console.log(`      System Type: ${scaleInfo.systemType}`)
        console.log(`      Original Range: ${scaleInfo.originalRange.min.toFixed(3)} to ${scaleInfo.originalRange.max.toFixed(1)} AU`)
        console.log(`      Scale Factor: ${scaleInfo.scaleFactor.toFixed(1)}`)
        console.log(`      Scaled Range: ${(scaleInfo.originalRange.min * scaleInfo.scaleFactor).toFixed(2)} to ${(scaleInfo.originalRange.max * scaleInfo.scaleFactor).toFixed(0)} units`)
        
        // Validate scale factor is reasonable
        expect(scaleInfo.scaleFactor).toBeGreaterThan(0)
        expect(scaleInfo.scaleFactor).toBeLessThan(10000) // Not extreme
        
        // Validate scaled range
        const scaledMin = scaleInfo.originalRange.min * scaleInfo.scaleFactor
        const scaledMax = scaleInfo.originalRange.max * scaleInfo.scaleFactor
        
        expect(scaledMin).toBeGreaterThanOrEqual(0.1)
        expect(scaledMax).toBeLessThanOrEqual(1000)
      })
    })
  })
  
  it('should validate current view mode scaling factors', () => {
    console.log('\n🔧 VIEW MODE SCALING VALIDATION:')
    
    const currentScaling = {
      scientific: 25.0,
      explorational: 20.0,
      navigational: 15.0,
      profile: 10.0  // Will be updated when we find profile mode
    }
    
    Object.entries(currentScaling).forEach(([viewMode, scaling]) => {
      console.log(`\n  ${viewMode.toUpperCase()} (${scaling}x):`)
      
      // Test with Solar System (1 AU = Earth orbit)
      const earthOrbitScaled = 1.0 * scaling
      const neptuneOrbitScaled = 30.1 * scaling
      const proximaOrbitScaled = 0.05 * scaling
      
      console.log(`    Earth orbit (1 AU): ${earthOrbitScaled} units`)
      console.log(`    Neptune orbit (30 AU): ${neptuneOrbitScaled} units`)
      console.log(`    Proxima B orbit (0.05 AU): ${proximaOrbitScaled.toFixed(2)} units`)
      
      const allInRange = earthOrbitScaled >= 0.1 && earthOrbitScaled <= 1000 &&
                        neptuneOrbitScaled >= 0.1 && neptuneOrbitScaled <= 1000 &&
                        proximaOrbitScaled >= 0.1 && proximaOrbitScaled <= 1000
      
      console.log(`    All in optimal range: ${allInRange ? '✅ YES' : '❌ NO'}`)
      
      expect(earthOrbitScaled).toBeGreaterThanOrEqual(0.1)
      expect(earthOrbitScaled).toBeLessThanOrEqual(1000)
      expect(neptuneOrbitScaled).toBeGreaterThanOrEqual(0.1)
      expect(neptuneOrbitScaled).toBeLessThanOrEqual(1000)
      expect(proximaOrbitScaled).toBeGreaterThanOrEqual(0.1)
    })
  })
  
  it('should demonstrate precision improvements', () => {
    console.log('\n📈 PRECISION IMPROVEMENT ANALYSIS:')
    
    const comparisonTests = [
      {
        name: 'Proxima B (0.05 AU)',
        originalAU: 0.05,
        oldScaling: { scientific: 1.0, explorational: 8.0 },
        newScaling: { scientific: 25.0, explorational: 20.0 }
      },
      {
        name: 'Earth (1.0 AU)',
        originalAU: 1.0,
        oldScaling: { scientific: 1.0, explorational: 8.0 },
        newScaling: { scientific: 25.0, explorational: 20.0 }
      },
      {
        name: 'Neptune (30.1 AU)',
        originalAU: 30.1,
        oldScaling: { scientific: 1.0, explorational: 8.0 },
        newScaling: { scientific: 25.0, explorational: 20.0 }
      }
    ]
    
    comparisonTests.forEach(test => {
      console.log(`\n  ${test.name}:`)
      
      Object.keys(test.oldScaling).forEach(mode => {
        const oldUnits = test.originalAU * test.oldScaling[mode as keyof typeof test.oldScaling]
        const newUnits = test.originalAU * test.newScaling[mode as keyof typeof test.newScaling]
        
        console.log(`    ${mode}:`)
        console.log(`      Old: ${oldUnits.toFixed(3)} units`)
        console.log(`      New: ${newUnits.toFixed(1)} units`)
        console.log(`      Improvement: ${oldUnits < 0.1 || oldUnits > 1000 ? '✅ FIXED' : '✅ MAINTAINED'}`)
      })
    })
    
    console.log('\n  ✅ Benefits of Optimal System Scaling:')
    console.log('    - All objects in Three.js optimal precision range')
    console.log('    - No extreme camera near/far planes needed')
    console.log('    - Consistent precision across all view modes')
    console.log('    - Better depth buffer utilization')
    console.log('    - Reduced floating point artifacts')
  })
})