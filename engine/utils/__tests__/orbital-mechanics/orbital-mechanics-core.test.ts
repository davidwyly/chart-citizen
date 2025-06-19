/**
 * ORBITAL MECHANICS CORE TESTS
 * ============================
 * 
 * Core orbital mechanics calculations and system processing.
 * Consolidates: orbital-mechanics-debug.test.ts
 */

import { describe, it, expect } from 'vitest'
import { calculateSystemOrbitalMechanics } from '../../orbital-mechanics-calculator'
import type { CelestialObject } from '../../../types/orbital-system'

describe('Orbital Mechanics Core', () => {
  
  const solarSystem: CelestialObject[] = [
    {
      id: 'sol',
      name: 'Sol',
      classification: 'star',
      geometry_type: 'star',
      properties: { mass: 1.0, radius: 695700, temperature: 5778 },
      position: [0, 0, 0]
    },
    {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 1.0, radius: 6371, temperature: 288 },
      orbit: { parent: 'sol', semi_major_axis: 1.0, eccentricity: 0.017, inclination: 0, orbital_period: 365.25 }
    },
    {
      id: 'mars',
      name: 'Mars', 
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 0.107, radius: 3390, temperature: 210 },
      orbit: { parent: 'sol', semi_major_axis: 1.52, eccentricity: 0.094, inclination: 1.85, orbital_period: 687 }
    }
  ]
  
  describe('Basic Orbital Distance Calculations', () => {
    it('should calculate correct orbital distances with proper ratios', () => {
      const mechanics = calculateSystemOrbitalMechanics(solarSystem, 'scientific')
      
      const earth = mechanics.get('earth')!
      const mars = mechanics.get('mars')!
      
             expect(earth.orbitDistance || 0).toBeGreaterThan(0)
       expect(mars.orbitDistance || 0).toBeGreaterThan(0)
      
      // Check that Mars is farther than Earth
      expect(mars.orbitDistance || 0).toBeGreaterThan(earth.orbitDistance || 0)
      
      // The ratio should be approximately correct (allowing for collision detection)
      const actualRatio = (mars.orbitDistance || 0) / (earth.orbitDistance || 1)
      expect(actualRatio).toBeGreaterThan(1.0) // Mars should be farther than Earth
      expect(actualRatio).toBeLessThan(2.0)   // But not unreasonably far
    })

    it('should handle collision detection without breaking orbital ratios', () => {
      const mechanics = calculateSystemOrbitalMechanics(solarSystem, 'scientific')
      
      const earth = mechanics.get('earth')!
      const mars = mechanics.get('mars')!
      
      // The issue might be collision detection modifying the distances
      const orbitScaling = 25.0 // From scientific mode config
      
      // Even with collision detection, the basic ordering should be preserved
             expect(mars.orbitDistance || 0).toBeGreaterThan(earth.orbitDistance || 0)
       
       // Distances should be reasonable multiples of the scaling factor
       expect(earth.orbitDistance || 0).toBeGreaterThan(orbitScaling * 0.5)
       expect(mars.orbitDistance || 0).toBeGreaterThan(orbitScaling * 0.5)
    })
  })

  describe('System Processing', () => {
    it('should calculate mechanics for all objects in the system', () => {
      const mechanics = calculateSystemOrbitalMechanics(solarSystem, 'scientific')
      
      expect(mechanics.has('sol')).toBe(true)
      expect(mechanics.has('earth')).toBe(true)
      expect(mechanics.has('mars')).toBe(true)
      
      // All objects should have valid mechanics data
      for (const [id, data] of Array.from(mechanics)) {
        expect(data).toBeDefined()
        expect(data.visualRadius).toBeGreaterThan(0)
        
        if (id !== 'sol') {
          expect(data.orbitDistance || 0).toBeGreaterThan(0)
        }
      }
    })

    it('should handle different view modes', () => {
      const viewModes = ['scientific', 'explorational', 'navigational', 'profile'] as const
      
      for (const viewMode of viewModes) {
        const mechanics = calculateSystemOrbitalMechanics(solarSystem, viewMode)
        
        expect(mechanics.size).toBe(3)
        expect(mechanics.has('sol')).toBe(true)
        expect(mechanics.has('earth')).toBe(true)
        expect(mechanics.has('mars')).toBe(true)
      }
    })
  })
}) 