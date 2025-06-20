"use client"

import React, { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import { PlanetRingsMaterial } from "./materials/planet-rings-material"

extend({ PlanetRingsMaterial })

interface PlanetRingsRendererProps {
  planetRadius: number
  innerRadius: number
  outerRadius: number
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
  innerRadius,
  outerRadius,
  color = "#E6D3A7",
  transparency = 0.4,
  divisions = 8,
  noiseScale = 0.8,
  noiseStrength = 0.4,
  dustDensity = 0.7,
  shadowIntensity = 0.6,
  rotation,
  lightPosition = [1, 1, 0]
}: PlanetRingsRendererProps) {
  const ringsRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial | any>(null!)

  // Create ring geometry
  const ringGeometry = useMemo(() => {
    const geometry = new THREE.RingGeometry(
      innerRadius,
      outerRadius,
      32, // radial segments
      8   // theta segments
    )
    
    // Add UV coordinates for proper texture mapping
    const uvs = geometry.attributes.uv.array as Float32Array
    for (let i = 0; i < uvs.length; i += 2) {
      const angle = Math.atan2(uvs[i + 1] - 0.5, uvs[i] - 0.5)
      const radius = Math.sqrt((uvs[i] - 0.5) ** 2 + (uvs[i + 1] - 0.5) ** 2)
      uvs[i] = angle / (Math.PI * 2) + 0.5
      uvs[i + 1] = radius * 2
    }
    geometry.attributes.uv.needsUpdate = true
    
    return geometry
  }, [innerRadius, outerRadius])

  // Create ring texture
  const ringTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 64
    const ctx = canvas.getContext("2d")!
    
    // Create ring pattern with gaps and variations
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.3, color)
    gradient.addColorStop(0.7, color)
    gradient.addColorStop(1, color)
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add noise and gaps
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % canvas.width
      const y = Math.floor((i / 4) / canvas.width)
      
      // Add radial variations
      const radialPos = y / canvas.height
      const noise = (Math.sin(x * noiseScale) + Math.cos(y * noiseScale)) * noiseStrength
      const density = dustDensity + noise * 0.3
      
      // Create gaps in rings
      if (Math.random() > density || (radialPos > 0.3 && radialPos < 0.4)) {
        data[i + 3] = 0 // Alpha
      } else {
        data[i + 3] = Math.max(0, Math.min(255, data[i + 3] * density))
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    return texture
  }, [color, noiseScale, noiseStrength, dustDensity])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    
    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms
      if (uniforms?.time) uniforms.time.value = time
      if (uniforms?.dustDensity) uniforms.dustDensity.value = dustDensity
      if (uniforms?.shadowIntensity) uniforms.shadowIntensity.value = shadowIntensity
      if (uniforms?.planetRadius) uniforms.planetRadius.value = planetRadius
      if (uniforms?.lightPosition) {
        uniforms.lightPosition.value = new THREE.Vector3(...lightPosition)
      }
    }
    
    // Apply planet rotation to rings if provided
    if (ringsRef.current && rotation) {
      ringsRef.current.rotation.copy(rotation)
    }
  })

  return (
    <mesh ref={ringsRef} rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={ringGeometry} />
      <planetRingsMaterial
        ref={materialRef}
        map={ringTexture}
        transparent
        opacity={1 - transparency}
        side={THREE.DoubleSide}
        depthWrite={false}
        time={0}
        dustDensity={dustDensity}
        shadowIntensity={shadowIntensity}
        planetRadius={planetRadius}
        lightPosition={lightPosition}
      />
    </mesh>
  )
}