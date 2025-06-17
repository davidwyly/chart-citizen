"use client"

import React, { useState, useMemo } from "react"
import { ChevronDown, ChevronRight, Settings, Navigation, Info } from "lucide-react"
import { ViewModeSelector } from "./view-mode-selector"
import { TimeControls } from "./time-controls"
import { SystemSelector } from "./system-selector"
import { SystemInfo } from "./system-info"
import type { ViewType } from '@lib/types/effects-level'
import type { SystemData } from "@/engine/system-loader"

// Memoized components to prevent unnecessary re-renders
const MemoizedViewModeSelector = React.memo(ViewModeSelector)
const MemoizedTimeControls = React.memo(TimeControls)
const MemoizedSystemSelector = React.memo(SystemSelector)
const MemoizedSystemInfo = React.memo(SystemInfo)

interface SidebarProps {
  onViewTypeChange: (viewType: ViewType) => void
  onTimeMultiplierChange: (multiplier: number) => void
  onPauseToggle: () => void
  currentViewType: ViewType
  currentTimeMultiplier: number
  isPaused: boolean
  currentZoom: number
  systemData: SystemData | null
  availableSystems: Record<string, any>
  currentSystem: string
  onSystemChange: (systemId: string) => void
  focusedName: string
  focusedObjectSize: number | null
  onStopFollowing: () => void
  error: string | null
  loadingProgress: string
  mode?: "realistic" | "star-citizen"
}

export function Sidebar({
  onViewTypeChange,
  onTimeMultiplierChange,
  onPauseToggle,
  currentViewType,
  currentTimeMultiplier,
  isPaused,
  currentZoom,
  systemData,
  availableSystems,
  currentSystem,
  onSystemChange,
  focusedName,
  focusedObjectSize,
  onStopFollowing,
  error,
  loadingProgress,
  mode = "realistic"
}: SidebarProps) {
  const [openSection, setOpenSection] = useState<string>("navigation")
  const [isCollapsed, setIsCollapsed] = useState(true)

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section)
  }

  // Memoize the zoom display to prevent re-renders
  const zoomDisplay = useMemo(() => {
    return currentZoom.toFixed(2)
  }, [currentZoom])

  // Memoize the header title
  const headerTitle = useMemo(() => {
    return mode === "star-citizen" ? "Chart Citizen" : "3D Starfield"
  }, [mode])

  return (
    <div
      data-testid="sidebar"
      className={`fixed top-0 right-0 bottom-0 bg-black/70 backdrop-blur-sm text-white flex flex-col transition-all duration-300 overflow-x-hidden ${
        isCollapsed ? "w-12" : "w-80"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        {!isCollapsed && <h1 className="text-lg font-bold">{headerTitle}</h1>}
      </div>

      {/* Toggle Button */}
      <div className="p-2 border-b border-white/10">
        <button
          data-testid="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center hover:bg-white/10 p-2 rounded"
        >
          <Settings size={18} />
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>

      {/* Accordion Sections */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Options Section */}
          <div className="border-b border-white/10">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-white/5"
              onClick={() => toggleSection("options")}
            >
              <div className="flex items-center gap-2">
                <Settings size={18} />
                <span>Options</span>
              </div>
              {openSection === "options" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {openSection === "options" && (
              <div className="p-4 pt-0 space-y-4">
                <MemoizedViewModeSelector
                  viewType={currentViewType}
                  onViewTypeChange={onViewTypeChange}
                />

                <div>
                  <h4 className="font-medium mb-2 text-sm">Camera</h4>
                  <div className="text-xs text-gray-400">
                    <div>Zoom: {zoomDisplay}x</div>
                  </div>
                </div>

                <MemoizedTimeControls
                  timeMultiplier={currentTimeMultiplier}
                  onTimeMultiplierChange={onTimeMultiplierChange}
                  isPaused={isPaused}
                  onPauseToggle={onPauseToggle}
                />

                {/* Version Info */}
                <div className="pt-4 border-t border-white/10">
                  <div className="text-xs text-gray-400">
                    <div>Version: 1.0.0</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Section */}
          <div className="border-b border-white/10">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-white/5"
              onClick={() => toggleSection("navigation")}
            >
              <div className="flex items-center gap-2">
                <Navigation size={18} />
                <span>Navigation</span>
              </div>
              {openSection === "navigation" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {openSection === "navigation" && (
              <div className="p-4 pt-0">
                <MemoizedSystemSelector
                  availableSystems={availableSystems}
                  currentSystem={currentSystem}
                  onSystemChange={(systemId) => {
                    onSystemChange(systemId)
                    setOpenSection("navigation") // Keep navigation open after system change
                  }}
                />
              </div>
            )}
          </div>

          {/* System Info Section */}
          <div className="border-b border-white/10">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-white/5"
              onClick={() => toggleSection("info")}
            >
              <div className="flex items-center gap-2">
                <Info size={18} />
                <span>System Info</span>
              </div>
              {openSection === "info" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {openSection === "info" && (
              <div className="p-4 pt-0">
                <MemoizedSystemInfo
                  systemData={systemData}
                  focusedName={focusedName}
                  focusedObjectSize={focusedObjectSize}
                  onStopFollowing={onStopFollowing}
                  error={error}
                  loadingProgress={loadingProgress}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/10 text-xs text-center text-gray-400">
          <div>{headerTitle}</div>
          <div className="mt-1">Version: 1.0.0</div>
        </div>
      )}
    </div>
  )
}
