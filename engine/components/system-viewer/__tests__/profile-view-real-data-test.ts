import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'
import solSystemData from '@/public/data/star-citizen/systems/sol.json'

describe('Profile View Real Data Analysis', () => {
  it('should analyze Sol system data structure', () => {
    console.log('\n=== SOL SYSTEM DATA ANALYSIS ===')
    console.log('Total objects:', solSystemData.objects.length)
    
    // List all objects
    solSystemData.objects.forEach(obj => {
      console.log(`- ${obj.name} (${obj.id}) - type: ${obj.classification}`)
      if (obj.orbit) {
        console.log(`  └─ orbits: ${obj.orbit.parent}`)
      }
    })
    
    // Check for Earth's moons
    const earth = solSystemData.objects.find(obj => obj.name === 'Earth')
    console.log('\nEarth object:', earth?.id)
    
    const earthMoons = solSystemData.objects.filter(obj => 
      obj.orbit?.parent === 'earth' || 
      obj.orbit?.parent === earth?.id
    )
    console.log('Objects orbiting Earth:', earthMoons.map(m => m.name))
    
    // Check for Luna
    const luna = solSystemData.objects.find(obj => obj.name === 'Luna')
    console.log('\nLuna found:', !!luna)
    if (luna) {
      console.log('Luna orbits:', luna.orbit?.parent)
    }
  })

  it('should test actual parent-child matching logic', () => {
    // Test the exact logic from unified-camera-controller
    const focusName = 'Earth'
    
    const focusedObjectData = solSystemData.objects.find((obj: any) => 
      obj.name?.toLowerCase() === focusName.toLowerCase()
    )
    const focusedObjectId = focusedObjectData?.id
    
    console.log('\n=== PARENT-CHILD MATCHING TEST ===')
    console.log('Focus name:', focusName)
    console.log('Focused object data:', focusedObjectData)
    console.log('Focused object ID:', focusedObjectId)
    
    const childObjects = solSystemData.objects.filter((obj: any) => 
      obj.orbit?.parent === focusName.toLowerCase() || 
      obj.orbit?.parent === focusedObjectId
    )
    
    console.log('Child objects found:', childObjects.map(c => ({
      name: c.name,
      parent: c.orbit?.parent
    })))
    
    expect(focusedObjectId).toBe('earth')
  })

  it('should check all planet-moon relationships', () => {
    console.log('\n=== ALL PLANET-MOON RELATIONSHIPS ===')
    
    const planets = solSystemData.objects.filter(obj => 
      obj.classification === 'planet'
    )
    
    planets.forEach(planet => {
      const moons = solSystemData.objects.filter(obj => 
        obj.orbit?.parent === planet.id || 
        obj.orbit?.parent === planet.name.toLowerCase()
      )
      
      console.log(`${planet.name} (${planet.id}):`)
      if (moons.length > 0) {
        moons.forEach(moon => {
          console.log(`  └─ ${moon.name} (parent: ${moon.orbit?.parent})`)
        })
      } else {
        console.log('  └─ No moons')
      }
    })
  })

  it('should simulate profile view framing with real data', () => {
    // Simulate framing for Earth
    const earth = solSystemData.objects.find(obj => obj.name === 'Earth')
    const earthMoons = solSystemData.objects.filter(obj => 
      obj.orbit?.parent === earth?.id || 
      obj.orbit?.parent === earth?.name?.toLowerCase()
    )
    
    console.log('\n=== EARTH PROFILE VIEW SIMULATION ===')
    console.log('Earth ID:', earth?.id)
    console.log('Moons found:', earthMoons.length)
    
    if (earthMoons.length === 0) {
      console.log('❌ NO MOONS FOUND - This explains the framing issue!')
      console.log('The camera will create a fake outermost point')
    }
    
    // Check other planets
    const mars = solSystemData.objects.find(obj => obj.name === 'Mars')
    const marsMoons = solSystemData.objects.filter(obj => 
      obj.orbit?.parent === mars?.id || 
      obj.orbit?.parent === mars?.name?.toLowerCase()
    )
    console.log('\nMars moons:', marsMoons.map(m => m.name))
    
    const jupiter = solSystemData.objects.find(obj => obj.name === 'Jupiter')
    const jupiterMoons = solSystemData.objects.filter(obj => 
      obj.orbit?.parent === jupiter?.id || 
      obj.orbit?.parent === jupiter?.name?.toLowerCase()
    )
    console.log('Jupiter moons:', jupiterMoons.map(m => m.name))
  })
})