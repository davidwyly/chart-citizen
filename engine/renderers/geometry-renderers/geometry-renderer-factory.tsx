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
  let geometryType: GeometryType = object.geometry_type

  // Debug: Log what geometry types we're actually receiving
  console.log(`🔧 GEOMETRY FACTORY: ${object.name} (${object.id})`);
  console.log(`   geometry_type: "${geometryType}"`);
  console.log(`   classification: "${object.classification}"`);
  console.log(`   Available geometry types: terrestrial, rocky, gas_giant, star, compact, exotic, ring, belt, none`);

  // Fallback mapping for missing or incorrect geometry types based on classification
  if (!geometryType || geometryType === undefined) {
    console.warn(`⚠️  No geometry_type for ${object.name}, inferring from classification: ${object.classification}`);
    
    switch (object.classification) {
      case 'star':
        geometryType = 'star';
        break;
      case 'planet':
        // Determine if gas giant or terrestrial based on properties
        if (object.properties?.mass && object.properties.mass > 5.972e25) { // Heavier than ~10 Earths
          geometryType = 'gas_giant';
        } else {
          geometryType = 'terrestrial';
        }
        break;
      case 'moon':
        geometryType = 'rocky';
        break;
      case 'asteroid':
        geometryType = 'rocky';
        break;
      case 'asteroid_belt':
        geometryType = 'belt';
        break;
      case 'dwarf_planet':
        geometryType = 'rocky';
        break;
      default:
        geometryType = 'rocky'; // Safe fallback
        break;
    }
    
    console.log(`   → Inferred geometry_type: "${geometryType}"`);
  }

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