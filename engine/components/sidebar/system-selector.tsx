"use client"

import React from 'react'

interface SystemSelectorProps {
  availableSystems: Record<string, any>
  currentSystem: string
  onSystemChange: (systemId: string) => void
}

export function SystemSelector({ availableSystems, currentSystem, onSystemChange }: SystemSelectorProps) {
  // Handle both array and object formats
  const systemEntries = Array.isArray(availableSystems)
    ? availableSystems.map((systemId) => [systemId, { name: systemId }])
    : Object.entries(availableSystems)

  return (
    <div className="text-gray-200">
      <h4 className="font-medium mb-3 text-sm">Available Systems</h4>
      <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar pr-1">
        {systemEntries.map(([systemId, systemInfo]) => (
          <button
            key={systemId}
            onClick={() => onSystemChange(systemId)}
            className={`w-full text-left px-3 py-2 rounded transition-colors ${
              currentSystem === systemId ? "bg-blue-600 text-white" : "bg-white/10 hover:bg-white/20 text-gray-200"
            }`}
          >
            <div className="font-medium text-sm">
              {typeof systemInfo === "string" ? systemInfo : systemInfo?.name || systemId}
            </div>
            {systemInfo?.description && <div className="text-xs text-gray-300 truncate">{systemInfo.description}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
