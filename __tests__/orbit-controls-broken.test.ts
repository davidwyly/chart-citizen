/**
 * ISSUE: Orbit controls no longer work when an object is selected
 * 
 * Expected behavior:
 * - User can orbit around selected object
 * - User can zoom in/out from selected object
 * - Camera maintains proper target focus
 * 
 * Current behavior:
 * - Orbit controls are disabled/broken
 * - Camera doesn't respond to mouse/trackpad input
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'

// Mock OrbitControls behavior
class MockOrbitControls {
  public enabled = true
  public enablePan = true
  public enableZoom = true
  public enableRotate = true
  public target = new THREE.Vector3(0, 0, 0)
  public object = new THREE.PerspectiveCamera()
  public updateCallCount = 0
  public lastUpdateTime = 0
  
  update() {
    this.updateCallCount++
    this.lastUpdateTime = performance.now()
  }
  
  reset() {
    this.enabled = true
    this.enablePan = true
    this.enableZoom = true
    this.enableRotate = true
    this.updateCallCount = 0
    this.lastUpdateTime = 0
  }
}

class OrbitControlsTracker {
  public camera = new THREE.Vector3(0, 0, 10)
  public controls = new MockOrbitControls()
  public target = new THREE.Vector3(0, 0, 0)
  public lastObjectPosition = new THREE.Vector3(0, 0, 0)
  public isFollowing = false
  public animating = false
  
  // Current implementation that's broken
  currentImplementation(objectPosition: THREE.Vector3, frameTime: number = 0) {
    const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)

    if (deltaPosition.length() > 0.001 && this.isFollowing && !this.animating) {
      // Move camera and target by delta
      this.camera.add(deltaPosition)
      this.target.add(deltaPosition)
      this.controls.target.add(deltaPosition)
      
      // POTENTIAL ISSUE: Reducing control updates might break orbit functionality
      if (Math.floor(frameTime / 16.67) % 3 === 0) {
        this.controls.update()
      }
      
      this.lastObjectPosition.copy(objectPosition)
    }
  }
  
  // Test orbit functionality
  simulateOrbit(rotationX: number, rotationY: number, zoom: number) {
    if (!this.controls.enabled || !this.controls.enableRotate) {
      return false
    }
    
    // Simulate orbit rotation around target
    const spherical = new THREE.Spherical()
    const offset = new THREE.Vector3().subVectors(this.camera, this.target)
    spherical.setFromVector3(offset)
    
    spherical.theta += rotationX
    spherical.phi += rotationY
    spherical.radius *= zoom
    
    offset.setFromSpherical(spherical)
    this.camera.copy(this.target).add(offset)
    
    this.controls.update()
    return true
  }
  
  reset() {
    this.camera.set(0, 0, 10)
    this.target.set(0, 0, 0)
    this.lastObjectPosition.set(0, 0, 0)
    this.isFollowing = false
    this.animating = false
    this.controls.reset()
  }
}

describe('Orbit Controls Functionality Tests', () => {
  let tracker: OrbitControlsTracker
  
  beforeEach(() => {
    tracker = new OrbitControlsTracker()
  })

  describe('Basic Orbit Controls', () => {
    it('should allow orbiting when no object is selected', () => {
      tracker.isFollowing = false
      
      const initialCameraPos = tracker.camera.clone()
      const orbitSuccess = tracker.simulateOrbit(0.1, 0.1, 1.0)
      
      console.log('✅ No Selection Orbit Test:')
      console.log(`  Orbit attempt successful: ${orbitSuccess}`)
      console.log(`  Camera moved: ${tracker.camera.distanceTo(initialCameraPos) > 0.1}`)
      console.log(`  Controls enabled: ${tracker.controls.enabled}`)
      
      expect(orbitSuccess).toBe(true)
      expect(tracker.camera.distanceTo(initialCameraPos)).toBeGreaterThan(0.1)
      expect(tracker.controls.updateCallCount).toBeGreaterThan(0)
    })

    it('should allow orbiting when object is selected (CRITICAL TEST)', () => {
      // Select an object
      tracker.isFollowing = true
      tracker.lastObjectPosition.set(5, 0, 0)
      
      // Simulate object tracking for a few frames
      const objectPositions = [
        new THREE.Vector3(5.01, 0, 0),
        new THREE.Vector3(5.02, 0, 0)
      ]
      
      objectPositions.forEach((pos, frame) => {
        tracker.currentImplementation(pos, frame * 16.67)
      })
      
      // Now try to orbit around the selected object
      const initialCameraPos = tracker.camera.clone()
      const orbitSuccess = tracker.simulateOrbit(0.2, 0.1, 1.0)
      
      console.log('🚨 CRITICAL - Selected Object Orbit Test:')
      console.log(`  Object is being followed: ${tracker.isFollowing}`)
      console.log(`  Controls enabled: ${tracker.controls.enabled}`)
      console.log(`  Can rotate: ${tracker.controls.enableRotate}`)
      console.log(`  Orbit attempt successful: ${orbitSuccess}`)
      console.log(`  Camera moved for orbit: ${tracker.camera.distanceTo(initialCameraPos) > 0.1}`)
      console.log(`  Controls update count: ${tracker.controls.updateCallCount}`)
      
      // CRITICAL: Orbit controls MUST work when object is selected
      expect(orbitSuccess).toBe(true)
      expect(tracker.camera.distanceTo(initialCameraPos)).toBeGreaterThan(0.1)
    })

    it('should allow zooming when object is selected', () => {
      tracker.isFollowing = true
      tracker.lastObjectPosition.set(3, 0, 0)
      
      const initialDistance = tracker.camera.distanceTo(tracker.target)
      
      // Test zoom in
      const zoomInSuccess = tracker.simulateOrbit(0, 0, 0.8)
      const zoomedInDistance = tracker.camera.distanceTo(tracker.target)
      
      // Test zoom out
      const zoomOutSuccess = tracker.simulateOrbit(0, 0, 1.5)
      const zoomedOutDistance = tracker.camera.distanceTo(tracker.target)
      
      console.log('✅ Zoom Test with Selected Object:')
      console.log(`  Initial distance: ${initialDistance.toFixed(2)}`)
      console.log(`  Zoom in success: ${zoomInSuccess}, distance: ${zoomedInDistance.toFixed(2)}`)
      console.log(`  Zoom out success: ${zoomOutSuccess}, distance: ${zoomedOutDistance.toFixed(2)}`)
      
      expect(zoomInSuccess).toBe(true)
      expect(zoomOutSuccess).toBe(true)
      expect(zoomedInDistance).toBeLessThan(initialDistance)
      expect(zoomedOutDistance).toBeGreaterThan(zoomedInDistance)
    })
  })

  describe('Control Update Frequency Issues', () => {
    it('should identify if reduced update frequency breaks controls', () => {
      tracker.isFollowing = true
      
      // Simulate continuous object movement with reduced control updates
      let successfulOrbits = 0
      let totalAttempts = 10
      
      for (let i = 0; i < totalAttempts; i++) {
        // Move object slightly
        const objectPos = new THREE.Vector3(0.01 * i, 0, 0)
        tracker.currentImplementation(objectPos, i * 16.67)
        
        // Try to orbit
        if (tracker.simulateOrbit(0.05, 0.05, 1.0)) {
          successfulOrbits++
        }
      }
      
      const successRate = (successfulOrbits / totalAttempts) * 100
      
      console.log('🔍 Control Update Frequency Analysis:')
      console.log(`  Total orbit attempts: ${totalAttempts}`)
      console.log(`  Successful orbits: ${successfulOrbits}`)
      console.log(`  Success rate: ${successRate.toFixed(1)}%`)
      console.log(`  Control updates during test: ${tracker.controls.updateCallCount}`)
      
      // Controls should work consistently
      expect(successRate).toBeGreaterThan(80) // At least 80% success rate
      expect(tracker.controls.updateCallCount).toBeGreaterThan(0)
    })

    it('should test if controls become unresponsive during tracking', () => {
      tracker.isFollowing = true
      tracker.animating = false
      
      // Simulate fast orbital motion
      let controlsResponsive = true
      const testFrames = 30
      
      for (let frame = 0; frame < testFrames; frame++) {
        // Object in orbital motion
        const angle = frame * 0.1
        const objectPos = new THREE.Vector3(
          Math.cos(angle) * 5,
          0,
          Math.sin(angle) * 5
        )
        
        const prevUpdateCount = tracker.controls.updateCallCount
        tracker.currentImplementation(objectPos, frame * 16.67)
        
        // Check if controls are still responsive
        if (frame % 5 === 0) { // Every 5th frame, try to orbit
          const canOrbit = tracker.simulateOrbit(0.1, 0, 1.0)
          if (!canOrbit) {
            controlsResponsive = false
            console.log(`❌ Controls became unresponsive at frame ${frame}`)
            break
          }
        }
      }
      
      console.log('✅ Controls Responsiveness Test:')
      console.log(`  Frames tested: ${testFrames}`)
      console.log(`  Controls remained responsive: ${controlsResponsive}`)
      console.log(`  Final update count: ${tracker.controls.updateCallCount}`)
      
      expect(controlsResponsive).toBe(true)
    })
  })

  describe('Control State Verification', () => {
    it('should verify controls are properly enabled during object tracking', () => {
      tracker.isFollowing = true
      
      // Move object to trigger tracking
      tracker.currentImplementation(new THREE.Vector3(1, 0, 0), 0)
      
      console.log('🔧 Control State Analysis:')
      console.log(`  Controls enabled: ${tracker.controls.enabled}`)
      console.log(`  Pan enabled: ${tracker.controls.enablePan}`)
      console.log(`  Zoom enabled: ${tracker.controls.enableZoom}`)
      console.log(`  Rotate enabled: ${tracker.controls.enableRotate}`)
      console.log(`  Target position: (${tracker.controls.target.x}, ${tracker.controls.target.y}, ${tracker.controls.target.z})`)
      
      // All controls should be enabled
      expect(tracker.controls.enabled).toBe(true)
      expect(tracker.controls.enableRotate).toBe(true)
      expect(tracker.controls.enableZoom).toBe(true)
    })

    it('should verify target tracking during orbit operations', () => {
      tracker.isFollowing = true
      const objectPos = new THREE.Vector3(10, 5, 0)
      
      // Track object
      tracker.currentImplementation(objectPos, 0)
      const trackedTarget = tracker.controls.target.clone()
      
      // Perform orbit
      tracker.simulateOrbit(0.5, 0.2, 1.0)
      const targetAfterOrbit = tracker.controls.target.clone()
      
      console.log('🎯 Target Tracking During Orbit:')
      console.log(`  Object position: (${objectPos.x}, ${objectPos.y}, ${objectPos.z})`)
      console.log(`  Target before orbit: (${trackedTarget.x}, ${trackedTarget.y}, ${trackedTarget.z})`)
      console.log(`  Target after orbit: (${targetAfterOrbit.x}, ${targetAfterOrbit.y}, ${targetAfterOrbit.z})`)
      console.log(`  Target maintained: ${trackedTarget.distanceTo(targetAfterOrbit) < 0.1}`)
      
      // Target should remain consistent during orbit
      expect(trackedTarget.distanceTo(targetAfterOrbit)).toBeLessThan(0.1)
    })
  })
})