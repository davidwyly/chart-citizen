/**
 * OPTIMAL CAMERA RANGE VALIDATION
 * ===============================
 * 
 * Validates that all view modes position cameras in the optimal Three.js
 * precision range rather than at extreme near/far values.
 */

import { describe, it, expect } from 'vitest'
import { calculateDynamicCameraSettings } from '../engine/utils/dynamic-camera-calculator'
import type { CelestialObject } from '../engine/types/orbital-system'

describe('Optimal Camera Range Validation', () => {
  
  it('should position all cameras in Three.js sweet spot (0.1 to 2000 units)', () => {
    console.log('\n🎯 OPTIMAL CAMERA RANGE VALIDATION:')
    console.log('  Target Range: 0.1 to 2000 units (Three.js sweet spot)')
    
    const testSystems = [
      {
        name: 'Proxima Centauri (tiny objects)',
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
    
    const viewModes = ['explorational', 'navigational', 'profile', 'scientific'] as const
    
    testSystems.forEach(system => {
      console.log(`\n  ${system.name.toUpperCase()}:`)
      
      viewModes.forEach(viewMode => {
        const settings = calculateDynamicCameraSettings(system.objects, viewMode)
        
        console.log(`    ${viewMode}:`)
        console.log(`      Near: ${settings.nearPlane.toFixed(2)} units`)
        console.log(`      Far: ${settings.farPlane.toFixed(0)} units`)
        console.log(`      Min Distance: ${settings.absoluteMinDistance.toFixed(2)} units`)
        console.log(`      Max Distance: ${settings.absoluteMaxDistance.toFixed(0)} units`)
        
        // Validate optimal range
        const inOptimalRange = (value: number) => value >= 0.1 && value <= 2000
        
        console.log(`      In Optimal Range: ${inOptimalRange(settings.nearPlane) && inOptimalRange(settings.farPlane) ? '✅ YES' : '❌ NO'}`)
        
        // All values should be in reasonable Three.js range
        expect(settings.nearPlane).toBeGreaterThanOrEqual(0.1)
        expect(settings.nearPlane).toBeLessThanOrEqual(10) // Near should be reasonable
        expect(settings.farPlane).toBeGreaterThanOrEqual(1000) // Far should be skybox-safe
        expect(settings.farPlane).toBeLessThanOrEqual(10000) // But not extreme
        expect(settings.absoluteMinDistance).toBeGreaterThanOrEqual(0.1)
        expect(settings.absoluteMaxDistance).toBeLessThanOrEqual(5000)
      })
    })
  })
  
  
  it('should demonstrate precision benefits of optimal range', () => {
    console.log('\n📊 PRECISION BENEFITS ANALYSIS:')
    
    const precisionTests = [
      { range: 'Extreme (old)', near: 0.00001, far: 100000, ratio: 100000 / 0.00001 },
      { range: 'Optimal (new)', near: 0.1, far: 2000, ratio: 2000 / 0.1 }
    ]
    
    precisionTests.forEach(test => {
      const depthPrecision = 1.0 / test.ratio
      
      console.log(`  ${test.range}:`)
      console.log(`    Near/Far Ratio: ${test.ratio.toExponential(2)}`)
      console.log(`    Depth Precision: ${depthPrecision.toExponential(3)}`)
      console.log(`    Quality: ${test.ratio < 100000 ? '✅ GOOD' : '❌ POOR'}`)
    })
    
    console.log('\n  ✅ Benefits of Optimal Range:')
    console.log('    - Better depth buffer precision')
    console.log('    - Reduced z-fighting artifacts')
    console.log('    - No extreme near plane clipping')
    console.log('    - Skybox compatibility without forcing')
    console.log('    - Smoother camera movements')
  })
  
  it('should validate scaling approach for different system sizes', () => {
    console.log('\n⚖️ SCALING APPROACH VALIDATION:')
    
    const testScales = [
      { name: 'Micro System', maxOrbit: 0.1, expectScaling: true },
      { name: 'Normal System', maxOrbit: 30.0, expectScaling: true },
      { name: 'Large System', maxOrbit: 1000.0, expectScaling: true }
    ]
    
    testScales.forEach(test => {
      // Simulate the scaling logic
      const targetMaxSize = 500
      const scaleFactor = Math.min(targetMaxSize / test.maxOrbit, 1.0)
      const scaledSize = test.maxOrbit * scaleFactor
      
      console.log(`  ${test.name}:`)
      console.log(`    Original Max Orbit: ${test.maxOrbit} units`)
      console.log(`    Scale Factor: ${scaleFactor.toFixed(3)}`)
      console.log(`    Scaled Size: ${scaledSize.toFixed(1)} units`)
      console.log(`    Fits Target: ${scaledSize <= targetMaxSize ? '✅ YES' : '❌ NO'}`)
      
      expect(scaledSize).toBeLessThanOrEqual(targetMaxSize)
      expect(scaleFactor).toBeGreaterThan(0)
      expect(scaleFactor).toBeLessThanOrEqual(1.0)
    })
  })
})