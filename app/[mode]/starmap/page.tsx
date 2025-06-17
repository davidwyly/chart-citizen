"use client"

import { useState, useEffect } from "react"
import { notFound, useParams } from "next/navigation"
import { StarmapViewer } from "@/components/starmap/starmap-viewer"
import { SystemViewer } from "@/engine/components/system-viewer"
import { Sidebar } from "@/engine/components/sidebar/sidebar"
import { engineSystemLoader } from "@/engine/system-loader"

const validModes = ["realistic", "star-citizen"] as const

type ValidMode = (typeof validModes)[number]

function isValidMode(mode: string): mode is ValidMode {
  return validModes.includes(mode as ValidMode)
}

// Type for starmap system data
interface StarmapSystem {
  id: string
  name: string
  position: [number, number, number]
  description?: string
  jump_routes?: string[]
  [key: string]: unknown
}

export default function StarmapPage() {
  const { mode } = useParams() as { mode: string }
  if (!isValidMode(mode)) {
    notFound()
  }

  const [selectedSystem, setSelectedSystem] = useState<string | null>(null)
  const [availableSystems, setAvailableSystems] = useState<Record<string, StarmapSystem>>({})

  // Load available systems when component mounts
  useEffect(() => {
    async function loadSystems() {
      try {
        const starmap = await engineSystemLoader.loadStarmap(mode)
        if (starmap?.systems) {
          setAvailableSystems(starmap.systems)
        }
      } catch (error) {
        console.warn(`Failed to load available systems for ${mode} mode:`, error)
      }
    }

    loadSystems()
  }, [mode])

  return (
    <div className="w-full h-screen bg-black">
      {selectedSystem ? (
        <SystemViewer 
          mode={mode} 
          systemId={selectedSystem} 
          onSystemChange={setSelectedSystem}
        />
      ) : (
        <>
          <StarmapViewer mode={mode} onSystemSelect={setSelectedSystem} />
          {/* Sidebar for starmap */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto">
              <Sidebar
                onViewTypeChange={() => {}} // No view type change in starmap
                onTimeMultiplierChange={() => {}} // No time controls in starmap
                onPauseToggle={() => {}} // No pause/play in starmap
                currentViewType="explorational" // Default view type for starmap
                currentTimeMultiplier={1}
                isPaused={false}
                currentZoom={1}
                systemData={null} // No system data in starmap view
                availableSystems={availableSystems}
                currentSystem="" // No current system in starmap
                onSystemChange={setSelectedSystem} // Select system from sidebar
                focusedName=""
                focusedObjectSize={null}
                onStopFollowing={() => {}}
                error={null}
                loadingProgress=""
                mode={mode as "realistic" | "star-citizen"}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
} 