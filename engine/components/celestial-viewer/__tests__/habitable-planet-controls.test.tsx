import { render, screen, fireEvent } from '@testing-library/react'
import { vi, expect } from 'vitest'
import React from 'react'
import '@testing-library/jest-dom/vitest'
import { ObjectControls } from '../object-controls'

describe('ObjectControls - Habitable Planet Integration', () => {
  const mockShaderParams = {
    intensity: 1.0,
    speed: 1.0,
    distortion: 1.0,
    diskSpeed: 1.0,
    lensingStrength: 0.66,
    diskBrightness: 1.0
  }

  const mockHabitabilityParams = {
    humidity: 70,
    temperature: 60,
    population: 80,
    volcanism: 25
  }

  const mockHandlers = {
    onObjectScaleChange: vi.fn(),
    onShaderScaleChange: vi.fn(),
    onShaderParamChange: vi.fn(),
    onHabitabilityParamChange: vi.fn(),
    showStats: false,
    onToggleStats: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show habitability controls for earth-like planets', () => {
    render(
      <ObjectControls
        selectedObjectId="earth-like"
        objectScale={1.0}
        shaderScale={1.0}
        shaderParams={mockShaderParams}
        habitabilityParams={mockHabitabilityParams}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Habitability Parameters')).toBeInTheDocument()
    expect(screen.getByLabelText(/Humidity/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Temperature/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Population/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Volcanism/)).toBeInTheDocument()
  })

  it('should show habitability controls for desert worlds', () => {
    render(
      <ObjectControls
        selectedObjectId="desert-world"
        objectScale={1.0}
        shaderScale={1.0}
        shaderParams={mockShaderParams}
        habitabilityParams={mockHabitabilityParams}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Habitability Parameters')).toBeInTheDocument()
  })

  it('should not show habitability controls for non-habitable planets', () => {
    render(
      <ObjectControls
        selectedObjectId="terrestrial-rocky"
        objectScale={1.0}
        shaderScale={1.0}
        shaderParams={mockShaderParams}
        {...mockHandlers}
      />
    )

    expect(screen.queryByText('Habitability Parameters')).not.toBeInTheDocument()
  })

  it('should call habitability parameter change handler when sliders are moved', () => {
    render(
      <ObjectControls
        selectedObjectId="earth-like"
        objectScale={1.0}
        shaderScale={1.0}
        shaderParams={mockShaderParams}
        habitabilityParams={mockHabitabilityParams}
        {...mockHandlers}
      />
    )

    const humiditySlider = screen.getByLabelText(/Humidity/)
    fireEvent.change(humiditySlider, { target: { value: '85' } })

    expect(mockHandlers.onHabitabilityParamChange).toHaveBeenCalledWith('humidity', 85)

    const volcanismSlider = screen.getByLabelText(/Volcanism/)
    fireEvent.change(volcanismSlider, { target: { value: '50' } })

    expect(mockHandlers.onHabitabilityParamChange).toHaveBeenCalledWith('volcanism', 50)
  })

  it('should display correct parameter values and units', () => {
    render(
      <ObjectControls
        selectedObjectId="ocean-world-habitable"
        objectScale={1.0}
        shaderScale={1.0}
        shaderParams={mockShaderParams}
        habitabilityParams={mockHabitabilityParams}
        {...mockHandlers}
      />
    )

    expect(screen.getByText(/Humidity.*70.*%/)).toBeInTheDocument()
    expect(screen.getByText(/Temperature.*60.*°/)).toBeInTheDocument()
    expect(screen.getByText(/Population.*80.*%/)).toBeInTheDocument()
    expect(screen.getByText(/Volcanism.*25.*%/)).toBeInTheDocument()
  })

  it('should not show generic shader properties for habitable planets', () => {
    render(
      <ObjectControls
        selectedObjectId="ice-world"
        objectScale={1.0}
        shaderScale={1.0}
        shaderParams={mockShaderParams}
        habitabilityParams={mockHabitabilityParams}
        {...mockHandlers}
      />
    )

    expect(screen.queryByText('Shader Properties')).not.toBeInTheDocument()
    expect(screen.getByText('Habitability Parameters')).toBeInTheDocument()
  })
}) 