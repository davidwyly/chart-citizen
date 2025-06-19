/**
 * EMERGENCY: Camera controls completely broken
 * - Objects run away from camera
 * - Can't orbit or zoom
 * 
 * Need to identify what's wrong with the camera follow logic
 */

import { vi, describe, it, expect } from 'vitest'
import * as THREE from 'three'

describe('Camera Controls Emergency Diagnosis', () => {
  it('should identify why objects run away from camera', () => {
    // Simulate the current broken implementation
    const camera = new THREE.Vector3(0, 0, 10)
    const target = new THREE.Vector3(0, 0, 0)
    let lastObjectPosition = new THREE.Vector3(0, 0, 0)
    
    // Object starts at origin
    const objectPosition1 = new THREE.Vector3(0, 0, 0)
    lastObjectPosition.copy(objectPosition1)
    
    console.log('🔍 Frame 1:')
    console.log(`  Object at: (${objectPosition1.x}, ${objectPosition1.y}, ${objectPosition1.z})`)
    console.log(`  Camera at: (${camera.x}, ${camera.y}, ${camera.z})`)
    console.log(`  Last recorded: (${lastObjectPosition.x}, ${lastObjectPosition.y}, ${lastObjectPosition.z})`)
    
    // Object moves slightly (orbital motion)
    const objectPosition2 = new THREE.Vector3(0.05, 0, 0)
    
    // Current broken implementation logic
    const deltaPosition = new THREE.Vector3().subVectors(objectPosition2, lastObjectPosition)
    console.log(`  Delta: (${deltaPosition.x}, ${deltaPosition.y}, ${deltaPosition.z})`)
    console.log(`  Delta length: ${deltaPosition.length()}`)
    
    if (deltaPosition.length() > 0.001) {
      const isSignificantMovement = deltaPosition.length() > 0.1
      console.log(`  Is significant movement: ${isSignificantMovement}`)
      
      if (isSignificantMovement) {
        camera.add(deltaPosition)
        target.add(deltaPosition)
      } else {
        const smoothedDelta = deltaPosition.multiplyScalar(0.8)
        console.log(`  Smoothed delta: (${smoothedDelta.x}, ${smoothedDelta.y}, ${smoothedDelta.z})`)
        camera.add(smoothedDelta)
        target.add(smoothedDelta)
      }
      
      // THIS IS THE PROBLEM: We update lastObjectPosition to current position
      lastObjectPosition.copy(objectPosition2)
    }
    
    console.log('🔍 Frame 2 Result:')
    console.log(`  Object at: (${objectPosition2.x}, ${objectPosition2.y}, ${objectPosition2.z})`)
    console.log(`  Camera at: (${camera.x}, ${camera.y}, ${camera.z})`)
    console.log(`  Last recorded: (${lastObjectPosition.x}, ${lastObjectPosition.y}, ${lastObjectPosition.z})`)
    
    // Next frame - object continues moving
    const objectPosition3 = new THREE.Vector3(0.1, 0, 0)
    const deltaPosition2 = new THREE.Vector3().subVectors(objectPosition3, lastObjectPosition)
    
    console.log('🔍 Frame 3:')
    console.log(`  Object at: (${objectPosition3.x}, ${objectPosition3.y}, ${objectPosition3.z})`)
    console.log(`  New delta: (${deltaPosition2.x}, ${deltaPosition2.y}, ${deltaPosition2.z})`)
    console.log(`  Delta length: ${deltaPosition2.length()}`)
    
    // The issue: Each frame we're adding the delta to the camera
    // But we're also updating lastObjectPosition, so next frame's delta is smaller
    // This creates a lag where camera never catches up
    
    expect(true).toBe(true) // Just for logging
  })

  it('should show the fundamental tracking problem', () => {
    // Demonstrate the core issue
    console.log('🚨 FUNDAMENTAL PROBLEM:')
    console.log('1. Object moves from A to B')
    console.log('2. Camera moves by (B - A) delta')
    console.log('3. We update lastPosition = B')
    console.log('4. Object moves to C')
    console.log('5. Camera moves by (C - B) delta')
    console.log('6. But camera should be at B, not at A + (B-A)')
    console.log('')
    console.log('RESULT: Camera accumulates deltas but starts from wrong position')
    console.log('RESULT: Object appears to "run away" from camera')
    
    expect(true).toBe(true)
  })
})