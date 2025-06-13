"use client"

import type React from "react"
import { Star, Circle, Globe } from "lucide-react"
import type { SystemData } from "@/engine/system-loader"

interface ObjectDetailsPanelProps {
  systemData: SystemData | null
  focusedName: string
  focusedObjectSize: number | null
}

export function ObjectDetailsPanel({
  systemData,
  focusedName,
  focusedObjectSize,
}: ObjectDetailsPanelProps) {
  if (!systemData || !focusedName) {
    return (
      <div className="fixed top-6 left-6 z-40 w-80 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 p-4">
        <div className="text-white/60 text-sm">
          Select an object to view details
        </div>
      </div>
    )
  }

  // Find the focused object
  const focusedStar = systemData.stars?.find(star => star.name === focusedName)
  const focusedPlanet = systemData.planets?.find(planet => planet.name === focusedName)
  const focusedObject = focusedStar || focusedPlanet

  if (!focusedObject) {
    return (
      <div className="fixed top-6 left-6 z-40 w-80 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 p-4">
        <div className="text-white/60 text-sm">
          Object not found
        </div>
      </div>
    )
  }

  const objectType = focusedStar ? 'Star' : 'Planet'
  const objectIcon = focusedStar ? <Star size={20} className="fill-current text-yellow-300" /> : <Circle size={16} className="fill-current text-blue-300" />

  return (
    <div className="fixed top-6 left-6 z-40 w-80 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 p-4">
      <div className="text-white">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
          {objectIcon}
          <div>
            <h3 className="font-semibold text-lg">{focusedObject.name}</h3>
            <p className="text-white/60 text-sm">{objectType}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60 text-sm">ID:</span>
            <span className="text-white text-sm">{focusedObject.id}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/60 text-sm">Catalog Ref:</span>
            <span className="text-white text-sm">{focusedObject.catalog_ref}</span>
          </div>

          {focusedObject.position && (
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Position:</span>
              <span className="text-white text-sm">
                {focusedObject.position.map(p => p.toFixed(1)).join(', ')}
              </span>
            </div>
          )}

          {focusedObject.orbit && (
            <>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Orbital Parent:</span>
                <span className="text-white text-sm">{focusedObject.orbit.parent}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Semi-Major Axis:</span>
                <span className="text-white text-sm">{focusedObject.orbit.semi_major_axis.toExponential(2)} m</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Orbital Period:</span>
                <span className="text-white text-sm">{focusedObject.orbit.orbital_period.toFixed(1)} days</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Eccentricity:</span>
                <span className="text-white text-sm">{focusedObject.orbit.eccentricity.toFixed(3)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Inclination:</span>
                <span className="text-white text-sm">{focusedObject.orbit.inclination.toFixed(1)}°</span>
              </div>
            </>
          )}

          {focusedObjectSize && (
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">Visual Size:</span>
              <span className="text-white text-sm">{focusedObjectSize.toFixed(2)} units</span>
            </div>
          )}
        </div>

        {/* System Context */}
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="text-white/60 text-xs">
            System: {systemData.name}
          </div>
          <div className="text-white/60 text-xs mt-1">
            {systemData.stars?.length || 0} star(s), {systemData.planets?.length || 0} planet(s)
          </div>
        </div>
      </div>
    </div>
  )
} 