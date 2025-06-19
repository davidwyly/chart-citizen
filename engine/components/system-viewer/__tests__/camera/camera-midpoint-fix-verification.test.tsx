import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'

describe('Camera Midpoint Fix Verification', () => {
  let mockScene: THREE.Scene
  let mockCamera: THREE.PerspectiveCamera
  let mockControls: any

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
  })

  describe('Corrected Hierarchical Navigation', () => {
    it('should maintain clicked object as focal center when looking for siblings', () => {
      // Create Jupiter system
      const sol = new THREE.Object3D()
      sol.position.set(0, 0, 0)
      sol.userData = { name: 'Sol', type: 'star' }
      mockScene.add(sol)
      
      const jupiter = new THREE.Object3D()
      jupiter.position.set(50, 0, 0)
      jupiter.userData = { 
        name: 'Jupiter', 
        type: 'planet',
        orbit: { parent: 'sol' }
      }
      mockScene.add(jupiter)
      
      const io = new THREE.Object3D()
      io.position.set(52, 0, 0)
      io.userData = { 
        name: 'Io', 
        type: 'moon',
        orbit: { parent: 'jupiter' }
      }
      mockScene.add(io)
      
      const europa = new THREE.Object3D()
      europa.position.set(54, 0, 0)
      europa.userData = { 
        name: 'Europa', 
        type: 'moon',
        orbit: { parent: 'jupiter' }
      }
      mockScene.add(europa)
      
      const ganymede = new THREE.Object3D()
      ganymede.position.set(58, 0, 0) // Outermost
      ganymede.userData = { 
        name: 'Ganymede', 
        type: 'moon',
        orbit: { parent: 'jupiter' }
      }
      mockScene.add(ganymede)
      
      // Test clicking on Io (has no children, should find siblings)
      const focusObject = io
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // Apply the FIXED logic from camera controller
      // First, try to find objects that orbit around Io
      const focusObjectName = focusObject.userData?.name?.toLowerCase()
      const hierarchicalObjects: THREE.Object3D[] = []
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && 
            child.position && 
            child.type !== 'Scene' && 
            !child.type.includes('Camera') &&
            !child.type.includes('Light')) {
          
          const childParent = child.userData?.orbit?.parent || child.userData?.parentId
          const isChildOfFocus = childParent === focusObjectName
          
          if (isChildOfFocus) {
            hierarchicalObjects.push(child)
            const distance = focalCenter.distanceTo(child.position)
            if (distance > maxDistance) {
              maxDistance = distance
              outermostCenter = child.position.clone()
            }
          }
        }
      })
      
      expect(hierarchicalObjects.length).toBe(0) // Io has no children
      
      // Fall back to finding siblings
      const focusParent = focusObject.userData?.orbit?.parent // 'jupiter'
      
      if (focusParent) {
        // Find sibling objects - KEEP IO AS FOCAL CENTER
        mockScene.traverse((child: THREE.Object3D) => {
          if (child !== focusObject && 
              child.position && 
              child.type !== 'Scene' && 
              !child.type.includes('Camera') &&
              !child.type.includes('Light')) {
            
            const childParent = child.userData?.orbit?.parent || child.userData?.parentId
            if (childParent === focusParent) {
              const distance = focalCenter.distanceTo(child.position)
              if (distance > maxDistance) {
                maxDistance = distance
                outermostCenter = child.position.clone()
              }
            }
          }
        })
      }
      
      console.log('Io as focal center:', focalCenter)
      console.log('Outermost sibling from Io:', outermostCenter)
      console.log('Max distance:', maxDistance)
      
      // Verify correct behavior
      expect(focalCenter).toEqual(new THREE.Vector3(52, 0, 0)) // Io position (unchanged!)
      expect(outermostCenter).toEqual(new THREE.Vector3(58, 0, 0)) // Ganymede position
      expect(maxDistance).toBe(6) // Distance from Io to Ganymede
      
      // Calculate midpoint - should be Io-Ganymede midpoint
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      
      console.log('Camera target midpoint (Io-Ganymede):', layoutMidpoint)
      expect(layoutMidpoint).toEqual(new THREE.Vector3(55, 0, 0)) // Io-Ganymede midpoint
    })

    it('should correctly frame Earth and Moon when Earth is clicked', () => {
      // Create Earth system
      const sol = new THREE.Object3D()
      sol.position.set(0, 0, 0)
      sol.userData = { name: 'Sol', type: 'star' }
      mockScene.add(sol)
      
      const earth = new THREE.Object3D()
      earth.position.set(15, 0, 0)
      earth.userData = { 
        name: 'Earth', 
        type: 'planet',
        orbit: { parent: 'sol' }
      }
      mockScene.add(earth)
      
      const moon = new THREE.Object3D()
      moon.position.set(17, 0, 0)
      moon.userData = { 
        name: 'Moon', 
        type: 'moon',
        orbit: { parent: 'earth' }
      }
      mockScene.add(moon)
      
      const mars = new THREE.Object3D()
      mars.position.set(25, 0, 0)
      mars.userData = { 
        name: 'Mars', 
        type: 'planet',
        orbit: { parent: 'sol' }
      }
      mockScene.add(mars)
      
      // Test clicking on Earth (has children)
      const focusObject = earth
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // Find Earth's children
      const focusObjectName = focusObject.userData?.name?.toLowerCase()
      const hierarchicalObjects: THREE.Object3D[] = []
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && 
            child.position && 
            child.type !== 'Scene' && 
            !child.type.includes('Camera') &&
            !child.type.includes('Light')) {
          
          const childParent = child.userData?.orbit?.parent || child.userData?.parentId
          const isChildOfFocus = childParent === focusObjectName
          
          if (isChildOfFocus) {
            hierarchicalObjects.push(child)
            const distance = focalCenter.distanceTo(child.position)
            if (distance > maxDistance) {
              maxDistance = distance
              outermostCenter = child.position.clone()
            }
          }
        }
      })
      
      console.log('Earth children found:', hierarchicalObjects.map(obj => obj.userData?.name))
      
      // Should find Moon as Earth's child
      expect(hierarchicalObjects.length).toBe(1)
      expect(hierarchicalObjects[0].userData?.name).toBe('Moon')
      expect(focalCenter).toEqual(new THREE.Vector3(15, 0, 0)) // Earth position
      expect(outermostCenter).toEqual(new THREE.Vector3(17, 0, 0)) // Moon position
      expect(maxDistance).toBe(2) // Distance from Earth to Moon
      
      // Calculate midpoint - should be Earth-Moon midpoint
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      
      console.log('Camera target midpoint (Earth-Moon):', layoutMidpoint)
      expect(layoutMidpoint).toEqual(new THREE.Vector3(16, 0, 0)) // Earth-Moon midpoint
    })

    it('should handle Moon click correctly with sibling-based framing', () => {
      // Create Earth system with multiple moons
      const sol = new THREE.Object3D()
      sol.position.set(0, 0, 0)
      sol.userData = { name: 'Sol', type: 'star' }
      mockScene.add(sol)
      
      const earth = new THREE.Object3D()
      earth.position.set(15, 0, 0)
      earth.userData = { 
        name: 'Earth', 
        type: 'planet',
        orbit: { parent: 'sol' }
      }
      mockScene.add(earth)
      
      const moon = new THREE.Object3D()
      moon.position.set(17, 0, 0) // 2 units from Earth
      moon.userData = { 
        name: 'Moon', 
        type: 'moon',
        orbit: { parent: 'earth' }
      }
      mockScene.add(moon)
      
      const spaceStation = new THREE.Object3D()
      spaceStation.position.set(19, 0, 0) // 4 units from Earth, 2 from Moon
      spaceStation.userData = { 
        name: 'ISS', 
        type: 'station',
        orbit: { parent: 'earth' }
      }
      mockScene.add(spaceStation)
      
      // Test clicking on Moon (no children, should find ISS as sibling)
      const focusObject = moon
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // First, try to find Moon's children (none)
      const focusObjectName = focusObject.userData?.name?.toLowerCase()
      const hierarchicalObjects: THREE.Object3D[] = []
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject) {
          const childParent = child.userData?.orbit?.parent || child.userData?.parentId
          const isChildOfFocus = childParent === focusObjectName
          if (isChildOfFocus) {
            hierarchicalObjects.push(child)
          }
        }
      })
      
      expect(hierarchicalObjects.length).toBe(0) // Moon has no children
      
      // Find siblings
      const focusParent = focusObject.userData?.orbit?.parent // 'earth'
      
      if (focusParent) {
        mockScene.traverse((child: THREE.Object3D) => {
          if (child !== focusObject && 
              child.position && 
              child.type !== 'Scene' && 
              !child.type.includes('Camera') &&
              !child.type.includes('Light')) {
            
            const childParent = child.userData?.orbit?.parent || child.userData?.parentId
            if (childParent === focusParent) {
              const distance = focalCenter.distanceTo(child.position)
              if (distance > maxDistance) {
                maxDistance = distance
                outermostCenter = child.position.clone()
              }
            }
          }
        })
      }
      
      console.log('Moon focal center:', focalCenter)
      console.log('Outermost sibling from Moon:', outermostCenter)
      console.log('Distance:', maxDistance)
      
      // Should find ISS as outermost sibling from Moon
      expect(focalCenter).toEqual(new THREE.Vector3(17, 0, 0)) // Moon position (focal center)
      expect(outermostCenter).toEqual(new THREE.Vector3(19, 0, 0)) // ISS position
      expect(maxDistance).toBe(2) // Distance from Moon to ISS
      
      // Calculate midpoint - should be Moon-ISS midpoint
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      
      console.log('Camera target midpoint (Moon-ISS):', layoutMidpoint)
      expect(layoutMidpoint).toEqual(new THREE.Vector3(18, 0, 0)) // Moon-ISS midpoint
    })
  })
})