import { useRef, useMemo, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { RaymarchedBlackHoleMaterial } from "./materials/raymarched-black-hole-material"

interface RaymarchedBlackHoleProps {
  scale?: number
  shaderScale?: number
  customizations?: {
    shader?: {
      intensity?: number
      speed?: number
      distortion?: number
      diskSpeed?: number
      lensingStrength?: number
      diskBrightness?: number
    }
  }
}

export function RaymarchedBlackHole({
  scale = 1.0,
  shaderScale = 1.0,
  customizations = {}
}: RaymarchedBlackHoleProps) {
  const materialRef = useRef<RaymarchedBlackHoleMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const { size, camera } = useThree()

  // Create a camera-facing quad geometry
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(2, 2)
  }, [])

  // Create the material
  const material = useMemo(() => {
    return new RaymarchedBlackHoleMaterial()
  }, [])

  // Update resolution when size changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.updateResolution(size.width, size.height)
    }
  }, [size.width, size.height])

  // Update shader uniforms and make quad face camera
  useFrame((state) => {
    if (materialRef.current && meshRef.current) {
      // Update time
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime()
      
      // Update camera position
      materialRef.current.uniforms.cameraPosition.value.copy(camera.position)
      
      // Make the quad face the camera
      meshRef.current.lookAt(camera.position)
      
      // Apply customizations
      if (customizations.shader) {
        const { intensity, speed, distortion, diskSpeed, lensingStrength, diskBrightness } = customizations.shader
        
        if (intensity !== undefined) materialRef.current.uniforms.intensity.value = intensity
        if (speed !== undefined) materialRef.current.uniforms.speed.value = speed
        if (distortion !== undefined) materialRef.current.uniforms.distortion.value = distortion
        
        // Map new parameters to existing uniforms
        if (diskSpeed !== undefined) materialRef.current.uniforms.speed.value = diskSpeed
        if (lensingStrength !== undefined) materialRef.current.uniforms.distortion.value = lensingStrength
        if (diskBrightness !== undefined) materialRef.current.uniforms.intensity.value = diskBrightness
      }
    }
  })

  return (
    <mesh ref={meshRef} scale={scale * shaderScale}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" ref={materialRef} />
    </mesh>
  )
} 