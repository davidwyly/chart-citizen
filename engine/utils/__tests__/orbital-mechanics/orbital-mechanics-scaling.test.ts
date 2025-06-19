/**
 * ORBITAL MECHANICS SCALING TESTS
 * ===============================
 * 
 * Tests for visual scaling systems and size ratio preservation.
 * Consolidates: scaling-ratio-validation.test.ts, safe-scaling-validation.test.ts
 */

import { describe, it, expect } from 'vitest'
import { calculateSystemOrbitalMechanics } from '../../orbital-mechanics-calculator'
import type { CelestialObject } from '../../../types/orbital-system'
import type { ViewType } from '@lib/types/effects-level'

// Import view modes to ensure they are registered
import '../../../core/view-modes'

describe('Orbital Mechanics Scaling', () => {
  
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

  describe('Scaling Ratio Preservation', () => {
    it('should preserve realistic size ratios in scientific mode', () => {
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
      
      // Mars should be approximately 0.532x Earth (allow 10% tolerance)
      expect(actualMarsRatio).toBeCloseTo(expectedRatios.mars, 1)
      
      // Jupiter should be much larger than Earth (at least 3x due to gentle compression)
      expect(actualJupiterRatio).toBeGreaterThan(3.0)
      
      // Sun should be much larger than planets
      expect(actualSunRatio).toBeGreaterThan(actualJupiterRatio)
    })

    it('should handle different view modes appropriately', () => {
      const viewModes = ['scientific', 'explorational', 'navigational', 'profile'] as const
      
      for (const viewMode of viewModes) {
        const results = calculateSystemOrbitalMechanics(testObjects, viewMode, false)
        
        const earthRadius = results.get('earth')?.visualRadius || 0
        const marsRadius = results.get('mars')?.visualRadius || 0
        const jupiterRadius = results.get('jupiter')?.visualRadius || 0
        
        expect(earthRadius).toBeGreaterThan(0)
        expect(marsRadius).toBeGreaterThan(0)
        expect(jupiterRadius).toBeGreaterThan(0)
        
        // Basic ordering should be preserved in all modes
        expect(jupiterRadius).toBeGreaterThan(earthRadius)
        expect(earthRadius).toBeGreaterThan(marsRadius * 0.8) // Allow some variance for Mars
      }
    })
  })

  describe('Safe Scaling (Collision Prevention)', () => {
    const realSolarSystem: CelestialObject[] = [
      {
        id: 'sol',
        name: 'Sol',
        classification: 'star',
        geometry_type: 'star',
                 properties: { mass: 1.0, radius: 695700, temperature: 5778 }, // Real Sun radius
        position: [0, 0, 0]
      },
      {
        id: 'mercury',
        name: 'Mercury',
        classification: 'planet',
        geometry_type: 'terrestrial',
                 properties: { mass: 0.055, radius: 2439, temperature: 440 }, // Real Mercury radius
        orbit: { parent: 'sol', semi_major_axis: 0.39, eccentricity: 0.206, inclination: 7.0, orbital_period: 88 }
      },
      {
        id: 'earth',
        name: 'Earth',
        classification: 'planet',
        geometry_type: 'terrestrial',
                 properties: { mass: 1.0, radius: 6371, temperature: 288 },
        orbit: { parent: 'sol', semi_major_axis: 1.0, eccentricity: 0.017, inclination: 0, orbital_period: 365.25 }
      }
    ]

    it('should prevent Mercury-Sol collision in all view modes', () => {
      const viewModes = ['scientific', 'explorational', 'navigational', 'profile'] as const
      
      let allModesSafe = true
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(realSolarSystem, viewMode)
        const sol = mechanics.get('sol')!
        const mercury = mechanics.get('mercury')!
        
        const clearance = (mercury.orbitDistance || 0) - sol.visualRadius
        const clearanceRatio = clearance / sol.visualRadius
        const isSafe = clearance > 0
        
        if (!isSafe) {
          allModesSafe = false
        }
        
        // CRITICAL TEST: Mercury must NEVER be inside Sol
        expect(clearance).toBeGreaterThan(0)
        
        // Mercury should have reasonable clearance (at least 5% of Sol radius)
        expect(clearanceRatio).toBeGreaterThan(0.05)
      })
      
      expect(allModesSafe).toBe(true)
    })

    it('should maintain realistic size ratios while preventing collisions', () => {
      const mechanics = calculateSystemOrbitalMechanics(realSolarSystem, 'scientific')
      const sol = mechanics.get('sol')!
      const mercury = mechanics.get('mercury')!
      const earth = mechanics.get('earth')!
      
      // In scientific mode, we expect size ratios to be preserved
      // Even though compression is applied to Sol, it should still be much larger than planets
      expect(sol.visualRadius).toBeGreaterThan(mercury.visualRadius)
             expect(sol.visualRadius).toBeGreaterThan((earth.orbitDistance || 0) / 100) // Sol should be visible relative to Earth
      
      // Mercury should not be inside Sol
      const clearance = (mercury.orbitDistance || 0) - sol.visualRadius
      expect(clearance).toBeGreaterThan(0)
    })
  })
}) 