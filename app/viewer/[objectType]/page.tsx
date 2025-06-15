"use client"

import { useParams, useSearchParams } from "next/navigation"
import { CelestialViewer } from "@/engine/components/celestial-viewer/celestial-viewer"

export default function CelestialViewerPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const objectType = params.objectType as string
  
  // Detect mode from URL parameters, default to realistic
  const mode = searchParams.get('mode') || 'realistic'

  return (
    <div className="w-full h-screen bg-black">
      <CelestialViewer initialObjectType={objectType} mode={mode} />
    </div>
  )
} 