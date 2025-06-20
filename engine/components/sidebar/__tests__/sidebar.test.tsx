import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { Sidebar } from '../sidebar'
import type { ViewType } from '@lib/types/effects-level'
import type { OrbitalSystemData } from '@engine/types/orbital-system'

// Mock useFrame
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn((callback) => {
    callback({ clock: { getElapsedTime: () => 0 } })
  }),
}))

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

// Mock child components
vi.mock('../view-mode-selector', () => ({
  ViewModeSelector: ({ viewType, onViewTypeChange }: { viewType: ViewType; onViewTypeChange: (type: ViewType) => void }) => (
    <div data-testid="view-mode-selector">
      <button onClick={() => onViewTypeChange('explorational')}>Explorational</button>
      <button onClick={() => onViewTypeChange('navigational')}>Navigational</button>
      <span>Current: {viewType}</span>
    </div>
  ),
}))

vi.mock('../time-controls', () => ({
  TimeControls: ({ timeMultiplier, onTimeMultiplierChange, isPaused, onPauseToggle }: any) => (
    <div data-testid="time-controls">
      <button onClick={() => onTimeMultiplierChange(2)}>2x Speed</button>
      <button onClick={onPauseToggle}>{isPaused ? 'Play' : 'Pause'}</button>
      <span>Speed: {timeMultiplier}x</span>
    </div>
  ),
}))

vi.mock('../system-selector', () => ({
  SystemSelector: ({ availableSystems, currentSystem, onSystemChange }: any) => (
    <div data-testid="system-selector">
      <select value={currentSystem} onChange={(e) => onSystemChange(e.target.value)}>
        {Object.keys(availableSystems).map((systemId) => (
          <option key={systemId} value={systemId}>
            {availableSystems[systemId].name}
          </option>
        ))}
      </select>
      <span>Current System: {currentSystem}</span>
    </div>
  ),
}))

vi.mock('../system-info', () => ({
  SystemInfo: ({ systemData, focusedName, error, loadingProgress }: any) => (
    <div data-testid="system-info">
      {error && <div data-testid="error">Error: {error}</div>}
      {focusedName && <div data-testid="focused-object">Focused: {focusedName}</div>}
      {loadingProgress && <div data-testid="loading">Loading: {loadingProgress}</div>}
      {systemData && <div data-testid="system-data">System: {systemData.name}</div>}
    </div>
  ),
}))

const mockProps = {
  onViewTypeChange: vi.fn(),
  onTimeMultiplierChange: vi.fn(),
  onPauseToggle: vi.fn(),
  currentViewType: 'explorational' as ViewType,
  currentTimeMultiplier: 1,
  isPaused: false,
  currentZoom: 1.0,
  systemData: {
    id: 'test-system',
    name: 'Test System',
    description: 'Test system description',
    objects: [],
    lighting: {
      primary_star: 'test-star',
      ambient_level: 0.5,
      stellar_influence_radius: 1000
    }
  } as OrbitalSystemData,
  availableSystems: {
    'test-system': { name: 'Test System' },
    'another-system': { name: 'Another System' },
  },
  currentSystem: 'test-system',
  onSystemChange: vi.fn(),
  focusedName: '',
  focusedObjectSize: null,
  selectedObjectData: null,
  onStopFollowing: vi.fn(),
  error: null,
  loadingProgress: '',
  mode: 'realistic' as const,
  autoAdjustTime: false,
  onAutoAdjustToggle: vi.fn(),
}

