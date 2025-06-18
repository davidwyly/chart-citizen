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
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
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
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, true)
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
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Should pause immediately
    expect(mockPauseSimulation).toHaveBeenCalledTimes(1)

    // Simulate animation completion
    act(() => {
      result.current.handleAnimationComplete()
    })

    // Should unpause after animation completes
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple rapid selections correctly', () => {
    // Start with paused state to test the "select same object while paused" behavior
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, true)
    )

    const mockObject = new THREE.Object3D()
    
    // First selection while already paused - should not pause again
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    expect(mockPauseSimulation).toHaveBeenCalledTimes(0) // Should not pause again

    // Select the same object again while paused - should unpause immediately
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1) // Should unpause immediately
  })

  it('should maintain consistent behavior regardless of initial pause state', () => {
    // Test with initially unpaused state
    const { result: unpausedResult } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    
    act(() => {
      unpausedResult.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    act(() => {
      unpausedResult.current.handleAnimationComplete()
    })

    expect(mockPauseSimulation).toHaveBeenCalledTimes(1)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1)

    // Reset mocks
    mockPauseSimulation.mockClear()
    mockUnpauseSimulation.mockClear()

    // Test with initially paused state
    const { result: pausedResult } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, true)
    )

    act(() => {
      pausedResult.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Should not pause again when already paused, and should not unpause without animation completion
    expect(mockPauseSimulation).toHaveBeenCalledTimes(0)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(0)
  })

  it('should unpause immediately when selecting the same object while paused', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, true)
    )

    const mockObject = new THREE.Object3D()
    
    // First selection - should not pause since already paused
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    expect(mockPauseSimulation).toHaveBeenCalledTimes(0)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(0)

    // Select the same object again while paused - should unpause immediately
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    expect(mockPauseSimulation).toHaveBeenCalledTimes(0)
    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1)
  })

  describe('Camera Framing Consistency - Race Condition Prevention', () => {
  it('should preserve focusedObjectSize when handleObjectSelect is called after handleObjectFocus', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Step 1: handleObjectFocus sets focus properties (breadcrumb navigation)
    act(() => {
      result.current.handleObjectFocus(
        mockObject,
        'Earth',
        1.5, // visualSize
        6371, // radius
        1, // mass
        1.0 // orbitRadius
      )
    })

    // Verify focus properties are set
    expect(result.current.focusedObjectSize).toBe(1.5)
    expect(result.current.focusedObjectRadius).toBe(6371)
    expect(result.current.focusedObjectMass).toBe(1)
    expect(result.current.focusedObjectOrbitRadius).toBe(1.0)

    // Step 2: handleObjectSelect should preserve these values (not reset to null)
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // ✅ THE FIX: focusedObjectSize should be preserved, not reset to null
    expect(result.current.focusedObjectSize).toBe(1.5)
    expect(result.current.focusedObjectRadius).toBe(6371)
    expect(result.current.focusedObjectMass).toBe(1)
    expect(result.current.focusedObjectOrbitRadius).toBe(1.0)
    expect(result.current.selectedObjectId).toBe('earth')
  })

  it('should allow renderer to set focus properties when no previous values exist', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Step 1: handleObjectSelect called first (direct object click)
    act(() => {
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Focus properties should be null initially
    expect(result.current.focusedObjectSize).toBe(null)
    expect(result.current.focusedObjectRadius).toBe(null)
    expect(result.current.selectedObjectId).toBe('earth')

    // Step 2: Renderer calls handleObjectFocus to set properties
    act(() => {
      result.current.handleObjectFocus(
        mockObject,
        'Earth',
        1.5, // visualSize from renderer
        6371, // radius
        1, // mass
        1.0 // orbitRadius
      )
    })

    // Now focus properties should be set
    expect(result.current.focusedObjectSize).toBe(1.5)
    expect(result.current.focusedObjectRadius).toBe(6371)
  })

  it('should handle multiple rapid focus/select calls correctly', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Rapid sequence of calls (could happen during breadcrumb navigation)
    act(() => {
      result.current.handleObjectFocus(mockObject, 'Earth', 1.5, 6371, 1, 1.0)
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
      result.current.handleObjectFocus(mockObject, 'Earth', 1.8, 6371, 1, 1.0) // Updated visual size
    })

    // Should end up with the latest values
    expect(result.current.focusedObjectSize).toBe(1.8)
    expect(result.current.selectedObjectId).toBe('earth')
  })

  it('should handle view mode transitions without losing focus properties', () => {
    // Test with different view modes
    const viewModes: Array<'explorational' | 'navigational' | 'profile' | 'scientific'> = 
      ['explorational', 'navigational', 'profile', 'scientific']

    viewModes.forEach(viewMode => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, viewMode, mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      )

      const mockObject = new THREE.Object3D()
      mockObject.name = 'Earth'

      // Set focus properties for this view mode
      const visualSizeForMode = viewMode === 'explorational' ? 1.5 : 
                               viewMode === 'navigational' ? 1.8 :
                               viewMode === 'profile' ? 1.0 : 0.5

      act(() => {
        result.current.handleObjectFocus(mockObject, 'Earth', visualSizeForMode, 6371, 1, 1.0)
        result.current.handleObjectSelect('earth', mockObject, 'Earth')
      })

      // Focus properties should be preserved for each view mode
      expect(result.current.focusedObjectSize).toBe(visualSizeForMode)
      expect(result.current.selectedObjectId).toBe('earth')
    })
  })
})

