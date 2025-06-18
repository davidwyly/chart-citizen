import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'

describe('Camera Framing Debug - Identifying Issues', () => {
  let mockScene: THREE.Scene
  let focusObject: THREE.Object3D
  let planet1: THREE.Object3D
  let planet2: THREE.Object3D
  let planet3: THREE.Object3D

  beforeEach(() => {
    mockScene = new THREE.Scene()
    
    // Create focus object (star at origin)
    focusObject = new THREE.Object3D()
    focusObject.position.set(0, 0, 0)
    focusObject.userData = { name: 'Sun' }
    mockScene.add(focusObject)
    
    // Create planets at various distances
    planet1 = new THREE.Object3D()
    planet1.position.set(10, 0, 0)
    planet1.userData = { name: 'Mercury' }
    mockScene.add(planet1)
    
    planet2 = new THREE.Object3D()
    planet2.position.set(20, 0, 0)
    planet2.userData = { name: 'Venus' }
    mockScene.add(planet2)
    
    planet3 = new THREE.Object3D()
    planet3.position.set(30, 0, 0)
    planet3.userData = { name: 'Earth' }
    mockScene.add(planet3)
  })

  describe('Issue Detection', () => {
    it('should identify objects being traversed', () => {
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      const foundObjects: { name: string; position: THREE.Vector3; distance: number; type: string }[] = []
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && child.position) {
          const distance = focalCenter.distanceTo(child.position)
          foundObjects.push({
            name: child.userData?.name || child.type || 'unknown',
            position: child.position.clone(),
            distance,
            type: child.type
          })
        }
      })
      
      console.log('Found objects during traverse:', foundObjects)
      
      // Filter out the scene object which might be causing issues
      const validObjects = foundObjects.filter(obj => obj.type !== 'Scene')
      expect(validObjects.length).toBe(3)
      
      // Verify the outermost object
      const maxDistance = Math.max(...validObjects.map(obj => obj.distance))
      const outermostObject = validObjects.find(obj => obj.distance === maxDistance)
      
      expect(maxDistance).toBe(30)
      expect(outermostObject?.name).toBe('Earth')
    })

    it('should test both camera positioning logic paths', () => {
      const focalCenter = new THREE.Vector3(0, 0, 0)
      const viewConfig = {
        cameraConfig: {
          viewingAngles: { defaultElevation: 22.5 }
        }
      }
      
      // Test Path 1: View mode change effect (lines 248-287)
      let outermostCenter1 = focalCenter.clone()
      let maxDistance1 = 0
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && child.position && child.type !== 'Scene') {
          const distance = focalCenter.distanceTo(child.position)
          if (distance > maxDistance1) {
            maxDistance1 = distance
            outermostCenter1 = child.position.clone()
          }
        }
      })
      
      const layoutMidpoint1 = new THREE.Vector3()
      layoutMidpoint1.addVectors(focalCenter, outermostCenter1).multiplyScalar(0.5)
      
      const layoutSpan1 = focalCenter.distanceTo(outermostCenter1)
      const profileDistance1 = Math.max(layoutSpan1 * 1.2, 20)
      const profileAngle1 = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
      
      const cameraPosition1 = new THREE.Vector3(
        layoutMidpoint1.x,
        layoutMidpoint1.y + profileDistance1 * Math.sin(profileAngle1),
        layoutMidpoint1.z + profileDistance1 * Math.cos(profileAngle1)
      )
      
      // Test Path 2: Object focus effect (lines 419-467)
      let outermostCenter2 = focalCenter.clone()
      let maxDistance2 = 0
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && child.position && child.type !== 'Scene') {
          const distance = focalCenter.distanceTo(child.position)
          if (distance > maxDistance2) {
            maxDistance2 = distance
            outermostCenter2 = child.position.clone()
          }
        }
      })
      
      const layoutMidpoint2 = new THREE.Vector3()
      layoutMidpoint2.addVectors(focalCenter, outermostCenter2).multiplyScalar(0.5)
      
      const layoutSpan2 = focalCenter.distanceTo(outermostCenter2)
      const targetDistance = 10 // Simulated target distance
      const profileDistance2 = Math.max(layoutSpan2 * 1.2, targetDistance * 1.5) // Different formula!
      const profileAngle2 = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
      
      const cameraPosition2 = new THREE.Vector3(
        layoutMidpoint2.x,
        layoutMidpoint2.y + profileDistance2 * Math.sin(profileAngle2),
        layoutMidpoint2.z + profileDistance2 * Math.cos(profileAngle2)
      )
      
      // Compare results
      console.log('Path 1 (view mode change):', {
        layoutSpan: layoutSpan1,
        profileDistance: profileDistance1,
        cameraPosition: cameraPosition1,
        target: layoutMidpoint1
      })
      
      console.log('Path 2 (object focus):', {
        layoutSpan: layoutSpan2,
        profileDistance: profileDistance2,
        cameraPosition: cameraPosition2,
        target: layoutMidpoint2
      })
      
      // The issue: Different distance calculation formulas!
      expect(layoutSpan1).toBe(layoutSpan2) // Should be the same
      expect(layoutMidpoint1).toEqual(layoutMidpoint2) // Should be the same
      expect(profileDistance1).not.toBe(profileDistance2) // These are DIFFERENT!
      
      expect(profileDistance1).toBe(36) // 30 * 1.2
      expect(profileDistance2).toBe(36) // max(30 * 1.2, 10 * 1.5) = max(36, 15) = 36
    })

    it('should identify the core issue - two different code paths', () => {
      // The problem is that there are two different places where profile view 
      // camera positioning is implemented:
      
      // 1. useEffect on lines 248-287 (view mode change)
      //    - Uses: Math.max(layoutSpan * 1.2, 20)
      //    - Triggers when: viewMode changes to 'profile' and focusObject exists
      
      // 2. Main focus effect on lines 419-467 (object focus)
      //    - Uses: Math.max(layoutSpan * 1.2, targetDistance * 1.5)
      //    - Triggers when: focusObject changes
      
      // These can produce different results and may conflict with each other!
      
      const path1Formula = (layoutSpan: number) => Math.max(layoutSpan * 1.2, 20)
      const path2Formula = (layoutSpan: number, targetDistance: number) => 
        Math.max(layoutSpan * 1.2, targetDistance * 1.5)
      
      // Test case where they differ
      const testLayoutSpan = 10 // Small layout
      const testTargetDistance = 20 // Larger target distance
      
      const result1 = path1Formula(testLayoutSpan) // max(12, 20) = 20
      const result2 = path2Formula(testLayoutSpan, testTargetDistance) // max(12, 30) = 30
      
      expect(result1).toBe(20)
      expect(result2).toBe(30)
      
      // This difference could explain why the camera framing isn't working consistently!
    })

    it('should test when camera parent traversal fails', () => {
      // Test case: What if controlsRef.current?.object?.parent is null or undefined?
      const focalCenter = new THREE.Vector3(0, 0, 0)
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // Simulate the case where there's no parent to traverse
      const mockControlsParent = null
      
      if (mockControlsParent) {
        // This won't execute
        mockControlsParent.traverse(() => {})
      }
      
      // Result: outermostCenter remains at focalCenter, maxDistance remains 0
      expect(maxDistance).toBe(0)
      expect(outermostCenter).toEqual(focalCenter)
      
      // This would result in a midpoint at the focal center
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      expect(layoutMidpoint).toEqual(focalCenter)
      
      // Camera would be positioned directly above the focal object
      const profileDistance = Math.max(0 * 1.2, 20) // Uses minimum distance
      expect(profileDistance).toBe(20)
    })
  })
})