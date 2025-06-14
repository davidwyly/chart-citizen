"use client"

import { StarRenderer } from "@/engine/renderers/stars/star-renderer"
import { PlanetRenderer } from "@/engine/renderers/planets/planet-renderer"
import { GasGiantRenderer } from "@/engine/renderers/planets/gas-giant-renderer"
import { TerrestrialPlanetRenderer } from "@/engine/renderers/planets/terrestrial-planet-renderer"
import { Protostar } from "@/engine/components/3d-ui/protostar"
import type { CatalogObject } from "@/engine/system-loader"
import type * as THREE from "three"

interface ObjectFactoryProps {
  catalogData: CatalogObject
  position?: [number, number, number]
  scale?: number
  shaderScale?: number
  starPosition?: [number, number, number]
  customizations?: any
  onFocus?: (object: THREE.Object3D, name: string) => void
}

export function ObjectFactory({ catalogData, position, scale, shaderScale = 1, starPosition, customizations, onFocus }: ObjectFactoryProps) {
  // Determine which renderer to use based on the engine_object type
  const engineObject = catalogData.engine_object || ""
  const category = catalogData.category || ""
  const features = catalogData.features || {}

  // Special objects
  if (engineObject === "protostar") {
    return (
      <group position={position}>
        <Protostar
          scale={scale || 1}
          effectScale={shaderScale}
          density={1.0}
          starBrightness={30.0}
          starHue={0.08}
          nebulaHue={0.66}
          rotationSpeed={1.0}
        />
      </group>
    )
  }

  // Star renderers
  if (engineObject === "main-sequence-star" || engineObject === "red-dwarf-star" || engineObject === "variable-star") {
    return (
      <StarRenderer
        catalogData={catalogData}
        position={position}
        scale={scale}
        shaderScale={shaderScale}
        onFocus={onFocus}
      />
    )
  }

  // Gas giant renderer
  if (engineObject === "gas-giant" || category === "gas_giant") {
    return (
      <GasGiantRenderer
        catalogData={catalogData}
        position={position}
        scale={scale}
        radius={scale || 1}
        onFocus={onFocus}
      />
    )
  }

  // Habitable planet renderer - for Earth-like worlds with advanced features
  if (engineObject === "terrestrial-planet" && category === "habitable") {
    return (
      <TerrestrialPlanetRenderer 
        catalogData={catalogData} 
        position={position} 
        scale={scale} 
        onFocus={onFocus} 
      />
    )
  }

  // Terrestrial planet renderers - use the new shader for Earth-like planets
  if (
    (engineObject === "terrestrial-planet" &&
      ((features.ocean_coverage && features.ocean_coverage > 0.5) || features.earth_like === true)) ||
    engineObject === "earth-like"
  ) {
    return <TerrestrialPlanetRenderer catalogData={catalogData} position={position} scale={scale} onFocus={onFocus} />
  }

  // Regular terrestrial planets
  if (
    engineObject === "terrestrial-planet" ||
    engineObject === "ice-planet" ||
    engineObject === "volcanic-planet" ||
    engineObject === "ocean-planet" ||
    category === "terrestrial"
  ) {
    return <PlanetRenderer catalogData={catalogData} position={position} scale={scale} onFocus={onFocus} />
  }

  // Moon renderers - use planet renderer for now
  if (
    engineObject === "terrestrial-moon" ||
    engineObject === "ice-moon" ||
    engineObject === "volcanic-moon" ||
    engineObject === "atmospheric-moon" ||
    category === "moon"
  ) {
    return <PlanetRenderer catalogData={catalogData} position={position} scale={scale} onFocus={onFocus} />
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
