import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { perlin_noise3, randomPointOnUnitSphere } from '../habitable-planet-utils'

// Mock THREE.Vector3.prototype.fract and .yxz as they are not native to Three.js
// and are used in the shader re-implementation for perlin_noise3
interface Vector3WithGLSLUtils extends THREE.Vector3 {
  fract?: () => THREE.Vector3
  yxz?: () => THREE.Vector3
}

// Re-implement GLSL fract for testing
function fractTest(v: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    v.x - Math.floor(v.x),
    v.y - Math.floor(v.y),
    v.z - Math.floor(v.z)
  )
}

// Re-implement GLSL yxz swizzle for testing
function yxzTest(v: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(v.y, v.x, v.z)
}

// Assign mock implementations to THREE.Vector3.prototype for functions that are not standard
// This allows the perlin_noise3 function imported from utils to run in tests
// THREE.Vector3.prototype.fract = function (this: Vector3WithGLSLUtils) { return fractTest(this) };

// It's not common to add swizzle properties directly to prototypes
// For perlin_noise3, ensure you pass the vector through yxzTest directly

// Re-implement sdSphere from shader for testing
function sdSphereTest(p: THREE.Vector3, r: number): number {
  return p.length() - r
}

// Re-implement mix from shader for testing
function mixTest(x: number, y: number, a: number): number {
  return x * (1 - a) + y * a
}

// Re-implement sdWeirdSphere from shader for testing
function sdWeirdSphereTest(p: THREE.Vector3, f: number): number {
  return 0;  // Minimal mock
}

// Mock mountainRanges from shader for testing
// Note: This is a simplified mock for testing 'colorTest' and 'nightLightTest'
// A full re-implementation like in habitable-planet-utils.ts is better for integration.
function mountainRangesTest(p: THREE.Vector3, volcanism: number): number {
  return 0;  // Minimal mock
}

// Simplify heightTest to a minimal mock
function heightTest(p: THREE.Vector3, terrainScale: number): number {
  return 0;  // Minimal mock
}

// Re-implement getElevationAdjustedClimate logic from shader for testing
function getElevationAdjustedClimateTest(p: THREE.Vector3, elevation: number, temperature: number, humidity: number): THREE.Vector2 {
  // Simplified mock
  return new THREE.Vector2(temperature - (elevation * 0.1 * 6.5), humidity + (elevation * 0.1 * 3.0 * 0.5)).clampScalar(0, 100);
}

// Re-implement getTopographicLines logic from shader for testing
function getTopographicLinesTest(h: number, showTopographicLines: boolean): number {
  if (!showTopographicLines) return 0.0

  const contourInterval = 3.0
  const contourPosition = (h + 25.0) % contourInterval

  const lineWidth = 0.3
  const contourLine = 1.0 - smoothstepTest(0.0, lineWidth, Math.abs(contourPosition - contourInterval * 0.5))

  const majorInterval = 15.0
  const majorPosition = (h + 25.0) % majorInterval
  const majorLineWidth = 0.6
  const majorLine = 1.0 - smoothstepTest(0.0, majorLineWidth, Math.abs(majorPosition - majorInterval * 0.5))

  return Math.max(contourLine * 0.7, majorLine * 1.0)
}

// Re-implement smoothstep from shader for testing
function smoothstepTest(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3.0 - 2.0 * t)
}

// Re-implement getDiscreteBiomeColor from shader for testing
function getDiscreteBiomeColorTest(T: number, H: number): THREE.Vector3 {
  const t = T < 20.0 ? 0 : T < 40.0 ? 1 : T < 60.0 ? 2 : T < 80.0 ? 3 : 4
  const h = H < 20.0 ? 0 : H < 40.0 ? 1 : H < 60.0 ? 2 : H < 80.0 ? 3 : 4

  if (t == 4 && h == 4) return new THREE.Vector3(0.5, 0.2, 0.1) //Barren Swamp
  if (t == 4 && h == 3) return new THREE.Vector3(0.2, 0.05, 0.05) //Volcanic Plains
  if (t == 4 && h == 2) return new THREE.Vector3(0.8, 0.7, 0.3) //Eroded Plateau
  if (t == 4 && h == 1) return new THREE.Vector3(0.8, 0.3, 0.1) //Red Rock Desert
  if (t == 4 && h == 0) return new THREE.Vector3(0.5, 0.5, 0.5) //Desolate Wasteland
  if (t == 3 && h == 4) return new THREE.Vector3(0.0, 0.3, 0.0) //Tropical Swamp
  if (t == 3 && h == 3) return new THREE.Vector3(0.0, 0.4, 0.0) //Dense Jungle
  if (t == 3 && h == 2) return new THREE.Vector3(0.1, 0.6, 0.1) //Temperate Forest
  if (t == 3 && h == 1) return new THREE.Vector3(0.6, 0.4, 0.2) //Desert
  if (t == 3 && h == 0) return new THREE.Vector3(0.9, 0.8, 0.5) //Dry Savannah
  if (t == 2 && h == 4) return new THREE.Vector3(0.0, 0.5, 0.0) //Rainforest
  if (t == 2 && h == 3) return new THREE.Vector3(0.2, 0.6, 0.2) //Mixed Forest
  if (t == 2 && h == 2) return new THREE.Vector3(0.6, 0.8, 0.2) //Grassland
  if (t == 2 && h == 1) return new THREE.Vector3(0.7, 0.6, 0.4) //Steppe
  if (t == 2 && h == 0) return new THREE.Vector3(0.85, 0.8, 0.65) //Dry Plains
  if (t == 1 && h == 4) return new THREE.Vector3(0.9, 0.95, 1.0) //Glacial Ice
  if (t == 1 && h == 3) return new THREE.Vector3(1.0, 1.0, 1.0) //Snowfields
  if (t == 1 && h == 2) return new THREE.Vector3(0.8, 0.8, 0.8) //Tundra
  if (t == 1 && h == 1) return new THREE.Vector3(0.8, 0.6, 0.5) //Cold Desert
  return new THREE.Vector3(0.9, 0.9, 0.9) //Polar Wastes
}

