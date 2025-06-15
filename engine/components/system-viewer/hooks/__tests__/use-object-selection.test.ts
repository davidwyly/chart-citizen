import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useObjectSelection } from '../use-object-selection'
import * as THREE from 'three'
import type { OrbitalSystemData } from '@/engine/types/orbital-system'

// Mock the orbital system types
const mockSystemData: OrbitalSystemData = {
  id: 'test-system',
  name: 'Test System',
  description: 'A test system for unit testing',
  lighting: {
    primary_star: 'sol-star',
    ambient_level: 0.1,
    stellar_influence_radius: 100.0
  },
  objects: [
    {
      id: 'earth',
      name: 'Earth',
      classification: 'planet' as const,
      geometry_type: 'terrestrial' as const,
      properties: { mass: 1, radius: 6371, temperature: 60 },
      orbit: {
        parent: 'sol-star',
        semi_major_axis: 1,
        eccentricity: 0.017,
        inclination: 0,
        orbital_period: 365,
      }
    }
  ]
}

describe('useObjectSelection pause/unpause behavior', () => {
  let mockPauseSimulation: ReturnType<typeof vi.fn>
  let mockUnpauseSimulation: ReturnType<typeof vi.fn>
  let mockSetTimeMultiplier: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockPauseSimulation = vi.fn()
    mockUnpauseSimulation = vi.fn()
    mockSetTimeMultiplier = vi.fn()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should pause immediately when object is selected (if not already paused)', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'realistic', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Should pause immediately when not already paused
    expect(mockPauseSimulation).toHaveBeenCalledTimes(1)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(0)
  })

  it('should not pause again if already paused', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'realistic', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, true)
    )

    const mockObject = new THREE.Object3D()
    
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Should not pause again if already paused
    expect(mockPauseSimulation).toHaveBeenCalledTimes(0)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(0)
  })

  it('should unpause after camera navigation completes', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'realistic', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Should pause immediately
    expect(mockPauseSimulation).toHaveBeenCalledTimes(1)

    // Fast-forward time to trigger the unpause
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should unpause after delay
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple rapid selections correctly', () => {
    let isPaused = false
    
    const { result, rerender } = renderHook(
      ({ isPausedState }) => 
        useObjectSelection(mockSystemData, 'realistic', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, isPausedState),
      { initialProps: { isPausedState: isPaused } }
    )

    const mockObject1 = new THREE.Object3D()
    const mockObject2 = new THREE.Object3D()
    
    // First selection
    act(() => {
      result.current.handleObjectSelect('earth', mockObject1, 'Earth')
      isPaused = true // Simulate the pause state change
    })

    expect(mockPauseSimulation).toHaveBeenCalledTimes(1)

    // Re-render with updated pause state
    rerender({ isPausedState: isPaused })

    // Second selection before first timeout completes (now system is paused)
    act(() => {
      result.current.handleObjectSelect('earth', mockObject2, 'Earth')
    })

    // Should have paused only once (since already paused after first selection)
    expect(mockPauseSimulation).toHaveBeenCalledTimes(1)

    // Fast-forward past timeout
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should have unpaused once (the second timeout should have cleared the first)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1)
  })

  it('should maintain consistent behavior regardless of initial pause state', () => {
    // Test with initially unpaused state
    const { result: unpausedResult } = renderHook(() => 
      useObjectSelection(mockSystemData, 'realistic', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    
    act(() => {
      unpausedResult.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(mockPauseSimulation).toHaveBeenCalledTimes(1)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1)

    // Reset mocks
    mockPauseSimulation.mockClear()
    mockUnpauseSimulation.mockClear()

    // Test with initially paused state
    const { result: pausedResult } = renderHook(() => 
      useObjectSelection(mockSystemData, 'realistic', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, true)
    )

    act(() => {
      pausedResult.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should not pause again, but should still unpause
    expect(mockPauseSimulation).toHaveBeenCalledTimes(0)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1)
  })
}) 