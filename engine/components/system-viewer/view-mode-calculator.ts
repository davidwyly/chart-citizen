"use client"

import type { ViewType } from '@lib/types/effects-level'

export interface ObjectSizing {
  actualSize: number
  visualSize: number
}

export interface ViewModeScaling {
  STAR_SCALE: number
  PLANET_SCALE: number
  ORBITAL_SCALE: number
  STAR_SHADER_SCALE: number
}

export function calculateViewModeScaling(viewType: ViewType): ViewModeScaling {
  switch (viewType) {
    case "realistic":
      return {
        STAR_SCALE: 1.0,
        PLANET_SCALE: 0.5,
        ORBITAL_SCALE: 2.0,
        STAR_SHADER_SCALE: 1.0
      }
    case "navigational":
      return {
        STAR_SCALE: 0.5,
        PLANET_SCALE: 0.25,
        ORBITAL_SCALE: 1.0,
        STAR_SHADER_SCALE: 0.5
      }
    case "profile":
      return {
        STAR_SCALE: 0.75,
        PLANET_SCALE: 0.4,
        ORBITAL_SCALE: 1.5,
        STAR_SHADER_SCALE: 0.75
      }
    default:
      return calculateViewModeScaling("realistic")
  }
}

export function calculateObjectSizing(
  objectType: string,
  baseRadius: number,
  viewType: ViewType,
  systemScale: number
): ObjectSizing {
  const validBaseRadius = typeof baseRadius === "number" && !isNaN(baseRadius) && baseRadius > 0 ? baseRadius : 1.0
  const scaling = calculateViewModeScaling(viewType)
  const validSystemScale = typeof systemScale === "number" && !isNaN(systemScale) && systemScale > 0 ? systemScale : 1.0

  // Calculate actual scale based on object type
  let actualScale = validBaseRadius
  switch (objectType) {
    case "star":
      actualScale *= scaling.STAR_SCALE
      break
    case "planet":
      actualScale *= scaling.PLANET_SCALE
      break
    case "moon":
      actualScale *= scaling.PLANET_SCALE * 0.5
      break
    default:
      actualScale *= 1.0
  }

  // Calculate visual scale based on view type
  let visualScale = actualScale
  switch (viewType) {
    case "realistic":
      switch (objectType) {
        case "star":
          visualScale *= 1.0
          break
        case "planet":
          visualScale *= 1.0
          break
        case "moon":
          visualScale *= 1.0
          break
        default:
          visualScale *= 1.0
      }
      break
    case "navigational":
      switch (objectType) {
        case "star":
          visualScale *= 0.5
          break
        case "planet":
          visualScale *= 0.5
          break
        case "moon":
          visualScale *= 0.5
          break
        default:
          visualScale *= 0.5
      }
      break
    case "profile":
      switch (objectType) {
        case "star":
          visualScale *= 0.75
          break
        case "planet":
          visualScale *= 0.75
          break
        case "moon":
          visualScale *= 0.75
          break
        default:
          visualScale *= 0.75
      }
      break
    default:
      visualScale *= 1.0
  }

  return {
    actualSize: actualScale * validSystemScale,
    visualSize: visualScale * validSystemScale
  }
}

export function getObjectScaleForNavigational(objectType: string, baseScale: number): number {
  // Ensure baseScale is a valid number
  const validBaseScale = typeof baseScale === "number" && !isNaN(baseScale) && baseScale > 0 ? baseScale : 1.0

  switch (objectType) {
    case "star":
      return validBaseScale * 2.0 // Stars are largest but not by much
    case "gas-giant":
      return validBaseScale * 1.2 // Gas giants are medium-large
    case "planet":
      return validBaseScale * 1.0 // Rocky planets are base size
    case "moon":
      return validBaseScale * 0.8 // Moons are smallest
    default:
      return validBaseScale
  }
}

// Helper function to ensure valid scale values
export function validateScale(scale: number | undefined, fallback = 1.0): number {
  if (scale === undefined || typeof scale !== "number" || isNaN(scale) || scale <= 0) {
    return fallback
  }
  return scale
}

// Calculate profile layout positions with validation
export function calculateProfileLayout(
  objectCount: number,
  viewportWidth: number,
  centralObjectRadius: number,
): { positions: number[]; maxDistance: number } {
  // Validate inputs
  const validObjectCount = Math.max(1, Math.floor(objectCount))
  const validViewportWidth = validateScale(viewportWidth, 1000)
  const validCentralObjectRadius = validateScale(centralObjectRadius, 50)

  const leftMargin = validCentralObjectRadius * 2 + 50 // Space for central object plus margin
  const rightMargin = 50
  const availableWidth = validViewportWidth - leftMargin - rightMargin

  const positions: number[] = []
  const spacing = availableWidth / Math.max(1, validObjectCount - 1)

  for (let i = 0; i < validObjectCount; i++) {
    const position = leftMargin + i * spacing
    positions.push(validateScale(position))
  }

  const maxDistance = validateScale(positions[positions.length - 1] || leftMargin)

  return { positions, maxDistance }
}
