"use client"

import { useState, useEffect } from "react"
import { notFound, useParams, useSearchParams } from "next/navigation"
import { SystemViewer } from "@/engine/components/system-viewer"
import { ModeNavigation } from "@/components/ui/mode-navigation"
import { engineSystemLoader } from "@/engine/system-loader"
import type * as THREE from "three"

const validModes = ["realistic", "star-citizen"] as const
type ValidMode = (typeof validModes)[number]

function isValidMode(mode: string): mode is ValidMode {
  return validModes.includes(mode as ValidMode)
}

export default function SystemViewerPage() {
  const { mode } = useParams() as { mode: string }
  const searchParams = useSearchParams()
  const systemId = searchParams.get('system')
  
  if (!isValidMode(mode)) {
    notFound()
  }

  const [currentSystemId, setCurrentSystemId] = useState<string | null>(systemId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load available systems and set default if no system specified
  useEffect(() => {
    async function loadSystems() {
      try {
        const systems = await engineSystemLoader.getAvailableSystems(mode)
        if (systems.length === 0) {
          throw new Error(`No systems found in ${mode} mode`)
        }
        
        // If no system specified in URL, use the first available system
        if (!systemId) {
          setCurrentSystemId(systems[0])
        }
      } catch (error) {
        setError(`Failed to load ${mode} universe: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    loadSystems()
  }, [mode, systemId])

  // Handle system change
  const handleSystemChange = (newSystemId: string) => {
    if (!newSystemId || typeof newSystemId !== "string") {
      console.error("Invalid system ID:", newSystemId)
      return
    }

    setCurrentSystemId(newSystemId)
    
    // Update URL with new system parameter
    const url = new URL(window.location.href)
    url.searchParams.set('system', newSystemId)
    window.history.pushState({}, '', url.toString())
  }

  // Handle object focus
  const handleObjectFocus = (object: THREE.Object3D, name: string) => {
    console.log("Focused on:", name)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading {mode === "realistic" ? "Realistic" : "Star Citizen"} Universe...</div>
          <div className="text-gray-400">Please wait while we initialize the system.</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Error Loading {mode === "realistic" ? "Realistic" : "Star Citizen"} Universe</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <div className="text-gray-500 text-xs">
            Expected files:
            <ul className="list-disc list-inside mt-2">
              <li>public/data/{mode}/systems/*.json</li>
              <li>public/data/{mode}/catalog/*.json</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!currentSystemId) {
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
      <ModeNavigation mode={mode} />
      <SystemViewer
        mode={mode}
        systemId={currentSystemId}
        onFocus={handleObjectFocus}
        onSystemChange={handleSystemChange}
      />
    </div>
  )
} 