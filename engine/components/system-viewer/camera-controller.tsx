"use client"

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface CameraControllerProps {
  focusObject: THREE.Object3D | null
  focusName?: string | null
  focusRadius?: number
}

export interface CameraControllerRef {
  resetToBookmarkView: () => void
  setBirdsEyeView: () => void
  getCurrentOrbitRadius: () => number
}

export const CameraController = forwardRef<CameraControllerRef, CameraControllerProps>(
  function CameraController({ focusObject, focusName, focusRadius }: CameraControllerProps, ref) {
    const { camera, controls } = useThree()
    const controlsRef = useRef<any>(controls)
    const isFollowingRef = useRef(false)
    const animatingRef = useRef(false)
    const lastObjectPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
    const initialViewSetRef = useRef(false)
    const currentOrbitRadiusRef = useRef<number>(0)

    useEffect(() => {
      controlsRef.current = controls
    }, [controls])

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

    // Set birds-eye view function
    const setBirdsEyeView = useCallback(() => {
      if (!controlsRef.current) return

      // Stop following any object
      isFollowingRef.current = false
      animatingRef.current = true

      // Calculate the system bounds
      const maxOrbitRadius = calculateMaxOrbitRadius()
      currentOrbitRadiusRef.current = maxOrbitRadius // Store the current orbit radius
      const center = new THREE.Vector3()

      // Calculate camera position for 40-degree angle (birds-eye view)
      const angle = 40 * (Math.PI / 180) // Convert to radians
      const distance = maxOrbitRadius  // Removed * 1.5 to use raw value

      // Calculate position components for birds-eye view
      const horizontalDistance = distance * Math.cos(angle)
      const verticalDistance = distance * Math.sin(angle)

      // Position camera at 40 degrees above and slightly offset for better view
      const newPosition = new THREE.Vector3(
        horizontalDistance * 0.7, // Slightly offset from directly overhead
        verticalDistance,
        horizontalDistance * 0.7
      )
      const newTarget = center.clone()

      // Store original positions for animation
      const originalPosition = camera.position.clone()
      const originalTarget = controlsRef.current.target.clone()

      // Disable controls during animation
      controlsRef.current.enabled = false

      const startTime = Date.now()
      const duration = 1200 // Animation duration in ms

      const animate = () => {
        const now = Date.now()
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Smooth easing function
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        // Interpolate camera position and target
        camera.position.lerpVectors(originalPosition, newPosition, easeProgress)
        controlsRef.current.target.lerpVectors(originalTarget, newTarget, easeProgress)

        // Update controls
        controlsRef.current.update()

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // Animation complete
          animatingRef.current = false

          // Set final positions exactly
          camera.position.copy(newPosition)
          controlsRef.current.target.copy(newTarget)

          // Update controls
          controlsRef.current.update()

          // Save this state as the new "home" state for the controls
          if (controlsRef.current.saveState) {
            controlsRef.current.saveState()
          }

          // Re-enable controls
          controlsRef.current.enabled = true
        }
      }

      animate()
    }, [camera, calculateMaxOrbitRadius])

    // Set initial system view
    useEffect(() => {
      if (!initialViewSetRef.current && controlsRef.current) {
        initialViewSetRef.current = true

        // Calculate the system bounds
        const maxOrbitRadius = calculateMaxOrbitRadius()
        const center = new THREE.Vector3()

        // Calculate camera position for 45-degree angle
        const angle = 45 * (Math.PI / 180) // Convert to radians
        const distance = maxOrbitRadius * 0.75 // Use 75% of the max orbit radius

        // Calculate position components
        const horizontalDistance = distance * Math.cos(angle)
        const verticalDistance = distance * Math.sin(angle)

        // Set camera position and target
        camera.position.set(
          horizontalDistance,
          verticalDistance,
          horizontalDistance // Equal X and Z for 45-degree rotation
        )
        controlsRef.current.target.copy(center)

        // Update controls
        controlsRef.current.update()

        // Save this as the home state
        if (controlsRef.current.saveState) {
          controlsRef.current.saveState()
        }
      }
    }, [camera, controls, calculateMaxOrbitRadius])

    // Reset to bookmark view
    const resetToBookmarkView = useCallback(() => {
      if (controlsRef.current && controlsRef.current.reset) {
        controlsRef.current.reset()
      }
    }, [])

    // Get current orbit radius function
    const getCurrentOrbitRadius = useCallback(() => {
      return currentOrbitRadiusRef.current
    }, [])

    // Expose the reset, birds-eye view, and orbit radius functions to parent components
    useImperativeHandle(ref, () => ({
      resetToBookmarkView,
      setBirdsEyeView,
      getCurrentOrbitRadius
    }))

    useEffect(() => {
      if (focusObject && controlsRef.current) {
        const position = new THREE.Vector3()
        focusObject.getWorldPosition(position)

        // Calculate distance based on actual object radius
        let targetDistance: number

        if (focusRadius && focusRadius > 0) {
          // For stars, use a larger multiplier to prevent zooming too close
          const isStar = focusName ? focusName.toLowerCase().includes('star') : false
          const isGasGiant = focusName ? focusName.toLowerCase().includes('jupiter') || focusName.toLowerCase().includes('saturn') || focusName.toLowerCase().includes('uranus') || focusName.toLowerCase().includes('neptune') : false
          
          // Use different multipliers based on object type
          let distanceMultiplier = 3 // Default for regular planets/moons
          if (isStar) {
            distanceMultiplier = 8 // Stars need more distance
          } else if (isGasGiant) {
            distanceMultiplier = 5 // Gas giants need a bit more distance than rocky planets
          }
          
          // Use the multiplier times the actual radius for optimal viewing distance
          targetDistance = focusRadius * distanceMultiplier

          // Set minimum and maximum distances based on object type
          const minDistance = isStar ? 2.0 : isGasGiant ? 1.0 : 0.5
          const maxDistance = isStar ? 100 : isGasGiant ? 30 : 20

          targetDistance = Math.max(targetDistance, minDistance)
          targetDistance = Math.min(targetDistance, maxDistance)
        } else {
          // Fallback to scale-based calculation if radius is not available
          const objectScale = focusObject.scale.x
          targetDistance = Math.max(objectScale * 2.5 + 0.8, 1.5)
        }

        // Start following the object
        isFollowingRef.current = true
        animatingRef.current = true

        // Store the current controls state before disabling
        const originalTarget = controlsRef.current.target.clone()
        const originalPosition = camera.position.clone()

        // Disable controls during animation
        controlsRef.current.enabled = false

        // Store initial object position
        lastObjectPositionRef.current.copy(position)

        // Get a horizontal direction - prefer to approach from the current camera direction
        // but projected onto the horizontal plane
        const horizontalDirection = new THREE.Vector3()
        const currentDirection = camera.position.clone().sub(position)

        // Project current direction onto horizontal plane (remove Y component)
        horizontalDirection.set(currentDirection.x, 0, currentDirection.z)

        // If the horizontal direction is too small, use a default
        if (horizontalDirection.length() < 0.1) {
          horizontalDirection.set(1, 0, 0) // Default to positive X direction
        }

        horizontalDirection.normalize()

        // Calculate camera position for 30-degree downward viewing angle
        const downwardAngle = 30 * (Math.PI / 180) // Convert to radians

        // Calculate horizontal and vertical distances for 30-degree angle
        const horizontalDistance = targetDistance * Math.cos(downwardAngle)
        const verticalDistance = targetDistance * Math.sin(downwardAngle)

        // Calculate final camera position: move horizontally away from target, then up
        const newPosition = position
          .clone()
          .add(horizontalDirection.multiplyScalar(horizontalDistance)) // Move horizontally
          .add(new THREE.Vector3(0, verticalDistance, 0)) // Move up

        const newTarget = position.clone()

        const startTime = Date.now()
        const duration = 800 // Animation duration in ms

        const animate = () => {
          const now = Date.now()
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)

          // "Leap" easing - quick acceleration, then settle
          let easeProgress
          if (progress < 0.3) {
            // Quick initial leap
            easeProgress = progress * 3.33 * progress // Quadratic acceleration
          } else {
            // Gentle settle
            const settleProgress = (progress - 0.3) / 0.7
            easeProgress = 0.33 + 0.67 * (1 - Math.pow(1 - settleProgress, 3))
          }

          // Interpolate camera position and target
          camera.position.lerpVectors(originalPosition, newPosition, easeProgress)
          controlsRef.current.target.lerpVectors(originalTarget, newTarget, easeProgress)

          // Update controls without enabling them
          controlsRef.current.update()

          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            // Animation complete - carefully re-enable controls
            animatingRef.current = false

            // Set final positions exactly
            camera.position.copy(newPosition)
            controlsRef.current.target.copy(newTarget)

            // Force the controls to update with the new state
            controlsRef.current.update()

            // Save this state as the new "home" state for the controls
            if (controlsRef.current.saveState) {
              controlsRef.current.saveState()
            }

            // Re-enable controls
            controlsRef.current.enabled = true

            // Update last position
            lastObjectPositionRef.current.copy(position)
          }
        }

        animate()
      } else {
        // Stop following when no object is focused
        isFollowingRef.current = false
        if (controlsRef.current) {
          controlsRef.current.enabled = true
        }
      }
    }, [focusObject, focusName, focusRadius, camera])

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
