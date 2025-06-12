import { render, screen, fireEvent, act } from '@testing-library/react'
import { Sidebar } from '../sidebar'
import type { ViewType } from '@lib/types/effects-level'
import type { SystemData } from '@engine/system-loader'

// Mock useFrame
jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn((callback) => {
    callback({ clock: { getElapsedTime: () => 0 } })
  }),
}))

describe('Sidebar', () => {
  const mockSystemData: SystemData = {
    id: 'test-system',
    name: 'Test System',
    description: 'Test system description',
    barycenter: [0, 0, 0],
    stars: [],
    planets: [],
    moons: [],
    belts: [],
    jump_points: [],
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
    onViewTypeChange: jest.fn(),
    onTimeMultiplierChange: jest.fn(),
    onPauseToggle: jest.fn(),
    currentViewType: 'realistic' as ViewType,
    currentTimeMultiplier: 1,
    isPaused: false,
    currentZoom: 1,
    systemData: mockSystemData,
    availableSystems: mockAvailableSystems,
    currentSystem: 'test-system',
    onSystemChange: jest.fn(),
    focusedName: 'Test Object',
    focusedObjectSize: 1000,
    onStopFollowing: jest.fn(),
    error: null,
    loadingProgress: '100%',
    mode: 'realistic' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders in collapsed state by default', () => {
      render(<Sidebar {...defaultProps} />)
      expect(screen.getByText('Chart Citizen')).not.toBeVisible()
      expect(screen.getByRole('button', { name: /collapse/i })).not.toBeVisible()
    })

    it('expands and collapses when toggle button is clicked', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Initially collapsed
      expect(screen.getByText('Chart Citizen')).not.toBeVisible()
      
      // Expand
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      expect(screen.getByText('Chart Citizen')).toBeVisible()
      expect(screen.getByRole('button', { name: /collapse/i })).toBeVisible()
      
      // Collapse
      fireEvent.click(screen.getByRole('button', { name: /collapse/i }))
      expect(screen.getByText('Chart Citizen')).not.toBeVisible()
    })
  })

  describe('Accordion Sections', () => {
    it('toggles options section', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar first
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      
      // Click options section
      fireEvent.click(screen.getByText('Options'))
      expect(screen.getByText('View Mode')).toBeVisible()
      expect(screen.getByText('Time Controls')).toBeVisible()
      
      // Click again to collapse
      fireEvent.click(screen.getByText('Options'))
      expect(screen.queryByText('View Mode')).not.toBeVisible()
    })

    it('toggles navigation section', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar first
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      
      // Click navigation section
      fireEvent.click(screen.getByText('Navigation'))
      expect(screen.getByText('Current System')).toBeVisible()
      
      // Click again to collapse
      fireEvent.click(screen.getByText('Navigation'))
      expect(screen.queryByText('Current System')).not.toBeVisible()
    })

    it('toggles system info section', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar first
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      
      // Click system info section
      fireEvent.click(screen.getByText('System Info'))
      expect(screen.getByText('Test System')).toBeVisible()
      expect(screen.getByText('Test system description')).toBeVisible()
      
      // Click again to collapse
      fireEvent.click(screen.getByText('System Info'))
      expect(screen.queryByText('Test system description')).not.toBeVisible()
    })
  })

  describe('View Mode Controls', () => {
    it('displays and updates view mode', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar and options section
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
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
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      fireEvent.click(screen.getByText('Options'))
      
      // Test pause/play
      fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      expect(defaultProps.onPauseToggle).toHaveBeenCalled()
      
      // Test speed controls
      fireEvent.click(screen.getByRole('button', { name: /faster/i }))
      expect(defaultProps.onTimeMultiplierChange).toHaveBeenCalledWith(2)
      
      fireEvent.click(screen.getByRole('button', { name: /slower/i }))
      expect(defaultProps.onTimeMultiplierChange).toHaveBeenCalledWith(0.5)
      
      // Test speed presets
      fireEvent.click(screen.getByText('5x'))
      expect(defaultProps.onTimeMultiplierChange).toHaveBeenCalledWith(5)
    })
  })

  describe('System Navigation', () => {
    it('displays and updates system selection', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar and navigation section
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      fireEvent.click(screen.getByText('Navigation'))
      
      // Change system
      fireEvent.click(screen.getByText('Other System'))
      expect(defaultProps.onSystemChange).toHaveBeenCalledWith('other-system')
    })
  })

  describe('System Info', () => {
    it('displays system information correctly', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar and system info section
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      fireEvent.click(screen.getByText('System Info'))
      
      expect(screen.getByText('Test System')).toBeVisible()
      expect(screen.getByText('Test system description')).toBeVisible()
      expect(screen.getByText(/discovered:/i)).toBeVisible()
      expect(screen.getByText(/last updated:/i)).toBeVisible()
    })

    it('displays focused object information', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Expand sidebar and system info section
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      fireEvent.click(screen.getByText('System Info'))
      
      expect(screen.getByText('Focused: Test Object')).toBeVisible()
      expect(screen.getByText('Size: 1,000 km')).toBeVisible()
      
      // Test stop following
      fireEvent.click(screen.getByText('Stop Following'))
      expect(defaultProps.onStopFollowing).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('displays loading progress', () => {
      render(<Sidebar {...defaultProps} loadingProgress="50%" />)
      
      // Expand sidebar
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText('Loading: 50%')).toBeVisible()
    })

    it('displays error state', () => {
      render(<Sidebar {...defaultProps} error="Test error" />)
      
      // Expand sidebar
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText('Error: Test error')).toBeVisible()
    })
  })

  describe('Mode Variations', () => {
    it('displays correct title for star-citizen mode', () => {
      render(<Sidebar {...defaultProps} mode="star-citizen" />)
      
      // Expand sidebar
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText('Chart Citizen')).toBeVisible()
    })

    it('displays correct title for realistic mode', () => {
      render(<Sidebar {...defaultProps} mode="realistic" />)
      
      // Expand sidebar
      fireEvent.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText('3D Starfield')).toBeVisible()
    })
  })
}) 