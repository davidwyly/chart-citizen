"use client"

import { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { createStarfieldMaterial } from "./starfield-material"

interface StarfieldSkyboxProps {
  nebulaIntensity?: number
  nebulaParallax?: number
  starParallax?: number
}

export function StarfieldSkybox({ nebulaIntensity = 0.5, nebulaParallax = 0.0, starParallax = 0.15 }: StarfieldSkyboxProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  // Create the starfield material with nebula and star parallax
  const material = useMemo(() => createStarfieldMaterial(nebulaIntensity, nebulaParallax, starParallax), [nebulaIntensity, nebulaParallax, starParallax])

  // Keep the skybox centered on the camera and update time and camera rotation uniforms
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position)
    }
    if (material.uniforms.iTime) {
      material.uniforms.iTime.value = state.clock.getElapsedTime();
    }
    if (material.uniforms.nebulaIntensity) {
      material.uniforms.nebulaIntensity.value = nebulaIntensity;
    }
    if (material.uniforms.nebulaParallax) {
      material.uniforms.nebulaParallax.value = nebulaParallax;
    }
    if (material.uniforms.starParallax) {
      material.uniforms.starParallax.value = starParallax;
    }
    // Pass camera rotation matrix for parallax effect
    if (material.uniforms.cameraRotation) {
      material.uniforms.cameraRotation.value = new THREE.Matrix3().setFromMatrix4(camera.matrixWorld);
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={-1} material={material}>
      <sphereGeometry args={[2000, 32, 32]} />
    </mesh>
  )
}
