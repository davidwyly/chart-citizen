import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'

describe('Camera Target Midpoint Issue Investigation', () => {
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

  describe('Current Logic Issues', () => {
    it('should demonstrate the focal center reassignment problem', () => {
      // Create system: Sol -> Earth -> Moon
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
      
      // Simulate clicking on Moon (which has no children)
      const focusObject = moon
      let focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      console.log('Original clicked object (Moon) position:', focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // Try to find Moon's children (none exist)
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
      
      // Fallback to parent context - THIS IS WHERE THE PROBLEM OCCURS
      const focusParent = focusObject.userData?.orbit?.parent // 'earth'
      
      let parentObject: THREE.Object3D | null = null
      mockScene.traverse((child: THREE.Object3D) => {
        if (child.userData?.name?.toLowerCase() === focusParent) {
          parentObject = child
        }
      })
      
      if (parentObject) {
        console.log('Found parent object (Earth):', parentObject.userData?.name)
        
        // PROBLEM: This reassigns focalCenter to Earth's position
        const originalFocalCenter = focalCenter.clone() // Save original Moon position
        parentObject.getWorldPosition(focalCenter) // Now focalCenter = Earth position
        
        console.log('Reassigned focalCenter to parent (Earth):', focalCenter)
        
        // Find Moon as Earth's child
        mockScene.traverse((child: THREE.Object3D) => {
          if (child !== parentObject) {
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
        
        console.log('Outermost object found:', outermostCenter)
        
        // Calculate midpoint - WRONG: This uses Earth-Moon midpoint
        const wrongMidpoint = new THREE.Vector3()
        wrongMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
        
        console.log('Wrong midpoint (Earth-Moon):', wrongMidpoint)
        
        // What we actually want when clicking Moon:
        // - Focal center should STILL be Moon's position (the clicked object)
        // - Outermost should be Earth's position (parent context)
        // - Midpoint should be Moon-Earth midpoint, but WITH MOON as focal center
        
        const correctMidpoint = new THREE.Vector3()
        correctMidpoint.addVectors(originalFocalCenter, parentObject.position).multiplyScalar(0.5)
        
        console.log('Correct midpoint (Moon-Earth with Moon as focal):', correctMidpoint)
        
        // The issue: wrongMidpoint = Earth-Moon, correctMidpoint = Moon-Earth
        // They're different because the focal center changed!
        expect(wrongMidpoint).toEqual(new THREE.Vector3(16, 0, 0)) // Earth-Moon midpoint
        expect(correctMidpoint).toEqual(new THREE.Vector3(16, 0, 0)) // Moon-Earth midpoint (same in this case)
        
        // But what if we want to frame Moon in context of the ENTIRE Earth system?
        // Maybe we want Moon-[farthest Earth child] instead of Moon-Earth?
      }
    })

    it('should clarify the correct hierarchical behavior', () => {
      // More complex case: Jupiter system
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
      ganymede.position.set(58, 0, 0) // Furthest
      ganymede.userData = { 
        name: 'Ganymede', 
        type: 'moon',
        orbit: { parent: 'jupiter' }
      }
      mockScene.add(ganymede)
      
      // Test case 1: Click Io (has no children, should show in Jupiter system context)
      const focusObject = io
      const originalFocalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(originalFocalCenter)
      
      console.log('Clicked on Io:', originalFocalCenter)
      
      // Question: What should the camera frame show?
      // Option A: Io to Jupiter (parent)
      // Option B: Jupiter to Ganymede (entire Jupiter system with Jupiter as focal)
      // Option C: Io to Ganymede (Io as focal, frame to outermost sibling)
      
      // Based on requirements: "Click into child orbiting bodies to make them the new focal point"
      // This suggests Option C: Io should remain the focal point, frame to outermost sibling
      
      // Find Io's siblings (other Jupiter children)
      const ioParent = focusObject.userData?.orbit?.parent // 'jupiter'
      const siblings: THREE.Object3D[] = []
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject) {
          const childParent = child.userData?.orbit?.parent
          if (childParent === ioParent) {
            siblings.push(child)
          }
        }
      })
      
      console.log('Io siblings:', siblings.map(s => s.userData?.name))
      
      // Find outermost sibling
      let maxDistance = 0
      let outermostSibling: THREE.Object3D | null = null
      
      siblings.forEach(sibling => {
        const distance = originalFocalCenter.distanceTo(sibling.position)
        if (distance > maxDistance) {
          maxDistance = distance
          outermostSibling = sibling
        }
      })
      
      console.log('Outermost sibling from Io:', outermostSibling?.userData?.name, maxDistance)
      
      expect(outermostSibling?.userData?.name).toBe('Ganymede')
      expect(maxDistance).toBe(6) // Distance from Io to Ganymede
      
      // Correct midpoint: Io-Ganymede
      const correctMidpoint = new THREE.Vector3()
      correctMidpoint.addVectors(originalFocalCenter, outermostSibling!.position).multiplyScalar(0.5)
      
      console.log('Correct Io-Ganymede midpoint:', correctMidpoint)
      expect(correctMidpoint).toEqual(new THREE.Vector3(55, 0, 0))
    })
  })
})