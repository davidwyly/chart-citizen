"use client"

import { useParams } from "next/navigation"
import { DebugViewer } from "@/components/debug-viewer"

export default function DebugViewerPage() {
  const params = useParams()
  const objectType = params.objectType as string

  return (
    <div className="w-full h-screen bg-black">
      <DebugViewer objectType={objectType} />
    </div>
  )
} 