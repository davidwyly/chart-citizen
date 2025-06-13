"use client"

import { useRef, useEffect } from "react"
import { extend, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { SunMaterial } from "./materials/sun-material"
import type { CatalogObject } from "@/engine/system-loader"

extend({ SunMaterial })

interface StarRendererProps {
  catalogData: CatalogObject
  position?: [number, number, number]
  scale?: number
  shaderScale?: number
  onFocus?: (object: THREE.Object3D, name: string) => void
}

export function StarRenderer({
  catalogData,
  position = [0, 0, 0],
  scale = 1,
  shaderScale = 1,
  onFocus,
}: StarRendererProps) {
  const groupRef = useRef<THREE.Group>(null)
  const sunMatRef = useRef<THREE.ShaderMaterial>(null!)
  const coronaRef = useRef<THREE.Mesh>(null!)
  const sunRef = useRef<THREE.Mesh>(null!)
  const { camera } = useThree()

  // Extract data from catalog
  const physical = catalogData.physical || {}
  const features = catalogData.features || {}
  const appearance = catalogData.appearance || {}

  // Star properties
  const radius = (physical.radius || 1.0) * scale
  const rotationRate = 0.00023 / (features.rotation_period || 25.0)
  const flareIntensity = 1
  const coreColor = new THREE.Color(appearance.core_color || "#ffaa44")
  const coronaColor = new THREE.Color(appearance.corona_color || "#ffe680")
  const renderVariableStar = catalogData.category === "variable"

  useEffect(() => {
    camera.layers.enable(0)
    camera.layers.enable(1)
  }, [camera])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    // Rotate the star
    if (groupRef.current) {
      groupRef.current.rotation.y -= rotationRate
    }

    // Update core shader
    if (sunMatRef.current?.uniforms) {
      sunMatRef.current.uniforms.time.value = time
      sunMatRef.current.uniforms.coreColor.value = coreColor
    }

    // Corona effects would be updated here if available
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (groupRef.current && onFocus) {
      onFocus(groupRef.current, catalogData.name)
    }
  }

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        document.body.style.cursor = "auto"
      }}
    >
      <group ref={groupRef}>
        
        {/* Star core - render on top */}
        <mesh ref={sunRef} layers={1} renderOrder={10}>
          <sphereGeometry args={[radius, 64, 64]} />
          {/* @ts-ignore */}
          <sunMaterial
            ref={sunMatRef}
            attach="material"
            coreColor={coreColor}
            variableStar={renderVariableStar}
            variablePeriod={features.variability_period || 4.0}
            variableAmplitude={features.variability_amplitude || 0.2}
            flowSpeed={3.0}
          />
        </mesh>
      </group>
    </group>
  )
}
