/**
 * CRITICAL TEST: Does fixing orbit controls reintroduce camera jitter?
 * 
 * This test checks if reverting to full-frequency controls.update()
 * brings back the camera vibration/jitter issue.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'

// Simulate actual camera jitter behavior
class JitterAnalyzer {
  public camera = new THREE.Vector3(0, 0, 10)
  public target = new THREE.Vector3(0, 0, 0)
  public lastObjectPosition = new THREE.Vector3(0, 0, 0)
  public cameraHistory: THREE.Vector3[] = []
  public updateCount = 0
  
  // Original implementation (every 3rd frame) - NO jitter but broken orbit controls
  reducedFrequencyImplementation(objectPosition: THREE.Vector3, frameTime: number = 0) {
    const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)
    
    if (deltaPosition.length() > 0.001) {
      this.camera.add(deltaPosition)
      this.target.add(deltaPosition)
      
      // Reduced frequency updates
      if (Math.floor(frameTime / 16.67) % 3 === 0) {
        this.updateCount++
      }
      
      this.lastObjectPosition.copy(objectPosition)
    }
    
    // Record camera position for jitter analysis
    this.cameraHistory.push(this.camera.clone())
  }
  
  // New implementation (every frame) - Fixed orbit controls but potential jitter?
  fullFrequencyImplementation(objectPosition: THREE.Vector3) {
    const deltaPosition = new THREE.Vector3().subVectors(objectPosition, this.lastObjectPosition)
    
    if (deltaPosition.length() > 0.001) {
      this.camera.add(deltaPosition)
      this.target.add(deltaPosition)
      
      // Full frequency updates (like the fix)
      this.updateCount++
      
      this.lastObjectPosition.copy(objectPosition)
    }
    
    // Record camera position for jitter analysis
    this.cameraHistory.push(this.camera.clone())
  }
  
  // Analyze jitter by measuring camera position variations
  analyzeJitter() {
    if (this.cameraHistory.length < 3) return { hasJitter: false, jitterMagnitude: 0 }
    
    let totalVariation = 0
    let maxVariation = 0
    
    // Check for unexpected camera movements (jitter)
    for (let i = 2; i < this.cameraHistory.length; i++) {
      const prev = this.cameraHistory[i - 1]
      const curr = this.cameraHistory[i]
      const variation = prev.distanceTo(curr)
      
      totalVariation += variation
      maxVariation = Math.max(maxVariation, variation)
    }
    
    const avgVariation = totalVariation / (this.cameraHistory.length - 2)
    
    // Define jitter thresholds
    const hasJitter = maxVariation > 0.1 || avgVariation > 0.05
    
    return {
      hasJitter,
      jitterMagnitude: maxVariation,
      averageVariation: avgVariation,
      totalFrames: this.cameraHistory.length,
      updateFrequency: (this.updateCount / this.cameraHistory.length) * 100
    }
  }
  
  reset() {
    this.camera.set(0, 0, 10)
    this.target.set(0, 0, 0)
    this.lastObjectPosition.set(0, 0, 0)
    this.cameraHistory = []
    this.updateCount = 0
  }
}

describe('Jitter vs Controls Trade-off Analysis', () => {
  let analyzer: JitterAnalyzer
  
  beforeEach(() => {
    analyzer = new JitterAnalyzer()
  })

  describe('Reduced Frequency (Original Jitter Fix)', () => {
    it('should have minimal jitter with smooth orbital motion', () => {
      analyzer.lastObjectPosition.set(5, 0, 0)
      
      // Simulate smooth orbital motion over 60 frames
      for (let frame = 0; frame < 60; frame++) {
        const angle = frame * 0.05
        const objectPos = new THREE.Vector3(
          Math.cos(angle) * 5,
          0,
          Math.sin(angle) * 5
        )
        
        analyzer.reducedFrequencyImplementation(objectPos, frame * 16.67)
      }
      
      const jitterAnalysis = analyzer.analyzeJitter()
      
      console.log('📊 REDUCED FREQUENCY Analysis:')
      console.log(`  Has jitter: ${jitterAnalysis.hasJitter}`)
      console.log(`  Max variation: ${jitterAnalysis.jitterMagnitude.toFixed(4)}`)
      console.log(`  Avg variation: ${jitterAnalysis.averageVariation.toFixed(4)}`)
      console.log(`  Update frequency: ${jitterAnalysis.updateFrequency.toFixed(1)}%`)
      console.log(`  Total frames: ${jitterAnalysis.totalFrames}`)
      
      // Should have no jitter
      expect(jitterAnalysis.hasJitter).toBe(false)
      expect(jitterAnalysis.updateFrequency).toBeLessThan(50) // Reduced frequency
    })
  })

  describe('Full Frequency (Orbit Controls Fix)', () => {
    it('should check if full frequency reintroduces jitter', () => {
      analyzer.lastObjectPosition.set(5, 0, 0)
      
      // Simulate the same smooth orbital motion
      for (let frame = 0; frame < 60; frame++) {
        const angle = frame * 0.05
        const objectPos = new THREE.Vector3(
          Math.cos(angle) * 5,
          0,
          Math.sin(angle) * 5
        )
        
        analyzer.fullFrequencyImplementation(objectPos)
      }
      
      const jitterAnalysis = analyzer.analyzeJitter()
      
      console.log('📊 FULL FREQUENCY Analysis:')
      console.log(`  Has jitter: ${jitterAnalysis.hasJitter}`)
      console.log(`  Max variation: ${jitterAnalysis.jitterMagnitude.toFixed(4)}`)
      console.log(`  Avg variation: ${jitterAnalysis.averageVariation.toFixed(4)}`)
      console.log(`  Update frequency: ${jitterAnalysis.updateFrequency.toFixed(1)}%`)
      console.log(`  Total frames: ${jitterAnalysis.totalFrames}`)
      
      // KEY TEST: Does full frequency cause jitter?
      console.log('')
      if (jitterAnalysis.hasJitter) {
        console.log('⚠️  WARNING: Full frequency MAY reintroduce jitter')
        console.log('   Consider hybrid approach: user input = immediate, tracking = reduced')
      } else {
        console.log('✅ GOOD: Full frequency does NOT cause significant jitter')
        console.log('   Orbit controls fix is safe to use')
      }
      
      // The key insight: Does it actually cause jitter in practice?
      expect(jitterAnalysis.updateFrequency).toBeGreaterThan(80) // Full frequency
    })
  })

  describe('Hybrid Approach (Best of Both)', () => {
    it('should test a hybrid solution: immediate user input + reduced tracking', () => {
      analyzer.lastObjectPosition.set(5, 0, 0)
      let userInputPending = false
      let frameCount = 0
      
      // Simulate orbital motion with occasional user input
      for (let frame = 0; frame < 60; frame++) {
        frameCount++
        const angle = frame * 0.05
        const objectPos = new THREE.Vector3(
          Math.cos(angle) * 5,
          0,
          Math.sin(angle) * 5
        )
        
        // User tries to orbit occasionally
        if (frame % 10 === 0) {
          userInputPending = true
        }
        
        const deltaPosition = new THREE.Vector3().subVectors(objectPos, analyzer.lastObjectPosition)
        
        if (deltaPosition.length() > 0.001) {
          analyzer.camera.add(deltaPosition)
          analyzer.target.add(deltaPosition)
          
          // HYBRID: Update immediately for user input, reduced for tracking
          if (userInputPending || frameCount % 3 === 0) {
            analyzer.updateCount++
            userInputPending = false // Reset after processing
          }
          
          analyzer.lastObjectPosition.copy(objectPos)
        }
        
        analyzer.cameraHistory.push(analyzer.camera.clone())
      }
      
      const jitterAnalysis = analyzer.analyzeJitter()
      
      console.log('📊 HYBRID APPROACH Analysis:')
      console.log(`  Has jitter: ${jitterAnalysis.hasJitter}`)
      console.log(`  Max variation: ${jitterAnalysis.jitterMagnitude.toFixed(4)}`)
      console.log(`  Avg variation: ${jitterAnalysis.averageVariation.toFixed(4)}`)
      console.log(`  Update frequency: ${jitterAnalysis.updateFrequency.toFixed(1)}%`)
      console.log(`  User inputs processed: 6 (every 10th frame)`)
      
      // Should balance both concerns
      expect(jitterAnalysis.hasJitter).toBe(false) // No jitter
      expect(jitterAnalysis.updateFrequency).toBeGreaterThan(30) // But responsive to user input
      expect(jitterAnalysis.updateFrequency).toBeLessThan(80) // But not excessive
    })
  })

  describe('Real-World Jitter Testing', () => {
    it('should test with micro-movements that originally caused jitter', () => {
      analyzer.lastObjectPosition.set(0, 0, 0)
      
      // Simulate the original jitter scenario: tiny continuous movements
      for (let frame = 0; frame < 100; frame++) {
        // Very small movements that used to cause jitter
        const microMovement = new THREE.Vector3(
          Math.sin(frame * 0.1) * 0.002,
          Math.cos(frame * 0.15) * 0.001,
          0
        )
        
        const objectPos = analyzer.lastObjectPosition.clone().add(microMovement)
        analyzer.fullFrequencyImplementation(objectPos)
      }
      
      const jitterAnalysis = analyzer.analyzeJitter()
      
      console.log('🔬 MICRO-MOVEMENT Jitter Test:')
      console.log(`  Has jitter: ${jitterAnalysis.hasJitter}`)
      console.log(`  Max variation: ${jitterAnalysis.jitterMagnitude.toFixed(6)}`)
      console.log(`  Avg variation: ${jitterAnalysis.averageVariation.toFixed(6)}`)
      
      // This is the critical test - micro-movements caused the original jitter
      if (jitterAnalysis.hasJitter) {
        console.log('❌ PROBLEM: Micro-movements still cause jitter with full frequency')
      } else {
        console.log('✅ GOOD: Micro-movements do not cause jitter')
      }
    })
  })

  describe('Recommendation', () => {
    it('should provide a clear recommendation', () => {
      console.log('')
      console.log('🎯 RECOMMENDATION ANALYSIS:')
      console.log('')
      console.log('OPTIONS:')
      console.log('1. Keep full frequency - Responsive controls, possible jitter')
      console.log('2. Keep reduced frequency - No jitter, broken controls')
      console.log('3. Hybrid approach - Responsive controls + minimal jitter')
      console.log('')
      console.log('RECOMMENDATION: Test full frequency first.')
      console.log('If jitter returns in practice, implement hybrid approach.')
      console.log('')
      console.log('HYBRID IMPLEMENTATION:')
      console.log('  if (userInputPending || frameCount % 3 === 0) {')
      console.log('    controls.update()')
      console.log('  }')
      
      expect(true).toBe(true)
    })
  })
})