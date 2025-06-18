"use client"

import React, { useMemo } from "react"
import { Eye, Zap, LayoutGrid, Microscope, Settings } from "lucide-react"
import type { ViewType } from "@lib/types/effects-level"
import { viewModeRegistry } from "@/engine/core/view-modes"

interface ViewModeSelectorProps {
  viewType: ViewType
  onViewTypeChange: (viewType: ViewType) => void
}

// Icon mapping for view modes (can be moved to view mode definitions later)
const VIEW_MODE_ICONS = {
  explorational: Eye,
  navigational: Zap,
  profile: LayoutGrid,
  scientific: Microscope,
  // Default fallback
  default: Settings
} as const

export function ViewModeSelector({ viewType, onViewTypeChange }: ViewModeSelectorProps) {
  // Get available view modes from registry
  const availableViewModes = useMemo(() => {
    return viewModeRegistry.getAll().map(mode => ({
      id: mode.id,
      label: mode.name,
      description: mode.description,
      icon: VIEW_MODE_ICONS[mode.id as keyof typeof VIEW_MODE_ICONS] || VIEW_MODE_ICONS.default,
      category: mode.category
    }))
  }, [])

  return (
    <div>
      <h4 className="font-medium mb-3 text-sm">View Mode</h4>
      <div className="space-y-2">
        {availableViewModes.map((view) => {
          const ViewIcon = view.icon
          return (
            <button
              key={view.id}
              onClick={() => onViewTypeChange(view.id as ViewType)}
              className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${
                viewType === view.id ? "bg-blue-600 text-white" : "bg-white/10 hover:bg-white/20"
              }`}
              title={`${view.label} - ${view.description}`}
            >
              <ViewIcon className="w-4 h-4" />
              <div>
                <div className="font-medium text-sm">{view.label}</div>
                <div className="text-xs opacity-75">{view.description}</div>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-800 rounded text-xs">
          <div className="text-gray-400">Registry: {availableViewModes.length} modes</div>
        </div>
      )}
    </div>
  )
}
