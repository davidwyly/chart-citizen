"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CatalogObjectWrapper } from '../system-viewer/catalog-object-wrapper'
import { BlackHole } from '../3d-ui/black-hole'
import { Protostar } from '../3d-ui/protostar'
import { StarfieldSkybox } from '../skybox/starfield-skybox'
import { ObjectControls } from './object-controls'
import { ObjectInfo } from './object-info'
import { ObjectCatalog } from './object-catalog'
import { engineSystemLoader, type CatalogObject } from '@/engine/system-loader'

interface CelestialViewerProps {
  initialObjectType?: string
}

export function CelestialViewer({ initialObjectType }: CelestialViewerProps) {
  const [selectedObjectId, setSelectedObjectId] = useState<string>(initialObjectType || 'g2v-main-sequence')
  const [catalogObject, setCatalogObject] = useState<CatalogObject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  // Panel sizing
  const [leftPanelWidth, setLeftPanelWidth] = useState(320) // 20% of 1600px
  const [rightPanelWidth, setRightPanelWidth] = useState(320) // 20% of 1600px
  const [rightControlsHeight, setRightControlsHeight] = useState(70) // 70% of right panel
  
  // Dragging state
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const [isDraggingVertical, setIsDraggingVertical] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Shader parameters
  const [objectScale, setObjectScale] = useState(1.0)
  const [shaderScale, setShaderScale] = useState(1.0)
  const [shaderParams, setShaderParams] = useState({
    intensity: 1.0,
    speed: 1.0,
    distortion: 1.0,
    diskSpeed: 1.0,
    lensingStrength: 1.0,
    diskBrightness: 1.0
  })

  // Load catalog object data
  useEffect(() => {
    const loadObject = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        if (selectedObjectId === 'black-hole' || selectedObjectId === 'protostar') {
          // Special objects don't need catalog data
          setCatalogObject(null)
        } else {
          const data = await engineSystemLoader.getCatalogObject(selectedObjectId)
          setCatalogObject(data)
        }
      } catch (error) {
        console.error(`Failed to load catalog object: ${selectedObjectId}`, error)
        setLoadError(`Object "${selectedObjectId}" not found`)
        setCatalogObject(null)
        // Fallback to a default object if the requested one doesn't exist
        if (selectedObjectId !== 'g2v-main-sequence') {
          setSelectedObjectId('g2v-main-sequence')
          return // This will trigger the effect again with the fallback
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadObject()
  }, [selectedObjectId])

  // Mouse event handlers for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    
    if (isDraggingLeft) {
      const newWidth = Math.max(200, Math.min(600, e.clientX - containerRect.left))
      setLeftPanelWidth(newWidth)
    }
    
    if (isDraggingRight) {
      const newWidth = Math.max(200, Math.min(600, containerRect.right - e.clientX))
      setRightPanelWidth(newWidth)
    }
    
    if (isDraggingVertical && containerRef.current) {
      const rightPanel = containerRef.current.querySelector('.right-panel') as HTMLElement
      if (rightPanel) {
        const rightPanelRect = rightPanel.getBoundingClientRect()
        const relativeY = e.clientY - rightPanelRect.top
        const newHeight = Math.max(30, Math.min(90, (relativeY / rightPanelRect.height) * 100))
        setRightControlsHeight(newHeight)
      }
    }
  }, [isDraggingLeft, isDraggingRight, isDraggingVertical])

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false)
    setIsDraggingRight(false)
    setIsDraggingVertical(false)
  }, [])

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight || isDraggingVertical) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = isDraggingVertical ? 'ns-resize' : 'ew-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDraggingLeft, isDraggingRight, isDraggingVertical, handleMouseMove, handleMouseUp])

  const handleObjectSelect = (objectId: string) => {
    setSelectedObjectId(objectId)
  }

  const handleShaderParamChange = (param: string, value: number) => {
    setShaderParams(prev => ({ ...prev, [param]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-black text-white items-center justify-center">
        <p className="text-gray-400">Loading celestial objects...</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="flex h-screen w-full bg-black text-white overflow-hidden"
    >
      {/* Left Panel - Object Catalog */}
      <div 
        className="flex-shrink-0 bg-gray-900 border-r border-gray-700"
        style={{ width: leftPanelWidth }}
      >
        <ObjectCatalog
          selectedObjectId={selectedObjectId}
          onObjectSelect={handleObjectSelect}
        />
      </div>

      {/* Left Resize Handle */}
      <div
        className="w-1 bg-gray-700 hover:bg-blue-500 cursor-ew-resize transition-colors"
        onMouseDown={() => setIsDraggingLeft(true)}
      />

      {/* Center Panel - 3D Scene */}
      <div 
        className="flex-1 relative bg-black"
        style={{ 
          width: `calc(100% - ${leftPanelWidth + rightPanelWidth + 8}px)`
        }}
      >
        <Canvas
          camera={{
            position: [0, 5, 15],
            fov: 60,
            near: 0.1,
            far: 100000,
          }}
          gl={{ powerPreference: "high-performance", antialias: true }}
          onCreated={({ gl }) => {
            gl.debug.checkShaderErrors = true
          }}
        >
          <Suspense fallback={null}>
            {/* Starfield background */}
            <StarfieldSkybox />
            
            {/* Scene lighting */}
            <ambientLight intensity={0.05} />
            <directionalLight position={[10, 10, 10]} intensity={1.2} />
            <pointLight position={[0, 0, 20]} intensity={0.3} color="#ffffff" />
            
            {/* Orbit controls */}
            <OrbitControls
              makeDefault
              enablePan={true}
              maxDistance={1000}
              minDistance={0.1}
              enableDamping={true}
              dampingFactor={0.05}
              rotateSpeed={0.5}
              zoomSpeed={0.8}
            />

            {/* Selected object */}
            {(() => {
              if (selectedObjectId === 'black-hole') {
                return (
                  <BlackHole
                    scale={objectScale}
                    shaderScale={shaderScale}
                    customizations={{
                      shader: shaderParams
                    }}
                  />
                )
              } else if (selectedObjectId === 'protostar') {
                return (
                  <Protostar
                    scale={objectScale}
                    shaderScale={shaderScale}
                    customizations={{
                      shader: shaderParams
                    }}
                  />
                )
              } else if (catalogObject) {
                return (
                  <CatalogObjectWrapper
                    objectId={selectedObjectId}
                    catalogRef={selectedObjectId}
                    position={[0, 0, 0]}
                    scale={objectScale}
                    shaderScale={shaderScale}
                    customizations={{
                      shader: shaderParams
                    }}
                  />
                )
              } else {
                return null
              }
            })()}

            {/* Post-processing */}
            <EffectComposer>
              <Bloom intensity={0.5} luminanceThreshold={0.1} />
            </EffectComposer>

            <Preload all />
          </Suspense>
        </Canvas>

        {/* Stats toggle button */}
        <button
          className="absolute bottom-4 left-4 px-3 py-1 bg-gray-800 text-gray-200 text-xs rounded-md z-10 hover:bg-gray-700 transition-colors"
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? "Hide Stats" : "Show Stats"}
        </button>

        {/* Error notification */}
        {loadError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-900/90 border border-red-700 text-red-200 px-4 py-2 rounded-md z-10">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{loadError}. Showing default object instead.</span>
              <button 
                onClick={() => setLoadError(null)}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Resize Handle */}
      <div
        className="w-1 bg-gray-700 hover:bg-blue-500 cursor-ew-resize transition-colors"
        onMouseDown={() => setIsDraggingRight(true)}
      />

      {/* Right Panel - Controls and Info */}
      <div 
        className="right-panel flex-shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col"
        style={{ width: rightPanelWidth }}
      >
        {/* Object Controls - Top Section */}
        <div 
          className="overflow-hidden"
          style={{ height: `${rightControlsHeight}%` }}
        >
          <ObjectControls
            selectedObjectId={selectedObjectId}
            objectScale={objectScale}
            shaderScale={shaderScale}
            shaderParams={shaderParams}
            onObjectScaleChange={setObjectScale}
            onShaderScaleChange={setShaderScale}
            onShaderParamChange={handleShaderParamChange}
          />
        </div>
        
        {/* Vertical Resize Handle */}
        <div
          className="h-1 bg-gray-700 hover:bg-blue-500 cursor-ns-resize transition-colors"
          onMouseDown={() => setIsDraggingVertical(true)}
        />
        
        {/* Object Info - Bottom Section */}
        <div 
          className="overflow-hidden"
          style={{ height: `${100 - rightControlsHeight}%` }}
        >
          <ObjectInfo
            selectedObjectId={selectedObjectId}
            catalogObject={catalogObject}
          />
        </div>
      </div>
    </div>
  )
} 