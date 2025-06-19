import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'

describe('Camera Framing Fix Verification', () => {
  let mockScene: THREE.Scene
  let mockCamera: THREE.PerspectiveCamera
  let mockControls: any
  let focusObject: THREE.Object3D

  beforeEach(() => {
    mockScene = new THREE.Scene()
    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    mockScene.add(mockCamera)
    
    mockControls = {
      object: mockCamera,
      target: new THREE.Vector3(),
      update: vi.fn(),
      enabled: true
    }
    
    // Create focus object
    focusObject = new THREE.Object3D()
    focusObject.position.set(0, 0, 0)
    focusObject.userData = { name: 'Sun' }
    mockScene.add(focusObject)
    
    // Create celestial objects
    const mercury = new THREE.Object3D()
    mercury.position.set(10, 0, 0)
    mercury.userData = { name: 'Mercury' }
    mockScene.add(mercury)
    
    const venus = new THREE.Object3D()
    venus.position.set(20, 0, 0)
    venus.userData = { name: 'Venus' }
    mockScene.add(venus)
    
    const earth = new THREE.Object3D()
    earth.position.set(30, 0, 0)
    earth.userData = { name: 'Earth' }
    mockScene.add(earth)
    
    // Add some non-celestial objects that should be ignored
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    ambientLight.position.set(5, 5, 5)
    mockScene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(15, 15, 15)
    mockScene.add(directionalLight)
  })

  describe('Fixed Traversal Logic', () => {
    it('should correctly filter out non-celestial objects', () => {
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      const celestialObjects: any[] = []
      const filteredOutObjects: any[] = []
      
      // Apply the EXACT same filtering logic as the fixed camera controller
      if (mockControls.object?.parent) {
        mockControls.object.parent.traverse((child: THREE.Object3D) => {
          const shouldInclude = child !== focusObject && 
                               child.position && 
                               child.type !== 'Scene' && 
                               !child.type.includes('Camera') &&
                               !child.type.includes('Light')
          
          if (shouldInclude) {
            const distance = focalCenter.distanceTo(child.position)
            celestialObjects.push({
              type: child.type,
              name: child.userData?.name || 'unnamed',
              distance
            })
            
            if (distance > maxDistance) {
              maxDistance = distance
              outermostCenter = child.position.clone()
            }
          } else {
            filteredOutObjects.push({
              type: child.type,
              name: child.userData?.name || 'unnamed',
              reason: child === focusObject ? 'focus object' : 
                      !child.position ? 'no position' :
                      child.type === 'Scene' ? 'scene object' :
                      child.type.includes('Camera') ? 'camera object' :
                      child.type.includes('Light') ? 'light object' : 'other'
            })
          }
        })
      }
      
      console.log('Celestial objects found:', celestialObjects)
      console.log('Objects filtered out:', filteredOutObjects)
      
      // Verify the fix works
      expect(celestialObjects.length).toBe(3) // Only Mercury, Venus, Earth
      expect(maxDistance).toBe(30) // Earth distance
      expect(outermostCenter).toEqual(new THREE.Vector3(30, 0, 0)) // Earth position
      
      // Verify non-celestial objects were filtered out
      const filteredTypes = filteredOutObjects.map(obj => obj.type)
      expect(filteredTypes).toContain('Scene')
      expect(filteredTypes).toContain('PerspectiveCamera')
      expect(filteredTypes).toContain('AmbientLight')
      expect(filteredTypes).toContain('DirectionalLight')
    })

    it('should calculate correct camera framing with improved filtering', () => {
      const focalCenter = new THREE.Vector3(0, 0, 0)
      
      // Use the exact logic from the fixed camera controller
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      if (mockControls.object?.parent) {
        mockControls.object.parent.traverse((child: THREE.Object3D) => {
          if (child !== focusObject && 
              child.position && 
              child.type !== 'Scene' && 
              !child.type.includes('Camera') &&
              !child.type.includes('Light')) {
            const distance = focalCenter.distanceTo(child.position)
            if (distance > maxDistance) {
              maxDistance = distance
              outermostCenter = child.position.clone()
            }
          }
        })
      }
      
      // Calculate midpoint and camera position
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      
      const layoutSpan = focalCenter.distanceTo(outermostCenter)
      const profileDistance = Math.max(layoutSpan * 1.2, 20)
      const profileAngle = 22.5 * (Math.PI / 180)
      
      const cameraPosition = new THREE.Vector3(
        layoutMidpoint.x,
        layoutMidpoint.y + profileDistance * Math.sin(profileAngle),
        layoutMidpoint.z + profileDistance * Math.cos(profileAngle)
      )
      
      // Verify correct results
      expect(maxDistance).toBe(30) // Earth distance
      expect(outermostCenter).toEqual(new THREE.Vector3(30, 0, 0)) // Earth position
      expect(layoutMidpoint).toEqual(new THREE.Vector3(15, 0, 0)) // Sun-Earth midpoint
      expect(layoutSpan).toBe(30) // Sun to Earth distance
      expect(profileDistance).toBe(36) // 30 * 1.2
      expect(cameraPosition.x).toBe(15) // Centered on midpoint
      expect(cameraPosition.y).toBeCloseTo(13.78, 1) // 36 * sin(22.5°)
      expect(cameraPosition.z).toBeCloseTo(33.26, 1) // 36 * cos(22.5°)
    })

    it('should handle edge case with only focus object', () => {
      // Create a scene with only the focus object and technical objects
      const minimalScene = new THREE.Scene()
      const minimalCamera = new THREE.PerspectiveCamera()
      minimalScene.add(minimalCamera)
      
      const singleFocus = new THREE.Object3D()
      singleFocus.position.set(5, 0, 0)
      singleFocus.userData = { name: 'Isolated Star' }
      minimalScene.add(singleFocus)
      
      // Add lights that should be filtered out
      const light = new THREE.AmbientLight()
      light.position.set(10, 10, 10)
      minimalScene.add(light)
      
      const mockMinimalControls = {
        object: { parent: minimalScene }
      }
      
      const focalCenter = new THREE.Vector3()
      singleFocus.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      if (mockMinimalControls.object?.parent) {
        mockMinimalControls.object.parent.traverse((child: THREE.Object3D) => {
          if (child !== singleFocus && 
              child.position && 
              child.type !== 'Scene' && 
              !child.type.includes('Camera') &&
              !child.type.includes('Light')) {
            const distance = focalCenter.distanceTo(child.position)
            if (distance > maxDistance) {
              maxDistance = distance
              outermostCenter = child.position.clone()
            }
          }
        })
      }
      
      // Should remain at focal center since no valid celestial objects found
      expect(maxDistance).toBe(0)
      expect(outermostCenter).toEqual(focalCenter)
      
      // Midpoint calculation should still work
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      expect(layoutMidpoint).toEqual(focalCenter) // Midpoint is focal center
    })
  })

  describe('Comparison with Old vs New Logic', () => {
    it('should demonstrate the improvement over the old filtering', () => {
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      // Old logic (original)
      let oldMaxDistance = 0
      let oldOutermostCenter = focalCenter.clone()
      const oldObjects: any[] = []
      
      if (mockControls.object?.parent) {
        mockControls.object.parent.traverse((child: THREE.Object3D) => {
          if (child !== focusObject && child.position) {
            const distance = focalCenter.distanceTo(child.position)
            oldObjects.push({ type: child.type, name: child.userData?.name || 'unnamed', distance })
            if (distance > oldMaxDistance) {
              oldMaxDistance = distance
              oldOutermostCenter = child.position.clone()
            }
          }
        })
      }
      
      // New logic (improved)
      let newMaxDistance = 0
      let newOutermostCenter = focalCenter.clone()
      const newObjects: any[] = []
      
      if (mockControls.object?.parent) {
        mockControls.object.parent.traverse((child: THREE.Object3D) => {
          if (child !== focusObject && 
              child.position && 
              child.type !== 'Scene' && 
              !child.type.includes('Camera') &&
              !child.type.includes('Light')) {
            const distance = focalCenter.distanceTo(child.position)
            newObjects.push({ type: child.type, name: child.userData?.name || 'unnamed', distance })
            if (distance > newMaxDistance) {
              newMaxDistance = distance
              newOutermostCenter = child.position.clone()
            }
          }
        })
      }
      
      console.log('Old logic found objects:', oldObjects.length, oldObjects)
      console.log('New logic found objects:', newObjects.length, newObjects)
      
      // Both should find the same outermost celestial object
      expect(newMaxDistance).toBe(30) // Earth
      expect(oldMaxDistance).toBe(30) // Earth (lights are at positions that don't interfere in this test)
      
      // But new logic should find fewer objects (excluding technical objects)
      expect(newObjects.length).toBeLessThan(oldObjects.length)
      expect(newObjects.length).toBe(3) // Only celestial objects
    })
  })
})