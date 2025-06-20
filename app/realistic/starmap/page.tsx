'use client'

import React, { useState } from 'react'
import { StarmapCanvas } from './components/starmap-canvas'
import { StarmapSystem } from './types'

/**
 * Main starmap page for realistic mode
 * Phase 2 implementation with basic system visualization
 */
export default function StarmapPage() {
  const [selectedSystem, setSelectedSystem] = useState<StarmapSystem | null>(null)

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Realistic Mode Starmap</h1>
            <p className="text-sm text-gray-400">Interactive system navigation</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {selectedSystem && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Selected System</p>
                <p className="font-semibold text-green-400">{selectedSystem.name}</p>
              </div>
            )}
            
            <button
              onClick={() => {
                setSelectedSystem(null)
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
              disabled={!selectedSystem}
            >
              Clear Selection
            </button>
          </div>
        </div>
      </header>

      {/* Main starmap canvas */}
      <main className="flex-1 relative">
        <StarmapCanvas
          className="w-full h-full"
          onSystemSelect={setSelectedSystem}
          selectedSystemId={selectedSystem?.id || null}
        />
      </main>

      {/* Footer with controls */}
      <footer className="bg-gray-900 border-t border-gray-700 p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="text-gray-400">
              <span className="text-blue-400">●</span> Systems
            </div>
            <div className="text-gray-400">
              <span className="text-yellow-400">●</span> Hovered
            </div>
            <div className="text-gray-400">
              <span className="text-green-400">●</span> Selected
            </div>
          </div>
          
          <div className="text-gray-400">
            Phase 2: Basic Rendering • Click systems to select • Hover for info
          </div>
        </div>
      </footer>
    </div>
  )
} 