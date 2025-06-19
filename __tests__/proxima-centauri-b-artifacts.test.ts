/**
 * PROXIMA CENTAURI B VISUAL ARTIFACTS INVESTIGATION
 * ================================================
 * 
 * Thorough investigation of visual artifacts with the gravity wave selector effect
 * on Proxima Centauri B, particularly when paused. This test analyzes the specific
 * conditions that could cause shader artifacts or visual glitches.
 */

import { describe, it, expect } from 'vitest'
import { calculateSystemOrbitalMechanics } from '../engine/utils/orbital-mechanics-calculator'
import type { CelestialObject } from '../engine/types/orbital-system'

describe('Proxima Centauri B Visual Artifacts Investigation', () => {
  
  let proximaCentauriSystem: CelestialObject[]
  
  beforeEach(() => {
    // Recreate the exact Proxima Centauri system data
    proximaCentauriSystem = [
      {
        id: 'proxima-centauri-star',
        name: 'Proxima Centauri',
        classification: 'star',
        geometry_type: 'star',
        properties: {
          mass: 0.12,
          radius: 695700, // Same as Sol but much lower mass
          temperature: 3240, // Red dwarf temperature
          luminosity: 0.0055,
          spectral_type: 'M5V',
          flare_activity: 0.8, // High flare activity
          core_color: '#ff3300',
          corona_color: '#ff6633'
        },
        position: [0, 0, 0]
      },
      {
        id: 'proxima-b',
        name: 'Proxima b',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: {
          mass: 1.3, // Super-Earth mass
          radius: 6371, // Earth-like radius
          temperature: 234,
          tidal_lock: true, // CRITICAL: Tidally locked!
          tectonics: 0.7,
          vulcanism: 0.3,
          ocean_coverage: 0.3,
          surface_color: '#4b8975',
          habitability: 'potentially_habitable'
        },
        orbit: {
          parent: 'proxima-centauri-star',
          semi_major_axis: 0.05, // CRITICAL: Extremely close orbit!
          eccentricity: 0.11,
          inclination: 0,
          orbital_period: 11.2 // Very fast orbit
        }
      }
    ]
  })

  describe('Orbital Mechanics Analysis', () => {
    it('should analyze Proxima B orbital mechanics across view modes', () => {
      const viewModes = ['explorational', 'navigational', 'profile', 'scientific'] as const
      
      console.log('\n🪐 PROXIMA CENTAURI B ORBITAL ANALYSIS:')
      console.log('  Critical Properties:')
      console.log('    - Orbital Distance: 0.05 AU (extremely close!)')
      console.log('    - Period: 11.2 days (very fast)')
      console.log('    - Tidally Locked: true')
      console.log('    - Host Star: Red dwarf with high flare activity')
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(proximaCentauriSystem, viewMode)
        const proximaBMechanics = mechanics.get('proxima-b')
        const starMechanics = mechanics.get('proxima-centauri-star')
        
        if (proximaBMechanics && starMechanics) {
          console.log(`\n  ${viewMode.toUpperCase()} MODE:`)
          console.log(`    Planet Visual Size: ${proximaBMechanics.visualRadius.toFixed(6)} units`)
          console.log(`    Planet Orbit Distance: ${proximaBMechanics.orbitDistance?.toFixed(6)} units`)
          console.log(`    Star Visual Size: ${starMechanics.visualRadius.toFixed(6)} units`)
          
          // Calculate proximity ratio
          const proximityRatio = (proximaBMechanics.orbitDistance || 0) / starMechanics.visualRadius
          console.log(`    Proximity Ratio: ${proximityRatio.toFixed(2)}x (orbit/star_radius)`)
          
          // Flag potential issues
          if (proximityRatio < 5) {
            console.log(`    ⚠️  WARNING: Planet orbits very close to star visual boundary!`)
          }
          
          expect(proximaBMechanics.visualRadius).toBeGreaterThan(0)
          expect(proximaBMechanics.orbitDistance).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('Gravity Wave Selector Shader Analysis', () => {
    it('should analyze potential shader issues with close-orbit planets', () => {
      console.log('\n🌊 GRAVITY WAVE SHADER ANALYSIS:')
      
      const viewModes = ['explorational', 'scientific'] as const
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(proximaCentauriSystem, viewMode)
        const proximaBMechanics = mechanics.get('proxima-b')
        
        if (proximaBMechanics) {
          const planetRadius = proximaBMechanics.visualRadius
          const orbitDistance = proximaBMechanics.orbitDistance || 0
          
          // Simulate space curvature material calculations from the shader
          const wellRadius = planetRadius * 6.0 // From shader: wellRadius = sphereRadius * 6.0
          const maxDepth = planetRadius * 0.72   // From shader: maxDepth = sphereRadius * 0.72
          const gridSpacing = planetRadius * 2.0 // From shader: gridSpacing = sphereRadius * 2.0
          
          console.log(`\n  ${viewMode.toUpperCase()} MODE SHADER PARAMETERS:`)
          console.log(`    Planet Radius: ${planetRadius.toFixed(6)} units`)
          console.log(`    Orbit Distance: ${orbitDistance.toFixed(6)} units`)
          console.log(`    Gravity Well Radius: ${wellRadius.toFixed(6)} units`)
          console.log(`    Well Max Depth: ${maxDepth.toFixed(6)} units`)
          console.log(`    Grid Spacing: ${gridSpacing.toFixed(6)} units`)
          
          // Check for potential shader issues
          const wellOverlapsOrbit = wellRadius > orbitDistance * 0.5
          const gridTooFine = gridSpacing < 0.001
          const depthTooShallow = maxDepth < 0.0001
          
          console.log(`\n    Potential Issues:`)
          console.log(`      Well overlaps orbit path: ${wellOverlapsOrbit ? '🔴 YES' : '🟢 NO'}`)
          console.log(`      Grid too fine (< 0.001): ${gridTooFine ? '🔴 YES' : '🟢 NO'}`)
          console.log(`      Depth too shallow (< 0.0001): ${depthTooShallow ? '🔴 YES' : '🟢 NO'}`)
          
          // Calculate grid aliasing potential
          const gridAliasing = gridSpacing / orbitDistance
          console.log(`      Grid/Orbit ratio: ${gridAliasing.toFixed(4)} (${gridAliasing > 0.1 ? '🔴 HIGH ALIASING' : '🟢 OK'})`)
          
          if (wellOverlapsOrbit || gridTooFine || depthTooShallow || gridAliasing > 0.1) {
            console.log(`    🚨 POTENTIAL SHADER ARTIFACTS DETECTED!`)
          }
        }
      })
    })
  })

  describe('Movement Detection Analysis', () => {
    it('should analyze movement detection issues with fast close orbits', () => {
      console.log('\n🏃 MOVEMENT DETECTION ANALYSIS:')
      console.log('  Proxima B has 11.2-day orbital period - very fast!')
      
      const viewModes = ['explorational', 'scientific'] as const
      const timeMultipliers = [0.1, 1.0, 5.0]
      
      viewModes.forEach(viewMode => {
        const mechanics = calculateSystemOrbitalMechanics(proximaCentauriSystem, viewMode)
        const proximaBMechanics = mechanics.get('proxima-b')
        
        if (proximaBMechanics) {
          const orbitRadius = proximaBMechanics.orbitDistance || 0
          const orbitalPeriod = 11.2 // days
          const visualSize = proximaBMechanics.visualRadius
          
          console.log(`\n  ${viewMode.toUpperCase()} MODE:`)
          console.log(`    Visual Size: ${visualSize.toFixed(6)} units`)
          console.log(`    Orbit Radius: ${orbitRadius.toFixed(6)} units`)
          
          timeMultipliers.forEach(multiplier => {
            // Calculate movement per frame
            const periodSeconds = orbitalPeriod * 24 * 3600
            const circumference = 2 * Math.PI * orbitRadius
            const movementPerSecond = circumference / (periodSeconds / multiplier)
            const movementPerFrame = movementPerSecond / 60 // 60 fps
            
            // Calculate adaptive threshold (from our fix)
            const adaptiveThreshold = Math.max(visualSize * 0.01, 1e-6)
            
            const detected = movementPerFrame >= adaptiveThreshold
            const ratio = movementPerFrame / adaptiveThreshold
            
            console.log(`    ${multiplier.toFixed(1)}x speed:`)
            console.log(`      Movement/frame: ${movementPerFrame.toExponential(3)} units`)
            console.log(`      Adaptive threshold: ${adaptiveThreshold.toExponential(3)} units`)
            console.log(`      Detection: ${detected ? '✅ DETECTED' : '❌ IGNORED'} (${ratio.toFixed(3)}x threshold)`)
            
            // Check for potential jitter from too frequent detection
            if (detected && ratio > 100) {
              console.log(`      ⚠️  Very frequent movement detection - potential for visual artifacts!`)
            }
          })
        }
      })
    })
  })

  describe('Floating Point Precision Analysis', () => {
    it('should check for floating point precision issues with extreme parameters', () => {
      console.log('\n🔢 FLOATING POINT PRECISION ANALYSIS:')
      
      const mechanics = calculateSystemOrbitalMechanics(proximaCentauriSystem, 'scientific')
      const proximaBMechanics = mechanics.get('proxima-b')
      
      if (proximaBMechanics) {
        const visualSize = proximaBMechanics.visualRadius
        const orbitDistance = proximaBMechanics.orbitDistance || 0
        
        // Test calculations that might cause precision issues
        const precisionTests = [
          {
            name: 'Visual Size',
            value: visualSize,
            precision: 'single',
            threshold: 1e-6
          },
          {
            name: 'Orbit Distance',
            value: orbitDistance,
            precision: 'single', 
            threshold: 1e-6
          },
          {
            name: 'Orbit/Visual Ratio',
            value: orbitDistance / visualSize,
            precision: 'calculation',
            threshold: 1000
          },
          {
            name: 'Grid Spacing (2x visual)',
            value: visualSize * 2.0,
            precision: 'shader',
            threshold: 1e-7
          },
          {
            name: 'Well Radius (6x visual)',
            value: visualSize * 6.0,
            precision: 'shader',
            threshold: 1e-7
          }
        ]
        
        console.log(`  Scientific Mode Precision Analysis:`)
        
        precisionTests.forEach(test => {
          const tooSmall = test.value < test.threshold
          const hasNaN = isNaN(test.value) || !isFinite(test.value)
          
          console.log(`    ${test.name}: ${test.value.toExponential(4)}`)
          console.log(`      Status: ${hasNaN ? '🔴 NaN/Infinite' : tooSmall ? '🟡 Below threshold' : '✅ OK'}`)
          
          if (hasNaN) {
            console.log(`      🚨 CRITICAL: NaN/Infinite values will cause shader artifacts!`)
          }
          
          expect(isFinite(test.value)).toBe(true)
          expect(isNaN(test.value)).toBe(false)
        })
        
        // Test for potential shader uniform overflow
        const shaderUniforms = {
          spherePosition: [orbitDistance, 0, 0], // Planet position
          sphereRadius: visualSize,
          time: 0.0, // When paused
          intensity: 1.0
        }
        
        console.log(`\n  Shader Uniform Values:`)
        Object.entries(shaderUniforms).forEach(([name, value]) => {
          console.log(`    ${name}: ${Array.isArray(value) ? value.map(v => v.toExponential(3)).join(', ') : value}`)
        })
      }
    })
  })

  describe('Tidal Locking Effects', () => {
    it('should analyze potential issues with tidally locked planets', () => {
      console.log('\n🔒 TIDAL LOCKING ANALYSIS:')
      console.log('  Proxima B is tidally locked - one face always toward star')
      
      const mechanics = calculateSystemOrbitalMechanics(proximaCentauriSystem, 'explorational')
      const proximaBMechanics = mechanics.get('proxima-b')
      
      if (proximaBMechanics) {
        console.log(`\n  Tidal Locking Considerations:`)
        console.log(`    - Planet doesn't rotate relative to star`)
        console.log(`    - Always same hemisphere faces star`)
        console.log(`    - Could affect shader time calculations`)
        console.log(`    - Gravity wave effect should remain static when paused`)
        
        // Check if the planet's static nature could cause shader artifacts
        const isStaticWhenPaused = true // When paused, no movement
        const hasRotation = false // Tidally locked
        
        console.log(`\n  Artifact Potential:`)
        console.log(`    Static when paused: ${isStaticWhenPaused ? '✅ Expected' : '❌ Unexpected'}`)
        console.log(`    No rotation: ${hasRotation ? '❌ Has rotation' : '✅ Tidally locked'}`)
        
        if (isStaticWhenPaused && !hasRotation) {
          console.log(`    ✅ Gravity wave effect should be completely static when paused`)
          console.log(`    🔍 If artifacts still occur, issue is likely in shader calculations`)
        }
      }
    })
  })

  describe('Root Cause Hypothesis', () => {
    it('should propose most likely causes of visual artifacts', () => {
      console.log('\n🕵️ ROOT CAUSE HYPOTHESIS:')
      
      const mechanics = calculateSystemOrbitalMechanics(proximaCentauriSystem, 'scientific')
      const proximaBMechanics = mechanics.get('proxima-b')
      
      if (proximaBMechanics) {
        const visualSize = proximaBMechanics.visualRadius
        const orbitDistance = proximaBMechanics.orbitDistance || 0
        const wellRadius = visualSize * 6.0
        
        console.log(`\n  Most Likely Causes of Visual Artifacts:`)
        
        const causes = [
          {
            cause: 'Extremely small visual size in scientific mode',
            likelihood: visualSize < 1e-4 ? 'HIGH' : 'LOW',
            value: visualSize,
            description: 'Tiny planets may cause shader precision issues'
          },
          {
            cause: 'Close orbit causing grid aliasing',
            likelihood: (wellRadius / orbitDistance) > 0.3 ? 'HIGH' : 'LOW',
            value: wellRadius / orbitDistance,
            description: 'Gravity well grid overlaps orbital path'
          },
          {
            cause: 'Adaptive threshold too sensitive',
            likelihood: (Math.max(visualSize * 0.01, 1e-6) < 1e-5) ? 'MEDIUM' : 'LOW',
            value: Math.max(visualSize * 0.01, 1e-6),
            description: 'Movement detection triggers on micro-movements'
          },
          {
            cause: 'Near plane clipping',
            likelihood: (visualSize * 4.0) < 0.001 ? 'HIGH' : 'LOW',
            value: visualSize * 4.0,
            description: 'Camera too close to object for current near plane'
          }
        ]
        
        causes.forEach((cause, index) => {
          console.log(`\n  ${index + 1}. ${cause.cause}`)
          console.log(`     Likelihood: ${cause.likelihood}`)
          console.log(`     Value: ${cause.value.toExponential(3)}`)
          console.log(`     Description: ${cause.description}`)
        })
        
        // Determine most likely cause
        const highLikelihoodCauses = causes.filter(c => c.likelihood === 'HIGH')
        if (highLikelihoodCauses.length > 0) {
          console.log(`\n  🎯 MOST LIKELY CAUSE: ${highLikelihoodCauses[0].cause}`)
        }
      }
    })
  })
})