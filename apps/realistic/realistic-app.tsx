"use client"

import { useState, useEffect } from "react"
import { SystemViewer } from "../../components/system-viewer"
import { engineSystemLoader } from "../../engine/system-loader"
import { Sidebar } from "../../components/sidebar/sidebar"
import type * as THREE from "three"
import type { ViewType } from "@lib/types/effects-level"

const MODE = "realistic"

export function RealisticApp() {
  const [systemId, setSystemId] = useState<string | null>(null)
  const [availableSystems, setAvailableSystems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewType, setViewType] = useState<ViewType>("realistic")
  const [timeMultiplier, setTimeMultiplier] = useState(1)
  const [isPaused, setIsPaused] = useState(true)
  const [currentZoom, setCurrentZoom] = useState(1)

  // Load available systems
  useEffect(() => {
    async function loadSystems() {
      try {
        const systems = await engineSystemLoader.getAvailableSystems(MODE)
        if (systems.length === 0) {
          throw new Error("No systems found in realistic mode")
        }
        setAvailableSystems(systems)
        setSystemId(systems[0]) // Select first system by default
      } catch (error) {
        setError(`Failed to load realistic universe: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    loadSystems()
  }, [])

  // Handle system change
  const handleSystemChange = (newSystemId: string) => {
    if (!newSystemId || typeof newSystemId !== "string") {
      console.error("Invalid system ID:", newSystemId)
      return
    }

    setSystemId(newSystemId)
  }

  // Handle object focus
  const handleObjectFocus = (object: THREE.Object3D, name: string) => {
    console.log("Focused on:", name)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading Realistic Universe...</div>
          <div className="text-gray-400">Please wait while we initialize the system.</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Error Loading Realistic Universe</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <div className="text-gray-500 text-xs">
            Expected files:
            <ul className="list-disc list-inside mt-2">
              <li>public/data/realistic/systems/*.json</li>
              <li>public/data/realistic/catalog/*.json</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!systemId) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">No System Selected</div>
          <div className="text-gray-400 text-sm">
            Please select a system from the available options.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <SystemViewer
        mode="realistic"
        systemId={systemId}
        onFocus={handleObjectFocus}
        onSystemChange={handleSystemChange}
      />
    </div>
  )
}
