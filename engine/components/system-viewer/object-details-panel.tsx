"use client"

import type React from "react"
import { useState } from "react"
import { Star, Circle, Globe, Camera, ChevronDown, ChevronRight, Info, Settings } from "lucide-react"
import { OrbitalSystemData } from "@/engine/types/orbital-system"
import { engineSystemLoader } from "@/engine/system-loader"

interface ObjectDetailsPanelProps {
  systemData: OrbitalSystemData | null
  focusedName: string
  focusedObjectSize: number | null
  isSystemSelected?: boolean
  cameraOrbitRadius?: number
}

export function ObjectDetailsPanel({
  systemData,
  focusedName,
  focusedObjectSize,
  isSystemSelected = false,
  cameraOrbitRadius,
}: ObjectDetailsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openSection, setOpenSection] = useState<string>("details")

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section)
  }

  if (!systemData) {
    return (
      <div
        className={`fixed top-0 left-0 bottom-0 bg-black/70 backdrop-blur-sm text-white flex flex-col transition-all duration-300 overflow-x-hidden ${
          isCollapsed ? "w-12" : "w-80"
        }`}
      >
        <div className="p-4 border-b border-white/10">
          {!isCollapsed && <h1 className="text-lg font-bold">Object Details</h1>}
        </div>
        <div className="p-2 border-b border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center hover:bg-white/10 p-2 rounded"
          >
            <Info size={18} />
            {!isCollapsed && <span className="ml-2">Collapse</span>}
          </button>
        </div>
        {!isCollapsed && (
          <div className="p-4">
            <div className="text-white/60 text-sm">No system data available</div>
          </div>
        )}
      </div>
    )
  }

  // Get stars, planets, and moons using the system loader helper methods
  const stars = engineSystemLoader.getStars(systemData)
  const planets = engineSystemLoader.getPlanets(systemData)
  const moons = engineSystemLoader.getMoons(systemData)

  // If system is selected, show system information
  if (isSystemSelected) {
    return (
      <div
        className={`fixed top-0 left-0 bottom-0 bg-black/70 backdrop-blur-sm text-white flex flex-col transition-all duration-300 overflow-x-hidden ${
          isCollapsed ? "w-12" : "w-80"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          {!isCollapsed && <h1 className="text-lg font-bold">System Overview</h1>}
        </div>

        {/* Toggle Button */}
        <div className="p-2 border-b border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center hover:bg-white/10 p-2 rounded"
          >
            <Globe size={18} />
            {!isCollapsed && <span className="ml-2">Collapse</span>}
          </button>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* System Details Section */}
            <div className="border-b border-white/10">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-white/5"
                onClick={() => toggleSection("system")}
              >
                <div className="flex items-center gap-2">
                  <Globe size={18} />
                  <span>System Details</span>
                </div>
                {openSection === "system" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {openSection === "system" && (
                <div className="p-4 pt-0 space-y-3">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
                    <Globe size={20} className="fill-current text-green-300" />
                    <div>
                      <h3 className="font-semibold text-lg">{systemData.name}</h3>
                      <p className="text-white/60 text-sm">Star System</p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">System ID:</span>
                    <span className="text-white text-sm">{systemData.id}</span>
                  </div>

                  {systemData.description && (
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Description:</span>
                      <span className="text-white text-sm text-right max-w-48">{systemData.description}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Stars:</span>
                    <span className="text-white text-sm">{stars?.length || 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Planets:</span>
                    <span className="text-white text-sm">{planets?.length || 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Moons:</span>
                    <span className="text-white text-sm">{moons?.length || 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Total Objects:</span>
                    <span className="text-white text-sm">{systemData.objects?.length || 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Section */}
            {cameraOrbitRadius && (
              <div className="border-b border-white/10">
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5"
                  onClick={() => toggleSection("camera")}
                >
                  <div className="flex items-center gap-2">
                    <Camera size={18} />
                    <span>Camera</span>
                  </div>
                  {openSection === "camera" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {openSection === "camera" && (
                  <div className="p-4 pt-0 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Orbit Radius:</span>
                      <span className="text-white text-sm">{cameraOrbitRadius.toFixed(2)} AU</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">View Mode:</span>
                      <span className="text-white text-sm">Birds Eye</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Original object-focused logic
  if (!focusedName) {
    return (
      <div
        className={`fixed top-0 left-0 bottom-0 bg-black/70 backdrop-blur-sm text-white flex flex-col transition-all duration-300 overflow-x-hidden ${
          isCollapsed ? "w-12" : "w-80"
        }`}
      >
        <div className="p-4 border-b border-white/10">
          {!isCollapsed && <h1 className="text-lg font-bold">Object Details</h1>}
        </div>
        <div className="p-2 border-b border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center hover:bg-white/10 p-2 rounded"
          >
            <Info size={18} />
            {!isCollapsed && <span className="ml-2">Collapse</span>}
          </button>
        </div>
        {!isCollapsed && (
          <div className="p-4">
            <div className="text-white/60 text-sm">Select an object to view details</div>
          </div>
        )}
      </div>
    )
  }

  // Find the focused object using the system loader helper method
  const focusedObject = engineSystemLoader.findObject(systemData, focusedName) || 
                       systemData.objects.find(obj => obj.name === focusedName)

  if (!focusedObject) {
    return (
      <div
        className={`fixed top-0 left-0 bottom-0 bg-black/70 backdrop-blur-sm text-white flex flex-col transition-all duration-300 overflow-x-hidden ${
          isCollapsed ? "w-12" : "w-80"
        }`}
      >
        <div className="p-4 border-b border-white/10">
          {!isCollapsed && <h1 className="text-lg font-bold">Object Details</h1>}
        </div>
        <div className="p-2 border-b border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center hover:bg-white/10 p-2 rounded"
          >
            <Info size={18} />
            {!isCollapsed && <span className="ml-2">Collapse</span>}
          </button>
        </div>
        {!isCollapsed && (
          <div className="p-4">
            <div className="text-white/60 text-sm">Object not found</div>
          </div>
        )}
      </div>
    )
  }

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
    <div
      className={`fixed top-0 left-0 bottom-0 bg-black/70 backdrop-blur-sm text-white flex flex-col transition-all duration-300 overflow-x-hidden ${
        isCollapsed ? "w-12" : "w-80"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        {!isCollapsed && <h1 className="text-lg font-bold">Object Details</h1>}
      </div>

      {/* Toggle Button */}
      <div className="p-2 border-b border-white/10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center hover:bg-white/10 p-2 rounded"
        >
          {focusedObject.classification === 'star' ? (
            <Star size={18} className="text-yellow-300" />
          ) : focusedObject.classification === 'planet' ? (
            <Circle size={18} className="text-blue-300" />
          ) : (
            <Circle size={18} className="text-purple-300" />
          )}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>

      {/* Accordion Sections */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Object Details Section */}
          <div className="border-b border-white/10">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-white/5"
              onClick={() => toggleSection("details")}
            >
              <div className="flex items-center gap-2">
                <Info size={18} />
                <span>Details</span>
              </div>
              {openSection === "details" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {openSection === "details" && (
              <div className="p-4 pt-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
                  {objectIcon}
                  <div>
                    <h3 className="font-semibold text-lg">{focusedObject.name}</h3>
                    <p className="text-white/60 text-sm">{objectType}</p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">ID:</span>
                    <span className="text-white text-sm">{focusedObject.id}</span>
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
                      <span className="text-white text-sm">
                        {focusedObject.position.map(p => p.toFixed(1)).join(', ')}
                      </span>
                    </div>
                  )}

                  {focusedObjectSize && (
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Visual Size:</span>
                      <span className="text-white text-sm">{focusedObjectSize.toFixed(3)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Orbital Information Section */}
          {focusedObject.orbit && (
            <div className="border-b border-white/10">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-white/5"
                onClick={() => toggleSection("orbital")}
              >
                <div className="flex items-center gap-2">
                  <Settings size={18} />
                  <span>Orbital Data</span>
                </div>
                {openSection === "orbital" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {openSection === "orbital" && (
                <div className="p-4 pt-0 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Orbital Parent:</span>
                    <span className="text-white text-sm">{focusedObject.orbit.parent}</span>
                  </div>

                  {'semi_major_axis' in focusedObject.orbit ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">Semi-Major Axis:</span>
                        <span className="text-white text-sm">{focusedObject.orbit.semi_major_axis} AU</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">Orbital Period:</span>
                        <span className="text-white text-sm">{focusedObject.orbit.orbital_period.toFixed(1)} days</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">Inner Radius:</span>
                        <span className="text-white text-sm">{focusedObject.orbit.inner_radius} AU</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">Outer Radius:</span>
                        <span className="text-white text-sm">{focusedObject.orbit.outer_radius} AU</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Eccentricity:</span>
                    <span className="text-white text-sm">{focusedObject.orbit.eccentricity?.toFixed(3) || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Inclination:</span>
                    <span className="text-white text-sm">{focusedObject.orbit.inclination?.toFixed(1) || 'N/A'}°</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Physical Properties Section */}
          {focusedObject.properties && (
            <div className="border-b border-white/10">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-white/5"
                onClick={() => toggleSection("properties")}
              >
                <div className="flex items-center gap-2">
                  <Star size={18} />
                  <span>Properties</span>
                </div>
                {openSection === "properties" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {openSection === "properties" && (
                <div className="p-4 pt-0 space-y-2">
                  {focusedObject.properties.mass && (
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Mass:</span>
                      <span className="text-white text-sm">{focusedObject.properties.mass} M☉</span>
                    </div>
                  )}
                  {focusedObject.properties.radius && (
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Radius:</span>
                      <span className="text-white text-sm">{focusedObject.properties.radius} R☉</span>
                    </div>
                  )}
                  {focusedObject.properties.temperature && (
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Temperature:</span>
                      <span className="text-white text-sm">{focusedObject.properties.temperature} K</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 