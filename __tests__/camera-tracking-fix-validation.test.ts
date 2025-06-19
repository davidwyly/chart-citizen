/**
 * Validation tests for camera tracking fix
 * 
 * GOAL: Ensure camera tracks objects properly while preventing jitter
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'

class FixedCameraTracker {
  public camera = new THREE.Vector3(0, 0, 10)
  public target = new THREE.Vector3(0, 0, 0)
  public lastObjectPosition = new THREE.Vector3(0, 0, 0)
  public updateCallCount = 0
  
  // FIXED IMPLEMENTATION
  fixedImplementation(objectPosition: THREE.Vector3, frameTime: number = 50) {
    const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)

    // Use higher threshold to prevent micro-jitter from orbital motion
    if (deltaPosition.length() > 0.001) {
      // FIXED: For significant movements (object selection), move directly for immediate response
      // For small movements (orbital motion), use light smoothing
      const isSignificantMovement = deltaPosition.length() > 0.1
      
      if (isSignificantMovement) {
        // Large movement (like selecting new object): move directly for immediate response
        this.camera.add(deltaPosition)
        this.target.add(deltaPosition)
      } else {
        // Small movement (orbital motion): light smoothing to reduce jitter
        const smoothedDelta = deltaPosition.multiplyScalar(0.8) // 80% of movement
        this.camera.add(smoothedDelta)
        this.target.add(smoothedDelta)
      }

      // CRITICAL FIX: Only update controls occasionally to prevent jitter
      // But always update for significant movements
      if (isSignificantMovement || Math.floor(frameTime / 50) % 3 === 0) {
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

describe('Camera Tracking Fix Validation', () => {
  let tracker: FixedCameraTracker
  
  beforeEach(() => {
    tracker = new FixedCameraTracker()
  })

  describe('Object Selection Tracking (Must Work Immediately)', () => {
    it('should track large movements immediately (object selection)', () => {
      const initialCameraPos = tracker.camera.clone()
      tracker.lastObjectPosition.set(0, 0, 0)
      
      // Large movement (user selects distant object)
      const newObjectPos = new THREE.Vector3(10, 5, 0)
      tracker.fixedImplementation(newObjectPos, 0)
      
      const cameraMovement = tracker.camera.distanceTo(initialCameraPos)
      const expectedMovement = newObjectPos.length()
      
      console.log('✅ Object Selection Test:')
      console.log(`  Object moved: ${expectedMovement} units`)
      console.log(`  Camera moved: ${cameraMovement} units`)
      console.log(`  Tracking ratio: ${(cameraMovement / expectedMovement * 100).toFixed(1)}%`)
      
      // CRITICAL: Camera must move nearly 1:1 with object for large movements
      expect(cameraMovement).toBeGreaterThan(expectedMovement * 0.9) // At least 90% tracking
      expect(tracker.updateCallCount).toBe(1) // Should update controls immediately
    })

    it('should handle multiple large movements correctly', () => {
      const movements = [
        new THREE.Vector3(5, 0, 0),
        new THREE.Vector3(0, 5, 0), 
        new THREE.Vector3(-3, -2, 0)
      ]
      
      const initialCameraPos = tracker.camera.clone()
      let totalExpectedMovement = 0
      
      movements.forEach((movement, i) => {
        tracker.fixedImplementation(movement, i * 50)
        totalExpectedMovement += movement.distanceTo(tracker.lastObjectPosition)
      })
      
      const actualCameraMovement = tracker.camera.distanceTo(initialCameraPos)
      
      console.log('✅ Multiple Selection Test:')
      console.log(`  Total expected: ${totalExpectedMovement.toFixed(2)} units`)
      console.log(`  Camera moved: ${actualCameraMovement.toFixed(2)} units`)
      
      // Should track large movements well
      expect(actualCameraMovement).toBeGreaterThan(8.0) // Should move significantly
    })
  })

  describe('Orbital Motion Smoothing (Reduce Jitter)', () => {
    it('should smooth small orbital movements to reduce jitter', () => {
      tracker.lastObjectPosition.set(0, 0, 0)
      
      // Small movements (orbital motion)
      const smallMovements = [
        new THREE.Vector3(0.05, 0, 0),
        new THREE.Vector3(0.05, 0.01, 0),
        new THREE.Vector3(0.05, 0.02, 0)
      ]
      
      let totalInputMovement = 0
      let totalCameraMovement = 0
      let updateCount = 0
      
      smallMovements.forEach((movement, i) => {
        const prevCamera = tracker.camera.clone()
        const prevUpdateCount = tracker.updateCallCount
        
        tracker.fixedImplementation(movement, i * 50)
        
        totalInputMovement += movement.distanceTo(tracker.lastObjectPosition)
        totalCameraMovement += tracker.camera.distanceTo(prevCamera)
        
        if (tracker.updateCallCount > prevUpdateCount) {
          updateCount++
        }
      })
      
      console.log('✅ Orbital Smoothing Test:')
      console.log(`  Input movement: ${totalInputMovement.toFixed(4)} units`)
      console.log(`  Camera movement: ${totalCameraMovement.toFixed(4)} units`)
      console.log(`  Smoothing factor: ${(totalCameraMovement / totalInputMovement * 100).toFixed(1)}%`)
      console.log(`  Controls updates: ${updateCount}/${smallMovements.length}`)
      
      // Should smooth small movements (not 1:1)
      expect(totalCameraMovement).toBeLessThan(totalInputMovement) // Smoothed
      expect(totalCameraMovement).toBeGreaterThan(totalInputMovement * 0.5) // But still tracks
      expect(updateCount).toBeLessThan(smallMovements.length) // Fewer control updates
    })

    it('should handle continuous orbital motion without excessive updates', () => {
      tracker.lastObjectPosition.set(5, 0, 0) // Start at orbital position
      let angle = 0
      const radius = 5
      
      let controlsUpdates = 0
      
      // Simulate 60 frames of orbital motion
      for (let frame = 0; frame < 60; frame++) {
        angle += 0.01 // Small orbital increment
        const orbitalPos = new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        )
        
        const prevUpdateCount = tracker.updateCallCount
        tracker.fixedImplementation(orbitalPos, frame * 50)
        
        if (tracker.updateCallCount > prevUpdateCount) {
          controlsUpdates++
        }
      }
      
      console.log('✅ Continuous Orbital Test:')
      console.log(`  Frames simulated: 60`)
      console.log(`  Controls updates: ${controlsUpdates}`)
      console.log(`  Update frequency: ${(controlsUpdates / 60 * 100).toFixed(1)}%`)
      
      // Should reduce update frequency for jitter prevention
      expect(controlsUpdates).toBeLessThan(30) // Less than 50% of frames
      expect(controlsUpdates).toBeGreaterThan(10) // But still update regularly
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero movement correctly', () => {
      const initialCameraPos = tracker.camera.clone()
      const stationaryPos = new THREE.Vector3(0, 0, 0)
      
      tracker.fixedImplementation(stationaryPos, 0)
      
      const cameraMovement = tracker.camera.distanceTo(initialCameraPos)
      
      // No movement should result in no camera change
      expect(cameraMovement).toBeLessThan(0.001)
      expect(tracker.updateCallCount).toBe(0)
    })

    it('should handle threshold boundary movements', () => {
      tracker.lastObjectPosition.set(0, 0, 0)
      
      // Movement just below threshold
      const belowThreshold = new THREE.Vector3(0.0005, 0, 0)
      tracker.fixedImplementation(belowThreshold, 0)
      const belowResult = tracker.camera.distanceTo(new THREE.Vector3(0, 0, 10))
      
      tracker.reset()
      tracker.lastObjectPosition.set(0, 0, 0)
      
      // Movement just above threshold
      const aboveThreshold = new THREE.Vector3(0.002, 0, 0)
      tracker.fixedImplementation(aboveThreshold, 0)
      const aboveResult = tracker.camera.distanceTo(new THREE.Vector3(0, 0, 10))
      
      console.log('✅ Threshold Boundary Test:')
      console.log(`  Below threshold (0.0005): ${belowResult}`)
      console.log(`  Above threshold (0.002): ${aboveResult}`)
      
      // Below threshold should be ignored, above should track
      expect(belowResult).toBeLessThan(0.001)
      expect(aboveResult).toBeGreaterThan(0.001)
    })
  })
})