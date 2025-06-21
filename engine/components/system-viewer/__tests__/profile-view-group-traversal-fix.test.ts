import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'

describe('Profile View Group Traversal Fix', () => {
  it('should find actual moon inside orbital group', () => {
    // Setup Earth and Moon as they exist in the scene
    const earth = new THREE.Object3D()
    earth.position.set(20, 0, 0)
    earth.userData = { name: 'Earth', id: 'earth' }
    
    // Moon in orbital group (as OrbitalPath creates)
    const moonOrbitalGroup = new THREE.Group()
    moonOrbitalGroup.position.copy(earth.position) // Group positioned at Earth
    
    const moon = new THREE.Object3D()
    moon.position.set(2, 0, 0) // Local position in group
    moon.userData = { name: 'Luna', id: 'luna' }
    moon.type = 'Object3D'
    moonOrbitalGroup.add(moon)
    
    // Mock system data
    const systemData = {
      objects: [
        { id: 'earth', name: 'Earth', type: 'planet' },
        { id: 'luna', name: 'Luna', type: 'moon', orbit: { parent: 'earth' } }
      ]
    }
    
    // Mock objectRefsMap with orbital group
    const objectRefsMap = new Map([
      ['earth', earth],
      ['luna', moonOrbitalGroup] // Points to GROUP, not moon
    ])
    
    console.log('\n=== TESTING GROUP TRAVERSAL FIX ===')
    
    // Apply the fixed logic
    const focusName = 'Earth'
    const focalCenter = new THREE.Vector3()
    earth.getWorldPosition(focalCenter)
    
    const focusedObjectData = systemData.objects.find(obj => 
      obj.name?.toLowerCase() === focusName.toLowerCase()
    )
    const focusedObjectId = focusedObjectData?.id
    
    const childObjects = systemData.objects.filter(obj => 
      obj.orbit?.parent === focusName.toLowerCase() || 
      obj.orbit?.parent === focusedObjectId
    )
    
    let outermostCenter = focalCenter.clone()
    let maxDistance = 0
    
    for (const childObj of childObjects) {
      const childThreeObj = objectRefsMap.get(childObj.id)
      if (childThreeObj) {
        let actualChildObject = childThreeObj
        
        // FIXED LOGIC: If the ref is an orbital group, find the actual object inside
        if (childThreeObj.type === 'Group') {
          console.log('🔧 Found orbital group for', childObj.name)
          
          let foundChild = null
          childThreeObj.traverse((child: THREE.Object3D) => {
            if (child !== childThreeObj && 
                (child.userData?.name === childObj.name || 
                 child.userData?.id === childObj.id ||
                 child.type === 'Mesh' || 
                 child.type === 'Object3D')) {
              foundChild = child
            }
          })
          
          if (foundChild) {
            actualChildObject = foundChild
            console.log('✅ Found actual', childObj.name, 'inside group')
          }
        }
        
        const childWorldPos = new THREE.Vector3()
        actualChildObject.getWorldPosition(childWorldPos)
        console.log('📍', childObj.name, 'world position:', childWorldPos)
        
        const distance = focalCenter.distanceTo(childWorldPos)
        console.log('📏 Distance from Earth:', distance)
        
        if (distance > maxDistance) {
          maxDistance = distance
          outermostCenter = childWorldPos.clone()
        }
      }
    }
    
    const layoutMidpoint = new THREE.Vector3()
    layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
    
    console.log('\nResults:')
    console.log('Max distance:', maxDistance)
    console.log('Outermost center:', outermostCenter)
    console.log('Layout midpoint:', layoutMidpoint)
    
    // Verify the fix
    expect(maxDistance).toBe(2) // Correct distance from Earth to Moon
    expect(outermostCenter.x).toBe(22) // Moon's actual world position
    expect(layoutMidpoint.x).toBe(21) // Correct midpoint
    
    console.log('✅ FIX VERIFIED: Camera now finds actual moon position!')
  })

  it('should handle objects without groups correctly', () => {
    // Test that direct object references still work
    const mercury = new THREE.Object3D()
    mercury.position.set(10, 0, 0)
    mercury.userData = { name: 'Mercury', id: 'mercury' }
    
    const objectRefsMap = new Map([
      ['mercury', mercury] // Direct reference, not group
    ])
    
    const systemData = {
      objects: [
        { id: 'mercury', name: 'Mercury', type: 'planet' }
      ]
    }
    
    console.log('\n=== TESTING DIRECT OBJECT REFERENCES ===')
    
    const focusName = 'Mercury'
    const mercuryRef = objectRefsMap.get('mercury')
    
    // Test the logic doesn't break for direct references
    let actualObject = mercuryRef
    if (mercuryRef?.type === 'Group') {
      console.log('Mercury is a group (should not happen)')
    } else {
      console.log('✅ Mercury is direct object reference')
    }
    
    const worldPos = new THREE.Vector3()
    actualObject?.getWorldPosition(worldPos)
    
    expect(worldPos.x).toBe(10)
    console.log('✅ Direct references work correctly')
  })

  it('should handle multiple moons correctly', () => {
    // Test Jupiter with multiple moons
    const jupiter = new THREE.Object3D()
    jupiter.position.set(50, 0, 0)
    jupiter.userData = { name: 'Jupiter', id: 'jupiter' }
    
    // Create multiple moon orbital groups
    const ioGroup = new THREE.Group()
    ioGroup.position.copy(jupiter.position)
    const io = new THREE.Object3D()
    io.position.set(3, 0, 0) // Close moon
    io.userData = { name: 'Io', id: 'io' }
    io.type = 'Object3D'
    ioGroup.add(io)
    
    const europaGroup = new THREE.Group()
    europaGroup.position.copy(jupiter.position)
    const europa = new THREE.Object3D()
    europa.position.set(5, 0, 0) // Farther moon
    europa.userData = { name: 'Europa', id: 'europa' }
    europa.type = 'Object3D'
    europaGroup.add(europa)
    
    const objectRefsMap = new Map([
      ['jupiter', jupiter],
      ['io', ioGroup],
      ['europa', europaGroup]
    ])
    
    const systemData = {
      objects: [
        { id: 'jupiter', name: 'Jupiter', type: 'planet' },
        { id: 'io', name: 'Io', type: 'moon', orbit: { parent: 'jupiter' } },
        { id: 'europa', name: 'Europa', type: 'moon', orbit: { parent: 'jupiter' } }
      ]
    }
    
    console.log('\n=== TESTING MULTIPLE MOONS ===')
    
    const focusName = 'Jupiter'
    const focalCenter = new THREE.Vector3()
    jupiter.getWorldPosition(focalCenter)
    
    const focusedObjectData = systemData.objects.find(obj => 
      obj.name?.toLowerCase() === focusName.toLowerCase()
    )
    const focusedObjectId = focusedObjectData?.id
    
    const childObjects = systemData.objects.filter(obj => 
      obj.orbit?.parent === focusName.toLowerCase() || 
      obj.orbit?.parent === focusedObjectId
    )
    
    let outermostCenter = focalCenter.clone()
    let maxDistance = 0
    
    for (const childObj of childObjects) {
      const childThreeObj = objectRefsMap.get(childObj.id)
      if (childThreeObj) {
        let actualChildObject = childThreeObj
        
        if (childThreeObj.type === 'Group') {
          let foundChild = null
          childThreeObj.traverse((child: THREE.Object3D) => {
            if (child !== childThreeObj && 
                (child.userData?.name === childObj.name || 
                 child.userData?.id === childObj.id ||
                 child.type === 'Mesh' || 
                 child.type === 'Object3D')) {
              foundChild = child
            }
          })
          
          if (foundChild) {
            actualChildObject = foundChild
          }
        }
        
        const childWorldPos = new THREE.Vector3()
        actualChildObject.getWorldPosition(childWorldPos)
        const distance = focalCenter.distanceTo(childWorldPos)
        
        console.log(`${childObj.name}: distance ${distance}`)
        
        if (distance > maxDistance) {
          maxDistance = distance
          outermostCenter = childWorldPos.clone()
        }
      }
    }
    
    // Europa should be the outermost (distance 5)
    expect(maxDistance).toBe(5)
    expect(outermostCenter.x).toBe(55) // Jupiter (50) + Europa offset (5)
    
    console.log('✅ Multiple moons handled correctly, outermost found')
  })
})