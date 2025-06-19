/**
 * Tests for moon navigation persistence when moons are selected
 * 
 * ISSUE: When a moon is selected in the nav bar, the moon navigation disappears,
 * making it impossible to cycle through sibling moons easily.
 * 
 * EXPECTED BEHAVIOR: Moon navigation should stay visible when any moon is selected,
 * allowing easy cycling through sibling moons.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SystemBreadcrumb } from '../system-breadcrumb'
import type { OrbitalSystemData } from '@/engine/types/orbital-system'

// Mock system data with a planet and multiple moons
const mockSystemDataWithMoons: OrbitalSystemData = {
  id: 'test-system',
  name: 'Test System',
  objects: [
    {
      id: 'test-star',
      name: 'Test Star',
      classification: 'star',
      geometry_type: 'star',
      properties: { mass: 1, radius: 695700, temperature: 5778 }
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      classification: 'planet',
      geometry_type: 'gas_giant',
      properties: { mass: 317.8, radius: 69911, temperature: 165 },
      orbit: {
        parent: 'test-star',
        semi_major_axis: 5.2,
        eccentricity: 0.049,
        inclination: 1.3,
        orbital_period: 4333
      }
    },
    {
      id: 'io',
      name: 'Io',
      classification: 'moon',
      geometry_type: 'terrestrial',
      properties: { mass: 0.015, radius: 1821, temperature: 110 },
      orbit: {
        parent: 'jupiter',
        semi_major_axis: 0.00282,
        eccentricity: 0.0041,
        inclination: 0.05,
        orbital_period: 1.77
      }
    },
    {
      id: 'europa',
      name: 'Europa',
      classification: 'moon',
      geometry_type: 'terrestrial',
      properties: { mass: 0.008, radius: 1560, temperature: 102 },
      orbit: {
        parent: 'jupiter',
        semi_major_axis: 0.00449,
        eccentricity: 0.009,
        inclination: 0.47,
        orbital_period: 3.55
      }
    },
    {
      id: 'ganymede',
      name: 'Ganymede',
      classification: 'moon',
      geometry_type: 'terrestrial',
      properties: { mass: 0.025, radius: 2634, temperature: 110 },
      orbit: {
        parent: 'jupiter',
        semi_major_axis: 0.00717,
        eccentricity: 0.0013,
        inclination: 0.2,
        orbital_period: 7.15
      }
    }
  ],
  lighting: { primary_star: 'test-star', ambient_level: 0.1 },
  metadata: { version: '2.0', last_updated: '2025-01-01' }
}

describe('Moon Navigation Persistence', () => {
  let mockObjectRefsMap: React.MutableRefObject<Map<string, any>>
  let mockOnObjectFocus: ReturnType<typeof vi.fn>
  let mockOnObjectSelect: ReturnType<typeof vi.fn>
  let mockGetObjectSizing: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Create mock Three.js objects for the test
    const mockThreeObject = { position: { x: 0, y: 0, z: 0 } }
    
    mockObjectRefsMap = { 
      current: new Map([
        ['europa', mockThreeObject],
        ['io', mockThreeObject],
        ['ganymede', mockThreeObject]
      ])
    }
    mockOnObjectFocus = vi.fn()
    mockOnObjectSelect = vi.fn()
    mockGetObjectSizing = vi.fn().mockReturnValue({ visualSize: 1.0 })
  })

  it('should show moon navigation when Jupiter is focused', () => {
    render(
      <SystemBreadcrumb
        systemData={mockSystemDataWithMoons}
        objectRefsMap={mockObjectRefsMap}
        onObjectFocus={mockOnObjectFocus}
        onObjectSelect={mockOnObjectSelect}
        focusedName="Jupiter"
        getObjectSizing={mockGetObjectSizing}
      />
    )

    // Should show moon navigation for Jupiter
    expect(screen.getByText('Moons:')).toBeInTheDocument()
    
    // Should show all three moons
    expect(screen.getByTitle('Io')).toBeInTheDocument()
    expect(screen.getByTitle('Europa')).toBeInTheDocument()
    expect(screen.getByTitle('Ganymede')).toBeInTheDocument()
  })

  it('should keep moon navigation visible when Io is selected', () => {
    render(
      <SystemBreadcrumb
        systemData={mockSystemDataWithMoons}
        objectRefsMap={mockObjectRefsMap}
        onObjectFocus={mockOnObjectFocus}
        onObjectSelect={mockOnObjectSelect}
        focusedName="Io"  // Moon is focused, not planet
        getObjectSizing={mockGetObjectSizing}
      />
    )

    // FAILING: Moon navigation should still be visible when a moon is selected
    // This currently fails because the logic only shows moon nav when a planet is focused
    expect(screen.getByText('Moons:')).toBeInTheDocument()
    
    // Should show all sibling moons for easy cycling
    expect(screen.getByTitle('Io')).toBeInTheDocument()
    expect(screen.getByTitle('Europa')).toBeInTheDocument()
    expect(screen.getByTitle('Ganymede')).toBeInTheDocument()
    
    // The focused moon (Io) should be highlighted
    const ioButton = screen.getByTitle('Io')
    expect(ioButton).toHaveClass('bg-purple-600/40')
  })

  it('should keep moon navigation visible when Europa is selected', () => {
    render(
      <SystemBreadcrumb
        systemData={mockSystemDataWithMoons}
        objectRefsMap={mockObjectRefsMap}
        onObjectFocus={mockOnObjectFocus}
        onObjectSelect={mockOnObjectSelect}
        focusedName="Europa"  // Different moon focused
        getObjectSizing={mockGetObjectSizing}
      />
    )

    // FAILING: Should still show moon navigation
    expect(screen.getByText('Moons:')).toBeInTheDocument()
    
    // Should show all sibling moons
    expect(screen.getByTitle('Io')).toBeInTheDocument()
    expect(screen.getByTitle('Europa')).toBeInTheDocument()
    expect(screen.getByTitle('Ganymede')).toBeInTheDocument()
    
    // The focused moon (Europa) should be highlighted
    const europaButton = screen.getByTitle('Europa')
    expect(europaButton).toHaveClass('bg-purple-600/40')
  })

  it('should allow cycling through moons when moon is selected', async () => {
    const { rerender } = render(
      <SystemBreadcrumb
        systemData={mockSystemDataWithMoons}
        objectRefsMap={mockObjectRefsMap}
        onObjectFocus={mockOnObjectFocus}
        onObjectSelect={mockOnObjectSelect}
        focusedName="Io"  // Start with Io selected
        getObjectSizing={mockGetObjectSizing}
      />
    )

    // FAILING: Moon navigation should be visible
    expect(screen.getByText('Moons:')).toBeInTheDocument()
    
    // Click on Europa to switch to it
    const europaButton = screen.getByTitle('Europa')
    fireEvent.click(europaButton)
    
    // Should have called the handlers
    expect(mockOnObjectFocus).toHaveBeenCalled()
    expect(mockOnObjectSelect).toHaveBeenCalled()
    
    // Rerender with Europa focused
    rerender(
      <SystemBreadcrumb
        systemData={mockSystemDataWithMoons}
        objectRefsMap={mockObjectRefsMap}
        onObjectFocus={mockOnObjectFocus}
        onObjectSelect={mockOnObjectSelect}
        focusedName="Europa"  // Now Europa is focused
        getObjectSizing={mockGetObjectSizing}
      />
    )
    
    // FAILING: Moon navigation should still be visible
    expect(screen.getByText('Moons:')).toBeInTheDocument()
    
    // Europa should now be highlighted
    const newEuropaButton = screen.getByTitle('Europa')
    expect(newEuropaButton).toHaveClass('bg-purple-600/40')
  })

  it('should hide moon navigation when no planet or moon is focused', () => {
    render(
      <SystemBreadcrumb
        systemData={mockSystemDataWithMoons}
        objectRefsMap={mockObjectRefsMap}
        onObjectFocus={mockOnObjectFocus}
        onObjectSelect={mockOnObjectSelect}
        focusedName="Test Star"  // Star focused, not planet or moon
        getObjectSizing={mockGetObjectSizing}
      />
    )

    // Should NOT show moon navigation when star is focused
    expect(screen.queryByText('Moons:')).not.toBeInTheDocument()
  })

  it('should hide moon navigation when planet with no moons is focused', () => {
    const systemWithoutMoons: OrbitalSystemData = {
      ...mockSystemDataWithMoons,
      objects: mockSystemDataWithMoons.objects.filter(obj => obj.classification !== 'moon')
    }

    render(
      <SystemBreadcrumb
        systemData={systemWithoutMoons}
        objectRefsMap={mockObjectRefsMap}
        onObjectFocus={mockOnObjectFocus}
        onObjectSelect={mockOnObjectSelect}
        focusedName="Jupiter"  // Planet with no moons
        getObjectSizing={mockGetObjectSizing}
      />
    )

    // Should NOT show moon navigation when planet has no moons
    expect(screen.queryByText('Moons:')).not.toBeInTheDocument()
  })
})