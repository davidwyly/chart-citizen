/**
 * JITTER INVESTIGATION TEST
 * =========================
 * 
 * Systematic investigation of camera jitter issues, particularly with Venus
 * in explorational mode as mentioned by the user.
 */

import { describe, it, expect } from 'vitest'
import { calculateSystemOrbitalMechanics } from '../engine/utils/orbital-mechanics-calculator'
import type { CelestialObject } from '../engine/types/orbital-system'

describe('Jitter Investigation', () => {
  
  const solarSystemWithVenus: CelestialObject[] = [
    {
      id: 'sol',
      name: 'Sol',
      classification: 'star',
      geometry_type: 'star',
      properties: { mass: 1.0, radius: 695700, temperature: 5778 },
      position: [0, 0, 0]
    },
    {
      id: 'venus',
      name: 'Venus',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 0.815, radius: 6052, temperature: 737 },
      orbit: { parent: 'sol', semi_major_axis: 0.72, eccentricity: 0.007, inclination: 3.4, orbital_period: 225 }
    },
    {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 1.0, radius: 6371, temperature: 288 },
      orbit: { parent: 'sol', semi_major_axis: 1.0, eccentricity: 0.017, inclination: 0, orbital_period: 365.25 }
    }
  ]
  
  it('should investigate Venus jitter potential causes in explorational mode', () => {
    console.log('\n🔍 VENUS JITTER INVESTIGATION:')
    
    const mechanics = calculateSystemOrbitalMechanics(solarSystemWithVenus, 'explorational')
    
    const sol = mechanics.get('sol')!
    const venus = mechanics.get('venus')!
    const earth = mechanics.get('earth')!
    
    console.log('\n📊 OBJECT SCALING ANALYSIS:')
    console.log(`  Sol visual radius: ${sol.visualRadius}`)
    console.log(`  Venus visual radius: ${venus.visualRadius}`)
    console.log(`  Earth visual radius: ${earth.visualRadius}`)
    console.log(`  Venus orbit distance: ${venus.orbitDistance}`)
    console.log(`  Earth orbit distance: ${earth.orbitDistance}`)
    
    // Check for potential jitter sources
    console.log('\n🔍 POTENTIAL JITTER SOURCES:')
    
    // 1. Check if Venus size is in a problematic range
    const venusToEarthRatio = venus.visualRadius / earth.visualRadius
    console.log(`  Venus/Earth size ratio: ${venusToEarthRatio.toFixed(3)}`)
    if (venusToEarthRatio < 0.1 || venusToEarthRatio > 10) {
      console.log(`  ⚠️  Venus size ratio may cause precision issues`)
    }
    
    // 2. Check orbit distance scaling
    const venusOrbitToSize = venus.orbitDistance! / venus.visualRadius
    const earthOrbitToSize = earth.orbitDistance! / earth.visualRadius
    console.log(`  Venus orbit/size ratio: ${venusOrbitToSize.toFixed(1)}`)
    console.log(`  Earth orbit/size ratio: ${earthOrbitToSize.toFixed(1)}`)
    
    // 3. Check for extreme precision requirements
    const venusOriginalData = solarSystemWithVenus.find(obj => obj.id === 'venus')!
    const venusMovementPerFrame = (venus.orbitDistance! * 2 * Math.PI) / (venusOriginalData.orbit!.orbital_period * 60) / 60 // Per frame at 60fps
    console.log(`  Venus movement per frame: ${venusMovementPerFrame.toExponential(3)} units`)
    
    if (venusMovementPerFrame < 1e-6) {
      console.log(`  ⚠️  Venus movement per frame is extremely small - potential precision jitter`)
    }
    
    // 4. Check visual size vs Three.js optimal range
    if (venus.visualRadius < 0.1 || venus.visualRadius > 1000) {
      console.log(`  ⚠️  Venus visual size (${venus.visualRadius}) outside Three.js optimal range (0.1-1000)`)
    }
    
    // 5. Check orbital period for adaptive time scaling issues
    console.log(`\n⏰ TEMPORAL ANALYSIS:`)
    console.log(`  Venus orbital period: ${venus.orbit!.orbital_period} days`)
    
    if (venus.orbit!.orbital_period < 30) {
      console.log(`  📍 Venus qualifies as 'fast' object for adaptive time scaling`)
    } else if (venus.orbit!.orbital_period < 365) {
      console.log(`  📍 Venus qualifies as 'medium' object for adaptive time scaling`)
    } else {
      console.log(`  📍 Venus qualifies as 'slow' object for adaptive time scaling`)
    }
    
    // 6. Check for camera tracking threshold issues
    const cameraAdaptiveThreshold = Math.max(venus.visualRadius * 0.01, 1e-6)
    console.log(`\n📹 CAMERA TRACKING ANALYSIS:`)
    console.log(`  Venus visual size: ${venus.visualRadius}`)
    console.log(`  Camera adaptive threshold: ${cameraAdaptiveThreshold.toExponential(3)}`)
    console.log(`  Venus movement per frame: ${venusMovementPerFrame.toExponential(3)}`)
    console.log(`  Movement/threshold ratio: ${(venusMovementPerFrame / cameraAdaptiveThreshold).toFixed(3)}`)
    
    if (venusMovementPerFrame < cameraAdaptiveThreshold) {
      console.log(`  ⚠️  Venus movement is below camera threshold - may not trigger camera updates`)
    }
    
    // 7. Check Sol clearance that could affect camera positioning
    const venusSolClearance = venus.orbitDistance! - sol.visualRadius
    console.log(`\n🌞 SOL PROXIMITY ANALYSIS:`)
    console.log(`  Venus-Sol clearance: ${venusSolClearance.toFixed(1)} units`)
    console.log(`  Clearance/Venus ratio: ${(venusSolClearance / venus.visualRadius).toFixed(1)}x`)
    
    if (venusSolClearance < venus.visualRadius * 2) {
      console.log(`  ⚠️  Venus very close to Sol - may cause camera positioning issues`)
    }
    
    console.log('\n💡 JITTER MITIGATION RECOMMENDATIONS:')
    
    if (venusMovementPerFrame < cameraAdaptiveThreshold) {
      console.log(`  • Reduce camera adaptive threshold for small objects`)
    }
    
    if (venus.visualRadius < 0.5) {
      console.log(`  • Consider minimum visual size scaling for planets`)
    }
    
    if (venusMovementPerFrame < 1e-6) {
      console.log(`  • Consider increasing orbital speed multiplier for visibility`)
    }
    
    expect(venus.visualRadius).toBeGreaterThan(0)
    expect(venus.orbitDistance).toBeGreaterThan(sol.visualRadius)
  })
  
})