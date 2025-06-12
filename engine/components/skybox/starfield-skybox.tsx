"use client"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { createStarfieldMaterial } from "./starfield-material"

export function StarfieldSkybox() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  // Create the starfield material
  const material = createStarfieldMaterial()

  // Keep the skybox centered on the camera
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position)
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={-1} material={material}>
      <sphereGeometry args={[2000, 32, 32]} />
    </mesh>
  )
}
