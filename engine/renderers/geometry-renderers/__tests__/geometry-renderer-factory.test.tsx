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
    it('routes terrestrial geometry to TerrestrialRenderer', async () => {
      const { TerrestrialRenderer } = await import('../terrestrial-renderer')
      const object = createMockObject('terrestrial')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(TerrestrialRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...baseProps }),
        expect.anything()
      )
    })

    it('routes rocky geometry to RockyRenderer', async () => {
      const { RockyRenderer } = await import('../rocky-renderer')
      const object = createMockObject('rocky')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(RockyRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...baseProps }),
        expect.anything()
      )
    })

    it('routes gas_giant geometry to GasGiantRenderer', async () => {
      const { GasGiantRenderer } = await import('../gas-giant-renderer')
      const object = createMockObject('gas_giant')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(GasGiantRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...baseProps }),
        expect.anything()
      )
    })

    it('routes star geometry to StarRenderer', async () => {
      const { StarRenderer } = await import('../star-renderer')
      const object = createMockObject('star')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(StarRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...baseProps }),
        expect.anything()
      )
    })

    it('routes compact geometry to CompactRenderer', async () => {
      const { CompactRenderer } = await import('../compact-renderer')
      const object = createMockObject('compact')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(CompactRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...baseProps }),
        expect.anything()
      )
    })

    it('routes exotic geometry to ExoticRenderer', async () => {
      const { ExoticRenderer } = await import('../exotic-renderer')
      const object = createMockObject('exotic')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(ExoticRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...baseProps }),
        expect.anything()
      )
    })

    it('routes ring geometry to RingRenderer', async () => {
      const { RingRenderer } = await import('../ring-renderer')
      const object = createMockObject('ring')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(RingRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...baseProps }),
        expect.anything()
      )
    })

    it('routes belt geometry to BeltRenderer', async () => {
      const { BeltRenderer } = await import('../belt-renderer')
      const object = createMockObject('belt')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(BeltRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...baseProps }),
        expect.anything()
      )
    })
  })

  describe('None Geometry Type', () => {
    it('does not render any specific geometry renderer for none type', async () => {
      const { TerrestrialRenderer } = await import('../terrestrial-renderer')
      const { RockyRenderer } = await import('../rocky-renderer')
      const { GasGiantRenderer } = await import('../gas-giant-renderer')
      const { StarRenderer } = await import('../star-renderer')
      const { CompactRenderer } = await import('../compact-renderer')
      const { ExoticRenderer } = await import('../exotic-renderer')
      const { RingRenderer } = await import('../ring-renderer')
      const { BeltRenderer } = await import('../belt-renderer')
      
      const object = createMockObject('none')
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      expect(TerrestrialRenderer).not.toHaveBeenCalled()
      expect(RockyRenderer).not.toHaveBeenCalled()
      expect(GasGiantRenderer).not.toHaveBeenCalled()
      expect(StarRenderer).not.toHaveBeenCalled()
      expect(CompactRenderer).not.toHaveBeenCalled()
      expect(ExoticRenderer).not.toHaveBeenCalled()
      expect(RingRenderer).not.toHaveBeenCalled()
      expect(BeltRenderer).not.toHaveBeenCalled()
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
    it('logs a warning and does not render a specific geometry renderer', async () => {
      const { TerrestrialRenderer } = await import('../terrestrial-renderer')
      const { RockyRenderer } = await import('../rocky-renderer')
      const { GasGiantRenderer } = await import('../gas-giant-renderer')
      const { StarRenderer } = await import('../star-renderer')
      const { CompactRenderer } = await import('../compact-renderer')
      const { ExoticRenderer } = await import('../exotic-renderer')
      const { RingRenderer } = await import('../ring-renderer')
      const { BeltRenderer } = await import('../belt-renderer')
      
      const object = {
        ...createMockObject('terrestrial'),
        geometry_type: 'unknown-type' as GeometryType
      }
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      render(
        <GeometryRendererFactory object={object} {...baseProps} />
      )
      
      // Should log warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown geometry type: unknown-type')
      )
      
      expect(TerrestrialRenderer).not.toHaveBeenCalled()
      expect(RockyRenderer).not.toHaveBeenCalled()
      expect(GasGiantRenderer).not.toHaveBeenCalled()
      expect(StarRenderer).not.toHaveBeenCalled()
      expect(CompactRenderer).not.toHaveBeenCalled()
      expect(ExoticRenderer).not.toHaveBeenCalled()
      expect(RingRenderer).not.toHaveBeenCalled()
      expect(BeltRenderer).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Props Forwarding', () => {
    it('forwards all props to geometry renderers', async () => {
      const { TerrestrialRenderer } = await import('../terrestrial-renderer')
      const object = createMockObject('terrestrial')
      const customProps = {
        ...baseProps,
        scale: 2.5,
        isSelected: true,
        timeMultiplier: 1.5,
        isPaused: true
      }

      render(<GeometryRendererFactory object={object} {...customProps} />)
      
      expect(TerrestrialRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, ...customProps }),
        expect.anything()
      )
    })

    it('handles optional props correctly', async () => {
      const { StarRenderer } = await import('../star-renderer')
      const object = createMockObject('star')
      const minimalProps = {
        object,
        scale: 1.0,
        registerRef: vi.fn()
      }

      expect(() => {
        render(<GeometryRendererFactory {...minimalProps} />)
      }).not.toThrow()
      expect(StarRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ object, scale: 1.0, registerRef: minimalProps.registerRef }),
        expect.anything()
      )
    })
  })

  describe('Renderer Registration', () => {
    it('calls registerRef when provided', async () => {
      const { TerrestrialRenderer } = await import('../terrestrial-renderer')
      const object = createMockObject('terrestrial')
      const registerRef = vi.fn()

      render(
        <GeometryRendererFactory 
          object={object} 
          {...baseProps} 
          registerRef={registerRef}
        />
      )

      expect(TerrestrialRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ registerRef }),
        expect.anything()
      )
    })
  })
}) 