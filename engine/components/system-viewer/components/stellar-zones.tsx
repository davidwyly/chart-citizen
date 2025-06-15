"use client"

import React, { useMemo } from "react"
import * as THREE from "three"
import { useStellarZones, calculateZoneOpacity } from "@/engine/hooks/use-stellar-zones"
import type { ViewType } from "@lib/types/effects-level"
import { OrbitalSystemData } from "@/engine/types/orbital-system"

interface StellarZonesProps {
  systemData: OrbitalSystemData
  viewType: ViewType
  orbitalScale: number
  showZones?: boolean
}

export function StellarZones({ 
  systemData, 
  viewType, 
  orbitalScale, 
  showZones = true 
}: StellarZonesProps) {
  // Use custom hook for zone calculations
  const zones = useStellarZones(systemData, {
    showZones,
    orbitalScale,
    viewType
  })

  // Create ring geometries for zones
  const ringGeometries = useMemo(() => {
    if (!zones) return null

    const createRingGeometry = (innerRadius: number, outerRadius: number, segments = 64) => {
      const shape = new THREE.Shape()
      shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
      const hole = new THREE.Path()
      hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
      shape.holes.push(hole)
      
      const geometry = new THREE.ShapeGeometry(shape, segments)
      geometry.rotateX(-Math.PI / 2) // Make it horizontal
      return geometry
    }

    const createCircleGeometry = (radius: number, segments = 64) => {
      const geometry = new THREE.RingGeometry(radius - 0.01, radius + 0.01, segments)
      geometry.rotateX(-Math.PI / 2) // Make it horizontal
      return geometry
    }

    return {
      habitableZone: createRingGeometry(zones.habitableZone.inner, zones.habitableZone.outer),
      snowLine: createCircleGeometry(zones.snowLine)
    }
  }, [zones])

  // Zone materials with opacity based on view type
  const materials = useMemo(() => {
    const opacity = calculateZoneOpacity(viewType)
    
    const habitableZoneMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00ff00), // Green for habitable zone
      transparent: true,
      opacity: opacity.habitableZone,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    const snowLineMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x87ceeb), // Light blue for frost line
      transparent: true,
      opacity: opacity.snowLine,
      side: THREE.DoubleSide,    depthWrite: false
    })

    return { habitableZoneMaterial, snowLineMaterial }
  }, [viewType])

  if (!zones || !ringGeometries) {
    return null
  }

  return (
    <group name="stellar-zones">
      {/* Habitable Zone (Green Zone) */}
      <mesh 
        geometry={ringGeometries.habitableZone} 
        material={materials.habitableZoneMaterial}
        renderOrder={-1} // Render behind other objects
      />
      
      {/* Snow/Frost Line */}
      <mesh 
        geometry={ringGeometries.snowLine} 
        material={materials.snowLineMaterial}
        renderOrder={-1} // Render behind other objects
      />
      
      {/* Zone labels for debugging/info - only show in navigational mode */}
      {viewType === "navigational" && (
        <>
          {/* These could be text sprites in the future */}
        </>
      )}
    </group>
  )
} 