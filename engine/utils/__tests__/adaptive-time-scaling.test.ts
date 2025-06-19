/**
 * Test adaptive time scaling functionality
 */

import { calculateAdaptiveTimeMultiplier, formatOrbitalPeriod, DEFAULT_ADAPTIVE_SETTINGS } from '../adaptive-time-scaling'
import { CelestialObject } from '../../types/orbital-system'

describe('Adaptive Time Scaling', () => {
  // Mock objects for testing
  const fastObject: CelestialObject = {
    id: 'phobos',
    name: 'Phobos',
    classification: 'moon',
    geometry_type: 'rocky',
    orbit: {
      parent: 'mars',
      semi_major_axis: 0.00006,
      eccentricity: 0.0151,
      inclination: 1.093,
      orbital_period: 0.319 // Fast orbit - less than 1 day
    },
    properties: {
      mass: 0.0000001,
      radius: 11.3,
      temperature: 233
    }
  }

  const mediumObject: CelestialObject = {
    id: 'mars',
    name: 'Mars',
    classification: 'planet',
    geometry_type: 'terrestrial',
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 1.524,
      eccentricity: 0.093,
      inclination: 1.9,
      orbital_period: 687 // Medium orbit - about 2 years
    },
    properties: {
      mass: 0.107,
      radius: 3389.5,
      temperature: 210
    }
  }

  const slowObject: CelestialObject = {
    id: 'jupiter',
    name: 'Jupiter',
    classification: 'planet',
    geometry_type: 'gas_giant',
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 5.203,
      eccentricity: 0.048,
      inclination: 1.3,
      orbital_period: 4333 // Slow orbit - about 12 years
    },
    properties: {
      mass: 317.8,
      radius: 69911,
      temperature: 165
    }
  }

  describe('calculateAdaptiveTimeMultiplier', () => {
    test('handles fast objects (moons)', () => {
      const result = calculateAdaptiveTimeMultiplier(fastObject, DEFAULT_ADAPTIVE_SETTINGS)
      
      expect(result.category).toBe('fast')
      expect(result.multiplier).toBeGreaterThanOrEqual(1)
      expect(result.multiplier).toBeLessThanOrEqual(5)
      expect(result.isAdaptive).toBe(true)
      expect(result.reason).toContain('Fast orbit')
    })

    test('handles fast objects like Luna (27 days)', () => {
      const lunaObject: CelestialObject = {
        id: 'luna',
        name: 'Luna',
        classification: 'moon',
        geometry_type: 'rocky',
        orbit: {
          parent: 'earth',
          semi_major_axis: 0.00257,
          eccentricity: 0.0549,
          inclination: 5.145,
          orbital_period: 27.322
        },
        properties: {
          mass: 0.012,
          radius: 1737.4,
          temperature: 250
        }
      }

      const result = calculateAdaptiveTimeMultiplier(lunaObject, DEFAULT_ADAPTIVE_SETTINGS)
      
      expect(result.category).toBe('fast')
      expect(result.multiplier).toBeGreaterThanOrEqual(1)
      expect(result.multiplier).toBeLessThanOrEqual(5)
      expect(result.isAdaptive).toBe(true)
      expect(result.reason).toContain('Fast orbit')
    })

    test('handles medium objects (inner planets)', () => {
      const result = calculateAdaptiveTimeMultiplier(mediumObject, DEFAULT_ADAPTIVE_SETTINGS)
      
      expect(result.category).toBe('medium')
      expect(result.multiplier).toBeGreaterThan(5)
      expect(result.multiplier).toBeLessThanOrEqual(20)
      expect(result.isAdaptive).toBe(true)
      expect(result.reason).toContain('Medium orbit')
    })

    test('handles slow objects (outer planets)', () => {
      const result = calculateAdaptiveTimeMultiplier(slowObject, DEFAULT_ADAPTIVE_SETTINGS)
      
      expect(result.category).toBe('slow')
      expect(result.multiplier).toBeGreaterThan(20)
      expect(result.multiplier).toBeLessThanOrEqual(100)
      expect(result.isAdaptive).toBe(true)
      expect(result.reason).toContain('Slow orbit')
    })

    test('handles objects without orbits', () => {
      const starObject: CelestialObject = {
        id: 'sol-star',
        name: 'Sol',
        classification: 'star',
        geometry_type: 'star',
        position: [0, 0, 0],
        properties: {
          mass: 1,
          radius: 695700,
          temperature: 5778
        }
      }

      const result = calculateAdaptiveTimeMultiplier(starObject, DEFAULT_ADAPTIVE_SETTINGS)
      
      expect(result.multiplier).toBe(1.0)
      expect(result.isAdaptive).toBe(true)
      expect(result.reason).toContain('No orbital object focused')
    })

    test('respects manual override', () => {
      const settings = { ...DEFAULT_ADAPTIVE_SETTINGS, manualOverride: 42 }
      const result = calculateAdaptiveTimeMultiplier(fastObject, settings)
      
      expect(result.multiplier).toBe(42)
      expect(result.isAdaptive).toBe(false)
      expect(result.reason).toContain('Manual override')
    })

    test('respects min/max limits', () => {
      const settings = { ...DEFAULT_ADAPTIVE_SETTINGS, minMultiplier: 10, maxMultiplier: 50 }
      
      // Test fast object (normally < 10) gets clamped to min
      const fastResult = calculateAdaptiveTimeMultiplier(fastObject, settings)
      expect(fastResult.multiplier).toBeGreaterThanOrEqual(10)
      
      // Test very slow object gets clamped to max
      const verySlowObject = { ...slowObject, orbit: { ...slowObject.orbit!, orbital_period: 100000 } }
      const slowResult = calculateAdaptiveTimeMultiplier(verySlowObject, settings)
      expect(slowResult.multiplier).toBeLessThanOrEqual(50)
    })

    test('handles disabled adaptive scaling', () => {
      const settings = { ...DEFAULT_ADAPTIVE_SETTINGS, enabled: false }
      const result = calculateAdaptiveTimeMultiplier(slowObject, settings)
      
      expect(result.multiplier).toBe(1.0)
      expect(result.isAdaptive).toBe(false)
      expect(result.reason).toContain('disabled')
    })
  })

  describe('formatOrbitalPeriod', () => {
    test('formats hours correctly', () => {
      expect(formatOrbitalPeriod(0.25)).toBe('6.0 hours')
      expect(formatOrbitalPeriod(0.5)).toBe('12.0 hours')
    })

    test('formats days correctly', () => {
      expect(formatOrbitalPeriod(1)).toBe('1.0 days')
      expect(formatOrbitalPeriod(88)).toBe('88.0 days')
      expect(formatOrbitalPeriod(365)).toBe('365.0 days')
      expect(formatOrbitalPeriod(687)).toBe('687.0 days')
    })

    test('formats years correctly', () => {
      expect(formatOrbitalPeriod(730)).toBe('2.0 years')
      expect(formatOrbitalPeriod(4333)).toBe('11.9 years')
    })
  })
})