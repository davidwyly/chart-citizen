import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface TerrestrialPlanetProps {
  scale?: number
  shaderScale?: number
  qualityLevel?: 'low' | 'medium' | 'high'
  customizations?: {
    intensity?: number
    speed?: number
    distortion?: number
    topColor?: [number, number, number]
    middleColor?: [number, number, number]
    bottomColor?: [number, number, number]
  }
}

export function TerrestrialPlanet({
  scale = 1,
  shaderScale = 1,
  qualityLevel = 'high',
  customizations = {}
}: TerrestrialPlanetProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  // Create material instance based on quality level
  const material = useMemo(() => {
    const segments = qualityLevel === 'high' ? 64 : qualityLevel === 'medium' ? 32 : 16
    
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        speed: { value: 1.0 },
        distortion: { value: 1.0 },
        topColor: { value: new THREE.Color(0.8, 0.6, 0.4) },
        middleColor: { value: new THREE.Color(0.6, 0.4, 0.2) },
        bottomColor: { value: new THREE.Color(0.4, 0.3, 0.2) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform vec3 topColor;
        uniform vec3 middleColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
          vec3 color = mix(bottomColor, topColor, fresnel);
          gl_FragColor = vec4(color * intensity, 1.0);
        }
      `
    })
  }, [qualityLevel])
  
  // Update shader uniforms
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime()
      
      // Apply customizations if provided
      if (customizations.intensity !== undefined) {
        materialRef.current.uniforms.intensity.value = customizations.intensity
      }
      if (customizations.speed !== undefined) {
        materialRef.current.uniforms.speed.value = customizations.speed
      }
      if (customizations.distortion !== undefined) {
        materialRef.current.uniforms.distortion.value = customizations.distortion
      }
      if (customizations.topColor) {
        materialRef.current.uniforms.topColor.value.setRGB(...customizations.topColor)
      }
      if (customizations.middleColor) {
        materialRef.current.uniforms.middleColor.value.setRGB(...customizations.middleColor)
      }
      if (customizations.bottomColor) {
        materialRef.current.uniforms.bottomColor.value.setRGB(...customizations.bottomColor)
      }
    }
  })
  
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1 * shaderScale, 64, 64]} />
      <primitive object={material} attach="material" ref={materialRef} />
    </mesh>
  )
} 