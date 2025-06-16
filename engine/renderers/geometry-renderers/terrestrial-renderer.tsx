"use client"

import React, { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import { TerrestrialPlanetMaterial } from "../planets/materials/terrestrial-planet-material"
import { PlanetRingsRenderer } from "../planets/planet-rings-renderer"
import { InteractiveObject } from "../../components/3d-ui/interactive-object"
import type { GeometryRendererProps, RingCapableRenderer } from "./types"

// Register the custom shader materials
extend({ TerrestrialPlanetMaterial })

/**
 * Terrestrial renderer for Earth-like planets with atmospheres
 * Supports: procedural terrain, oceans, clouds, night lights, rings
 */
export function TerrestrialRenderer({
  object,
  scale,
  starPosition = [0, 0, 0],
  position = [0, 0, 0],
  isSelected,
  planetSystemSelected = false,
  shaderParams,
  onHover,
  onSelect,
  onFocus,
  registerRef,
}: GeometryRendererProps) {
  const planetRef = useRef<THREE.Group>(null)
  const materialRef = useRef<any>(null)
  const { scene } = useThree()

  const { properties } = object
  const radius = scale

  // Calculate rotation rate from orbital properties
  const rotationRate = 0.0002 / (properties.rotation_period || 24.0)

  // Determine planet features from properties
  const hasOceans = (properties.water || 0) > 10 ? 1.0 : 0.0
  const hasAtmosphere = (properties.atmosphere || 0) > 10 ? 1.0 : 0.0
  const hasClouds = hasAtmosphere > 0 ? 1.0 : 0.0
  const hasNightLights = (properties.population || 0) > 10 ? 1.0 : 0.0

  // Extract colors from properties or use defaults
  const landColor = new THREE.Color("#8fbc8f")
  const oceanColor = new THREE.Color("#1e90ff")
  const sandColor = new THREE.Color("#daa520")
  const cloudColor = new THREE.Color("#ffffff")
  const nightLightColor = new THREE.Color("#ffff99")
  const atmosphereColor = new THREE.Color("#87ceeb")

  // Calculate terrain parameters
  const noiseScale = (properties.tectonics || 50) / 50.0

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (materialRef.current) {
      materialRef.current.time = time

      // Calculate light direction from star position
      const sunPosition = new THREE.Vector3(...starPosition)
      const planetPosition = new THREE.Vector3()
      if (planetRef.current) {
        planetRef.current.getWorldPosition(planetPosition)
      }

      const lightDirection = new THREE.Vector3().subVectors(sunPosition, planetPosition).normalize()
      materialRef.current.lightDirection = lightDirection
    }



    if (planetRef.current) {
      // Handle rotation (including retrograde if specified)
      const direction = properties.axial_tilt && properties.axial_tilt > 90 ? -1 : 1
      planetRef.current.rotation.y += rotationRate * direction
    }
  })



  // Register ref for external access
  React.useEffect(() => {
    if (planetRef.current) {
      registerRef(object.id, planetRef.current)
    }
  }, [object.id, registerRef])

  return (
    <InteractiveObject
      objectId={object.id}
      objectName={object.name}
      objectType={object.classification === 'star' ? 'star' : object.classification === 'planet' ? 'planet' : object.classification === 'moon' ? 'moon' : 'planet'}
      radius={radius}
      position={position}
      isSelected={isSelected}
      planetSystemSelected={planetSystemSelected}
      onHover={(id, hovered) => onHover?.(hovered ? id : null)}
      onSelect={onSelect}
      onFocus={(obj, name, visualSize) => onFocus?.(obj, name, visualSize || scale, properties.radius, properties.mass, 0)}
      registerRef={registerRef}
      showLabel={true}
    >
      <group ref={planetRef}>
        {/* Main planet surface */}
        <mesh>
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

        {/* Ring system if present */}
        {object.rings && object.rings.length > 0 && (
          <group>
            {object.rings.map((ring, index) => (
              <PlanetRingsRenderer
                key={ring.id}
                planetRadius={radius}
                innerRadius={ring.radius_start}
                outerRadius={ring.radius_end}
                color={ring.color || "#c0c0c0"}
                transparency={1 - (ring.opacity || 70) / 100}
                divisions={6}
                noiseScale={0.5}
                noiseStrength={0.3}
                dustDensity={ring.density === 'dense' ? 0.9 : ring.density === 'moderate' ? 0.6 : 0.3}
                shadowIntensity={0.5}
                rotation={planetRef.current?.rotation}
                lightPosition={starPosition}
              />
            ))}
          </group>
        )}
      </group>
    </InteractiveObject>
  )
}

// Mark this renderer as ring-capable
;(TerrestrialRenderer as any).supportsRings = true 