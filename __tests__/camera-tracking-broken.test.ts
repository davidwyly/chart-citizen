/**
 * Emergency tests to identify why camera tracking is broken
 * 
 * ISSUE: Camera no longer follows selected objects after jitter fix
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'

// Simulate the camera following logic from unified-camera-controller.tsx
class CameraTrackingTester {
  public camera = new THREE.Vector3(0, 0, 10)
  public target = new THREE.Vector3(0, 0, 0)
  public lastObjectPosition = new THREE.Vector3(0, 0, 0)
  public updateCallCount = 0
  public followingActive = true
  public animating = false
  
  // CURRENT BROKEN IMPLEMENTATION (after jitter fix)
  currentImplementation(objectPosition: THREE.Vector3, deltaTime: number = 0.016, frameCount: number = 0) {
    const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)

    // Use higher threshold to prevent micro-jitter from orbital motion
    // Normal orbital motion creates ~0.05 unit deltas per frame
    if (deltaPosition.length() > 0.01) {
      // Smooth interpolation instead of direct position copying
      // This prevents jitter from sudden movements
      const lerpFactor = Math.min(deltaTime * 8, 1.0) // 8 = smoothing speed
      
      const targetCameraPos = this.camera.clone().add(deltaPosition)
      const targetControlsPos = this.target.clone().add(deltaPosition)
      
      this.camera.lerp(targetCameraPos, lerpFactor)
      this.target.lerp(targetControlsPos, lerpFactor)

      // CRITICAL FIX: Only update controls occasionally to prevent jitter
      // Use frame counter to limit updates to every N frames
      const frameSkip = 3 // Update controls every 3rd frame instead of every frame
      if (frameCount % frameSkip === 0) {
        this.updateCallCount++
      }

      // Update stored position for accurate delta calculation
      this.lastObjectPosition.copy(objectPosition)
    }
  }
  
  // ORIGINAL WORKING IMPLEMENTATION (before jitter fix)
  originalWorkingImplementation(objectPosition: THREE.Vector3) {
    const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)

    // Only move if there's significant movement to avoid jitter
    if (deltaPosition.length() > 0.001) {
      // Move both camera and target by the same delta
      this.camera.add(deltaPosition)
      this.target.add(deltaPosition)

      // Update controls
      this.updateCallCount++

      // Update stored position
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

describe('Camera Tracking Broken - Emergency Tests', () => {
  let tracker: CameraTrackingTester
  
  beforeEach(() => {
    tracker = new CameraTrackingTester()
  })

  describe('Tracking Functionality Verification', () => {
    it('should track object moving to new position (BASIC TRACKING TEST)', () => {
      const initialCameraPos = tracker.camera.clone()
      const initialObjectPos = new THREE.Vector3(0, 0, 0)
      tracker.lastObjectPosition.copy(initialObjectPos)
      
      // Object moves to new position (like user selecting different object)
      const newObjectPos = new THREE.Vector3(10, 5, 0)
      
      // Test current implementation
      tracker.currentImplementation(newObjectPos, 0.016, 0)
      
      const cameraMovement = tracker.camera.distanceTo(initialCameraPos)
      
      console.log('🔍 Basic Tracking Test:')
      console.log(`  Initial camera: (${initialCameraPos.x}, ${initialCameraPos.y}, ${initialCameraPos.z})`)
      console.log(`  Object moved to: (${newObjectPos.x}, ${newObjectPos.y}, ${newObjectPos.z})`)
      console.log(`  Final camera: (${tracker.camera.x}, ${tracker.camera.y}, ${tracker.camera.z})`)
      console.log(`  Camera movement: ${cameraMovement}`)
      
      // CRITICAL: Camera should move significantly when object moves
      expect(cameraMovement).toBeGreaterThan(1.0) // Should move substantially
    })

    it('should compare current vs original implementation', () => {
      // Test original working implementation
      const tracker1 = new CameraTrackingTester()
      tracker1.lastObjectPosition.set(0, 0, 0)
      const newPos = new THREE.Vector3(10, 0, 0)
      
      tracker1.originalWorkingImplementation(newPos)
      const originalMovement = tracker1.camera.distanceTo(new THREE.Vector3(0, 0, 10))
      
      // Test current broken implementation
      const tracker2 = new CameraTrackingTester()
      tracker2.lastObjectPosition.set(0, 0, 0)
      
      tracker2.currentImplementation(newPos, 0.016, 0)
      const currentMovement = tracker2.camera.distanceTo(new THREE.Vector3(0, 0, 10))
      
      console.log('🔍 Implementation Comparison:')
      console.log(`  Original implementation movement: ${originalMovement}`)
      console.log(`  Current implementation movement: ${currentMovement}`)
      
      // Both should move the camera
      expect(originalMovement).toBeGreaterThan(5.0) // Original should work
      expect(currentMovement).toBeGreaterThan(1.0) // Current should also work
    })

    it('should test multi-frame tracking behavior', () => {
      tracker.lastObjectPosition.set(0, 0, 0)
      const initialCameraPos = tracker.camera.clone()
      
      // Simulate object moving over multiple frames (like orbital motion)
      const positions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(2, 0, 0), 
        new THREE.Vector3(3, 0, 0),
        new THREE.Vector3(4, 0, 0),
        new THREE.Vector3(5, 0, 0)
      ]
      
      positions.forEach((pos, frame) => {
        tracker.currentImplementation(pos, 0.016, frame)
      })
      
      const finalMovement = tracker.camera.distanceTo(initialCameraPos)
      
      console.log('🔍 Multi-frame Tracking:')
      console.log(`  Initial camera: (${initialCameraPos.x}, ${initialCameraPos.y}, ${initialCameraPos.z})`)
      console.log(`  Final camera: (${tracker.camera.x}, ${tracker.camera.y}, ${tracker.camera.z})`)
      console.log(`  Total movement: ${finalMovement}`)
      
      // Camera should follow the object's movement
      expect(finalMovement).toBeGreaterThan(2.0) // Should track object movement
    })

    it('should identify threshold issues', () => {
      tracker.lastObjectPosition.set(0, 0, 0)
      
      // Test movement just below threshold
      const smallMovement = new THREE.Vector3(0.005, 0, 0) // Below 0.01 threshold
      tracker.currentImplementation(smallMovement, 0.016, 0)
      const smallMoveResult = tracker.camera.distanceTo(new THREE.Vector3(0, 0, 10))
      
      tracker.reset()
      tracker.lastObjectPosition.set(0, 0, 0)
      
      // Test movement above threshold  
      const largeMovement = new THREE.Vector3(0.02, 0, 0) // Above 0.01 threshold
      tracker.currentImplementation(largeMovement, 0.016, 0)
      const largeMoveResult = tracker.camera.distanceTo(new THREE.Vector3(0, 0, 10))
      
      console.log('🔍 Threshold Testing:')
      console.log(`  Small movement (0.005): camera moved ${smallMoveResult}`)
      console.log(`  Large movement (0.02): camera moved ${largeMoveResult}`)
      
      // Small movements should be ignored, large movements should work
      expect(smallMoveResult).toBeLessThan(0.01) // Small movement ignored
      expect(largeMoveResult).toBeGreaterThan(0.005) // Large movement tracked
    })

    it('should test lerp factor impact', () => {
      tracker.lastObjectPosition.set(0, 0, 0)
      const targetPos = new THREE.Vector3(10, 0, 0)
      const initialCameraPos = tracker.camera.clone()
      
      // Test single frame with different delta times
      const tracker1 = new CameraTrackingTester()
      tracker1.lastObjectPosition.set(0, 0, 0)
      tracker1.currentImplementation(targetPos, 0.016, 0) // Normal 60fps
      const normalMovement = tracker1.camera.distanceTo(initialCameraPos)
      
      const tracker2 = new CameraTrackingTester()
      tracker2.lastObjectPosition.set(0, 0, 0)
      tracker2.currentImplementation(targetPos, 0.1, 0) // Slow frame
      const slowMovement = tracker2.camera.distanceTo(initialCameraPos)
      
      console.log('🔍 Lerp Factor Testing:')
      console.log(`  Normal frame (0.016s): movement = ${normalMovement}`)
      console.log(`  Slow frame (0.1s): movement = ${slowMovement}`)
      
      // Slower frames should move camera more due to higher lerp factor
      expect(slowMovement).toBeGreaterThan(normalMovement)
    })
  })
})