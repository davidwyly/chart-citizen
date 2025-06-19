import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'

describe('Camera Parent Traversal Issue Investigation', () => {
  let mockScene: THREE.Scene
  let mockCamera: THREE.PerspectiveCamera
  let mockControls: any
  let focusObject: THREE.Object3D

  beforeEach(() => {
    mockScene = new THREE.Scene()
    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    
    // This is key - the camera needs to be a child of the scene
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
    
    // Create other objects
    const planet1 = new THREE.Object3D()
    planet1.position.set(10, 0, 0)
    planet1.userData = { name: 'Mercury' }
    mockScene.add(planet1)
    
    const planet2 = new THREE.Object3D()
    planet2.position.set(20, 0, 0)
    planet2.userData = { name: 'Venus' }
    mockScene.add(planet2)
    
    const planet3 = new THREE.Object3D()
    planet3.position.set(30, 0, 0)
    planet3.userData = { name: 'Earth' }
    mockScene.add(planet3)
  })

  describe('Exact Replication of Camera Controller Logic', () => {
    it('should replicate the exact traversal from camera controller', () => {
      console.log('Camera parent:', mockControls.object.parent?.type)
      console.log('Camera parent children count:', mockControls.object.parent?.children.length)
      
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      const foundObjects: any[] = []
      
      // This is EXACTLY what the camera controller does
      if (mockControls.object?.parent) {
        mockControls.object.parent.traverse((child: THREE.Object3D) => {
          console.log(`Traversing: ${child.type} - ${child.userData?.name || 'unnamed'} at ${child.position.x},${child.position.y},${child.position.z}`)
          
          foundObjects.push({
            type: child.type,
            name: child.userData?.name || 'unnamed',
            position: child.position.clone(),
            isFocusObject: child === focusObject,
            hasPosition: !!child.position
          })
          
          if (child !== focusObject && child.position) {
            const distance = focalCenter.distanceTo(child.position)
            console.log(`  Distance from focus: ${distance}`)
            if (distance > maxDistance) {
              maxDistance = distance
              outermostCenter = child.position.clone()
              console.log(`  New outermost: ${child.userData?.name || child.type} at distance ${distance}`)
            }
          }
        })
      }
      
      console.log('Final maxDistance:', maxDistance)
      console.log('Final outermostCenter:', outermostCenter)
      console.log('All found objects:', foundObjects)
      
      // The issue: The scene itself has position (0,0,0) which matches the focus object
      // So the scene gets filtered out by child !== focusObject, but other objects like camera might not
      
      expect(maxDistance).toBe(30) // Should find Earth
      expect(outermostCenter).toEqual(new THREE.Vector3(30, 0, 0))
    })

    it('should identify what objects are interfering', () => {
      const problematicObjects: any[] = []
      
      if (mockControls.object?.parent) {
        mockControls.object.parent.traverse((child: THREE.Object3D) => {
          // Objects that could interfere with the logic
          if (child !== focusObject && child.position) {
            const distance = focusObject.position.distanceTo(child.position)
            
            if (child.type === 'Scene' || child.type === 'PerspectiveCamera' || child.type === 'Camera') {
              problematicObjects.push({
                type: child.type,
                name: child.userData?.name || 'unnamed',
                position: child.position.clone(),
                distance
              })
            }
          }
        })
      }
      
      console.log('Potentially problematic objects:', problematicObjects)
      
      // The camera object itself might be included in traversal
      const cameraInTraversal = problematicObjects.find(obj => obj.type.includes('Camera'))
      if (cameraInTraversal) {
        console.log('WARNING: Camera is being traversed and could affect outermost object detection')
      }
    })

    it('should test filtering strategy', () => {
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // Test different filtering strategies
      const strategies = {
        original: (child: THREE.Object3D) => child !== focusObject && child.position,
        excludeScene: (child: THREE.Object3D) => child !== focusObject && child.position && child.type !== 'Scene',
        excludeCameraAndScene: (child: THREE.Object3D) => 
          child !== focusObject && 
          child.position && 
          child.type !== 'Scene' && 
          !child.type.includes('Camera'),
        onlyMeshAndObject3D: (child: THREE.Object3D) => 
          child !== focusObject && 
          child.position && 
          (child.type === 'Object3D' || child.type === 'Mesh' || child.type === 'Group')
      }
      
      Object.entries(strategies).forEach(([name, filter]) => {
        let strategyMaxDistance = 0
        let strategyOutermost = focalCenter.clone()
        const strategyObjects: any[] = []
        
        if (mockControls.object?.parent) {
          mockControls.object.parent.traverse((child: THREE.Object3D) => {
            if (filter(child)) {
              strategyObjects.push({
                type: child.type,
                name: child.userData?.name || 'unnamed',
                distance: focalCenter.distanceTo(child.position)
              })
              
              const distance = focalCenter.distanceTo(child.position)
              if (distance > strategyMaxDistance) {
                strategyMaxDistance = distance
                strategyOutermost = child.position.clone()
              }
            }
          })
        }
        
        console.log(`Strategy "${name}":`, {
          maxDistance: strategyMaxDistance,
          objectCount: strategyObjects.length,
          objects: strategyObjects
        })
      })
    })
  })

  describe('Proposed Fix', () => {
    it('should suggest filtering improvement for camera controller', () => {
      // The fix: Instead of just excluding the focus object,
      // we should exclude non-celestial objects too
      
      const improvedFilter = (child: THREE.Object3D, focusObject: THREE.Object3D) => {
        // Exclude the focus object itself
        if (child === focusObject) return false
        
        // Exclude objects without position
        if (!child.position) return false
        
        // Exclude technical objects that shouldn't affect framing
        const excludedTypes = ['Scene', 'PerspectiveCamera', 'Camera', 'OrthographicCamera', 'Light', 'AmbientLight', 'DirectionalLight']
        if (excludedTypes.includes(child.type)) return false
        
        // Only include celestial objects (Object3D, Mesh, Group, etc.)
        return true
      }
      
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let maxDistance = 0
      let outermostCenter = focalCenter.clone()
      const validObjects: any[] = []
      
      if (mockControls.object?.parent) {
        mockControls.object.parent.traverse((child: THREE.Object3D) => {
          if (improvedFilter(child, focusObject)) {
            const distance = focalCenter.distanceTo(child.position)
            validObjects.push({
              type: child.type,
              name: child.userData?.name || 'unnamed',
              distance
            })
            
            if (distance > maxDistance) {
              maxDistance = distance
              outermostCenter = child.position.clone()
            }
          }
        })
      }
      
      console.log('Improved filtering results:', {
        maxDistance,
        outermostCenter,
        validObjects
      })
      
      expect(maxDistance).toBe(30)
      expect(outermostCenter).toEqual(new THREE.Vector3(30, 0, 0))
      expect(validObjects.length).toBe(3) // Only the 3 planets
    })
  })
})