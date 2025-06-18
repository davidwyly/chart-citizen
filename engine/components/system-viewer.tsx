"use client"

import React, { useState, createContext, useContext, useMemo, useCallback, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Preload } from "@react-three/drei"
import { Suspense } from "react"
import type { ViewType } from '@lib/types/effects-level'
import * as THREE from "three"
import { UnifiedCameraController, type UnifiedCameraControllerRef } from "./system-viewer/unified-camera-controller"
import { SystemObjectsRenderer } from "./system-viewer/system-objects-renderer"
import { LoadingState, ErrorState } from "./system-viewer/loading-states"
import { StarfieldSkybox } from "./skybox/starfield-skybox"
import { useSystemData } from "./system-viewer/hooks/use-system-data"
import { useObjectSelection } from "./system-viewer/hooks/use-object-selection"
import { BackButton } from "./system-viewer/components/back-button"
import { SystemBreadcrumb } from "./system-viewer/system-breadcrumb"
import { Sidebar } from "./sidebar/sidebar"
import { ObjectDetailsPanel } from "./system-viewer/object-details-panel"
import { SceneLighting } from "./system-viewer/components/scene-lighting"
import { ZoomTracker } from "./system-viewer/components/zoom-tracker"
import { isPlanet } from "../types/orbital-system"

// Add JSX namespace declaration
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface SystemViewerProps {
  mode: string
  systemId: string
  onFocus?: (object: THREE.Object3D, name: string) => void
  onSystemChange?: (systemId: string) => void
}

// Create context for system viewer state
interface SystemViewerContextType {
  timeMultiplier: number
  isPaused: boolean
  viewType: ViewType
  currentZoom: number
  setTimeMultiplier: (multiplier: number) => void
  togglePause: () => void
  setViewType: (type: ViewType) => void
  setCurrentZoom: (zoom: number) => void
}

const SystemViewerContext = createContext<SystemViewerContextType | null>(null)

// Custom hook to use system viewer context
export function useSystemViewer() {
  const context = useContext(SystemViewerContext)
  if (!context) {
    throw new Error('useSystemViewer must be used within a SystemViewer')
  }
  return context
}

