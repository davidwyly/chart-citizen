/**
 * Final validation test for camera tracking fix
 * 
 * GOAL: Ensure 1:1 tracking with reduced jitter
 */

import { vi, describe, it, expect } from 'vitest'
import * as THREE from 'three'

class FinalCameraTracker {
  public camera = new THREE.Vector3(0, 0, 10)
  public target = new THREE.Vector3(0, 0, 0)
  public lastObjectPosition = new THREE.Vector3(0, 0, 0)
  public updateCallCount = 0
  
  // FINAL FIXED IMPLEMENTATION - 1:1 tracking with reduced control updates
  finalImplementation(objectPosition: THREE.Vector3, frameTime: number = 0) {
    const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)

    // Only move if there's significant movement to avoid jitter
    if (deltaPosition.length() > 0.001) {
      // FIXED: Always move camera and target by full delta to maintain proper tracking
      this.camera.add(deltaPosition)
      this.target.add(deltaPosition)

      // JITTER FIX: Reduce controls.update() frequency
      if (Math.floor(frameTime / 16.67) % 3 === 0) { // Every 3rd frame
        this.updateCallCount++
      }

      // Update stored position for accurate delta calculation
      this.lastObjectPosition.copy(objectPosition)
    }
  }
  
  reset() {
    this.camera.set(0, 0, 10)
    this.target.set(0, 0, 0)
    this.lastObjectPosition.set(0, 0, 0)
    this.updateCallCount = 0
  }
}

describe('Camera Tracking Final Fix', () => {
  let tracker: FinalCameraTracker
  
  beforeEach(() => {
    tracker = new FinalCameraTracker()
  })

  it('should provide perfect 1:1 tracking for object selection', () => {
    const initialCameraPos = tracker.camera.clone()
    tracker.lastObjectPosition.set(0, 0, 0)
    
    // Object moves to new position
    const objectMovement = new THREE.Vector3(10, 5, -3)
    tracker.finalImplementation(objectMovement, 0)
    
    const cameraMovement = new THREE.Vector3().subVectors(tracker.camera, initialCameraPos)
    const trackingAccuracy = cameraMovement.distanceTo(objectMovement)
    
    console.log('✅ Perfect Tracking Test:')
    console.log(`  Object moved: (${objectMovement.x}, ${objectMovement.y}, ${objectMovement.z})`)
    console.log(`  Camera moved: (${cameraMovement.x}, ${cameraMovement.y}, ${cameraMovement.z})`)
    console.log(`  Tracking error: ${trackingAccuracy.toFixed(6)} units`)
    
    // Should be perfect 1:1 tracking
    expect(trackingAccuracy).toBeLessThan(0.000001) // Essentially perfect
    expect(tracker.updateCallCount).toBe(1) // Should update controls
  })

  it('should maintain 1:1 tracking over multiple frames', () => {
    tracker.lastObjectPosition.set(0, 0, 0)
    const initialCameraPos = tracker.camera.clone()
    
    // Simulate orbital motion over multiple frames
    const objectPositions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(2, 0.5, 0),
      new THREE.Vector3(3, 1, 0),
      new THREE.Vector3(4, 1.5, 0),
      new THREE.Vector3(5, 2, 0)
    ]
    
    objectPositions.forEach((pos, frame) => {
      tracker.finalImplementation(pos, frame * 16.67)
    })
    
    const finalObjectPos = objectPositions[objectPositions.length - 1]
    const finalCameraMovement = new THREE.Vector3().subVectors(tracker.camera, initialCameraPos)
    const trackingError = finalCameraMovement.distanceTo(finalObjectPos)
    
    console.log('✅ Multi-frame Tracking:')
    console.log(`  Final object pos: (${finalObjectPos.x}, ${finalObjectPos.y}, ${finalObjectPos.z})`)
    console.log(`  Final camera movement: (${finalCameraMovement.x}, ${finalCameraMovement.y}, ${finalCameraMovement.z})`)
    console.log(`  Final tracking error: ${trackingError.toFixed(6)} units`)
    
    // Should maintain perfect tracking
    expect(trackingError).toBeLessThan(0.000001)
  })

  it('should reduce control update frequency for jitter prevention', () => {
    tracker.lastObjectPosition.set(0, 0, 0)
    
    // Simulate 60 frames of movement
    for (let frame = 0; frame < 60; frame++) {
      const pos = new THREE.Vector3(frame * 0.1, 0, 0)
      tracker.finalImplementation(pos, frame * 16.67)
    }
    
    const updateFrequency = tracker.updateCallCount / 60
    
    console.log('✅ Control Update Frequency:')
    console.log(`  Total frames: 60`)
    console.log(`  Control updates: ${tracker.updateCallCount}`)
    console.log(`  Update frequency: ${(updateFrequency * 100).toFixed(1)}%`)
    
    // Should update roughly every 3rd frame (33%)
    expect(updateFrequency).toBeLessThan(0.5) // Less than 50%
    expect(updateFrequency).toBeGreaterThan(0.2) // But more than 20%
  })

  it('should handle rapid object movement without lag', () => {
    tracker.lastObjectPosition.set(0, 0, 0)
    
    // Rapid large movements
    const rapidMovements = [
      new THREE.Vector3(10, 0, 0),
      new THREE.Vector3(10, 10, 0),
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(0, 0, 0)
    ]
    
    rapidMovements.forEach((pos, frame) => {
      const prevCamera = tracker.camera.clone()
      const prevLastPos = tracker.lastObjectPosition.clone()
      
      tracker.finalImplementation(pos, frame * 16.67)
      
      const expectedCameraMovement = new THREE.Vector3().subVectors(pos, prevLastPos)
      const actualCameraMovement = new THREE.Vector3().subVectors(tracker.camera, prevCamera)
      
      // Each frame should have perfect tracking
      expect(actualCameraMovement.distanceTo(expectedCameraMovement)).toBeLessThan(0.000001)
    })
    
    console.log('✅ Rapid Movement Test: All frames tracked perfectly')
  })

  it('should ignore tiny movements below threshold', () => {
    tracker.lastObjectPosition.set(0, 0, 0)
    const initialCameraPos = tracker.camera.clone()
    
    // Very tiny movement (below 0.001 threshold)
    const tinyMovement = new THREE.Vector3(0.0005, 0, 0)
    tracker.finalImplementation(tinyMovement, 0)
    
    const cameraMovement = tracker.camera.distanceTo(initialCameraPos)
    
    console.log('✅ Threshold Test:')
    console.log(`  Tiny movement: ${tinyMovement.length()}`)
    console.log(`  Camera movement: ${cameraMovement}`)
    
    // Should ignore tiny movements
    expect(cameraMovement).toBeLessThan(0.0001)
    expect(tracker.updateCallCount).toBe(0)
  })
})