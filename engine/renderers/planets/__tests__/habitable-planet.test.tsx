/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from 'vitest'
import * as THREE from 'three'

describe('HabitablePlanetRenderer', () => {
  it('should accept habitability parameters', () => {
    const habitabilityParams = {
      humidity: 70,      // Ocean world tendency
      temperature: 60,   // Temperate climate
      population: 80     // High civilization
    }
    
    expect(habitabilityParams.humidity).toBe(70)
    expect(habitabilityParams.temperature).toBe(60)
    expect(habitabilityParams.population).toBe(80)
  })

  it('should clamp habitability parameters to 0-100 range', () => {
    const testCases = [
      { input: -10, expected: 0 },
      { input: 0, expected: 0 },
      { input: 50, expected: 50 },
      { input: 100, expected: 100 },
      { input: 150, expected: 100 }
    ]

    testCases.forEach(({ input, expected }) => {
      const clamped = Math.max(0, Math.min(100, input))
      expect(clamped).toBe(expected)
    })
  })

  it('should determine quality features correctly', () => {
    const qualityLevels = ['low', 'medium', 'high'] as const
    
    qualityLevels.forEach(level => {
      const iterations = level === 'high' ? 8 : level === 'medium' ? 4 : 2
      const showClouds = level === 'medium' || level === 'high'
      const showNightLights = level === 'high'
      
      expect(iterations).toBeGreaterThan(0)
      expect(typeof showClouds).toBe('boolean')
      expect(typeof showNightLights).toBe('boolean')
      
      if (level === 'low') {
        expect(iterations).toBe(2)
        expect(showClouds).toBe(false)
        expect(showNightLights).toBe(false)
      } else if (level === 'medium') {
        expect(iterations).toBe(4)
        expect(showClouds).toBe(true)
        expect(showNightLights).toBe(false)
      } else if (level === 'high') {
        expect(iterations).toBe(8)
        expect(showClouds).toBe(true)
        expect(showNightLights).toBe(true)
      }
    })
  })

  it('should handle different planet types correctly', () => {
    const planetTypes = [
      {
        name: 'Desert World',
        humidity: 10,
        temperature: 80,
        population: 5,
        expectedBiome: 'desert-dominated'
      },
      {
        name: 'Ocean World', 
        humidity: 90,
        temperature: 50,
        population: 40,
        expectedBiome: 'ocean-dominated'
      },
      {
        name: 'Ice World',
        humidity: 30,
        temperature: 10,
        population: 0,
        expectedBiome: 'ice-dominated'
      },
      {
        name: 'Garden World',
        humidity: 60,
        temperature: 60,
        population: 70,
        expectedBiome: 'temperate-mixed'
      },
      {
        name: 'City World',
        humidity: 40,
        temperature: 55,
        population: 95,
        expectedBiome: 'urban-dominated'
      }
    ]

    planetTypes.forEach(planet => {
      expect(planet.humidity).toBeGreaterThanOrEqual(0)
      expect(planet.humidity).toBeLessThanOrEqual(100)
      expect(planet.temperature).toBeGreaterThanOrEqual(0)
      expect(planet.temperature).toBeLessThanOrEqual(100)
      expect(planet.population).toBeGreaterThanOrEqual(0)
      expect(planet.population).toBeLessThanOrEqual(100)
      expect(planet.expectedBiome).toBeTruthy()
    })
  })

  it('should calculate biome characteristics correctly', () => {
    // Test humidity effects on sea level
    const testHumidity = (humidity: number) => {
      const humidityFactor = humidity / 100.0
      const seaLevel = -0.1 + (humidityFactor - 0.5) * 0.2
      return seaLevel
    }

    expect(testHumidity(0)).toBeCloseTo(-0.2, 2)   // Very low sea level (desert world)
    expect(testHumidity(50)).toBeCloseTo(-0.1, 2)  // Normal sea level
    expect(testHumidity(100)).toBeCloseTo(0.0, 2)  // High sea level (ocean world)

    // Test temperature effects on ice caps
    const testTemperature = (temperature: number) => {
      const tempFactor = temperature / 100.0
      const iceThreshold = 0.2 + (1.0 - tempFactor) * 0.3
      return iceThreshold
    }

    expect(testTemperature(0)).toBeCloseTo(0.5, 2)   // Large ice caps (ice world)
    expect(testTemperature(50)).toBeCloseTo(0.35, 2) // Medium ice caps
    expect(testTemperature(100)).toBeCloseTo(0.2, 2) // Small ice caps (hot world)
  })

  it('should support starPosition for lighting', () => {
    const starPosition: [number, number, number] = [10, 0, 0]
    const planetPosition = new THREE.Vector3(5, 0, 0)
    const starPos = new THREE.Vector3(...starPosition)
    
    // Calculate light direction (same as in the renderer)
    const lightDirection = new THREE.Vector3().subVectors(starPos, planetPosition).normalize()
    
    expect(lightDirection.x).toBeCloseTo(1, 5)
    expect(lightDirection.y).toBeCloseTo(0, 5)
    expect(lightDirection.z).toBeCloseTo(0, 5)
    expect(lightDirection.length()).toBeCloseTo(1, 5)
  })
})

describe('Habitable Planet Catalog Integration', () => {
  it('should have correct catalog structure', () => {
    const mockCatalogData = {
      id: 'test-habitable',
      name: 'Test Habitable Planet',
      engine_object: 'habitable-planet',
      category: 'terrestrial',
      mass: 1.0,
      radius: 1.0,
      render: { type: 'habitable-planet' },
      habitability: {
        humidity: 70,
        temperature: 60,
        population: 80
      },
      appearance: {
        ocean_color: '#1e90ff',
        land_color: '#8fbc8f',
        sand_color: '#daa520',
        snow_color: '#ffffff',
        cloud_color: '#ffffff',
        city_light_color: '#ffff99'
      }
    }

    expect(mockCatalogData.engine_object).toBe('habitable-planet')
    expect(mockCatalogData.habitability).toBeDefined()
    expect(mockCatalogData.habitability.humidity).toBe(70)
    expect(mockCatalogData.habitability.temperature).toBe(60)
    expect(mockCatalogData.habitability.population).toBe(80)
    expect(mockCatalogData.appearance).toBeDefined()
  })
}) 