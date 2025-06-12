"use client"

import React, { useMemo } from "react"
import * as THREE from "three"
import { calculateHabitableZoneAndSnowLine, getLuminosityForSpectralType } from "@/engine/utils/stellar-zones"
import type { ViewType } from "@lib/types/effects-level"
import type { SystemData } from "@/engine/system-loader"

interface StellarZonesProps {
  systemData: SystemData
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
  // Calculate zones based on primary star's spectral type
  const zones = useMemo(() => {
    if (!systemData.stars || systemData.stars.length === 0) return null
    
    const primaryStar = systemData.stars[0]
    if (!primaryStar) return null

    try {
      // Default spectral type (Sun-like)
      let spectralType = 'G2V'
      
      // For now, we'll use defaults based on common star types
      // In the future, this could be enhanced to load catalog data
      if (primaryStar.catalog_ref) {
        const catalogRef = primaryStar.catalog_ref.toLowerCase()
        if (catalogRef.includes('k1v') || catalogRef.includes('k-type')) {
          spectralType = 'K1V'
        } else if (catalogRef.includes('m2v') || catalogRef.includes('m5v') || catalogRef.includes('red-dwarf')) {
          spectralType = 'M2V'
        } else if (catalogRef.includes('g2v') || catalogRef.includes('main-sequence')) {
          spectralType = 'G2V'
        }
      }

      // Calculate zones
      const zoneData = calculateHabitableZoneAndSnowLine(spectralType)
      
      return {
        habitableZone: {
          inner: zoneData.habitableZone.inner * orbitalScale,
          outer: zoneData.habitableZone.outer * orbitalScale
        },
        snowLine: zoneData.snowLine * orbitalScale,
        spectralType
      }
    } catch (error) {
      console.warn('Failed to calculate stellar zones:', error)
      return null
    }
  }, [systemData.stars, orbitalScale])

  // Create ring geometries for zones
  const ringGeometries = useMemo(() => {
    if (!zones || !showZones) return null

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
  }, [zones, showZones])

  // Zone materials
  const materials = useMemo(() => {
    const habitableZoneMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00ff00), // Green for habitable zone
      transparent: true,
      opacity: viewType === "realistic" ? 0.15 : 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    const snowLineMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x87ceeb), // Light blue for frost line
      transparent: true,
      opacity: viewType === "realistic" ? 0.3 : 0.5,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    return { habitableZoneMaterial, snowLineMaterial }
  }, [viewType])

  if (!zones || !ringGeometries || !showZones) {
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