"use client"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import { TerrestrialPlanetMaterial } from "./materials/terrestrial-planet-material"
import type { CatalogObject } from "@/engine/lib/system-loader"

// Register the custom shader material
extend({ TerrestrialPlanetMaterial })

interface TerrestrialPlanetRendererProps {
  catalogData: CatalogObject
  position?: [number, number, number]
  scale?: number
  onFocus?: (object: THREE.Object3D, name: string) => void
}

export function TerrestrialPlanetRenderer({
  catalogData,
  position = [0, 0, 0],
  scale = 1,
  onFocus,
}: TerrestrialPlanetRendererProps) {
  const planetRef = useRef<THREE.Group>(null)
  const materialRef = useRef<any>(null)
  const { scene } = useThree()

  // Extract data from catalog
  const physical = catalogData.physical || {}
  const features = catalogData.features || {}
  const appearance = catalogData.appearance || {}

  // Calculate rendering parameters
  const radius = (physical.radius || 1.0) * scale
  const rotationRate = 0.0002 / (features.rotation_period || 24.0)

  // Determine planet features
  const hasOceans = features.ocean_coverage && features.ocean_coverage > 0.1 ? 1.0 : 0.0
  const hasAtmosphere = (physical.atmospheric_pressure || 0) > 0.01 ? 1.0 : 0.0
  const hasClouds = features.cloud_coverage && features.cloud_coverage > 0.1 ? 1.0 : 0.0
  const hasNightLights = features.city_lights ? 1.0 : 0.0

  // Get colors from appearance or use defaults
  const oceanColor = new THREE.Color(appearance.ocean_color || "#1e90ff")
  const landColor = new THREE.Color(appearance.land_color || "#8fbc8f")
  const sandColor = new THREE.Color(appearance.sand_color || "#daa520")
  const cloudColor = new THREE.Color(appearance.cloud_color || "#ffffff")
  const nightLightColor = new THREE.Color(appearance.city_light_color || "#ffff99")
  const atmosphereColor = new THREE.Color(appearance.atmosphere_color || "#87ceeb")

  // Calculate noise scale based on planet type
  const noiseScale = features.terrain_roughness || 1.0

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (materialRef.current) {
      materialRef.current.time = time

      // Find the sun position (assuming it's at the center of the system)
      const sunPosition = new THREE.Vector3(0, 0, 0)

      // Get planet position in world space
      const planetPosition = new THREE.Vector3()
      if (planetRef.current) {
        planetRef.current.getWorldPosition(planetPosition)
      }

      // Calculate light direction from planet to sun
      const lightDirection = new THREE.Vector3().subVectors(sunPosition, planetPosition).normalize()

      // Set the light direction in the shader
      materialRef.current.lightDirection = lightDirection
    }

    if (planetRef.current) {
      // Handle retrograde rotation for Venus-like planets
      const direction = features.retrograde_rotation ? -1 : 1
      planetRef.current.rotation.y += rotationRate * direction
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (planetRef.current && onFocus) {
      onFocus(planetRef.current, catalogData.name)
    }
  }

  return (
    <group ref={planetRef} position={position}>
      <mesh onClick={handleClick}>
        <sphereGeometry args={[radius, 64, 64]} />
        {/* @ts-ignore */}
        <terrestrialPlanetMaterial
          ref={materialRef}
          landColor={landColor}
          seaColor={oceanColor}
          sandColor={sandColor}
          atmosphereColor={atmosphereColor}
          rotationSpeed={0.2}
          terrainScale={noiseScale}
          cloudScale={1.5}
          nightLightIntensity={hasNightLights}
          cloudOpacity={hasClouds * 0.6}
        />
      </mesh>
    </group>
  )
}
