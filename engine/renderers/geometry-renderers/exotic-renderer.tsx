"use client"

import React, { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { GeometryRendererProps } from "./types"

/**
 * Exotic renderer for black holes, pulsars, and other phenomena using shader projections.
 * Features: event horizons, gravitational lensing (simulated), accretion disks.
 */
export function ExoticRenderer({
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
  const exoticRef = useRef<THREE.Group>(null)

  const { properties } = object
  const radius = scale

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    // Add any specific exotic object animations here
    if (exoticRef.current) {
      // Example: simple rotation for now, could be replaced with more complex shader effects
      exoticRef.current.rotation.y += 0.005
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (exoticRef.current && onSelect) {
      onSelect(object.id, exoticRef.current, object.name)
    }
  }

  // Register ref for external access
  React.useEffect(() => {
    if (exoticRef.current) {
      registerRef(object.id, exoticRef.current)
    }
  }, [object.id, registerRef])

  // For black holes, we can simulate an event horizon and accretion disk
  const isBlackHole = object.classification === 'compact-object' && (properties.mass || 0) > 1000 // Placeholder for black hole logic

  return (
    <group ref={exoticRef} position={position}>
      {isBlackHole ? (
        // Black hole rendering with basic visual representation for now
        <group>
          <mesh 
            onClick={handleClick}
            onPointerEnter={() => onHover?.(object.id)}
            onPointerLeave={() => onHover?.(null)}
          >
            {/* Event Horizon (placeholder for advanced shader) */}
            <sphereGeometry args={[radius, 32, 32]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* Accretion Disk */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 1.5, radius * 3.0, 64]} />
            <meshBasicMaterial
              color={properties.tint || "#ff4500"}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ) : (
        // Generic exotic object placeholder (e.g., for pulsars or other phenomena)
        <mesh 
          onClick={handleClick}
          onPointerEnter={() => onHover?.(object.id)}
          onPointerLeave={() => onHover?.(null)}
        >
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial color={properties.tint || "#8A2BE2"} wireframe={true} />
        </mesh>
      )}
    </group>
  )
}

// Exotic objects don't support rings naturally
;(ExoticRenderer as any).supportsRings = false 