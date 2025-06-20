"use client"

import React from "react"
import { GeometryRendererFactory } from "@/engine/renderers/geometry-renderers"
import { Protostar } from "@/engine/components/3d-ui/protostar"
import { DEFAULT_RENDERING_CONFIGURATION } from "@/engine/core/configuration/rendering-configuration"
import type { SystemRendererProps } from "@/engine/renderers/renderer-props"
import type { GeometryRendererProps } from "@/engine/renderers/geometry-renderers/types"

// Object factory handles system-level rendering with full interaction support
interface ObjectFactoryProps extends SystemRendererProps {
  readonly shaderScale?: number;
  readonly customizations?: any;
}

export function ObjectFactory({ catalogData, position, scale, shaderScale = 1, starPosition, customizations, onFocus, onHover, onSelect }: ObjectFactoryProps) {
  // Determine which renderer to use based on the engine_object type
  const engineObject = catalogData.engine_object || ""
  const category = catalogData.category || ""
  const features = catalogData.features || {}

  // Debug: Log object data to understand why we're getting fallback renderer
  console.log(`🏭 OBJECT FACTORY: Processing ${catalogData.id || 'unknown'} (${catalogData.name || 'unnamed'})`);
  console.log(`   engineObject: "${engineObject}"`);
  console.log(`   category: "${category}"`);
  console.log(`   classification: "${catalogData.classification || 'none'}"`);
  console.log(`   geometry_type: "${catalogData.geometry_type || 'none'}"`);
  console.log(`   Full catalogData:`, catalogData);

  // Convert catalogData to CelestialObject format for GeometryRendererFactory
  const celestialObject = {
    id: catalogData.id || 'unknown',
    name: catalogData.name || 'unnamed',
    classification: catalogData.classification || (engineObject.includes('star') ? 'star' : category === 'gas_giant' ? 'planet' : 'planet'),
    geometry_type: catalogData.geometry_type || (
      engineObject.includes('star') ? 'star' :
      engineObject === 'gas-giant' || category === 'gas_giant' ? 'gas_giant' :
      engineObject === 'terrestrial-planet' || category === 'terrestrial' ? 'terrestrial' :
      'rocky'
    ),
    properties: {
      ...catalogData.physical,
      ...catalogData.features,
      ...catalogData.appearance
    }
  } as const

  // Special objects
  if (engineObject === "protostar") {
    return (
      <group position={position}>
        <Protostar
          scale={scale || 1}
          effectScale={shaderScale}
          density={1.0}
          starBrightness={DEFAULT_RENDERING_CONFIGURATION.visual.starEffects.brightness}
          starHue={DEFAULT_RENDERING_CONFIGURATION.visual.starEffects.hue}
          nebulaHue={DEFAULT_RENDERING_CONFIGURATION.visual.starEffects.nebulaHue}
          rotationSpeed={DEFAULT_RENDERING_CONFIGURATION.visual.starEffects.rotationSpeed}
        />
      </group>
    )
  }

  // Use GeometryRendererFactory for all celestial objects except special cases
  if (
    engineObject.includes('star') ||
    engineObject === 'gas-giant' || category === 'gas_giant' ||
    engineObject === 'terrestrial-planet' || category === 'terrestrial' ||
    engineObject.includes('planet') ||
    engineObject.includes('moon') || category === 'moon'
  ) {
    // Convert to GeometryRendererProps interface
    const geometryProps: GeometryRendererProps = {
      object: celestialObject,
      scale: scale || 1,
      starPosition: starPosition || [0, 0, 0],
      position: position || [0, 0, 0],
      isSelected: false,
      timeMultiplier: 1,
      isPaused: false,
      showLabel: true,
      onHover,
      onSelect,
      onFocus,
      registerRef: () => {} // ObjectFactory doesn't need ref registration
    }
    
    return <GeometryRendererFactory {...geometryProps} />
  }

  // Enhanced fallback renderer with warning (only log once)
  console.warn(`⚠️ Using fallback renderer for unknown object:`, {
    id: catalogData.id,
    engineObject,
    category,
  })

  return (
    <group position={position}>
      {/* Static fallback object - no rotation! */}
      <mesh scale={scale || 1}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ff0000" wireframe />
      </mesh>

      {/* Error indicator text */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.2, 4, 4]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    </group>
  )
}
