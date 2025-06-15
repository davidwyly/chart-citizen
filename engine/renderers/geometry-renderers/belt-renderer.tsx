"use client"

import React, { useRef } from "react"
import * as THREE from "three"
import type { GeometryRendererProps } from "./types"

/**
 * Belt renderer for asteroid belts, Kuiper belts, and other debris fields
 * Features: torus geometry, particle density, composition-based coloring
 */
export function BeltRenderer({
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
  const beltRef = useRef<THREE.Group>(null)

  const { properties } = object

  // Belt properties from orbital data
  const innerRadius = scale * 0.8
  const outerRadius = scale * 1.2
  const beltRadius = (innerRadius + outerRadius) / 2
  const beltWidth = (outerRadius - innerRadius) / 2

  // Belt appearance properties
  const density = properties.belt_density || 'moderate'
  const particleSize = properties.particle_size || 'medium'
  const brightness = (properties.brightness || 50) / 100
  const tint = properties.tint || "#666666"

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (beltRef.current && onSelect) {
      onSelect(object.id, beltRef.current, object.name)
    }
  }

  // Register ref for external access
  React.useEffect(() => {
    if (beltRef.current) {
      registerRef(object.id, beltRef.current)
    }
  }, [object.id, registerRef])

  // Calculate opacity based on density
  const opacity = density === 'dense' ? 0.4 : density === 'moderate' ? 0.25 : 0.1

  return (
    <group 
      ref={beltRef} 
      position={position}
      onClick={handleClick}
      onPointerEnter={() => onHover?.(object.id)}
      onPointerLeave={() => onHover?.(null)}
    >
      {/* Main belt torus */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[beltRadius, beltWidth, 16, 64]} />
        <meshBasicMaterial 
          color={tint}
          opacity={opacity}
          transparent={true}
        />
      </mesh>

      {/* Add some variation with multiple torus rings for density */}
      {density === 'dense' && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[beltRadius * 0.9, beltWidth * 0.5, 8, 32]} />
            <meshBasicMaterial 
              color={tint}
              opacity={opacity * 0.5}
              transparent={true}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[beltRadius * 1.1, beltWidth * 0.3, 8, 32]} />
            <meshBasicMaterial 
              color={tint}
              opacity={opacity * 0.3}
              transparent={true}
            />
          </mesh>
        </>
      )}

      {/* Individual asteroids for close viewing */}
      {particleSize === 'large' && (
        <group>
          {Array.from({ length: 20 }, (_, i) => {
            const angle = (i / 20) * Math.PI * 2
            const radius = beltRadius + (Math.random() - 0.5) * beltWidth
            const x = Math.cos(angle) * radius
            const z = Math.sin(angle) * radius
            const y = (Math.random() - 0.5) * beltWidth * 0.2

            return (
              <mesh key={i} position={[x, y, z]}>
                <boxGeometry args={[0.01, 0.01, 0.01]} />
                <meshBasicMaterial color={tint} />
              </mesh>
            )
          })}
        </group>
      )}
    </group>
  )
}

// Belt renderer doesn't support rings
;(BeltRenderer as any).supportsRings = false 