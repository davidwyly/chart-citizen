import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import React from 'react'

describe('Profile View Runtime Simulation', () => {
  describe('Timing Hypothesis: Moon positions at different times', () => {
    it('should simulate moon position timing issue', () => {
      // Create Earth and Moon objects as they would exist in the scene
      const earth = new THREE.Object3D()
      earth.position.set(20, 0, 0)
      earth.userData = { name: 'Earth', id: 'earth' }
      
      // Moon in an orbital group (as OrbitalPath component creates)
      const moonOrbitalGroup = new THREE.Group()
      moonOrbitalGroup.position.set(0, 0, 0) // Initially at origin
      
      const moon = new THREE.Object3D()
      moon.position.set(2, 0, 0) // 2 units from group center
      moon.userData = { name: 'Luna', id: 'luna' }
      moonOrbitalGroup.add(moon)
      
      console.log('\n=== INITIAL STATE (Frame 0) ===')
      console.log('Earth world position:', earth.position)
      console.log('Moon orbital group position:', moonOrbitalGroup.position)
      console.log('Moon local position in group:', moon.position)
      
      // Get moon world position before group is positioned
      const moonWorldPosBefore = new THREE.Vector3()
      moon.getWorldPosition(moonWorldPosBefore)
      console.log('Moon world position (before):', moonWorldPosBefore)
      console.log('Distance from origin:', moonWorldPosBefore.length())
      
      // Camera calculates midpoint at this time
      const earthPos = new THREE.Vector3()
      earth.getWorldPosition(earthPos)
      const midpointBefore = new THREE.Vector3()
      midpointBefore.addVectors(earthPos, moonWorldPosBefore).multiplyScalar(0.5)
      console.log('Midpoint (INCORRECT):', midpointBefore)
      
      console.log('\n=== AFTER ORBITAL PATH POSITIONS GROUP (Frame 2) ===')
      // OrbitalPath positions the group at Earth's position
      moonOrbitalGroup.position.copy(earth.position)
      
      // Get moon world position after group is positioned
      const moonWorldPosAfter = new THREE.Vector3()
      moon.getWorldPosition(moonWorldPosAfter)
      console.log('Moon orbital group position:', moonOrbitalGroup.position)
      console.log('Moon world position (after):', moonWorldPosAfter)
      
      // Correct midpoint calculation
      const midpointAfter = new THREE.Vector3()
      midpointAfter.addVectors(earthPos, moonWorldPosAfter).multiplyScalar(0.5)
      console.log('Midpoint (CORRECT):', midpointAfter)
      
      // Verify the issue
      expect(moonWorldPosBefore.x).toBe(2) // Moon appears at local position
      expect(moonWorldPosAfter.x).toBe(22) // Moon at correct world position
      expect(midpointBefore.x).toBe(11) // Wrong! Halfway to local position
      expect(midpointAfter.x).toBe(21) // Correct! Halfway between Earth and Moon
    })

    it('should test objectRefsMap containing groups vs objects', () => {
      // The objectRefsMap might contain the orbital group, not the moon directly
      const earth = new THREE.Object3D()
      earth.position.set(20, 0, 0)
      
      const moonOrbitalGroup = new THREE.Group()
      const moon = new THREE.Object3D()
      moon.position.set(2, 0, 0)
      moonOrbitalGroup.add(moon)
      
      // Test different ref map scenarios
      console.log('\n=== OBJECT REFS MAP SCENARIOS ===')
      
      // Scenario 1: Refs map contains the moon directly
      const refsMap1 = new Map([
        ['earth', earth],
        ['luna', moon]
      ])
      
      const moonRef1 = refsMap1.get('luna')
      console.log('Scenario 1 - Direct moon ref:')
      console.log('  Moon ref exists:', !!moonRef1)
      console.log('  Moon ref type:', moonRef1?.type)
      
      // Scenario 2: Refs map contains the orbital group
      const refsMap2 = new Map([
        ['earth', earth],
        ['luna', moonOrbitalGroup]
      ])
      
      const moonRef2 = refsMap2.get('luna')
      console.log('\nScenario 2 - Orbital group ref:')
      console.log('  Moon ref exists:', !!moonRef2)
      console.log('  Moon ref type:', moonRef2?.type)
      console.log('  Is it a Group?:', moonRef2?.type === 'Group')
      
      // Getting world position from group
      moonOrbitalGroup.position.set(20, 0, 0) // Position group at Earth
      const groupWorldPos = new THREE.Vector3()
      moonRef2?.getWorldPosition(groupWorldPos)
      console.log('  Group world position:', groupWorldPos)
      console.log('  ❌ This gives Earth position, not Moon position!')
    })

    it('should check if we need to traverse group children', () => {
      const earth = new THREE.Object3D()
      earth.position.set(20, 0, 0)
      earth.userData = { name: 'Earth' }
      
      const moonOrbitalGroup = new THREE.Group()
      moonOrbitalGroup.position.copy(earth.position)
      moonOrbitalGroup.userData = { isOrbitalGroup: true }
      
      const moon = new THREE.Object3D()
      moon.position.set(2, 0, 0) // Local position in group
      moon.userData = { name: 'Luna', type: 'moon' }
      moonOrbitalGroup.add(moon)
      
      console.log('\n=== GROUP TRAVERSAL TEST ===')
      
      // If objectRefsMap contains the group
      const objectRef = moonOrbitalGroup
      
      // Check if it's a group and find the actual moon
      if (objectRef.type === 'Group') {
        console.log('Object ref is a Group, searching for moon inside...')
        
        let actualMoon = null
        objectRef.traverse(child => {
          if (child.userData?.type === 'moon' || child.userData?.name === 'Luna') {
            actualMoon = child
          }
        })
        
        if (actualMoon) {
          const moonWorldPos = new THREE.Vector3()
          actualMoon.getWorldPosition(moonWorldPos)
          console.log('Found moon in group!')
          console.log('Moon world position:', moonWorldPos)
          expect(moonWorldPos.x).toBe(22) // Correct position
        }
      }
    })
  })

  describe('Profile View Object Finding Logic', () => {
    it('should simulate the exact camera controller logic', () => {
      // Setup scene hierarchy
      const scene = new THREE.Scene()
      
      const earth = new THREE.Object3D()
      earth.position.set(20, 0, 0)
      earth.userData = { name: 'Earth', id: 'earth' }
      scene.add(earth)
      
      const moonOrbitalGroup = new THREE.Group()
      moonOrbitalGroup.position.copy(earth.position)
      scene.add(moonOrbitalGroup)
      
      const moon = new THREE.Object3D()
      moon.position.set(2, 0, 0)
      moon.userData = { name: 'Luna', id: 'luna' }
      moonOrbitalGroup.add(moon)
      
      // Mock system data
      const systemData = {
        objects: [
          { id: 'earth', name: 'Earth', type: 'planet' },
          { id: 'luna', name: 'Luna', type: 'moon', orbit: { parent: 'earth' } }
        ]
      }
      
      // Mock objectRefsMap - THIS IS KEY!
      const objectRefsMap = new Map([
        ['earth', earth],
        ['luna', moonOrbitalGroup] // Refs map might point to the GROUP, not the moon!
      ])
      
      console.log('\n=== SIMULATING CAMERA CONTROLLER LOGIC ===')
      
      // Camera controller logic
      const focusName = 'Earth'
      const focusObject = earth
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      // Find children
      const focusedObjectData = systemData.objects.find(obj => 
        obj.name?.toLowerCase() === focusName.toLowerCase()
      )
      const focusedObjectId = focusedObjectData?.id
      
      const childObjects = systemData.objects.filter(obj => 
        obj.orbit?.parent === focusName.toLowerCase() || 
        obj.orbit?.parent === focusedObjectId
      )
      
      console.log('Found', childObjects.length, 'children:', childObjects.map(c => c.name))
      
      // Find outermost child
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      for (const childObj of childObjects) {
        const childThreeObj = objectRefsMap.get(childObj.id)
        if (childThreeObj) {
          const childWorldPos = new THREE.Vector3()
          childThreeObj.getWorldPosition(childWorldPos)
          console.log(`${childObj.name} world position:`, childWorldPos)
          console.log(`  (This is the GROUP position, not the moon!)`)
          
          const distance = focalCenter.distanceTo(childWorldPos)
          console.log(`  Distance from Earth: ${distance}`)
          
          if (distance > maxDistance) {
            maxDistance = distance
            outermostCenter = childWorldPos.clone()
          }
        }
      }
      
      console.log('\nResult:')
      console.log('Max distance found:', maxDistance)
      console.log('Outermost center:', outermostCenter)
      
      // The bug: maxDistance is 0 because group is at same position as Earth!
      expect(maxDistance).toBe(0)
      console.log('\n❌ BUG CONFIRMED: Moon group is at Earth position, distance is 0!')
      console.log('Camera will use fake outermost point instead of actual moon position!')
    })
  })
})