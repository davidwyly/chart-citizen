import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { StarRenderer } from '../star-renderer'
import type { CatalogObject } from '@/engine/system-loader'

// Mock the SunMaterial
vi.mock('../materials/sun-material', () => ({
  SunMaterial: vi.fn().mockImplementation(() => null)
}))

describe('StarRenderer Cursor Behavior', () => {
  const mockStar: CatalogObject = {
    id: 'test-star',
    name: 'Test Star',
    type: 'star',
    catalog_data: {
      common_name: 'Test Star',
      stellar_classification: 'G2V',
      mass: 1.0,
      radius: 696340,
      temperature: 5778,
      luminosity: 1.0,
      metallicity: 0.0122,
      age: 4.6,
    },
    physical: {
      mass: 1.0,
      radius: 696340,
      temperature: 5778,
    },
    visual: {
      color: '#FDB813',
      luminosity: 1.0,
    },
    render_info: {
      shader_type: 'star',
      effects: [],
    },
  }

  it('should accept onHover prop for cursor behavior', () => {
    // This test verifies that StarRenderer should accept onHover prop
    // to be consistent with other renderers
    const onHover = vi.fn()
    
    // This should not throw a TypeScript error when onHover is added
    expect(() => {
      const renderer = <StarRenderer catalogData={mockStar} onHover={onHover} />
      expect(renderer).toBeDefined()
    }).not.toThrow()
  })

  it('should support onSelect prop for consistent interaction', () => {
    // Test that StarRenderer should support onSelect prop
    const onSelect = vi.fn()
    
    expect(() => {
      const renderer = <StarRenderer catalogData={mockStar} onSelect={onSelect} />
      expect(renderer).toBeDefined()
    }).not.toThrow()
  })
})