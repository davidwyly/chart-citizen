/**
 * ORBITAL MECHANICS INTEGRATION TESTS
 * ====================================
 * 
 * Cross-system integration tests for orbital mechanics with other systems.
 * Consolidates: optimal-system-scaling.test.ts, jitter-investigation.test.ts, gravity-wave-pause-fix.test.ts
 */

import { describe, it, expect } from 'vitest'
import { calculateSystemOrbitalMechanics } from '../../../core/pipeline'
import type { CelestialObject } from '../../../types/orbital-system'

describe('Orbital Mechanics Integration', () => {
  
  const complexSystem: CelestialObject[] = [
    {
      id: 'primary-star',
      name: 'Primary Star',
      classification: 'star',
      geometry_type: 'star',
      properties: { mass: 1.0, radius: 695700, temperature: 5778 },
      position: [0, 0, 0]
    },
    {
      id: 'inner-planet',
      name: 'Inner Planet',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 0.5, radius: 4000, temperature: 600 },
      orbit: { parent: 'primary-star', semi_major_axis: 0.7, eccentricity: 0.1, inclination: 0, orbital_period: 200 }
    },
    {
      id: 'habitable-planet',
      name: 'Habitable Planet',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 1.0, radius: 6371, temperature: 288 },
      orbit: { parent: 'primary-star', semi_major_axis: 1.0, eccentricity: 0.02, inclination: 0, orbital_period: 365 }
    },
    {
      id: 'gas-giant',
      name: 'Gas Giant',
      classification: 'planet',
      geometry_type: 'gas_giant',
      properties: { mass: 300, radius: 70000, temperature: 150 },
      orbit: { parent: 'primary-star', semi_major_axis: 5.0, eccentricity: 0.05, inclination: 1.0, orbital_period: 4000 }
    },
    {
      id: 'outer-planet',
      name: 'Outer Planet',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 0.1, radius: 2000, temperature: 50 },
      orbit: { parent: 'primary-star', semi_major_axis: 10.0, eccentricity: 0.15, inclination: 2.0, orbital_period: 10000 }
    }
  ]

  describe('Optimal System Scaling', () => {
    it('should handle multi-planet systems with optimal scaling', () => {
      const mechanics = calculateSystemOrbitalMechanics(complexSystem, 'scientific')
      
      expect(mechanics.size).toBe(5)
      
      // All objects should have valid mechanics
      for (const [id, data] of Array.from(mechanics)) {
        expect(data.visualRadius).toBeGreaterThan(0)
        
        if (id !== 'primary-star') {
          expect(data.orbitDistance || 0).toBeGreaterThan(0)
        }
      }
    })

    it('should maintain proper orbital ordering', () => {
      const mechanics = calculateSystemOrbitalMechanics(complexSystem, 'scientific')
      
      const inner = mechanics.get('inner-planet')!
      const habitable = mechanics.get('habitable-planet')!
      const gasGiant = mechanics.get('gas-giant')!
      const outer = mechanics.get('outer-planet')!
      
      // Orbital distances should increase outward
      expect((inner.orbitDistance || 0) < (habitable.orbitDistance || 0)).toBe(true)
      expect((habitable.orbitDistance || 0) < (gasGiant.orbitDistance || 0)).toBe(true)
      expect((gasGiant.orbitDistance || 0) < (outer.orbitDistance || 0)).toBe(true)
    })

    it('should prevent collisions in complex systems', () => {
      const mechanics = calculateSystemOrbitalMechanics(complexSystem, 'scientific')
      const star = mechanics.get('primary-star')!
      
      // No planet should be inside the star
      for (const [id, data] of Array.from(mechanics)) {
        if (id !== 'primary-star') {
          const clearance = (data.orbitDistance || 0) - star.visualRadius
          expect(clearance).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('View Mode Integration', () => {
    it('should handle all view modes consistently', () => {
      const viewModes = ['scientific', 'explorational', 'navigational', 'profile'] as const
      
      for (const viewMode of viewModes) {
        const mechanics = calculateSystemOrbitalMechanics(complexSystem, viewMode)
        
        expect(mechanics.size).toBe(5)
        
        // All objects should be valid in each view mode
        for (const [id, data] of Array.from(mechanics)) {
          expect(data.visualRadius).toBeGreaterThan(0)
          
          if (id !== 'primary-star') {
            expect(data.orbitDistance || 0).toBeGreaterThan(0)
          }
        }
      }
    })

    it('should maintain relative proportions across view modes', () => {
      const scientificResults = calculateSystemOrbitalMechanics(complexSystem, 'scientific')
      const explorationResults = calculateSystemOrbitalMechanics(complexSystem, 'explorational')
      
      const sciInner = scientificResults.get('inner-planet')!
      const sciHabitable = scientificResults.get('habitable-planet')!
      const expInner = explorationResults.get('inner-planet')!
      const expHabitable = explorationResults.get('habitable-planet')!
      
      // Ratios should be maintained (within reasonable tolerance)
      const sciRatio = (sciInner.orbitDistance || 0) / (sciHabitable.orbitDistance || 1)
      const expRatio = (expInner.orbitDistance || 0) / (expHabitable.orbitDistance || 1)
      
      expect(Math.abs(sciRatio - expRatio)).toBeLessThan(0.2) // 20% tolerance
    })
  })

  describe('Performance and Stability', () => {
    it('should handle large systems efficiently', () => {
      // Create a larger system for performance testing
      const largeSystem: CelestialObject[] = []
      
      // Add star
      largeSystem.push({
        id: 'central-star',
        name: 'Central Star',
        classification: 'star',
        geometry_type: 'star',
        properties: { mass: 1.0, radius: 695700, temperature: 5778 },
        position: [0, 0, 0]
      })
      
      // Add multiple planets
      for (let i = 1; i <= 10; i++) {
        largeSystem.push({
          id: `planet-${i}`,
          name: `Planet ${i}`,
          classification: 'planet',
          geometry_type: 'terrestrial',
          properties: { mass: 0.1 + (i * 0.1), radius: 1000 + (i * 1000), temperature: 300 - (i * 20) },
          orbit: { 
            parent: 'central-star', 
            semi_major_axis: 0.5 + (i * 0.8), 
            eccentricity: 0.05, 
            inclination: i * 2, 
            orbital_period: 100 + (i * 200) 
          }
        })
      }
      
      const startTime = performance.now()
      const mechanics = calculateSystemOrbitalMechanics(largeSystem, 'scientific')
      const endTime = performance.now()
      
      expect(mechanics.size).toBe(11) // 1 star + 10 planets
      expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should maintain stability across multiple calculations', () => {
      const results: Array<Map<string, any>> = []
      
      // Run the calculation multiple times
      for (let i = 0; i < 5; i++) {
        const mechanics = calculateSystemOrbitalMechanics(complexSystem, 'scientific')
        results.push(mechanics)
      }
      
      // Results should be identical across runs
      const firstResult = results[0]
      for (let i = 1; i < results.length; i++) {
        const currentResult = results[i]
        
        for (const [id, data] of Array.from(firstResult)) {
          const currentData = currentResult.get(id)
          expect(currentData?.visualRadius).toBe(data.visualRadius)
          expect(currentData?.orbitDistance).toBe(data.orbitDistance)
        }
      }
    })
  })
}) 