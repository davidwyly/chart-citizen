import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GeometryRendererFactory } from '@/engine/renderers/geometry-renderers'
import type { CatalogObject } from '@/engine/system-loader'
import type { GeometryRendererProps } from '@/engine/renderers/geometry-renderers/types'

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

  // Convert catalogData to CelestialObject format for GeometryRendererFactory
  const celestialObject = {
    id: catalogObject.id || objectId,
    name: catalogObject.name || 'unnamed',
    classification: catalogObject.classification || (engineObject.includes('star') ? 'star' : category === 'gas_giant' ? 'planet' : 'planet'),
    geometry_type: catalogObject.geometry_type || (
      engineObject.includes('star') ? 'star' :
      engineObject === 'gas-giant' || category === 'gas_giant' ? 'gas_giant' :
      engineObject === 'terrestrial-planet' || category === 'terrestrial' ? 'terrestrial' :
      'rocky'
    ),
    properties: {
      ...catalogObject.physical,
      ...catalogObject.features,
      ...catalogObject.appearance
    }
  } as const

  // Use GeometryRendererFactory for all celestial objects
  if (
    engineObject.includes('star') ||
    engineObject === 'gas-giant' || category === 'gas_giant' ||
    engineObject === 'terrestrial-planet' || category === 'terrestrial' ||
    engineObject.includes('planet')
  ) {
    const geometryProps: GeometryRendererProps = {
      object: celestialObject,
      scale: scale,
      starPosition: [0, 0, 0],
      position: position,
      isSelected: false,
      timeMultiplier: 1,
      isPaused: false,
      showLabel: true,
      onHover: () => {},
      onSelect,
      onFocus,
      registerRef: registerRef || (() => {})
    }
    
    return <GeometryRendererFactory {...geometryProps} />
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