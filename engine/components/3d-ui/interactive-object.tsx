"use client"

import React from "react"
import * as THREE from "three"
import { useRef, useState, useMemo, useCallback, useEffect } from "react"
import { useThree, useFrame, extend } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { SpaceCurvatureMaterial } from "./materials/space-curvature-material"

declare module '@react-three/fiber' {
  interface ThreeElements {
    spaceCurvatureMaterial: JSX.IntrinsicElements['shaderMaterial']
  }
}

// Extend R3F with our custom material
extend({ SpaceCurvatureMaterial })

export interface InteractiveObjectProps {
  objectId: string
  objectName: string
  objectType: "star" | "planet" | "moon" | "station"
  radius: number
  position?: [number, number, number]
  visualSize?: number
  shaderScale?: number
  isSelected?: boolean
  onHover?: (objectId: string, isHovered: boolean) => void
  onSelect?: (objectId: string, object: THREE.Object3D, name: string) => void
  onFocus?: (object: THREE.Object3D, name: string, visualSize?: number) => void
  registerRef?: (id: string, ref: THREE.Object3D) => void
  showLabel?: boolean
  labelAlwaysVisible?: boolean
  parentObjectSelected?: boolean
  planetSystemSelected?: boolean
  children: React.ReactNode
}

export function InteractiveObject({
  objectId,
  objectName,
  objectType,
  radius,
  position = [0, 0, 0],
  visualSize = 1,
  shaderScale,
  isSelected = false,
  onHover,
  onSelect,
  onFocus,
  registerRef,
  showLabel = true,
  labelAlwaysVisible = false,
  parentObjectSelected = false,
  planetSystemSelected = false,
  children,
}: InteractiveObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const labelGroupRef = useRef<THREE.Group>(null!)
  const materialRef = useRef<any>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isLabelHovered, setIsLabelHovered] = useState(false)
  const { camera } = useThree()

  const offsetVec = useRef(new THREE.Vector3())
  const worldPos = useRef(new THREE.Vector3())
  const cameraDir = useRef(new THREE.Vector3())
  const cameraUp = useRef(new THREE.Vector3())
  const cameraRight = useRef(new THREE.Vector3())
  const cameraLeft = useRef(new THREE.Vector3())
  const desiredOffset = useRef(new THREE.Vector3())
  const currentOffset = useRef(new THREE.Vector3())

  // Memoize label visibility calculation
  const shouldShowLabel = useMemo(() => {
    if (!showLabel) return false
    if (objectType === "star" || objectType === "planet") return true
    if (objectType === "moon" || objectType === "station") {
      return planetSystemSelected || isHovered || isSelected || labelAlwaysVisible
    }
    return false
  }, [showLabel, objectType, parentObjectSelected, isHovered, isSelected, labelAlwaysVisible, planetSystemSelected])

  // Update shader uniforms only when selected
  useFrame((state) => {
    if (!materialRef.current || !isSelected) return;

    materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    materialRef.current.uniforms.intensity.value = 1.0;

    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);
      if (materialRef.current.uniforms.spherePosition) {
        materialRef.current.uniforms.spherePosition.value.copy(worldPos.current);
        materialRef.current.uniforms.sphereRadius.value = radius;
      }
    }
  })

  // Optimize label positioning
  useFrame(() => {
    if (!groupRef.current || !shouldShowLabel || !labelGroupRef.current) return

    // Get world position and camera direction
    groupRef.current.getWorldPosition(worldPos.current)
    camera.getWorldDirection(cameraDir.current)
    cameraUp.current.copy(camera.up).normalize()
    cameraRight.current.crossVectors(cameraDir.current, cameraUp.current).normalize()
    cameraLeft.current.copy(cameraRight.current).negate()

    // Calculate distance-based offset
    const distance = camera.position.distanceTo(worldPos.current)
    const minOffset = radius * 1.3
    const maxOffset = radius * 10
    const offsetAmount = THREE.MathUtils.clamp(
      (distance * 0.075 + radius * 2) / 2,
      minOffset,
      maxOffset
    )

    // Calculate desired offset
    desiredOffset.current.copy(cameraLeft.current).multiplyScalar(offsetAmount)

    // Smoothly interpolate current offset towards desired offset
    currentOffset.current.lerp(desiredOffset.current, 0.2)

    // Update label group position
    labelGroupRef.current.position.copy(currentOffset.current)
  })

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (groupRef.current && onSelect) {
      onSelect(objectId, groupRef.current, objectName)
    }
  }, [objectId, objectName, onSelect])

  const handleLabelClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (groupRef.current && onSelect) {
      onSelect(objectId, groupRef.current, objectName)
    }
  }, [objectId, objectName, onSelect])

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation()
    setIsHovered(true)
    document.body.style.cursor = "pointer"
    if (onHover) onHover(objectId, true)
  }, [objectId, onHover])

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation()
    setIsHovered(false)
    document.body.style.cursor = "auto"
    if (onHover) onHover(objectId, false)
  }, [objectId, onHover])

  const CollisionMesh = useMemo(() => (
    <mesh
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <sphereGeometry args={[radius, 16, 16]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  ), [radius, handlePointerOver, handlePointerOut, handleClick])

  // Register this object's ref with parent map
  useEffect(() => {
    if (groupRef.current && registerRef) {
      registerRef(objectId, groupRef.current)
    }
    return () => {
      if (registerRef) {
        registerRef(objectId, null as any)
      }
    }
  }, [objectId, registerRef])

  return (
    <group ref={groupRef} position={position}>
      {CollisionMesh}
      {children}

      {/* Space Curvature Effect */}
      {isSelected && (
        <mesh
          position={[0, -radius * 0.3, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ selectable: false }}
        >
          <planeGeometry args={[radius * 12, radius * 12, 64, 64]} />
          <spaceCurvatureMaterial
            ref={materialRef}
            transparent={true}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {shouldShowLabel && (
        <group ref={labelGroupRef}>
          <Html center prepend zIndexRange={[100, 0]} occlude={false} sprite>
            <div
              className={`
              text-white text-sm font-medium transition-all duration-300 ease-out cursor-pointer
              ${isSelected ? "opacity-100 scale-110" : isHovered || isLabelHovered ? "opacity-90 scale-105" : "opacity-70"}
              hover:opacity-100 hover:scale-105
            `}
              style={{
                textShadow: "0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))",
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                pointerEvents: "auto",
                textAlign: "right",
                whiteSpace: "nowrap",
                transform: "translateX(-50%) translateY(-50%)",
                position: "absolute",
                top: "50%",
                left: "0",
              }}
              onClick={handleLabelClick}
              onMouseEnter={() => {
                setIsLabelHovered(true)
                document.body.style.cursor = "pointer"
                if (onHover) onHover(objectId, true)
              }}
              onMouseLeave={() => {
                setIsLabelHovered(false)
                document.body.style.cursor = "auto"
                if (onHover) onHover(objectId, false)
              }}
              data-testid="html-label"
            >
              <div
                className={`font-bold transition-colors duration-200 ${
                  objectType === "star"
                    ? "text-orange-300 hover:text-orange-200"
                    : objectType === "planet"
                      ? "text-blue-300 hover:text-blue-200"
                      : objectType === "moon"
                        ? "text-purple-300 hover:text-purple-200"
                        : "text-pink-300 hover:text-pink-200"
                }`}
              >
                {objectName.toUpperCase()}
              </div>
              <div className="text-xs text-gray-300 uppercase tracking-wider hover:text-gray-200 transition-colors duration-200">
                {objectType}
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}