"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Star, Circle, Globe, Camera, ChevronDown, ChevronRight, Info, Settings, ChevronRight as ChevronRightIcon, ChevronsRight } from "lucide-react"
import { OrbitalSystemData } from "@/engine/types/orbital-system"
import { engineSystemLoader } from "@/engine/system-loader"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Skeleton } from "../ui/skeleton"

interface ObjectDetailsPanelProps {
  systemData: OrbitalSystemData | null
  focusedName: string
  focusedObjectSize: number | null
  isSystemSelected?: boolean
  cameraOrbitRadius?: number
  selectedObjectId?: string | null
  selectedObjectData?: any | null
}

interface PanelSection {
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

export function ObjectDetailsPanel({
  systemData,
  focusedName,
  focusedObjectSize,
  isSystemSelected = false,
  cameraOrbitRadius,
  selectedObjectId,
  selectedObjectData,
}: ObjectDetailsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openSection, setOpenSection] = useState<string>("details")
  const [isExpanding, setIsExpanding] = useState(false)
  const [showContent, setShowContent] = useState(true) // Start with content visible

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

  // Memoize calculations to prevent re-renders
  const systemStats = useMemo(() => {
    if (!systemData) return null

    const stars = engineSystemLoader.getStars(systemData)
    const planets = engineSystemLoader.getPlanets(systemData)
    const moons = engineSystemLoader.getMoons(systemData)

    return { stars, planets, moons }
  }, [systemData])

  // Find the focused object using multiple lookup strategies
  const focusedObject = useMemo(() => {
    if (!systemData || (!focusedName && !selectedObjectData)) return null

    const byId = engineSystemLoader.findObject(systemData, focusedName)
    const byNameExact = systemData.objects.find(obj => obj.name === focusedName)
    const byNameInsensitive = systemData.objects.find(obj => obj.name.toLowerCase() === focusedName.toLowerCase())
    
    // Use fallback if we have selectedObjectData but none of the name-based lookups worked
    const nameBasedLookupFailed = !byId && !byNameExact && !byNameInsensitive
    const shouldUseFallback = selectedObjectData && nameBasedLookupFailed
    
    return byId || byNameExact || byNameInsensitive || (shouldUseFallback ? selectedObjectData : null)
  }, [systemData, focusedName, selectedObjectData])

  // Determine panel state and content
  const panelState = useMemo(() => {
    if (!systemData) {
      return {
        type: 'no-data',
        title: 'Object Details',
        icon: Info,
        message: 'No system data available'
      }
    }

    if (isSystemSelected) {
      return {
        type: 'system',
        title: 'System Overview',
        icon: Globe,
        message: null
      }
    }

    if (!focusedName && !selectedObjectData) {
      return {
        type: 'no-selection',
        title: 'Object Details',
        icon: Info,
        message: 'Select an object to view details'
      }
    }

    if (!focusedObject) {
      return {
        type: 'not-found',
        title: 'Object Details',
        icon: Info,
        message: 'Object not found'
      }
    }

    return {
      type: 'object',
      title: 'Object Details',
      icon: focusedObject.classification === 'star' ? Star : 
            focusedObject.classification === 'planet' ? Circle : Circle,
      message: null
    }
  }, [systemData, isSystemSelected, focusedName, selectedObjectData, focusedObject])

  // Define sections based on panel state
  const sections: PanelSection[] = useMemo(() => {
    if (panelState.type === 'system') {
      return [
        {
          id: "system",
          label: "System Details",
          icon: Globe,
          hasAlert: false,
        },
        ...(cameraOrbitRadius ? [{
          id: "camera",
          label: "Camera",
          icon: Camera,
          hasAlert: false,
        }] : [])
      ]
    }

    if (panelState.type === 'object') {
      return [
        {
          id: "details",
          label: "Details",
          icon: Info,
          hasAlert: false,
        },
        ...(focusedObject?.orbit ? [{
          id: "orbital",
          label: "Orbital Data",
          icon: Settings,
          hasAlert: false,
        }] : []),
        ...(focusedObject?.properties ? [{
          id: "properties",
          label: "Properties",
          icon: Star,
          hasAlert: false,
        }] : [])
      ]
    }

    return []
  }, [panelState.type, cameraOrbitRadius, focusedObject])

