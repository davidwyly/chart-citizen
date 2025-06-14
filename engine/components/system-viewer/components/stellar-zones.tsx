"use client"

import React, { useMemo } from "react"
import * as THREE from "three"
import { calculateHabitableZoneAndSnowLine, getLuminosityForSpectralType } from "@/engine/utils/stellar-zones"
import type { ViewType } from "@lib/types/effects-level"
import { OrbitalSystemData, isStar } from "@/engine/types/orbital-system"

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
  // Calculate zones based on primary star's properties
  const zones = useMemo(() => {
    const stars = systemData.objects.filter(isStar)
    if (stars.length === 0) return null
    
    const primaryStar = stars[0]
    if (!primaryStar) return null

    try {
      // Get spectral type from star properties
      let spectralType = 'G2V' // Default to Sun-like star
      
      // Check for spectral type in properties
      if (primaryStar.properties.spectral_type) {
        spectralType = primaryStar.properties.spectral_type
      } else {
        // Infer spectral type from temperature
        const temp = primaryStar.properties.color_temperature || primaryStar.properties.temperature
        if (temp) {
          if (temp > 30000) spectralType = 'O5V'
          else if (temp > 10000) spectralType = 'B5V'
          else if (temp > 7500) spectralType = 'A5V'
          else if (temp > 6000) spectralType = 'F5V'
          else if (temp > 5200) spectralType = 'G2V'
          else if (temp > 3700) spectralType = 'K5V'
          else spectralType = 'M5V'
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
  }, [systemData.objects, orbitalScale])

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