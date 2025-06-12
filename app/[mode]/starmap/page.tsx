"use client"

import { useState } from "react"
import { notFound, useParams } from "next/navigation"
import { StarmapViewer } from "@/components/starmap/starmap-viewer"
import { SystemViewer } from "@/components/system-viewer"

const validModes = ["realistic", "star-citizen"] as const

type ValidMode = (typeof validModes)[number]

function isValidMode(mode: string): mode is ValidMode {
  return validModes.includes(mode as ValidMode)
}

export default function StarmapPage() {
  const { mode } = useParams() as { mode: string }
  if (!isValidMode(mode)) {
    notFound()
  }

  const [selectedSystem, setSelectedSystem] = useState<string | null>(null)

  return (
    <div className="w-full h-screen bg-black">
      {selectedSystem ? (
        <>
          {/* Breadcrumb */}
          <div className="absolute top-4 left-4 z-10">
            <button
              className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
              onClick={() => setSelectedSystem(null)}
            >
              ← Starmap
            </button>
          </div>
          <SystemViewer 
            mode={mode} 
            systemId={selectedSystem} 
            onSystemChange={setSelectedSystem}
          />
        </>
      ) : (
        <StarmapViewer mode={mode} onSystemSelect={setSelectedSystem} />
      )}
    </div>
  )
} 