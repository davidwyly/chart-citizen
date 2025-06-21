"use client"

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useMemo, useState } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import * as THREE from "three"
import { createDualProperties, type DualObjectProperties } from "@/engine/types/view-mode-config"
import { getViewModeConfig } from "@/engine/core/view-modes/compatibility"
import type { ViewType } from "@/lib/types/effects-level"

interface UnifiedCameraControllerProps {
  focusObject: THREE.Object3D | null
  focusName?: string | null
  focusRadius?: number
  focusSize?: number  // The actual visual size in the scene
  focusMass?: number
  focusOrbitRadius?: number
  viewMode: ViewType
  isPaused?: boolean  // Whether the simulation is paused
  systemData?: any  // System data for finding orbital relationships
  objectRefsMap?: React.MutableRefObject<Map<string, THREE.Object3D>>  // Object refs for finding related objects
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
    isPaused = false,
    systemData,
    objectRefsMap,
    onAnimationComplete,
  }: UnifiedCameraControllerProps, ref) {
    const { camera, controls, scene } = useThree()
    const controlsRef = useRef<any>(controls)
    const isFollowingRef = useRef(false)
    const animatingRef = useRef(false)
    const lastObjectPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
    const initialViewSetRef = useRef(false)
    const currentObjectPropertiesRef = useRef<DualObjectProperties | null>(null)
    // Track last object that triggered a focus animation so we can debounce
    const lastFocusedRef = useRef<THREE.Object3D | null>(null)
    // Track the fake outermost point for "No orbiting bodies" label
    const [noOrbitingBodiesLabel, setNoOrbitingBodiesLabel] = useState<{ position: THREE.Vector3; visible: boolean } | null>(null)
    // Smoothed label position to prevent jitter
    const [smoothedLabelPosition, setSmoothedLabelPosition] = useState<THREE.Vector3 | null>(null)

    useEffect(() => {
      controlsRef.current = controls
    }, [controls, focusObject])

    // Get current view mode configuration (memoized to prevent excessive re-calculations)
    const viewConfig = useMemo(() => getViewModeConfig(viewMode), [viewMode])

    // Calculate the furthest orbital radius in the system
    const calculateMaxOrbitRadius = useCallback(() => {
      let maxOrbitRadius = 0
      
      // First, try to calculate max orbital distance from system data
      if (systemData?.objects) {
        // Get view mode configuration for orbital scaling
        const { getOrbitalMechanicsConfig } = require('@/engine/core/view-modes/compatibility');
        const config = getOrbitalMechanicsConfig(viewMode);
        
        // Find the maximum orbital distance by checking all objects
        for (const obj of systemData.objects) {
          if (obj.orbit?.semi_major_axis) {
            // Calculate scaled orbital distance like the orbital mechanics calculator does
            const scaledDistance = obj.orbit.semi_major_axis * config.orbitScaling;
            maxOrbitRadius = Math.max(maxOrbitRadius, scaledDistance);
          }
        }
        
        console.log(`📏 Camera: Max orbital radius from system data: ${maxOrbitRadius} (viewMode: ${viewMode}, scaling: ${config.orbitScaling}x)`);
      }
      
      // Fallback: Find the largest orbit radius in the scene
      if (maxOrbitRadius === 0) {
        controlsRef.current?.object?.parent?.traverse((object: THREE.Object3D) => {
          if (object.userData.orbitRadius) {
            maxOrbitRadius = Math.max(maxOrbitRadius, object.userData.orbitRadius)
          }
        })
        console.log(`📏 Camera: Max orbital radius from scene traverse: ${maxOrbitRadius}`);
      }

      // Final fallback with more reasonable default for extreme systems
      if (maxOrbitRadius === 0) {
        maxOrbitRadius = 200; // Increased from 50 to handle larger systems
        console.log(`📏 Camera: Using fallback radius: ${maxOrbitRadius}`);
      }
      
      return maxOrbitRadius
    }, [systemData, viewMode])

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
      const viewingAngles = (viewConfig.cameraConfig as any).viewingAngles || { birdsEyeElevation: 40 }
      const angle = viewingAngles.birdsEyeElevation * (Math.PI / 180)
      
      // Smart distance calculation for extreme orbital ranges
      // If we have objects at vastly different distances (like Alpha Centauri + Proxima),
      // use a camera distance that's a compromise between seeing everything and detail
      let distance = maxOrbitRadius;
      
      if (systemData?.objects) {
        // Get view mode configuration for orbital scaling
        const { getOrbitalMechanicsConfig } = require('@/engine/core/view-modes/compatibility');
        const config = getOrbitalMechanicsConfig(viewMode);
        
        // Check if we have extreme distance differences (>100:1 ratio)
        const orbitalDistances = systemData.objects
          .filter(obj => obj.orbit?.semi_major_axis)
          .map(obj => obj.orbit.semi_major_axis * config.orbitScaling)
          .sort((a, b) => a - b);
          
        if (orbitalDistances.length > 1) {
          const minDist = orbitalDistances[0];
          const maxDist = orbitalDistances[orbitalDistances.length - 1];
          const ratio = maxDist / minDist;
          
          if (ratio > 100) {
            // For extreme systems like Alpha Centauri, use a compromise distance
            // that shows the inner objects (binary stars) clearly while keeping
            // the outer object (Proxima) accessible via manual zoom
            
            if (orbitalDistances.length <= 4) {
              // Small systems: exclude the farthest object and use 2nd farthest + margin
              const secondFarthest = orbitalDistances[orbitalDistances.length - 2];
              const compromise = secondFarthest * 2.0; // 2x margin for good framing
              distance = compromise;
              console.log(`📷 Camera: Small extreme system detected, using 2nd farthest (${secondFarthest.toFixed(0)}) * 2 = ${distance.toFixed(0)} instead of max: ${maxOrbitRadius.toFixed(0)}`);
            } else {
              // Larger systems: use 80th percentile approach
              const percentile80Index = Math.floor(orbitalDistances.length * 0.8);
              const compromise = orbitalDistances[percentile80Index] * 1.5;
              distance = Math.min(maxOrbitRadius, compromise);
              console.log(`📷 Camera: Large extreme system detected, using 80th percentile compromise: ${distance.toFixed(0)} instead of max: ${maxOrbitRadius.toFixed(0)}`);
            }
          }
        }
      }

      // Calculate position components for birds-eye view
      const horizontalDistance = distance * Math.cos(angle)
      const verticalDistance = distance * Math.sin(angle)

      // Position camera based on view mode
      let newPosition: THREE.Vector3
      if (viewMode === 'profile') {
        // Profile view: bird's-eye view to frame linear layout
        // Position camera to look at the center of the linear arrangement
        const profileDistance = maxOrbitRadius * 1.5
        const profileAngle = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
        newPosition = new THREE.Vector3(
          0, // Centered horizontally on the linear layout
          profileDistance * Math.sin(profileAngle),
          profileDistance * Math.cos(profileAngle)
        )
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
          // Profile view: bird's-eye view for linear layout
          const profileDistance = distance * 1.5
          const profileAngle = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
          camera.position.set(
            0, // Centered horizontally on the linear layout
            profileDistance * Math.sin(profileAngle),
            profileDistance * Math.cos(profileAngle)
          )
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

    // Handle view mode changes when object is already focused
    useEffect(() => {
      console.log('🔄 VIEW MODE CHANGE useEffect triggered')
      console.log('  📍 Focus object exists:', !!focusObject)
      console.log('  📍 Focus object type:', focusObject?.type)
      console.log('  🏷️ Focus name:', focusName)
      console.log('  📱 View mode:', viewMode)
      console.log('  🎮 Controls exist:', !!controlsRef.current)
      
      if (focusObject && controlsRef.current && viewMode === 'profile') {
        console.log('🔄 VIEW MODE CHANGE TO PROFILE - useEffect triggered')
        console.log('  📍 Focus object:', focusObject.userData?.name || 'unknown')
        
        // Wait for next frame to ensure orbital objects are positioned correctly
        requestAnimationFrame(() => {
          if (!focusObject || !controlsRef.current) return
          
          // When switching to profile view with an object selected, reframe the camera
          const focalCenter = new THREE.Vector3()
          focusObject.getWorldPosition(focalCenter)
        console.log('  🎯 Focal center (clicked object):', focalCenter)
        
        // Find the outermost object using hierarchical navigation logic
        let outermostCenter = focalCenter.clone() // Default to focal object if no others found
        let maxDistance = 0
        
        console.log('  🔎 Checking traversal conditions:')
        console.log('    🌐 scene exists:', !!scene)
        console.log('    🌐 scene type:', scene?.type)
        console.log('    🌐 scene children count:', scene?.children?.length)
        
        // Use system data to find orbital relationships instead of Three.js traversal
        let childObjects: any[] = []
        if (systemData && focusName && objectRefsMap) {
          console.log('  ✅ Using system data to find orbital relationships')
          console.log('  🔍 Looking for children of:', focusName)
          
          // Find objects that orbit the focused object
          // Check both by focusName and by the actual focused object's ID for cases like Sol/sol-star
          const focusedObjectData = systemData.objects?.find((obj: any) => 
            obj.name?.toLowerCase() === focusName.toLowerCase()
          )
          const focusedObjectId = focusedObjectData?.id
          
          childObjects = systemData.objects?.filter((obj: any) => 
            obj.orbit?.parent === focusName.toLowerCase() || 
            obj.orbit?.parent === focusedObjectId
          ) || []
          
          console.log('  📊 Found', childObjects.length, 'children in system data:', childObjects.map((obj: any) => obj.name))
          
          // Find the outermost child by getting their Three.js objects and measuring distance
          for (const childObj of childObjects) {
            const childThreeObj = objectRefsMap.current.get(childObj.id)
            if (childThreeObj) {
              let actualChildObject = childThreeObj
              
              // PROFILE VIEW FIX: If the ref is an orbital group, find the actual object inside
              if (childThreeObj.type === 'Group') {
                console.log('  🔧 Found orbital group for', childObj.name, '- searching for actual object inside')
                
                // Look for the actual object inside the group
                let foundChild = null
                childThreeObj.traverse((child: THREE.Object3D) => {
                  // Skip the group itself and find actual objects
                  if (child !== childThreeObj && 
                      (child.userData?.name === childObj.name || 
                       child.userData?.id === childObj.id ||
                       child.type === 'Mesh' || 
                       child.type === 'Object3D')) {
                    foundChild = child
                  }
                })
                
                if (foundChild) {
                  actualChildObject = foundChild
                  console.log('  ✅ Found actual', childObj.name, 'object inside group')
                } else {
                  console.log('  ⚠️ Could not find actual object inside group for', childObj.name)
                }
              }
              
              // Use getWorldPosition instead of .position for objects in orbital groups
              const childWorldPos = new THREE.Vector3()
              actualChildObject.getWorldPosition(childWorldPos)
              console.log('  📍', childObj.name, 'world position:', childWorldPos)
              
              const distance = focalCenter.distanceTo(childWorldPos)
              console.log('  📏 Distance from focal center:', distance)
              
              if (distance > maxDistance) {
                maxDistance = distance
                outermostCenter = childWorldPos.clone()
                console.log('  🎯 New outermost:', childObj.name, 'at distance', distance)
              }
            }
          }
          
          // If no children found, we'll create a fake outermost point below
          if (childObjects.length === 0) {
            console.log('  ❌ No children found - will use fake outermost point for single object')
          } else {
            // Object has children, so hide any existing "No orbiting bodies" label
            setNoOrbitingBodiesLabel(null)
          }
        } else {
          console.log('  ❌ Missing system data, focusName, or objectRefsMap - cannot find orbital relationships')
          console.log('    📊 systemData:', !!systemData)
          console.log('    🏷️ focusName:', focusName)
          console.log('    🗺️ objectRefsMap:', !!objectRefsMap)
        }
        
        // Calculate the midpoint between focal object and outermost object
        const layoutMidpoint = new THREE.Vector3()
        
        // If no related objects found (maxDistance is 0), create a fake outermost point for consistent framing
        if (maxDistance === 0) {
          console.log('  🎯 No related objects found - creating fake outermost point for consistent framing')
          
          // Get the object's data to find its radius and orbital distance
          const focusObjectData = systemData?.objects?.find((obj: any) => 
            obj.name?.toLowerCase() === focusName?.toLowerCase()
          )
          
          const objectRadius = focusObjectData?.properties?.radius || 1
          const orbitDistance = focusObjectData?.orbit?.semi_major_axis || 10
          
          // Create a fake outermost point close to the object for reasonable framing
          // Use the actual rendered scale of the object in the scene
          const objectScale = focusObject?.scale?.x || 1.0 // Get actual rendered size
          const fakeOffset = objectScale * 3 // Offset based on actual rendered size
          console.log('    📏 Object scale in scene:', objectScale)
          console.log('    🎯 Current object distance from origin:', focalCenter.length())
          console.log('    📏 Using scale-based fake offset:', fakeOffset)
          
          // Create fake point by moving slightly away from the object in the X direction (simple offset)
          outermostCenter = focalCenter.clone().add(new THREE.Vector3(fakeOffset, 0, 0))
          maxDistance = focalCenter.distanceTo(outermostCenter)
          
          console.log('    🎭 Fake outermost center:', outermostCenter)
          console.log('    📏 Fake max distance:', maxDistance)
          
          // Show "No orbiting bodies" label at the fake outermost point
          setNoOrbitingBodiesLabel({
            position: outermostCenter.clone(),
            visible: true
          })
        }
        
        // Calculate midpoint (now always between focal and outermost, real or fake)
        layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
        
        console.log('  📊 FINAL CALCULATIONS:')
        console.log('    🎯 Focal center:', focalCenter)
        console.log('    🎪 Outermost center:', outermostCenter)
        console.log('    ⚖️ Layout midpoint:', layoutMidpoint)
        
        // Calculate distance and position camera
        const layoutSpan = focalCenter.distanceTo(outermostCenter)
        let profileDistance: number
        
        // Check if we found actual child objects or used a fake outermost point
        if (childObjects.length === 0) {
          // No child objects found - use fixed reasonable distance for single objects
          profileDistance = 15
          console.log('    🎯 Using fixed distance for single object (no children):', profileDistance)
        } else {
          // Real child objects found - use layout span calculation
          profileDistance = Math.max(layoutSpan * 1.2, 20)
          console.log('    🌌 Using layout span distance (with children):', profileDistance)
        }
        
        const profileAngle = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
        
        const newCameraPosition = new THREE.Vector3(
          layoutMidpoint.x,
          layoutMidpoint.y + profileDistance * Math.sin(profileAngle),
          layoutMidpoint.z + profileDistance * Math.cos(profileAngle)
        )
        
        console.log('    📏 Layout span:', layoutSpan)
        console.log('    📐 Profile distance:', profileDistance)
        console.log('    📐 Profile angle (degrees):', profileAngle * (180 / Math.PI))
        console.log('    📷 New camera position:', newCameraPosition)
        console.log('    🎯 Camera target (should be midpoint):', layoutMidpoint)
        
          camera.position.set(newCameraPosition.x, newCameraPosition.y, newCameraPosition.z)
          controlsRef.current.target.copy(layoutMidpoint)
          controlsRef.current.update()
          
          console.log('  ✅ VIEW MODE CHANGE COMPLETE')
        })
      } else {
        // Hide label when not in profile mode or no focus object
        setNoOrbitingBodiesLabel(null)
      }
    }, [viewMode, focusObject, camera, viewConfig, systemData, objectRefsMap])

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
      console.log('🎯 OBJECT FOCUS useEffect triggered')
      console.log('  📍 Focus object exists:', !!focusObject)
      console.log('  📍 Focus object type:', focusObject?.type)
      console.log('  📍 Focus object position:', focusObject?.position)
      console.log('  📍 Focus object userData:', focusObject?.userData)
      console.log('  🏷️ Focus name:', focusName || 'null')
      console.log('  📱 View mode:', viewMode)
      
      // Debounce: if we are already animating towards the same object, ignore
      // BUT allow re-selection when paused to ensure objects can be focused when simulation is paused
      if (animatingRef.current && focusObject && focusObject === lastFocusedRef.current && !isPaused) {
        console.log('  ⏸️ Debounced - already animating to same object')
        return
      }

      if (focusObject && controlsRef.current && focusName) {
        console.log('  🚀 Starting object focus animation')
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

                // ⚠️ CRITICAL: Base camera distance on the VISUAL size with consistent multiplier
        // This ensures objects with same visual size get same camera distance regardless of view mode
        // DO NOT use real radius or view-mode-specific multipliers - this breaks framing consistency
        const actualVisualSize = focusSize || focusObject.scale?.x || 1.0 // Visual size in 3D scene



        
        

        
        // Use consistent radius multiplier across all view modes for consistent visual framing
        const CONSISTENT_RADIUS_MULTIPLIER = 4.0  // Same visual size = same camera distance
        const CONSISTENT_MIN_MULTIPLIER = 2.5     // Minimum distance multiplier  
        const CONSISTENT_MAX_MULTIPLIER = 15.0    // Maximum distance multiplier
        
        // Calculate camera distance based on VISUAL size (consistent framing)
        const optimalDistance = actualVisualSize * CONSISTENT_RADIUS_MULTIPLIER
        const minDistance = actualVisualSize * CONSISTENT_MIN_MULTIPLIER
        const maxDistance = actualVisualSize * CONSISTENT_MAX_MULTIPLIER
        

        
        // Apply view-mode specific absolute constraints but use consistent relative distances
        const cameraConfig = viewConfig.cameraConfig
        const absoluteMinDistance = (cameraConfig as any).absoluteMinDistance || 0.1
        const absoluteMaxDistance = (cameraConfig as any).absoluteMaxDistance || 1000
        
        // Apply constraints while maintaining consistent framing
        const targetDistance = Math.max(
          Math.min(
            Math.max(optimalDistance, absoluteMinDistance),
            absoluteMaxDistance
          ),
          Math.max(minDistance, actualVisualSize * 2.0) // Safety margin: never closer than 2x radius
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
          console.log('  🎪 PROFILE VIEW - Object focus effect')
          
          // Profile view: Frame using focal object and outermost object midpoint
          const focalCenter = position.clone()
          let outermostCenter = position.clone() // Default to focal object if no others found
          let maxDistance = 0
          console.log('  🎯 Object focus - Focal center:', focalCenter)
          
          // Find the outermost object using hierarchical navigation logic
          console.log('  🔎 Object focus - Checking traversal conditions:')
          console.log('    🌐 scene exists:', !!scene)
          console.log('    🌐 scene children count:', scene?.children?.length)
          
          // Use system data to find orbital relationships instead of Three.js traversal
          let childObjects: any[] = []
          if (systemData && focusName && objectRefsMap) {
            console.log('  ✅ Object focus - Using system data to find orbital relationships')
            console.log('  🔍 Looking for children of:', focusName)
            
            // Find objects that orbit the focused object
            // Check both by focusName and by the actual focused object's ID for cases like Sol/sol-star
            const focusedObjectData = systemData.objects?.find((obj: any) => 
              obj.name?.toLowerCase() === focusName.toLowerCase()
            )
            const focusedObjectId = focusedObjectData?.id
            
            childObjects = systemData.objects?.filter((obj: any) => 
              obj.orbit?.parent === focusName.toLowerCase() || 
              obj.orbit?.parent === focusedObjectId
            ) || []
            
            console.log('  📊 Found', childObjects.length, 'children in system data:', childObjects.map((obj: any) => obj.name))
            
            // Find the outermost child by getting their Three.js objects and measuring distance
            for (const childObj of childObjects) {
              const childThreeObj = objectRefsMap.current.get(childObj.id)
              if (childThreeObj) {
                let actualChildObject = childThreeObj
                
                // PROFILE VIEW FIX: If the ref is an orbital group, find the actual object inside
                if (childThreeObj.type === 'Group') {
                  console.log('  🔧 Object focus - Found orbital group for', childObj.name, '- searching for actual object inside')
                  
                  // Look for the actual object inside the group
                  let foundChild = null
                  childThreeObj.traverse((child: THREE.Object3D) => {
                    // Skip the group itself and find actual objects
                    if (child !== childThreeObj && 
                        (child.userData?.name === childObj.name || 
                         child.userData?.id === childObj.id ||
                         child.type === 'Mesh' || 
                         child.type === 'Object3D')) {
                      foundChild = child
                    }
                  })
                  
                  if (foundChild) {
                    actualChildObject = foundChild
                    console.log('  ✅ Object focus - Found actual', childObj.name, 'object inside group')
                  } else {
                    console.log('  ⚠️ Object focus - Could not find actual object inside group for', childObj.name)
                  }
                }
                
                // Use getWorldPosition instead of .position for objects in orbital groups
                const childWorldPos = new THREE.Vector3()
                actualChildObject.getWorldPosition(childWorldPos)
                console.log('  📍 Object focus -', childObj.name, 'world position:', childWorldPos)
                
                const distance = focalCenter.distanceTo(childWorldPos)
                console.log('  📏 Object focus - Distance from focal center:', distance)
                
                if (distance > maxDistance) {
                  maxDistance = distance
                  outermostCenter = childWorldPos.clone()
                  console.log('  🎯 Object focus - New outermost:', childObj.name, 'at distance', distance)
                }
              }
            }
            
            // If no children found, we'll create a fake outermost point below
            if (childObjects.length === 0) {
              console.log('  ❌ Object focus - No children found - will use fake outermost point for single object')
            } else {
              // Object has children, so hide any existing "No orbiting bodies" label
              setNoOrbitingBodiesLabel(null)
            }
          } else {
            console.log('  ❌ Missing system data, focusName, or objectRefsMap - cannot find orbital relationships')
            console.log('    📊 systemData:', !!systemData)
            console.log('    🏷️ focusName:', focusName)
            console.log('    🗺️ objectRefsMap:', !!objectRefsMap)
          }
          
          // Calculate the midpoint between focal object and outermost object
          const layoutMidpoint = new THREE.Vector3()
          
          // If no related objects found (maxDistance is 0), create a fake outermost point for consistent framing
          if (maxDistance === 0) {
            console.log('  🎯 Object focus - No related objects found - creating fake outermost point for consistent framing')
            
            // Get the object's data to find its radius and orbital distance
            const focusObjectData = systemData?.objects?.find((obj: any) => 
              obj.name?.toLowerCase() === focusName?.toLowerCase()
            )
            
            const objectRadius = focusObjectData?.properties?.radius || 1
            const orbitDistance = focusObjectData?.orbit?.semi_major_axis || 10
            
            // Create a fake outermost point close to the object for reasonable framing
            // Use the actual visual size passed to this component
            const actualVisualSize = focusSize || focusObject?.scale?.x || 1.0
            const fakeOffset = actualVisualSize * 3 // Offset based on actual rendered size
            console.log('    📏 Object focus - Visual size:', actualVisualSize)
            console.log('    🎯 Object focus - Current object distance from origin:', focalCenter.length())
            console.log('    📏 Object focus - Using visual-based fake offset:', fakeOffset)
            
            // Create fake point by moving slightly away from the object in the X direction (simple offset)
            outermostCenter = focalCenter.clone().add(new THREE.Vector3(fakeOffset, 0, 0))
            maxDistance = focalCenter.distanceTo(outermostCenter)
            
            console.log('    🎭 Object focus - Fake outermost center:', outermostCenter)
            console.log('    📏 Object focus - Fake max distance:', maxDistance)
            
            // Show "No orbiting bodies" label at the fake outermost point
            setNoOrbitingBodiesLabel({
              position: outermostCenter.clone(),
              visible: true
            })
          }
          
          // Calculate midpoint (now always between focal and outermost, real or fake)
          layoutMidpoint.addVectors(focalCenter, outermostCenter).multiplyScalar(0.5)
          
          console.log('  📊 OBJECT FOCUS - FINAL CALCULATIONS:')
          console.log('    🎯 Focal center:', focalCenter)
          console.log('    🎪 Outermost center:', outermostCenter)
          console.log('    ⚖️ Layout midpoint:', layoutMidpoint)
          
          // Calculate distance from focal to outermost for camera positioning
          const layoutSpan = focalCenter.distanceTo(outermostCenter)
          let profileDistance: number
          
          // Check if we found actual child objects or used a fake outermost point
          if (childObjects.length === 0) {
            // No child objects found - use target distance for single object
            profileDistance = targetDistance * 1.5
            console.log('    🎯 Object focus - Using target distance for single object (no children):', profileDistance)
          } else {
            // Real child objects found - use layout span calculation
            profileDistance = Math.max(layoutSpan * 1.2, targetDistance * 1.5)
            console.log('    🌌 Object focus - Using layout span distance (with children):', profileDistance)
          }
          
          const profileAngle = viewConfig.cameraConfig.viewingAngles.defaultElevation * (Math.PI / 180)
          
          // Position camera to look at the midpoint
          newPosition = new THREE.Vector3(
            layoutMidpoint.x, // Center on the layout midpoint
            layoutMidpoint.y + profileDistance * Math.sin(profileAngle),
            layoutMidpoint.z + profileDistance * Math.cos(profileAngle)
          )
          newTarget = layoutMidpoint.clone()
          
          console.log('    📏 Layout span:', layoutSpan)
          console.log('    📐 Profile distance:', profileDistance)
          console.log('    📷 New camera position:', newPosition)
          console.log('    🎯 New camera target:', newTarget)
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
        // Hide label when no object is focused
        setNoOrbitingBodiesLabel(null)
        if (controlsRef.current) {
          controlsRef.current.enabled = true
        }
      }
    }, [focusObject, focusName, focusRadius, focusSize, focusMass, focusOrbitRadius, viewMode, camera, viewConfig, createEasingFunction, onAnimationComplete])

    // Continuously follow the focused object with smoothed tracking
    useFrame((state, delta) => {
      if (focusObject && controlsRef.current && isFollowingRef.current && !animatingRef.current) {
        const currentPosition = new THREE.Vector3()
        focusObject.getWorldPosition(currentPosition)

        // Calculate movement delta
        const deltaPosition = new THREE.Vector3().subVectors(currentPosition, lastObjectPositionRef.current)

        // ANTI-JITTER FIX: Use frame rate adaptive threshold and smoothing
        const visualSize = focusSize || focusRadius || 1.0
        const frameAdaptiveThreshold = Math.max(visualSize * 0.001, 1e-8) // Much smaller threshold
        
        // Only move if there's significant movement to avoid jitter
        if (deltaPosition.length() > frameAdaptiveThreshold) {
          // SMOOTHING: Apply exponential smoothing to reduce jitter
          const smoothingFactor = Math.min(delta * 8, 0.3) // Responsive but smooth
          const smoothedDelta = deltaPosition.multiplyScalar(smoothingFactor)
          
          // Move camera smoothly
          camera.position.add(smoothedDelta)
          controlsRef.current.target.add(smoothedDelta)
          
          // REDUCED UPDATE FREQUENCY: Only update controls every few frames to reduce jitter
          // Update immediately for large movements, throttle for small movements
          const isLargeMovement = deltaPosition.length() > visualSize * 0.01
          
          if (isLargeMovement || Math.random() < 0.3) { // Update 30% of frames for small movements
            controlsRef.current.update()
          }

          // Update stored position with smoothed movement
          lastObjectPositionRef.current.add(smoothedDelta)
        }
      }
      
      // LABEL SMOOTHING: Smooth the label position separately to prevent HTML jitter
      if (noOrbitingBodiesLabel?.visible && noOrbitingBodiesLabel.position) {
        if (!smoothedLabelPosition) {
          // Initialize smoothed position
          setSmoothedLabelPosition(noOrbitingBodiesLabel.position.clone())
        } else {
          // Smooth the label position with gentle interpolation
          const targetPos = noOrbitingBodiesLabel.position
          const currentPos = smoothedLabelPosition
          const labelDelta = new THREE.Vector3().subVectors(targetPos, currentPos)
          
          if (labelDelta.length() > 0.01) {
            const labelSmoothingFactor = Math.min(delta * 2, 0.1) // Very gentle for labels
            const smoothedLabelDelta = labelDelta.multiplyScalar(labelSmoothingFactor)
            const newSmoothedPos = currentPos.clone().add(smoothedLabelDelta)
            setSmoothedLabelPosition(newSmoothedPos)
          }
        }
      } else if (!noOrbitingBodiesLabel?.visible) {
        // Clear smoothed position when label is hidden
        setSmoothedLabelPosition(null)
      }
    })
    
    // Fallback reactive tracking method
    const fallbackToReactiveTracking = useCallback(() => {
      if (focusObject && controlsRef.current && isFollowingRef.current && !animatingRef.current) {
        const currentPosition = new THREE.Vector3()
        focusObject.getWorldPosition(currentPosition)

        const deltaPosition = new THREE.Vector3().subVectors(currentPosition, lastObjectPositionRef.current)
        const visualSize = focusSize || focusRadius || 1.0
        const adaptiveThreshold = Math.max(visualSize * 0.01, 1e-6)
        
        if (deltaPosition.length() > adaptiveThreshold) {
          camera.position.add(deltaPosition)
          controlsRef.current.target.add(deltaPosition)
          controlsRef.current.update()
          lastObjectPositionRef.current.copy(currentPosition)
        }
      }
    }, [focusObject, camera, focusSize, focusRadius])

    return (
      <>
        {/* No orbiting bodies label */}
        {noOrbitingBodiesLabel?.visible && smoothedLabelPosition && (
          <group position={[smoothedLabelPosition.x, smoothedLabelPosition.y, smoothedLabelPosition.z]}>
            <Html center prepend zIndexRange={[100, 0]} occlude={false} sprite>
              <div
                className="text-gray-400 text-xs font-medium transition-all duration-300 ease-out"
                style={{
                  textShadow: "0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)",
                  filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  pointerEvents: "none",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  transform: "translateX(-50%) translateY(-50%)",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                }}
              >
                <div className="font-medium text-gray-400 uppercase tracking-wider">
                  No orbiting bodies
                </div>
              </div>
            </Html>
          </group>
        )}
      </>
    )
  }
) 