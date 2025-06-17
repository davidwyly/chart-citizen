"use client"

import React from "react"

interface LoadingStateProps {
  systemId: string
  loadingProgress: string
}

interface ErrorStateProps {
  error: string
  availableSystems: string[]
  mode: string
}

export function LoadingState({ systemId, loadingProgress }: LoadingStateProps) {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl mb-2">Loading {systemId}...</div>
        {loadingProgress && <div className="text-gray-400 text-sm">{loadingProgress}</div>}
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    </div>
  )
}

export function ErrorState({ error, availableSystems, mode }: ErrorStateProps) {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-2">{error || "System not found"}</div>
        <div className="text-gray-400 text-sm mb-4">
          Available systems in {mode} mode: {availableSystems.join(", ") || "None"}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
