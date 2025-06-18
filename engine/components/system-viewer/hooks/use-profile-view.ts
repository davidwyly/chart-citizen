"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type * as THREE from "three"
import { OrbitalSystemData, isStar, isPlanet, isMoon, CelestialObject } from "@/engine/types/orbital-system"

interface ProfileViewState {
  focalObjectId: string | null
  focalObjectData: CelestialObject | null
  focalObject: THREE.Object3D | null
  orbitingBodies: CelestialObject[]
  cameraMode: 'orthographic' | 'perspective'
  isTimeControlsPaused: boolean
}

interface ProfileLayoutData {
  focalObject: {
    id: string
    position: [number, number, number]
    size: number
  }
  orbitingBodies: Array<{
    id: string
    position: [number, number, number]
    size: number
    originalOrbitRadius: number
  }>
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
}

export function useProfileView(
  systemData: OrbitalSystemData | null, 
  isProfileView: boolean,
  setTimeMultiplier: (multiplier: number) => void,
  pauseSimulation: () => void,
  unpauseSimulation: () => void
) {
  const [state, setState] = useState<ProfileViewState>({
    focalObjectId: null,
    focalObjectData: null,
    focalObject: null,
    orbitingBodies: [],
    cameraMode: 'perspective',
    isTimeControlsPaused: false
  })

  const previousTimeStateRef = useRef<{
    wasTimeControlsPaused: boolean
    timeMultiplier: number
  } | null>(null)

  // Helper function to find children of an object
  const findOrbitingBodies = useCallback((parentId: string): CelestialObject[] => {
    if (!systemData?.objects) return []
    
    return systemData.objects.filter(obj => 
      obj.orbit && 'parent' in obj.orbit && obj.orbit.parent === parentId
    )
  }, [systemData])

  // Initialize profile view with default focal point (usually the parent star)
  const initializeProfileView = useCallback(() => {
    if (!systemData?.objects || !isProfileView) return

    // Find the parent star as default focal point
    const parentObject = systemData.objects.find(obj => isStar(obj))
    if (parentObject) {
      const orbitingBodies = findOrbitingBodies(parentObject.id)
      
      setState(prev => ({
        ...prev,
        focalObjectId: parentObject.id,
        focalObjectData: parentObject,
        orbitingBodies,
        cameraMode: 'orthographic',
        isTimeControlsPaused: true
      }))

      // Store previous time state and pause simulation
      if (!previousTimeStateRef.current) {
        previousTimeStateRef.current = {
          wasTimeControlsPaused: false, // TODO: Get actual pause state
          timeMultiplier: 1 // TODO: Get actual time multiplier
        }
      }
      pauseSimulation()
    }
  }, [systemData, isProfileView, pauseSimulation, findOrbitingBodies])

  // Change focal point to a new object
  const changeFocalPoint = useCallback((objectId: string, object: THREE.Object3D) => {
    if (!systemData?.objects) return

    const newFocalObject = systemData.objects.find(obj => obj.id === objectId)
    if (!newFocalObject) return

    const orbitingBodies = findOrbitingBodies(objectId)

    setState(prev => ({
      ...prev,
      focalObjectId: objectId,
      focalObjectData: newFocalObject,
      focalObject: object,
      orbitingBodies
    }))
  }, [systemData, findOrbitingBodies])

  // Calculate standardized layout for profile view
  const calculateProfileLayout = useCallback((): ProfileLayoutData | null => {
    if (!state.focalObjectData || !state.orbitingBodies.length) return null

    const focalSize = 2.0 // Large size for focal object
    const orbitingSize = 0.8 // Medium size for orbiting bodies
    const spacing = 3.0 // Equidistant spacing

    // Position focal object on the left
    const focalPosition: [number, number, number] = [-8, 0, 0]

    // Position orbiting bodies in a line to the right
    const orbitingBodies = state.orbitingBodies.map((body, index) => ({
      id: body.id,
      position: [
        -2 + (index * spacing), // Start at -2, space by 3 units
        0,
        0
      ] as [number, number, number],
      size: orbitingSize,
      originalOrbitRadius: (body.orbit && 'semi_major_axis' in body.orbit) ? body.orbit.semi_major_axis : 0
    }))

    // Calculate camera position for framing
    const rightmostBody = orbitingBodies[orbitingBodies.length - 1]
    const totalWidth = rightmostBody ? rightmostBody.position[0] - focalPosition[0] + 2 : 10
    
    // 45-degree bird's-eye view
    const cameraDistance = totalWidth * 1.5
    const cameraPosition: [number, number, number] = [
      0, // Center horizontally
      cameraDistance * Math.sin(Math.PI / 4), // 45 degrees elevation
      cameraDistance * Math.cos(Math.PI / 4)
    ]

    return {
      focalObject: {
        id: state.focalObjectData.id,
        position: focalPosition,
        size: focalSize
      },
      orbitingBodies,
      cameraPosition,
      cameraTarget: [0, 0, 0]
    }
  }, [state.focalObjectData, state.orbitingBodies])

  // Restore previous view state when exiting profile view
  const exitProfileView = useCallback(() => {
    setState(prev => ({
      ...prev,
      focalObjectId: null,
      focalObjectData: null,
      focalObject: null,
      orbitingBodies: [],
      cameraMode: 'perspective',
      isTimeControlsPaused: false
    }))

    // Restore previous time state
    if (previousTimeStateRef.current) {
      if (!previousTimeStateRef.current.wasTimeControlsPaused) {
        unpauseSimulation()
      }
      // TODO: Restore time multiplier
      previousTimeStateRef.current = null
    }
  }, [unpauseSimulation])

  // Initialize profile view when entering profile mode
  useEffect(() => {
    if (isProfileView) {
      initializeProfileView()
    } else {
      exitProfileView()
    }
  }, [isProfileView, initializeProfileView, exitProfileView])

  return {
    ...state,
    initializeProfileView,
    changeFocalPoint,
    calculateProfileLayout,
    exitProfileView,
    isProfileViewActive: isProfileView && state.focalObjectId !== null
  }
}