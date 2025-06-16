import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { CelestialViewer } from '../celestial-viewer'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
  usePathname: () => '/test',
}))

vi.mock('../../../system-loader', () => ({
  engineSystemLoader: {
    loadStarmap: vi.fn().mockResolvedValue({}),
    loadSystem: vi.fn().mockResolvedValue({}),
    getAvailableSystems: vi.fn().mockResolvedValue([]),
    isSystemLoaded: vi.fn().mockReturnValue(false),
    isSystemLoading: vi.fn().mockReturnValue(false),
    getLoadingStatus: vi.fn().mockReturnValue('not-loaded'),
    clearCache: vi.fn(),
  },
  loadCatalogObject: vi.fn().mockResolvedValue({
    id: 'g2v-main-sequence',
    name: 'G2V Main Sequence Star',
    mass: 1,
    radius: 1,
    render: {
      shader: 'star',
      texture: 'sun'
    },
    physical: {
      temperature: 5778,
      luminosity: 1
    },
    features: {
      flare_activity: 0.1,
      stellar_wind: 0.3
    }
  })
}))

describe('CelestialViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders catalog and controls', () => {
    render(<CelestialViewer />)

    // Check for catalog section
    expect(screen.getByText('Object Catalog')).toBeInTheDocument()
    expect(screen.getByText('Stars')).toBeInTheDocument()
    expect(screen.getByText('G2V Main Sequence Star')).toBeInTheDocument()

    // Check for controls section
    expect(screen.getByText('Object Controls')).toBeInTheDocument()
    expect(screen.getByText('Object Scale')).toBeInTheDocument()
    expect(screen.getByText('Shader Scale')).toBeInTheDocument()
  })

  it('loads and displays selected object', async () => {
    render(<CelestialViewer />)

    // Select a star object
    const starButton = screen.getByText('G2V Main Sequence Star')
    fireEvent.click(starButton)

    // Wait for object to load and check controls
    expect(await screen.findByText('Surface Temperature')).toBeInTheDocument()
    expect(screen.getByText('Luminosity')).toBeInTheDocument()
    expect(screen.getByText('Flare Activity')).toBeInTheDocument()
    expect(screen.getByText('Stellar Wind')).toBeInTheDocument()
  })

  it('updates shader parameters', async () => {
    render(<CelestialViewer />)

    // Select object and wait for controls
    const starButton = screen.getByText('G2V Main Sequence Star')
    fireEvent.click(starButton)
    await screen.findByText('Surface Temperature')

    // Adjust temperature control
    const tempInput = screen.getByLabelText('Surface Temperature')
    fireEvent.change(tempInput, { target: { value: '6000' } })

    // Check if shader parameters were updated
    const shaderDisplay = screen.getByTestId('shader-params')
    expect(shaderDisplay).toHaveTextContent('temperature: 6000')
  })

  it('handles object scale changes', () => {
    render(<CelestialViewer />)

    // Adjust object scale
    const scaleInput = screen.getByLabelText('Object Scale')
    fireEvent.change(scaleInput, { target: { value: '2' } })

    // Check if scale was updated
    const scaleDisplay = screen.getByTestId('object-scale')
    expect(scaleDisplay).toHaveTextContent('2')
  })

  it('handles shader scale changes', () => {
    render(<CelestialViewer />)

    // Adjust shader scale
    const scaleInput = screen.getByLabelText('Shader Scale')
    fireEvent.change(scaleInput, { target: { value: '1.5' } })

    // Check if scale was updated
    const scaleDisplay = screen.getByTestId('shader-scale')
    expect(scaleDisplay).toHaveTextContent('1.5')
  })

  it('handles errors gracefully', async () => {
    // Mock a loading error
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(require('../../../system-loader'), 'loadCatalogObject')
      .mockRejectedValueOnce(new Error('Failed to load object'))

    render(<CelestialViewer />)

    // Try to select an object
    const starButton = screen.getByText('G2V Main Sequence Star')
    fireEvent.click(starButton)

    // Check for error message
    expect(await screen.findByText('Error: Failed to load object')).toBeInTheDocument()

    consoleError.mockRestore()
  })
}) 