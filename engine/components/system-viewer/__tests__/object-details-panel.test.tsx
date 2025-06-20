import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ObjectDetailsPanel } from '../object-details-panel'
import type { OrbitalSystemData } from '@engine/types/orbital-system'

// Mock tooltip components
vi.mock('../../ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
}))

// Mock skeleton component
vi.mock('../../ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => <div className={className} data-testid="skeleton" />,
}))

// Mock system loader
vi.mock('@/engine/system-loader', () => ({
  engineSystemLoader: {
    getStars: vi.fn(() => [{ id: 'star-1', name: 'Test Star' }]),
    getPlanets: vi.fn(() => [{ id: 'planet-1', name: 'Test Planet' }]),
    getMoons: vi.fn(() => [{ id: 'moon-1', name: 'Test Moon' }]),
    findObject: vi.fn((systemData, name) => {
      return systemData?.objects?.find((obj: any) => obj.name === name || obj.id === name)
    }),
  },
}))

const mockSystemData: OrbitalSystemData = {
  id: 'test-system',
  name: 'Test System',
  description: 'Test system description',
  objects: [
    {
      id: 'test-star',
      name: 'Test Star',
      classification: 'star',
      geometry_type: 'star',
      properties: {
        mass: 1.0,
        radius: 696000,
        temperature: 5778,
        luminosity: 1.0
      }
    },
    {
      id: 'test-planet',
      name: 'Test Planet',
      classification: 'planet',
      geometry_type: 'terrestrial',
      orbit: {
        parent: 'test-star',
        semi_major_axis: 1.0,
        eccentricity: 0.0167,
        inclination: 0.0,
        orbital_period: 365.25
      },
      properties: {
        mass: 5.972e24,
        radius: 6371,
        temperature: 288
      }
    }
  ],
  lighting: {
    primary_star: 'test-star',
    ambient_level: 0.5,
    stellar_influence_radius: 1000
  }
}

const defaultProps = {
  systemData: mockSystemData,
  focusedName: '',
  focusedObjectSize: null,
  isSystemSelected: false,
  cameraOrbitRadius: undefined,
  selectedObjectId: null,
  selectedObjectData: null,
}

