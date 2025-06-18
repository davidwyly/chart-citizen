"use client"

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useMemo } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { createDualProperties, type DualObjectProperties } from "@/engine/types/view-mode-config"
import { getViewModeConfig } from "@/engine/core/view-modes/compatibility"
import type { ViewType } from "@lib/types/effects-level"

interface UnifiedCameraControllerProps {
  focusObject: THREE.Object3D | null
  focusName?: string | null
  focusRadius?: number
  focusSize?: number  // The actual visual size in the scene
  focusMass?: number
  focusOrbitRadius?: number
  viewMode: ViewType
  onAnimationComplete?: () => void
}

export interface UnifiedCameraControllerRef {
  resetToBookmarkView: () => void
  setBirdsEyeView: () => void
  getCurrentOrbitRadius: () => number
  getObjectProperties: () => DualObjectProperties | null
}

export const UnifiedCameraController = forwardRef<UnifiedCameraControllerRef, UnifiedCameraControllerProps>(
  function UnifiedCameraController({ 
    focusObject, 
    focusName, 
    focusRadius, 
    focusSize,
    focusMass,
    focusOrbitRadius,
    viewMode,
    onAnimationComplete,
  }: UnifiedCameraControllerProps, ref) {
    const { camera, controls } = useThree()
    const controlsRef = useRef<any>(controls)
    const isFollowingRef = useRef(false)
    const animatingRef = useRef(false)
    const lastObjectPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
    const initialViewSetRef = useRef(false)
    const currentObjectPropertiesRef = useRef<DualObjectProperties | null>(null)
    // Track last object that triggered a focus animation so we can debounce
    const lastFocusedRef = useRef<THREE.Object3D | null>(null)

    useEffect(() => {
      controlsRef.current = controls
    }, [controls, focusObject])

    // Get current view mode configuration (memoized to prevent excessive re-calculations)
    const viewConfig = useMemo(() => getViewModeConfig(viewMode), [viewMode])

    // Calculate the furthest orbital radius in the system
    const calculateMaxOrbitRadius = useCallback(() => {
      let maxOrbitRadius = 0
      
      // Find the largest orbit radius in the scene
      controlsRef.current?.object?.parent?.traverse((object: THREE.Object3D) => {
        if (object.userData.orbitRadius) {
          maxOrbitRadius = Math.max(maxOrbitRadius, object.userData.orbitRadius)
        }
      })

      // If no orbits found, use a default distance
      if (maxOrbitRadius === 0) maxOrbitRadius = 50
      
      return maxOrbitRadius
    }, [])

    // Animation helper with configurable easing
    const createEasingFunction = useCallback((easingType: string) => {
      switch (easingType) {
        case 'linear':
          return (t: number) => t
        case 'easeOut':
          return (t: number) => 1 - Math.pow(1 - t, 3)
        case 'easeInOut':
          return (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        case 'leap':
          return (t: number) => {
            if (t < 0.3) {
              return t * 3.33 * t // Quadratic acceleration
            } else {
              const settleProgress = (t - 0.3) / 0.7
              return 0.33 + 0.67 * (1 - Math.pow(1 - settleProgress, 3))
            }
          }
        default:
          return (t: number) => 1 - Math.pow(1 - t, 3)
      }
    }, [])

    // Set birds-eye view function
    const setBirdsEyeView = useCallback(() => {
      if (!controlsRef.current) return

      // Stop following any object
      isFollowingRef.current = false
      animatingRef.current = true

      // Calculate the system bounds
      const maxOrbitRadius = calculateMaxOrbitRadius()
      const center = new THREE.Vector3()

      // Use configured birds-eye view angle
      const angle = viewConfig.cameraConfig.viewingAngles.birdsEyeElevation * (Math.PI / 180)
      const distance = maxOrbitRadius

      // Calculate position components for birds-eye view
      const horizontalDistance = distance * Math.cos(angle)
      const verticalDistance = distance * Math.sin(angle)

      // Position camera based on view mode
      let newPosition: THREE.Vector3
      if (viewMode === 'profile') {
        // Top-down view for profile mode
        newPosition = new THREE.Vector3(0, 0, distance)
      } else {
        // Angled view for other modes
        newPosition = new THREE.Vector3(
          horizontalDistance * 0.7,
          verticalDistance,
          horizontalDistance * 0.7
        )
      }

      const newTarget = center.clone()

      // Store original positions for animation
      const originalPosition = camera.position.clone()
      const originalTarget = controlsRef.current.target.clone()

      // Disable controls during animation, remember previous state
      const previousEnabled = controlsRef.current.enabled
      controlsRef.current.enabled = false

      const startTime = Date.now()
      const duration = viewConfig.cameraConfig.animation.birdsEyeDuration
      const easingFunction = createEasingFunction(viewConfig.cameraConfig.animation.easingFunction)

      const animate = () => {
        const now = Date.now()
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = easingFunction(progress)

        if (!controlsRef.current) {
          // If controls are null, it means the component (or its parent controls) has unmounted.
          // Stop the animation to prevent errors.
          console.warn("Animation stopped: controlsRef.current is null.")
          animatingRef.current = false
          return
        }

        // Interpolate camera position and target
        camera.position.lerpVectors(originalPosition, newPosition, easeProgress)
        controlsRef.current.target.lerpVectors(originalTarget, newTarget, easeProgress)

        // Update controls without enabling them
        controlsRef.current.update()

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // Animation complete
          animatingRef.current = false
          camera.position.copy(newPosition)
          controlsRef.current.target.copy(newTarget)
          controlsRef.current.update()

          // Save this state as the new "home" state for the controls
          if (controlsRef.current.saveState) {
            controlsRef.current.saveState()
          }

          // Re-enable controls, restore previous enabled state
          if (controlsRef.current) {
            controlsRef.current.enabled = previousEnabled
          }

          if (onAnimationComplete) {
            onAnimationComplete()
          }
        }
      }

      animate()
    }, [camera, calculateMaxOrbitRadius, viewConfig, viewMode, createEasingFunction, onAnimationComplete])

    // Set initial system view
    useEffect(() => {
      if (!initialViewSetRef.current && controlsRef.current) {
        initialViewSetRef.current = true

        // Calculate the system bounds
        const maxOrbitRadius = calculateMaxOrbitRadius()
        const center = new THREE.Vector3()

        // Use configured default elevation angle
        const angle = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
        const distance = maxOrbitRadius * 0.75

        // Calculate position components
        const horizontalDistance = distance * Math.cos(angle)
        const verticalDistance = distance * Math.sin(angle)

        // Set camera position and target based on view mode
        if (viewMode === 'profile') {
          // Top-down view for profile mode
          camera.position.set(0, 0, distance)
        } else {
          // Angled view for other modes
          camera.position.set(
            horizontalDistance,
            verticalDistance,
            horizontalDistance
          )
        }
        
        controlsRef.current.target.copy(center)
        controlsRef.current.update()

        // Save this as the home state
        if (controlsRef.current.saveState) {
          controlsRef.current.saveState()
        }
      }
    }, [camera, controls, calculateMaxOrbitRadius, viewConfig, viewMode])

    // Reset to bookmark view
    const resetToBookmarkView = useCallback(() => {
      if (controlsRef.current && controlsRef.current.reset) {
        controlsRef.current.reset()
      }
    }, [])

    // Get current orbit radius function
    const getCurrentOrbitRadius = useCallback(() => {
      return currentObjectPropertiesRef.current?.optimalViewDistance || 0
    }, [])

    // Get current object properties
    const getObjectProperties = useCallback(() => {
      return currentObjectPropertiesRef.current
    }, [])

    // Expose functions to parent components
    useImperativeHandle(ref, () => ({
      resetToBookmarkView,
      setBirdsEyeView,
      getCurrentOrbitRadius,
      getObjectProperties
    }))

    // Handle object focus with unified logic
    useEffect(() => {
      // Debug logging for camera focus
      console.log('🔍 Camera focus debug:', {
        focusObject: !!focusObject,
        focusName,
        focusRadius,
        focusSize,
        animating: animatingRef.current,
        isFollowing: isFollowingRef.current
      })
      
      // Debounce: if we are already animating towards the same object, ignore
      if (animatingRef.current && focusObject && focusObject === lastFocusedRef.current) {
        return
      }

      if (focusObject && controlsRef.current && focusName) {
        // Update last focused reference
        lastFocusedRef.current = focusObject

        const position = new THREE.Vector3()
        focusObject.getWorldPosition(position)

        // Create dual properties for the focused object
        const objectProperties = createDualProperties(
          focusRadius || 1.0,
          focusOrbitRadius || 0,
          focusMass || 1.0,
          focusName,
          viewMode,
        )

        // Store the current object properties
        currentObjectPropertiesRef.current = objectProperties

        // IMPORTANT: Use the actual visual size from the scene, not the recalculated one
        // The focusRadius parameter is the real radius in km, but we need the visual size
        const actualVisualSize = focusSize || focusObject.scale?.x || 1.0
        
        // Calculate camera distance based PURELY on actual visual radius
        // This ensures consistent behavior regardless of object type
        const cameraConfig = viewConfig.cameraConfig
        const optimalDistance = actualVisualSize * cameraConfig.radiusMultiplier
        const minDistance = actualVisualSize * cameraConfig.minDistanceMultiplier
        const maxDistance = actualVisualSize * cameraConfig.maxDistanceMultiplier
        
        // Apply absolute constraints and ensure we never go inside the object
        const targetDistance = Math.max(
          Math.min(
            Math.max(optimalDistance, cameraConfig.absoluteMinDistance),
            cameraConfig.absoluteMaxDistance
          ),
          Math.max(minDistance, actualVisualSize * 2.0) // Safety margin: never closer than 1.5x radius
        )

        // Update the stored properties with the corrected distance
        currentObjectPropertiesRef.current = {
          ...objectProperties,
          optimalViewDistance: targetDistance,
          visualRadius: actualVisualSize
        }

        // Start following the object
        isFollowingRef.current = true
        animatingRef.current = true

        // Store the current controls state before disabling
        const originalTarget = controlsRef.current.target.clone()
        const originalPosition = camera.position.clone()

        // Disable controls during animation, remember previous state
        const previousEnabled = controlsRef.current.enabled
        controlsRef.current.enabled = false

        // Store initial object position
        lastObjectPositionRef.current.copy(position)

        // Get a horizontal direction - prefer to approach from the current camera direction
        const horizontalDirection = new THREE.Vector3()
        const currentDirection = camera.position.clone().sub(position)

        // Project current direction onto horizontal plane (remove Y component)
        horizontalDirection.set(currentDirection.x, 0, currentDirection.z)

        // If the horizontal direction is too small, use a default
        if (horizontalDirection.length() < 0.1) {
          horizontalDirection.set(1, 0, 0)
        }

        horizontalDirection.normalize()

        // Calculate camera position based on view mode
        let newPosition: THREE.Vector3
        let newTarget: THREE.Vector3

        if (viewMode === 'profile') {
          // Top-down view for profile mode
          newPosition = position.clone().add(new THREE.Vector3(0, 0, targetDistance))
          newTarget = position.clone()
        } else {
          // Use configured viewing angle
          const downwardAngle = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
          const horizontalDistance = targetDistance * Math.cos(downwardAngle)
          const verticalDistance = targetDistance * Math.sin(downwardAngle)

          newPosition = position
            .clone()
            .add(horizontalDirection.multiplyScalar(horizontalDistance))
            .add(new THREE.Vector3(0, verticalDistance, 0))
          newTarget = position.clone()
        }

        const startTime = Date.now()
        const duration = viewConfig.cameraConfig.animation.focusDuration
        const easingFunction = createEasingFunction(viewConfig.cameraConfig.animation.easingFunction)

        const animate = () => {
          const now = Date.now()
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const easeProgress = easingFunction(progress)

          if (!controlsRef.current) {
            // If controls are null, it means the component (or its parent controls) has unmounted.
            // Stop the animation to prevent errors.
            console.warn("Animation stopped: controlsRef.current is null.")
            animatingRef.current = false
            return
          }

          // CAMERA FIX: Check if we're still supposed to be animating to this object
          if (!focusObject || !isFollowingRef.current) {
            console.warn("Animation stopped: focus object changed or following stopped.")
            animatingRef.current = false
            if (controlsRef.current) {
              controlsRef.current.enabled = true
            }
            return
          }

          // Interpolate camera position and target
          camera.position.lerpVectors(originalPosition, newPosition, easeProgress)
          controlsRef.current.target.lerpVectors(originalTarget, newTarget, easeProgress)

          // Update controls without enabling them
          controlsRef.current.update()

          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            // Animation complete
            animatingRef.current = false
            camera.position.copy(newPosition)

            if (controlsRef.current) { // Defensive check before accessing target again
              controlsRef.current.target.copy(newTarget)
              controlsRef.current.update()
            }

            // Save this state as the new "home" state for the controls
            if (controlsRef.current && controlsRef.current.saveState) {
              controlsRef.current.saveState()
            }

            // Re-enable controls, restore previous enabled state
            if (controlsRef.current) {
              controlsRef.current.enabled = previousEnabled
            }

            // Update last position
            lastObjectPositionRef.current.copy(position)

            if (onAnimationComplete) {
              onAnimationComplete()
            }
          }
        }

        animate()
      } else {
        // Stop following when no object is focused
        isFollowingRef.current = false
        currentObjectPropertiesRef.current = null
        if (controlsRef.current) {
          controlsRef.current.enabled = true
        }
      }
    }, [focusObject, focusName, focusRadius, focusSize, focusMass, focusOrbitRadius, viewMode, camera, viewConfig, createEasingFunction, onAnimationComplete])

    // Continuously follow the focused object
    useFrame(() => {
      if (focusObject && controlsRef.current && isFollowingRef.current && !animatingRef.current) {
        const currentPosition = new THREE.Vector3()
        focusObject.getWorldPosition(currentPosition)

        // Calculate movement delta
        const deltaPosition = new THREE.Vector3().subVectors(currentPosition, lastObjectPositionRef.current)

        // Only move if there's significant movement to avoid jitter
        if (deltaPosition.length() > 0.001) {
          // Move both camera and target by the same delta
          camera.position.add(deltaPosition)
          controlsRef.current.target.add(deltaPosition)

          // Update controls
          controlsRef.current.update()

          // Update stored position
          lastObjectPositionRef.current.copy(currentPosition)
        }
      }
    })

    return null
  }
) 