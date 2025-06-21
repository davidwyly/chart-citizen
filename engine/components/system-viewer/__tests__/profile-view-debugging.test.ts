import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'

describe('Profile View Debugging - Current Behavior Analysis', () => {
  describe('Hypothesis 1: Child Object Detection', () => {
    it('should test if child objects are found correctly', () => {
      const systemData = {
        objects: [
          { id: 'sol-star', name: 'Sol', type: 'star' },
          { id: 'earth-planet', name: 'Earth', type: 'planet', orbit: { parent: 'sol-star' } },
          { id: 'moon-moon', name: 'Moon', type: 'moon', orbit: { parent: 'earth-planet' } }
        ]
      }

      // Test finding children of Earth
      const focusName = 'Earth'
      const focusedObjectData = systemData.objects.find(obj => 
        obj.name?.toLowerCase() === focusName.toLowerCase()
      )
      const focusedObjectId = focusedObjectData?.id
      
      const childObjects = systemData.objects.filter(obj => 
        obj.orbit?.parent === focusName.toLowerCase() || 
        obj.orbit?.parent === focusedObjectId
      )
      
      console.log('Focus name:', focusName)
      console.log('Focused object ID:', focusedObjectId)
      console.log('Child objects found:', childObjects)
      
      expect(focusedObjectId).toBe('earth-planet')
      expect(childObjects.length).toBe(1)
      expect(childObjects[0].name).toBe('Moon')
    })

    it('should test parent matching variations', () => {
      const testCases = [
        { parent: 'earth', expectedMatch: false },
        { parent: 'Earth', expectedMatch: false },
        { parent: 'earth-planet', expectedMatch: true },
        { parent: 'EARTH-PLANET', expectedMatch: false }
      ]
      
      const systemData = {
        objects: [
          { id: 'earth-planet', name: 'Earth', type: 'planet' },
          ...testCases.map((tc, i) => ({
            id: `moon-${i}`,
            name: `Moon${i}`,
            type: 'moon',
            orbit: { parent: tc.parent }
          }))
        ]
      }
      
      const focusName = 'Earth'
      const focusedObjectData = systemData.objects.find(obj => 
        obj.name?.toLowerCase() === focusName.toLowerCase()
      )
      const focusedObjectId = focusedObjectData?.id
      
      testCases.forEach((tc, i) => {
        const childObjects = systemData.objects.filter(obj => 
          obj.orbit?.parent === focusName.toLowerCase() || 
          obj.orbit?.parent === focusedObjectId
        )
        
        const foundMoon = childObjects.find(obj => obj.id === `moon-${i}`)
        console.log(`Parent "${tc.parent}": expected=${tc.expectedMatch}, found=${!!foundMoon}`)
        
        expect(!!foundMoon).toBe(tc.expectedMatch)
      })
    })
  })

  describe('Hypothesis 2: World Position Calculation', () => {
    it('should test getWorldPosition behavior', () => {
      // Test if getWorldPosition returns correct values
      const testObject = {
        position: new THREE.Vector3(10, 0, 0),
        getWorldPosition: vi.fn((target: THREE.Vector3) => {
          target.copy(new THREE.Vector3(10, 0, 0))
          return target
        })
      }
      
      const worldPos = new THREE.Vector3()
      testObject.getWorldPosition(worldPos)
      
      expect(worldPos.x).toBe(10)
      expect(worldPos.y).toBe(0)
      expect(worldPos.z).toBe(0)
      expect(worldPos.length()).toBeGreaterThan(0.1) // Not at origin
    })

    it('should test distance calculation between objects', () => {
      const earth = new THREE.Vector3(20, 0, 0)
      const moon = new THREE.Vector3(22, 0, 0)
      const origin = new THREE.Vector3(0, 0, 0)
      
      const distanceEarthMoon = earth.distanceTo(moon)
      const distanceEarthOrigin = earth.distanceTo(origin)
      
      console.log('Earth to Moon distance:', distanceEarthMoon)
      console.log('Earth to Origin distance:', distanceEarthOrigin)
      
      expect(distanceEarthMoon).toBe(2)
      expect(distanceEarthOrigin).toBe(20)
      
      // Test midpoint calculation
      const midpoint = new THREE.Vector3()
      midpoint.addVectors(earth, moon).multiplyScalar(0.5)
      expect(midpoint.x).toBe(21)
    })
  })

  describe('Hypothesis 3: Profile View Framing Logic', () => {
    it('should calculate correct layout for objects with moons', () => {
      const earth = new THREE.Vector3(20, 0, 0)
      const moon = new THREE.Vector3(22, 0, 0)
      
      // Simulate finding outermost object
      let outermostCenter = earth.clone()
      let maxDistance = 0
      
      const moons = [moon]
      for (const m of moons) {
        const distance = earth.distanceTo(m)
        if (distance > maxDistance) {
          maxDistance = distance
          outermostCenter = m.clone()
        }
      }
      
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(earth, outermostCenter).multiplyScalar(0.5)
      
      console.log('Earth position:', earth)
      console.log('Outermost (Moon) position:', outermostCenter)
      console.log('Max distance:', maxDistance)
      console.log('Layout midpoint:', layoutMidpoint)
      
      expect(maxDistance).toBe(2)
      expect(layoutMidpoint.x).toBe(21)
    })

    it('should calculate correct layout for objects without moons', () => {
      const mercury = new THREE.Vector3(10, 0, 0)
      const objectScale = 1.0
      
      // No moons found, create fake outermost point
      const fakeOffset = objectScale * 3
      const outermostCenter = mercury.clone().add(new THREE.Vector3(fakeOffset, 0, 0))
      
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(mercury, outermostCenter).multiplyScalar(0.5)
      
      console.log('Mercury position:', mercury)
      console.log('Fake outermost position:', outermostCenter)
      console.log('Fake offset:', fakeOffset)
      console.log('Layout midpoint:', layoutMidpoint)
      
      expect(outermostCenter.x).toBe(13)
      expect(layoutMidpoint.x).toBe(11.5)
    })
  })

  describe('Hypothesis 4: Object References Map', () => {
    it('should test objectRefsMap retrieval', () => {
      const mockEarth = { id: 'earth-planet', position: new THREE.Vector3(20, 0, 0) }
      const mockMoon = { id: 'moon-moon', position: new THREE.Vector3(22, 0, 0) }
      
      const objectRefsMap = new Map([
        ['earth-planet', mockEarth],
        ['moon-moon', mockMoon]
      ])
      
      // Test retrieval
      const earthRef = objectRefsMap.get('earth-planet')
      const moonRef = objectRefsMap.get('moon-moon')
      
      expect(earthRef).toBe(mockEarth)
      expect(moonRef).toBe(mockMoon)
      expect(earthRef?.position.x).toBe(20)
      expect(moonRef?.position.x).toBe(22)
    })
  })

  describe('Integration: Full Profile View Calculation', () => {
    it('should simulate the full profile view calculation for Earth-Moon', () => {
      // Setup
      const focusObject = {
        userData: { name: 'Earth' },
        getWorldPosition: vi.fn((target: THREE.Vector3) => {
          target.set(20, 0, 0)
          return target
        })
      }
      
      const moonObject = {
        getWorldPosition: vi.fn((target: THREE.Vector3) => {
          target.set(22, 0, 0)
          return target
        })
      }
      
      const systemData = {
        objects: [
          { id: 'earth-planet', name: 'Earth', type: 'planet' },
          { id: 'moon-moon', name: 'Moon', type: 'moon', orbit: { parent: 'earth-planet' } }
        ]
      }
      
      const objectRefsMap = new Map([
        ['earth-planet', focusObject],
        ['moon-moon', moonObject]
      ])
      
      // Execute the logic
      const focusName = 'Earth'
      const focalCenter = new THREE.Vector3()
      focusObject.getWorldPosition(focalCenter)
      
      let outermostCenter = focalCenter.clone()
      let maxDistance = 0
      
      // Find children
      const focusedObjectData = systemData.objects.find(obj => 
        obj.name?.toLowerCase() === focusName.toLowerCase()
      )
      const focusedObjectId = focusedObjectData?.id
      
      const childObjects = systemData.objects.filter(obj => 
        obj.orbit?.parent === focusName.toLowerCase() || 
        obj.orbit?.parent === focusedObjectId
      )
      
      // Find outermost child
      for (const childObj of childObjects) {
        const childThreeObj = objectRefsMap.get(childObj.id)
        if (childThreeObj) {
          const childWorldPos = new THREE.Vector3()
          childThreeObj.getWorldPosition(childWorldPos)
          const distance = focalCenter.distanceTo(childWorldPos)
          if (distance > maxDistance) {
            maxDistance = distance
            outermostCenter = childWorldPos.clone()
          }
        }
      }
      
      const layoutMidpoint = new THREE.Vector3()
      layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
      
      console.log('\n=== FULL INTEGRATION TEST ===')
      console.log('Focus name:', focusName)
      console.log('Focal center:', focalCenter)
      console.log('Child objects found:', childObjects.length)
      console.log('Outermost center:', outermostCenter)
      console.log('Max distance:', maxDistance)
      console.log('Layout midpoint:', layoutMidpoint)
      console.log('Expected midpoint X:', 21)
      console.log('Actual midpoint X:', layoutMidpoint.x)
      
      expect(childObjects.length).toBe(1)
      expect(maxDistance).toBe(2)
      expect(layoutMidpoint.x).toBe(21)
    })
  })
})