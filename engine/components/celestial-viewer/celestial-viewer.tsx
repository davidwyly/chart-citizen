"use client"

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload } from '@react-three/drei'
// Post-processing effects removed for build compatibility
import * as THREE from 'three'

import { StarfieldSkybox } from '../skybox/starfield-skybox'
import { ObjectControls } from './object-controls'
import { ObjectInfo } from './object-info'
import { ObjectCatalog } from './object-catalog'
import { engineSystemLoader } from '@/engine/system-loader'
import { CelestialObject } from '@/engine/types/orbital-system'
import { useRouter, useSearchParams } from 'next/navigation'
import { CelestialObjectRenderer } from '../system-viewer/system-objects-renderer'

// Add function to create celestial object data for catalog objects
function createCatalogCelestialObject(objectId: string): CelestialObject | null {
  const catalogObjects: Record<string, CelestialObject> = {
    // Stars
    'g2v-main-sequence': {
      id: 'g2v-main-sequence',
      name: 'G2V Main Sequence Star',
      classification: 'star',
      geometry_type: 'star',
      properties: {
        mass: 1.0,
        radius: 695700,
        temperature: 5778,
        luminosity: 100,
        stellar_class: 'G2V',
        color_temperature: 5778,
        solar_activity: 30,
        corona_thickness: 25,
        variability: 5
      }
    },
    'm2v-red-dwarf': {
      id: 'm2v-red-dwarf',
      name: 'M2V Red Dwarf',
      classification: 'star',
      geometry_type: 'star',
      properties: {
        mass: 0.4,
        radius: 278280,
        temperature: 3500,
        luminosity: 4,
        stellar_class: 'M2V',
        color_temperature: 3500,
        solar_activity: 60,
        corona_thickness: 10,
        variability: 15
      }
    },
    'protostar': {
      id: 'protostar',
      name: 'Protostar',
      classification: 'star',
      geometry_type: 'star',
      properties: {
        mass: 0.8,
        radius: 1391400, // Larger than main sequence
        temperature: 3000,
        luminosity: 10,
        stellar_class: 'T Tauri',
        color_temperature: 3000,
        solar_activity: 80,
        corona_thickness: 40,
        variability: 25,
        nebula_density: 0.8,
        accretion_rate: 0.5
      }
    },
    
    // Terrestrial Planets
    'terrestrial-rocky': {
      id: 'terrestrial-rocky',
      name: 'Terrestrial Rocky Planet',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 0.8,
        radius: 5500,
        temperature: 280,
        atmosphere: 15,
        water: 5,
        tectonics: 60,
        population: 0,
        soil_tint: 30,        // Rocky brown soil
        temperature_class: 55, // Moderate temperature
        geomagnetism: 40,     // Weak magnetic field
        flora: 5              // Minimal vegetation
      }
    },
    'terrestrial-oceanic': {
      id: 'terrestrial-oceanic',
      name: 'Oceanic Planet',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 1.2,
        radius: 6800,
        temperature: 290,
        atmosphere: 80,
        water: 95,
        tectonics: 30,
        population: 0,
        soil_tint: 65,        // Dark oceanic sediment
        temperature_class: 60, // Temperate
        geomagnetism: 70,     // Strong magnetic field
        flora: 40             // Aquatic flora
      }
    },
    'smog-planet': {
      id: 'smog-planet',
      name: 'Smog Planet',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 0.9,
        radius: 6000,
        temperature: 450,
        atmosphere: 95,
        water: 0,
        tectonics: 80,
        population: 0,
        soil_tint: 15,        // Polluted grey soil
        temperature_class: 85, // Hot
        geomagnetism: 20,     // Very weak magnetic field
        flora: 0              // No vegetation
      }
    },
    
    // Habitable Planets
    'earth-like': {
      id: 'earth-like',
      name: 'Earth-like World',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 1.0,
        radius: 6371,
        temperature: 288,
        atmosphere: 70,
        water: 70,
        tectonics: 50,
        population: 80,
        soil_tint: 45,        // Earth-like brown soil
        temperature_class: 60, // Temperate zone
        geomagnetism: 75,     // Strong protective magnetic field
        flora: 80             // Rich vegetation
      }
    },
    'desert-world': {
      id: 'desert-world',
      name: 'Desert World',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 0.9,
        radius: 6000,
        temperature: 310,
        atmosphere: 30,
        water: 10,
        tectonics: 40,
        population: 20,
        soil_tint: 25,        // Sandy desert soil
        temperature_class: 75, // Hot but livable
        geomagnetism: 50,     // Moderate magnetic field
        flora: 15             // Desert vegetation
      }
    },
    'ocean-world-habitable': {
      id: 'ocean-world-habitable',
      name: 'Ocean World',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 1.1,
        radius: 6500,
        temperature: 285,
        atmosphere: 85,
        water: 90,
        tectonics: 20,
        population: 60,
        soil_tint: 70,        // Dark oceanic sediment
        temperature_class: 58, // Temperate
        geomagnetism: 80,     // Very strong magnetic field
        flora: 70             // Rich aquatic flora
      }
    },
    'ice-world': {
      id: 'ice-world',
      name: 'Ice World',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 0.8,
        radius: 5800,
        temperature: 250,
        atmosphere: 40,
        water: 80,
        tectonics: 30,
        population: 15,
        soil_tint: 55,        // Frozen soil
        temperature_class: 25, // Cold/ice world
        geomagnetism: 60,     // Good magnetic field
        flora: 10             // Hardy cold-weather flora
      }
    },
    
         // Gas Giants
     'gas-giant': {
       id: 'gas-giant',
       name: 'Gas Giant',
       classification: 'planet',
       geometry_type: 'gas_giant',
       properties: {
         mass: 317.8,
         radius: 69911,
         temperature: 165,
         band_contrast: 80,
         storm_activity: 60,
         ring_density: 'moderate' as const,
         storm_intensity: 70,  // Great red spot activity
         cloud_opacity: 85,    // Thick atmosphere
         hue_shift: 30,        // Orange-brown tint
         rotation_speed: 90    // Fast rotation
       },
       rings: [
         {
           id: 'gas-giant-ring-1',
           geometry_type: 'ring',
           name: 'Main Ring',
           radius_start: 1.8,
           radius_end: 2.5,
           inclination: 0,
           density: 'moderate' as const,
           composition: ['ice', 'rock'],
           opacity: 60,
           color: '#c0c0c0'
         }
       ]
     },
     'gas-giant-ice': {
       id: 'gas-giant-ice',
       name: 'Ice Giant',
       classification: 'planet',
       geometry_type: 'gas_giant',
       properties: {
         mass: 17.1,
         radius: 24622,
         temperature: 76,
         band_contrast: 40,
         storm_activity: 30,
         ring_density: 'sparse' as const,
         storm_intensity: 25,  // Mild storm activity
         cloud_opacity: 70,    // Visible but less dense
         hue_shift: 70,        // Blue-green tint
         rotation_speed: 75    // Moderate rotation
       }
     },
     
     // Rocky Bodies (Moons/Asteroids)
     'rocky-moon': {
       id: 'rocky-moon',
       name: 'Rocky Moon',
       classification: 'moon',
       geometry_type: 'rocky',
       properties: {
         mass: 0.012,
         radius: 1737,
         temperature: 250,
         albedo: 12,
         surface_variance: 80,
         crater_density: 90,
         regolith_depth: 50,
         surface_color: '#888888',
         soil_tint: 40,          // Greyish lunar soil
         ice_coverage: 5,        // Minimal polar ice
         temperature_class: 45   // Cold but not extreme
       }
     },
     'asteroid': {
       id: 'asteroid',
       name: 'Large Asteroid',
       classification: 'belt',
       geometry_type: 'rocky',
       properties: {
         mass: 0.0001,
         radius: 500,
         temperature: 200,
         albedo: 8,
         surface_variance: 95,
         crater_density: 70,
         regolith_depth: 20,
         surface_color: '#666666',
         soil_tint: 25,          // Dark metallic surface
         ice_coverage: 0,        // No ice
         temperature_class: 30   // Very cold
       }
     },
     
     // Special Objects
     'black-hole': {
       id: 'black-hole',
       name: 'Black Hole',
       classification: 'compact-object',
       geometry_type: 'exotic',
       properties: {
         mass: 10.0, // Solar masses
         radius: 30, // Schwarzschild radius in km
         temperature: 0,
         accretion_disk: true,
         disk_temperature: 10000,
         tint: '#ff4500',
         intensity: 100,        // Maximum effect strength
         distortion: 66,        // Strong gravitational lensing
         disk_speed: 75,        // Rapid accretion disk rotation
         disk_brightness: 80    // Bright accretion disk
       }
     }
  }
  
  return catalogObjects[objectId] || null
}

