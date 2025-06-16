import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ObjectControls } from '../object-controls'
import type { CatalogObject } from '@/engine/system-loader'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ObjectControls', () => {
  const mockOnShaderScaleChange = vi.fn()
  const mockOnObjectScaleChange = vi.fn()
  const mockOnShaderParamsChange = vi.fn()
  const mockOnHabitabilityParamChange = vi.fn()

  beforeEach(() => {
    mockOnShaderScaleChange.mockClear()
    mockOnObjectScaleChange.mockClear()
    mockOnShaderParamsChange.mockClear()
    mockOnHabitabilityParamChange.mockClear()
  })

  const defaultProps = {
    shaderScale: 1,
    objectScale: 1,
    shaderParams: {
      intensity: 0,
      speed: 0,
      distortion: 0,
      diskSpeed: 0,
      lensingStrength: 0,
      diskBrightness: 0
    },
    habitabilityParams: {
      humidity: 0,
      temperature: 0,
      population: 0,
      volcanism: 0,
      rotationSpeed: 0.2,
      showTopographicLines: false,
    },
    showStats: false,
    onShaderScaleChange: mockOnShaderScaleChange,
    onObjectScaleChange: mockOnObjectScaleChange,
    onShaderParamChange: mockOnShaderParamsChange,
    onHabitabilityParamChange: mockOnHabitabilityParamChange,
    onToggleStats: vi.fn()
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
          selectedObjectId="test-object"
        />
      )

      expect(screen.getByRole('slider', { name: /Object Scale/i })).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /Shader Scale/i })).toBeInTheDocument()
    })

    it('calls scale change handlers', () => {
      render(
        <ObjectControls
          {...defaultProps}
          selectedObjectId="test-object"
        />
      )

      const objectScaleInput = screen.getByLabelText(/Object Scale/)
      fireEvent.change(objectScaleInput, { target: { value: '2' } })
      expect(mockOnObjectScaleChange).toHaveBeenCalledWith(2)

      const shaderScaleInput = screen.getByLabelText(/Shader Scale/)
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
          selectedObjectId="earth-like"
        />
      )

      expect(screen.getByLabelText(/Humidity: [\d.]+%/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Temperature: [\d.]+°/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Population: [\d.]+%/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Volcanism: [\d.]+%/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Rotation Speed: [\d.]+x/i)).toBeInTheDocument()
      expect(screen.getByText(/Debug Mode/i)).toBeInTheDocument()

      // Old tests
      expect(screen.queryByText('Ocean Coverage')).not.toBeInTheDocument()
      expect(screen.queryByText('Atmospheric Pressure')).not.toBeInTheDocument()
      expect(screen.queryByText('Surface Reflectivity')).not.toBeInTheDocument()
      expect(screen.queryByText('Volcanic Activity')).not.toBeInTheDocument()
      expect(screen.queryByText('Tectonic Activity')).not.toBeInTheDocument()
    })

    it('displays correct parameter values', () => {
      render(
        <ObjectControls
          {...defaultProps}
          selectedObjectId="earth-like"
          habitabilityParams={{
            humidity: 70,
            temperature: 60,
            population: 80,
            volcanism: 25,
            rotationSpeed: 0.5,
            showTopographicLines: true,
          }}
        />
      )

      expect(screen.getByDisplayValue('70')).toBeInTheDocument() // humidity
      expect(screen.getByDisplayValue('60')).toBeInTheDocument() // temperature
      expect(screen.getByDisplayValue('80')).toBeInTheDocument() // population
      expect(screen.getByDisplayValue('25')).toBeInTheDocument() // volcanism
      expect(screen.getByDisplayValue('0.5')).toBeInTheDocument() // rotation speed
      
      // Check debug toggle is checked
      const debugCheckbox = screen.getByRole('checkbox')
      expect(debugCheckbox).toBeChecked()
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
          selectedObjectId="gas-giant"
        />
      )

      expect(screen.getByRole('slider', { name: /Intensity/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^Speed:/i)).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /Distortion/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^Disk Speed:/i)).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /Lensing Strength/i })).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /Disk Brightness/i })).toBeInTheDocument()

      // Old tests
      expect(screen.queryByText('Atmospheric Bands')).not.toBeInTheDocument()
      expect(screen.queryByText('Wind Speed')).not.toBeInTheDocument()
      expect(screen.queryByText('Magnetic Field')).not.toBeInTheDocument()
      expect(screen.queryByText('Ring System')).not.toBeInTheDocument()
    })

    it('displays current shader parameter values', () => {
      render(
        <ObjectControls
          {...defaultProps}
          selectedObjectId="gas-giant"
          shaderParams={{
            intensity: 2.5,
            speed: 1.8,
            distortion: 1.2,
            diskSpeed: 3.0,
            lensingStrength: 0.8,
            diskBrightness: 2.2
          }}
        />
      )

      expect(screen.getByDisplayValue('2.5')).toBeInTheDocument() // intensity
      expect(screen.getByDisplayValue('1.8')).toBeInTheDocument() // speed
      expect(screen.getByDisplayValue('1.2')).toBeInTheDocument() // distortion
      expect(screen.getByDisplayValue('3')).toBeInTheDocument() // diskSpeed  
      expect(screen.getByDisplayValue('0.8')).toBeInTheDocument() // lensingStrength
      expect(screen.getByDisplayValue('2.2')).toBeInTheDocument() // diskBrightness
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
          selectedObjectId="g2v-main-sequence"
        />
      )

      expect(screen.getByRole('slider', { name: /Intensity/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^Speed:/i)).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /Distortion/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^Disk Speed:/i)).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /Lensing Strength/i })).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: /Disk Brightness/i })).toBeInTheDocument()

      // Old tests
      expect(screen.queryByText('Stellar Flare Activity')).not.toBeInTheDocument()
      expect(screen.queryByText('Stellar Wind Strength')).not.toBeInTheDocument()
    })

    it('displays current shader parameter values', () => {
      render(
        <ObjectControls
          {...defaultProps}
          selectedObjectId="g2v-main-sequence"
          shaderParams={{
            intensity: 1.5,
            speed: 2.0,
            distortion: 1.8,
            diskSpeed: 2.5,
            lensingStrength: 0.9,
            diskBrightness: 1.7
          }}
        />
      )

      expect(screen.getByDisplayValue('1.5')).toBeInTheDocument() // intensity
      expect(screen.getByDisplayValue('2')).toBeInTheDocument() // speed
      expect(screen.getByDisplayValue('1.8')).toBeInTheDocument() // distortion
      expect(screen.getByDisplayValue('2.5')).toBeInTheDocument() // diskSpeed
      expect(screen.getByDisplayValue('0.9')).toBeInTheDocument() // lensingStrength
      expect(screen.getByDisplayValue('1.7')).toBeInTheDocument() // diskBrightness
    })
  })
}) 