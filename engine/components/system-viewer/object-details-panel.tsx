"use client"

import type React from "react"
import { Star, Circle, Globe, Camera } from "lucide-react"
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
  if (!systemData) {
    return (
      <div className="fixed top-6 left-6 z-40 w-80 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 p-4">
        <div className="text-white/60 text-sm">
          No system data available
        </div>
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
      <div className="fixed top-6 left-6 z-40 w-80 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 p-4">
        <div className="text-white">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
            <Globe size={20} className="fill-current text-green-300" />
            <div>
              <h3 className="font-semibold text-lg">{systemData.name}</h3>
              <p className="text-white/60 text-sm">Star System</p>
            </div>
          </div>

          {/* System Details */}
          <div className="space-y-3">
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

          {/* Camera Section */}
          {cameraOrbitRadius && (
            <>
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <Camera size={16} className="text-blue-300" />
                  <span className="text-white font-medium text-sm">Camera</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Orbit Radius:</span>
                    <span className="text-white text-sm">{cameraOrbitRadius.toFixed(2)} AU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">View Mode:</span>
                    <span className="text-white text-sm">Birds Eye</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Original object-focused logic
  if (!focusedName) {
    return (
      <div className="fixed top-6 left-6 z-40 w-80 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 p-4">
        <div className="text-white/60 text-sm">
          Select an object to view details
        </div>
      </div>
    )
  }

  // Find the focused object using the system loader helper method
  const focusedObject = engineSystemLoader.findObject(systemData, focusedName) || 
                       systemData.objects.find(obj => obj.name === focusedName)

  if (!focusedObject) {
    return (
      <div className="fixed top-6 left-6 z-40 w-80 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 p-4">
        <div className="text-white/60 text-sm">
          Object not found
        </div>
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
    <div className="fixed top-6 left-6 z-40 w-80 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 p-4">
      <div className="text-white">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
          {objectIcon}
          <div>
            <h3 className="font-semibold text-lg">{focusedObject.name}</h3>
            <p className="text-white/60 text-sm">{objectType}</p>
          </div>
        </div>

        {/* Details */}
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

          {focusedObject.orbit && (
            <>
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
            </>
          )}

          {/* Object Properties */}
          {focusedObject.properties && (
            <>
              <div className="mt-4 pt-3 border-t border-white/20">
                <span className="text-white font-medium text-sm">Properties</span>
                <div className="mt-2 space-y-2">
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
              </div>
            </>
          )}

          {/* Visual Size */}
          {focusedObjectSize && (
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Visual Size:</span>
                <span className="text-white text-sm">{focusedObjectSize.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}