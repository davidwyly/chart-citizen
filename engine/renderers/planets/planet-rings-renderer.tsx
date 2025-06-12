"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, extend } from "@react-three/fiber"
import * as THREE from "three"
import { PlanetRingsMaterial, createPlanetRingsMaterial } from "./materials/planet-rings-material"

// Extend Three.js with our custom material
extend({ PlanetRingsMaterial })

interface PlanetRingsRendererProps {
  planetRadius: number
  innerRadius?: number
  outerRadius?: number
  color?: string
  transparency?: number
  divisions?: number
  noiseScale?: number
  noiseStrength?: number
  dustDensity?: number
  shadowIntensity?: number
  rotation?: THREE.Euler
  lightPosition?: [number, number, number]
}

export function PlanetRingsRenderer({
  planetRadius,
  innerRadius = 1.3,
  outerRadius = 2.5,
  color = "#c0c0c0",
  transparency = 0.7,
  divisions = 6,
  noiseScale = 0.5,
  noiseStrength = 0.2,
  dustDensity = 0.7,
  shadowIntensity = 0.5,
  rotation,
  lightPosition = [1.0, 0.0, 1.0]
}: PlanetRingsRendererProps) {
  const ringsRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  // Scale radii based on planet size
  const scaledInnerRadius = planetRadius * innerRadius
  const scaledOuterRadius = planetRadius * outerRadius
  
  // Convert color string to THREE.Color
  const ringColor = useMemo(() => {
    return new THREE.Color(color)
  }, [color])
  
  // Convert light position to Vector3
  const lightDirection = useMemo(() => {
    return new THREE.Vector3(...lightPosition).normalize()
  }, [lightPosition])
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      // Update time for animation
      materialRef.current.uniforms.time.value = clock.getElapsedTime()
      
      // Update light direction if it changes
      materialRef.current.uniforms.lightDirection.value = lightDirection
    }
  })
  
  // Apply rotation from parent if provided
  useEffect(() => {
    if (ringsRef.current && rotation) {
      ringsRef.current.rotation.copy(rotation)
    }
  }, [rotation])
  
  return (
    <mesh ref={ringsRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[scaledInnerRadius, scaledOuterRadius, 128]} />
      {/* @ts-ignore */}
      <planetRingsMaterial
        ref={materialRef}
        ringColor={ringColor}
        ringTransparency={transparency}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        noiseScale={noiseScale}
        noiseStrength={noiseStrength}
        dustDensity={dustDensity}
        ringDivisions={divisions}
        shadowIntensity={shadowIntensity}
        lightDirection={lightDirection}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
} 