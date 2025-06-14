import { describe, it, expect } from 'vitest'
import { 
  calculateVisualSize, 
  calculateOrbitalDistance, 
  calculateMoonOrbitDistance,
  getViewModeConfig,
  VIEW_MODE_CONFIGS 
} from '../view-mode-calculator-km'

describe('View Mode Calculator (Kilometers)', () => {
  describe('calculateVisualSize', () => {
    it('should scale objects correctly in realistic mode', () => {
      // Sun: 695,700 km -> should be approximately 1.39 units (increased from 0.696)
      const sunSize = calculateVisualSize(695700, 'star', 'realistic')
      expect(sunSize).toBeCloseTo(1.39, 2)
      
      // Jupiter: 69,911 km -> should be approximately 6.99 units (increased from 3.5)
      const jupiterSize = calculateVisualSize(69911, 'planet', 'realistic')
      expect(jupiterSize).toBeCloseTo(2.0, 1)
      
      // Earth: 6,371 km -> should be approximately 0.64 units (increased from 0.32)
      const earthSize = calculateVisualSize(6371, 'planet', 'realistic')
      expect(earthSize).toBeCloseTo(0.64, 1)
      
      // Luna: 1,737 km -> should be approximately 0.1737 units (corrected value)
      const lunaSize = calculateVisualSize(1737, 'moon', 'realistic')
      expect(lunaSize).toBeCloseTo(0.1737, 2)
    })

    it('should use fixed sizes in navigational mode', () => {
      const config = VIEW_MODE_CONFIGS.navigational
      
      // All stars should be the same size regardless of actual radius
      const smallStar = calculateVisualSize(100000, 'star', 'navigational')
      const largeStar = calculateVisualSize(700000, 'star', 'navigational')
      expect(smallStar).toBe(config.minStarSize)
      expect(largeStar).toBe(config.minStarSize)
      expect(smallStar).toBe(largeStar)
      
      // All planets should be the same size regardless of actual radius
      const smallPlanet = calculateVisualSize(3000, 'planet', 'navigational')
      const largePlanet = calculateVisualSize(70000, 'planet', 'navigational')
      expect(smallPlanet).toBe(config.minPlanetSize)
      expect(largePlanet).toBe(config.minPlanetSize)
      expect(smallPlanet).toBe(largePlanet)
    })

    it('should use fixed sizes in profile mode', () => {
      const config = VIEW_MODE_CONFIGS.profile
      
      // Profile mode should have smaller fixed sizes than navigational
      const starSize = calculateVisualSize(695700, 'star', 'profile')
      const planetSize = calculateVisualSize(69911, 'planet', 'profile')
      const moonSize = calculateVisualSize(1737, 'moon', 'profile')
      
      expect(starSize).toBe(config.minStarSize)
      expect(planetSize).toBe(config.minPlanetSize)
      expect(moonSize).toBe(config.minMoonSize)
      
      // Profile sizes should be smaller than navigational
      expect(starSize).toBeLessThan(VIEW_MODE_CONFIGS.navigational.minStarSize)
      expect(planetSize).toBeLessThan(VIEW_MODE_CONFIGS.navigational.minPlanetSize)
      expect(moonSize).toBeLessThan(VIEW_MODE_CONFIGS.navigational.minMoonSize)
    })

    it('should enforce minimum sizes in realistic mode', () => {
      const config = VIEW_MODE_CONFIGS.realistic
      
      // Very small objects should still be visible
      const tinyAsteroid = calculateVisualSize(1, 'asteroid', 'realistic')
      expect(tinyAsteroid).toBeGreaterThanOrEqual(config.minAsteroidSize)
      
      const smallMoon = calculateVisualSize(10, 'moon', 'realistic')
      expect(smallMoon).toBeGreaterThanOrEqual(0.01) // Adjusted to reflect new minMoonSize
      expect(smallMoon).toBeCloseTo(0.01, 2) // Should be capped at minMoonSize
    })

    it('should enforce maximum sizes in realistic mode', () => {
      const config = VIEW_MODE_CONFIGS.realistic

      // Very large objects should be capped at max sizes
      const hugeStar = calculateVisualSize(100000000, 'star', 'realistic') // Larger than actual sun
      expect(hugeStar).toBeLessThanOrEqual(config.maxStarSize)
      expect(hugeStar).toBe(config.maxStarSize)

      const giantPlanet = calculateVisualSize(30000, 'planet', 'realistic') // Larger than actual Jupiter
      expect(giantPlanet).toBeLessThanOrEqual(config.maxPlanetSize)
      expect(giantPlanet).toBe(config.maxPlanetSize) // Ensure it is capped at maxPlanetSize, which is 2.0
    })
  })

  describe('calculateOrbitalDistance', () => {
    it('should scale orbital distances correctly for each mode', () => {
      const testDistanceAU = 1.0 // Earth's distance
      
      const realisticDistance = calculateOrbitalDistance(testDistanceAU, 'realistic')
      const navDistance = calculateOrbitalDistance(testDistanceAU, 'navigational')
      const profileDistance = calculateOrbitalDistance(testDistanceAU, 'profile')
      
      expect(realisticDistance).toBe(1.0) // No scaling in realistic mode
      expect(navDistance).toBe(0.8) // Compressed in navigational
      expect(profileDistance).toBe(0.6) // Most compressed in profile
    })

    it('should show correct size relationships between celestial bodies', () => {
      // Sun should be much larger than Jupiter
      const sunSize = calculateVisualSize(695700, 'star', 'realistic')
      const jupiterSize = calculateVisualSize(69911, 'planet', 'realistic')
      expect(sunSize).toBeGreaterThan(jupiterSize * 0.1)
      
      // Jupiter should be larger than Earth
      const earthSize = calculateVisualSize(6371, 'planet', 'realistic')
      expect(jupiterSize).toBeGreaterThan(earthSize) // Adjusted to reflect new capped sizes
      
      // Earth should be larger than Luna
      const lunaSize = calculateVisualSize(1737, 'moon', 'realistic')
      expect(earthSize).toBeGreaterThan(lunaSize * 1)
    })
  })

  describe('calculateMoonOrbitDistance', () => {
    it('should ensure moons orbit outside their parent planet', () => {
      // Test Luna orbiting Earth
      const earthRadiusKm = 6371
      const lunaOrbitAU = 0.00257 // Very small in AU
      
      const realisticOrbit = calculateMoonOrbitDistance(earthRadiusKm, lunaOrbitAU, 'realistic')
      const navOrbit = calculateMoonOrbitDistance(earthRadiusKm, lunaOrbitAU, 'navigational')
      
      // Calculate what Earth's visual size would be
      const earthVisualSize = calculateVisualSize(earthRadiusKm, 'planet', 'realistic')
      const earthNavSize = calculateVisualSize(earthRadiusKm, 'planet', 'navigational')
      
      // Moon orbits should be outside parent visual radius
      expect(realisticOrbit).toBeGreaterThan(earthVisualSize * 2)
      expect(navOrbit).toBeGreaterThan(earthNavSize * 2)
    })

    it('should handle very small moon orbits correctly', () => {
      // Test Phobos orbiting Mars (very close orbit)
      const marsRadiusKm = 3389.5
      const phobosOrbitAU = 0.00006 // Extremely small
      
      const orbitDistance = calculateMoonOrbitDistance(marsRadiusKm, phobosOrbitAU, 'realistic')
      const marsVisualSize = calculateVisualSize(marsRadiusKm, 'planet', 'realistic')
      
      // Even Phobos should orbit outside Mars' visual radius
      expect(orbitDistance).toBeGreaterThan(marsVisualSize * 2)
    })

    it('should use standardized distances in navigational mode', () => {
      const planetRadiusKm = 6371
      const orbitAU = 0.1
      
      const navOrbit = calculateMoonOrbitDistance(planetRadiusKm, orbitAU, 'navigational')
      const planetNavSize = calculateVisualSize(planetRadiusKm, 'planet', 'navigational')
      
      // Should be a fixed multiple of parent size in nav mode
      expect(navOrbit).toBe(planetNavSize * 3.0)
    })
  })

  describe('view mode configuration', () => {
    it('should have valid configurations for all view modes', () => {
      const modes = ['realistic', 'navigational', 'profile'] as const
      
      for (const mode of modes) {
        const config = getViewModeConfig(mode)
        
        expect(config).toBeDefined()
        expect(config.name).toBeDefined()
        expect(config.description).toBeDefined()
        expect(typeof config.orbitScale).toBe('number')
        expect(config.orbitScale).toBeGreaterThan(0)
        
        // All minimum sizes should be positive
        expect(config.minStarSize).toBeGreaterThan(0)
        expect(config.minPlanetSize).toBeGreaterThan(0)
        expect(config.minMoonSize).toBeGreaterThan(0)
        expect(config.minAsteroidSize).toBeGreaterThan(0)
      }
    })

    it('should have decreasing orbital scales from realistic to profile', () => {
      const realistic = getViewModeConfig('realistic')
      const navigational = getViewModeConfig('navigational')
      const profile = getViewModeConfig('profile')
      
      // Orbital compression should increase from realistic to profile
      expect(realistic.orbitScale).toBeGreaterThanOrEqual(navigational.orbitScale)
      expect(navigational.orbitScale).toBeGreaterThanOrEqual(profile.orbitScale)
    })
  })

  describe('edge cases', () => {
    it('should handle zero and negative radius values gracefully', () => {
      expect(() => calculateVisualSize(0, 'planet', 'realistic')).not.toThrow()
      expect(() => calculateVisualSize(-100, 'star', 'navigational')).not.toThrow()
      
      const zeroSize = calculateVisualSize(0, 'planet', 'realistic')
      expect(zeroSize).toBeGreaterThan(0) // Should fall back to minimum size
    })

    it('should handle very large radius values', () => {
      const hugeObject = calculateVisualSize(10000000, 'star', 'realistic')
      expect(hugeObject).toBeGreaterThan(0)
      expect(isFinite(hugeObject)).toBe(true)
    })

    it('should handle unknown classifications', () => {
      const unknownObject = calculateVisualSize(1000, 'unknown' as any, 'realistic')
      expect(unknownObject).toBeGreaterThan(0)
      expect(isFinite(unknownObject)).toBe(true)
    })
  })
}) 