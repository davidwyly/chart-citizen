"use client"

import { OrbitalSystemData, isStar } from "@/engine/types/orbital-system"
import type { ViewType } from '@lib/types/effects-level'

interface SceneLightingProps {
  systemData: OrbitalSystemData
  viewType: ViewType
}

export function SceneLighting({ systemData, viewType }: SceneLightingProps) {
  const stars = systemData.objects.filter(isStar)

  if (viewType === 'profile') {
    // Profile view uses a fixed "studio" light. This is likely not correct for all
    // objects and may need to be revisited to be relative to the focused object.
    // For now, we preserve the original behavior to avoid breaking profile views.
    return (
      <>
        <ambientLight intensity={0.1} color="#ffffff" />
        <pointLight
          position={[-600, 500, 0]}
          intensity={25.0}
          color="#ffaa44"
          distance={5000}
          decay={1.5}
        />
      </>
    )
  }

  // General system view lighting (explorational, navigational, etc.)
  return (
    <>
      {/* A slightly stronger ambient light to make dark sides of objects visible */}
      <ambientLight intensity={0.1} color="#ffffff" />

      {/* Point lights from all stars in the system */}
      {stars.map((star) => {
        const starPosition = star.position || [0, 0, 0]
        const isPrimary = star.id === systemData.lighting.primary_star
        // Use higher intensity for primary star, and scale with star luminosity if available
        const intensity = (isPrimary ? 25.0 : 15.0) * (star.properties?.luminosity || 1.0)

        return (
          <pointLight
            key={star.id}
            position={starPosition}
            intensity={intensity}
            color={star.properties?.color || "#ffaa44"}
            // Large distance to illuminate entire systems
            distance={50000} 
            // Standard quadratic decay
            decay={2} 
          />
        )
      })}
    </>
  )
}