describe('Enhanced Object Details Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock timers for animation testing
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders collapsed by default', () => {
    render(<ObjectDetailsPanel {...defaultProps} />)
    
    const panel = screen.getByTestId('object-details-panel')
    expect(panel).toHaveClass('w-16')
  })

  it('shows no selection message when no object is focused', () => {
    render(<ObjectDetailsPanel {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    expect(screen.getByText('Select an object to view details')).toBeInTheDocument()
  })

  it('shows system overview when system is selected', async () => {
    render(<ObjectDetailsPanel {...defaultProps} isSystemSelected={true} />)
    
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      expect(screen.getByText('System Overview')).toBeInTheDocument()
      expect(screen.getByText('System Details')).toBeInTheDocument()
    })
  })

  it('shows skeleton during expansion animation', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Star" />)
    
    const toggleButton = screen.getByTestId('panel-toggle')
    
    // Click to expand
    fireEvent.click(toggleButton)
    
    // Should show skeleton immediately
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3) // Header, sections, footer skeletons
    
    // Fast-forward through animation
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Wait for content to appear
    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton')).toHaveLength(0)
    })
  })

  it('expands and shows object details after animation', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Star" />)
    
    const toggleButton = screen.getByTestId('panel-toggle')
    
    // Click to expand
    fireEvent.click(toggleButton)
    
    // Fast-forward through animation
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Should be expanded and show content
    await waitFor(() => {
      const panel = screen.getByTestId('object-details-panel')
      expect(panel).toHaveClass('w-80')
      
      // Should show actual content, not skeletons
      expect(screen.queryAllByTestId('skeleton')).toHaveLength(0)
      
      // Should show object details
      expect(screen.getByText('Object Details')).toBeInTheDocument()
      expect(screen.getByText('Details')).toBeInTheDocument()
    })
  })

  it('collapses immediately without skeleton', () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Star" />)
    
    const toggleButton = screen.getByTestId('panel-toggle')
    
    // Expand first
    fireEvent.click(toggleButton)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Then collapse
    fireEvent.click(toggleButton)
    
    // Should collapse immediately
    const panel = screen.getByTestId('object-details-panel')
    expect(panel).toHaveClass('w-16')
    
    // Should not show any skeletons during collapse
    expect(screen.queryAllByTestId('skeleton')).toHaveLength(0)
  })

  it('opens sections when clicked in collapsed state', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Star" />)
    
    // Find details section icon in collapsed state
    const panelSections = screen.getByTestId('object-details-panel').querySelectorAll('button')
    const detailsButton = Array.from(panelSections).find(button => 
      button.querySelector('svg') && !button.hasAttribute('data-testid')
    )
    
    expect(detailsButton).toBeDefined()
    
    if (detailsButton) {
      fireEvent.click(detailsButton)
      
      // Should expand and open the details section
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        const panel = screen.getByTestId('object-details-panel')
        expect(panel).toHaveClass('w-80')
        expect(screen.getByText('Test Star')).toBeInTheDocument()
      })
    }
  })

  it('handles section toggles correctly when expanded', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Planet" />)
    
    // Expand panel first
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      // Details should be open by default
      expect(screen.getByText('Test Planet')).toBeInTheDocument()
    })
    
    // Find and click Orbital Data section
    const orbitalButton = screen.getByText('Orbital Data').closest('button')!
    fireEvent.click(orbitalButton)
    
    // Should show orbital data
    await waitFor(() => {
      expect(screen.getByText('Semi-Major Axis:')).toBeInTheDocument()
      expect(screen.getByText('1 AU')).toBeInTheDocument()
    })
  })

  it('displays object properties correctly', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Star" />)
    
    // Expand panel
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Open Properties section
    await waitFor(() => {
      const propertiesButton = screen.getByText('Properties').closest('button')!
      fireEvent.click(propertiesButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Mass:')).toBeInTheDocument()
      expect(screen.getByText('1 M☉')).toBeInTheDocument()
      expect(screen.getByText('Temperature:')).toBeInTheDocument()
      expect(screen.getByText('5778 K')).toBeInTheDocument()
    })
  })

  it('displays system statistics when system is selected', async () => {
    render(<ObjectDetailsPanel {...defaultProps} isSystemSelected={true} />)
    
    // Expand panel
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Open System Details section (should be open by default)
    await waitFor(() => {
      expect(screen.getByText('Test System')).toBeInTheDocument()
      expect(screen.getByText('Stars:')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Number of stars
      expect(screen.getByText('Planets:')).toBeInTheDocument()
    })
  })

  it('displays camera information when provided', async () => {
    render(<ObjectDetailsPanel {...defaultProps} isSystemSelected={true} cameraOrbitRadius={5.2} />)
    
    // Expand panel
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Open Camera section
    await waitFor(() => {
      const cameraButton = screen.getByText('Camera').closest('button')!
      fireEvent.click(cameraButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Orbit Radius:')).toBeInTheDocument()
      expect(screen.getByText('5.20 AU')).toBeInTheDocument()
      expect(screen.getByText('Birds Eye')).toBeInTheDocument()
    })
  })

  it('handles no system data gracefully', async () => {
    render(<ObjectDetailsPanel {...defaultProps} systemData={null} />)
    
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      expect(screen.getByText('No system data available')).toBeInTheDocument()
    })
  })

  it('handles object not found gracefully', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Nonexistent Object" />)
    
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Object not found')).toBeInTheDocument()
    })
  })

  it('displays focused object size when provided', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Star" focusedObjectSize={0.125} />)
    
    // Expand panel
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Visual Size:')).toBeInTheDocument()
      expect(screen.getByText('0.125')).toBeInTheDocument()
    })
  })

  it('uses monospace font for numerical values', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Star" />)
    
    // Expand panel
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      const idValue = screen.getByText('test-star')
      expect(idValue).toHaveClass('font-mono')
    })
  })

  it('shows active status in footer', async () => {
    render(<ObjectDetailsPanel {...defaultProps} focusedName="Test Star" />)
    
    // Expand panel
    const toggleButton = screen.getByTestId('panel-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })
}) 