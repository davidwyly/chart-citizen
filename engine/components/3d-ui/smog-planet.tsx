"use client"

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SmogPlanetMaterial } from './materials/smog-planet-material'

interface SmogPlanetProps {
  scale?: number
  shaderScale?: number
  customizations?: {
    shader?: {
      intensity?: number
      speed?: number
      distortion?: number
      topColor?: [number, number, number]
      midColor1?: [number, number, number]
      midColor2?: [number, number, number]
      midColor3?: [number, number, number]
      bottomColor?: [number, number, number]
    }
  }
}

export function SmogPlanet({ 
  scale = 1.0, 
  shaderScale = 1.0,
  customizations 
}: SmogPlanetProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  // Create the material instance
  const material = useMemo(() => new SmogPlanetMaterial(), [])

  // Update shader uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime

      // Apply customizations if provided
      if (customizations?.shader) {
        const { shader } = customizations
        if (shader.intensity !== undefined) {
          materialRef.current.uniforms.intensity.value = shader.intensity
        }
        if (shader.speed !== undefined) {
          materialRef.current.uniforms.speed.value = shader.speed
        }
        if (shader.distortion !== undefined) {
          materialRef.current.uniforms.distortion.value = shader.distortion
        }
        if (shader.topColor) {
          materialRef.current.uniforms.topColor.value.set(...shader.topColor)
        }
        if (shader.midColor1) {
          materialRef.current.uniforms.midColor1.value.set(...shader.midColor1)
        }
        if (shader.midColor2) {
          materialRef.current.uniforms.midColor2.value.set(...shader.midColor2)
        }
        if (shader.midColor3) {
          materialRef.current.uniforms.midColor3.value.set(...shader.midColor3)
        }
        if (shader.bottomColor) {
          materialRef.current.uniforms.bottomColor.value.set(...shader.bottomColor)
        }
      }
    }
  })

  return (
    <mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} ref={materialRef} />
    </mesh>
  )
} 