"use client"

import { Eye, Zap, Gamepad } from "lucide-react"
import type { ViewType } from "@lib/types/effects-level"

interface ViewModeSelectorProps {
  viewType: ViewType
  onViewTypeChange: (viewType: ViewType) => void
}

const VIEW_TYPES = [
  {
    id: "explorational" as ViewType,
    label: "Explorational",
    icon: Eye,
    description: "Relative size and distances",
  },
  {
    id: "navigational" as ViewType,
    label: "Navigational",
    icon: Zap,
    description: "Uniform sizing for easy navigation",
  },
  {
    id: "profile" as ViewType,
    label: "Profile",
    icon: Gamepad,
    description: "Orthographic profile view",
  },
]

export function ViewModeSelector({ viewType, onViewTypeChange }: ViewModeSelectorProps) {
  return (
    <div>
      <h4 className="font-medium mb-3 text-sm">View Mode</h4>
      <div className="space-y-2">
        {VIEW_TYPES.map((view) => {
          const ViewIcon = view.icon
          return (
            <button
              key={view.id}
              onClick={() => onViewTypeChange(view.id)}
              className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${
                viewType === view.id ? "bg-blue-600 text-white" : "bg-white/10 hover:bg-white/20"
              }`}
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
    </div>
  )
}