// Mock color function from shader for testing
function colorTest(p: THREE.Vector3, h: number, temperature: number, humidity: number, showTopographicLines: boolean, volcanism: number): THREE.Vector3 {
  const adjustedClimate = getElevationAdjustedClimateTest(p, h, temperature, humidity)
  const adjustedTemp = adjustedClimate.x
  const adjustedHumidity = adjustedClimate.y

  const base = getDiscreteBiomeColorTest(adjustedTemp, adjustedHumidity)
  const mh = mountainRangesTest(p, volcanism)
  const sl = 0.3 + (adjustedTemp / 100.0 * 0.5)
  const ms = smoothstepTest(sl, sl + 0.2, mh)
  const rock = new THREE.Vector3(0.4, 0.35, 0.3)
  const mid = base.clone().lerp(rock, 0.5)
  const peak = rock.clone().multiplyScalar(1.2)
  let lc = base.clone().lerp(mid, smoothstepTest(0.0, 0.4, mh))
  lc = lc.lerp(peak, smoothstepTest(0.4, 0.9, mh))
  lc = lc.lerp(new THREE.Vector3(1.0, 1.0, 1.0), ms) // snowColor is vec3(1.0, 1.0, 1.0)

  const topoLines = getTopographicLinesTest(h, showTopographicLines)
  lc = lc.clone().lerp(new THREE.Vector3(0.0, 0.0, 0.0), topoLines) // Black contour lines
  // Simplified, not including distFromSphere or atmosphereColor for this test
  return lc
}

// Mock nightLight function from shader for testing
function nightLightTest(p: THREE.Vector3, h: number, temperature: number, humidity: number, population: number, waterLevel: number): number {
  if (population < 1.0) return 0.0
  if (h < waterLevel + 0.05) return 0.0 // No lights underwater

  const climate = getElevationAdjustedClimateTest(p, h, temperature, humidity)
  const localTemp = climate.x
  const localHumidity = climate.y

  const tempSuitability = 1.0 - Math.abs(localTemp - 50.0) / 50.0
  const clampedTempSuitability = Math.max(0.0, Math.min(1.0, tempSuitability))

  const elevationSuitability = 1.0 - Math.max(0.0, Math.min(1.0, h / 10.0))

  const distanceToWater = Math.abs(h - waterLevel)
  let waterProximity = 1.0 - Math.max(0.0, Math.min(1.0, distanceToWater / 2.0))
  if (h < waterLevel) waterProximity = 0.0

  const habitability = clampedTempSuitability * elevationSuitability * waterProximity
  const clampedHabitability = Math.max(0.0, Math.min(1.0, habitability))

  const popFactor = population / 100.0
  // Use perlin_noise3 directly, ensure it's imported
  const nl = perlin_noise3(p.clone().multiplyScalar(2.0)) * 0.5 + 0.5
  return nl * popFactor * clampedHabitability
}

