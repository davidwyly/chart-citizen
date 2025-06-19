/**
 * Integration test for adaptive time scaling functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TimeControls } from '@/engine/components/sidebar/time-controls'
import { CelestialObject } from '@/engine/types/orbital-system'

import { vi } from 'vitest'

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon">Play</div>,
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  FastForward: () => <div data-testid="fast-forward-icon">FastForward</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
}))

describe('Adaptive Time Scaling Integration', () => {
  const mockOnTimeMultiplierChange = vi.fn()
  const mockOnPauseToggle = vi.fn()

  beforeEach(() => {
    mockOnTimeMultiplierChange.mockClear()
    mockOnPauseToggle.mockClear()
  })

  const fastObject: CelestialObject = {
    id: 'luna',
    name: 'Luna',
    classification: 'moon',
    geometry_type: 'rocky',
    orbit: {
      parent: 'earth',
      semi_major_axis: 0.00257,
      eccentricity: 0.0549,
      inclination: 5.145,
      orbital_period: 27.322
    },
    properties: {
      mass: 0.012,
      radius: 1737.4,
      temperature: 250
    }
  }

  const mediumObject: CelestialObject = {
    id: 'mars',
    name: 'Mars',
    classification: 'planet',
    geometry_type: 'terrestrial',
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 1.524,
      eccentricity: 0.093,
      inclination: 1.9,
      orbital_period: 687
    },
    properties: {
      mass: 0.107,
      radius: 3389.5,
      temperature: 210
    }
  }

  const slowObject: CelestialObject = {
    id: 'saturn',
    name: 'Saturn',
    classification: 'planet',
    geometry_type: 'gas_giant',
    orbit: {
      parent: 'sol-star',
      semi_major_axis: 9.537,
      eccentricity: 0.054,
      inclination: 2.5,
      orbital_period: 10759
    },
    properties: {
      mass: 95.2,
      radius: 58232,
      temperature: 134
    }
  }

  test('displays orbital period and category for fast objects', async () => {
    render(
      <TimeControls
        timeMultiplier={3.2}
        onTimeMultiplierChange={mockOnTimeMultiplierChange}
        isPaused={false}
        onPauseToggle={mockOnPauseToggle}
        selectedObjectData={fastObject}
      />
    )

    expect(screen.getByText('Time Controls')).toBeInTheDocument()
    expect(screen.getByText('Orbital period: 27.3 days')).toBeInTheDocument()
    expect(screen.getByText('🌙 Fast orbit')).toBeInTheDocument()
  })

  test('displays orbital period and category for medium objects', async () => {
    render(
      <TimeControls
        timeMultiplier={12.5}
        onTimeMultiplierChange={mockOnTimeMultiplierChange}
        isPaused={false}
        onPauseToggle={mockOnPauseToggle}
        selectedObjectData={mediumObject}
      />
    )

    expect(screen.getByText('Orbital period: 687.0 days')).toBeInTheDocument()
    expect(screen.getByText('🪐 Medium orbit')).toBeInTheDocument()
  })

  test('displays orbital period and category for slow objects', async () => {
    render(
      <TimeControls
        timeMultiplier={45.2}
        onTimeMultiplierChange={mockOnTimeMultiplierChange}
        isPaused={false}
        onPauseToggle={mockOnPauseToggle}
        selectedObjectData={slowObject}
      />
    )

    expect(screen.getByText('Orbital period: 29.5 years')).toBeInTheDocument()
    expect(screen.getByText('🌌 Slow orbit')).toBeInTheDocument()
  })

  test('shows auto button when not using adaptive speed', async () => {
    render(
      <TimeControls
        timeMultiplier={1.0} // Low speed for a slow object
        onTimeMultiplierChange={mockOnTimeMultiplierChange}
        isPaused={false}
        onPauseToggle={mockOnPauseToggle}
        selectedObjectData={slowObject}
      />
    )

    const autoButton = screen.getByRole('button', { name: 'Auto' })
    expect(autoButton).toBeInTheDocument()
    expect(autoButton).toHaveTextContent('Auto')

    fireEvent.click(autoButton)
    expect(mockOnTimeMultiplierChange).toHaveBeenCalledWith(expect.any(Number))
    expect(mockOnTimeMultiplierChange.mock.calls[0][0]).toBeGreaterThan(20) // Should be high for slow objects
  })

  test('shows adaptive speed confirmation when using recommended speed', async () => {
    // Use a speed close to what would be recommended for a fast object
    render(
      <TimeControls
        timeMultiplier={3.4} // Exactly matching adaptive speed for Luna (27 days)
        onTimeMultiplierChange={mockOnTimeMultiplierChange}
        isPaused={false}
        onPauseToggle={mockOnPauseToggle}
        selectedObjectData={fastObject}
      />
    )

    expect(screen.getByText('✓ Using adaptive speed')).toBeInTheDocument()
    expect(screen.queryByText('Auto')).not.toBeInTheDocument()
  })

  test('works without selected object data', async () => {
    render(
      <TimeControls
        timeMultiplier={1.0}
        onTimeMultiplierChange={mockOnTimeMultiplierChange}
        isPaused={false}
        onPauseToggle={mockOnPauseToggle}
        selectedObjectData={null}
      />
    )

    // Should still render basic controls
    expect(screen.getByText('Time Controls')).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
    
    // But no adaptive scaling info
    expect(screen.queryByText(/Orbital period/)).not.toBeInTheDocument()
    expect(screen.queryByText(/orbit/)).not.toBeInTheDocument()
  })

  test('slider changes call time multiplier callback', async () => {
    render(
      <TimeControls
        timeMultiplier={5.0}
        onTimeMultiplierChange={mockOnTimeMultiplierChange}
        isPaused={false}
        onPauseToggle={mockOnPauseToggle}
        selectedObjectData={mediumObject}
      />
    )

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '15.5' } })
    
    expect(mockOnTimeMultiplierChange).toHaveBeenCalledWith(15.5)
  })

  test('pause button works correctly', async () => {
    render(
      <TimeControls
        timeMultiplier={5.0}
        onTimeMultiplierChange={mockOnTimeMultiplierChange}
        isPaused={false}
        onPauseToggle={mockOnPauseToggle}
        selectedObjectData={mediumObject}
      />
    )

    const pauseButton = screen.getByRole('button', { name: 'Pause' })
    fireEvent.click(pauseButton)
    
    expect(mockOnPauseToggle).toHaveBeenCalledTimes(1)
  })
})