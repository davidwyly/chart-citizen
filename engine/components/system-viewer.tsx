"use client"

import React, { useState, createContext, useContext, useMemo, useCallback, useRef, useEffect } from "react"
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
import { useOrbitalMechanicsWithDefault } from "./system-viewer/hooks/use-orbital-mechanics"

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
  const [timeMultiplier, setTimeMultiplier] = useState(0.1)
  const [isPaused, setIsPaused] = useState(false)
  const [autoAdjustTime, setAutoAdjustTime] = useState(true)
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
  
  // Handle auto-adjust toggle
  const handleAutoAdjustToggle = useCallback((enabled: boolean) => {
    setAutoAdjustTime(enabled)
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

  // Handle profile view time controls
  useEffect(() => {
    if (viewType === 'profile') {
      pauseSimulation()
    }
  }, [viewType, pauseSimulation])

  // Load system data
  const { systemData, loading, error, loadingProgress, availableSystems } = useSystemData(mode, systemId)

  // Create ref for object map
  const objectRefsMap = useRef<Map<string, THREE.Object3D>>(new Map())

  // Calculate orbital mechanics for object sizing (same as SystemObjectsRenderer)
  // Calculate orbital mechanics using async-aware hook
  const orbitalMechanics = useOrbitalMechanicsWithDefault(
    systemData?.objects || [], 
    viewType
  );

  // Get object sizing function (same as SystemObjectsRenderer)
  const getObjectSizing = useCallback((objectId: string) => {
    const mechanicsData = orbitalMechanics.get(objectId);
    const visualSize = mechanicsData?.visualRadius || 1.0;
    
    return {
      visualSize: visualSize,
    }
  }, [orbitalMechanics])

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

  // ⚠️ CRITICAL: Calculate the correct focus size for the current view mode
  // This ensures camera framing consistency when switching view modes
  // Without this, the camera would use the old visual size from the previous view mode
  const currentViewModeFocusSize = useMemo(() => {
    if (!selectedObjectId || !focusedObject) return focusedObjectSize || undefined
    
    // Get the visual size for the current view mode
    const currentVisualSize = getObjectSizing(selectedObjectId).visualSize
    
    return currentVisualSize
  }, [selectedObjectId, focusedObject, viewType, getObjectSizing, focusedObjectSize])

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

  // ⚠️ CRITICAL: Handle view type change with focus preservation
  // This function is intentionally simple - the complex logic is handled by currentViewModeFocusSize
  const setViewType = useCallback((newViewType: ViewType) => {
    console.log('🔄 VIEW TYPE CHANGE REQUESTED')
    console.log('  📱 Previous view type:', viewType)
    console.log('  📱 New view type:', newViewType)
    console.log('  📍 Currently focused object:', focusedName || 'none')
    
    setViewTypeState(newViewType)
    // The currentViewModeFocusSize memoized value will automatically update
    // and trigger the camera controller to use the correct visual size
    // DO NOT add setTimeout or manual focus logic here - it causes race conditions
  }, [setViewTypeState, viewType, focusedName])

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

  // Dynamic camera settings based on actual system data
  const { cameraSettings, orbitControlsProps } = useMemo(() => {
    // Only calculate camera settings when system data is available
    if (!systemData?.objects?.length) {
      // Return default settings during loading
      return {
        cameraSettings: {
          position: [0, 50, 100] as [number, number, number],
          fov: 45,
          near: 0.1,
          far: 10000
        },
        orbitControlsProps: {
          makeDefault: true,
          enablePan: true,
          enableRotate: true,
          enableZoom: true,
          maxDistance: 1000,
          minDistance: 1,
          enableDamping: true,
          dampingFactor: 0.05,
          rotateSpeed: 0.5,
          zoomSpeed: 0.8,
        }
      }
    }
    
    // Import dynamic camera calculator
    const { calculateDynamicCameraSettings } = require('@/engine/utils/dynamic-camera-calculator');
    
    const dynamicSettings = calculateDynamicCameraSettings(systemData.objects, viewType)
    
    // Debug output for scientific mode
    if (viewType === 'scientific' && dynamicSettings._metadata) {
      console.log('🔬 Scientific Mode Dynamic Camera Settings:', {
        visualRange: `${dynamicSettings._metadata.minVisualSize.toExponential(2)} → ${dynamicSettings._metadata.maxVisualSize.toExponential(2)}`,
        cameraRange: `${dynamicSettings._metadata.minCameraDistance.toExponential(2)} → ${dynamicSettings._metadata.maxCameraDistance.toExponential(2)}`,
        settings: {
          near: dynamicSettings.nearPlane.toExponential(3),
          far: dynamicSettings.farPlane.toFixed(1),
          minDist: dynamicSettings.absoluteMinDistance.toExponential(3),
          maxDist: dynamicSettings.absoluteMaxDistance.toFixed(1)
        }
      })
    }
    
    const cameraSettings = {
      position: [0, 50, 100] as [number, number, number],
      fov: 45,
      near: dynamicSettings.nearPlane,
      far: dynamicSettings.farPlane
    }
    
    const orbitControlsProps = {
      makeDefault: true,
      enablePan: viewType !== 'profile',
      enableRotate: viewType !== 'profile',
      enableZoom: viewType !== 'profile',
      maxDistance: dynamicSettings.absoluteMaxDistance,
      minDistance: dynamicSettings.absoluteMinDistance,
      enableDamping: true,
      dampingFactor: 0.05,
      rotateSpeed: 0.5,
      zoomSpeed: 0.8,
    }
    
    return { cameraSettings, orbitControlsProps }
  }, [viewType, systemData])

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
          onNavigateBack={() => {
            // Generic navigation back - let the browser handle it
            if (window.history.length > 1) {
              window.history.back()
            }
          }}
          onSystemNameClick={handleSystemNameClick}
          getObjectSizing={getObjectSizing}
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
          camera={cameraSettings}
          onPointerMissed={handleCanvasClick}
        >
          <Suspense fallback={null}>
            {/* Zoom tracker */}
            <ZoomTracker onZoomChange={setCurrentZoom} />

            {/* Unified Camera Controller - handles all view modes */}
            {/* ⚠️ CRITICAL: Use currentViewModeFocusSize instead of focusedObjectSize
                This ensures camera framing consistency across view mode switches */}
            <UnifiedCameraController 
              ref={cameraControllerRef}
              focusObject={focusedObject} 
              focusName={focusedName} 
              focusRadius={focusedObjectRadius || undefined}
              focusSize={currentViewModeFocusSize}
              focusMass={focusedObjectProperties?.mass}
              focusOrbitRadius={focusedObjectProperties?.orbitRadius}
              viewMode={viewType}
              isPaused={isPaused}
              systemData={systemData}
              objectRefsMap={objectRefsMap}
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

            {/* Starfield skybox with nebula effects */}
            <StarfieldSkybox nebulaIntensity={0.6} nebulaParallax={0.8} />

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
              selectedObjectData={selectedObjectData}
              onStopFollowing={handleStopFollowing}
              error={error}
              loadingProgress={loadingProgress}
              mode={mode as "realistic" | "star-citizen"}
              autoAdjustTime={autoAdjustTime}
              onAutoAdjustToggle={handleAutoAdjustToggle}
            />
          </div>
        </div>
      </div>
    </SystemViewerContext.Provider>
  )
}
