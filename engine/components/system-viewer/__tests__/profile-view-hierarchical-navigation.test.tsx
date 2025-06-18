import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'

describe('Profile View Hierarchical Navigation', () => {
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
    it('should demonstrate the problem with current traversal logic', () => {
      // Create a hierarchical system: Sol -> Earth -> Moon
      const sol = new THREE.Object3D()
      sol.position.set(0, 0, 0)
      sol.userData = { name: 'Sol', type: 'star' }
      mockScene.add(sol)
      
      const earth = new THREE.Object3D()
      earth.position.set(15, 0, 0)
      earth.userData = { name: 'Earth', type: 'planet' }
      mockScene.add(earth)
      
      const moon = new THREE.Object3D()
      moon.position.set(17, 0, 0) // 2 units from Earth
      moon.userData = { name: 'Moon', type: 'moon', parentId: 'earth' }
      mockScene.add(moon)
      
      const mars = new THREE.Object3D()
      mars.position.set(25, 0, 0)
      mars.userData = { name: 'Mars', type: 'planet' }
      mockScene.add(mars)
      
      // Current logic when Earth is focused (WRONG BEHAVIOR)
      const focusObject = earth
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      const foundObjects: any[] = []
      
      // This is what the current camera controller does
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && 
            child.position && 
            child.type !== 'Scene' && 
            !child.type.includes('Camera') &&
            !child.type.includes('Light')) {
          const distance = focalCenter.distanceTo(child.position)
          foundObjects.push({
            name: child.userData?.name || 'unnamed',
            type: child.userData?.type || child.type,
            distance
          })
          
          if (distance > maxDistance) {
            maxDistance = distance
            outermostCenter = child.position.clone()
          }
        }
      })
      
      console.log('Current logic finds objects:', foundObjects)
      console.log('Current logic outermost:', { maxDistance, position: outermostCenter })
      
      // PROBLEM: Current logic finds Sol (distance 15) and Mars (distance 10) as candidates
      // It picks Sol as the outermost, so camera frames Earth-Sol instead of Earth-Moon
      expect(foundObjects.length).toBe(3) // Sol, Moon, Mars
      expect(maxDistance).toBe(15) // Distance to Sol
      expect(outermostCenter).toEqual(new THREE.Vector3(0, 0, 0)) // Sol position
      
      // This results in framing Earth-Sol instead of Earth-Moon!
      const wrongMidpoint = new THREE.Vector3()
      wrongMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      expect(wrongMidpoint).toEqual(new THREE.Vector3(7.5, 0, 0)) // Earth-Sol midpoint
    })

    it('should demonstrate correct hierarchical logic', () => {
      // Create the same system
      const sol = new THREE.Object3D()
      sol.position.set(0, 0, 0)
      sol.userData = { name: 'Sol', type: 'star' }
      mockScene.add(sol)
      
      const earth = new THREE.Object3D()
      earth.position.set(15, 0, 0)
      earth.userData = { name: 'Earth', type: 'planet' }
      mockScene.add(earth)
      
      const moon = new THREE.Object3D()
      moon.position.set(17, 0, 0) // 2 units from Earth
      moon.userData = { name: 'Moon', type: 'moon', parentId: 'earth' }
      mockScene.add(moon)
      
      const mars = new THREE.Object3D()
      mars.position.set(25, 0, 0)
      mars.userData = { name: 'Mars', type: 'planet' }
      mockScene.add(mars)
      
      // CORRECT hierarchical logic when Earth is focused
      const focusObject = earth
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      const hierarchicalObjects: any[] = []
      
      // Find objects that orbit around the focus object (correct approach)
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && 
            child.position && 
            child.type !== 'Scene' && 
            !child.type.includes('Camera') &&
            !child.type.includes('Light')) {
          
          // Check if this object orbits the focus object
          const isChildOfFocus = child.userData?.parentId === focusObject.userData?.name?.toLowerCase()
          
          if (isChildOfFocus) {
            const distance = focalCenter.distanceTo(child.position)
            hierarchicalObjects.push({
              name: child.userData?.name || 'unnamed',
              type: child.userData?.type || child.type,
              distance,
              parentId: child.userData?.parentId
            })
            
            if (distance > maxDistance) {
              maxDistance = distance
              outermostCenter = child.position.clone()
            }
          }
        }
      })
      
      console.log('Hierarchical logic finds objects:', hierarchicalObjects)
      console.log('Hierarchical logic outermost:', { maxDistance, position: outermostCenter })
      
      // CORRECT: Only finds Moon as Earth's child
      expect(hierarchicalObjects.length).toBe(1) // Only Moon
      expect(maxDistance).toBe(2) // Distance to Moon
      expect(outermostCenter).toEqual(new THREE.Vector3(17, 0, 0)) // Moon position
      
      // This results in correct framing Earth-Moon
      const correctMidpoint = new THREE.Vector3()
      correctMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      expect(correctMidpoint).toEqual(new THREE.Vector3(16, 0, 0)) // Earth-Moon midpoint
    })

    it('should handle case when focus object has no children', () => {
      // Moon has no children, should fall back to showing Moon in context of parent system
      const sol = new THREE.Object3D()
      sol.position.set(0, 0, 0)
      sol.userData = { name: 'Sol', type: 'star' }
      mockScene.add(sol)
      
      const earth = new THREE.Object3D()
      earth.position.set(15, 0, 0)
      earth.userData = { name: 'Earth', type: 'planet', parentId: 'sol' }
      mockScene.add(earth)
      
      const moon = new THREE.Object3D()
      moon.position.set(17, 0, 0)
      moon.userData = { name: 'Moon', type: 'moon', parentId: 'earth' }
      mockScene.add(moon)
      
      // Focus on Moon (which has no children)
      const focusObject = moon
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let childObjects: any[] = []
      
      // First, try to find children of Moon
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && 
            child.position && 
            child.type !== 'Scene' && 
            !child.type.includes('Camera') &&
            !child.type.includes('Light')) {
          
          const isChildOfFocus = child.userData?.parentId === focusObject.userData?.name?.toLowerCase()
          if (isChildOfFocus) {
            childObjects.push(child)
          }
        }
      })
      
      expect(childObjects.length).toBe(0) // Moon has no children
      
      // Fall back to showing Moon in context of its parent system
      // Find the parent object
      const parentId = focusObject.userData?.parentId // 'earth'
      let parentObject: THREE.Object3D | null = null
      
      mockScene.traverse((child: THREE.Object3D) => {
        if (child.userData?.name?.toLowerCase() === parentId) {
          parentObject = child
        }
      })
      
      expect(parentObject).toBeDefined()
      expect(parentObject?.userData?.name).toBe('Earth')
      
      // Now find siblings (other children of the parent)
      const siblings: any[] = []
      mockScene.traverse((child: THREE.Object3D) => {
        if (child !== focusObject && 
            child.userData?.parentId === parentId) {
          siblings.push(child)
        }
      })
      
      // In this case, Moon is Earth's only child, so no siblings
      expect(siblings.length).toBe(0)
      
      // Could fall back further to show Earth's context (Sol system)
      // This would show Moon -> Earth -> Sol framing
    })
  })

  describe('Proposed Hierarchical Navigation Logic', () => {
    it('should implement correct hierarchical framing algorithm', () => {
      // Create a complex system to test the algorithm
      const sol = new THREE.Object3D()
      sol.position.set(0, 0, 0)
      sol.userData = { name: 'Sol', type: 'star' }
      
      const earth = new THREE.Object3D()
      earth.position.set(15, 0, 0)
      earth.userData = { name: 'Earth', type: 'planet', parentId: 'sol' }
      
      const moon = new THREE.Object3D()
      moon.position.set(17, 0, 0)
      moon.userData = { name: 'Moon', type: 'moon', parentId: 'earth' }
      
      const spaceStation = new THREE.Object3D()
      spaceStation.position.set(18, 0, 0)
      spaceStation.userData = { name: 'ISS', type: 'station', parentId: 'earth' }
      
      const testScene = new THREE.Scene()
      testScene.add(sol, earth, moon, spaceStation)
      
      // Algorithm for hierarchical navigation
      const findHierarchicalFraming = (focusObject: THREE.Object3D, scene: THREE.Scene) => {
        const focalCenter = new THREE.Vector3()
        focusObject.getWorldPosition(focalCenter)
        
        // Step 1: Find direct children of focus object
        const children: THREE.Object3D[] = []
        scene.traverse((child: THREE.Object3D) => {
          if (child !== focusObject && 
              child.userData?.parentId === focusObject.userData?.name?.toLowerCase()) {
            children.push(child)
          }
        })
        
        if (children.length > 0) {
          // Frame focus object and its children
          let maxDistance = 0
          let outermostChild: THREE.Object3D | null = null
          
          children.forEach(child => {
            const distance = focalCenter.distanceTo(child.position)
            if (distance > maxDistance) {
              maxDistance = distance
              outermostChild = child
            }
          })
          
          return {
            type: 'children',
            focusObject,
            outermostObject: outermostChild,
            objects: children,
            span: maxDistance
          }
        }
        
        // Step 2: If no children, show in context of parent system
        const parentId = focusObject.userData?.parentId
        if (parentId) {
          let parentObject: THREE.Object3D | null = null
          scene.traverse((child: THREE.Object3D) => {
            if (child.userData?.name?.toLowerCase() === parentId) {
              parentObject = child
            }
          })
          
          if (parentObject) {
            // Find siblings (other children of parent)
            const siblings: THREE.Object3D[] = []
            scene.traverse((child: THREE.Object3D) => {
              if (child !== focusObject && 
                  child.userData?.parentId === parentId) {
                siblings.push(child)
              }
            })
            
            if (siblings.length > 0) {
              // Frame from parent to outermost sibling
              const parentCenter = new THREE.Vector3()
              parentObject.getWorldPosition(parentCenter)
              
              let maxDistance = 0
              let outermostSibling: THREE.Object3D | null = null
              
              // Include focus object in distance calculation
              const allSiblings = [focusObject, ...siblings]
              allSiblings.forEach(sibling => {
                const distance = parentCenter.distanceTo(sibling.position)
                if (distance > maxDistance) {
                  maxDistance = distance
                  outermostSibling = sibling
                }
              })
              
              return {
                type: 'parent-context',
                focusObject: parentObject,
                outermostObject: outermostSibling,
                objects: allSiblings,
                span: maxDistance
              }
            }
          }
        }
        
        // Step 3: Fallback to focus object only
        return {
          type: 'isolated',
          focusObject,
          outermostObject: focusObject,
          objects: [focusObject],
          span: 0
        }
      }
      
      // Test with Earth (has children)
      const earthFraming = findHierarchicalFraming(earth, testScene)
      expect(earthFraming.type).toBe('children')
      expect(earthFraming.objects.length).toBe(2) // Moon, ISS
      expect(earthFraming.outermostObject?.userData?.name).toBe('ISS') // Further from Earth
      
      // Test with Moon (no children, show in Earth context)
      const moonFraming = findHierarchicalFraming(moon, testScene)
      expect(moonFraming.type).toBe('parent-context')
      expect(moonFraming.focusObject?.userData?.name).toBe('Earth') // Parent becomes focus
      expect(moonFraming.objects.length).toBe(2) // Moon, ISS (both children of Earth)
      
      // Test with Sol (no parent, has children)
      const solFraming = findHierarchicalFraming(sol, testScene)
      expect(solFraming.type).toBe('children')
      expect(solFraming.objects.length).toBe(1) // Only Earth orbits Sol in this test
    })
  })
})