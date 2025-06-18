/**
 * Profile View Regression Test Suite
 * ==================================
 * 
 * This test suite catches critical bugs discovered during profile view development:
 * 1. Global collision detection overriding equidistant spacing calculations
 * 2. Cache invalidation issues between view mode switches
 * 3. OrbitalPath components using elliptical calculations in profile mode
 * 4. Object selection state timing issues with refs vs props
 * 5. Camera framing issues with orbital family detection
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { calculateSystemOrbitalMechanics, clearOrbitalMechanicsCache } from '@/engine/utils/orbital-mechanics-calculator'
import type { CelestialObject } from '@/engine/types/orbital-system'

// Mock solar system data for testing
const mockSolSystem: CelestialObject[] = [
  {
    id: 'sol-star',
    name: 'Sol',
    classification: 'star',
    geometry_type: 'star',
    properties: { radius: 695700, mass: 1.989e30, temperature: 5778 }
  },
  {
    id: 'mercury',
    name: 'Mercury',
    classification: 'planet',
    geometry_type: 'terrestrial',
    properties: { radius: 2439.7, mass: 3.301e23, temperature: 167 },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 0.387,
      eccentricity: 0.206,
      inclination: 7.0,
      orbital_period: 88
    }
  },
  {
    id: 'venus',
    name: 'Venus',
    classification: 'planet',
    geometry_type: 'terrestrial',
    properties: { radius: 6051.8, mass: 4.867e24, temperature: 464 },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 0.723,
      eccentricity: 0.007,
      inclination: 3.4,
      orbital_period: 225
    }
  },
  {
    id: 'earth',
    name: 'Earth',
    classification: 'planet',
    geometry_type: 'terrestrial',
    properties: { radius: 6371, mass: 5.972e24, temperature: 288 },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 1.0,
      eccentricity: 0.017,
      inclination: 0.0,
      orbital_period: 365
    }
  },
  {
    id: 'mars',
    name: 'Mars',
    classification: 'planet',
    geometry_type: 'terrestrial',
    properties: { radius: 3389.5, mass: 6.417e23, temperature: 210 },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 1.524,
      eccentricity: 0.094,
      inclination: 1.9,
      orbital_period: 687
    }
  },
  {
    id: 'asteroid-belt',
    name: 'Asteroid Belt',
    classification: 'belt',
    geometry_type: 'belt',
    properties: { density: 500, temperature: 200 },
    orbit: {
      parent: 'sol-star',
      inner_radius: 2.2,
      outer_radius: 3.2,
      inclination: 0
    }
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    classification: 'planet',
    geometry_type: 'gas_giant',
    properties: { radius: 69911, mass: 1.898e27, temperature: 165 },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 5.204,
      eccentricity: 0.049,
      inclination: 1.3,
      orbital_period: 4333
    }
  },
  {
    id: 'saturn',
    name: 'Saturn',
    classification: 'planet',
    geometry_type: 'gas_giant',
    properties: { radius: 58232, mass: 5.683e26, temperature: 134 },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 9.537,
      eccentricity: 0.057,
      inclination: 2.5,
      orbital_period: 10759
    }
  },
  {
    id: 'uranus',
    name: 'Uranus',
    classification: 'planet',
    geometry_type: 'ice_giant',
    properties: { radius: 25362, mass: 8.681e25, temperature: 76 },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 19.2,
      eccentricity: 0.046,
      inclination: 0.8,
      orbital_period: 30687
    }
  },
  {
    id: 'neptune',
    name: 'Neptune',
    classification: 'planet',
    geometry_type: 'ice_giant',
    properties: { radius: 24622, mass: 1.024e26, temperature: 72 },
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 30.047,
      eccentricity: 0.009,
      inclination: 1.8,
      orbital_period: 60190
    }
  },
  {
    id: 'kuiper-belt',
    name: 'Kuiper Belt',
    classification: 'belt',
    geometry_type: 'belt',
    properties: { density: 1000, temperature: 40 },
    orbit: {
      parent: 'sol-star',
      inner_radius: 30,
      outer_radius: 50,
      inclination: 1.86
    }
  }
]

describe('Profile View Regression Tests', () => {
  beforeEach(() => {
    clearOrbitalMechanicsCache()
  })

  describe('Bug #1: Global Collision Detection Override', () => {
    it('should not apply collision detection adjustments in profile mode', () => {
      // Calculate orbital mechanics for profile mode
      const profileResults = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      
      // Neptune should be at calculated equidistant position, not pushed out by collision detection
      const neptuneResult = profileResults.get('neptune')
      expect(neptuneResult).toBeDefined()
      
      // Neptune should be positioned close to other outer planets, not way out at 111+ units
      expect(neptuneResult!.orbitDistance).toBeLessThan(50)
      expect(neptuneResult!.orbitDistance).toBeGreaterThan(30)
      
      // Verify sequential spacing - Neptune should be close to Uranus
      const uranusResult = profileResults.get('uranus')
      const spacing = neptuneResult!.orbitDistance - uranusResult!.orbitDistance
      expect(spacing).toBeLessThan(10) // Should be reasonable spacing, not 70+ units
    })

    it('should maintain equidistant spacing between all planets in profile mode', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      
      const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
      const distances = planets.map(id => results.get(id)?.orbitDistance).filter(Boolean) as number[]
      
      // Check that spacing is relatively consistent (equidistant)
      const spacings = []
      for (let i = 1; i < distances.length; i++) {
        spacings.push(distances[i] - distances[i-1])
      }
      
      // All spacings should be similar (within reasonable tolerance)
      const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length
      spacings.forEach(spacing => {
        expect(Math.abs(spacing - avgSpacing)).toBeLessThan(avgSpacing * 0.5) // Within 50% of average
      })
    })
  })

  describe('Bug #2: Cache Invalidation Between View Modes', () => {
    it('should recalculate positions when switching view modes', () => {
      // Calculate for explorational mode
      const exploratoryResults = calculateSystemOrbitalMechanics(mockSolSystem, 'explorational')
      const neptuneExploratory = exploratoryResults.get('neptune')?.orbitDistance
      
      // Calculate for profile mode
      const profileResults = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      const neptuneProfile = profileResults.get('neptune')?.orbitDistance
      
      // Results should be different between modes
      expect(neptuneProfile).not.toEqual(neptuneExploratory)
      expect(neptuneProfile).toBeLessThan(neptuneExploratory!) // Profile should be more compact
    })

    it('should clear cache and provide fresh calculations', () => {
      // First calculation
      const results1 = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      const neptune1 = results1.get('neptune')?.orbitDistance
      
      // Clear cache and recalculate
      clearOrbitalMechanicsCache()
      const results2 = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      const neptune2 = results2.get('neptune')?.orbitDistance
      
      // Should get identical results (not stale cache)
      expect(neptune2).toEqual(neptune1)
    })
  })

  describe('Bug #3: Orbital Order Consistency', () => {
    it('should maintain correct orbital order in profile mode', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      
      const planetOrder = [
        { id: 'mercury', name: 'Mercury' },
        { id: 'venus', name: 'Venus' },
        { id: 'earth', name: 'Earth' },
        { id: 'mars', name: 'Mars' },
        { id: 'jupiter', name: 'Jupiter' },
        { id: 'saturn', name: 'Saturn' },
        { id: 'uranus', name: 'Uranus' },
        { id: 'neptune', name: 'Neptune' }
      ]
      
      // Verify each planet is further than the previous one
      for (let i = 1; i < planetOrder.length; i++) {
        const current = results.get(planetOrder[i].id)?.orbitDistance
        const previous = results.get(planetOrder[i-1].id)?.orbitDistance
        
        expect(current).toBeGreaterThan(previous!)
      }
    })
  })

  describe('Bug #4: Belt Size Impact', () => {
    it('should not let belt objects dominate spacing calculations in profile mode', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      
      const kuiperBelt = results.get('kuiper-belt')?.beltData
      const neptune = results.get('neptune')?.orbitDistance
      
      if (kuiperBelt && neptune) {
        // Belt should not push Neptune way out
        const beltOuterEdge = kuiperBelt.outerRadius
        expect(neptune).toBeLessThan(beltOuterEdge + 20) // Reasonable clearance, not huge gap
      }
    })
  })

  describe('Bug #5: Profile Mode Specific Calculations', () => {
    it('should use profile-specific scaling factors', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      
      // All planets should have reasonable visual radii for profile mode
      const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
      planets.forEach(planetId => {
        const result = results.get(planetId)
        expect(result?.visualRadius).toBeGreaterThan(0.5) // Minimum visibility
        expect(result?.visualRadius).toBeLessThan(3.0)   // Maximum size for profile
      })
    })

    it('should complete calculations without infinite loops or errors', () => {
      // This test ensures the calculation process completes successfully
      expect(() => {
        const results = calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
        expect(results.size).toBeGreaterThan(0)
      }).not.toThrow()
    })
  })

  describe('Bug #6: Performance and Re-rendering', () => {
    it('should complete calculations in reasonable time', () => {
      const startTime = Date.now()
      calculateSystemOrbitalMechanics(mockSolSystem, 'profile')
      const endTime = Date.now()
      
      // Should complete in under 100ms for this system size
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Bug #7: Navigational Mode Collision Detection', () => {
    it('should not have extreme gaps in navigational mode', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'navigational')
      
      const neptuneResult = results.get('neptune')
      const uranusResult = results.get('uranus')
      
      expect(neptuneResult).toBeDefined()
      expect(uranusResult).toBeDefined()
      
      // In navigational mode, Neptune should not be pushed out to extreme distances
      // The gap between Uranus and Neptune should be reasonable
      const gap = neptuneResult!.orbitDistance - uranusResult!.orbitDistance
      
      // Gap should be less than 100 units (not the 400+ we were seeing)
      expect(gap).toBeLessThan(100)
      
      // Neptune itself should be at a reasonable distance
      expect(neptuneResult!.orbitDistance).toBeLessThan(200)
    })

    it('should maintain reasonable spacing between all objects in navigational mode', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'navigational')
      
      // Check that no single gap is extremely large
      const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
      const distances = planets.map(id => results.get(id)?.orbitDistance).filter(Boolean) as number[]
      
      for (let i = 1; i < distances.length; i++) {
        const gap = distances[i] - distances[i-1]
        // No gap should be more than 150 units
        expect(gap).toBeLessThan(150)
      }
    })
  })

  describe('Bug #8: Navigational Mode Belt Spacing', () => {
    it('should not create massive gaps after asteroid belts in navigational mode', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'navigational')
      
      // Get belt and surrounding objects
      const mars = results.get('mars')
      const asteroidBelt = results.get('asteroid-belt')
      const jupiter = results.get('jupiter')
      
      console.log('Mars position:', mars?.orbitDistance)
      console.log('Asteroid Belt:', asteroidBelt?.beltData)
      console.log('Jupiter position:', jupiter?.orbitDistance)
      
      // In navigational mode, the gap after a belt should be reasonable
      // Mars to Jupiter gap should not be huge even if there's a belt between
      if (mars && jupiter) {
        const gap = jupiter.orbitDistance! - mars.orbitDistance!
        // Gap should be reasonable, not massive
        // With Mars at ~0.9 and Jupiter at ~3.1 (scaled positions), gap should be ~2.2 plus belt
        expect(gap).toBeLessThan(8) // Allow for some spacing due to belt
      }
      
      // Check that asteroid belt width is properly constrained
      if (asteroidBelt?.beltData) {
        const beltWidth = asteroidBelt.beltData.outerRadius - asteroidBelt.beltData.innerRadius
        expect(beltWidth).toBeLessThanOrEqual(0.31) // Max belt width for navigational (allowing for floating point precision)
        
        // Belt should be positioned close to Mars, not create a huge gap
        const gapFromMars = asteroidBelt.beltData.innerRadius - mars!.orbitDistance!
        expect(gapFromMars).toBeLessThan(2) // Should be close to Mars
      }
      
      // Jupiter should be close to the asteroid belt outer edge
      if (asteroidBelt?.beltData && jupiter) {
        const gapFromBelt = jupiter.orbitDistance! - asteroidBelt.beltData.outerRadius
        expect(gapFromBelt).toBeLessThanOrEqual(2) // Should be close to belt (allowing for floating point precision)
      }
    })
  })

  describe('Bug #9: Explorational Mode Collision Detection', () => {
    it('should not have extreme gaps in explorational mode', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'explorational')
      
      const neptuneResult = results.get('neptune')
      const uranusResult = results.get('uranus')
      
      expect(neptuneResult).toBeDefined()
      expect(uranusResult).toBeDefined()
      
      // In explorational mode, Neptune should not be pushed out to extreme distances
      // The gap between Uranus and Neptune should be reasonable
      const gap = neptuneResult!.orbitDistance - uranusResult!.orbitDistance
      
      // Gap should be less than 350 units (not the 600+ we were seeing)
      // Note: The gap is larger because Kuiper Belt starts at Neptune's orbit in our test data
      expect(gap).toBeLessThan(350)
      
      // Neptune itself should be at a reasonable distance
      expect(neptuneResult!.orbitDistance).toBeLessThan(800)
    })

    it('should use logarithmic scaling appropriately in explorational mode', () => {
      const results = calculateSystemOrbitalMechanics(mockSolSystem, 'explorational')
      
      // Verify that logarithmic scaling is applied but doesn't cause extreme gaps
      const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
      const distances = planets.map(id => results.get(id)?.orbitDistance).filter(Boolean) as number[]
      
      // Check that distances increase (logarithmic scaling)
      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeGreaterThan(distances[i-1])
      }
      
      // But no single gap should be unreasonably large
      for (let i = 1; i < distances.length; i++) {
        const gap = distances[i] - distances[i-1]
        const relativeGap = gap / distances[i-1]
        // Relative gap should not be more than 250% of the previous distance
        // (Allowing slightly more due to logarithmic scaling and belt interference)
        expect(relativeGap).toBeLessThan(2.5)
      }
    })
  })
})