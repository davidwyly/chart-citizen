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
  objectRefsMap: Map<string, THREE.Object3D>
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
    objectRefsMap: new Map()
  })

  // Store previous state when selecting a planet in game view
  const previousStateRef = useRef<ObjectSelectionState | null>(null)

  // Store refs to all objects in the scene for parent-child relationships
  const objectRefsMap = useRef<Map<string, THREE.Object3D>>(new Map())

  // Store timeout reference to prevent overlapping timeouts
  const unpauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to get object data from system data
  const getObjectData = useCallback((objectId: string) => {
    if (!systemData || !systemData.objects) return null

    return systemData.objects.find(obj => obj.id === objectId)
  }, [systemData])

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
      focusedObjectSize: visualSize || null,
      focusedObjectRadius: radius || null,
      focusedObjectMass: mass || null,
      focusedObjectOrbitRadius: orbitRadius || null
    }))
  }, [])

  // Handle object selection with explicit pause state management
  const handleObjectSelect = useCallback((objectId: string, object: THREE.Object3D, name: string) => {
    // Clear any existing unpause timeout
    if (unpauseTimeoutRef.current) {
      clearTimeout(unpauseTimeoutRef.current)
      unpauseTimeoutRef.current = null
    }

    // Always pause when selecting an object (if not already paused)
    if (!isPaused) {
      pauseSimulation()
    }

    setState(prev => {
      // Store previous state when selecting a planet in game view
      if (viewType === "profile" && systemData?.objects.some(obj => isPlanet(obj) && obj.id === objectId)) {
        previousStateRef.current = prev
      }

      // Get the full object data
      const objectData = getObjectData(objectId)

      const orbitalSemiMajorAxis = objectData?.orbit && isOrbitData(objectData.orbit) 
        ? objectData.orbit.semi_major_axis 
        : null

      // Set timeout to unpause after camera navigation completes
      unpauseTimeoutRef.current = setTimeout(() => {
        unpauseSimulation()
        unpauseTimeoutRef.current = null
      }, 1000) // Adjust delay as needed

      return {
        ...prev,
        selectedObjectId: objectId,
        selectedObjectData: objectData,
        // Focus will be updated with full properties by the renderer when onObjectFocus is called
        focusedObject: object,
        focusedName: name,
        focusedObjectRadius: null, // Will be set by renderer
        focusedObjectSize: null, // Will be set by renderer
        focusedObjectMass: null, // Will be set by renderer
        focusedObjectOrbitRadius: orbitalSemiMajorAxis
      }
    })
  }, [viewType, systemData, getObjectData, pauseSimulation, unpauseSimulation, isPaused])

  // Handle object hover
  const handleObjectHover = useCallback((objectId: string | null) => {
    if (objectId === state.hoveredObjectId) return; // Prevent unnecessary updates
    setState(prev => ({
      ...prev,
      hoveredObjectId: objectId
    }))
  }, [state.hoveredObjectId])

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
      setState(previousStateRef.current)
      previousStateRef.current = null
    }
  }, [viewType])

  // Update object refs map when objects are added/removed
  useEffect(() => {
    objectRefsMap.current = new Map()
  }, [systemData])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (unpauseTimeoutRef.current) {
        clearTimeout(unpauseTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    objectRefsMap: objectRefsMap.current,
    handleObjectFocus,
    handleObjectSelect,
    handleObjectHover,
    handleCanvasClick,
    handleStopFollowing,
    handleBackButtonClick
  }
}
