"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type * as THREE from "three"
import { OrbitalSystemData, isStar, isPlanet, isMoon, isBelt, isOrbitData } from "@/engine/types/orbital-system"
import type { ViewType } from "@lib/types/effects-level"

interface ObjectSelectionState {
  selectedObjectId: string | null
  selectedObjectData: any | null
  hoveredObjectId: string | null
  focusedObject: THREE.Object3D | null
  focusedName: string | null
  focusedObjectSize: number | null
  focusedObjectRadius: number | null
  focusedObjectMass: number | null
  focusedObjectOrbitRadius: number | null
}

export function useObjectSelection(
  systemData: OrbitalSystemData | null, 
  viewType: ViewType, 
  setTimeMultiplier: (multiplier: number) => void, 
  pauseSimulation: () => void,
  unpauseSimulation: () => void,
  isPaused: boolean
) {
  const [state, setState] = useState<ObjectSelectionState>({
    selectedObjectId: null,
    selectedObjectData: null,
    hoveredObjectId: null,
    focusedObject: null,
    focusedName: null,
    focusedObjectSize: null,
    focusedObjectRadius: null,
    focusedObjectMass: null,
    focusedObjectOrbitRadius: null,
  })

  // Store previous state when selecting a planet in game view
  const previousStateRef = useRef<ObjectSelectionState & { objectRefsMap?: Map<string, THREE.Object3D> } | null>(null)

  // Store refs to all objects in the scene for parent-child relationships
  const objectRefsMap = useRef<Map<string, THREE.Object3D>>(new Map())

  // Track if we're waiting for animation to complete
  const waitingForAnimationRef = useRef<boolean>(false)

  // Helper function to get object data from system data
  const getObjectData = useCallback((objectId: string) => {
    if (!systemData || !systemData.objects) return null

    return systemData.objects.find(obj => obj.id === objectId) || null
  }, [systemData])

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    if (waitingForAnimationRef.current) {
      waitingForAnimationRef.current = false
      unpauseSimulation()
    }
  }, [unpauseSimulation])

  // Enhanced handle object focus with additional properties
  const handleObjectFocus = useCallback((
    object: THREE.Object3D, 
    name: string, 
    visualSize?: number, 
    radius?: number, 
    mass?: number, 
    orbitRadius?: number
  ) => {

    
    setState(prev => ({
      ...prev,
      focusedObject: object,
      focusedName: name,
      focusedObjectSize: visualSize !== undefined ? visualSize : null,
      focusedObjectRadius: radius !== undefined ? radius : null,
      focusedObjectMass: mass !== undefined ? mass : null,
      focusedObjectOrbitRadius: orbitRadius !== undefined ? orbitRadius : null
    }))
  }, [])

  // Handle object selection with explicit pause state management
  const handleObjectSelect = useCallback((objectId: string, object: THREE.Object3D, name: string) => {
    // Check if we're selecting the same object
    const isSameObject = state.selectedObjectId === objectId

    // If we're already animating towards this object, ignore subsequent selects
    if (isSameObject && waitingForAnimationRef.current) {
      return
    }

    // Only pause if we're selecting a different object and not already paused
    if (!isSameObject && !isPaused) {
      pauseSimulation()
      waitingForAnimationRef.current = true
    } else if (isSameObject && isPaused) {
      // If selecting the same object and we're paused, unpause immediately
      unpauseSimulation()
    }

    setState(prev => {
      // Store previous state when selecting a planet in game view
      if (viewType === "profile" && systemData?.objects.some(obj => isPlanet(obj) && obj.id === objectId)) {
        previousStateRef.current = { ...prev, objectRefsMap: objectRefsMap.current }
      }

      // Get the full object data
      const objectData = getObjectData(objectId)

            const orbitalSemiMajorAxis = objectData?.orbit && isOrbitData(objectData.orbit) 
        ? objectData.orbit.semi_major_axis 
        : null



      return {
        ...prev,
        selectedObjectId: objectId,
        selectedObjectData: objectData,
        // Focus will be updated with full properties by the renderer when onObjectFocus is called
        focusedObject: object,
        focusedName: name,
        // ⚠️ CRITICAL: Preserve existing focus properties to avoid race conditions
        // When breadcrumb navigation calls handleObjectFocus followed by handleObjectSelect,
        // we must preserve the focusedObjectSize set by handleObjectFocus for camera framing consistency
        focusedObjectRadius: prev.focusedObjectRadius, // Preserve existing or will be set by renderer
        focusedObjectSize: prev.focusedObjectSize, // Preserve existing or will be set by renderer
        focusedObjectMass: prev.focusedObjectMass, // Preserve existing or will be set by renderer
        focusedObjectOrbitRadius: orbitalSemiMajorAxis
      }
    })
  }, [viewType, systemData, getObjectData, pauseSimulation, unpauseSimulation, isPaused, state.selectedObjectId])

  // Handle object hover
  const handleObjectHover = useCallback((objectId: string | null) => {
    setState(prev => {
      if (objectId === prev.hoveredObjectId) return prev; // Prevent unnecessary updates
      return {
        ...prev,
        hoveredObjectId: objectId
      }
    })
  }, [])

  // Handle canvas click (clear selection)
  const handleCanvasClick = useCallback(() => {
    // Do nothing - we want selection to persist until another object is selected
    // or the system changes
  }, [])

  // Handle stop following
  const handleStopFollowing = useCallback(() => {
    setState(prev => ({
      ...prev,
      focusedObject: null,
      focusedName: null,
      focusedObjectSize: null,
      focusedObjectRadius: null,
      focusedObjectMass: null,
      focusedObjectOrbitRadius: null
    }))
  }, [])

  // Handle back button click in profile view
  const handleBackButtonClick = useCallback(() => {
    if (viewType === "profile" && previousStateRef.current) {
      const { objectRefsMap: _, ...prevState } = previousStateRef.current
      setState(prevState)
      previousStateRef.current = null
    }
  }, [viewType])

  // Only clear the map when the system itself changes, not on every render
  const lastSystemId = useRef<string | null>(null)
  useEffect(() => {
    if (systemData?.id && systemData.id !== lastSystemId.current) {
      objectRefsMap.current.clear()         // keep the same Map instance
      lastSystemId.current = systemData.id
    }
  }, [systemData?.id])

  // No cleanup needed for animation completion approach

  return {
    ...state,
    objectRefsMap: objectRefsMap.current,
    handleObjectFocus,
    handleObjectSelect,
    handleObjectHover,
    handleCanvasClick,
    handleStopFollowing,
    handleBackButtonClick,
    handleAnimationComplete
  }
}
