"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface SpaceCurvatureEffectProps {
  targetObject: THREE.Object3D | null
  objectRadius: number
  intensity?: number
  gridScale?: number
  fadeDistance?: number
  visible: boolean
  debug?: boolean
}

export function SpaceCurvatureEffect({
  targetObject,
  objectRadius,
  intensity = 1.0,
  gridScale = 0.1,
  fadeDistance = 10.0,
  visible,
  debug = false,
}: SpaceCurvatureEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.Material>(null)

  // Track if we're using debug mode
  const [isDebugMode, setIsDebugMode] = useState(debug)

  // Calculate grid size to be proportional to object radius
  // All objects get a grid that's 12x their radius, ensuring consistent relative appearance
  const gridSize = objectRadius * 12

  // Calculate a more appropriate offset based on object size
  // Larger objects need more clearance to avoid intersection
  const verticalOffset = Math.max(objectRadius * 0.3, 2.0)

  // Log when component mounts/unmounts to verify it's being rendered
  useEffect(() => {
    console.log("SpaceCurvatureEffect mounted", {
      visible,
      objectRadius,
      gridSize,
      verticalOffset,
      targetObjectName: targetObject?.userData?.name || "unknown",
    })
    return () => console.log("SpaceCurvatureEffect unmounted")
  }, [visible, objectRadius, gridSize, verticalOffset, targetObject])

  // Update position immediately when target changes (handles paused state)
  useEffect(() => {
    if (!targetObject || !visible || !groupRef.current) return

    const updatePosition = () => {
      if (!targetObject || !groupRef.current) return
      
      // Get target object world position
      const targetPosition = new THREE.Vector3()
      targetObject.getWorldPosition(targetPosition)

      // Position the grid with adaptive offset based on object size
      groupRef.current.position.copy(targetPosition)
      groupRef.current.position.y -= verticalOffset
    }

    // Update immediately
    updatePosition()

    // Set up interval to update position even when paused
    const interval = setInterval(updatePosition, 16) // ~60fps
    
    return () => clearInterval(interval)
  }, [targetObject, visible, verticalOffset])

  useFrame(() => {
    if (!targetObject || !visible || !groupRef.current) return

    // Still use useFrame for smooth updates when not paused
    const targetPosition = new THREE.Vector3()
    targetObject.getWorldPosition(targetPosition)

    groupRef.current.position.copy(targetPosition)
    groupRef.current.position.y -= verticalOffset

    // Toggle debug mode every 3 seconds to test different materials
    if (Math.floor(Date.now() / 3000) % 2 === 0 && !debug) {
      setIsDebugMode(true)
    } else if (!debug) {
      setIsDebugMode(false)
    }
  })

  if (!visible || !targetObject) {
    return null
  }

  return (
    <group ref={groupRef} userData={{ selectable: false }}>
      {/* Use a basic material first to verify visibility */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} userData={{ selectable: false }}>
        <planeGeometry args={[gridSize, gridSize, 32, 32]} />
        <meshBasicMaterial
          ref={materialRef}
          color={isDebugMode ? "lime" : "blue"}
          transparent={true}
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
