"use client"

import React from "react"
import type { GeometryRendererProps } from "./types"
import type { GeometryType } from "@/engine/types/orbital-system"

// Import geometry-specific renderers
import { TerrestrialRenderer } from "./terrestrial-renderer"
import { RockyRenderer } from "./rocky-renderer"
import { GasGiantRenderer } from "./gas-giant-renderer"
import { StarRenderer } from "./star-renderer"
import { CompactRenderer } from "./compact-renderer"
import { RingRenderer } from "./ring-renderer" 
import { BeltRenderer } from "./belt-renderer"
import { ExoticRenderer } from "./exotic-renderer"

/**
 * Factory component that routes to the appropriate geometry-specific renderer
 * based on the object's geometry_type field from the orbital system JSON spec
 */
export function GeometryRendererFactory(props: GeometryRendererProps) {
  const { object } = props
  const geometryType: GeometryType = object.geometry_type

  switch (geometryType) {
    case "terrestrial":
      return <TerrestrialRenderer {...props} />
    
    case "rocky":
      return <RockyRenderer {...props} />
    
    case "gas_giant":
      return <GasGiantRenderer {...props} />
    
    case "star":
      return <StarRenderer {...props} />
    
    case "compact":
      return <CompactRenderer {...props} />
    
    case "exotic":
      return <ExoticRenderer {...props} />
    
    case "ring":
      return <RingRenderer {...props} />
    
    case "belt":
      return <BeltRenderer {...props} />
    
    case "none":
      // Invisible objects like barycenters - render nothing but maintain interactions
      return (
        <group>
          {/* Invisible interaction mesh for selection/focus */}
          <mesh
            visible={false}
            onClick={(e) => {
              e.stopPropagation()
              props.onSelect?.(object.id, e.object, object.name)
            }}
            onPointerEnter={() => props.onHover?.(object.id)}
            onPointerLeave={() => props.onHover?.(null)}
          >
            <sphereGeometry args={[props.scale, 8, 8]} />
            <meshBasicMaterial />
          </mesh>
        </group>
      )
    
    default:
      console.warn(`Unknown geometry type: ${geometryType} for object ${object.id}`)
      return (
        <group position={props.position}>
          {/* Fallback renderer with error indication */}
          <mesh scale={props.scale}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#ff0000" wireframe />
          </mesh>
          {/* Error indicator */}
          <mesh position={[0, 2, 0]}>
            <sphereGeometry args={[0.2, 4, 4]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
        </group>
      )
  }
} 