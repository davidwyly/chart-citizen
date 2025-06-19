/**
 * MERCURY COLLISION DEBUG
 * =======================
 * 
 * CRITICAL: Mercury is appearing inside Sol, which violates fundamental
 * collision detection rules. This debug test investigates why.
 */

import { describe, it, expect } from 'vitest'
import { calculateSystemOrbitalMechanics } from '../engine/utils/orbital-mechanics-calculator'
import type { CelestialObject } from '../engine/types/orbital-system'

describe('Mercury Collision Debug', () => {
  
  const solarSystemWithMercury: CelestialObject[] = [
    {
      id: 'sol',
      name: 'Sol',
      classification: 'star',
      geometry_type: 'star',
      properties: { mass: 1.0, radius: 695700 }, // Sun radius
      position: [0, 0, 0]
    },
    {
      id: 'mercury',
      name: 'Mercury',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 0.055, radius: 2439 }, // Mercury radius
      orbit: { parent: 'sol', semi_major_axis: 0.39, eccentricity: 0.206, inclination: 7.0, orbital_period: 88 }
    },
    {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: { mass: 1.0, radius: 6371 },
      orbit: { parent: 'sol', semi_major_axis: 1.0, eccentricity: 0.017, inclination: 0, orbital_period: 365.25 }
    }
  ]
  
  it('should debug Mercury-Sol collision detection failure', () => {
    console.log('\n🚨 MERCURY COLLISION DEBUG:')
    
    const viewModes = ['scientific', 'explorational', 'navigational'] as const
    
    viewModes.forEach(viewMode => {
      console.log(`\n  ${viewMode.toUpperCase()} MODE:`)
      
      const mechanics = calculateSystemOrbitalMechanics(solarSystemWithMercury, viewMode)
      
      const sol = mechanics.get('sol')!
      const mercury = mechanics.get('mercury')!
      const earth = mechanics.get('earth')!
      
      console.log(`    Sol visual radius: ${sol.visualRadius.toFixed(2)} units`)
      console.log(`    Mercury orbit distance: ${mercury.orbitDistance?.toFixed(2)} units`)
      console.log(`    Mercury visual radius: ${mercury.visualRadius.toFixed(3)} units`)
      console.log(`    Earth orbit distance: ${earth.orbitDistance?.toFixed(2)} units`)
      
      // Calculate clearance between Sol surface and Mercury orbit
      const mercuryOrbit = mercury.orbitDistance || 0
      const solRadius = sol.visualRadius
      const clearance = mercuryOrbit - solRadius
      const clearanceRatio = clearance / solRadius
      
      console.log(`\n    COLLISION ANALYSIS:`)
      console.log(`      Sol surface to Mercury orbit: ${clearance.toFixed(2)} units`)
      console.log(`      Clearance ratio: ${clearanceRatio.toFixed(2)}x Sol radius`)
      
      if (clearance <= 0) {
        console.log(`      🚨 COLLISION: Mercury is ${Math.abs(clearance).toFixed(2)} units INSIDE Sol!`)
      } else if (clearance < solRadius * 0.1) {
        console.log(`      ⚠️  DANGER: Mercury only ${clearance.toFixed(2)} units from Sol surface`)
      } else {
        console.log(`      ✅ SAFE: Adequate clearance`)
      }
      
      // Check what Mercury's raw orbital distance should be
      const orbitScaling = viewMode === 'scientific' ? 80.0 : 
                          viewMode === 'explorational' ? 50.0 : 40.0
      const expectedMercuryOrbit = 0.39 * orbitScaling
      
      console.log(`\n    EXPECTED vs ACTUAL:`)
      console.log(`      Expected Mercury orbit: ${expectedMercuryOrbit.toFixed(1)} units (0.39 AU × ${orbitScaling})`)
      console.log(`      Actual Mercury orbit: ${mercuryOrbit.toFixed(1)} units`)
      console.log(`      Collision detection moved: ${(mercuryOrbit - expectedMercuryOrbit).toFixed(1)} units`)
      
      // CRITICAL TEST: Mercury must NEVER be inside Sol
      expect(clearance).toBeGreaterThan(0)
      
      // Mercury should have reasonable clearance (at least 10% of Sol radius)
      expect(clearanceRatio).toBeGreaterThan(0.1)
    })
  })
  
  it('should analyze why collision detection failed', () => {
    console.log('\n🔍 COLLISION DETECTION FAILURE ANALYSIS:')
    
    const mechanics = calculateSystemOrbitalMechanics(solarSystemWithMercury, 'scientific')
    const sol = mechanics.get('sol')!
    const mercury = mechanics.get('mercury')!
    
    // With our new scaling:
    // - Sol visual radius is much larger (due to realistic proportions)
    // - Mercury orbit might not have been scaled proportionally
    
    const solRadiusKm = 695700
    const mercuryOrbitKm = 0.39 * 149597870.7  // AU to km
    const realClearanceRatio = (mercuryOrbitKm - solRadiusKm) / solRadiusKm
    
    console.log(`\n  REAL WORLD PROPORTIONS:`)
    console.log(`    Sol radius: ${solRadiusKm.toLocaleString()} km`)
    console.log(`    Mercury orbit: ${mercuryOrbitKm.toLocaleString()} km`)
    console.log(`    Real clearance ratio: ${realClearanceRatio.toFixed(1)}x Sol radius`)
    
    console.log(`\n  SCALED PROPORTIONS:`)
    console.log(`    Sol visual radius: ${sol.visualRadius.toFixed(2)} units`)
    console.log(`    Mercury orbit: ${mercury.orbitDistance?.toFixed(2)} units`)
    const scaledClearanceRatio = ((mercury.orbitDistance || 0) - sol.visualRadius) / sol.visualRadius
    console.log(`    Scaled clearance ratio: ${scaledClearanceRatio.toFixed(2)}x Sol radius`)
    
    console.log(`\n  ROOT CAUSE ANALYSIS:`)
    if (scaledClearanceRatio < realClearanceRatio * 0.5) {
      console.log(`    🚨 SCALING MISMATCH: Sol scaled up more than Mercury orbit scaled out`)
      console.log(`    🔧 FIX: Need to coordinate Sol visual size with inner planet orbits`)
    }
    
    if (sol.visualRadius > 20) {
      console.log(`    ⚠️  OVERSIZED SOL: Visual radius ${sol.visualRadius.toFixed(1)} may be too large`)
      console.log(`    🔧 FIX: Consider compressing star sizes or expanding inner orbits`)
    }
    
    // The issue is likely that our realistic size scaling made Sol huge
    // but didn't proportionally expand Mercury's orbit enough to compensate
    expect(scaledClearanceRatio).toBeGreaterThan(0)
  })
})