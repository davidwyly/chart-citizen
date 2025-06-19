/**
 * REAL ISSUE: Reduced controls.update() frequency breaks orbit controls
 * 
 * When tracking an object, controls.update() is only called every 3rd frame
 * This prevents orbit controls from responding to user input properly
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'

// Simulate the real OrbitControls behavior
class RealOrbitControls {
  public enabled = true
  public target = new THREE.Vector3(0, 0, 0)
  public object: THREE.Camera
  public updateCallCount = 0
  public lastUserInput = 0
  public userInputPending = false
  
  constructor(camera: THREE.Camera) {
    this.object = camera
  }
  
  // Simulate user input (mouse drag for orbit)
  simulateUserInput() {
    this.userInputPending = true
    this.lastUserInput = performance.now()
  }
  
  update() {
    this.updateCallCount++
    
    // If user input is pending and controls are enabled, process it
    if (this.userInputPending && this.enabled) {
      this.userInputPending = false
      return true // Input was processed
    }
    return false // No input to process
  }
  
  reset() {
    this.enabled = true
    this.updateCallCount = 0
    this.userInputPending = false
    this.lastUserInput = 0
  }
}

class CameraTrackingSystem {
  public camera = new THREE.PerspectiveCamera()
  public controls: RealOrbitControls
  public target = new THREE.Vector3(0, 0, 0)
  public lastObjectPosition = new THREE.Vector3(0, 0, 0)
  public isFollowing = false
  public animating = false
  public frameCount = 0
  
  constructor() {
    this.camera.position.set(0, 0, 10)
    this.controls = new RealOrbitControls(this.camera)
  }
  
  // Current BROKEN implementation - reduced update frequency
  brokenImplementation(objectPosition: THREE.Vector3, userInput: boolean = false) {
    this.frameCount++
    
    if (userInput) {
      this.controls.simulateUserInput()
    }
    
    if (this.isFollowing && !this.animating) {
      const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)
      
      if (deltaPosition.length() > 0.001) {
        // Move camera and target
        this.camera.position.add(deltaPosition)
        this.target.add(deltaPosition)
        this.controls.target.add(deltaPosition)
        
        // PROBLEM: Only update controls every 3rd frame
        if (this.frameCount % 3 === 0) {
          this.controls.update()
        }
        
        this.lastObjectPosition.copy(objectPosition)
      }
    } else {
      // When not following, update controls normally
      this.controls.update()
    }
  }
  
  // FIXED implementation - always update controls when needed
  fixedImplementation(objectPosition: THREE.Vector3, userInput: boolean = false) {
    this.frameCount++
    
    if (userInput) {
      this.controls.simulateUserInput()
    }
    
    if (this.isFollowing && !this.animating) {
      const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)
      
      if (deltaPosition.length() > 0.001) {
        // Move camera and target
        this.camera.position.add(deltaPosition)
        this.target.add(deltaPosition)
        this.controls.target.add(deltaPosition)
        
        // FIXED: Always update controls when user input is pending OR every 3rd frame for tracking
        if (this.controls.userInputPending || this.frameCount % 3 === 0) {
          this.controls.update()
        }
        
        this.lastObjectPosition.copy(objectPosition)
      }
    } else {
      // When not following, update controls normally
      this.controls.update()
    }
  }
  
  reset() {
    this.camera.position.set(0, 0, 10)
    this.target.set(0, 0, 0)
    this.lastObjectPosition.set(0, 0, 0)
    this.isFollowing = false
    this.animating = false
    this.frameCount = 0
    this.controls.reset()
  }
}

describe('Orbit Controls Real Issue', () => {
  let system: CameraTrackingSystem
  
  beforeEach(() => {
    system = new CameraTrackingSystem()
  })

  describe('Broken Implementation - Reduced Update Frequency', () => {
    it('should demonstrate orbit controls not working during object tracking', () => {
      system.isFollowing = true
      system.lastObjectPosition.set(0, 0, 0)
      
      let userInputsProcessed = 0
      let totalFrames = 30
      
      // Simulate tracking with user trying to orbit
      for (let frame = 0; frame < totalFrames; frame++) {
        // Object moves slightly (orbital motion)
        const objectPos = new THREE.Vector3(frame * 0.01, 0, 0)
        
        // User tries to orbit every few frames
        const userTryingToOrbit = frame % 5 === 0
        
        const prevUpdateCount = system.controls.updateCallCount
        system.brokenImplementation(objectPos, userTryingToOrbit)
        
        // Check if user input was processed
        if (userTryingToOrbit && system.controls.updateCallCount > prevUpdateCount) {
          userInputsProcessed++
        }
      }
      
      const userInputAttempts = Math.floor(totalFrames / 5)
      const responseRate = (userInputsProcessed / userInputAttempts) * 100
      
      console.log('🚨 BROKEN - Orbit Controls During Tracking:')
      console.log(`  Total frames: ${totalFrames}`)
      console.log(`  User input attempts: ${userInputAttempts}`)
      console.log(`  Inputs processed: ${userInputsProcessed}`)
      console.log(`  Response rate: ${responseRate.toFixed(1)}%`)
      console.log(`  Total control updates: ${system.controls.updateCallCount}`)
      
      // With broken implementation, user input response rate should be poor
      expect(responseRate).toBeLessThan(70) // Less than 70% responsive
    })
    
    it('should show controls work fine when not tracking', () => {
      system.isFollowing = false
      
      let userInputsProcessed = 0
      let totalFrames = 30
      
      for (let frame = 0; frame < totalFrames; frame++) {
        const userTryingToOrbit = frame % 5 === 0
        
        const prevUpdateCount = system.controls.updateCallCount
        system.brokenImplementation(new THREE.Vector3(0, 0, 0), userTryingToOrbit)
        
        if (userTryingToOrbit && system.controls.updateCallCount > prevUpdateCount) {
          userInputsProcessed++
        }
      }
      
      const userInputAttempts = Math.floor(totalFrames / 5)
      const responseRate = (userInputsProcessed / userInputAttempts) * 100
      
      console.log('✅ NOT TRACKING - Controls Work Fine:')
      console.log(`  User input attempts: ${userInputAttempts}`)
      console.log(`  Inputs processed: ${userInputsProcessed}`)
      console.log(`  Response rate: ${responseRate.toFixed(1)}%`)
      
      // When not tracking, all user inputs should be processed
      expect(responseRate).toBe(100)
    })
  })

  describe('Fixed Implementation - Prioritize User Input', () => {
    it('should process user input immediately even during tracking', () => {
      system.isFollowing = true
      system.lastObjectPosition.set(0, 0, 0)
      
      let userInputsProcessed = 0
      let totalFrames = 30
      
      // Simulate tracking with user trying to orbit
      for (let frame = 0; frame < totalFrames; frame++) {
        // Object moves slightly (orbital motion)
        const objectPos = new THREE.Vector3(frame * 0.01, 0, 0)
        
        // User tries to orbit every few frames
        const userTryingToOrbit = frame % 5 === 0
        
        const prevUpdateCount = system.controls.updateCallCount
        system.fixedImplementation(objectPos, userTryingToOrbit)
        
        // Check if user input was processed
        if (userTryingToOrbit && system.controls.updateCallCount > prevUpdateCount) {
          userInputsProcessed++
        }
      }
      
      const userInputAttempts = Math.floor(totalFrames / 5)
      const responseRate = (userInputsProcessed / userInputAttempts) * 100
      
      console.log('✅ FIXED - Orbit Controls During Tracking:')
      console.log(`  Total frames: ${totalFrames}`)
      console.log(`  User input attempts: ${userInputAttempts}`)
      console.log(`  Inputs processed: ${userInputsProcessed}`)
      console.log(`  Response rate: ${responseRate.toFixed(1)}%`)
      console.log(`  Total control updates: ${system.controls.updateCallCount}`)
      
      // With fixed implementation, user input should be highly responsive
      expect(responseRate).toBeGreaterThan(90) // At least 90% responsive
    })
    
    it('should still reduce unnecessary updates for performance', () => {
      system.isFollowing = true
      system.lastObjectPosition.set(0, 0, 0)
      
      let totalFrames = 60
      let framesWithUpdates = 0
      
      // Simulate tracking without user input (just object movement)
      for (let frame = 0; frame < totalFrames; frame++) {
        const objectPos = new THREE.Vector3(frame * 0.001, 0, 0) // Tiny movements
        
        const prevUpdateCount = system.controls.updateCallCount
        system.fixedImplementation(objectPos, false) // No user input
        
        if (system.controls.updateCallCount > prevUpdateCount) {
          framesWithUpdates++
        }
      }
      
      const updateFrequency = (framesWithUpdates / totalFrames) * 100
      
      console.log('⚡ Performance - Reduced Updates Without User Input:')
      console.log(`  Total frames: ${totalFrames}`)
      console.log(`  Frames with updates: ${framesWithUpdates}`)
      console.log(`  Update frequency: ${updateFrequency.toFixed(1)}%`)
      
      // Should still reduce updates when no user input (performance optimization)
      expect(updateFrequency).toBeLessThan(50) // Less than 50% when no user input
      expect(updateFrequency).toBeGreaterThan(20) // But still update regularly for tracking
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid user input during fast object movement', () => {
      system.isFollowing = true
      system.lastObjectPosition.set(0, 0, 0)
      
      let rapidInputsProcessed = 0
      let totalRapidInputs = 0
      
      // Simulate rapid user input during fast object movement
      for (let frame = 0; frame < 20; frame++) {
        // Fast object movement
        const objectPos = new THREE.Vector3(frame * 0.1, 0, 0)
        
        // User rapidly trying to orbit (every frame)
        const userTryingToOrbit = true
        totalRapidInputs++
        
        const prevUpdateCount = system.controls.updateCallCount
        system.fixedImplementation(objectPos, userTryingToOrbit)
        
        if (system.controls.updateCallCount > prevUpdateCount) {
          rapidInputsProcessed++
        }
      }
      
      const rapidResponseRate = (rapidInputsProcessed / totalRapidInputs) * 100
      
      console.log('⚡ Rapid Input Test:')
      console.log(`  Rapid inputs: ${totalRapidInputs}`)
      console.log(`  Processed: ${rapidInputsProcessed}`)
      console.log(`  Response rate: ${rapidResponseRate.toFixed(1)}%`)
      
      // Should handle rapid input well
      expect(rapidResponseRate).toBeGreaterThan(80)
    })
  })
})