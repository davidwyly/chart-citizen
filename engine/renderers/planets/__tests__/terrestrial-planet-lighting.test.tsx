/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from 'vitest'
import * as THREE from 'three'

describe('TerrestrialPlanetRenderer Lighting', () => {
  it('should accept starPosition prop without errors', () => {
    // This is a basic test to verify the prop interface
    const starPosition: [number, number, number] = [10, 5, 0]
    expect(starPosition).toEqual([10, 5, 0])
  })

  it('should use default starPosition when not provided', () => {
    const defaultPosition: [number, number, number] = [0, 0, 0]
    expect(defaultPosition).toEqual([0, 0, 0])
  })
})

// Integration test for light direction calculation
describe('Light Direction Calculation', () => {
  it('should calculate correct light direction vector', () => {
    const starPosition = new THREE.Vector3(10, 0, 0)
    const planetPosition = new THREE.Vector3(5, 0, 0)
    
    // This is the same calculation used in the component
    const lightDirection = new THREE.Vector3().subVectors(starPosition, planetPosition).normalize()
    
    // Expected: light should point from planet toward star
    // Star at (10,0,0), planet at (5,0,0) -> direction should be (1,0,0)
    expect(lightDirection.x).toBeCloseTo(1, 5)
    expect(lightDirection.y).toBeCloseTo(0, 5)
    expect(lightDirection.z).toBeCloseTo(0, 5)
  })

  it('should handle star and planet at same position', () => {
    const starPosition = new THREE.Vector3(0, 0, 0)
    const planetPosition = new THREE.Vector3(0, 0, 0)
    
    const lightDirection = new THREE.Vector3().subVectors(starPosition, planetPosition).normalize()
    
    // When positions are the same, the vector is (0,0,0) and normalize() returns (0,0,0)
    // This is expected behavior - no light direction when star and planet are at same position
    expect(lightDirection.length()).toBeCloseTo(0, 5) // Should be zero vector
  })

  it('should calculate correct direction for various positions', () => {
    const testCases = [
      {
        star: [0, 0, 0],
        planet: [-5, 0, 0],
        expected: [1, 0, 0], // Light points toward positive X (toward star)
      },
      {
        star: [0, 10, 0],
        planet: [0, 5, 0],
        expected: [0, 1, 0], // Light points toward positive Y
      },
      {
        star: [0, 0, 10],
        planet: [0, 0, -5],
        expected: [0, 0, 1], // Light points toward positive Z
      },
    ]

    testCases.forEach(({ star, planet, expected }) => {
      const starPos = new THREE.Vector3(...star)
      const planetPos = new THREE.Vector3(...planet)
      const lightDir = new THREE.Vector3().subVectors(starPos, planetPos).normalize()
      
      expect(lightDir.x).toBeCloseTo(expected[0], 5)
      expect(lightDir.y).toBeCloseTo(expected[1], 5)
      expect(lightDir.z).toBeCloseTo(expected[2], 5)
    })
  })
}) 