export function SystemViewer({ mode, systemId, onFocus, onSystemChange }: SystemViewerProps) {
  const [timeMultiplier, setTimeMultiplier] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  // Initialize viewType - app mode is separate from view mode
  // The "realistic" and "star-citizen" are app modes, not view modes
  // View modes are only: explorational, navigational, profile, scientific
  const [viewType, setViewTypeState] = useState<ViewType>("explorational")
  const [currentZoom, setCurrentZoom] = useState<number>(1)
  const cameraControllerRef = useRef<UnifiedCameraControllerRef>(null)
  const [isSystemSelected, setIsSystemSelected] = useState(false)
  const [cameraOrbitRadius, setCameraOrbitRadius] = useState<number>(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Handle time multiplier change
  const handleTimeMultiplierChange = useCallback((multiplier: number) => {
    setTimeMultiplier(multiplier)
  }, [])

  // Handle pause toggle
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  // Explicit pause and unpause functions for object selection
  const pauseSimulation = useCallback(() => {
    setIsPaused(true)
  }, [])

  const unpauseSimulation = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Load system data
  const { systemData, loading, error, loadingProgress, availableSystems } = useSystemData(mode, systemId)

  // Create ref for object map
  const objectRefsMap = useRef<Map<string, THREE.Object3D>>(new Map())

  // Handle object selection and focus
  const {
    selectedObjectId,
    selectedObjectData,
    hoveredObjectId,
    focusedObject,
    focusedName,
    focusedObjectSize,
    focusedObjectRadius,
    handleObjectFocus,
    handleObjectSelect,
    handleObjectHover,
    handleCanvasClick,
    handleStopFollowing,
    handleBackButtonClick,
    handleAnimationComplete,
  } = useObjectSelection(systemData, viewType, setTimeMultiplier, pauseSimulation, unpauseSimulation, isPaused)


  // Get focused object properties for unified camera controller
  const focusedObjectProperties = useMemo(() => {
    if (!selectedObjectData || !focusedName) return null
    
    // Extract mass and orbit radius from selected object data
    const mass = selectedObjectData.mass || (focusedName.toLowerCase().includes('star') ? 100 : focusedName.toLowerCase().includes('jupiter') || focusedName.toLowerCase().includes('saturn') || focusedName.toLowerCase().includes('uranus') || focusedName.toLowerCase().includes('neptune') ? 15 : 1)
    const orbitRadius = selectedObjectData.orbit?.semi_major_axis || 0
    
    return {
      mass,
      orbitRadius
    }
  }, [selectedObjectData, focusedName])

  // Memoize camera configuration
  const cameraConfig = useMemo(() => ({
    position: [0, 5, 15] as [number, number, number],
    fov: 60,
    near: 0.1,
    far: 100000,
  }), [])

  // Enhanced object focus handler that calls parent onFocus
  const enhancedObjectFocus = useCallback((
    object: THREE.Object3D, 
    name: string, 
    visualSize?: number, 
    radius?: number,
    mass?: number,
    orbitRadius?: number
  ) => {
    handleObjectFocus(object, name, visualSize, radius, mass, orbitRadius)
    if (onFocus) {
      onFocus(object, name)
    }
  }, [handleObjectFocus, onFocus])

  // Handle view type change with focus preservation
  const setViewType = useCallback((newViewType: ViewType) => {
    setViewTypeState(newViewType)
    
    // If we have a focused object, re-focus on it after a brief delay to allow the view to update
    if (focusedObject && focusedName) {
      setTimeout(() => {
        // Re-trigger the focus with the current object
        enhancedObjectFocus(
          focusedObject, 
          focusedName, 
          focusedObjectSize || undefined, 
          focusedObjectRadius || undefined,
          focusedObjectProperties?.mass,
          focusedObjectProperties?.orbitRadius
        )
      }, 100) // Small delay to ensure view mode has updated
    }
  }, [focusedObject, focusedName, focusedObjectSize, focusedObjectRadius, focusedObjectProperties, enhancedObjectFocus])

  // Determine if we should show the back button
  const showBackButton = useMemo(() => 
    viewType === "profile" && systemData?.objects?.some((obj) => isPlanet(obj) && obj.id === selectedObjectId),
    [viewType, systemData, selectedObjectId]
  )

  // Create context value
  const contextValue = useMemo(() => ({
    timeMultiplier,
    isPaused,
    viewType,
    currentZoom,
    setTimeMultiplier,
    togglePause,
    setViewType,
    setCurrentZoom
  }), [timeMultiplier, isPaused, viewType, currentZoom, setTimeMultiplier, togglePause, setViewType, setCurrentZoom])

  // Memoize callbacks
  const handleObjectHoverCallback = useCallback((objectId: string | null) => 
    handleObjectHover(objectId || ""),
    [handleObjectHover]
  )

  // Register or deregister object refs in the shared map
  const registerRefCallback = useCallback((id: string, ref: THREE.Object3D | null) => {
    if (ref) {
      objectRefsMap.current.set(id, ref)
    } else {
      objectRefsMap.current.delete(id)
    }
  }, [])

  // Memoize OrbitControls props
  const orbitControlsProps = useMemo(() => ({
    makeDefault: true,
    enablePan: true,
    maxDistance: 1000,
    minDistance: 0.1,
    enableDamping: true,
    dampingFactor: 0.05,
    rotateSpeed: 0.5,
    zoomSpeed: 0.8,
  }), [])

  // Memoize SystemObjectsRenderer props
  const systemObjectsProps = useMemo(() => {
    if (!systemData) return null

    return {
      systemData,
      viewType,
      selectedObjectId,
      timeMultiplier,
      isPaused,
    }
  }, [
    systemData,
    viewType,
    selectedObjectId,
    timeMultiplier,
    isPaused
  ])

  // Handle system name click in breadcrumb - show birds-eye view and select system
  const handleSystemNameClick = useCallback(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setBirdsEyeView()
      // Get the orbit radius after setting birds-eye view
      setTimeout(() => {
        if (cameraControllerRef.current) {
          const orbitRadius = cameraControllerRef.current.getCurrentOrbitRadius()
          setCameraOrbitRadius(orbitRadius)
        }
      }, 100) // Small delay to ensure the calculation is complete
    }
    // Set system as selected and clear individual object selection
    setIsSystemSelected(true)
    // Clear any focused objects by calling the stop following handler
    handleStopFollowing()
  }, [handleStopFollowing])

  // Create a wrapper for object selection that clears system selection
  const wrappedHandleObjectSelect = useCallback((objectId: string, object: THREE.Object3D, name: string) => {
    setIsSystemSelected(false) // Clear system selection when selecting an object
    
    // Get the current camera orbit radius when an object is selected
    if (cameraControllerRef.current) {
      setCameraOrbitRadius(cameraControllerRef.current.getCurrentOrbitRadius())
    }

    handleObjectSelect(objectId, object, name) // Call the original handler
  }, [handleObjectSelect, setCameraOrbitRadius])

  // Handle system change
  const handleSystemChange = useCallback((newSystemId: string) => {
    if (!newSystemId || typeof newSystemId !== "string") {
      console.error("Invalid system ID:", newSystemId)
      return
    }

    if (onSystemChange) {
      onSystemChange(newSystemId)
    }
    // Reset to bookmark view when changing systems
    if (cameraControllerRef.current) {
      cameraControllerRef.current.resetToBookmarkView()
    }
  }, [onSystemChange])

  if (loading) {
    return <LoadingState systemId={systemId} loadingProgress={loadingProgress} />
  }

  if (error && !systemData) {
    return <ErrorState error={error} availableSystems={availableSystems} mode={mode} />
  }

  if (!systemData) {
    return <LoadingState systemId={systemId} loadingProgress="Initializing..." />
  }

  return (
    <SystemViewerContext.Provider value={contextValue}>
      <div className="relative w-full h-full">
        {/* System Breadcrumb */}
        <SystemBreadcrumb
          systemData={systemData}
          objectRefsMap={objectRefsMap}
          onObjectFocus={enhancedObjectFocus}
          onObjectSelect={wrappedHandleObjectSelect}
          focusedName={focusedName || ""}
          onBackToStarmap={() => {
            // For modes that need to navigate back to starmap, we'll signal the parent
            // Let the parent handle how to navigate back (could be null system selection)
            if (window.history.length > 1) {
              window.history.back()
            }
          }}
          onSystemNameClick={handleSystemNameClick}
        />

        {/* Object Details Panel */}
        <ObjectDetailsPanel
          systemData={systemData}
          focusedName={focusedName || ""}
          focusedObjectSize={focusedObjectSize}
          isSystemSelected={isSystemSelected}
          cameraOrbitRadius={cameraOrbitRadius}
          selectedObjectId={selectedObjectId}
          selectedObjectData={selectedObjectData}
        />

        {/* Canvas */}
        <Canvas
          shadows
          camera={{ position: [0, 50, 100], fov: 45, near: 0.1, far: 5000 }}
          onPointerMissed={handleCanvasClick}
        >
          <Suspense fallback={null}>
            {/* Zoom tracker */}
            <ZoomTracker onZoomChange={setCurrentZoom} />

            {/* Unified Camera Controller - handles all view modes */}
            <UnifiedCameraController 
              ref={cameraControllerRef}
              focusObject={focusedObject} 
              focusName={focusedName} 
              focusRadius={focusedObjectRadius || undefined}
              focusSize={focusedObjectSize || undefined}
              focusMass={focusedObjectProperties?.mass}
              focusOrbitRadius={focusedObjectProperties?.orbitRadius}
              viewMode={viewType}
              onAnimationComplete={handleAnimationComplete}
            />

            {/* OrbitControls with improved settings */}
            <OrbitControls {...orbitControlsProps} />

            {/* System objects */}
            {systemObjectsProps && (
              <SystemObjectsRenderer
                {...systemObjectsProps}
                objectRefsMap={objectRefsMap}
                onObjectHover={handleObjectHoverCallback}
                onObjectSelect={wrappedHandleObjectSelect}
                onObjectFocus={enhancedObjectFocus}
                registerRef={registerRefCallback}
              />
            )}

            {/* Scene lighting */}
            <SceneLighting systemData={systemData} viewType={viewType} />

            {/* Starfield skybox */}
            <StarfieldSkybox />

            <Preload all />
          </Suspense>
        </Canvas>

        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Back button for game mode */}
          {showBackButton && (
            <BackButton onClick={handleBackButtonClick} />
          )}

          {/* Sidebar */}
          <div className="pointer-events-auto">
            <Sidebar
              onViewTypeChange={setViewType}
              onTimeMultiplierChange={handleTimeMultiplierChange}
              onPauseToggle={togglePause}
              currentViewType={viewType}
              currentTimeMultiplier={timeMultiplier}
              isPaused={isPaused}
              currentZoom={currentZoom}
              systemData={systemData}
              availableSystems={availableSystems}
              currentSystem={systemId}
              onSystemChange={onSystemChange || (() => {})}
              focusedName={focusedName || ""}
              focusedObjectSize={focusedObjectSize}
              onStopFollowing={handleStopFollowing}
              error={error}
              loadingProgress={loadingProgress}
              mode={mode as "realistic" | "star-citizen"}
            />
          </div>
        </div>
      </div>
    </SystemViewerContext.Provider>
  )
}
