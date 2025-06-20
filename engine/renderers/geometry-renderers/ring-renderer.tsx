"use client"

import React, { useRef } from "react"
import * as THREE from "three"
import { PlanetRingsRenderer } from "./planet-rings-renderer"
import type { GeometryRendererProps } from "./types"

/**
 * Ring renderer for standalone ring systems (not attached to planets)
 * Used for ring geometry_type objects
 */
export function RingRenderer({
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
  const ringRef = useRef<THREE.Group>(null)

  const { properties } = object

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (ringRef.current && onSelect) {
      onSelect(object.id, ringRef.current, object.name)
    }
  }

  // Register ref for external access
  React.useEffect(() => {
    if (ringRef.current) {
      registerRef(object.id, ringRef.current)
    }
  }, [object.id, registerRef])

  return (
    <group 
      ref={ringRef} 
      position={position}
      onClick={handleClick}
      onPointerEnter={() => onHover?.(object.id)}
      onPointerLeave={() => onHover?.(null)}
    >
      <PlanetRingsRenderer
        planetRadius={0.1} // Small invisible center
        innerRadius={scale * 0.5}
        outerRadius={scale * 2.0}
        color={properties.ring_color || "#c0c0c0"}
        transparency={1 - (properties.ring_opacity || 50) / 100}
        divisions={6}
        noiseScale={0.5}
        noiseStrength={0.3}
        dustDensity={properties.ring_density === 'dense' ? 0.9 : properties.ring_density === 'moderate' ? 0.6 : 0.3}
        shadowIntensity={0.3}
        lightPosition={starPosition}
      />
    </group>
  )
}

// Ring renderer doesn't support additional rings
;(RingRenderer as any).supportsRings = false 