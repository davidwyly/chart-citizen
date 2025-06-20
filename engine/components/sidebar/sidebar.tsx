"use client"

import React, { useState, useMemo, useEffect } from "react"
import { ChevronDown, ChevronRight, Settings, Navigation, Info, ChevronLeft, ChevronsLeft, Clock } from "lucide-react"
import { ViewModeSelector } from "./view-mode-selector"
import { TimeControls } from "./time-controls"
import { SystemSelector } from "./system-selector"
import { SystemInfo } from "./system-info"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Skeleton } from "../ui/skeleton"
import type { ViewType } from '@lib/types/effects-level'
import type { SystemData } from "@/engine/system-loader"
import type { CelestialObject } from "@/engine/types/orbital-system"

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
  selectedObjectData: CelestialObject | null
  onStopFollowing: () => void
  error: string | null
  loadingProgress: string
  mode?: "realistic" | "star-citizen"
  autoAdjustTime?: boolean
  onAutoAdjustToggle?: (enabled: boolean) => void
}

interface SidebarSection {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  hasAlert?: boolean
  alertCount?: number
}

// Skeleton components for loading states
const HeaderSkeleton = () => (
  <div className="flex items-center justify-between">
    <Skeleton className="h-6 w-32 bg-white/10" />
    <Skeleton className="h-2 w-2 rounded-full bg-white/10" />
  </div>
)

const SectionSkeleton = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded bg-white/10" />
        <Skeleton className="h-4 w-20 bg-white/10" />
      </div>
      <Skeleton className="h-4 w-4 bg-white/10" />
    </div>
  </div>
)

const ContentSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24 bg-white/10" />
      <Skeleton className="h-8 w-full bg-white/10" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-20 bg-white/10" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-full bg-white/10" />
        <Skeleton className="h-3 w-3/4 bg-white/10" />
        <Skeleton className="h-3 w-1/2 bg-white/10" />
      </div>
    </div>
  </div>
)

