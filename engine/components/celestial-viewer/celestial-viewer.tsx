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
import { useRouter, useSearchParams } from 'next/navigation'

interface CelestialViewerProps {
  initialObjectType?: string
}

export function CelestialViewer({ initialObjectType }: CelestialViewerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialObject = searchParams.get('object') || initialObjectType || 'g2v-main-sequence'

  const [selectedObjectId, setSelectedObjectId] = useState<string>(initialObject)
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
    lensingStrength: 0.66,
    diskBrightness: 1.0
  })
  
  // Habitability parameters for habitable planets
  const [habitabilityParams, setHabitabilityParams] = useState({
    humidity: 70,
    temperature: 60,
    population: 80,
    volcanism: 0,
    rotationSpeed: 0.2,
    showTopographicLines: false,
  })

  // Load catalog object data
  useEffect(() => {
    console.time('loadObjectTimer');  // Start timing
    const loadObject = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        if (selectedObjectId === 'black-hole' || selectedObjectId === 'protostar') {
          // Special objects don't need catalog data
          setCatalogObject(null)
        } else {
          try {
            const data = await engineSystemLoader.getCatalogObject(selectedObjectId)
            if (data) {
              setCatalogObject(data)
            } else {
              // Handle null (object not found)
              setLoadError(`Object "${selectedObjectId}" not found`)
              // Fallback to default
              if (selectedObjectId !== 'g2v-main-sequence') {
                console.log(`Falling back to default object 'g2v-main-sequence'`)
                setSelectedObjectId('g2v-main-sequence')
                return
              }
            }
          } catch (error) {
            console.error(`Failed to load catalog object: ${selectedObjectId}`, error)
            setLoadError(`Object "${selectedObjectId}" not found`)
            setCatalogObject(null)
            
            // Fallback to a default object if the requested one doesn't exist
            if (selectedObjectId !== 'g2v-main-sequence') {
              console.log(`Falling back to default object 'g2v-main-sequence'`)
              setSelectedObjectId('g2v-main-sequence')
              return // This will trigger the effect again with the fallback
            }
          }
        }
      } finally {
        setIsLoading(false)
        console.timeEnd('loadObjectTimer')  // End timing
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
    router.push(`?object=${objectId}`)
  }

  const handleShaderParamChange = (param: string, value: number) => {
    setShaderParams(prev => ({ ...prev, [param]: value }))
  }

  const handleHabitabilityParamChange = (param: string, value: number) => {
    // Handle boolean values for showTopographicLines
    const finalValue = param === 'showTopographicLines' ? value > 0 : value
    setHabitabilityParams(prev => ({ ...prev, [param]: finalValue }))
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
            
            {/* Scene lighting - minimal ambient only for non-shader objects */}
            <ambientLight intensity={0.1} />
            
            {/* Simulated star for lighting visualization */}
            <mesh position={[10, 5, 10]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial color="#ffff88" />
            </mesh>
            <pointLight position={[10, 5, 10]} intensity={0.5} color="#ffff88" />
            
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
                    effectScale={shaderScale}
                    density={shaderParams.intensity}
                    starBrightness={shaderParams.distortion}
                    starHue={shaderParams.diskSpeed}
                    nebulaHue={shaderParams.lensingStrength}
                    rotationSpeed={shaderParams.speed}
                    spin={0}
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
                      shader: shaderParams,
                      habitability: habitabilityParams
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
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-900/90 border border-red-700 text-red-200 px-4 py-2 rounded-md z-10 shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium">{loadError}</p>
                <p className="text-xs text-red-300 mt-1">Showing default G2V star instead</p>
              </div>
              <button 
                onClick={() => setLoadError(null)}
                className="ml-2 text-red-400 hover:text-red-300 p-1"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
            habitabilityParams={habitabilityParams}
            onObjectScaleChange={setObjectScale}
            onShaderScaleChange={setShaderScale}
            onShaderParamChange={handleShaderParamChange}
            onHabitabilityParamChange={handleHabitabilityParamChange}
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