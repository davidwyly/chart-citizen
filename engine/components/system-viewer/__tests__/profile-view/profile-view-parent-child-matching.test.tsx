import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { UnifiedCameraController } from '../../unified-camera-controller'
import { MockSystemData } from '../__mocks__/system-data'

// Mock Three.js
vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    clone: function() { return { ...this } },
    add: function(v) { return { x: this.x + v.x, y: this.y + v.y, z: this.z + v.z } },
    distanceTo: function(v) { return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2) },
    length: function() { return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2) }
  })),
  Object3D: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    getWorldPosition: vi.fn((target) => {
      target.x = 0
      target.y = 0
      target.z = 0
    })
  }))
}))

describe('Profile View Parent-Child Matching', () => {
  let consoleLogSpy: any
  let originalConsoleLog: any

  beforeEach(() => {
    originalConsoleLog = console.log
    consoleLogSpy = vi.fn()
    console.log = consoleLogSpy
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('should correctly identify moons as children of planets', () => {
    const systemData = {
      objects: [
        {
          id: "earth",
          name: "Earth",
          classification: "planet",
          orbit: { parent: "sol-star" }
        },
        {
          id: "luna",
          name: "Luna",
          classification: "moon",
          orbit: { parent: "earth" }
        }
      ]
    }

    const objectRefsMap = {
      current: new Map([
        ["earth", new THREE.Object3D()],
        ["luna", new THREE.Object3D()]
      ])
    }

    // Render the camera controller in profile mode
    render(
      <UnifiedCameraController
        focusedObjectId="earth"
        viewMode="profile"
        systemData={systemData}
        objectRefsMap={objectRefsMap}
        onCameraReady={() => {}}
        onOrthographicToggle={() => {}}
        cameraDistance={100}
        isPaused={false}
      />
    )

    // Wait for the effect to run
    setTimeout(() => {
      // Check console logs for parent-child matching
      const childrenLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('Found') && call[0]?.includes('children')
      )
      
      expect(childrenLog).toBeDefined()
      expect(childrenLog[1]).toBe(1) // Should find 1 child (Luna)
      expect(childrenLog[3]).toContain('Luna')
      
      // Should NOT log "No children found"
      const noChildrenLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('No children found')
      )
      expect(noChildrenLog).toBeUndefined()
    }, 100)
  })

  it('should handle different ID formats for parent matching', () => {
    const systemData = {
      objects: [
        {
          id: "earth-planet",  // Different ID format
          name: "Earth",
          classification: "planet",
          orbit: { parent: "sol-star" }
        },
        {
          id: "luna",
          name: "Luna",
          classification: "moon",
          orbit: { parent: "earth" }  // Parent doesn't match earth-planet
        }
      ]
    }

    const objectRefsMap = {
      current: new Map([
        ["earth-planet", new THREE.Object3D()],
        ["luna", new THREE.Object3D()]
      ])
    }

    render(
      <UnifiedCameraController
        focusedObjectId="earth-planet"
        viewMode="profile"
        systemData={systemData}
        objectRefsMap={objectRefsMap}
        onCameraReady={() => {}}
        onOrthographicToggle={() => {}}
        cameraDistance={100}
        isPaused={false}
      />
    )

    setTimeout(() => {
      // This test should FAIL if our hypothesis is correct
      // It should find 0 children because "earth" !== "earth-planet"
      const childrenLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('Found') && call[0]?.includes('children')
      )
      
      expect(childrenLog).toBeDefined()
      expect(childrenLog[1]).toBe(0) // Should find 0 children due to ID mismatch
      
      // Should log "No children found"
      const noChildrenLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('No children found')
      )
      expect(noChildrenLog).toBeDefined()
    }, 100)
  })

  it('should work correctly for objects without moons', () => {
    const systemData = {
      objects: [
        {
          id: "mercury",
          name: "Mercury",
          classification: "planet",
          orbit: { parent: "sol-star" }
        }
      ]
    }

    const objectRefsMap = {
      current: new Map([
        ["mercury", new THREE.Object3D()]
      ])
    }

    render(
      <UnifiedCameraController
        focusedObjectId="mercury"
        viewMode="profile"
        systemData={systemData}
        objectRefsMap={objectRefsMap}
        onCameraReady={() => {}}
        onOrthographicToggle={() => {}}
        cameraDistance={100}
        isPaused={false}
      />
    )

    setTimeout(() => {
      const childrenLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('Found') && call[0]?.includes('children')
      )
      
      expect(childrenLog).toBeDefined()
      expect(childrenLog[1]).toBe(0) // Should find 0 children (correct)
      
      // Should log "No children found" (which is correct for Mercury)
      const noChildrenLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('No children found')
      )
      expect(noChildrenLog).toBeDefined()
    }, 100)
  })
})