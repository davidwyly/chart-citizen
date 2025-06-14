"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { engineSystemLoader } from "@/engine/system-loader"
import { ObjectFactory } from "@/engine/object-factory"
import type * as THREE from "three"

interface CatalogObjectWrapperProps {
  objectId: string
  catalogRef: string
  position?: [number, number, number]
  scale?: number
  shaderScale?: number
  isPrimaryStar?: boolean
  starPosition?: [number, number, number]
  customizations?: any
  onFocus?: (object: THREE.Object3D, name: string, visualSize?: number) => void
  onSelect?: (objectId: string, object: THREE.Object3D, name: string) => void
  registerRef?: (id: string, ref: THREE.Object3D) => void
}

export function CatalogObjectWrapper({
  objectId,
  catalogRef,
  position = [0, 0, 0],
  scale,
  shaderScale = 1,
  isPrimaryStar = false,
  starPosition,
  customizations,
  onFocus,
  onSelect,
  registerRef,
}: CatalogObjectWrapperProps) {
  const [catalogData, setCatalogData] = useState<any>(null)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const objectRef = useRef<THREE.Group>(null)

  // Register this object's ref for parent-child relationships
  useEffect(() => {
    if (objectRef.current && registerRef) {
      registerRef(objectId, objectRef.current)
    }
  }, [objectId, registerRef])

  useEffect(() => {
    engineSystemLoader
      .getCatalogObject(catalogRef)
      .then((data) => {
        if (data) {
          if (customizations) {
            // Apply customizations if available
            const customizedData = {
              ...data,
              physical: { ...data.physical, ...customizations.physical },
              features: { ...data.features, ...customizations.features },
              appearance: { ...data.appearance, ...customizations.appearance },
            }
            setCatalogData(customizedData)
          } else {
            setCatalogData(data)
          }
          setLoadingError(null)
        } else {
          const error = `Failed to load catalog object: ${catalogRef}`
          console.error(`❌ ${error}`)
          setLoadingError(error)
        }
      })
      .catch((err) => {
        const error = `Error loading ${catalogRef}: ${err}`
        console.error(`❌ ${error}`)
        setLoadingError(error)
      })
  }, [catalogRef, customizations, objectId])

  // Calculate visual size for zoom controller
  const visualSize = useMemo(() => {
    if (!catalogData || !scale) return undefined

    const radius = catalogData.physical?.radius || 1.0
    return radius * scale
  }, [catalogData, scale])

  // Enhanced focus handler that includes visual size
  const handleFocus = (object: THREE.Object3D, name: string) => {
    // Forward focus data to parent
    if (onFocus) {
      onFocus(object, name, visualSize)
    }
    // Ensure selection state matches focus when clicked directly on the mesh
    if (onSelect) {
      onSelect(objectId, object, name)
    }
  }

  // Show loading state
  if (!catalogData && !loadingError) {
    return (
      <group ref={objectRef} position={position}>
        <mesh scale={(scale || 1) * 0.5}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#888888" wireframe />
        </mesh>
      </group>
    )
  }

  // Show error state
  if (loadingError) {
    return (
      <group ref={objectRef} position={position}>
        <mesh scale={scale || 1}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#ff0000" wireframe />
        </mesh>
        {/* Error indicator */}
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.3, 4, 4]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={objectRef} position={position}>
      <ObjectFactory catalogData={catalogData} scale={scale} shaderScale={shaderScale} starPosition={starPosition} customizations={customizations} onFocus={handleFocus} />
    </group>
  )
}