describe('Camera Framing Consistency - Focus Size Management', () => {
  it('should handle undefined visual size gracefully', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Call handleObjectFocus without visualSize parameter
    act(() => {
      result.current.handleObjectFocus(mockObject, 'Earth')
    })

    // Should handle gracefully - focusedObjectSize should be null
    expect(result.current.focusedObjectSize).toBe(null)
    expect(result.current.focusedName).toBe('Earth')
  })

  it('should handle zero and negative visual sizes', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Test zero visual size
    act(() => {
      result.current.handleObjectFocus(mockObject, 'Earth', 0)
    })
    expect(result.current.focusedObjectSize).toBe(0)

    // Test negative visual size (should be preserved as-is for camera controller to handle)
    act(() => {
      result.current.handleObjectFocus(mockObject, 'Earth', -1.5)
    })
    expect(result.current.focusedObjectSize).toBe(-1.5)
  })

  it('should handle very large visual sizes', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    const largeVisualSize = 1000000
    act(() => {
      result.current.handleObjectFocus(mockObject, 'Earth', largeVisualSize)
    })

    expect(result.current.focusedObjectSize).toBe(largeVisualSize)
  })

  it('should preserve focus properties when object name changes', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Set initial focus
    act(() => {
      result.current.handleObjectFocus(mockObject, 'Earth', 1.5, 6371)
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Update with new name but same object
    act(() => {
      result.current.handleObjectFocus(mockObject, 'Earth (Updated)', 1.5, 6371)
    })

    expect(result.current.focusedName).toBe('Earth (Updated)')
    expect(result.current.focusedObjectSize).toBe(1.5)
    expect(result.current.selectedObjectId).toBe('earth')
  })
})

describe('Camera Framing Consistency - Integration Scenarios', () => {
  it('should simulate complete breadcrumb navigation flow', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Simulate breadcrumb click sequence:
    // 1. SystemBreadcrumb calculates visual size and calls handleObjectFocus
    // 2. Selection system calls handleObjectSelect
    // 3. Both should work together without race conditions

    act(() => {
      // Step 1: Breadcrumb calls handleObjectFocus with calculated visual size
      result.current.handleObjectFocus(
        mockObject,
        'Earth',
        1.5, // calculated from getObjectSizing in breadcrumb
        6371,
        1,
        1.0
      )
      
      // Step 2: Selection system calls handleObjectSelect
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Verify the complete state is correct
    expect(result.current.selectedObjectId).toBe('earth')
    expect(result.current.focusedName).toBe('Earth')
    expect(result.current.focusedObjectSize).toBe(1.5) // ✅ Preserved, not reset
    expect(result.current.focusedObjectRadius).toBe(6371)
    expect(result.current.focusedObjectMass).toBe(1)
    expect(result.current.focusedObjectOrbitRadius).toBe(1.0)
  })

  it('should simulate direct object click flow', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Simulate direct object click sequence:
    // 1. InteractiveObject calls handleObjectSelect first
    // 2. Renderer calls handleObjectFocus with visual size

    act(() => {
      // Step 1: Direct click calls handleObjectSelect first
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    // Initially, focus properties should be null
    expect(result.current.selectedObjectId).toBe('earth')
    expect(result.current.focusedObjectSize).toBe(null)

    act(() => {
      // Step 2: Renderer calls handleObjectFocus with visual size
      result.current.handleObjectFocus(
        mockObject,
        'Earth',
        1.5 // visual size from renderer
      )
    })

    // Now focus properties should be set
    expect(result.current.focusedObjectSize).toBe(1.5)
    expect(result.current.focusedName).toBe('Earth')
  })

  it('should handle switching between different objects', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const earthObject = new THREE.Object3D()
    earthObject.name = 'Earth'
    
    const marsObject = new THREE.Object3D()
    marsObject.name = 'Mars'

    // Select Earth first
    act(() => {
      result.current.handleObjectFocus(earthObject, 'Earth', 1.5, 6371, 1, 1.0)
      result.current.handleObjectSelect('earth', earthObject, 'Earth')
    })

    expect(result.current.selectedObjectId).toBe('earth')
    expect(result.current.focusedObjectSize).toBe(1.5)

    // Switch to Mars
    act(() => {
      result.current.handleObjectFocus(marsObject, 'Mars', 0.8, 3390, 0.11, 1.52)
      result.current.handleObjectSelect('mars', marsObject, 'Mars')
    })

    // Should have Mars properties now
    expect(result.current.selectedObjectId).toBe('mars')
    expect(result.current.focusedName).toBe('Mars')
    expect(result.current.focusedObjectSize).toBe(0.8)
    expect(result.current.focusedObjectRadius).toBe(3390)
    expect(result.current.focusedObjectMass).toBe(0.11)
  })

  it('should handle animation completion during object transitions', () => {
    const { result } = renderHook(() => 
      useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
    )

    const mockObject = new THREE.Object3D()
    mockObject.name = 'Earth'

    // Select object and trigger animation
    act(() => {
      result.current.handleObjectFocus(mockObject, 'Earth', 1.5)
      result.current.handleObjectSelect('earth', mockObject, 'Earth')
    })

    expect(mockPauseSimulation).toHaveBeenCalledTimes(1)

    // Complete animation
    act(() => {
      result.current.handleAnimationComplete()
    })

    expect(mockUnpauseSimulation).toHaveBeenCalledTimes(1)
    
    // Focus properties should remain intact after animation
    expect(result.current.focusedObjectSize).toBe(1.5)
    expect(result.current.selectedObjectId).toBe('earth')
  })
  })
}) 