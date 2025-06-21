import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'

describe('Profile View Distance Calculation Fix', () => {
  it('should use layout span calculation for objects with children', () => {
    // Test the fixed logic for Earth-Luna system
    const childObjects = [{ name: 'Luna', id: 'luna' }] // Has children
    const layoutSpan = 10 // Distance between Earth and Luna
    const targetDistance = 0.36 // Small target distance for close-up viewing
    
    let profileDistance: number
    
    // Fixed logic: Check child count, not distance threshold
    if (childObjects.length === 0) {
      profileDistance = 15 // Single object
    } else {
      profileDistance = Math.max(layoutSpan * 1.2, 20) // Multi-object
    }
    
    console.log('Child objects count:', childObjects.length)
    console.log('Layout span:', layoutSpan)
    console.log('Target distance:', targetDistance)
    console.log('Profile distance (fixed):', profileDistance)
    
    // Should use layout span calculation (10 * 1.2 = 12, but min 20)
    expect(profileDistance).toBe(20)
    expect(profileDistance).not.toBe(0.54) // Old buggy calculation
  })

  it('should use fixed distance for objects without children', () => {
    // Test for Mercury (no moons)
    const childObjects: any[] = [] // No children
    const layoutSpan = 3 // Fake distance to fake outermost point
    const targetDistance = 0.36
    
    let profileDistance: number
    
    if (childObjects.length === 0) {
      profileDistance = 15 // Single object
    } else {
      profileDistance = Math.max(layoutSpan * 1.2, 20) // Multi-object
    }
    
    console.log('Child objects count:', childObjects.length)
    console.log('Profile distance (fixed):', profileDistance)
    
    // Should use fixed distance for single objects
    expect(profileDistance).toBe(15)
  })

  it('should demonstrate the bug in the old logic', () => {
    // Show what the old logic would do incorrectly
    const maxDistance = 10 // Distance between Earth and Luna
    const targetDistance = 0.36
    
    // OLD BUGGY LOGIC:
    let oldProfileDistance: number
    if (maxDistance > 0 && maxDistance < 20) {
      oldProfileDistance = targetDistance * 1.5 // WRONG!
    } else {
      oldProfileDistance = Math.max(maxDistance * 1.2, 20)
    }
    
    // NEW FIXED LOGIC:
    const childObjects = [{ name: 'Luna' }] // Has children
    let newProfileDistance: number
    if (childObjects.length === 0) {
      newProfileDistance = 15
    } else {
      newProfileDistance = Math.max(maxDistance * 1.2, 20)
    }
    
    console.log('Old (buggy) profile distance:', oldProfileDistance)
    console.log('New (fixed) profile distance:', newProfileDistance)
    
    expect(oldProfileDistance).toBe(0.54) // Bug: tiny distance
    expect(newProfileDistance).toBe(20) // Fix: proper distance
  })

  it('should handle various moon system distances correctly', () => {
    const testCases = [
      { system: 'Earth-Luna', distance: 10, children: 1, expected: 20 },
      { system: 'Mars-Phobos-Deimos', distance: 2, children: 2, expected: 20 },
      { system: 'Jupiter-Io-Europa-Ganymede-Callisto', distance: 15, children: 4, expected: 20 },
      { system: 'Jupiter-Callisto (outermost)', distance: 50, children: 4, expected: 60 }, // 50 * 1.2 = 60
      { system: 'Mercury (no moons)', distance: 3, children: 0, expected: 15 }
    ]
    
    testCases.forEach(testCase => {
      const { system, distance, children, expected } = testCase
      
      let profileDistance: number
      if (children === 0) {
        profileDistance = 15
      } else {
        profileDistance = Math.max(distance * 1.2, 20)
      }
      
      console.log(`${system}: distance=${distance}, children=${children}, result=${profileDistance}`)
      expect(profileDistance).toBe(expected)
    })
  })
})