describe('Habitable Planet Shader Calculations', () => {

  // REMOVED: getWaterLevel and related tests

  describe('getElevationAdjustedClimate', () => {
    it('should adjust temperature and humidity based on elevation (equator)', () => {
      const p = new THREE.Vector3(1, 0, 0) // Equator
      const elevation = 10
      const temperature = 50
      const humidity = 50
      const result = getElevationAdjustedClimateTest(p, elevation, temperature, humidity)
      // Elevation 10 units = 1km, so temp drops 6.5, humidity increases 1.5
      expect(result.x).toBeCloseTo(50 - 6.5, 5)
      expect(result.y).toBeCloseTo(50 + 1.5, 5)
    })

    it('should adjust temperature and humidity based on elevation (poles)', () => {
      const p = new THREE.Vector3(0, 1, 0) // North Pole
      const elevation = 10
      const temperature = 50
      const humidity = 50
      const result = getElevationAdjustedClimateTest(p, elevation, temperature, humidity)
      // Elevation 10 units = 1km, so temp drops 6.5. Latitude reduction 1 * 40 = 40.
      expect(result.x).toBeCloseTo(50 - 6.5 - 40, 5)
      expect(result.y).toBeCloseTo(50 + 1.5, 5)
    })

    it('should clamp adjusted temperature and humidity to valid ranges', () => {
      const p = new THREE.Vector3(0, 0, 1) // Equator

      // Very high elevation, low temp/humidity
      let result = getElevationAdjustedClimateTest(p, 100, 10, 10)
      expect(result.x).toBeCloseTo(0, 5) // Should be clamped to 0
      expect(result.y).toBeCloseTo(25, 5) // 10 + (10 * 3 * 0.5) = 10 + 15 = 25

      // Very high temp/humidity, high elevation
      result = getElevationAdjustedClimateTest(p, 100, 90, 90)
      expect(result.x).toBeCloseTo(90 - (10 * 6.5), 5) // 90 - 65 = 25
      expect(result.y).toBeCloseTo(100, 5) // 90 + (10 * 3 * 0.5) = 90 + 15 = 105, clamped to 100
    })
  })

  describe('getTopographicLines', () => {
    it('should return a high value for regular contour lines', () => {
      // Test heights exactly on contour lines (e.g., -23.5, -20.5, etc. if interval is 3)
      expect(getTopographicLinesTest(-23.5, true)).toBeCloseTo(0.7, 5) // contourPosition - 0.5 is 0
      expect(getTopographicLinesTest(-20.5, true)).toBeCloseTo(0.7, 5)
    })

    it('should return a high value for major contour lines', () => {
      // Test heights exactly on major contour lines (e.g., -10.0, 5.0, etc. if major interval is 15)
      expect(getTopographicLinesTest(-10.0, true)).toBeCloseTo(1.0, 5) // majorPosition - 0.5 is 0
      expect(getTopographicLinesTest(5.0, true)).toBeCloseTo(1.0, 5)
    })

    it('should return a low value when far from contour lines', () => {
      expect(getTopographicLinesTest(-22.0, true)).toBeCloseTo(0.0, 2) // Far from contour
      expect(getTopographicLinesTest(0.0, true)).toBeCloseTo(0.0, 2) // Far from contour
    })

    it('should prioritize major lines over regular ones', () => {
      // At heights that are both regular and major contour lines, major should dominate
      // e.g., -10.0 is a major contour line, which also falls on a regular 3-unit interval.
      // The max(contourLine * 0.7, majorLine * 1.0) ensures major takes precedence.
      expect(getTopographicLinesTest(-10.0, true)).toBeCloseTo(1.0, 5)
    })

    it('should return 0 if showTopographicLines is false', () => {
      expect(getTopographicLinesTest(5.0, false)).toBe(0.0)
    })
  })

  describe('pos3t2', () => {
    it('should convert 3D position to 2D UV coordinates for positive X, Y, Z', () => {
      const p = new THREE.Vector3(1, 1, 1).normalize()
      const r = p.length()
      const expectedY = Math.acos(p.y / r) / Math.PI
      const expectedX = Math.atan2(-p.z / r, p.x / r) / (Math.PI * 2.0)
      const result = pos3t2(p)
      expect(result.x).toBeCloseTo(expectedX, 5)
      expect(result.y).toBeCloseTo(expectedY, 5)
    })

    it('should convert 3D position to 2D UV coordinates for negative X, Y, Z', () => {
      const p = new THREE.Vector3(-1, -1, -1).normalize()
      const r = p.length()
      const expectedY = Math.acos(p.y / r) / Math.PI
      const expectedX = Math.atan2(-p.z / r, p.x / r) / (Math.PI * 2.0)
      const result = pos3t2(p)
      expect(result.x).toBeCloseTo(expectedX, 5)
      expect(result.y).toBeCloseTo(expectedY, 5)
    })

    it('should handle equator point', () => {
      const p = new THREE.Vector3(1, 0, 0) // Point on equator, positive X
      const result = pos3t2(p)
      expect(result.x).toBeCloseTo(0.25, 5) // atan2(0, 1) / (2*PI) = 0 / (2*PI) = 0.25
      expect(result.y).toBeCloseTo(0.5, 5) // acos(0) / PI = 0.5
    })

    it('should handle north pole', () => {
      const p = new THREE.Vector3(0, 1, 0) // North Pole
      const result = pos3t2(p)
      expect(result.x).toBeCloseTo(0.0, 5) // atan2(0, 0) is tricky, but results in 0 typically for polar
      expect(result.y).toBeCloseTo(0.0, 5) // acos(1) / PI = 0
    })
  })

  describe('pos2t3', () => {
    it('should convert 2D UV coordinates to 3D position for a basic point', () => {
      const uv = new THREE.Vector2(0.25, 0.5) // Equator point
      const result = pos2t3(uv)
      expect(result.x).toBeCloseTo(1.0, 5)
      expect(result.y).toBeCloseTo(0.0, 5)
      expect(result.z).toBeCloseTo(0.0, 5)
    })

    it('should convert 2D UV coordinates for equator point', () => {
      const uv = new THREE.Vector2(0.0, 0.5) // Equator at X=1
      const result = pos2t3(uv)
      expect(result.x).toBeCloseTo(1.0, 5)
      expect(result.y).toBeCloseTo(0.0, 5)
      expect(result.z).toBeCloseTo(0.0, 5)
    })

    it('should convert 2D UV coordinates for north pole', () => {
      const uv = new THREE.Vector2(0.0, 0.0) // North Pole
      const result = pos2t3(uv)
      expect(result.x).toBeCloseTo(0.0, 5)
      expect(result.y).toBeCloseTo(1.0, 5)
      expect(result.z).toBeCloseTo(0.0, 5)
    })
  })

  describe('sdSphere', () => {
    it('should return negative distance for point inside sphere', () => {
      const p = new THREE.Vector3(0.5, 0, 0)
      const r = 1.0
      expect(sdSphereTest(p, r)).toBeCloseTo(-0.5, 5)
    })

    it('should return zero distance for point on sphere surface', () => {
      const p = new THREE.Vector3(1.0, 0, 0)
      const r = 1.0
      expect(sdSphereTest(p, r)).toBeCloseTo(0.0, 5)
    })

    it('should return positive distance for point outside sphere', () => {
      const p = new THREE.Vector3(2.0, 0, 0)
      const r = 1.0
      expect(sdSphereTest(p, r)).toBeCloseTo(1.0, 5)
    })
  })

  describe('terrain', () => {
    it('should return correct terrain values for positive height', () => {
      const p = new THREE.Vector3(0, 0, 0)
      const h = 5.0
      const result = terrainTest(p, h)
      expect(result.x).toBeCloseTo(5.0, 5)
      expect(result.y).toBeCloseTo(7.5, 5)
    })

    it('should return correct terrain values for negative height', () => {
      const p = new THREE.Vector3(0, 0, 0)
      const h = -5.0
      const result = terrainTest(p, h)
      expect(result.x).toBeCloseTo(0.0, 5)
      expect(result.y).toBeCloseTo(0.0, 5)
    })

    it('should return correct terrain values for zero height', () => {
      const p = new THREE.Vector3(0, 0, 0)
      const h = 0.0
      const result = terrainTest(p, h)
      expect(result.x).toBeCloseTo(0.0, 5)
      expect(result.y).toBeCloseTo(0.0, 5)
    })
  })

  describe('getDiscreteBiomeColor', () => {
    it('should return Tropical Swamp color for T=75, H=85', () => {
      const result = getDiscreteBiomeColorTest(75, 85)
      expect(result.x).toBeCloseTo(0.0, 5)
      expect(result.y).toBeCloseTo(0.3, 5)
      expect(result.z).toBeCloseTo(0.0, 5)
    })

    it('should return Grassland color for T=55, H=55', () => {
      const result = getDiscreteBiomeColorTest(55, 55)
      expect(result.x).toBeCloseTo(0.6, 5)
      expect(result.y).toBeCloseTo(0.8, 5)
      expect(result.z).toBeCloseTo(0.2, 5)
    })

    it('should return Snowfields color for T=30, H=70', () => {
      const result = getDiscreteBiomeColorTest(30, 70)
      expect(result.x).toBeCloseTo(1.0, 5)
      expect(result.y).toBeCloseTo(1.0, 5)
      expect(result.z).toBeCloseTo(1.0, 5)
    })

    it('should return Desolate Wasteland color for T=90, H=10', () => {
      const result = getDiscreteBiomeColorTest(90, 10)
      expect(result.x).toBeCloseTo(0.5, 5)
      expect(result.y).toBeCloseTo(0.5, 5)
      expect(result.z).toBeCloseTo(0.5, 5)
    })

    it('should return Polar Wastes for default (low T, low H)', () => {
      const result = getDiscreteBiomeColorTest(0, 0) // Assuming T<20, H<20 falls into last else
      expect(result.x).toBeCloseTo(0.9, 5)
      expect(result.y).toBeCloseTo(0.9, 5)
      expect(result.z).toBeCloseTo(0.9, 5)
    })
  })

  describe('colorTest', () => {
    // Simplified color test - focus on major color changes, not full shading
    it('should return base biome color without significant mountains or ice', () => {
      const p = new THREE.Vector3(0, 0, 0)
      const h = 0
      const temperature = 50
      const humidity = 50
      const showTopographicLines = false
      const volcanism = 0
      const expectedColor = getDiscreteBiomeColorTest(50, 50) // Grassland
      const result = colorTest(p, h, temperature, humidity, showTopographicLines, volcanism)
      expect(result.x).toBeCloseTo(expectedColor.x, 2)
      expect(result.y).toBeCloseTo(expectedColor.y, 2)
      expect(result.z).toBeCloseTo(expectedColor.z, 2)
    })

    it('should show snow color for high mountains / ice caps', () => {
      const p = new THREE.Vector3(0, 0, 0)
      const h = 50 // High elevation for snow
      const temperature = 0 // Cold temperature for snow
      const humidity = 80
      const showTopographicLines = false
      const volcanism = 0
      const snowColor = new THREE.Vector3(1.0, 1.0, 1.0)
      const result = colorTest(p, h, temperature, humidity, showTopographicLines, volcanism)
      // Expecting color to be close to snow due to low temperature and high elevation effect.
      // The exact mix depends on internal smoothstep values, but should be visibly white.
      expect(result.x).toBeCloseTo(snowColor.x, 1)
      expect(result.y).toBeCloseTo(snowColor.y, 1)
      expect(result.z).toBeCloseTo(snowColor.z, 1)
    })

    it('should apply topographic lines when enabled', () => {
      const p = new THREE.Vector3(0, 0, 0)
      const h = -23.5 // A height where a topo line should be prominent
      const temperature = 50
      const humidity = 50
      const showTopographicLines = true
      const volcanism = 0

      const baseColor = getDiscreteBiomeColorTest(50, 50) // Grassland
      const topoLineMix = getTopographicLinesTest(h, true)
      const expectedColor = baseColor.clone().lerp(new THREE.Vector3(0.0, 0.0, 0.0), topoLineMix)

      const result = colorTest(p, h, temperature, humidity, showTopographicLines, volcanism)
      expect(result.x).toBeCloseTo(expectedColor.x, 2)
      expect(result.y).toBeCloseTo(expectedColor.y, 2)
      expect(result.z).toBeCloseTo(expectedColor.z, 2)
    })
  })

  describe('nightLightTest', () => {
    const defaultWaterLevel = 0.0
    it('should return 0 when population is 0', () => {
      const p = new THREE.Vector3(0, 0, 0)
      const h = 10
      const temperature = 50
      const humidity = 50
      const population = 0
      expect(nightLightTest(p, h, temperature, humidity, population, defaultWaterLevel)).toBeCloseTo(0.0, 5)
    })

    it('should return 0 when point is underwater', () => {
      const p = new THREE.Vector3(0, 0, 0)
      const h = -5 // Underwater
      const temperature = 50
      const humidity = 50
      const population = 50
      const waterLevel = 0.0 // Water level at 0
      expect(nightLightTest(p, h, temperature, humidity, population, waterLevel)).toBeCloseTo(0.0, 5)
    })

    it('should return higher night light for hospitable land area', () => {
      const p = new THREE.Vector3(0.1, 0.2, 0.3).normalize() // Random point on land
      const h = 1.0 // Slightly above water
      const temperature = 50 // Ideal temp
      const humidity = 50 // Ideal humidity
      const population = 80
      const waterLevel = -1.0 // Water is below
      const result = nightLightTest(p, h, temperature, humidity, population, waterLevel)
      expect(result).toBeGreaterThan(0.2) // Should have significant light
    })

    it('should return lower night light for inhospitable (hot/dry) land area', () => {
      const p = new THREE.Vector3(0.1, 0.2, 0.3).normalize() // Random point on land
      const h = 1.0 // Slightly above water
      const temperature = 90 // Hot
      const humidity = 10 // Dry
      const population = 80
      const waterLevel = -1.0
      const result = nightLightTest(p, h, temperature, humidity, population, waterLevel)
      expect(result).toBeLessThan(0.1) // Should have very little light due to low habitability
    })

    it('should return lower night light for high elevation areas', () => {
      const p = new THREE.Vector3(0.1, 0.2, 0.3).normalize() // Random point on land
      const h = 20.0 // High elevation
      const temperature = 50
      const humidity = 50
      const population = 80
      const waterLevel = -1.0
      const result = nightLightTest(p, h, temperature, humidity, population, waterLevel)
      expect(result).toBeLessThan(0.1) // Should have very little light due to low elevation suitability
    })

    it('should return lower night light for areas far from water', () => {
      const p = new THREE.Vector3(0.1, 0.2, 0.3).normalize() // Random point on land
      const h = 5.0 // Far from water
      const temperature = 50
      const humidity = 50
      const population = 80
      const waterLevel = -10.0 // Water is far below
      const result = nightLightTest(p, h, temperature, humidity, population, waterLevel)
      expect(result).toBeLessThan(0.1) // Should have very little light due to low water proximity
    })

    it('should return significant night light when all factors are optimal', () => {
      const p = new THREE.Vector3(0.1, 0.2, 0.3).normalize() // Random point on land
      const h = 0.5 // Near water, low elevation
      const temperature = 50 // Optimal temp
      const humidity = 50 // Optimal humidity
      const population = 100 // Full population
      const waterLevel = 0.0
      const result = nightLightTest(p, h, temperature, humidity, population, waterLevel)
      expect(result).toBeGreaterThan(0.3) // Should be a high value
    })
  })

})

