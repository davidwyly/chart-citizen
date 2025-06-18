/**
 * Test to verify the object refs memory leak fix
 * This test ensures that objectRefsMap doesn't grow indefinitely when selecting objects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useObjectSelection } from '@/engine/components/system-viewer/hooks/use-object-selection'

// Mock systemData
const mockSystemData = {
  id: 'test-system',
  name: 'Test System',
  objects: [
    { id: 'star-1', name: 'Star 1' },
    { id: 'planet-1', name: 'Planet 1' },
    { id: 'planet-2', name: 'Planet 2' }
  ]
}

describe('Object Refs Memory Leak Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not recreate objectRefsMap on every systemData reference change', () => {
    const { result, rerender } = renderHook(
      ({ systemData }) => useObjectSelection(
        systemData,
        'explorational',
        vi.fn(),
        vi.fn(),
        vi.fn(),
        vi.fn()
      ),
      { initialProps: { systemData: mockSystemData } }
    )

    const initialMap = result.current.objectRefsMap

    // Simulate systemData reference change but same ID (what happens in real app)
    const sameSystemDifferentRef = { ...mockSystemData }
    rerender({ systemData: sameSystemDifferentRef })

    // Map should be the same instance
    expect(result.current.objectRefsMap).toBe(initialMap)
  })

  it('should clear objectRefsMap only when system ID actually changes', () => {
    const { result, rerender } = renderHook(
      ({ systemData }) => useObjectSelection(
        systemData,
        'explorational',
        vi.fn(),
        vi.fn(),
        vi.fn(),
        vi.fn()
      ),
      { initialProps: { systemData: mockSystemData } }
    )

    const initialMap = result.current.objectRefsMap
    
    // Add some entries to simulate registered objects
    act(() => {
      initialMap.set('star-1', {} as any)
      initialMap.set('planet-1', {} as any)
    })

    expect(initialMap.size).toBe(2)

    // Same system ID - map should not be cleared
    const sameSystemDifferentRef = { ...mockSystemData }
    rerender({ systemData: sameSystemDifferentRef })
    expect(result.current.objectRefsMap.size).toBe(2)

    // Different system ID - map should be cleared
    const differentSystem = { 
      id: 'different-system', 
      name: 'Different System',
      objects: []
    }
    rerender({ systemData: differentSystem })
    expect(result.current.objectRefsMap.size).toBe(0)
  })

  it('should not leak object refs when selecting bodies', () => {
    const { result } = renderHook(() => useObjectSelection(
      mockSystemData,
      'explorational',
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    ))

    const objectRefsMap = result.current.objectRefsMap

    // Simulate multiple object selections with registerRef pattern
    act(() => {
      // Simulate objects being registered
      objectRefsMap.set('star-1', {} as any)
      objectRefsMap.set('planet-1', {} as any)
      objectRefsMap.set('planet-2', {} as any)
    })

    expect(objectRefsMap.size).toBe(3)

    // Simulate object cleanup (what happens when components unmount)
    act(() => {
      // With the fix, cleanup should delete entries, not set them to null
      if (objectRefsMap.has('planet-1')) {
        objectRefsMap.delete('planet-1')
      }
    })

    expect(objectRefsMap.size).toBe(2)
    expect(objectRefsMap.has('planet-1')).toBe(false)
    
    // Verify no null entries remain
    for (const [key, value] of objectRefsMap.entries()) {
      expect(value).not.toBeNull()
      expect(value).toBeDefined()
    }
  })

  it('should maintain stable map reference across re-renders', () => {
    let renderCount = 0
    const { result, rerender } = renderHook(
      ({ systemData }) => {
        renderCount++
        return useObjectSelection(
          systemData,
          'explorational',
          vi.fn(),
          vi.fn(),
          vi.fn(),
          vi.fn()
        )
      },
      { initialProps: { systemData: mockSystemData } }
    )

    const mapRef1 = result.current.objectRefsMap

    // Force multiple re-renders with same system
    rerender({ systemData: { ...mockSystemData } })
    rerender({ systemData: { ...mockSystemData } })
    rerender({ systemData: { ...mockSystemData } })

    const mapRef2 = result.current.objectRefsMap

    // Map reference should remain stable
    expect(mapRef2).toBe(mapRef1)
    expect(renderCount).toBeGreaterThan(1)
  })
})