  const renderContent = () => {
    if (panelState.message) {
      return (
        <div className="p-4">
          <div className="text-white/60 text-sm">{panelState.message}</div>
        </div>
      )
    }

    if (panelState.type === 'system' && systemData && systemStats) {
      return (
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
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                    <p>{section.label}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Section Content */}
                {isActive && (
                  <div className="bg-slate-800/30 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 space-y-4">
                      {section.id === "system" && (
                        <>
                          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
                            <Globe size={20} className="fill-current text-green-300" />
                            <div>
                              <h3 className="font-semibold text-lg">{systemData.name}</h3>
                              <p className="text-white/60 text-sm">Star System</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">System ID:</span>
                              <span className="text-white text-sm font-mono">{systemData.id}</span>
                            </div>

                            {systemData.description && (
                              <div className="flex justify-between">
                                <span className="text-white/60 text-sm">Description:</span>
                                <span className="text-white text-sm text-right max-w-48">{systemData.description}</span>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Stars:</span>
                              <span className="text-white text-sm">{systemStats.stars?.length || 0}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Planets:</span>
                              <span className="text-white text-sm">{systemStats.planets?.length || 0}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Moons:</span>
                              <span className="text-white text-sm">{systemStats.moons?.length || 0}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Total Objects:</span>
                              <span className="text-white text-sm">{systemData.objects?.length || 0}</span>
                            </div>
                          </div>
                        </>
                      )}

                      {section.id === "camera" && cameraOrbitRadius && (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-white/60 text-sm">Orbit Radius:</span>
                            <span className="text-white text-sm font-mono">{cameraOrbitRadius.toFixed(2)} AU</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60 text-sm">View Mode:</span>
                            <span className="text-white text-sm">Birds Eye</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    if (panelState.type === 'object' && focusedObject) {
      const objectType = focusedObject.classification === 'star' ? 'Star' : 
                         focusedObject.classification === 'planet' ? 'Planet' : 
                         focusedObject.classification === 'moon' ? 'Moon' : 
                         focusedObject.classification
      const objectIcon = focusedObject.classification === 'star' ? 
                         <Star size={20} className="fill-current text-yellow-300" /> : 
                         focusedObject.classification === 'planet' ? 
                         <Circle size={16} className="fill-current text-blue-300" /> :
                         <Circle size={14} className="fill-current text-purple-300" />

      return (
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
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                    <p>{section.label}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Section Content */}
                {isActive && (
                  <div className="bg-slate-800/30 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 space-y-4">
                      {section.id === "details" && (
                        <>
                          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
                            {objectIcon}
                            <div>
                              <h3 className="font-semibold text-lg">{focusedObject.name}</h3>
                              <p className="text-white/60 text-sm">{objectType}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">ID:</span>
                              <span className="text-white text-sm font-mono">{focusedObject.id}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Classification:</span>
                              <span className="text-white text-sm">{focusedObject.classification}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Geometry Type:</span>
                              <span className="text-white text-sm">{focusedObject.geometry_type}</span>
                            </div>

                            {focusedObject.position && (
                              <div className="flex justify-between">
                                <span className="text-white/60 text-sm">Position:</span>
                                <span className="text-white text-sm font-mono">
                                  {focusedObject.position.map(p => p.toFixed(1)).join(', ')}
                                </span>
                              </div>
                            )}

                            {focusedObjectSize && (
                              <div className="flex justify-between">
                                <span className="text-white/60 text-sm">Visual Size:</span>
                                <span className="text-white text-sm font-mono">{focusedObjectSize.toFixed(3)}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {section.id === "orbital" && focusedObject.orbit && (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-white/60 text-sm">Orbital Parent:</span>
                            <span className="text-white text-sm">{focusedObject.orbit.parent}</span>
                          </div>

                          {'semi_major_axis' in focusedObject.orbit ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-white/60 text-sm">Semi-Major Axis:</span>
                                <span className="text-white text-sm font-mono">{focusedObject.orbit.semi_major_axis} AU</span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-white/60 text-sm">Orbital Period:</span>
                                <span className="text-white text-sm font-mono">{focusedObject.orbit.orbital_period.toFixed(1)} days</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-white/60 text-sm">Inner Radius:</span>
                                <span className="text-white text-sm font-mono">{focusedObject.orbit.inner_radius} AU</span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-white/60 text-sm">Outer Radius:</span>
                                <span className="text-white text-sm font-mono">{focusedObject.orbit.outer_radius} AU</span>
                              </div>
                            </>
                          )}

                          <div className="flex justify-between">
                            <span className="text-white/60 text-sm">Eccentricity:</span>
                            <span className="text-white text-sm font-mono">{focusedObject.orbit.eccentricity?.toFixed(3) || 'N/A'}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-white/60 text-sm">Inclination:</span>
                            <span className="text-white text-sm font-mono">{focusedObject.orbit.inclination?.toFixed(1) || 'N/A'}°</span>
                          </div>
                        </div>
                      )}

                      {section.id === "properties" && focusedObject.properties && (
                        <div className="space-y-3">
                          {focusedObject.properties.mass && (
                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Mass:</span>
                              <span className="text-white text-sm font-mono">{focusedObject.properties.mass} M☉</span>
                            </div>
                          )}
                          {focusedObject.properties.radius && (
                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Radius:</span>
                              <span className="text-white text-sm font-mono">{focusedObject.properties.radius} R☉</span>
                            </div>
                          )}
                          {focusedObject.properties.temperature && (
                            <div className="flex justify-between">
                              <span className="text-white/60 text-sm">Temperature:</span>
                              <span className="text-white text-sm font-mono">{focusedObject.properties.temperature} K</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }

  return (
    <TooltipProvider>
      <div
        data-testid="object-details-panel"
        className={`fixed top-0 left-0 bottom-0 bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden border-r border-white/10 z-50 ${
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
                  <h1 className="text-lg font-semibold text-white/90 tracking-wide">{panelState.title}</h1>
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
                data-testid="panel-toggle"
                onClick={handleToggleCollapse}
                className={`w-full flex items-center justify-center hover:bg-white/10 p-3 rounded-lg transition-all duration-200 group ${
                  isCollapsed ? "p-3" : "justify-start gap-3"
                }`}
              >
                {isCollapsed ? (
                  <ChevronRightIcon size={20} className="group-hover:scale-110 transition-transform" />
                ) : (
                  <>
                    <ChevronsRight size={18} className="group-hover:scale-110 transition-transform" />
                    {showContent && (
                      <span className="text-sm font-medium animate-in fade-in duration-200">Collapse</span>
                    )}
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 border-slate-700">
              <p>{isCollapsed ? "Expand panel" : "Collapse panel"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Content Sections */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
          {!isCollapsed && (
            <>
              {isExpanding ? (
                // Show skeleton during expansion
                <div className="space-y-0">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-white/5 p-4">
                      <SectionSkeleton />
                    </div>
                  ))}
                </div>
              ) : showContent ? (
                renderContent()
              ) : null}
            </>
          )}

          {/* Auto-expand functionality for collapsed state */}
          {isCollapsed && sections.length > 0 && (
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
                      <TooltipContent side="right" className="bg-slate-800 border-slate-700">
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
                <div className="font-medium">Object Details</div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span>Active</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}