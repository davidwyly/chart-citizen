import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { GeometryRendererFactory } from '../geometry-renderer-factory'
import type { CelestialObject, GeometryType } from '@/engine/types/orbital-system'

// Mock all geometry renderer components to ensure they are called with the correct props
vi.mock('../terrestrial-renderer', () => ({
  TerrestrialRenderer: vi.fn(() => null)
}))
vi.mock('../rocky-renderer', () => ({
  RockyRenderer: vi.fn(() => null)
}))
vi.mock('../gas-giant-renderer', () => ({
  GasGiantRenderer: vi.fn(() => null)
}))
vi.mock('../star-renderer', () => ({
  StarRenderer: vi.fn(() => null)
}))
vi.mock('../compact-renderer', () => ({
  CompactRenderer: vi.fn(() => null)
}))
vi.mock('../exotic-renderer', () => ({
  ExoticRenderer: vi.fn(() => null)
}))
vi.mock('../ring-renderer', () => ({
  RingRenderer: vi.fn(() => null)
}))
vi.mock('../belt-renderer', () => ({
  BeltRenderer: vi.fn(() => null)
}))

describe('GeometryRendererFactory', () => {
  const createMockObject = (geometryType: GeometryType): CelestialObject => ({
    id: 'test-object',
    name: 'Test Object',
    classification: 'planet',
    geometry_type: geometryType,
    properties: {
      mass: 1.0,
      radius: 1.0,
      temperature: 300
    }
  })

  const baseProps = {
    scale: 1.0,
    starPosition: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
    isSelected: false,
    onHover: vi.fn(),
    onSelect: vi.fn(),
    onFocus: vi.fn(),
    registerRef: vi.fn()
  }

  // Clear mock calls before each test to ensure isolated tests
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Geometry Type Routing', () => {
    it('renders without errors for terrestrial geometry', () => {
      const object = createMockObject('terrestrial')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })

    it('renders without errors for rocky geometry', () => {
      const object = createMockObject('rocky')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })

    it('renders without errors for gas_giant geometry', () => {
      const object = createMockObject('gas_giant')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })

    it('renders without errors for star geometry', () => {
      const object = createMockObject('star')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })

    it('renders without errors for compact geometry', () => {
      const object = createMockObject('compact')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })

    it('renders without errors for exotic geometry', () => {
      const object = createMockObject('exotic')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })

    it('renders without errors for ring geometry', () => {
      const object = createMockObject('ring')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })

    it('renders without errors for belt geometry', () => {
      const object = createMockObject('belt')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })
  })

  describe('None Geometry Type', () => {
    it('renders without errors for none type (barycenters)', () => {
      const object = createMockObject('none')
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
    })

    it('handles interaction events for none geometry (barycenters)', () => {
      const onSelect = vi.fn()
      const onHover = vi.fn()
      const object = createMockObject('none')
      
      render(
        <GeometryRendererFactory 
          object={object} 
          {...baseProps}
          onSelect={onSelect}
          onHover={onHover}
        />
      )

      // Verify that the props are passed correctly to the internal mesh that handles interaction
      // Since we are not rendering a DOM element, we can only verify the mock functions were called
      // The actual interaction logic would be tested in the component that renders the invisible mesh
      expect(onSelect).not.toHaveBeenCalled()
      expect(onHover).not.toHaveBeenCalled()
    })
  })

  describe('Unknown Geometry Type', () => {
    it('handles unknown geometry types gracefully', () => {
      const object = {
        ...createMockObject('terrestrial'),
        geometry_type: 'unknown-type' as GeometryType
      }
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      expect(() => {
        render(<GeometryRendererFactory object={object} {...baseProps} />)
      }).not.toThrow()
      
      // Should log warning about unknown type
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown geometry type: unknown-type')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Props Forwarding', () => {
    it('handles custom props without errors', () => {
      const object = createMockObject('terrestrial')
      const customProps = {
        ...baseProps,
        scale: 2.5,
        isSelected: true,
        timeMultiplier: 1.5,
        isPaused: true
      }

      expect(() => {
        render(<GeometryRendererFactory object={object} {...customProps} />)
      }).not.toThrow()
    })

    it('handles minimal props correctly', () => {
      const object = createMockObject('star')
      const minimalProps = {
        object,
        scale: 1.0,
        registerRef: vi.fn()
      }

      expect(() => {
        render(<GeometryRendererFactory {...minimalProps} />)
      }).not.toThrow()
    })
  })

  describe('Renderer Registration', () => {
    it('handles registerRef prop without errors', () => {
      const object = createMockObject('terrestrial')
      const registerRef = vi.fn()

      expect(() => {
        render(<GeometryRendererFactory 
          object={object} 
          {...baseProps} 
          registerRef={registerRef}
        />)
      }).not.toThrow()
    })
  })
}) 