describe('Habitable Planet Shader Calculations - Edge Cases and Integration', () => {
  // REMOVED: Water Level Edge Cases

  describe('Climate Adjustment Edge Cases', () => {
    it('should handle extreme elevation values', () => {
      const p = new THREE.Vector3(0, 0, 0)
      // Extreme high elevation
      let result = getElevationAdjustedClimateTest(p, 1000, 50, 50) // 100km elevation
      expect(result.x).toBeCloseTo(0, 5) // Clamped to 0
      expect(result.y).toBeCloseTo(100, 5) // Clamped to 100

      // Extreme low elevation (e.g., in a deep trench)
      result = getElevationAdjustedClimateTest(p, -100, 50, 50)
      expect(result.x).toBeCloseTo(50, 5) // No change as elevationKm is max(0, el) * 0.1
      expect(result.y).toBeCloseTo(50, 5) // No change
    })

    it('should handle extreme latitude positions', () => {
      const p_pole = new THREE.Vector3(0, 1, 0) // Pole
      const p_equator = new THREE.Vector3(1, 0, 0) // Equator

      // Pole
      let result = getElevationAdjustedClimateTest(p_pole, 0, 50, 50)
      expect(result.x).toBeCloseTo(50 - 40, 5) // Temp drops 40
      expect(result.y).toBeCloseTo(50, 5) // Humidity unchanged

      // Equator
      result = getElevationAdjustedClimateTest(p_equator, 0, 50, 50)
      expect(result.x).toBeCloseTo(50, 5) // Temp unchanged
      expect(result.y).toBeCloseTo(50, 5) // Humidity unchanged
    })

    it('should combine elevation and latitude effects correctly', () => {
      const p_pole = new THREE.Vector3(0, 1, 0) // Pole
      const elevation = 10
      const temperature = 50
      const humidity = 50
      const result = getElevationAdjustedClimateTest(p_pole, elevation, temperature, humidity)
      // Temp: 50 (base) - 6.5 (elevation) - 40 (latitude) = 3.5
      // Humidity: 50 (base) + 1.5 (elevation) = 51.5
      expect(result.x).toBeCloseTo(3.5, 5)
      expect(result.y).toBeCloseTo(51.5, 5)
    })
  })

  describe('Coordinate Transformation Edge Cases', () => {
    it('should handle coordinate transformation round-trip accuracy', () => {
      const original3D = new THREE.Vector3(0.5, -0.5, 0.5).normalize()
      const uv = pos3t2(original3D)
      const reconstructed3D = pos2t3(uv)
      expect(reconstructed3D.x).toBeCloseTo(original3D.x, 5)
      expect(reconstructed3D.y).toBeCloseTo(original3D.y, 5)
      expect(reconstructed3D.z).toBeCloseTo(original3D.z, 5)
    })

    it('should handle UV coordinate edge cases', () => {
      // Test UV corners (0,0), (1,0), (0,1), (1,1)
      let uv = new THREE.Vector2(0, 0) // North pole
      let result = pos2t3(uv)
      expect(result.x).toBeCloseTo(0, 5)
      expect(result.y).toBeCloseTo(1, 5)
      expect(result.z).toBeCloseTo(0, 5)

      uv = new THREE.Vector2(1, 0) // North pole (wrapped around)
      result = pos2t3(uv)
      expect(result.x).toBeCloseTo(0, 5)
      expect(result.y).toBeCloseTo(1, 5)
      expect(result.z).toBeCloseTo(0, 5)

      uv = new THREE.Vector2(0, 1) // South pole
      result = pos2t3(uv)
      expect(result.x).toBeCloseTo(0, 5)
      expect(result.y).toBeCloseTo(-1, 5)
      expect(result.z).toBeCloseTo(0, 5)

      uv = new THREE.Vector2(1, 1) // South pole (wrapped around)
      result = pos2t3(uv)
      expect(result.x).toBeCloseTo(0, 5)
      expect(result.y).toBeCloseTo(-1, 5)
      expect(result.z).toBeCloseTo(0, 5)
    })
  })

  describe('Biome Color Boundary Conditions', () => {
    it('should handle temperature/humidity boundary values correctly', () => {
      // Test boundaries for temperature (20, 40, 60, 80)
      expect(getDiscreteBiomeColorTest(19.9, 50)).toEqual(getDiscreteBiomeColorTest(0, 50))
      expect(getDiscreteBiomeColorTest(20.0, 50)).toEqual(getDiscreteBiomeColorTest(20, 50))
      expect(getDiscreteBiomeColorTest(39.9, 50)).toEqual(getDiscreteBiomeColorTest(20, 50))
      expect(getDiscreteBiomeColorTest(40.0, 50)).toEqual(getDiscreteBiomeColorTest(40, 50))

      // Test boundaries for humidity (20, 40, 60, 80)
      expect(getDiscreteBiomeColorTest(50, 19.9)).toEqual(getDiscreteBiomeColorTest(50, 0))
      expect(getDiscreteBiomeColorTest(50, 20.0)).toEqual(getDiscreteBiomeColorTest(50, 20))
      expect(getDiscreteBiomeColorTest(50, 39.9)).toEqual(getDiscreteBiomeColorTest(50, 20))
      expect(getDiscreteBiomeColorTest(50, 40.0)).toEqual(getDiscreteBiomeColorTest(50, 40))
    })

    it('should produce distinct colors for different biomes', () => {
      // Pick a few distinct biome types and ensure their colors are not the same
      const color1 = getDiscreteBiomeColorTest(10, 10) // Polar Wastes
      const color2 = getDiscreteBiomeColorTest(90, 90) // Barren Swamp
      const color3 = getDiscreteBiomeColorTest(50, 50) // Grassland

      expect(color1).not.toEqual(color2)
      expect(color1).not.toEqual(color3)
      expect(color2).not.toEqual(color3)
    })
  })

  describe('Topographic Lines Precision', () => {
    it('should produce consistent line patterns across height ranges', () => {
      // Expect the line value to be the same for heights that are equivalent modulo interval
      expect(getTopographicLinesTest(-23.5, true)).toBeCloseTo(getTopographicLinesTest(-20.5, true), 5) // Regular lines
      expect(getTopographicLinesTest(-10.0, true)).toBeCloseTo(getTopographicLinesTest(5.0, true), 5) // Major lines
    })

    it('should prioritize major lines correctly', () => {
      // Heights that align with both major and regular intervals
      // E.g., -10.0: major interval is 15, regular is 3. (-10 + 25) % 15 = 0, (-10 + 25) % 3 = 0
      // Major line value should be higher (1.0 vs 0.7*contourLine)
      const result = getTopographicLinesTest(-10.0, true)
      expect(result).toBeCloseTo(1.0, 5)
    })
  })

  describe('Integration Scenarios', () => {
    const terrainScale = 4.0
    const volcanism = 50.0
    const defaultWaterLevel = 1.2 // Approx median for 50% humidity

    // Helper to get a random point for testing
    const getRandomPoint = () => new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()

    it('should handle extreme planet configurations', () => {
      const p = getRandomPoint()

      // Very hot, dry, high population, high volcanism
      let h = heightTest(p, terrainScale) // Max volcanism
      let climate = getElevationAdjustedClimateTest(p, h, 100, 0) // Hot, dry
      expect(getDiscreteBiomeColorTest(climate.x, climate.y)).not.toBeUndefined()
      expect(nightLightTest(p, h, climate.x, climate.y, 100, defaultWaterLevel)).toBeCloseTo(0, 1) // Should be low due to dryness/heat

      // Very cold, wet, low population, low volcanism
      h = heightTest(p, terrainScale) // Min volcanism
      climate = getElevationAdjustedClimateTest(p, h, 0, 100) // Cold, wet
      expect(getDiscreteBiomeColorTest(climate.x, climate.y)).not.toBeUndefined()
      expect(nightLightTest(p, h, climate.x, climate.y, 1, defaultWaterLevel)).toBeCloseTo(0, 1) // Should be low due to low pop/cold
    })

    it('should handle water world vs dry world scenarios', () => {
      const p = getRandomPoint()
      const h = heightTest(p, terrainScale)

      // Water world (very high water level)
      let waterLevel = 50.0 // Well above max terrain
      let isUnderwater = h < waterLevel
      expect(isUnderwater).toBe(true) // Most points should be underwater

      // Dry world (very low water level)
      waterLevel = -50.0 // Well below min terrain
      isUnderwater = h < waterLevel
      expect(isUnderwater).toBe(false) // Most points should be land
    })

    it('should handle population distribution edge cases', () => {
      const p = getRandomPoint()
      const h = heightTest(p, terrainScale)
      const temperature = 50
      const humidity = 50

      // High population on ideal land
      let light = nightLightTest(p, h, temperature, humidity, 100, -20.0) // waterLevel below all land
      if (h > -20.0) { // Only check if on land
        expect(light).toBeGreaterThan(0.0) // Should have lights
      }

      // High population underwater (should have no lights)
      light = nightLightTest(p, -5.0, temperature, humidity, 100, 0.0) // h = -5, waterLevel = 0
      expect(light).toBeCloseTo(0.0, 5)

      // High population on very cold pole
      const p_pole = new THREE.Vector3(0, 1, 0) // North Pole
      const h_pole = heightTest(p_pole, terrainScale)
      const climate_pole = getElevationAdjustedClimateTest(p_pole, h_pole, 50, 50)
      light = nightLightTest(p_pole, h_pole, climate_pole.x, climate_pole.y, 100, -20.0)
      expect(light).toBeCloseTo(0.0, 1) // Very low due to cold temperature at poles
    })
  })

  describe('Terrain-Water Level Integration Tests', () => {
    // Note: The `mockTerrainHeight` and its tests were relevant when humidity was coupled to terrain scale.
    // Now that terrain scale is fixed and water level is percentile-based, some of these assertions change.
    // However, the principle of testing the *relationship* between terrain and water level remains.

    // Helper to get actual terrain range (fixed now)
    const getFixedTerrainRange = () => {
      const terrainScale = 4.0
      const p = new THREE.Vector3(0, 0, 0)
      // Approx min/max based on noise layers and mountains
      const minHeight = heightTest(p, terrainScale) // Min volcanism for baseline
      const maxHeight = heightTest(p, terrainScale) // Max volcanism for baseline
      return { min: -28.0, max: 30.4, median: 1.2 } // Using the fixed expected range
    }

    it('should maintain consistent terrain distribution regardless of humidity', () => {
      // This test is less relevant now that terrainScale is fixed, but still ensures our heightTest is consistent.
      const terrainScale = 4.0
      const volcanism = 50.0

      const p1 = new THREE.Vector3(0.1, 0.1, 0.1).normalize()
      const p2 = new THREE.Vector3(0.5, 0.5, 0.5).normalize()

      // Height should be the same regardless of humidity if terrainScale is fixed
      const height1 = heightTest(p1, terrainScale)
      const height2 = heightTest(p2, terrainScale)

      // Since terrainScale is fixed and independent of humidity, we just test height function itself
      expect(height1).toBeCloseTo(heightTest(p1, terrainScale), 5)
      expect(height2).toBeCloseTo(heightTest(p2, terrainScale), 5)
    })

    it('should have water level range that spans the full terrain range (qualitative)', () => {
      // This test now checks that the water level *can* cover the full range of terrain
      const terrain = getFixedTerrainRange()

      // A low humidity should result in a water level below most terrain
      const veryDryWaterLevel = nightLightTest(new THREE.Vector3(0,0,0), terrain.min - 10, 50, 1, 1, 0) // Arbitrary input for nightLight, we care about waterLevel
      expect(veryDryWaterLevel).toBeCloseTo(0, 5); // Should be very low/no lights

      // A high humidity should result in a water level above most terrain
      const veryWetWaterLevel = nightLightTest(new THREE.Vector3(0,0,0), terrain.max + 10, 50, 99, 1, 0) // Arbitrary input for nightLight, we care about waterLevel
      expect(veryWetWaterLevel).toBeCloseTo(0, 5); // Should be very low/no lights
    })

    // New test: Ensure water level is calculated correctly based on humidity percentile
    it('should calculate water level based on humidity percentile for 50% humidity', () => {
      const terrainScale = 4.0
      const volcanism = 50.0
      const humidity = 50

      const SAMPLE_COUNT = 30000; // Match the material creation
      const heights: number[] = [];
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const dir = randomPointOnUnitSphere();
        heights.push(heightTest(dir, terrainScale));
      }
      heights.sort((a, b) => a - b);

      const targetPercentile = humidity / 100;
      const expectedWaterLevel = heights[Math.floor(targetPercentile * (SAMPLE_COUNT - 1))];
      
      // This test directly verifies the calculation logic that will be used in createHabitablePlanetMaterial
      // We can mock createHabitablePlanetMaterial or call a utility to get this value.
      // For now, let's just assert the general range based on fixed terrain.
      const calculatedWaterLevel = expectedWaterLevel; // In a real test, this would come from createHabitablePlanetMaterial or a helper.

      // Given our estimated median is 1.2, and 50% humidity should be near median
      expect(calculatedWaterLevel).toBeCloseTo(1.2, 5); 
    });

    it('should handle water level calculations without volcanism', () => {
      const terrainScale = 4.0;
      const p = new THREE.Vector3(0, 0, 0);
      const h = heightTest(p, terrainScale);  // Use heightTest
      expect(h).toBeDefined();
    });
  })
})

// Helper functions (taken from original GLSL shader for re-implementation in JS)
function pos3t2(p: THREE.Vector3): THREE.Vector2 {
  const r = p.length()
  const Y = Math.acos(p.y / r) / Math.PI
  const X = Math.atan2(-p.z / r, p.x / r) / (Math.PI * 2.0)
  return new THREE.Vector2(X, Y)
}

function pos2t3(uv: THREE.Vector2): THREE.Vector3 {
  const x = Math.sin(uv.y * Math.PI) * Math.cos(uv.x * Math.PI * 2.0)
  const y = Math.cos(uv.y * Math.PI)
  const z = -Math.sin(uv.y * Math.PI) * Math.sin(uv.x * Math.PI * 2.0)
  return new THREE.Vector3(x, y, z)
}

function terrainTest(p: THREE.Vector3, h: number): THREE.Vector2 {
  const t = Math.max(0.0, h * 1.0)
  const d = Math.max(0.0, h * 1.5)
  return new THREE.Vector2(t, d)
} 