describe('Enhanced Sidebar with Time Controls Section', () => {
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
    render(<Sidebar {...mockProps} />)
    
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveClass('w-16')
  })

  it('shows skeleton during expansion animation with 4 sections', async () => {
    render(<Sidebar {...mockProps} />)
    
    const toggleButton = screen.getByTestId('sidebar-toggle')
    
    // Click to expand
    fireEvent.click(toggleButton)
    
    // Should show skeleton immediately (4 sections now: Options, Time Controls, Navigation, System Info)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4) // Header, 4 sections, footer skeletons
    
    // Fast-forward through animation
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Wait for content to appear
    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton')).toHaveLength(0)
    })
  })

  it('expands and shows content after animation', async () => {
    render(<Sidebar {...mockProps} />)
    
    const toggleButton = screen.getByTestId('sidebar-toggle')
    
    // Click to expand
    fireEvent.click(toggleButton)
    
    // Fast-forward through animation
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Should be expanded and show content
    await waitFor(() => {
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('w-80')
      
      // Should show actual content, not skeletons
      expect(screen.queryAllByTestId('skeleton')).toHaveLength(0)
      
      // Should show the title (may appear multiple times in header/footer)
      expect(screen.getAllByText('3D Starfield')).toHaveLength(2)
    })
  })

  it('shows all four sections: Options, Time Controls, Navigation, and System Info', async () => {
    render(<Sidebar {...mockProps} />)
    
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Options')).toBeInTheDocument()
      expect(screen.getByText('Time Controls')).toBeInTheDocument()
      expect(screen.getByText('Navigation')).toBeInTheDocument()
      expect(screen.getByText('System Info')).toBeInTheDocument()
    })
  })

  it('opens Time Controls section and shows time controls', async () => {
    render(<Sidebar {...mockProps} />)
    
    // Expand sidebar first
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      // Find and click Time Controls section
      const timeControlsButton = screen.getByText('Time Controls').closest('button')!
      fireEvent.click(timeControlsButton)
    })
    
    // Should show time controls
    await waitFor(() => {
      expect(screen.getByTestId('time-controls')).toBeInTheDocument()
      expect(screen.getByText('Speed: 1x')).toBeInTheDocument()
    })
  })

  it('opens Options section and shows view mode selector without time controls', async () => {
    render(<Sidebar {...mockProps} />)
    
    // Expand sidebar first
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      // Find and click Options section
      const optionsButton = screen.getByText('Options').closest('button')!
      fireEvent.click(optionsButton)
    })
    
    // Should show view mode selector but NOT time controls
    await waitFor(() => {
      expect(screen.getByTestId('view-mode-selector')).toBeInTheDocument()
      expect(screen.queryByTestId('time-controls')).not.toBeInTheDocument()
      expect(screen.getByText('Camera')).toBeInTheDocument()
      expect(screen.getByText('Version')).toBeInTheDocument()
    })
  })

  it('handles time control interactions in Time Controls section', async () => {
    render(<Sidebar {...mockProps} />)
    
    // Expand and open Time Controls
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      const timeControlsButton = screen.getByText('Time Controls').closest('button')!
      fireEvent.click(timeControlsButton)
    })
    
    await waitFor(() => {
      const speedButton = screen.getByText('2x Speed')
      fireEvent.click(speedButton)
      expect(mockProps.onTimeMultiplierChange).toHaveBeenCalledWith(2)
      
      const pauseButton = screen.getByText('Pause')
      fireEvent.click(pauseButton)
      expect(mockProps.onPauseToggle).toHaveBeenCalled()
    })
  })

  it('collapses immediately without skeleton', () => {
    render(<Sidebar {...mockProps} />)
    
    const toggleButton = screen.getByTestId('sidebar-toggle')
    
    // Expand first
    fireEvent.click(toggleButton)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Then collapse
    fireEvent.click(toggleButton)
    
    // Should collapse immediately
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveClass('w-16')
    
    // Should not show any skeletons during collapse
    expect(screen.queryAllByTestId('skeleton')).toHaveLength(0)
  })

  it('opens sections when clicked in collapsed state', async () => {
    render(<Sidebar {...mockProps} />)
    
    // Find time controls section icon in collapsed state
    const sidebarSections = screen.getByTestId('sidebar').querySelectorAll('button')
    const timeControlsButton = Array.from(sidebarSections).find(button => 
      button.querySelector('svg') && !button.hasAttribute('data-testid')
    )
    
    expect(timeControlsButton).toBeDefined()
    
    if (timeControlsButton) {
      fireEvent.click(timeControlsButton)
      
      // Should expand and open the time controls section
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        const sidebar = screen.getByTestId('sidebar')
        expect(sidebar).toHaveClass('w-80')
        expect(screen.getByTestId('time-controls')).toBeInTheDocument()
      })
    }
  })

  it('handles section toggles correctly when expanded', async () => {
    render(<Sidebar {...mockProps} />)
    
    // Expand sidebar first
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      // Navigation should be open by default
      expect(screen.getByTestId('system-selector')).toBeInTheDocument()
    })
    
    // Find and click Options section
    const optionsButton = screen.getByText('Options').closest('button')!
    fireEvent.click(optionsButton)
    
    // Should show view mode selector
    await waitFor(() => {
      expect(screen.getByTestId('view-mode-selector')).toBeInTheDocument()
    })
  })

  it('displays error states correctly', async () => {
    const propsWithError = {
      ...mockProps,
      error: 'Test error message',
    }
    
    render(<Sidebar {...propsWithError} />)
    
    // Expand sidebar
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Open System Info section to see error
    await waitFor(() => {
      const infoButton = screen.getByText('System Info').closest('button')!
      fireEvent.click(infoButton)
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Error: Test error message')
    })
  })

  it('displays focused object information', async () => {
    const propsWithFocus = {
      ...mockProps,
      focusedName: 'Test Star',
    }
    
    render(<Sidebar {...propsWithFocus} />)
    
    // Expand sidebar
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Open System Info section
    await waitFor(() => {
      const infoButton = screen.getByText('System Info').closest('button')!
      fireEvent.click(infoButton)
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('focused-object')).toHaveTextContent('Focused: Test Star')
    })
  })

  it('handles view type changes in Options section', async () => {
    render(<Sidebar {...mockProps} />)
    
    // Expand and open Options
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      const optionsButton = screen.getByText('Options').closest('button')!
      fireEvent.click(optionsButton)
    })
    
    await waitFor(() => {
      const explorationButton = screen.getByText('Explorational')
      fireEvent.click(explorationButton)
      expect(mockProps.onViewTypeChange).toHaveBeenCalledWith('explorational')
    })
  })

  it('handles system changes in Navigation section', async () => {
    render(<Sidebar {...mockProps} />)
    
    // Expand sidebar (navigation is open by default)
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      const systemSelector = screen.getByTestId('system-selector').querySelector('select')!
      fireEvent.change(systemSelector, { target: { value: 'another-system' } })
      expect(mockProps.onSystemChange).toHaveBeenCalledWith('another-system')
    })
  })

  it('shows correct mode-specific title', async () => {
    const starCitizenProps = {
      ...mockProps,
      mode: 'star-citizen' as const,
    }
    
    render(<Sidebar {...starCitizenProps} />)
    
    // Expand sidebar
    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    await waitFor(() => {
      expect(screen.getAllByText('Chart Citizen')).toHaveLength(2) // Header and footer
    })
  })
}) 