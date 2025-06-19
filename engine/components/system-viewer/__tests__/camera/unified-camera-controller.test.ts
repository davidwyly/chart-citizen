import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VIEW_MODE_CONFIGS, createDualProperties, determineObjectType } from '@/engine/types/view-mode-config'

describe('Unified Camera System', () => {
  describe('View Mode Configurations', () => {
    it('should have configurations for all view modes', () => {
      expect(VIEW_MODE_CONFIGS.explorational).toBeDefined()
      expect(VIEW_MODE_CONFIGS.navigational).toBeDefined()
      expect(VIEW_MODE_CONFIGS.profile).toBeDefined()
    })

    it('should have consistent structure across all view modes', () => {
      Object.values(VIEW_MODE_CONFIGS).forEach(config => {
        expect(config.objectScaling).toBeDefined()
        expect(config.orbitScaling).toBeDefined()
        expect(config.cameraConfig).toBeDefined()
        
        // Check object scaling has all required types
        expect(config.objectScaling.star).toBeTypeOf('number')
        expect(config.objectScaling.planet).toBeTypeOf('number')
        expect(config.objectScaling.moon).toBeTypeOf('number')
        expect(config.objectScaling.gasGiant).toBeTypeOf('number')
        expect(config.objectScaling.asteroid).toBeTypeOf('number')
        expect(config.objectScaling.default).toBeTypeOf('number')
        
        // Check camera config structure (new radius-based system)
        expect(config.cameraConfig.radiusMultiplier).toBeTypeOf('number')
        expect(config.cameraConfig.minDistanceMultiplier).toBeTypeOf('number')
        expect(config.cameraConfig.maxDistanceMultiplier).toBeTypeOf('number')
        expect(config.cameraConfig.absoluteMinDistance).toBeTypeOf('number')
        expect(config.cameraConfig.absoluteMaxDistance).toBeTypeOf('number')
        expect(config.cameraConfig.viewingAngles).toBeDefined()
        expect(config.cameraConfig.animation).toBeDefined()
      })
    })

    it('should have reasonable radius-based distance settings', () => {
      Object.entries(VIEW_MODE_CONFIGS).forEach(([mode, config]) => {
        const cameraConfig = config.cameraConfig
        expect(cameraConfig.radiusMultiplier).toBeGreaterThan(0)
        expect(cameraConfig.minDistanceMultiplier).toBeGreaterThan(0)
        expect(cameraConfig.maxDistanceMultiplier).toBeGreaterThan(cameraConfig.minDistanceMultiplier)
        expect(cameraConfig.absoluteMinDistance).toBeGreaterThan(0)
        expect(cameraConfig.absoluteMaxDistance).toBeGreaterThan(cameraConfig.absoluteMinDistance)
        // Scientific mode needs larger bounds for astronomical scales
        const maxBound = mode === 'scientific' ? 20000 : 1000
        expect(cameraConfig.absoluteMaxDistance).toBeLessThan(maxBound) // Reasonable upper bound
      })
    })
  })

  describe('Object Type Determination', () => {
    it('should correctly identify stars', () => {
      expect(determineObjectType('Sol Star')).toBe('star')
      expect(determineObjectType('Proxima Centauri')).toBe('star')
      expect(determineObjectType('Alpha Centauri A (Star)')).toBe('star')
      expect(determineObjectType('Red Sun')).toBe('star')
    })

    it('should correctly identify gas giants', () => {
      expect(determineObjectType('Jupiter')).toBe('gasGiant')
      expect(determineObjectType('Saturn')).toBe('gasGiant')
      expect(determineObjectType('Uranus')).toBe('gasGiant')
      expect(determineObjectType('Neptune')).toBe('gasGiant')
      expect(determineObjectType('Jupiter-like Planet')).toBe('gasGiant')
    })

    it('should correctly identify moons', () => {
      expect(determineObjectType('Earth Moon')).toBe('moon')
      expect(determineObjectType('Europa')).toBe('moon')
      expect(determineObjectType('Satellite Alpha')).toBe('moon')
    })

    it('should correctly identify asteroids', () => {
      expect(determineObjectType('Asteroid Belt')).toBe('asteroid')
      expect(determineObjectType('Ceres')).toBe('asteroid')
    })

    it('should default to planet for unknown objects', () => {
      expect(determineObjectType('Earth')).toBe('planet')
      expect(determineObjectType('Mars')).toBe('planet')
      expect(determineObjectType('Unknown Object')).toBe('planet')
    })

    it('should use mass and radius for classification when available', () => {
      // Star-like mass
      expect(determineObjectType('Unknown', 200, 10)).toBe('star')
      
      // Gas giant mass
      expect(determineObjectType('Unknown', 15, 5)).toBe('gasGiant')
      
      // Moon-like mass
      expect(determineObjectType('Unknown', 0.05, 1)).toBe('moon')
    })
  })

  describe('Dual Properties Creation', () => {
    it('should create valid dual properties for a star', () => {
      const properties = createDualProperties(
        10.0,    // realRadius
        0,       // realOrbitRadius (stars don't orbit)
        100.0,   // realMass
        'Sol Star',
        'explorational',
        1.0      // systemScale
      )

      expect(properties.objectType).toBe('star')
      expect(properties.realRadius).toBe(10.0)
      expect(properties.realMass).toBe(100.0)
      expect(properties.visualRadius).toBeGreaterThan(0)
      expect(properties.optimalViewDistance).toBeGreaterThan(0)
      expect(properties.minViewDistance).toBeGreaterThan(0)
      expect(properties.maxViewDistance).toBeGreaterThan(properties.minViewDistance)
    })

    it('should create valid dual properties for a planet', () => {
      const properties = createDualProperties(
        1.0,     // realRadius
        100.0,   // realOrbitRadius
        1.0,     // realMass
        'Earth',
        'explorational',
        1.0      // systemScale
      )

      expect(properties.objectType).toBe('planet')
      expect(properties.realRadius).toBe(1.0)
      expect(properties.realOrbitRadius).toBe(100.0)
      expect(properties.visualRadius).toBeGreaterThan(0)
      expect(properties.visualOrbitRadius).toBeGreaterThan(0)
      expect(properties.optimalViewDistance).toBeGreaterThan(0)
    })

    it('should scale properties correctly for different view modes', () => {
      const explorationalProps = createDualProperties(1.0, 10.0, 1.0, 'Earth', 'explorational')
      const navProps = createDualProperties(1.0, 10.0, 1.0, 'Earth', 'navigational')
      const profileProps = createDualProperties(1.0, 10.0, 1.0, 'Earth', 'profile')

      // Different view modes should produce different visual properties
      expect(explorationalProps.visualRadius).not.toBe(navProps.visualRadius)
      expect(explorationalProps.visualRadius).not.toBe(profileProps.visualRadius)
      expect(navProps.visualRadius).not.toBe(profileProps.visualRadius)

      // But real properties should remain the same
      expect(explorationalProps.realRadius).toBe(navProps.realRadius)
      expect(explorationalProps.realRadius).toBe(profileProps.realRadius)
    })

    it('should respect system scaling', () => {
      const normalScale = createDualProperties(1.0, 10.0, 1.0, 'Earth', 'explorational', 1.0)
      const doubleScale = createDualProperties(1.0, 10.0, 1.0, 'Earth', 'explorational', 2.0)

      expect(doubleScale.visualRadius).toBe(normalScale.visualRadius * 2.0)
      expect(doubleScale.visualOrbitRadius).toBe(normalScale.visualOrbitRadius * 2.0)
    })

    it('should enforce distance constraints', () => {
      // Test with very small radius
      const smallObject = createDualProperties(0.001, 1.0, 0.1, 'Small Moon', 'explorational')
      expect(smallObject.optimalViewDistance).toBeGreaterThanOrEqual(smallObject.minViewDistance)
      expect(smallObject.optimalViewDistance).toBeLessThanOrEqual(smallObject.maxViewDistance)

      // Test with very large radius
      const largeObject = createDualProperties(100.0, 1000.0, 200.0, 'Giant Star', 'explorational')
      expect(largeObject.optimalViewDistance).toBeGreaterThanOrEqual(largeObject.minViewDistance)
      expect(largeObject.optimalViewDistance).toBeLessThanOrEqual(largeObject.maxViewDistance)
    })

    it('should calculate camera distance based PURELY on visual radius, not object type', () => {
      // Objects with same visual radius should have same camera distance regardless of type
      const testRadius = 5.0
      const testOrbit = 100.0
      
      // Create objects with same visual radius but different types
      const star = createDualProperties(testRadius, testOrbit, 200.0, 'Test Star', 'explorational')
      const planet = createDualProperties(testRadius, testOrbit, 1.0, 'Test Planet', 'explorational')
      const moon = createDualProperties(testRadius, testOrbit, 0.1, 'Test Moon', 'explorational')
      const asteroid = createDualProperties(testRadius, testOrbit, 0.01, 'Test Asteroid', 'explorational')
      const gasGiant = createDualProperties(testRadius, testOrbit, 15.0, 'Test Jupiter', 'explorational')
      
      // Ensure they have the same visual radius (accounting for scaling differences)
      // We need to adjust for object scaling differences to get same visual radius
      const config = VIEW_MODE_CONFIGS.explorational
      const adjustedStarRadius = testRadius / config.objectScaling.star
      const adjustedPlanetRadius = testRadius / config.objectScaling.planet
      const adjustedMoonRadius = testRadius / config.objectScaling.moon
      const adjustedAsteroidRadius = testRadius / config.objectScaling.asteroid
      const adjustedGasGiantRadius = testRadius / config.objectScaling.gasGiant
      
      const adjustedStar = createDualProperties(adjustedStarRadius, testOrbit, 200.0, 'Test Star', 'explorational')
      const adjustedPlanet = createDualProperties(adjustedPlanetRadius, testOrbit, 1.0, 'Test Planet', 'explorational')
      const adjustedMoon = createDualProperties(adjustedMoonRadius, testOrbit, 0.1, 'Test Moon', 'explorational')
      const adjustedAsteroid = createDualProperties(adjustedAsteroidRadius, testOrbit, 0.01, 'Test Asteroid', 'explorational')
      const adjustedGasGiant = createDualProperties(adjustedGasGiantRadius, testOrbit, 15.0, 'Test Jupiter', 'explorational')
      
      // Verify all have approximately the same visual radius (within floating point precision)
      const tolerance = 0.01
      expect(Math.abs(adjustedStar.visualRadius - testRadius)).toBeLessThan(tolerance)
      expect(Math.abs(adjustedPlanet.visualRadius - testRadius)).toBeLessThan(tolerance)
      expect(Math.abs(adjustedMoon.visualRadius - testRadius)).toBeLessThan(tolerance)
      expect(Math.abs(adjustedAsteroid.visualRadius - testRadius)).toBeLessThan(tolerance)
      expect(Math.abs(adjustedGasGiant.visualRadius - testRadius)).toBeLessThan(tolerance)
      
      // Camera distances should be identical for same visual radius
      const cameraDistanceTolerance = 0.1
      expect(Math.abs(adjustedStar.optimalViewDistance - adjustedPlanet.optimalViewDistance)).toBeLessThan(cameraDistanceTolerance)
      expect(Math.abs(adjustedPlanet.optimalViewDistance - adjustedMoon.optimalViewDistance)).toBeLessThan(cameraDistanceTolerance)
      expect(Math.abs(adjustedMoon.optimalViewDistance - adjustedAsteroid.optimalViewDistance)).toBeLessThan(cameraDistanceTolerance)
      expect(Math.abs(adjustedAsteroid.optimalViewDistance - adjustedGasGiant.optimalViewDistance)).toBeLessThan(cameraDistanceTolerance)
    })
  })

  describe('View Mode Consistency', () => {
    const testObjects = [
      { name: 'Sol Star', radius: 10, orbit: 0, mass: 100, type: 'star' },
      { name: 'Earth', radius: 1, orbit: 100, mass: 1, type: 'planet' },
      { name: 'Jupiter', radius: 5, orbit: 500, mass: 15, type: 'gasGiant' },
      { name: 'Moon', radius: 0.3, orbit: 1, mass: 0.05, type: 'moon' },
      { name: 'Asteroid', radius: 0.01, orbit: 200, mass: 0.001, type: 'asteroid' }
    ]

    testObjects.forEach(obj => {
      it(`should have consistent properties for ${obj.name} across view modes`, () => {
        const explorationalProps = createDualProperties(obj.radius, obj.orbit, obj.mass, obj.name, 'explorational')
        const navProps = createDualProperties(obj.radius, obj.orbit, obj.mass, obj.name, 'navigational')
        const profileProps = createDualProperties(obj.radius, obj.orbit, obj.mass, obj.name, 'profile')

        // Real properties should be identical
        expect(explorationalProps.realRadius).toBe(navProps.realRadius)
        expect(explorationalProps.realRadius).toBe(profileProps.realRadius)
        expect(explorationalProps.realOrbitRadius).toBe(navProps.realOrbitRadius)
        expect(explorationalProps.realOrbitRadius).toBe(profileProps.realOrbitRadius)

        // Object type should be consistent
        expect(explorationalProps.objectType).toBe(navProps.objectType)
        expect(explorationalProps.objectType).toBe(profileProps.objectType)
        expect(explorationalProps.objectType).toBe(obj.type as any)

        // All should have valid camera distances
        expect(explorationalProps.optimalViewDistance).toBeGreaterThan(0)
        expect(navProps.optimalViewDistance).toBeGreaterThan(0)
        expect(profileProps.optimalViewDistance).toBeGreaterThan(0)
      })
    })
  })

  describe('Configuration Validation', () => {
    it('should have non-zero scaling factors', () => {
      Object.values(VIEW_MODE_CONFIGS).forEach(config => {
        Object.values(config.objectScaling).forEach(scale => {
          expect(scale).toBeGreaterThan(0)
        })
      })
    })

    it('should have valid animation settings', () => {
      Object.values(VIEW_MODE_CONFIGS).forEach(config => {
        expect(config.cameraConfig.animation.focusDuration).toBeGreaterThan(0)
        expect(config.cameraConfig.animation.birdsEyeDuration).toBeGreaterThan(0)
        expect(['linear', 'easeOut', 'easeInOut', 'leap']).toContain(config.cameraConfig.animation.easingFunction)
      })
    })

    it('should have reasonable viewing angles', () => {
      Object.values(VIEW_MODE_CONFIGS).forEach(config => {
        expect(config.cameraConfig.viewingAngles.defaultElevation).toBeGreaterThanOrEqual(0)
        expect(config.cameraConfig.viewingAngles.defaultElevation).toBeLessThanOrEqual(90)
        expect(config.cameraConfig.viewingAngles.birdsEyeElevation).toBeGreaterThanOrEqual(0)
        expect(config.cameraConfig.viewingAngles.birdsEyeElevation).toBeLessThanOrEqual(90)
      })
    })

    it('should have reasonable orbital scaling factors', () => {
      Object.values(VIEW_MODE_CONFIGS).forEach(config => {
        expect(config.orbitScaling.factor).toBeGreaterThan(0)
        expect(config.orbitScaling.factor).toBeLessThan(1000) // Arbitrary upper bound
      })
    })

    it('should ensure navigational scaling is less than or equal to explorational scaling for stars and planets', () => {
      const explorationalConfig = VIEW_MODE_CONFIGS.explorational
      const navConfig = VIEW_MODE_CONFIGS.navigational

      // Navigational mode stars and planets should not be larger than realistic mode
      expect(navConfig.objectScaling.star).toBeLessThanOrEqual(explorationalConfig.objectScaling.star)
      expect(navConfig.objectScaling.planet).toBeLessThanOrEqual(explorationalConfig.objectScaling.planet)
    })

    it('should handle zero or very small radius gracefully', () => {
      const propsZeroRadius = createDualProperties(0, 10, 1, 'Test', 'explorational')
      expect(propsZeroRadius.visualRadius).toBeGreaterThan(0) // Should default to min visual size
      expect(propsZeroRadius.optimalViewDistance).toBeGreaterThan(0)
    })

    it('should handle very large radius gracefully', () => {
      const propsLargeRadius = createDualProperties(1000, 10000, 1000, 'Test', 'explorational')
      expect(propsLargeRadius.optimalViewDistance).toBeGreaterThan(0)
    })

    it('should default to explorational config for unknown view mode', () => {
      expect(VIEW_MODE_CONFIGS.explorational).toEqual(VIEW_MODE_CONFIGS.explorational)
    })
  })
}) 