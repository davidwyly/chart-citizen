"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type * as THREE from "three"
import type { SystemData } from "@/engine/system-loader"
import type { ViewType } from "@lib/types/effects-level"

interface ObjectSelectionState {
  selectedObjectId: string | null
  selectedObjectData: any | null
  hoveredObjectId: string | null
  focusedObject: THREE.Object3D | null
  focusedName: string | null
  focusedObjectSize: number | null
  focusedObjectRadius: number | null
  objectRefsMap: Map<string, THREE.Object3D>
}

export function useObjectSelection(systemData: SystemData | null, viewType: ViewType) {
  const [state, setState] = useState<ObjectSelectionState>({
    selectedObjectId: null,
    selectedObjectData: null,
    hoveredObjectId: null,
    focusedObject: null,
    focusedName: null,
    focusedObjectSize: null,
    focusedObjectRadius: null,
    objectRefsMap: new Map()
  })

  // Store previous state when selecting a planet in game view
  const previousStateRef = useRef<ObjectSelectionState | null>(null)

  // Store refs to all objects in the scene for parent-child relationships
  const objectRefsMap = useRef<Map<string, THREE.Object3D>>(new Map())

  // Helper function to get object radius from system data
  const getObjectRadius = useCallback((objectId: string): number | null => {
    if (!systemData) return null

    // Check stars
    const star = systemData.stars.find(s => s.id === objectId)
    if (star) {
      return 1.0 // Stars are always at scale 1.0
    }

    // Check planets
    const planet = systemData.planets?.find(p => p.id === objectId)
    if (planet) {
      return 1.0 // Planets are always at scale 1.0
    }

    // Check moons
    const moon = systemData.moons?.find(m => m.id === objectId)
    if (moon) {
      return 0.5 // Moons are at half scale
    }

    return null
  }, [systemData])

  // Handle object focus
  const handleObjectFocus = useCallback((object: THREE.Object3D, name: string, visualSize?: number, radius?: number) => {
    setState(prev => ({
      ...prev,
      focusedObject: object,
      focusedName: name,
      focusedObjectSize: visualSize || null,
      focusedObjectRadius: radius || null
    }))
  }, [])

  // Handle object selection
  const handleObjectSelect = useCallback((objectId: string, object: THREE.Object3D, name: string) => {
    setState(prev => {
      // Store previous state when selecting a planet in game view
      if (viewType === "profile" && systemData?.planets?.some(p => p.id === objectId)) {
        previousStateRef.current = prev
      }

      // Get the object radius
      const radius = getObjectRadius(objectId)

      return {
        ...prev,
        selectedObjectId: objectId,
        selectedObjectData: { id: objectId, name },
        // Also focus the object when selected
        focusedObject: object,
        focusedName: name,
        focusedObjectRadius: radius,
        focusedObjectSize: radius
      }
    })
  }, [viewType, systemData, getObjectRadius])

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
      focusedObjectRadius: null
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
