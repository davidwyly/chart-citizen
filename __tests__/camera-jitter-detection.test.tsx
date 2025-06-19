/**
 * Tests to detect and prevent camera jitter/vibration when tracking orbital objects
 * 
 * ROOT CAUSE: Camera directly following orbital objects that update position every frame
 * causes micro-movements that accumulate into visible vibration/jitter.
 */

import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import * as THREE from 'three'
import React from 'react'
import { UnifiedCameraController } from '@/engine/components/system-viewer/unified-camera-controller'

// Mock Three.js and R3F
const mockCamera = {
  position: new THREE.Vector3(0, 0, 10),
  lookAt: vi.fn(),
  updateProjectionMatrix: vi.fn()
}

const mockControls = {
  target: new THREE.Vector3(0, 0, 0),
  enabled: true,
  update: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber')
  return {
    ...actual,
    Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useThree: () => ({
      camera: mockCamera,
      scene: new THREE.Scene(),
      controls: mockControls
    }),
    useFrame: (callback: (state: any, delta: number) => void) => {
      // Store the callback for manual triggering
      (globalThis as any).__useFrameCallback = callback
    }
  }
})

// Helper to simulate multiple frames
function simulateFrames(count: number, deltaTime: number = 0.016) {
  const callback = (globalThis as any).__useFrameCallback
  if (callback) {
    for (let i = 0; i < count; i++) {
      callback({}, deltaTime)
    }
  }
}

// Mock orbital object that moves continuously (like moons)
const createOrbitalObject = () => {
  let angle = 0
  const radius = 5
  
  const object = {
    position: new THREE.Vector3(),
    getWorldPosition: vi.fn((target: THREE.Vector3) => {
      // Simulate orbital motion
      angle += 0.01 // Small movement each frame
      target.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      )
      return target
    }),
    userData: { name: 'TestMoon' }
  }
  
  return object
}

describe('Camera Jitter Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCamera.position.set(0, 0, 10)
    mockControls.target.set(0, 0, 0)
    mockControls.update.mockClear()
  })

  it('should detect excessive camera movement when tracking orbital objects', () => {
    const orbitalObject = createOrbitalObject()
    
    render(
      <Canvas>
        <UnifiedCameraController
          focusObject={orbitalObject as any}
          focusName="TestMoon"
          viewMode="explorational"
        />
      </Canvas>
    )

    // Record initial camera position
    const initialPosition = mockCamera.position.clone()
    
    // Simulate 60 frames (1 second at 60fps)
    const positionHistory: THREE.Vector3[] = []
    
    for (let frame = 0; frame < 60; frame++) {
      simulateFrames(1)
      positionHistory.push(mockCamera.position.clone())
    }
    
    // Calculate movement deltas between frames
    const movementDeltas: number[] = []
    for (let i = 1; i < positionHistory.length; i++) {
      const delta = positionHistory[i].distanceTo(positionHistory[i - 1])
      movementDeltas.push(delta)
    }
    
    // Check for jitter indicators:
    // 1. High frequency of tiny movements
    const tinyMovements = movementDeltas.filter(delta => delta > 0 && delta < 0.01).length
    // 2. Excessive controls.update() calls
    const controlsUpdateCalls = mockControls.update.mock.calls.length
    
    console.log('📊 Jitter Analysis:')
    console.log(`  Tiny movements (< 0.01 units): ${tinyMovements}/${movementDeltas.length}`)
    console.log(`  Controls update calls: ${controlsUpdateCalls}`)
    console.log(`  Average movement per frame: ${movementDeltas.reduce((a, b) => a + b, 0) / movementDeltas.length}`)
    
    // JITTER DETECTION: If more than 50% of frames have tiny movements, it's jitter
    expect(tinyMovements / movementDeltas.length).toBeLessThan(0.5)
    
    // PERFORMANCE: Controls shouldn't update more than once per frame on average
    expect(controlsUpdateCalls).toBeLessThan(60)
  })

  it('should demonstrate smooth camera movement with properly implemented following', () => {
    const orbitalObject = createOrbitalObject()
    
    render(
      <Canvas>
        <UnifiedCameraController
          focusObject={orbitalObject as any}
          focusName="TestMoon"
          viewMode="explorational"
        />
      </Canvas>
    )

    // Test that camera follows smoothly with interpolation
    const initialCameraPos = mockCamera.position.clone()
    
    // Simulate orbital object moving to new position
    simulateFrames(30) // Half second
    
    const finalCameraPos = mockCamera.position.clone()
    const totalMovement = finalCameraPos.distanceTo(initialCameraPos)
    
    // Camera should move smoothly (not jitter in place)
    expect(totalMovement).toBeGreaterThan(0.1) // Should actually follow
    expect(totalMovement).toBeLessThan(2.0) // But not jump wildly
  })

  it('should not trigger camera updates when object movement is below threshold', () => {
    const stationaryObject = {
      position: new THREE.Vector3(5, 0, 0),
      getWorldPosition: vi.fn((target: THREE.Vector3) => {
        // Very tiny movement (noise level)
        target.set(5 + Math.random() * 0.0005, 0, 0)
        return target
      }),
      userData: { name: 'StationaryObject' }
    }
    
    render(
      <Canvas>
        <UnifiedCameraController
          focusObject={stationaryObject as any}
          focusName="StationaryObject"
          viewMode="explorational"
        />
      </Canvas>
    )

    // Record initial state
    mockControls.update.mockClear()
    const initialCameraPos = mockCamera.position.clone()
    
    // Simulate frames with tiny movements
    simulateFrames(30)
    
    const finalCameraPos = mockCamera.position.clone()
    const cameraMovement = finalCameraPos.distanceTo(initialCameraPos)
    const controlsUpdates = mockControls.update.mock.calls.length
    
    // Camera should not move for tiny object movements
    expect(cameraMovement).toBeLessThan(0.01)
    // Controls should not update frequently for stationary objects
    expect(controlsUpdates).toBeLessThan(5)
  })

  it('should use smooth interpolation instead of direct position copying', () => {
    const orbitalObject = createOrbitalObject()
    
    render(
      <Canvas>
        <UnifiedCameraController
          focusObject={orbitalObject as any}
          focusName="TestMoon"
          viewMode="explorational"
        />
      </Canvas>
    )

    // Simulate large sudden movement (like object teleporting)
    const originalGetWorldPosition = orbitalObject.getWorldPosition
    orbitalObject.getWorldPosition = vi.fn((target: THREE.Vector3) => {
      target.set(20, 0, 0) // Large jump
      return target
    })
    
    const initialCameraPos = mockCamera.position.clone()
    
    // Simulate one frame with large movement
    simulateFrames(1)
    
    const cameraMovement = mockCamera.position.distanceTo(initialCameraPos)
    
    // Camera should interpolate smoothly, not jump immediately
    expect(cameraMovement).toBeLessThan(5) // Should not jump the full distance immediately
    expect(cameraMovement).toBeGreaterThan(0) // But should start moving
    
    // Restore original function
    orbitalObject.getWorldPosition = originalGetWorldPosition
  })
})