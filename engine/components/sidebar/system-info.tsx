"use client"

import React from "react"
import type { OrbitalSystemData } from "@/engine/types/orbital-system"

interface SystemInfoProps {
  systemData: OrbitalSystemData | null
  focusedName: string
  focusedObjectSize: number | null
  onStopFollowing: () => void
  error: string | null
  loadingProgress: string
}

export function SystemInfo({
  systemData,
  focusedName,
  focusedObjectSize,
  onStopFollowing,
  error,
  loadingProgress,
}: SystemInfoProps) {
  if (!systemData) {
    return <div className="text-sm text-gray-400">No system data available</div>
  }

  // Calculate object counts
  const stars = systemData.objects.filter(obj => obj.classification === 'star').length
  const planets = systemData.objects.filter(obj => obj.classification === 'planet' || obj.classification === 'dwarf-planet').length
  const moons = systemData.objects.filter(obj => obj.classification === 'moon').length
  const jumpPoints = systemData.objects.filter(obj => obj.classification === 'compact-object').length // Assuming jump points are compact objects

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-bold">{systemData.name}</h3>
        <p className="text-sm text-gray-300">{systemData.description}</p>
      </div>

      <div className="text-xs space-y-1">
        <div>Stars: {stars}</div>
        <div>Planets: {planets}</div>
        <div>Moons: {moons}</div>
        {jumpPoints > 0 && <div>Jump Points: {jumpPoints}</div>}
      </div>

      {/* Focused object info */}
      {focusedName && (
        <div className="pt-2 border-t border-white/20">
          <div className="text-sm font-bold">Following: {focusedName}</div>
          <div className="text-xs text-gray-400">Camera tracks object movement</div>
          {focusedObjectSize && (
            <div className="text-xs text-gray-400">Visual size: {focusedObjectSize.toFixed(3)}</div>
          )}
          <button onClick={onStopFollowing} className="mt-1 text-xs text-blue-400 hover:text-blue-300">
            Stop following
          </button>
        </div>
      )}

      {/* Error message if system was substituted */}
      {error && (
        <div className="pt-2 border-t border-white/20">
          <div className="text-xs text-yellow-400">{error}</div>
        </div>
      )}

      {/* Loading status indicator */}
      {loadingProgress && <div className="text-xs text-green-400">{loadingProgress}</div>}
    </div>
  )
}
