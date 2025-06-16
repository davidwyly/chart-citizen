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

  // Keep the skybox centered on the camera and update time uniform
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position)
    }
    if (material.uniforms.iTime) {
      material.uniforms.iTime.value = state.clock.getElapsedTime();
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={-1} material={material}>
      <sphereGeometry args={[2000, 32, 32]} />
    </mesh>
  )
}
