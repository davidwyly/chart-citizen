"use client"

import type React from "react"

import { useRef, useEffect, useMemo } from "react"
import { useFrame, extend } from "@react-three/fiber"
import * as THREE from "three"
import { StormMaterial } from "../materials/storm-material"

extend({ StormMaterial })

interface AtmosphericStormsProps {
  radius: number
  stormCount?: number
  intensity?: number
  planetRotation?: React.RefObject<THREE.Group>
}

interface StormData {
  position: [number, number, number]
  size: number
  intensity: number
  rotationSpeed: number
  baseTime: number
  type: 'major' | 'minor'
}

export function AtmosphericStorms({
  radius,
  stormCount = 5,
  intensity = 1.0,
  planetRotation
}: AtmosphericStormsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialsRef = useRef<THREE.ShaderMaterial[]>([])

  const stormData = useMemo(() => {
    const data: StormData[] = []
    for (let i = 0; i < stormCount; i++) {
      // Random position on sphere surface
      const phi = Math.random() * Math.PI * 2
      const theta = Math.random() * Math.PI
      const r = radius * 1.001

      const x = r * Math.sin(theta) * Math.cos(phi)
      const y = r * Math.sin(theta) * Math.sin(phi)
      const z = r * Math.cos(theta)
      
      // Calculate storm size based on random value and intensity
      const sizeRandom = Math.random() * 0.7 + 0.3
      const size = radius * 0.05 * sizeRandom * (1 + intensity)
      
      // Determine if this is a major storm
      const isMajor = Math.random() < 0.2

      data.push({
        position: [x, y, z] as [number, number, number],
        size: size,
        intensity: sizeRandom * intensity,
        rotationSpeed: (Math.random() * 0.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1),
        baseTime: Math.random() * 100,
        type: isMajor ? "major" : "minor"
      })
    }
    return data
  }, [radius, stormCount, intensity])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    materialsRef.current.forEach((material, index) => {
      if (material && material.uniforms) {
        if (material.uniforms.time) {
          material.uniforms.time.value = time + stormData[index].baseTime
        }
        if (material.uniforms.intensity) {
          material.uniforms.intensity.value = stormData[index].intensity * intensity
        }
        if (material.uniforms.rotationSpeed) {
          material.uniforms.rotationSpeed.value = stormData[index].rotationSpeed
        }
        if (material.uniforms.stormType) {
          material.uniforms.stormType.value = stormData[index].type === "major" ? 1.0 : 0.0
        }
      }
    })

    // Rotate storms with the planet
    if (groupRef.current && planetRotation?.current) {
      groupRef.current.rotation.copy(planetRotation.current.rotation)
    }
  })

  return (
    <group ref={groupRef}>
      {stormData.map((storm, index) => (
        <mesh key={index} position={storm.position} scale={storm.size}>
          <planeGeometry args={[1, 1]} />
          {/* @ts-ignore */}
          <stormMaterial
            ref={(ref: THREE.ShaderMaterial) => {
              if (ref) materialsRef.current[index] = ref
            }}
            attach="material"
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}
