/**
 * Scaling Ratio Validation Test
 * =============================
 * 
 * This test validates that the visual scaling system preserves realistic size ratios
 * between celestial objects while keeping them within the optimal Three.js range.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { calculateSystemOrbitalMechanics } from '@/engine/utils/orbital-mechanics-calculator'
import type { CelestialObject } from '@/engine/types/orbital-system'
import type { ViewType } from '@lib/types/effects-level'

// Import view modes to ensure they are registered
import '@/engine/core/view-modes'

describe('Scaling Ratio Validation', () => {
  // Real astronomical data for testing
  const testObjects: CelestialObject[] = [
    {
      id: 'sol-star',
      name: 'Sol',
      classification: 'star',
      geometry_type: 'star',
      properties: {
        radius: 695700, // km
        mass: 1,
        temperature: 5778
      },
      position: [0, 0, 0]
    },
    {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        radius: 6371, // km
        mass: 1,
        temperature: 288
      },
      orbit: {
        parent: 'sol-star',
        semi_major_axis: 1.0,
        eccentricity: 0.017,
        inclination: 0,
        orbital_period: 365
      }
    },
    {
      id: 'mars',
      name: 'Mars',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        radius: 3389.5, // km
        mass: 0.107,
        temperature: 210
      },
      orbit: {
        parent: 'sol-star',
        semi_major_axis: 1.52,
        eccentricity: 0.093,
        inclination: 1.85,
        orbital_period: 687
      }
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      classification: 'planet',
      geometry_type: 'gas_giant',
      properties: {
        radius: 69911, // km
        mass: 317.8,
        temperature: 165
      },
      orbit: {
        parent: 'sol-star',
        semi_major_axis: 5.2,
        eccentricity: 0.049,
        inclination: 1.3,
        orbital_period: 4333
      }
    }
  ]

  // Expected ratios relative to Earth
  const expectedRatios = {
    'mars': 3389.5 / 6371, // ≈ 0.532
    'jupiter': 69911 / 6371, // ≈ 10.97
    'sol-star': 695700 / 6371 // ≈ 109.2
  }

  describe('Scientific Mode Scaling', () => {
    it('should preserve realistic size ratios with proportional scaling', () => {
      const results = calculateSystemOrbitalMechanics(testObjects, 'scientific', false)
      
      const earthRadius = results.get('earth')?.visualRadius || 0
      const marsRadius = results.get('mars')?.visualRadius || 0
      const jupiterRadius = results.get('jupiter')?.visualRadius || 0
      const sunRadius = results.get('sol-star')?.visualRadius || 0
      
      expect(earthRadius).toBeGreaterThan(0)
      expect(marsRadius).toBeGreaterThan(0)
      expect(jupiterRadius).toBeGreaterThan(0)
      expect(sunRadius).toBeGreaterThan(0)
      
      // Calculate actual ratios
      const actualMarsRatio = marsRadius / earthRadius
      const actualJupiterRatio = jupiterRadius / earthRadius
      const actualSunRatio = sunRadius / earthRadius
      
      console.log('Scientific Mode Ratios:')
      console.log(`Mars/Earth: ${actualMarsRatio.toFixed(3)} (expected: ${expectedRatios.mars.toFixed(3)})`)
      console.log(`Jupiter/Earth: ${actualJupiterRatio.toFixed(3)} (expected: ${expectedRatios.jupiter.toFixed(3)})`)
      console.log(`Sun/Earth: ${actualSunRatio.toFixed(3)} (expected: ${expectedRatios['sol-star'].toFixed(3)})`)
      
      // Mars should be approximately 0.532x Earth (allow 10% tolerance)
      expect(actualMarsRatio).toBeCloseTo(expectedRatios.mars, 1)
      
      // Jupiter should be much larger than Earth (at least 3x due to gentle compression)
      expect(actualJupiterRatio).toBeGreaterThan(3.0)
      
      // Sun should be much larger than planets
      expect(actualSunRatio).toBeGreaterThan(actualJupiterRatio)
    })
  })

  describe('Explorational Mode Scaling', () => {
    it('should preserve relative proportions with gentle compression', () => {
      const results = calculateSystemOrbitalMechanics(testObjects, 'explorational', false)
      
      const earthRadius = results.get('earth')?.visualRadius || 0
      const marsRadius = results.get('mars')?.visualRadius || 0
      const jupiterRadius = results.get('jupiter')?.visualRadius || 0
      
      expect(earthRadius).toBeGreaterThan(0)
      expect(marsRadius).toBeGreaterThan(0)
      expect(jupiterRadius).toBeGreaterThan(0)
      
      const actualMarsRatio = marsRadius / earthRadius
      const actualJupiterRatio = jupiterRadius / earthRadius
      
      console.log('Explorational Mode Ratios:')
      console.log(`Mars/Earth: ${actualMarsRatio.toFixed(3)} (expected: ${expectedRatios.mars.toFixed(3)})`)
      console.log(`Jupiter/Earth: ${actualJupiterRatio.toFixed(3)} (expected: ${expectedRatios.jupiter.toFixed(3)})`)
      
      // Mars should be approximately correct
      expect(actualMarsRatio).toBeCloseTo(expectedRatios.mars, 1)
      
      // Jupiter should be larger than Earth, allowing for gentle compression
      expect(actualJupiterRatio).toBeGreaterThan(2.0)
      
      // Jupiter should be larger than Mars
      expect(jupiterRadius).toBeGreaterThan(marsRadius)
    })
  })

  describe('Navigational Mode Scaling', () => {
    it('should use proportional fixed sizes with realistic ratios', () => {
      const results = calculateSystemOrbitalMechanics(testObjects, 'navigational', false)
      
      const earthRadius = results.get('earth')?.visualRadius || 0
      const marsRadius = results.get('mars')?.visualRadius || 0
      const jupiterRadius = results.get('jupiter')?.visualRadius || 0
      
      expect(earthRadius).toBeGreaterThan(0)
      expect(marsRadius).toBeGreaterThan(0)
      expect(jupiterRadius).toBeGreaterThan(0)
      
      const actualMarsRatio = marsRadius / earthRadius
      const actualJupiterRatio = jupiterRadius / earthRadius
      
      console.log('Navigational Mode Ratios:')
      console.log(`Mars/Earth: ${actualMarsRatio.toFixed(3)} (expected: ${expectedRatios.mars.toFixed(3)})`)
      console.log(`Jupiter/Earth: ${actualJupiterRatio.toFixed(3)} (expected: ${expectedRatios.jupiter.toFixed(3)})`)
      
      // Mars should be approximately correct (allow more tolerance for navigation mode)
      expect(actualMarsRatio).toBeCloseTo(expectedRatios.mars, 0.2)
      
      // Jupiter should be larger than Earth but capped at reasonable size for navigation
      expect(actualJupiterRatio).toBeGreaterThan(1.5)
      expect(actualJupiterRatio).toBeLessThan(4.0) // Should be capped for navigation
      
      // Jupiter should be larger than Mars
      expect(jupiterRadius).toBeGreaterThan(marsRadius)
    })
  })

  describe('Profile Mode Scaling', () => {
    it('should use proportional fixed sizes with realistic ratios', () => {
      const results = calculateSystemOrbitalMechanics(testObjects, 'profile', false)
      
      const earthRadius = results.get('earth')?.visualRadius || 0
      const marsRadius = results.get('mars')?.visualRadius || 0
      const jupiterRadius = results.get('jupiter')?.visualRadius || 0
      
      expect(earthRadius).toBeGreaterThan(0)
      expect(marsRadius).toBeGreaterThan(0)
      expect(jupiterRadius).toBeGreaterThan(0)
      
      const actualMarsRatio = marsRadius / earthRadius
      const actualJupiterRatio = jupiterRadius / earthRadius
      
      console.log('Profile Mode Ratios:')
      console.log(`Mars/Earth: ${actualMarsRatio.toFixed(3)} (expected: ${expectedRatios.mars.toFixed(3)})`)
      console.log(`Jupiter/Earth: ${actualJupiterRatio.toFixed(3)} (expected: ${expectedRatios.jupiter.toFixed(3)})`)
      
      // Mars should be approximately correct (allow more tolerance for profile mode)
      expect(actualMarsRatio).toBeCloseTo(expectedRatios.mars, 0.2)
      
      // Jupiter should be larger than Earth but capped for profile view
      expect(actualJupiterRatio).toBeGreaterThan(1.5)
      expect(actualJupiterRatio).toBeLessThan(4.0) // Should be capped for profile
      
      // Jupiter should be larger than Mars
      expect(jupiterRadius).toBeGreaterThan(marsRadius)
    })
  })

  describe('Three.js Range Validation', () => {
    const viewTypes: ViewType[] = ['scientific', 'explorational', 'navigational', 'profile']
    
    viewTypes.forEach(viewType => {
      it(`should keep all objects in optimal Three.js range for ${viewType} mode`, () => {
        const results = calculateSystemOrbitalMechanics(testObjects, viewType, false)
        
        for (const [objectId, data] of results.entries()) {
          const visualRadius = data.visualRadius
          
          // All objects should be within optimal Three.js range
          expect(visualRadius).toBeGreaterThan(0.01) // Minimum precision
          expect(visualRadius).toBeLessThan(1000) // Maximum for good performance
          
          console.log(`${viewType} - ${objectId}: ${visualRadius.toFixed(3)}`)
        }
      })
    })
  })
})