"use client"

import { useRef } from "react"
import { useFrame, useThree, extend } from "@react-three/fiber"
import * as THREE from "three"
import { StarCoronaMaterial } from "../materials/star-corona-material"

extend({ StarCoronaMaterial })

interface StarCoronaProps {
  radius?: number
  intensity?: number
  color?: THREE.Color
  scale?: number
  curvatureAmount?: number
}

export function StarCorona({
  radius = 2.1,
  intensity = 1.0,
  color = new THREE.Color(1.0, 0.3, 0.1),
  scale = 1,
  curvatureAmount = 0.3,
}: StarCoronaProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)
  const { camera } = useThree()

  // Store the initial parent matrix for stable positioning
  const parentMatrixRef = useRef<THREE.Matrix4 | null>(null)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (!materialRef.current || !meshRef.current) return

    // Store initial parent matrix if not already stored
    if (!parentMatrixRef.current && meshRef.current.parent) {
      parentMatrixRef.current = new THREE.Matrix4().copy(meshRef.current.parent.matrixWorld)
    }

    // === Uniforms ===
    materialRef.current.uniforms.time.value = time * 0.15
    materialRef.current.uniforms.intensity.value = intensity
    materialRef.current.uniforms.color.value = color
    materialRef.current.uniforms.curvatureAmount.value = curvatureAmount

    // Get star position in world space
    const starWorldPos = new THREE.Vector3()
    if (meshRef.current.parent) {
      // Use the parent's current world matrix
      starWorldPos.setFromMatrixPosition(meshRef.current.parent.matrixWorld)
    }

    // Calculate camera-to-star vector for positioning and shader effects
    const viewVec = camera.position.clone().sub(starWorldPos)
    const cameraDistance = viewVec.length()
    const viewVecDir = viewVec.normalize()

    // Calculate orbital angles for shader effects
    const orbitalAngle = Math.atan2(viewVec.x, viewVec.z)
    const verticalAngle = Math.atan2(viewVec.y, Math.sqrt(viewVec.x * viewVec.x + viewVec.z * viewVec.z))

    // Pass orbital information to shader for dynamic effects
    materialRef.current.uniforms.rotation.value = orbitalAngle
    materialRef.current.uniforms.viewDirection.value = new THREE.Vector2(
      Math.cos(orbitalAngle) * 0.5,
      verticalAngle * 0.5,
    )

    // IMPORTANT: Corona must be offset in front of the star
    // 1. The corona is a 2D sprite (plane geometry)
    // 2. Without offset, it would z-fight with the star's 3D geometry
    // 3. The offset needs to be proportional to star size for consistent appearance
    const fixedOffset = radius * 0.1 // Small fixed offset proportional to star size

    // Position corona slightly in front of star along view direction
    // This ensures the corona is always visible and doesn't clip with the star
    meshRef.current.position.copy(starWorldPos)
    meshRef.current.position.add(viewVecDir.clone().multiplyScalar(fixedOffset))

    // Make corona face camera for proper 2D sprite rendering
    // This ensures the corona is always visible from any angle
    meshRef.current.lookAt(camera.position)

    // Scale corona based on distance and star radius
    // This maintains consistent visual size regardless of camera distance
    const distanceScale = Math.max(0.3, Math.min(1.0, cameraDistance / (radius * 3)))
    const coronaSize = radius * scale * 1.3 * distanceScale
    meshRef.current.scale.set(coronaSize, coronaSize, 1)
  })

  return (
    <mesh ref={meshRef} renderOrder={10} matrixAutoUpdate={true}>
      <planeGeometry args={[2, 2]} />
      {/* @ts-ignore */}
      <starCoronaMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        color={color}
        intensity={intensity}
        viewDirection={new THREE.Vector2(0, 0)}
        curvatureAmount={curvatureAmount}
        rotation={0}
      />
    </mesh>
  )
}
