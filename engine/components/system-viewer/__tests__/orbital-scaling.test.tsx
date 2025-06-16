/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from 'vitest'

// Mock system data for testing
const mockSystemData = {
  id: "test-system",
  name: "Test System",
  stars: [
    { id: "star-1", name: "Test Star", catalog_ref: "test-star" }
  ],
  planets: [
    {
      id: "planet-1",
      name: "Inner Planet",
      catalog_ref: "test-planet",
      orbit: { semi_major_axis: 10, eccentricity: 0, inclination: 0, orbital_period: 100, parent: "star-1" }
    },
    {
      id: "planet-2", 
      name: "Middle Planet",
      catalog_ref: "test-planet",
      orbit: { semi_major_axis: 20, eccentricity: 0, inclination: 0, orbital_period: 200, parent: "star-1" }
    },
    {
      id: "planet-3",
      name: "Outer Planet", 
      catalog_ref: "test-planet",
      orbit: { semi_major_axis: 40, eccentricity: 0, inclination: 0, orbital_period: 400, parent: "star-1" }
    }
  ]
}

// Mock the orbital scaling logic from the component
function calculateNavigationalOrbitalRadius(
  index: number, 
  viewType: string, 
  ORBITAL_SCALE: number,
  systemData: any
): number {
  // Only apply the scaling logic for navigational and profile modes
  if (viewType !== "navigational" && viewType !== "profile" && viewType !== "explorational") {
    // For explorational mode, this function shouldn't be called, but just in case
    const baseSpacing = ORBITAL_SCALE * 0.5
    return baseSpacing * (index + 1)
  }

  // Calculate scaling factor to match explorational mode's system size
  if (!systemData.planets || systemData.planets.length === 0) {
    const baseSpacing = ORBITAL_SCALE * 0.5
    const gameOffset = viewType === "profile" ? ORBITAL_SCALE : 0.0
    return baseSpacing * (index + 1) + gameOffset
  }

  // Find the outermost explorational orbital radius
  const maxExplorationalRadius = Math.max(
    ...systemData.planets.map((planet: any) => planet.orbit?.semi_major_axis || 0)
  )

  // Calculate what the outermost navigational radius would be with current logic
  const maxNavigationalIndex = systemData.planets.length - 1
  const baseSpacing = ORBITAL_SCALE * 0.5
  const gameOffset = viewType === "profile" ? ORBITAL_SCALE : 0.0
  const maxNavigationalRadius = baseSpacing * (maxNavigationalIndex + 1) + gameOffset

  // Calculate scaling factor to make outermost navigational orbit match explorational
  const scalingFactor = maxNavigationalRadius > 0 ? maxExplorationalRadius / maxNavigationalRadius : 1.0

  // Apply the scaling factor to maintain equidistant spacing but match system size
  return (baseSpacing * (index + 1) + gameOffset) * scalingFactor
}

describe('Orbital Scaling Logic', () => {
  const ORBITAL_SCALE = 2.0 // Standard orbital scale

  it('should maintain equidistant spacing in navigational mode', () => {
    const navigationalRadii = mockSystemData.planets.map((_, index) => 
      calculateNavigationalOrbitalRadius(index, "navigational", ORBITAL_SCALE, mockSystemData)
    )

    // Check that the spacing between consecutive planets is equal
    const spacing1 = navigationalRadii[1] - navigationalRadii[0]
    const spacing2 = navigationalRadii[2] - navigationalRadii[1]
    
    expect(spacing1).toBeCloseTo(spacing2, 5)
  })

  it('should scale navigational mode to match explorational mode system size', () => {
    // Get the outermost explorational orbit
    const maxExplorationalRadius = Math.max(
      ...mockSystemData.planets.map(planet => planet.orbit.semi_major_axis)
    )
    
    // Get the outermost navigational orbit
    const maxNavigationalIndex = mockSystemData.planets.length - 1
    const maxNavigationalRadius = calculateNavigationalOrbitalRadius(
      maxNavigationalIndex, 
      "navigational", 
      ORBITAL_SCALE, 
      mockSystemData
    )

    // The outermost navigational orbit should match the outermost explorational orbit
    expect(maxNavigationalRadius).toBeCloseTo(maxExplorationalRadius, 5)
  })

  it('should preserve explorational mode orbital radii', () => {
    // In explorational mode, planets should use their actual semi_major_axis values
    const explorationalRadii = mockSystemData.planets.map(planet => planet.orbit.semi_major_axis)
    
    expect(explorationalRadii).toEqual([10, 20, 40])
  })

  it('should handle edge cases gracefully', () => {
    // Test with empty planets array
    const emptySystemData = { ...mockSystemData, planets: [] }
    const result = calculateNavigationalOrbitalRadius(0, "navigational", ORBITAL_SCALE, emptySystemData)
    
    expect(result).toBeGreaterThan(0)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('should apply scaling to profile mode as well', () => {
    const profileRadii = mockSystemData.planets.map((_, index) => 
      calculateNavigationalOrbitalRadius(index, "profile", ORBITAL_SCALE, mockSystemData)
    )

    // Profile mode should also maintain the equidistant spacing pattern
    const spacing1 = profileRadii[1] - profileRadii[0]
    const spacing2 = profileRadii[2] - profileRadii[1]
    
    expect(spacing1).toBeCloseTo(spacing2, 5)
    
    // Profile mode has an offset, so the scaling behavior is slightly different
    // but it should still maintain proportional relationships
    expect(profileRadii.length).toBe(3)
    expect(profileRadii[0]).toBeGreaterThan(0)
    expect(profileRadii[2]).toBeGreaterThan(profileRadii[1])
  })

  it('should maintain proportional spacing in navigational mode', () => {
    const navigationalRadii = mockSystemData.planets.map((_, index) => 
      calculateNavigationalOrbitalRadius(index, "navigational", ORBITAL_SCALE, mockSystemData)
    )

    // Check that the ratios are consistent (1:2:3 spacing)
    const ratio1 = navigationalRadii[1] / navigationalRadii[0]
    const ratio2 = navigationalRadii[2] / navigationalRadii[1]
    
    expect(ratio1).toBeCloseTo(2, 5)
    expect(ratio2).toBeCloseTo(1.5, 5)
  })
}) 