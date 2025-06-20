'use client'

import React, { useEffect, useState } from 'react'
import { useStarmapRenderer } from '../hooks/use-starmap-renderer'
import { StarmapDataLoader } from '../services/data-loader'
import { StarmapSystem } from '../types'

interface StarmapCanvasProps {
  className?: string
  onSystemSelect?: (system: StarmapSystem | null) => void
  selectedSystemId?: string | null
}

/**
 * Main starmap canvas component for Phase 2
 * Renders systems as interactive spheres with basic click/hover support
 */
export function StarmapCanvas({ 
  className = '', 
  onSystemSelect,
  selectedSystemId 
}: StarmapCanvasProps) {
  const [systems, setSystems] = useState<StarmapSystem[]>([])
  const [selectedSystem, setSelectedSystem] = useState<StarmapSystem | null>(null)
  const [hoveredSystemId, setHoveredSystemId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cameraMode, setCameraMode] = useState<'2d' | '3d'>('3d')

  // Initialize renderer with callbacks
  const { 
    canvasRef, 
    renderSystems, 
    selectSystem, 
    focusOnSystem,
    toggleHexGrid,
    setHexGridVisible,
    toggleCameraMode,
    getCameraMode,
    isReady 
  } = useStarmapRenderer({
    onSystemClick: (systemId: string) => {
      const system = systems.find(s => s.id === systemId)
      setSelectedSystem(system || null)
      onSystemSelect?.(system || null)
    },
    onSystemHover: (systemId: string | null) => {
      setHoveredSystemId(systemId)
    }
  })
  
  // Handle camera mode toggle
  const handleCameraModeToggle = () => {
    toggleCameraMode()
    const newMode = getCameraMode()
    if (newMode) {
      setCameraMode(newMode)
    }
  }

  // Load starmap data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const loader = new StarmapDataLoader()
        const data = await loader.loadSystemData('realistic')
        setSystems(Array.from(data.systems.values()))
        
        console.log(`Loaded ${data.systems.size} systems for starmap`)
        
      } catch (err) {
        console.error('Failed to load starmap data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load starmap data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Render systems when data is loaded and renderer is ready
  useEffect(() => {
    if (isReady && systems.length > 0) {
      renderSystems(systems)
    }
  }, [isReady, systems, renderSystems])

  // Handle external selection changes
  useEffect(() => {
    if (selectedSystemId !== undefined) {
      selectSystem(selectedSystemId)
      
      if (selectedSystemId) {
        const system = systems.find(s => s.id === selectedSystemId)
        setSelectedSystem(system || null)
        
        // Focus camera on selected system
        if (system) {
          focusOnSystem(selectedSystemId)
        }
      } else {
        setSelectedSystem(null)
      }
    }
  }, [selectedSystemId, systems, selectSystem, focusOnSystem])

  // Handle loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-black text-white ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <p>Loading starmap...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black text-white ${className}`}>
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold mb-2">Failed to load starmap</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-black cursor-pointer"
        style={{ 
          display: 'block',
          imageRendering: 'crisp-edges'
        }}
      />
      
      {/* System info overlay */}
      {hoveredSystemId && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded border border-blue-400/30 pointer-events-none">
          <SystemInfoCard systemId={hoveredSystemId} systems={systems} />
        </div>
      )}
      
      {/* Selected system panel */}
      {selectedSystem && (
        <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded border border-green-400/50 min-w-64">
          <SelectedSystemPanel 
            system={selectedSystem} 
            onClose={() => {
              setSelectedSystem(null)
              selectSystem(null)
              onSystemSelect?.(null)
            }}
          />
        </div>
      )}
      
      {/* Loading overlay for renderer */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
            <p className="text-sm">Initializing renderer...</p>
          </div>
        </div>
      )}
      
      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs p-2 rounded">
        <p>Systems: {systems.length}</p>
        <p>Selected: {selectedSystem?.name || 'None'}</p>
        <p>Hovered: {hoveredSystemId || 'None'}</p>
        <p>Camera: {cameraMode.toUpperCase()} Mode</p>
      </div>

      {/* Controls overlay */}
      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs p-2 rounded">
        <p className="font-semibold mb-1">Controls:</p>
        {cameraMode === '3d' ? (
          <>
            <p>🖱️ Click & drag to rotate</p>
            <p>🎲 Scroll to zoom</p>
          </>
        ) : (
          <p>🎲 Scroll to zoom</p>
        )}
        <p>📍 Click systems to select</p>
        <p>📐 Toggle view mode</p>
      </div>

      {/* Camera and grid controls */}
      <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs p-2 rounded space-y-2">
        <button 
          onClick={handleCameraModeToggle}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors font-semibold"
        >
          {cameraMode === '2d' ? '📐 2D View' : '🎬 3D View'}
        </button>
        <button 
          onClick={toggleHexGrid}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          🎯 Toggle Hex Grid
        </button>
      </div>
    </div>
  )
}

/**
 * Quick system info card for hover state
 */
function SystemInfoCard({ systemId, systems }: { systemId: string; systems: StarmapSystem[] }) {
  const system = systems.find(s => s.id === systemId)
  
  if (!system) return null

  return (
    <div>
      <h3 className="font-semibold text-blue-400">{system.name}</h3>
      <p className="text-sm text-gray-300 capitalize">{system.status}</p>
      <p className="text-xs text-blue-300">{system.systemType}</p>
    </div>
  )
}

/**
 * Detailed system panel for selected state
 */
function SelectedSystemPanel({ 
  system, 
  onClose 
}: { 
  system: StarmapSystem; 
  onClose: () => void 
}) {
  return (
    <div>
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-bold text-green-400">{system.name}</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Status:</span>
          <span className="ml-2 capitalize text-white">{system.status}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Type:</span>
          <span className="ml-2 text-blue-400">{system.systemType}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Security:</span>
          <span className="ml-2 text-yellow-400 capitalize">{system.securityLevel}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Population:</span>
          <span className="ml-2 text-white">{system.population.toLocaleString()}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Position:</span>
          <span className="ml-2 text-white font-mono text-xs">
            {Array.isArray(system.position) 
              ? `(${system.position.map(n => n.toFixed(1)).join(', ')})`
              : `(${system.position.x.toFixed(1)}, ${system.position.y.toFixed(1)}, ${system.position.z.toFixed(1)})`
            }
          </span>
        </div>
        
        {system.hexPosition && (
          <div>
            <span className="text-gray-400">Hex:</span>
            <span className="ml-2 text-blue-300 font-mono text-xs">
              ({system.hexPosition.q}, {system.hexPosition.r})
            </span>
          </div>
        )}
        
        {system.jumpPoints && system.jumpPoints.length > 0 && (
          <div>
            <span className="text-gray-400">Connections:</span>
            <span className="ml-2 text-white">{system.jumpPoints.length}</span>
          </div>
        )}
      </div>
    </div>
  )
} 