"use client"

import { useRef, useEffect } from "react"
import { extend, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { SunMaterial } from "./materials/sun-material"
import { StarCorona } from "./effects/star-corona"
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

    // Update corona shader with dynamic lens-flare-like values
    if (coronaRef.current?.material?.uniforms) {
      const uniforms = coronaRef.current.material.uniforms
      const cameraDir = new THREE.Vector3()
      camera.getWorldDirection(cameraDir)

      const viewAngle = Math.abs(cameraDir.dot(new THREE.Vector3(0, 0, 1)))
      const cameraRotation = Math.atan2(cameraDir.y, cameraDir.x)
      const rotationAngle = groupRef.current?.rotation.y || 0

      uniforms.viewAngle.value = viewAngle
      uniforms.rotation.value = rotationAngle
      uniforms.cameraRotation.value = cameraRotation
    }
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
        {/* Star core */}
        <mesh ref={sunRef} layers={1} renderOrder={0}>
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

        {/* Star corona */}
        <StarCorona
          ref={coronaRef}
          radius={radius * 1}
          intensity={flareIntensity * 0.8}
          color={coronaColor}
          scale={shaderScale}
          curvatureAmount={0.4}
        />
      </group>
    </group>
  )
}
