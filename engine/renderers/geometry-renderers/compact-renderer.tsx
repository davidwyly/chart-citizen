"use client"

import React, { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { GeometryRendererProps } from "./types"

/**
 * Compact renderer for neutron stars, black holes, and other compact objects
 * Features: event horizons, accretion disks, gravitational lensing effects
 */
export function CompactRenderer({
  object,
  scale,
  starPosition = [0, 0, 0],
  position = [0, 0, 0],
  isSelected,
  onHover,
  onSelect,
  onFocus,
  registerRef,
}: GeometryRendererProps) {
  const compactRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)

  const { properties } = object
  const radius = scale

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    // Extremely fast rotation for neutron stars, gravitational effects for black holes
    if (compactRef.current) {
      compactRef.current.rotation.y += 0.1 // Very fast rotation
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (compactRef.current && onSelect) {
      onSelect(object.id, compactRef.current, object.name)
    }
  }

  // Register ref for external access
  React.useEffect(() => {
    if (compactRef.current) {
      registerRef(object.id, compactRef.current)
    }
  }, [object.id, registerRef])

  return (
    <group ref={compactRef} position={position}>
      {/* Neutron star - extremely dense and bright */}
      <mesh 
        ref={coreRef}
        onClick={handleClick}
        onPointerEnter={() => onHover?.(object.id)}
        onPointerLeave={() => onHover?.(null)}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2.0}
          metalness={1.0}
        />
      </mesh>
    </group>
  )
}

// Compact objects don't support rings
;(CompactRenderer as any).supportsRings = false 