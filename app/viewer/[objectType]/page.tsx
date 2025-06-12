"use client"

import { useParams } from "next/navigation"
import { CelestialViewer } from "@/engine/components/celestial-viewer/celestial-viewer"

export default function CelestialViewerPage() {
  const params = useParams()
  const objectType = params.objectType as string

  return (
    <div className="w-full h-screen bg-black">
      <CelestialViewer initialObjectType={objectType} />
    </div>
  )
} 