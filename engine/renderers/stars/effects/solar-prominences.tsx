"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface SolarProminencesProps {
  radius: number
  count?: number
  intensity?: number
  color?: THREE.Color
}

export function SolarProminences({
  radius,
  count = 8,
  intensity = 1.0,
  color = new THREE.Color(1.0, 0.5, 0.1),
}: SolarProminencesProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Create prominence data
  const prominenceData = useMemo(() => {
    const data = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const height = radius * (0.3 + Math.random() * 0.4)
      const width = radius * (0.1 + Math.random() * 0.2)
      const phase = Math.random() * Math.PI * 2
      const speed = 0.2 + Math.random() * 0.3

      data.push({
        angle,
        height,
        width,
        phase,
        speed,
      })
    }
    return data
  }, [radius, count])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (groupRef.current) {
      prominenceData.forEach((prominence, i) => {
        const child = groupRef.current?.children[i]
        if (child) {
          // Animate prominence height
          const scale = 1.0 + Math.sin(time * prominence.speed + prominence.phase) * 0.3
          child.scale.y = scale

          // Animate prominence position slightly
          const wobble = Math.sin(time * 0.5 + prominence.phase) * 0.1
          child.rotation.z = prominence.angle + wobble
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {prominenceData.map((prominence, i) => (
        <mesh key={i} rotation={[0, 0, prominence.angle]}>
          <planeGeometry args={[prominence.width, prominence.height]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7 * intensity}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}
