"use client"

import { OrbitalSystemData } from "@/engine/types/orbital-system"
import { engineSystemLoader } from "@/engine/system-loader"

interface SystemInfoOverlayProps {
  systemData: OrbitalSystemData
  timeMultiplier: number
  isPaused: boolean
  availableSystems: string[]
  focusedName: string
  focusedObjectSize: number | null
  error: string | null
  loadingProgress: string
  onStopFollowing: () => void
}

export function SystemInfoOverlay({
  systemData,
  timeMultiplier,
  isPaused,
  availableSystems,
  focusedName,
  focusedObjectSize,
  error,
  loadingProgress,
  onStopFollowing,
}: SystemInfoOverlayProps) {
  // Get stars, planets, and moons using the system loader helper methods
  const stars = engineSystemLoader.getStars(systemData)
  const planets = engineSystemLoader.getPlanets(systemData)
  const moons = engineSystemLoader.getMoons(systemData)

  return (
    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg max-w-sm">
      <h2 className="text-xl font-bold mb-2">{systemData.name}</h2>
      <p className="text-sm mb-2">{systemData.description}</p>
      <div className="text-xs space-y-1">
        <div>Stars: {stars.length}</div>
        <div>Planets: {planets?.length || 0}</div>
        <div>Moons: {moons?.length || 0}</div>
        <div>Total Objects: {systemData.objects?.length || 0}</div>
      </div>

      {/* Time status */}
      <div className="mt-3 pt-2 border-t border-white/20 text-xs">
        <div className="text-gray-400">Time: {isPaused ? "Paused" : `${timeMultiplier}x speed`}</div>
      </div>

      {/* Available systems */}
      {availableSystems.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="text-xs text-gray-400 mb-1">Available Systems:</div>
          <div className="text-xs space-y-1">
            {availableSystems.map((system) => (
              <div key={system} className={system === systemData.id ? "text-blue-400" : "text-gray-300"}>
                {system} {system === systemData.id && "(current)"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Focused object info */}
      {focusedName && (
        <div className="mt-3 pt-2 border-t border-white/20">
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
      {error && systemData && (
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="text-xs text-yellow-400">{error}</div>
        </div>
      )}

      {/* Loading status indicator */}
      {loadingProgress && <div className="mt-2 text-xs text-green-400">{loadingProgress}</div>}
    </div>
  )
}
