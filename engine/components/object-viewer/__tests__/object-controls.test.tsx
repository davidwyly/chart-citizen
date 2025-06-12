import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ObjectControls } from '../object-controls'
import type { CatalogObject } from '@/engine/system-loader'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ObjectControls', () => {
  const mockOnShaderScaleChange = vi.fn()
  const mockOnObjectScaleChange = vi.fn()
  const mockOnShaderParamsChange = vi.fn()

  beforeEach(() => {
    mockOnShaderScaleChange.mockClear()
    mockOnObjectScaleChange.mockClear()
    mockOnShaderParamsChange.mockClear()
  })

  const defaultProps = {
    shaderScale: 1,
    objectScale: 1,
    shaderParams: {},
    onShaderScaleChange: mockOnShaderScaleChange,
    onObjectScaleChange: mockOnObjectScaleChange,
    onShaderParamsChange: mockOnShaderParamsChange
  }

  const baseObjectProps = {
    mass: 1,
    radius: 1,
    render: {
      shader: 'basic',
      texture: 'none'
    }
  }

  describe('Base Controls', () => {
    const mockCatalogObject = {
      id: 'test-object',
      name: 'Test Object',
      mass: 1,
      radius: 2,
      render: {
        shader: 'basic',
        texture: 'none'
      },
      physical: {
        radius: 2
      }
    } as CatalogObject

    it('renders base scale controls', () => {
      render(
        <ObjectControls
          {...defaultProps}
          catalogObject={mockCatalogObject}
        />
      )

      expect(screen.getByText('Object Scale')).toBeInTheDocument()
      expect(screen.getByText('Shader Scale')).toBeInTheDocument()
    })

    it('calls scale change handlers', () => {
      render(
        <ObjectControls
          {...defaultProps}
          catalogObject={mockCatalogObject}
        />
      )

      const objectScaleInput = screen.getByLabelText('Object Scale')
      fireEvent.change(objectScaleInput, { target: { value: '2' } })
      expect(mockOnObjectScaleChange).toHaveBeenCalledWith(2)

      const shaderScaleInput = screen.getByLabelText('Shader Scale')
      fireEvent.change(shaderScaleInput, { target: { value: '1.5' } })
      expect(mockOnShaderScaleChange).toHaveBeenCalledWith(1.5)
    })
  })

  describe('Terrestrial Planet Controls', () => {
    const mockTerrestrialPlanet = {
      id: 'terrestrial-rocky',
      name: 'Terrestrial Rocky Planet',
      mass: 1,
      radius: 1,
      render: {
        shader: 'terrestrial',
        texture: 'rocky'
      },
      engine_object: 'terrestrial-planet',
      physical: {
        atmospheric_pressure: 1
      },
      features: {
        hydrosphere: 0.7,
        albedo: 0.3,
        vulcanism: 0.5,
        tectonics: 0.6
      }
    } as CatalogObject

    it('renders terrestrial planet specific controls', () => {
      render(
        <ObjectControls
          {...defaultProps}
          catalogObject={mockTerrestrialPlanet}
        />
      )

      expect(screen.getByText('Ocean Coverage')).toBeInTheDocument()
      expect(screen.getByText('Atmospheric Pressure')).toBeInTheDocument()
      expect(screen.getByText('Surface Reflectivity')).toBeInTheDocument()
      expect(screen.getByText('Volcanic Activity')).toBeInTheDocument()
      expect(screen.getByText('Tectonic Activity')).toBeInTheDocument()
    })

    it('initializes with correct default values', () => {
      render(
        <ObjectControls
          {...defaultProps}
          catalogObject={mockTerrestrialPlanet}
        />
      )

      expect(mockOnShaderParamsChange).toHaveBeenCalledWith(expect.objectContaining({
        hydrosphere: 0.7,
        atmosphericPressure: 1,
        albedo: 0.3,
        vulcanism: 0.5,
        tectonics: 0.6
      }))
    })
  })

  describe('Gas Giant Controls', () => {
    const mockGasGiant = {
      id: 'gas-giant',
      name: 'Gas Giant',
      mass: 1,
      radius: 1,
      render: {
        shader: 'gas-giant',
        texture: 'bands'
      },
      engine_object: 'gas-giant',
      features: {
        bands: 10,
        winds: 400,
        magnetic_field: 14,
        ring_system: 0.2
      }
    } as CatalogObject

    it('renders gas giant specific controls', () => {
      render(
        <ObjectControls
          {...defaultProps}
          catalogObject={mockGasGiant}
        />
      )

      expect(screen.getByText('Atmospheric Bands')).toBeInTheDocument()
      expect(screen.getByText('Wind Speed')).toBeInTheDocument()
      expect(screen.getByText('Magnetic Field')).toBeInTheDocument()
      expect(screen.getByText('Ring System')).toBeInTheDocument()
    })

    it('initializes with correct default values', () => {
      render(
        <ObjectControls
          {...defaultProps}
          catalogObject={mockGasGiant}
        />
      )

      expect(mockOnShaderParamsChange).toHaveBeenCalledWith(expect.objectContaining({
        bands: 10,
        winds: 400,
        magneticField: 14,
        ringSystem: 0.2
      }))
    })
  })

  describe('Star Controls', () => {
    const mockStar = {
      id: 'g2v-main-sequence',
      name: 'G2V Main Sequence Star',
      mass: 1,
      radius: 1,
      render: {
        shader: 'star',
        texture: 'sun'
      },
      engine_object: 'main-sequence-star',
      physical: {
        temperature: 5778,
        luminosity: 1
      },
      features: {
        flare_activity: 0.1,
        stellar_wind: 0.3
      }
    } as CatalogObject

    it('renders star specific controls', () => {
      render(
        <ObjectControls
          {...defaultProps}
          catalogObject={mockStar}
        />
      )

      expect(screen.getByText('Surface Temperature')).toBeInTheDocument()
      expect(screen.getByText('Luminosity')).toBeInTheDocument()
      expect(screen.getByText('Flare Activity')).toBeInTheDocument()
      expect(screen.getByText('Stellar Wind')).toBeInTheDocument()
    })

    it('initializes with correct default values', () => {
      render(
        <ObjectControls
          {...defaultProps}
          catalogObject={mockStar}
        />
      )

      expect(mockOnShaderParamsChange).toHaveBeenCalledWith(expect.objectContaining({
        temperature: 5778,
        luminosity: 1,
        flareActivity: 0.1,
        stellarWind: 0.3
      }))
    })
  })
}) 