import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface BlackHoleProps {
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

export function BlackHole({
  scale = 1.0,
  shaderScale = 1.0,
  customizations = {}
}: BlackHoleProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 64, 64), [])

  // Create basic black hole shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        speed: { value: 1.0 },
        distortion: { value: 1.0 },
        topColor: { value: new THREE.Color(0.0, 0.0, 0.0) },
        midColor1: { value: new THREE.Color(0.1, 0.0, 0.2) },
        midColor2: { value: new THREE.Color(0.2, 0.1, 0.0) },
        midColor3: { value: new THREE.Color(0.3, 0.2, 0.1) },
        bottomColor: { value: new THREE.Color(0.0, 0.0, 0.0) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * intensity);
        }
      `,
      transparent: true
    })
  }, [])

  // Update shader uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime()
      
      // Apply customizations
      if (customizations.shader) {
        const { intensity, speed, distortion, topColor, midColor1, midColor2, midColor3, bottomColor } = customizations.shader
        
        if (intensity !== undefined) materialRef.current.uniforms.intensity.value = intensity
        if (speed !== undefined) materialRef.current.uniforms.speed.value = speed
        if (distortion !== undefined) materialRef.current.uniforms.distortion.value = distortion
        
        if (topColor) materialRef.current.uniforms.topColor.value.set(...topColor)
        if (midColor1) materialRef.current.uniforms.midColor1.value.set(...midColor1)
        if (midColor2) materialRef.current.uniforms.midColor2.value.set(...midColor2)
        if (midColor3) materialRef.current.uniforms.midColor3.value.set(...midColor3)
        if (bottomColor) materialRef.current.uniforms.bottomColor.value.set(...bottomColor)
      }
    }
  })

  return (
    <mesh scale={scale}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" ref={materialRef} />
    </mesh>
  )
} 