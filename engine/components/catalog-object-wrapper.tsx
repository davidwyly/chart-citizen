import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { StarRenderer } from '@/engine/renderers/stars/star-renderer'
import { TerrestrialPlanetRenderer } from '@/engine/renderers/planets/terrestrial-planet-renderer'
import { GasGiantRenderer } from '@/engine/renderers/planets/gas-giant-renderer'
import type { CatalogObject } from '@/engine/system-loader'

interface CatalogObjectWrapperProps {
  objectId: string
  catalogRef: string
  position?: [number, number, number]
  scale?: number
  shaderScale?: number
  isPrimaryStar?: boolean
  customizations?: {
    shader?: Record<string, number>
  }
  onFocus?: (object: THREE.Object3D, name: string) => void
  onSelect?: (id: string, object: THREE.Object3D, name: string) => void
  registerRef?: (id: string, ref: THREE.Object3D) => void
}

export function CatalogObjectWrapper({
  objectId,
  catalogRef,
  position = [0, 0, 0],
  scale = 1,
  shaderScale = 1,
  isPrimaryStar = false,
  customizations,
  onFocus,
  onSelect,
  registerRef
}: CatalogObjectWrapperProps) {
  const [catalogObject, setCatalogObject] = useState<CatalogObject | null>(null)
  const { scene } = useThree()

  // Load catalog object data
  useEffect(() => {
    const loadCatalogObject = async () => {
      try {
        // This would be replaced with actual catalog data loading
        const object = {} as CatalogObject // Replace with actual loading
        setCatalogObject(object)
      } catch (error) {
        console.error('Failed to load catalog object:', error)
      }
    }

    loadCatalogObject()
  }, [catalogRef])

  if (!catalogObject) {
    return null
  }

  // Determine which renderer to use based on the engine_object type
  const engineObject = catalogObject.engine_object || ""
  const category = catalogObject.category || ""

  // Star renderers
  if (engineObject === "main-sequence-star" || engineObject === "red-dwarf-star" || engineObject === "variable-star") {
    return (
      <StarRenderer
        catalogData={catalogObject}
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
        catalogData={catalogObject}
        position={position}
        scale={scale}
        radius={scale}
        onFocus={onFocus}
      />
    )
  }

  // Terrestrial planet renderers
  if (
    engineObject === "terrestrial-planet" ||
    engineObject === "earth-like" ||
    engineObject === "ice-planet" ||
    engineObject === "volcanic-planet" ||
    engineObject === "ocean-planet" ||
    category === "terrestrial"
  ) {
    return (
      <TerrestrialPlanetRenderer
        catalogData={catalogObject}
        position={position}
        scale={scale}
        onFocus={onFocus}
      />
    )
  }

  // Fallback renderer
  console.warn(`⚠️ Using fallback renderer for unknown object:`, {
    id: catalogObject.id,
    engineObject,
    category,
  })

  return (
    <group position={position}>
      <mesh scale={scale}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ff0000" wireframe />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.2, 4, 4]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    </group>
  )
} 