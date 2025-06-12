"use client"

import type { SystemData } from "@/engine/system-loader"
import type { ViewType } from '@lib/types/effects-level'

interface SystemInfoOverlayProps {
  systemData: SystemData
  viewType: ViewType
  focusedName: string
  focusedObjectSize: number | null
  error: string | null
  loadingProgress: string
  onStopFollowing: () => void
}

export function SystemInfoOverlay({
  systemData,
  viewType,
  focusedName,
  focusedObjectSize,
  error,
  loadingProgress,
  onStopFollowing,
}: SystemInfoOverlayProps) {
  return (
    <div className="absolute top-4 left-20 bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg max-w-sm">
      <h2 className="text-xl font-bold mb-2">{systemData.name}</h2>
      <p className="text-sm mb-2">{systemData.description}</p>
      <div className="text-xs space-y-1">
        <div>Stars: {systemData.stars.length}</div>
        <div>Planets: {systemData.planets?.length || 0}</div>
        <div>Moons: {systemData.moons?.length || 0}</div>
        {systemData.jump_points && <div>Jump Points: {systemData.jump_points.length}</div>}
      </div>

      {/* View mode indicator */}
      <div className="mt-3 pt-2 border-t border-white/20 text-xs">
        <div className="text-gray-400">
          View: {viewType === "realistic" ? "Realistic" : viewType === "navigational" ? "Navigational" : "Game"}
        </div>
      </div>

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
