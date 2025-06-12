"use client"

import type { CelestialObject } from "@/lib/types"

interface ObjectInfoProps {
  selectedObject: CelestialObject | null
}

export function ObjectInfo({ selectedObject }: ObjectInfoProps) {
  if (!selectedObject) {
    return (
      <div className="flex h-full flex-col border-t border-gray-800 bg-gray-950 p-4">
        <h2 className="mb-4 text-lg font-semibold">Object Information</h2>
        <p className="text-gray-400">Select an object to view its information.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col border-t border-gray-800 bg-gray-950 p-4">
      <h2 className="mb-4 text-lg font-semibold">Object Information</h2>
      <div className="grid gap-2 text-sm text-gray-300">
        <div>
          <span className="font-medium text-gray-200">Name:</span> {selectedObject.name}
        </div>
        <div>
          <span className="font-medium text-gray-200">Type:</span> {selectedObject.type}
        </div>
        <div>
          <span className="font-medium text-gray-200">Subtype:</span> {selectedObject.subtype}
        </div>
        <div>
          <span className="font-medium text-gray-200">Description:</span> {selectedObject.description}
        </div>
        {/* Add more static properties here if needed, e.g., Mass, Radius, etc. */}
        {/* For now, we'll just show the basic info */}
      </div>
    </div>
  )
}
