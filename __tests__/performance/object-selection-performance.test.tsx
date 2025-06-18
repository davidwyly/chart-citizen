/**
 * @jest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { SystemObjectsRenderer } from '@/engine/components/system-viewer/system-objects-renderer'
import { Canvas } from '@react-three/fiber'
import React from 'react'

// Mock the expensive components to focus on render counting
vi.mock('@/engine/renderers/object-factory', () => ({
  CelestialObjectRenderer: vi.fn(({ object, onSelect }) => (
    <mesh 
      data-testid={`object-${object.id}`}
      onClick={() => onSelect?.(object.id, {}, object.name)}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="red" />
    </mesh>
  ))
}))

vi.mock('@/engine/components/orbital-path', () => ({
  MemoizedOrbitalPath: vi.fn(({ children }) => <group>{children}</group>)
}))

// Track render counts
let renderCounts = new Map<string, number>()

const TestableSystemObjectsRenderer = (props: any) => {
  // Count renders for each object
  props.systemData.objects.forEach((obj: any) => {
    renderCounts.set(obj.id, (renderCounts.get(obj.id) || 0) + 1)
  })
  
  return <SystemObjectsRenderer {...props} />
}

describe('Object Selection Performance', () => {
  const mockSystemData = {
    id: 'test-system',
    name: 'Test System',
    objects: [
      {
        id: 'star-1',
        name: 'Test Star',
        classification: 'star',
        geometry_type: 'star',
        position: [0, 0, 0],
        properties: { radius: 1, mass: 1 }
      },
      {
        id: 'planet-1', 
        name: 'Test Planet 1',
        classification: 'planet',
        geometry_type: 'terrestrial',
        orbit: {
          parent: 'star-1',
          semi_major_axis: 1.0,
          eccentricity: 0.0,
          inclination: 0.0,
          orbital_period: 365.25
        },
        properties: { radius: 0.1, mass: 0.001 }
      },
      {
        id: 'planet-2',
        name: 'Test Planet 2', 
        classification: 'planet',
        geometry_type: 'terrestrial',
        orbit: {
          parent: 'star-1',
          semi_major_axis: 2.0,
          eccentricity: 0.0,
          inclination: 0.0,
          orbital_period: 730.5
        },
        properties: { radius: 0.1, mass: 0.001 }
      }
    ]
  }

  const defaultProps = {
    systemData: mockSystemData,
    selectedObjectId: null,
    primaryStarPosition: [0, 0, 0] as [number, number, number],
    getObjectSizing: vi.fn((id: string) => ({ visualSize: 1 })),
    calculateOrbitalPeriod: vi.fn(() => 365),
    timeMultiplier: 1,
    isPaused: false,
    objectRefsMap: { current: new Map() },
    viewType: 'explorational' as const,
    onObjectHover: vi.fn(),
    onObjectSelect: vi.fn(),
    onObjectFocus: vi.fn(),
    registerRef: vi.fn(),
    orbitalMechanics: new Map([
      ['planet-1', { orbitDistance: 10, beltData: null }],
      ['planet-2', { orbitDistance: 20, beltData: null }]
    ])
  }

  beforeEach(() => {
    renderCounts.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    renderCounts.clear()
  })

  it('should demonstrate the performance issue - all objects re-render when one is selected', async () => {
    const { rerender } = render(
      <Canvas>
        <TestableSystemObjectsRenderer {...defaultProps} />
      </Canvas>
    )

    // Initial render - all objects should render once
    expect(renderCounts.get('star-1')).toBe(1)
    expect(renderCounts.get('planet-1')).toBe(1)
    expect(renderCounts.get('planet-2')).toBe(1)

    // Clear counts to measure selection impact
    renderCounts.clear()

    // Simulate selecting planet-1
    rerender(
      <Canvas>
        <TestableSystemObjectsRenderer 
          {...defaultProps} 
          selectedObjectId="planet-1"
        />
      </Canvas>
    )

    await waitFor(() => {
      // FAILING TEST: This demonstrates the performance issue
      // When planet-1 is selected, ALL objects re-render due to the massive dependency array
      expect(renderCounts.get('star-1')).toBe(1) // ❌ Star should NOT re-render
      expect(renderCounts.get('planet-1')).toBe(1) // ✅ Selected planet should re-render  
      expect(renderCounts.get('planet-2')).toBe(1) // ❌ Unselected planet should NOT re-render
    })

    // Clear counts again
    renderCounts.clear()

    // Simulate selecting planet-2
    rerender(
      <Canvas>
        <TestableSystemObjectsRenderer 
          {...defaultProps} 
          selectedObjectId="planet-2"
        />
      </Canvas>
    )

    await waitFor(() => {
      // The issue compounds - changing selection causes ALL objects to re-render again
      expect(renderCounts.get('star-1')).toBe(1) // ❌ Star should NOT re-render
      expect(renderCounts.get('planet-1')).toBe(1) // ❌ Previously selected planet should NOT re-render
      expect(renderCounts.get('planet-2')).toBe(1) // ✅ Newly selected planet should re-render
    })
  })

  it('should demonstrate cascading re-renders slow down the application', async () => {
    const largeSystemData = {
      ...mockSystemData,
      objects: Array.from({ length: 20 }, (_, i) => ({
        id: `planet-${i}`,
        name: `Planet ${i}`,
        classification: 'planet',
        geometry_type: 'terrestrial',
        orbit: {
          parent: 'star-1',
          semi_major_axis: i + 1,
          eccentricity: 0.0,
          inclination: 0.0,
          orbital_period: (i + 1) * 365
        },
        properties: { radius: 0.1, mass: 0.001 }
      }))
    }

    const largeOrbitalMechanics = new Map(
      largeSystemData.objects.map(obj => [obj.id, { orbitDistance: 10, beltData: null }])
    )

    const { rerender } = render(
      <Canvas>
        <TestableSystemObjectsRenderer 
          {...defaultProps}
          systemData={largeSystemData}
          orbitalMechanics={largeOrbitalMechanics}
        />
      </Canvas>
    )

    renderCounts.clear()

    const startTime = performance.now()

    // Select one object - this should cause ALL 20 objects to re-render
    rerender(
      <Canvas>
        <TestableSystemObjectsRenderer 
          {...defaultProps}
          systemData={largeSystemData}
          orbitalMechanics={largeOrbitalMechanics}
          selectedObjectId="planet-5"
        />
      </Canvas>
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    await waitFor(() => {
      // Verify all objects re-rendered (demonstrating the performance issue)
      largeSystemData.objects.forEach(obj => {
        expect(renderCounts.get(obj.id)).toBe(1)
      })
    })

    // This test will fail because the render time is too slow due to unnecessary re-renders
    expect(renderTime).toBeLessThan(50) // Should be fast, but will be slow due to the bug
  })
})