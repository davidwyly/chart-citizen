"use client"

import { useState, createContext, useContext, useMemo, useCallback, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Preload } from "@react-three/drei"
import { Suspense } from "react"
import type { ViewType } from '@lib/types/effects-level'
import * as THREE from "three"
import { CameraController } from "./system-viewer/camera-controller"
import { SystemObjectsRenderer } from "./system-viewer/system-objects-renderer"
import { LoadingState, ErrorState } from "./system-viewer/loading-states"
import { calculateViewModeScaling } from "./system-viewer/view-mode-calculator"
import { StarfieldSkybox } from "./skybox/starfield-skybox"
import { useSystemData } from "./system-viewer/hooks/use-system-data"
import { useObjectSelection } from "./system-viewer/hooks/use-object-selection"
import { BackButton } from "./system-viewer/components/back-button"
import { SystemBreadcrumb } from "./system-viewer/system-breadcrumb"
import { Sidebar } from "./sidebar/sidebar"
import { SceneLighting } from "./system-viewer/components/scene-lighting"
import { ZoomTracker } from "./system-viewer/components/zoom-tracker"
import { ProfileCameraController } from "@/components/system-viewer/profile-camera-controller"
import { SystemNavigationBar } from "./system-viewer/system-navigation-bar"

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
  const [isPaused, setIsPaused] = useState(true)
  const [viewType, setViewType] = useState<ViewType>("realistic")
  const [currentZoom, setCurrentZoom] = useState<number>(1)
  const cameraControllerRef = useRef<{ resetToBookmarkView: () => void }>(null)

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
  } = useObjectSelection(systemData, viewType)

  // Calculate scaling based on view mode
  const scalingConfig = useMemo(() => 
    systemData ? calculateViewModeScaling(viewType) : null,
    [systemData, viewType]
  )

  // Memoize camera configuration
  const cameraConfig = useMemo(() => ({
    position: [0, 5, 15] as [number, number, number],
    fov: 60,
    near: 0.1,
    far: 100000,
  }), [])

  // Enhanced object focus handler that calls parent onFocus
  const enhancedObjectFocus = useCallback((object: THREE.Object3D, name: string, visualSize?: number, radius?: number) => {
    handleObjectFocus(object, name, visualSize, radius)
    if (onFocus) {
      onFocus(object, name)
    }
  }, [handleObjectFocus, onFocus])

  // Handle time multiplier change
  const handleTimeMultiplierChange = useCallback((multiplier: number) => {
    setTimeMultiplier(multiplier)
  }, [])

  // Handle pause toggle
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  // Determine if we should show the back button
  const showBackButton = useMemo(() => 
    viewType === "profile" && systemData?.planets?.some((p: { id: string }) => p.id === selectedObjectId),
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
  }), [timeMultiplier, isPaused, viewType, currentZoom])

  // Memoize callbacks
  const handleObjectHoverCallback = useCallback((objectId: string | null) => 
    handleObjectHover(objectId || ""),
    [handleObjectHover]
  )

  const registerRefCallback = useCallback((id: string, ref: THREE.Object3D) => 
    objectRefsMap.current.set(id, ref),
    []
  )

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
    if (!systemData || !scalingConfig) return null

    return {
      systemData,
      viewType,
      selectedObjectId,
      timeMultiplier,
      isPaused,
      SYSTEM_SCALE: 1.0,
      STAR_SCALE: scalingConfig.STAR_SCALE,
      PLANET_SCALE: scalingConfig.PLANET_SCALE,
      ORBITAL_SCALE: scalingConfig.ORBITAL_SCALE,
      STAR_SHADER_SCALE: scalingConfig.STAR_SHADER_SCALE,
    }
  }, [
    systemData,
    viewType,
    selectedObjectId,
    timeMultiplier,
    isPaused,
    scalingConfig
  ])

  // Handle system name click in breadcrumb
  const handleSystemNameClick = useCallback(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.resetToBookmarkView()
    }
  }, [])

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

  if (!systemData || !scalingConfig) {
    return <LoadingState systemId={systemId} loadingProgress="Initializing..." />
  }

  return (
    <SystemViewerContext.Provider value={contextValue}>
      <div className="relative w-full h-full">
        {/* System Navigation Bar */}
        {systemData && (
          <SystemNavigationBar
            systemData={systemData}
            focusedName={focusedName}
            onObjectClick={(objectId, name) => {
              const attemptFocus = (startTime: number) => {
                const obj = objectRefsMap.current.get(objectId)
                if (obj) {
                  const r = obj.scale.x
                  handleObjectSelect(objectId, obj, name)
                  handleObjectFocus(obj, name, undefined, r)
                  return
                }
                if (Date.now() - startTime < 1000) {
                  requestAnimationFrame(() => attemptFocus(startTime))
                }
              }
              attemptFocus(Date.now())
            }}
          />
        )}

        {/* System Breadcrumb */}
        <SystemBreadcrumb
          systemName={systemData?.name || ""}
          selectedObjectName={selectedObjectData?.name || null}
          onSystemNameClick={handleSystemNameClick}
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

            {/* Game Camera Controller - handles game view mode */}
            <ProfileCameraController
              viewType={viewType}
              focusObject={focusedObject}
              focusName={focusedName}
              systemData={systemData}
              selectedObjectId={selectedObjectId}
            />

            {/* Camera controller for focusing and following (non-game modes) */}
            {viewType !== "profile" && (
              <CameraController 
                ref={cameraControllerRef}
                focusObject={focusedObject} 
                focusName={focusedName} 
                focusRadius={focusedObjectRadius || undefined} 
              />
            )}

            {/* OrbitControls with improved settings */}
            <OrbitControls {...orbitControlsProps} />

            {/* System objects */}
            {systemObjectsProps && (
              <SystemObjectsRenderer
                {...systemObjectsProps}
                objectRefsMap={objectRefsMap}
                onObjectHover={handleObjectHoverCallback}
                onObjectSelect={handleObjectSelect}
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
