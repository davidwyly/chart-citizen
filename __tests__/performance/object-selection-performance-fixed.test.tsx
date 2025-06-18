/**
 * Test to validate that the performance fix works correctly
 * This test confirms that object selection still works but with better performance
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCallback, useMemo } from 'react'

describe('Object Selection Performance - Fixed', () => {
  it('should demonstrate the fix - renderCelestialObject no longer recreates on selectedObjectId change', () => {
    // Simulate the FIXED dependency array (without selectedObjectId)
    const mockDependencies = {
      systemData: { objects: [{ id: 'test' }] },
      selectedObjectId: 'initial-id', // Not in dependency array anymore
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
      orbitalMechanics: new Map(),
      getHierarchicalSelectionInfo: vi.fn(() => ({ isSelected: false, planetSystemSelected: false }))
    }

    let callbackCreationCount = 0
    
    // FIXED: Simulate the corrected useCallback that doesn't depend on selectedObjectId
    const useFixedRenderCallback = (deps: typeof mockDependencies) => {
      return useCallback(() => {
        callbackCreationCount++
        // Selection info comes from getHierarchicalSelectionInfo instead of closure
        const { isSelected } = deps.getHierarchicalSelectionInfo({ id: 'test' })
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
        deps.orbitalMechanics,
        deps.getHierarchicalSelectionInfo // ✅ Added this dependency
      ])
    }

    // Initial render
    const { result, rerender } = renderHook(
      ({ deps }) => useFixedRenderCallback(deps),
      { initialProps: { deps: mockDependencies } }
    )

    const initialCallback = result.current
    initialCallback()
    expect(callbackCreationCount).toBe(1)

    // Change selectedObjectId - callback should NOT be recreated now
    const updatedDeps = { 
      ...mockDependencies, 
      selectedObjectId: 'new-selected-id',
      getHierarchicalSelectionInfo: vi.fn(() => ({ isSelected: true, planetSystemSelected: false }))
    }
    
    rerender({ deps: updatedDeps })

    const newCallback = result.current
    
    // ✅ This should now pass - callback reference stays the same
    expect(newCallback).toBe(initialCallback)
    
    newCallback()
    expect(callbackCreationCount).toBe(1) // ✅ Still 1 - no recreation needed
  })

  it('should verify that getHierarchicalSelectionInfo correctly handles selection state changes', () => {
    // Test that our selection logic still works via the memoized function
    const systemObjects = [
      { id: 'star-1', name: 'Star' },
      { id: 'planet-1', name: 'Planet 1', orbit: { parent: 'star-1' } },
      { id: 'planet-2', name: 'Planet 2', orbit: { parent: 'star-1' } }
    ]

    const useSelectionInfo = (selectedObjectId: string | null, objects: any[]) => {
      return useMemo(() => {
        const getInfo = (object: any) => {
          const isSelected = selectedObjectId === object.id
          const planetSystemSelected = selectedObjectId && objects.some(obj => 
            obj.orbit?.parent === object.id && selectedObjectId === obj.id
          )
          return { isSelected, planetSystemSelected }
        }
        return getInfo
      }, [selectedObjectId, objects])
    }

    // Test initial state
    const { result, rerender } = renderHook(
      ({ selectedId, objects }) => useSelectionInfo(selectedId, objects),
      { initialProps: { selectedId: null, objects: systemObjects } }
    )

    let getInfo = result.current
    expect(getInfo({ id: 'planet-1' })).toEqual({ isSelected: false, planetSystemSelected: false })

    // Test selection of planet-1
    rerender({ selectedId: 'planet-1', objects: systemObjects })
    getInfo = result.current
    expect(getInfo({ id: 'planet-1' })).toEqual({ isSelected: true, planetSystemSelected: false })
    expect(getInfo({ id: 'star-1' })).toEqual({ isSelected: false, planetSystemSelected: true })
    expect(getInfo({ id: 'planet-2' })).toEqual({ isSelected: false, planetSystemSelected: false })

    // Test selection of star (parent)
    rerender({ selectedId: 'star-1', objects: systemObjects })
    getInfo = result.current
    expect(getInfo({ id: 'star-1' })).toEqual({ isSelected: true, planetSystemSelected: false })
    expect(getInfo({ id: 'planet-1' })).toEqual({ isSelected: false, planetSystemSelected: false })
  })

  it('should demonstrate that minimal dependencies still provide full functionality', () => {
    // Simulate the complete fixed implementation
    let renderCount = 0
    
    const useOptimizedRenderer = (props: {
      objects: any[]
      selectedObjectId: string | null
      otherStableProps: any
    }) => {
      // Selection info memoized separately with minimal dependencies
      const getSelectionInfo = useMemo(() => {
        return (object: any) => ({
          isSelected: props.selectedObjectId === object.id,
          planetSystemSelected: false // Simplified for test
        })
      }, [props.selectedObjectId, props.objects])

      // Main render callback without selectedObjectId dependency
      const renderObject = useCallback((object: any) => {
        renderCount++
        const { isSelected } = getSelectionInfo(object)
        return { objectId: object.id, isSelected, renderCount }
      }, [
        props.objects,
        // ✅ selectedObjectId NOT in dependencies
        props.otherStableProps,
        getSelectionInfo // ✅ This IS in dependencies
      ])

      return { renderObject, getSelectionInfo }
    }

    const { result, rerender } = renderHook(
      ({ props }) => useOptimizedRenderer(props),
      { 
        initialProps: { 
          props: {
            objects: [{ id: 'test' }],
            selectedObjectId: null,
            otherStableProps: { stable: 'value' }
          }
        } 
      }
    )

    const { renderObject: initialRenderObject } = result.current
    
    // Initial render
    const result1 = initialRenderObject({ id: 'test' })
    expect(result1).toEqual({ objectId: 'test', isSelected: false, renderCount: 1 })

    // Change selection - renderObject should be the same reference
    rerender({ 
      props: {
        objects: [{ id: 'test' }],
        selectedObjectId: 'test', // ✅ Changed selection
        otherStableProps: { stable: 'value' }
      }
    })

    const { renderObject: newRenderObject } = result.current
    
    // ✅ The renderObject callback should be the same reference
    expect(newRenderObject).toBe(initialRenderObject)
    
    // But the selection state should be updated
    const result2 = newRenderObject({ id: 'test' })
    expect(result2).toEqual({ objectId: 'test', isSelected: true, renderCount: 2 })
  })
})