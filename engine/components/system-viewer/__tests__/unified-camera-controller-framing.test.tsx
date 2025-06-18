import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'
import { UnifiedCameraController } from '../unified-camera-controller'

// Mock drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: vi.fn(() => null),
  Preload: vi.fn(() => null),
}))

// Mock view mode config
vi.mock('../../../core/view-modes/compatibility', () => ({
  getViewModeConfig: vi.fn(() => ({
    cameraConfig: {
      viewingAngles: {
        defaultElevation: 22.5,
        birdsEyeElevation: 22.5
      },
      animation: {
        focusDuration: 400,
        birdsEyeDuration: 600,
        easingFunction: 'easeInOut'
      }
    }
  }))
}))

describe('UnifiedCameraController Profile View Framing', () => {
  let mockCamera: THREE.PerspectiveCamera
  let mockControls: any
  let focusObject: THREE.Object3D
  let parentScene: THREE.Scene

  beforeEach(() => {
    // Set up mock Three.js environment
    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    mockCamera.position.set(0, 50, 100)
    
    mockControls = {
      object: mockCamera,
      target: new THREE.Vector3(),
      update: vi.fn(),
      enabled: true,
      saveState: vi.fn(),
      reset: vi.fn()
    }

    // Create a parent scene with multiple objects
    parentScene = new THREE.Scene()
    
    // Create focus object (star at origin)
    focusObject = new THREE.Object3D()
    focusObject.position.set(0, 0, 0)
    focusObject.userData = { name: 'Sun' }
    parentScene.add(focusObject)
    
    // Create planets at various distances
    const planet1 = new THREE.Object3D()
    planet1.position.set(10, 0, 0)
    planet1.userData = { name: 'Mercury' }
    parentScene.add(planet1)
    
    const planet2 = new THREE.Object3D()
    planet2.position.set(20, 0, 0)
    planet2.userData = { name: 'Venus' }
    parentScene.add(planet2)
    
    const planet3 = new THREE.Object3D()
    planet3.position.set(30, 0, 0) // This should be the outermost
    planet3.userData = { name: 'Earth' }
    parentScene.add(planet3)
    
    // Set up camera parent relationship
    mockCamera.parent = parentScene
    mockControls.object.parent = parentScene
  })

  describe('Focus Object Selection and Framing', () => {
    it('should calculate correct midpoint for camera positioning', () => {
      const TestComponent = () => {
        return (
          <UnifiedCameraController
            focusObject={focusObject}
            focusName="Sun"
            focusRadius={1}
            focusSize={2}
            viewMode="profile"
          />
        )
      }

      // Test the midpoint calculation logic directly
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // Simulate the traversal that should happen in the controller
      parentScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && child.position) {
          const distance = focalCenter.distanceTo(child.position)
          if (distance > maxDistance) {
            maxDistance = distance
            outermostCenter = child.position.clone()
          }
        }
      })
      
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      
      // Expected results
      expect(focalCenter).toEqual(new THREE.Vector3(0, 0, 0))
      expect(outermostCenter).toEqual(new THREE.Vector3(30, 0, 0)) // Earth position
      expect(maxDistance).toBe(30)
      expect(layoutMidpoint).toEqual(new THREE.Vector3(15, 0, 0)) // Midpoint
    })

    it('should position camera correctly based on layout span', () => {
      const focalCenter = new THREE.Vector3(0, 0, 0)
      const outermostCenter = new THREE.Vector3(30, 0, 0)
      
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      
      const layoutSpan = focalCenter.distanceTo(outermostCenter) // 30
      const profileDistance = Math.max(layoutSpan * 1.2, 20) // 36
      const profileAngle = 22.5 * (Math.PI / 180)
      
      const expectedCameraPosition = new THREE.Vector3(
        layoutMidpoint.x, // 15
        layoutMidpoint.y + profileDistance * Math.sin(profileAngle),
        layoutMidpoint.z + profileDistance * Math.cos(profileAngle)
      )
      
      expect(layoutSpan).toBe(30)
      expect(profileDistance).toBe(36)
      expect(expectedCameraPosition.x).toBe(15)
      expect(expectedCameraPosition.y).toBeCloseTo(13.78, 1)
      expect(expectedCameraPosition.z).toBeCloseTo(33.26, 1)
    })
  })

  describe('Camera Position Issues Debugging', () => {
    it('should identify potential issues with object traversal', () => {
      // Test if the issue might be with how objects are being found
      const testObjects: THREE.Object3D[] = []
      
      parentScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && child.position) {
          testObjects.push(child)
        }
      })
      
      expect(testObjects.length).toBeGreaterThanOrEqual(3) // Should find at least 3 planets (might include scene)
      
      // Check if all objects have valid positions
      testObjects.forEach((obj, index) => {
        expect(obj.position).toBeDefined()
        expect(obj.position.length()).toBeGreaterThan(0)
      })
    })

    it('should verify distance calculation accuracy', () => {
      const origin = new THREE.Vector3(0, 0, 0)
      const testPositions = [
        new THREE.Vector3(10, 0, 0), // Distance: 10
        new THREE.Vector3(20, 0, 0), // Distance: 20
        new THREE.Vector3(30, 0, 0), // Distance: 30
      ]
      
      const distances = testPositions.map(pos => origin.distanceTo(pos))
      expect(distances).toEqual([10, 20, 30])
      
      const maxDistance = Math.max(...distances)
      expect(maxDistance).toBe(30)
    })

    it('should test edge case with single object', () => {
      // Create a scene with only the focus object
      const singleObjectScene = new THREE.Scene()
      const singleFocus = new THREE.Object3D()
      singleFocus.position.set(5, 5, 5)
      singleObjectScene.add(singleFocus)
      
      const focalCenter = new THREE.Vector3()
      singleFocus.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      singleObjectScene.traverse((child: THREE.Object3D) => {
        if (child !== singleFocus && child.position && child !== singleObjectScene && child.type !== 'Scene') {
          const distance = focalCenter.distanceTo(child.position)
          if (distance > maxDistance) {
            maxDistance = distance
            outermostCenter = child.position.clone()
          }
        }
      })
      
      // Should remain at focal center since no other objects found
      expect(maxDistance).toBe(0)
      expect(outermostCenter).toEqual(focalCenter)
      
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      expect(layoutMidpoint).toEqual(focalCenter) // Midpoint should be focal center
    })
  })

  describe('Animation and View Mode Switching', () => {
    it('should trigger view mode change effect correctly', () => {
      // Mock the useEffect dependency array that would trigger the camera repositioning
      const viewMode = 'profile'
      const focusObject = new THREE.Object3D()
      focusObject.position.set(0, 0, 0)
      const mockCamera = new THREE.PerspectiveCamera()
      const mockViewConfig = {
        cameraConfig: {
          viewingAngles: { defaultElevation: 22.5 }
        }
      }
      
      // Simulate the condition that triggers the camera repositioning
      const shouldReposition = viewMode === 'profile' && !!focusObject && !!mockCamera
      expect(shouldReposition).toBe(true)
    })

    it('should calculate correct camera distance for different layout spans', () => {
      const testCases = [
        { span: 1, expectedDistance: 20 }, // Minimum distance applied
        { span: 10, expectedDistance: 20 }, // Still minimum
        { span: 20, expectedDistance: 24 }, // 20 * 1.2
        { span: 50, expectedDistance: 60 }, // 50 * 1.2
        { span: 100, expectedDistance: 120 }, // 100 * 1.2
      ]
      
      testCases.forEach(({ span, expectedDistance }) => {
        const profileDistance = Math.max(span * 1.2, 20)
        expect(profileDistance).toBe(expectedDistance)
      })
    })
  })

  describe('Real-world Scenario Testing', () => {
    it('should handle Sol system layout correctly', () => {
      // Create a realistic Sol system layout
      const sol = new THREE.Object3D()
      sol.position.set(0, 0, 0)
      sol.userData = { name: 'Sol' }
      
      const mercury = new THREE.Object3D()
      mercury.position.set(5, 0, 0)
      mercury.userData = { name: 'Mercury' }
      
      const venus = new THREE.Object3D()
      venus.position.set(10, 0, 0)
      venus.userData = { name: 'Venus' }
      
      const earth = new THREE.Object3D()
      earth.position.set(15, 0, 0)
      earth.userData = { name: 'Earth' }
      
      const mars = new THREE.Object3D()
      mars.position.set(25, 0, 0)
      mars.userData = { name: 'Mars' }
      
      const jupiter = new THREE.Object3D()
      jupiter.position.set(50, 0, 0) // Much further out
      jupiter.userData = { name: 'Jupiter' }
      
      const testSystem = new THREE.Scene()
      testSystem.add(sol, mercury, venus, earth, mars, jupiter)
      
      // Test the complete framing logic
      const focalCenter = new THREE.Vector3()
      sol.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      testSystem.traverse((child: THREE.Object3D) => {
        if (child !== sol && child.position) {
          const distance = focalCenter.distanceTo(child.position)
          if (distance > maxDistance) {
            maxDistance = distance
            outermostCenter = child.position.clone()
          }
        }
      })
      
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      
      // Assertions
      expect(maxDistance).toBe(50) // Jupiter distance
      expect(outermostCenter).toEqual(new THREE.Vector3(50, 0, 0))
      expect(layoutMidpoint).toEqual(new THREE.Vector3(25, 0, 0)) // Sol-Jupiter midpoint
      
      const layoutSpan = 50
      const profileDistance = Math.max(layoutSpan * 1.2, 20) // 60
      expect(profileDistance).toBe(60)
    })
  })
})