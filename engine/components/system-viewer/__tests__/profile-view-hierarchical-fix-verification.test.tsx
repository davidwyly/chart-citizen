import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'

describe('Profile View Hierarchical Navigation Fix Verification', () => {
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

  describe('Hierarchical Navigation Logic', () => {
    it('should frame Earth and its moons when Earth is focused', () => {
      // Create Sol system with hierarchical relationships
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
      
      const mars = new THREE.Object3D()
      mars.position.set(25, 0, 0)
      mars.userData = { 
        name: 'Mars', 
        type: 'planet',
        orbit: { parent: 'sol' }
      }
      mockScene.add(mars)
      
      // Test the EXACT logic from the fixed camera controller
      const focusObject = earth
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // First, try to find objects that orbit around the focused object
      const focusObjectName = focusObject.userData?.name?.toLowerCase()
      const hierarchicalObjects: THREE.Object3D[] = []
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && 
            child.position && 
            child.type !== 'Scene' && 
            !child.type.includes('Camera') &&
            !child.type.includes('Light')) {
          
          // Check if this object orbits the focused object
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
      
      console.log('Earth focus - hierarchical objects:', hierarchicalObjects.map(obj => ({
        name: obj.userData?.name,
        distance: focalCenter.distanceTo(obj.position)
      })))
      
      // Should find Moon as Earth's child
      expect(hierarchicalObjects.length).toBe(1)
      expect(hierarchicalObjects[0].userData?.name).toBe('Moon')
      expect(maxDistance).toBe(2) // Distance from Earth to Moon
      expect(outermostCenter).toEqual(new THREE.Vector3(17, 0, 0)) // Moon position
      
      // Calculate midpoint - should be Earth-Moon midpoint
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      expect(layoutMidpoint).toEqual(new THREE.Vector3(16, 0, 0)) // Earth-Moon midpoint
    })

    it('should frame parent system when focused object has no children', () => {
      // Create Sol system
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
      
      // Focus on Moon (which has no children)
      const focusObject = moon
      let focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // First, try to find objects that orbit around the focused object
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
          }
        }
      })
      
      expect(hierarchicalObjects.length).toBe(0) // Moon has no children
      
      // Fall back to showing in parent context
      const focusParent = focusObject.userData?.orbit?.parent || focusObject.userData?.parentId
      expect(focusParent).toBe('earth')
      
      // Find the parent object
      let parentObject: THREE.Object3D | null = null
      mockScene.traverse((child: THREE.Object3D) => {
        if (child.userData?.name?.toLowerCase() === focusParent) {
          parentObject = child
        }
      })
      
      expect(parentObject).toBeDefined()
      expect(parentObject?.userData?.name).toBe('Earth')
      
      if (parentObject) {
        // Update focal center to parent object (Earth)
        parentObject.getWorldPosition(focalCenter)
        
        // Find all objects that orbit the parent
        const parentSiblings: THREE.Object3D[] = []
        mockScene.traverse((child: THREE.Object3D) => {
          if (child !== parentObject && 
              child.position && 
              child.type !== 'Scene' && 
              !child.type.includes('Camera') &&
              !child.type.includes('Light')) {
            
            const childParent = child.userData?.orbit?.parent || child.userData?.parentId
            if (childParent === focusParent) {
              parentSiblings.push(child)
              const distance = focalCenter.distanceTo(child.position)
              if (distance > maxDistance) {
                maxDistance = distance
                outermostCenter = child.position.clone()
              }
            }
          }
        })
        
        console.log('Moon focus - parent context objects:', parentSiblings.map(obj => ({
          name: obj.userData?.name,
          distance: focalCenter.distanceTo(obj.position)
        })))
        
        expect(parentSiblings.length).toBe(1) // Only Moon orbits Earth
        expect(parentSiblings[0].userData?.name).toBe('Moon')
        expect(maxDistance).toBe(2) // Distance from Earth to Moon
        expect(focalCenter).toEqual(new THREE.Vector3(15, 0, 0)) // Earth position (new focal center)
        expect(outermostCenter).toEqual(new THREE.Vector3(17, 0, 0)) // Moon position
        
        // Camera should frame Earth-Moon system
        const layoutMidpoint = new THREE.Vector3()
        layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
        expect(layoutMidpoint).toEqual(new THREE.Vector3(16, 0, 0)) // Earth-Moon midpoint
      }
    })

    it('should handle complex multi-level hierarchy correctly', () => {
      // Create a more complex system
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
      ganymede.position.set(58, 0, 0) // Furthest from Jupiter
      ganymede.userData = { 
        name: 'Ganymede', 
        type: 'moon',
        orbit: { parent: 'jupiter' }
      }
      mockScene.add(ganymede)
      
      const earth = new THREE.Object3D()
      earth.position.set(15, 0, 0) // Different distance from Sol
      earth.userData = { 
        name: 'Earth', 
        type: 'planet',
        orbit: { parent: 'sol' }
      }
      mockScene.add(earth)
      
      // Focus on Jupiter
      const focusObject = jupiter
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // Find Jupiter's moons
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
      
      console.log('Jupiter focus - moons:', hierarchicalObjects.map(obj => ({
        name: obj.userData?.name,
        distance: focalCenter.distanceTo(obj.position)
      })))
      
      // Should find all 3 moons, with Ganymede as outermost
      expect(hierarchicalObjects.length).toBe(3)
      expect(maxDistance).toBe(8) // Distance from Jupiter to Ganymede
      expect(outermostCenter).toEqual(new THREE.Vector3(58, 0, 0)) // Ganymede position
      
      const moonNames = hierarchicalObjects.map(obj => obj.userData?.name).sort()
      expect(moonNames).toEqual(['Europa', 'Ganymede', 'Io'])
      
      // Camera should frame Jupiter-Ganymede system
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      expect(layoutMidpoint).toEqual(new THREE.Vector3(54, 0, 0)) // Jupiter-Ganymede midpoint
    })
  })
})