interface CelestialViewerProps {
  initialObjectType?: string
  mode?: string
}

export function CelestialViewer({ initialObjectType, mode }: CelestialViewerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialObject = searchParams.get('object') || initialObjectType || 'sol-star'
  
  // Determine the current mode from props, URL, or default to realistic
  const currentMode = mode || searchParams.get('mode') || 'realistic'

  const [selectedObjectId, setSelectedObjectId] = useState<string>(initialObject)
  const [celestialObject, setCelestialObject] = useState<CelestialObject | null>(null)
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

  // Unified property overrides for geometry-specific controls
  const [objectPropertyOverrides, setObjectPropertyOverrides] = useState<Record<string, any>>({})

  // Custom shader state for live shader editor
  const [customShaders, setCustomShaders] = useState<{
    vertex: string | null
    fragment: string | null
  }>({ vertex: null, fragment: null })

  // Load celestial object data
  useEffect(() => {
    console.time('loadObjectTimer');  // Start timing
    const loadObject = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        // First try to create from catalog
        const catalogObject = createCatalogCelestialObject(selectedObjectId)
        if (catalogObject) {
          setCelestialObject(catalogObject)
          // Clear property overrides when changing objects
          setObjectPropertyOverrides({})
        } else {
          // Fallback to loading from system data
          const systemId = selectedObjectId.startsWith('sol-') ? 'sol' : 'sol'
          const systemData = await engineSystemLoader.loadSystem(currentMode, systemId)
          if (systemData) {
            const foundObject = systemData.objects.find(obj => obj.id === selectedObjectId)
            if (foundObject) {
              setCelestialObject(foundObject)
              // Clear property overrides when changing objects
              setObjectPropertyOverrides({})
            } else {
              setLoadError(`Object "${selectedObjectId}" not found`)
              // Fallback to default
              if (selectedObjectId !== 'g2v-main-sequence') {
                console.log(`Falling back to default object 'g2v-main-sequence'`)
                setSelectedObjectId('g2v-main-sequence')
                return
              }
            }
          } else {
            setLoadError(`Failed to load system data`)
          }
        }
      } catch (error) {
        console.error(`Failed to load celestial object: ${selectedObjectId}`, error)
        setLoadError(`Error loading object: ${selectedObjectId}`)
        setCelestialObject(null)
        
        // Fallback to a default object
        if (selectedObjectId !== 'g2v-main-sequence') {
          console.log(`Falling back to default object 'g2v-main-sequence'`)
          setSelectedObjectId('g2v-main-sequence')
          return
        }
      } finally {
        setIsLoading(false)
        console.timeEnd('loadObjectTimer')
      }
    }

    loadObject()
  }, [selectedObjectId, currentMode])

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

  const handlePropertyChange = (property: string, value: number) => {
    setObjectPropertyOverrides(prev => ({
      ...prev,
      [property]: value
    }))
  }

  const handleShaderUpdate = (vertexShader: string, fragmentShader: string) => {
    setCustomShaders({
      vertex: vertexShader,
      fragment: fragmentShader
    })
    console.log('Updated custom shaders:', { vertexShader, fragmentShader })
  }

  // Create effective properties by merging base properties with overrides
  const effectiveObject = celestialObject ? {
    ...celestialObject,
    properties: {
      ...celestialObject.properties,
      ...objectPropertyOverrides
    },
    // Add custom shaders if available
    customShaders: customShaders.vertex && customShaders.fragment ? customShaders : undefined
  } : null

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
            <StarfieldSkybox nebulaIntensity={0.4} nebulaParallax={0.8} />
            
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
            {effectiveObject ? (
              <CelestialObjectRenderer
                object={effectiveObject}
                scale={objectScale}
                starPosition={[10, 5, 10]} // Position of the simulated star light
                isSelected={true} // Show effects for the displayed object
                planetSystemSelected={false} // Not relevant in single object viewer
                shaderParams={shaderParams} // Pass shader parameters for effects
                onHover={() => {}} // No hover in this viewer
                onSelect={() => {}} // No select in this viewer
                onFocus={() => {}} // No focus in this viewer
                registerRef={() => {}} // No ref registration needed
              />
            ) : (
              // Fallback if no object is loaded
              <mesh>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="#666666" wireframe />
              </mesh>
            )}

            {/* Post-processing removed for build compatibility */}

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
            celestialObject={effectiveObject as any}
            objectScale={objectScale}
            shaderScale={shaderScale}
            shaderParams={shaderParams}
            habitabilityParams={habitabilityParams}
            onObjectScaleChange={setObjectScale}
            onShaderScaleChange={setShaderScale}
            onShaderParamChange={handleShaderParamChange}
            onHabitabilityParamChange={handleHabitabilityParamChange}
            onPropertyChange={handlePropertyChange}
            onShaderUpdate={handleShaderUpdate}
            objectType={celestialObject?.geometry_type || selectedObjectId}
            showStats={showStats}
            onToggleStats={() => setShowStats(prev => !prev)}
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
            celestialObject={effectiveObject as any}
            selectedObjectId={selectedObjectId}
          />
        </div>
      </div>
    </div>
  )
} 