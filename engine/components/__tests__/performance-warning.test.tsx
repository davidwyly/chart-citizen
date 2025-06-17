import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { PerformanceWarning } from '../performance-warning'
import { usePerformanceMonitor } from '@/lib/performance-monitor'

// Mock the performance monitor hook
vi.mock('@/lib/performance-monitor', () => ({
  usePerformanceMonitor: vi.fn()
}))

describe('PerformanceWarning', () => {
  const mockUsePerformanceMonitor = usePerformanceMonitor as any

  beforeEach(() => {
    mockUsePerformanceMonitor.mockReset()
  })

  it('should not render when performance is good', () => {
    mockUsePerformanceMonitor.mockReturnValue({
      fps: 60,
      isLowPerformance: false
    })

    const { container } = render(<PerformanceWarning />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render warning when performance is low', () => {
    mockUsePerformanceMonitor.mockReturnValue({
      fps: 15,
      isLowPerformance: true
    })

    render(<PerformanceWarning />)
    
    expect(screen.getByText('Low Performance Detected')).toBeInTheDocument()
    expect(screen.getByText('Current FPS: 15')).toBeInTheDocument()
    expect(screen.getByText('Consider lowering effects quality')).toBeInTheDocument()
  })

  it('should update when performance metrics change', () => {
    // Initial render with good performance
    mockUsePerformanceMonitor.mockReturnValue({
      fps: 60,
      isLowPerformance: false
    })

    const { rerender } = render(<PerformanceWarning />)
    expect(screen.queryByText('Low Performance Detected')).not.toBeInTheDocument()

    // Update to low performance
    mockUsePerformanceMonitor.mockReturnValue({
      fps: 15,
      isLowPerformance: true
    })

    rerender(<PerformanceWarning />)
    expect(screen.getByText('Low Performance Detected')).toBeInTheDocument()
  })
}) 