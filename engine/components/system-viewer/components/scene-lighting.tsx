"use client"

import { OrbitalSystemData, isStar } from "@/engine/types/orbital-system"
import type { ViewType } from '@lib/types/effects-level'

interface SceneLightingProps {
  systemData: OrbitalSystemData
  viewType: ViewType
}

export function SceneLighting({ systemData, viewType }: SceneLightingProps) {
  const stars = systemData.objects.filter(isStar)

  return (
    <>
      {/* Very minimal ambient light - just enough to see objects */}
      <ambientLight intensity={0.05} color="#ffffff" />

      {/* Point lights from stars - primary lighting source with increased intensity */}
      {stars.map((star) => {
        const starPosition =
          (viewType === "profile"
            ? ([-600, 500, 0] as [number, number, number]) // Profile position for star lighting
            : ([0, 500, 0] as [number, number, number]))
        const isPrimary = star.id === systemData.lighting.primary_star
        const intensity = isPrimary ? 25.0 : 15.0 // Significantly increased intensity

        return (
          <pointLight
            key={star.id}
            position={starPosition}
            intensity={intensity}
            color="#ffaa44"
            distance={2000} // Increased distance for farther reach
            decay={1} // Reduced decay for better distant lighting
          />
        )
      })}
    </>
  )
}
