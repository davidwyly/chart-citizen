import React from 'react'
import { render, screen } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { BeltRenderer } from '../belt-renderer'
import type { CelestialObject, RingDensity, ParticleSize } from '@/engine/types/orbital-system'

import { vi } from 'vitest'

// Mock Three.js components for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    InstancedMesh: vi.fn().mockImplementation(() => ({
      setMatrixAt: vi.fn(),
      instanceMatrix: { needsUpdate: false }
    })),
    Object3D: vi.fn().mockImplementation(() => ({
      position: { copy: vi.fn() },
      rotation: { set: vi.fn() },
      scale: { setScalar: vi.fn() },
      matrix: {},
      updateMatrix: vi.fn()
    })),
    Vector3: vi.fn().mockImplementation((x, y, z) => ({ x, y, z })),
    Matrix4: vi.fn().mockImplementation(() => ({}))
  }
})

describe('BeltRenderer', () => {
  const mockRegisterRef = vi.fn()
  const mockOnHover = vi.fn()
  const mockOnSelect = vi.fn()
  const mockOnFocus = vi.fn()

  const baseBeltObject: CelestialObject = {
    id: 'test-belt',
    name: 'Test Belt',
    classification: 'belt',
    geometry_type: 'belt',
    properties: {
      mass: 1,
      radius: 500,
      temperature: 200,
      belt_density: 'moderate' as RingDensity,
      particle_size: 'medium' as ParticleSize,
      tint: '#666666'
    },
    orbit: {
      parent: 'star-1',
      inner_radius: 2.0,
      outer_radius: 3.0,
      inclination: 0,
      eccentricity: 0
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderBeltRenderer = (object: CelestialObject, scale = 1) => {
    return render(
      <Canvas>
        <BeltRenderer
          object={object}
          scale={scale}
          starPosition={[0, 0, 0]}
          position={[0, 0, 0]}
          registerRef={mockRegisterRef}
          onHover={mockOnHover}
          onSelect={mockOnSelect}
          onFocus={mockOnFocus}
        />
      </Canvas>
    )
  }

  it('renders without crashing', () => {
    renderBeltRenderer(baseBeltObject)
    expect(mockRegisterRef).toHaveBeenCalled()
  })

  it('handles different density configurations', () => {
    const sparseBelt = {
      ...baseBeltObject,
      properties: {
        ...baseBeltObject.properties,
        belt_density: 'sparse' as RingDensity
      }
    }

    renderBeltRenderer(sparseBelt)
    expect(mockRegisterRef).toHaveBeenCalledWith('test-belt', expect.any(Object))
  })

  it('handles different particle size configurations', () => {
    const largeBelt = {
      ...baseBeltObject,
      properties: {
        ...baseBeltObject.properties,
        particle_size: 'large' as ParticleSize
      }
    }

    renderBeltRenderer(largeBelt)
    expect(mockRegisterRef).toHaveBeenCalledWith('test-belt', expect.any(Object))
  })

  it('handles dense belt configuration', () => {
    const denseBelt = {
      ...baseBeltObject,
      properties: {
        ...baseBeltObject.properties,
        belt_density: 'dense' as RingDensity
      }
    }

    renderBeltRenderer(denseBelt)
    expect(mockRegisterRef).toHaveBeenCalledWith('test-belt', expect.any(Object))
  })

  it('scales with belt size appropriately', () => {
    const largeBelt = {
      ...baseBeltObject,
      orbit: {
        ...baseBeltObject.orbit!,
        inner_radius: 5.0,
        outer_radius: 10.0
      }
    }

    renderBeltRenderer(largeBelt, 2.0)
    expect(mockRegisterRef).toHaveBeenCalledWith('test-belt', expect.any(Object))
  })

  it('uses default properties when not specified', () => {
    const minimalBelt = {
      ...baseBeltObject,
      properties: {
        mass: 1,
        radius: 500,
        temperature: 200
      }
    }

    renderBeltRenderer(minimalBelt)
    expect(mockRegisterRef).toHaveBeenCalledWith('test-belt', expect.any(Object))
  })

  it('handles custom tint colors', () => {
    const coloredBelt = {
      ...baseBeltObject,
      properties: {
        ...baseBeltObject.properties,
        tint: '#FF5733'
      }
    }

    renderBeltRenderer(coloredBelt)
    expect(mockRegisterRef).toHaveBeenCalledWith('test-belt', expect.any(Object))
  })
}) 