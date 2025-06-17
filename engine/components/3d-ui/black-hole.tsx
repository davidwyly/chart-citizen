import React from 'react'

interface BlackHoleProps {
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

export function BlackHole({ scale = 1, shaderScale = 1, customizations }: BlackHoleProps) {
  return (
    <group scale={scale}>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
} 