/**
 * Test to validate the excessive dependency array in renderCelestialObject
 * This test specifically checks for the performance issue without requiring full rendering
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCallback } from 'react'

describe('Render Callback Dependencies Performance Issue', () => {
  it('should demonstrate that renderCelestialObject recreates on every selectedObjectId change', () => {
    // Simulate the current problematic dependency array from SystemObjectsRenderer
    const mockDependencies = {
      systemData: { objects: [{ id: 'test' }] },
      selectedObjectId: 'initial-id',
      primaryStarPosition: [0, 0, 0],
      getObjectSizing: vi.fn(),
      calculateOrbitalPeriod: vi.fn(),
      timeMultiplier: 1,
      isPaused: false,
      objectRefsMap: { current: new Map() },
      viewType: 'explorational',
      onObjectHover: vi.fn(),
      onObjectSelect: vi.fn(),
      onObjectFocus: vi.fn(),
      registerRef: vi.fn(),
      orbitalMechanics: new Map()
    }

    // Track callback recreation
    let callbackCreationCount = 0
    
    const useRenderCallback = (deps: typeof mockDependencies) => {
      return useCallback(() => {
        callbackCreationCount++
        return 'rendered'
      }, [
        deps.systemData.objects,
        deps.selectedObjectId, // ❌ This causes recreation on every selection
        deps.primaryStarPosition,
        deps.getObjectSizing,
        deps.calculateOrbitalPeriod,
        deps.timeMultiplier,
        deps.isPaused,
        deps.objectRefsMap,
        deps.viewType,
        deps.onObjectHover,
        deps.onObjectSelect,
        deps.onObjectFocus,
        deps.registerRef,
        deps.orbitalMechanics
      ])
    }

    // Initial render
    const { result, rerender } = renderHook(
      ({ deps }) => useRenderCallback(deps),
      { initialProps: { deps: mockDependencies } }
    )

    const initialCallback = result.current
    initialCallback() // Execute to increment count
    expect(callbackCreationCount).toBe(1)

    // Change selectedObjectId - this should NOT require callback recreation for performance
    // but the current implementation DOES recreate it, causing all objects to re-render
    rerender({ 
      deps: { 
        ...mockDependencies, 
        selectedObjectId: 'new-selected-id' // ❌ This change forces callback recreation
      } 
    })

    const newCallback = result.current
    
    // FAILING TEST: Demonstrates the performance issue
    // The callback should be the same reference for optimal performance,
    // but it's different because selectedObjectId is in the dependency array
    expect(newCallback).toBe(initialCallback) // ❌ This will fail, proving the issue

    newCallback() // Execute to increment count
    expect(callbackCreationCount).toBe(2) // ❌ Should still be 1 for optimal performance
  })

  it('should show the optimal dependency array that would fix the performance issue', () => {
    const mockDependencies = {
      systemData: { objects: [{ id: 'test' }] },
      selectedObjectId: 'initial-id',
      primaryStarPosition: [0, 0, 0],
      getObjectSizing: vi.fn(),
      calculateOrbitalPeriod: vi.fn(),
      timeMultiplier: 1,
      isPaused: false,
      objectRefsMap: { current: new Map() },
      viewType: 'explorational',
      onObjectHover: vi.fn(),
      onObjectSelect: vi.fn(),
      onObjectFocus: vi.fn(),
      registerRef: vi.fn(),
      orbitalMechanics: new Map()
    }

    let callbackCreationCount = 0
    
    // OPTIMAL: Move selectedObjectId handling INSIDE the callback instead of dependencies
    const useOptimalRenderCallback = (deps: typeof mockDependencies) => {
      return useCallback((currentSelectedId?: string) => {
        callbackCreationCount++
        // Use the passed selectedId instead of depending on it in closure
        const isSelected = currentSelectedId === 'test'
        return `rendered with selection: ${isSelected}`
      }, [
        deps.systemData.objects,
        // ✅ selectedObjectId removed from dependencies 
        deps.primaryStarPosition,
        deps.getObjectSizing,
        deps.calculateOrbitalPeriod,
        deps.timeMultiplier,
        deps.isPaused,
        deps.objectRefsMap,
        deps.viewType,
        deps.onObjectHover,
        deps.onObjectSelect,
        deps.onObjectFocus,
        deps.registerRef,
        deps.orbitalMechanics
      ])
    }

    const { result, rerender } = renderHook(
      ({ deps }) => useOptimalRenderCallback(deps),
      { initialProps: { deps: mockDependencies } }
    )

    const initialCallback = result.current
    initialCallback(mockDependencies.selectedObjectId)
    expect(callbackCreationCount).toBe(1)

    // Change selectedObjectId - callback should NOT be recreated
    rerender({ 
      deps: { 
        ...mockDependencies, 
        selectedObjectId: 'new-selected-id'
      } 
    })

    const newCallback = result.current
    
    // ✅ This should pass - callback reference stays the same
    expect(newCallback).toBe(initialCallback)
    
    newCallback(mockDependencies.selectedObjectId)
    expect(callbackCreationCount).toBe(1) // ✅ Still 1 - no recreation needed
  })
})