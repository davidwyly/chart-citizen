"use client"

import { useSearchParams } from "next/navigation"
import { CelestialViewer } from "@/engine/components/celestial-viewer/celestial-viewer"

export default function CelestialViewerPage() {
  const searchParams = useSearchParams()
  
  // Detect mode from URL parameters, default to realistic
  const mode = searchParams.get('mode') || 'realistic'
  
  // Get object type from query params if provided, otherwise let the viewer use its default
  const objectType = searchParams.get('object') || undefined

  return (
    <div className="w-full h-screen bg-black">
      <CelestialViewer initialObjectType={objectType} mode={mode} />
    </div>
  )
}