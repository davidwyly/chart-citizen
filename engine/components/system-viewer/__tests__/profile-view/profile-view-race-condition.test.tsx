import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'

describe('Profile View Race Condition', () => {
  it('demonstrates the race condition between camera framing and orbital positioning', async () => {
    // Track the order of operations
    const operationLog: string[] = []
    
    // Mock requestAnimationFrame to run immediately
    const originalRAF = global.requestAnimationFrame
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      operationLog.push('requestAnimationFrame called')
      callback(0)
      return 0
    }
    
    // Simulate camera controller effect
    const runCameraEffect = () => {
      operationLog.push('Camera effect: Start')
      
      // Camera waits one frame
      requestAnimationFrame(() => {
        operationLog.push('Camera effect: After RAF - trying to find moon positions')
        // At this point, camera expects moon positions to be set
      })
    }
    
    // Simulate orbital path parent position effect
    const runOrbitalPathEffect = () => {
      operationLog.push('OrbitalPath effect: Setting parent position')
      // This might run AFTER the camera's requestAnimationFrame
    }
    
    // Simulate React rendering order
    runCameraEffect()
    runOrbitalPathEffect()
    
    // Check the order
    expect(operationLog).toEqual([
      'Camera effect: Start',
      'requestAnimationFrame called',
      'Camera effect: After RAF - trying to find moon positions',
      'OrbitalPath effect: Setting parent position'  // This happens too late!
    ])
    
    // Restore original
    global.requestAnimationFrame = originalRAF
  })

  it('shows how moon positions are incorrect when camera frames too early', () => {
    const scene = new THREE.Scene()
    
    // Earth at 100 units
    const earthGroup = new THREE.Group()
    earthGroup.position.set(100, 0, 0)
    const earth = new THREE.Object3D()
    earthGroup.add(earth)
    scene.add(earthGroup)
    
    // Luna's orbital group - NOT YET positioned at Earth
    const lunaOrbitalGroup = new THREE.Group()
    lunaOrbitalGroup.position.set(0, 0, 0)  // Still at origin
    scene.add(lunaOrbitalGroup)
    
    // Luna at 10 units from its group center
    const lunaInnerGroup = new THREE.Group()
    lunaInnerGroup.position.set(10, 0, 0)
    lunaOrbitalGroup.add(lunaInnerGroup)
    
    const luna = new THREE.Object3D()
    lunaInnerGroup.add(luna)
    
    // Camera calculates positions BEFORE orbital path updates luna's group position
    const earthPos = new THREE.Vector3()
    earth.getWorldPosition(earthPos)
    
    const lunaPos = new THREE.Vector3()
    luna.getWorldPosition(lunaPos)
    
    // Luna appears at wrong position
    expect(earthPos.x).toBe(100)
    expect(lunaPos.x).toBe(10)  // Wrong! Should be 110
    
    // Camera calculates midpoint with wrong luna position
    const midpoint = new THREE.Vector3()
      .addVectors(earthPos, lunaPos)
      .multiplyScalar(0.5)
    
    expect(midpoint.x).toBe(55)  // Wrong midpoint!
    
    // LATER: Orbital path updates luna's group position
    lunaOrbitalGroup.position.copy(earthPos)
    
    // Now luna is at correct position, but camera already framed the wrong spot
    luna.getWorldPosition(lunaPos)
    expect(lunaPos.x).toBe(110)  // Now correct, but too late
  })
})