"use client"

import { useState, useEffect } from "react"
import { SystemViewer } from "../../components/system-viewer"
import { engineSystemLoader } from "../../engine/system-loader"
import { Sidebar } from "../../components/sidebar/sidebar"
import type { ViewType } from "@lib/types/effects-level"
import type { SystemData } from "../../engine/system-loader"
import type * as THREE from "three"

const MODE = "star-citizen"

export function StarCitizenApp() {
  const [viewType, setViewType] = useState<ViewType>("realistic")
  const [timeMultiplier, setTimeMultiplier] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(1)
  const [systemData, setSystemData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [focusedName, setFocusedName] = useState("")
  const [focusedObjectSize, setFocusedObjectSize] = useState<number | null>(null)
  const [availableSystems, setAvailableSystems] = useState<Record<string, any>>({})
  const [currentSystem, setCurrentSystem] = useState("sol")

  useEffect(() => {
    // Check for system query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const systemParam = urlParams.get("system")

    const loadStarmap = async () => {
      try {
        const starmapData = await engineSystemLoader.loadStarmap(MODE)

        if (!starmapData || !starmapData.systems || Object.keys(starmapData.systems).length === 0) {
          throw new Error("No systems found in star-citizen mode")
        }

        setAvailableSystems(starmapData.systems)

        // Set system from URL parameter or default to Stanton
        const systemIds = Object.keys(starmapData.systems)
        let defaultSystem = systemIds.includes("stanton") ? "stanton" : systemIds[0]

        // Use system from URL if valid
        if (systemParam && systemIds.includes(systemParam)) {
          defaultSystem = systemParam
        }

        setCurrentSystem(defaultSystem)
      } catch (error) {
        setError(`Failed to load Star Citizen universe: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    loadStarmap()
  }, [])

  useEffect(() => {
    const loadSystem = async () => {
      try {
        setLoading(true)
        const data = await engineSystemLoader.loadSystem("star-citizen", "sol")
        setSystemData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load system")
      } finally {
        setLoading(false)
      }
    }

    loadSystem()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-2">Loading Star Citizen Universe...</div>
          <div className="text-gray-400 text-sm mb-4">Explore the 'verse with lore-accurate systems</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-xl mb-2">Error Loading Star Citizen Universe</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <div className="text-xs text-gray-500 mb-4">
            Expected files:
            <br />• /data/star-citizen/starmap-systems.json
            <br />• /data/star-citizen/systems/*.json
            <br />• /data/engine/object-catalog/*.json
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!systemData) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">No systems available</div>
          <div className="text-gray-400 text-sm mb-4">Make sure the Star Citizen system JSON files exist</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <SystemViewer
          mode="star-citizen"
          systemId="sol"
          onFocus={(object: THREE.Object3D, name: string) => {
            setFocusedName(name)
            setFocusedObjectSize(object.scale.x)
          }}
          onSystemChange={(systemId: string) => {
            setCurrentSystem(systemId)
          }}
        />
      </div>
      <Sidebar
        currentViewType={viewType}
        currentTimeMultiplier={timeMultiplier}
        isPaused={isPaused}
        currentZoom={currentZoom}
        onViewTypeChange={setViewType}
        onTimeMultiplierChange={setTimeMultiplier}
        onPauseToggle={() => setIsPaused(!isPaused)}
        systemData={systemData}
        availableSystems={availableSystems}
        currentSystem={currentSystem}
        onSystemChange={setCurrentSystem}
        focusedName={focusedName}
        focusedObjectSize={focusedObjectSize}
        onStopFollowing={() => {
          setFocusedName("")
          setFocusedObjectSize(null)
        }}
        error={error}
        loadingProgress=""
        mode="star-citizen"
      />
    </div>
  )
}