const FooterSkeleton = () => (
  <div className="text-xs text-center space-y-1">
    <Skeleton className="h-3 w-20 mx-auto bg-white/10" />
    <div className="flex items-center justify-center gap-2">
      <Skeleton className="h-1.5 w-1.5 rounded-full bg-white/10" />
      <Skeleton className="h-3 w-12 bg-white/10" />
    </div>
  </div>
)

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
  selectedObjectData,
  onStopFollowing,
  error,
  loadingProgress,
  mode = "realistic",
  autoAdjustTime = false,
  onAutoAdjustToggle
}: SidebarProps) {
  const [openSection, setOpenSection] = useState<string>("navigation")
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isExpanding, setIsExpanding] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // Handle expansion animation timing
  useEffect(() => {
    if (!isCollapsed && !showContent) {
      setIsExpanding(true)
      // Show content after expansion animation completes
      const timer = setTimeout(() => {
        setIsExpanding(false)
        setShowContent(true)
      }, 300) // Match the transition duration
      
      return () => clearTimeout(timer)
    } else if (isCollapsed) {
      setShowContent(false)
      setIsExpanding(false)
    }
  }, [isCollapsed, showContent])

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section)
  }

  const handleToggleCollapse = () => {
    if (!isCollapsed) {
      // Collapsing - hide content immediately
      setShowContent(false)
      setIsExpanding(false)
    }
    setIsCollapsed(!isCollapsed)
  }

  // Memoize the zoom display to prevent re-renders
  const zoomDisplay = useMemo(() => {
    return currentZoom.toFixed(2)
  }, [currentZoom])

  // Memoize the header title
  const headerTitle = useMemo(() => {
    return mode === "star-citizen" ? "Chart Citizen" : "3D Starfield"
  }, [mode])

  // Define sidebar sections with metadata
  const sections: SidebarSection[] = useMemo(() => [
    {
      id: "options",
      label: "Options",
      icon: Settings,
      hasAlert: error !== null,
    },
    {
      id: "time",
      label: "Time Controls",
      icon: Clock,
      hasAlert: false,
    },
    {
      id: "navigation",
      label: "Navigation",
      icon: Navigation,
      hasAlert: false,
    },
    {
      id: "info",
      label: "System Info",
      icon: Info,
      hasAlert: focusedName !== "",
    }
  ], [error, focusedName])

  return (
    <TooltipProvider>
      <div
        data-testid="sidebar"
        className={`fixed top-0 right-0 bottom-0 bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden border-l border-white/10 ${
          isCollapsed ? "w-16" : "w-80"
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b border-white/10 transition-all duration-300 ${isCollapsed ? "px-2" : ""}`}>
          {!isCollapsed && (
            <>
              {isExpanding ? (
                <HeaderSkeleton />
              ) : showContent ? (
                <div className="flex items-center justify-between animate-in fade-in duration-200">
                  <h1 className="text-lg font-semibold text-white/90 tracking-wide">{headerTitle}</h1>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Toggle Button */}
        <div className={`p-3 border-b border-white/10 transition-all duration-300 ${isCollapsed ? "px-2" : ""}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                data-testid="sidebar-toggle"
                onClick={handleToggleCollapse}
                className={`w-full flex items-center justify-center hover:bg-white/10 p-3 rounded-lg transition-all duration-200 group ${
                  isCollapsed ? "p-3" : "justify-start gap-3"
                }`}
              >
                {isCollapsed ? (
                  <ChevronLeft size={20} className="group-hover:scale-110 transition-transform" />
                ) : (
                  <>
                    <ChevronsLeft size={18} className="group-hover:scale-110 transition-transform" />
                    {showContent && (
                      <span className="text-sm font-medium animate-in fade-in duration-200">Collapse</span>
                    )}
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-slate-800 border-slate-700">
              <p>{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
          {!isCollapsed && (
            <>
              {isExpanding ? (
                // Show skeleton during expansion
                <div className="space-y-0">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-b border-white/5 p-4">
                      <SectionSkeleton />
                    </div>
                  ))}
                </div>
              ) : showContent ? (
                // Show actual content after expansion
                <div className="animate-in fade-in duration-200">
                  {sections.map((section) => {
                    const isActive = openSection === section.id
                    const IconComponent = section.icon
                    
                    return (
                      <div key={section.id} className="border-b border-white/5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={`w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all duration-200 group relative ${
                                isActive ? "bg-white/5" : ""
                              }`}
                              onClick={() => toggleSection(section.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <IconComponent 
                                    size={20} 
                                    className={`transition-all duration-200 ${
                                      isActive ? "text-blue-400" : "text-white/70 group-hover:text-white/90"
                                    }`} 
                                  />
                                  {section.hasAlert && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                                  )}
                                </div>
                                <span className={`font-medium transition-colors duration-200 ${
                                  isActive ? "text-blue-400" : "text-white/80 group-hover:text-white/90"
                                }`}>
                                  {section.label}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {section.hasAlert && (
                                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                )}
                                {isActive ? (
                                  <ChevronDown size={18} className="text-blue-400 transition-transform duration-200" />
                                ) : (
                                  <ChevronRight size={18} className="text-white/50 group-hover:text-white/70 transition-all duration-200" />
                                )}
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-slate-800 border-slate-700">
                            <p>{section.label}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Section Content */}
                        {isActive && (
                          <div className="bg-slate-800/30 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-4 space-y-4">
                              {section.id === "options" && (
                                <>
                                  <MemoizedViewModeSelector
                                    viewType={currentViewType}
                                    onViewTypeChange={onViewTypeChange}
                                  />

                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-white/90">Camera</h4>
                                    <div className="text-xs text-white/60 bg-slate-700/50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span>Zoom Level</span>
                                        <span className="font-mono text-white/80">{zoomDisplay}x</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Version Info */}
                                  <div className="pt-4 border-t border-white/10">
                                    <div className="text-xs text-white/50 space-y-1">
                                      <div className="flex justify-between">
                                        <span>Version</span>
                                        <span className="font-mono">1.0.0</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Build</span>
                                        <span className="font-mono text-green-400">stable</span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {section.id === "time" && (
                                <MemoizedTimeControls
                                  timeMultiplier={currentTimeMultiplier}
                                  onTimeMultiplierChange={onTimeMultiplierChange}
                                  isPaused={isPaused}
                                  onPauseToggle={onPauseToggle}
                                  selectedObjectData={selectedObjectData}
                                  autoAdjustTime={autoAdjustTime}
                                  onAutoAdjustToggle={onAutoAdjustToggle}
                                />
                              )}

                              {section.id === "navigation" && (
                                <MemoizedSystemSelector
                                  availableSystems={availableSystems}
                                  currentSystem={currentSystem}
                                  onSystemChange={(systemId) => {
                                    onSystemChange(systemId)
                                    setOpenSection("navigation") // Keep navigation open after system change
                                  }}
                                />
                              )}

                              {section.id === "info" && (
                                <MemoizedSystemInfo
                                  systemData={systemData}
                                  focusedName={focusedName}
                                  focusedObjectSize={focusedObjectSize}
                                  onStopFollowing={onStopFollowing}
                                  error={error}
                                  loadingProgress={loadingProgress}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </>
          )}

          {/* Auto-expand functionality for collapsed state */}
          {isCollapsed && (
            <div className="space-y-0">
              {sections.map((section) => {
                const IconComponent = section.icon
                
                return (
                  <div key={section.id} className="border-b border-white/5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="w-full p-4 flex items-center justify-center hover:bg-white/5 transition-all duration-200 group relative"
                          onClick={() => {
                            setIsCollapsed(false)
                            setOpenSection(section.id)
                          }}
                        >
                          <div className="relative">
                            <IconComponent 
                              size={20} 
                              className="text-white/70 group-hover:text-white/90 transition-all duration-200" 
                            />
                            {section.hasAlert && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-slate-800 border-slate-700">
                        <p>{section.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10 bg-slate-800/20">
            {isExpanding ? (
              <FooterSkeleton />
            ) : showContent ? (
              <div className="text-xs text-center text-white/50 space-y-1 animate-in fade-in duration-200">
                <div className="font-medium">{headerTitle}</div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span>Online</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
