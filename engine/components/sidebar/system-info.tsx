"use client"

import type { SystemData } from "@/engine/system-loader"

interface SystemInfoProps {
  systemData: SystemData | null
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

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-bold">{systemData.name}</h3>
        <p className="text-sm text-gray-300">{systemData.description}</p>
      </div>

      <div className="text-xs space-y-1">
        <div>Stars: {systemData.stars.length}</div>
        <div>Planets: {systemData.planets?.length || 0}</div>
        <div>Moons: {systemData.moons?.length || 0}</div>
        {systemData.jump_points && <div>Jump Points: {systemData.jump_points.length}</div>}
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
