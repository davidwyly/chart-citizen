import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi } from 'vitest'
import { Sidebar } from '../sidebar'
import type { ViewType } from '@lib/types/effects-level'
import type { SystemData } from '@engine/system-loader'

// Mock useFrame
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn((callback) => {
    callback({ clock: { getElapsedTime: () => 0 } })
  }),
}))

describe('Sidebar', () => {
  const mockSystemData: SystemData = {
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
      }
    ],
    lighting: {
      primary_star: 'test-star',
      ambient_level: 0.5,
      stellar_influence_radius: 1000
    }
  }

  const mockAvailableSystems = {
    'test-system': mockSystemData,
    'other-system': {
      ...mockSystemData,
      id: 'other-system',
      name: 'Other System'
    }
  }

  const defaultProps = {
    onViewTypeChange: vi.fn(),
    onTimeMultiplierChange: vi.fn(),
    onPauseToggle: vi.fn(),
    currentViewType: 'explorational' as ViewType,
    currentTimeMultiplier: 1,
    isPaused: false,
    currentZoom: 1,
    systemData: mockSystemData,
    availableSystems: mockAvailableSystems,
    currentSystem: 'test-system',
    onSystemChange: vi.fn(),
    focusedName: 'Test Object',
    focusedObjectSize: 1000,
    onStopFollowing: vi.fn(),
    error: null,
    loadingProgress: '100%',
    mode: 'realistic' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders in collapsed state by default', () => {
      render(<Sidebar {...defaultProps} />)
      expect(screen.queryByText('Chart Citizen')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /collapse/i })).not.toBeInTheDocument()
    })

    it('expands and collapses when toggle button is clicked', () => {
      render(<Sidebar {...defaultProps} mode="star-citizen" />)
      
      // Initially collapsed
      expect(screen.queryByRole('heading', { name: 'Chart Citizen' })).not.toBeInTheDocument()
      
      // Expand
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      expect(screen.getByRole('heading', { name: 'Chart Citizen' })).toBeVisible()
      expect(screen.getByRole('button', { name: /collapse/i })).toBeVisible()
      
      // Collapse
      fireEvent.click(screen.getByRole('button', { name: /collapse/i }))
      expect(screen.queryByRole('heading', { name: 'Chart Citizen' })).not.toBeInTheDocument()
    })
  })

  describe('Accordion Sections', () => {
    it('toggles options section', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar first
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      
      // Navigation section is open by default, close it first
      fireEvent.click(screen.getByText('Navigation'))
      
      // Click options section
      fireEvent.click(screen.getByText('Options'))
      expect(screen.getByText('View Mode')).toBeVisible()
      expect(screen.getByText('Time Controls')).toBeVisible()
      
      // Click again to collapse
      fireEvent.click(screen.getByText('Options'))
      expect(screen.queryByText('View Mode')).not.toBeInTheDocument()
    })

    it('toggles navigation section', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar first
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      
      // Navigation section is open by default, should see content
      expect(screen.getByText('Available Systems')).toBeVisible()
      
      // Click navigation section to collapse
      fireEvent.click(screen.getByText('Navigation'))
      expect(screen.queryByText('Available Systems')).not.toBeInTheDocument()
      
      // Click again to expand
      fireEvent.click(screen.getByText('Navigation'))
      expect(screen.getByText('Available Systems')).toBeVisible()
    })

    it('toggles system info section', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar first
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      
      // Click system info section
      fireEvent.click(screen.getByText('System Info'))
      expect(screen.getByText('Test System')).toBeVisible()
      expect(screen.getByText('Test system description')).toBeVisible()
      
      // Click again to collapse
      fireEvent.click(screen.getByText('System Info'))
      expect(screen.queryByText('Test system description')).not.toBeInTheDocument()
    })
  })

  describe('View Mode Controls', () => {
    it('displays and updates view mode', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar and options section
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      // Close navigation section first
      fireEvent.click(screen.getByText('Navigation'))
      fireEvent.click(screen.getByText('Options'))
      
      // Change view mode
      fireEvent.click(screen.getByText('Navigational'))
      expect(defaultProps.onViewTypeChange).toHaveBeenCalledWith('navigational')
    })
  })

  describe('Time Controls', () => {
    it('displays and updates time controls', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar and options section
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      // Close navigation section first
      fireEvent.click(screen.getByText('Navigation'))
      fireEvent.click(screen.getByText('Options'))
      
      // Test pause/play - find the button with the pause icon
      const pauseButton = screen.getByRole('button', { name: '' })
      fireEvent.click(pauseButton)
      expect(defaultProps.onPauseToggle).toHaveBeenCalled()
      
      // Test speed presets - these don't exist in the current implementation
      // so let's test the slider instead
      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '2' } })
      expect(defaultProps.onTimeMultiplierChange).toHaveBeenCalledWith(2)
    })
  })

  describe('System Navigation', () => {
    it('displays and updates system selection', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar - navigation section is open by default
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      
      // Change system
      fireEvent.click(screen.getByText('Other System'))
      expect(defaultProps.onSystemChange).toHaveBeenCalledWith('other-system')
    })
  })

  describe('System Info', () => {
    it('displays system information correctly', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar and system info section
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      fireEvent.click(screen.getByText('System Info'))
      
      expect(screen.getByText('Test System')).toBeVisible()
      expect(screen.getByText('Test system description')).toBeVisible()
      expect(screen.getByText('Stars: 1')).toBeVisible()
      expect(screen.getByText('Planets: 0')).toBeVisible()
    })

    it('displays focused object information', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar and system info section
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      fireEvent.click(screen.getByText('System Info'))
      
      expect(screen.getByText('Following: Test Object')).toBeVisible()
      expect(screen.getByText('Visual size: 1000.000')).toBeVisible()
      
      // Test stop following
      fireEvent.click(screen.getByText('Stop following'))
      expect(defaultProps.onStopFollowing).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('displays loading progress', () => {
      render(<Sidebar {...defaultProps} loadingProgress="50%" />)
      
      // Expand sidebar and system info section where loading is displayed
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      fireEvent.click(screen.getByText('System Info'))
      
      expect(screen.getByText('50%')).toBeVisible()
    })

    it('displays error state', () => {
      render(<Sidebar {...defaultProps} error="Test error" />)
      
      // Expand sidebar and system info section where error is displayed
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      fireEvent.click(screen.getByText('System Info'))
      
      expect(screen.getByText('Test error')).toBeVisible()
    })
  })

  describe('Mode Variations', () => {
    it('displays correct title for star-citizen mode', () => {
      render(<Sidebar {...defaultProps} mode="star-citizen" />)
      
      // Expand sidebar
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      
      expect(screen.getByRole('heading', { name: 'Chart Citizen' })).toBeVisible()
    })

    it('displays correct title for realistic mode', () => {
      render(<Sidebar {...defaultProps} mode="realistic" />)
      
      // Expand sidebar
      fireEvent.click(screen.getByTestId('sidebar-toggle'))
      
      expect(screen.getByRole('heading', { name: '3D Starfield' })).toBeVisible()
    })
  })
}) 