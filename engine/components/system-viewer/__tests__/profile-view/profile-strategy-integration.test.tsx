import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { UnifiedCameraController } from '../../unified-camera-controller'
import { getViewModeStrategy } from '@/engine/core/view-modes/strategies/view-mode-registry'

// Mock Three.js and React Three Fiber
vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    clone: function() { return { ...this } },
    add: function(v) { return { x: this.x + v.x, y: this.y + v.y, z: this.z + v.z } },
    copy: function(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this },
    distanceTo: function(v) { return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2) },
    length: function() { return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2) }
  })),
  Object3D: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    userData: {},
    getWorldPosition: vi.fn((target) => {
      target.x = 0
      target.y = 0
      target.z = 0
      return target
    })
  }))
}))

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: {
      position: { copy: vi.fn(), set: vi.fn() }
    },
    controls: null,
    scene: { children: [] }
  }),
  useFrame: () => {}
}))

describe('Profile Strategy Integration', () => {
  let consoleLogSpy: any
  let originalConsoleLog: any

  beforeEach(() => {
    originalConsoleLog = console.log
    consoleLogSpy = vi.fn()
    console.log = consoleLogSpy
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('should successfully integrate ProfileStrategy with UnifiedCameraController', () => {
    // Test that the ProfileStrategy is accessible
    const profileStrategy = getViewModeStrategy('profile')
    expect(profileStrategy).toBeDefined()
    expect(profileStrategy.id).toBe('profile')
    expect(typeof profileStrategy.calculateCameraPosition).toBe('function')
  })

  it('should use ProfileStrategy when in profile mode', () => {
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

    const focusObject = new THREE.Object3D()
    focusObject.userData = { name: "Earth" }

    const objectRefsMap = {
      current: new Map([
        ["earth", focusObject],
        ["luna", new THREE.Object3D()]
      ])
    }

    render(
      <UnifiedCameraController
        focusObject={focusObject}
        focusName="Earth"
        viewMode="profile"
        systemData={systemData}
        objectRefsMap={objectRefsMap}
        onAnimationComplete={() => {}}
      />
    )

    // Check if ProfileStrategy integration logs appear
    setTimeout(() => {
      const strategyLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('Using ProfileStrategy for camera positioning')
      )
      expect(strategyLog).toBeDefined()
    }, 100)
  })

  it('should fall back to legacy logic if ProfileStrategy fails', () => {
    // Mock a failing ProfileStrategy
    const originalGetViewModeStrategy = getViewModeStrategy
    vi.mocked(getViewModeStrategy).mockImplementation((viewMode) => {
      if (viewMode === 'profile') {
        return {
          ...originalGetViewModeStrategy(viewMode),
          calculateCameraPosition: () => { throw new Error('Test failure') }
        }
      }
      return originalGetViewModeStrategy(viewMode)
    })

    const systemData = {
      objects: [
        {
          id: "earth",
          name: "Earth",
          classification: "planet",
          orbit: { parent: "sol-star" }
        }
      ]
    }

    const focusObject = new THREE.Object3D()
    focusObject.userData = { name: "Earth" }

    const objectRefsMap = {
      current: new Map([["earth", focusObject]])
    }

    render(
      <UnifiedCameraController
        focusObject={focusObject}
        focusName="Earth"
        viewMode="profile"
        systemData={systemData}
        objectRefsMap={objectRefsMap}
        onAnimationComplete={() => {}}
      />
    )

    setTimeout(() => {
      const fallbackLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('ProfileStrategy failed, falling back to legacy logic')
      )
      expect(fallbackLog).toBeDefined()
    }, 100)
  })

  it('should handle profile mode correctly for objects with moons', () => {
    const profileStrategy = getViewModeStrategy('profile')
    
    // Create mock layout info for Earth-Luna system
    const focusObject = new THREE.Object3D()
    const lunaObject = new THREE.Object3D()
    
    const layoutInfo = {
      focusObject,
      focusObjectId: "earth",
      focusObjectName: "Earth",
      visualRadius: 1,
      orbitRadius: 100,
      childObjects: [lunaObject],
      siblingObjects: [],
      systemBounds: {
        min: new THREE.Vector3(-10, -10, -10),
        max: new THREE.Vector3(10, 10, 10),
        center: new THREE.Vector3(0, 0, 0)
      }
    }
    
    const systemContext = {
      totalObjects: 2,
      maxOrbitalRadius: 100,
      minOrbitalRadius: 1,
      hasMultipleStars: false,
      hasMoons: true,
      systemComplexity: 'moderate' as const
    }
    
    // Get view config (using mock or actual)
    const viewConfig = {
      camera: {
        elevationAngles: { profile: 45 },
        animationDuration: { standard: 1000 }
      },
      animation: {
        easingFunctions: { smooth: 'smooth' }
      }
    }
    
    const result = profileStrategy.calculateCameraPosition(
      layoutInfo,
      systemContext,
      viewConfig as any
    )
    
    expect(result).toBeDefined()
    expect(result.position).toBeDefined()
    expect(result.target).toBeDefined()
    expect(result.distance).toBeGreaterThan(0)
  })

  it('should properly integrate strategy system with existing architecture', () => {
    // Test that the new strategy integration doesn't break existing functionality
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

    const focusObject = new THREE.Object3D()
    focusObject.userData = { name: "Mercury" }

    const objectRefsMap = {
      current: new Map([["mercury", focusObject]])
    }

    render(
      <UnifiedCameraController
        focusObject={focusObject}
        focusName="Mercury"
        viewMode="profile"
        systemData={systemData}
        objectRefsMap={objectRefsMap}
        onAnimationComplete={() => {}}
      />
    )

    // Should not crash and should attempt ProfileStrategy integration
    setTimeout(() => {
      const profileModeLog = consoleLogSpy.mock.calls.find((call: any[]) => 
        call[0]?.includes('VIEW MODE CHANGE TO PROFILE')
      )
      expect(profileModeLog).toBeDefined()
    }, 100)
  })
})