"use client"

import React, { useRef, useMemo, useEffect } from "react"
import * as THREE from "three"
import type { GeometryRendererProps } from "./types"
import { AsteroidMaterial } from "./materials/asteroid-material"

/**
 * Volumetric Belt renderer for asteroid belts, Kuiper belts, and other debris fields
 * Features: volumetric field of dots, configurable density, composition-based coloring
 */
export function BeltRenderer({
  object,
  scale,
  starPosition = [0, 0, 0],
  position = [0, 0, 0],
  isSelected,
  onHover,
  onSelect,
  onFocus,
  registerRef,
}: GeometryRendererProps) {
  const beltRef = useRef<THREE.Group>(null)
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)

  const { properties } = object

  // Belt properties from orbital data
  // Use the calculated belt dimensions if available, otherwise fallback to scale-based calculation
  const innerRadius = (properties as any).belt_inner_radius || scale * 0.8
  const outerRadius = (properties as any).belt_outer_radius || scale * 1.2
  const beltRadius = (innerRadius + outerRadius) / 2
  const beltWidth = (outerRadius - innerRadius) / 2

  // Belt appearance properties
  const density = properties.belt_density || 'moderate'
  const particleSize = properties.particle_size || 'medium'
  const brightness = (properties.brightness || 50) / 100
  const tint = properties.tint || "#666666"

  // Calculate number of particles based on density - reduced for debugging
  const particleCount = useMemo(() => {
    const baseDensity = density === 'dense' ? 100 : density === 'moderate' ? 50 : 25
    // Scale with belt size to maintain consistent visual density
    const scaleFactor = Math.min(beltRadius / 10, 2) // Cap scaling to prevent excessive particles
    return Math.floor(baseDensity * scaleFactor)
  }, [density, beltRadius])

  // Calculate particle size based on properties - much larger for debugging
  const dotSize = useMemo(() => {
    const baseSize = particleSize === 'large' ? 0.1 : particleSize === 'medium' ? 0.08 : 0.06
    return baseSize * Math.max(beltRadius / 10, 1.0) // Much larger for visibility
  }, [particleSize, beltRadius])

  // Debug logging
  console.log(`🪨 BeltRenderer: ${object.name}`, {
    particleCount,
    innerRadius,
    outerRadius,
    dotSize,
    tint,
    scale,
    position
  })

  // Create varied asteroid colors for realism
  const asteroidColors = useMemo(() => {
    const baseColor = new THREE.Color(tint)
    const colors: THREE.Color[] = []
    
    for (let i = 0; i < particleCount; i++) {
      const variation = new THREE.Color(baseColor)
      // Add random variation to simulate different compositions
      const hue = variation.getHSL({ h: 0, s: 0, l: 0 })
      hue.h += (Math.random() - 0.5) * 0.1 // Slight hue variation
      hue.s += (Math.random() - 0.5) * 0.3 // Saturation variation
      hue.l += (Math.random() - 0.5) * 0.4 // Lightness variation
      variation.setHSL(hue.h, Math.max(0, Math.min(1, hue.s)), Math.max(0.1, Math.min(0.9, hue.l)))
      colors.push(variation)
    }
    
    return colors
  }, [tint, particleCount])

  // Generate particle positions within the belt volume
  const particlePositions = useMemo(() => {
    const positions: THREE.Vector3[] = []
    const matrix = new THREE.Matrix4()
    
    for (let i = 0; i < particleCount; i++) {
      // Random angle around the belt
      const angle = Math.random() * Math.PI * 2
      
      // Random radius within belt bounds (weighted towards center)
      const radiusWeight = Math.random() * Math.random() // Bias towards inner radius
      const radius = innerRadius + radiusWeight * (outerRadius - innerRadius)
      
      // Random vertical displacement (belt thickness)
      const verticalSpread = beltWidth * 0.1 // 10% of belt width for thickness
      const y = (Math.random() - 0.5) * verticalSpread
      
      // Calculate position
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      positions.push(new THREE.Vector3(x, y, z))
    }
    
    return positions
  }, [particleCount, innerRadius, outerRadius, beltWidth])

  // Setup instanced mesh with particle positions and colors
  useEffect(() => {
    if (!instancedMeshRef.current) return
    
    const dummy = new THREE.Object3D()
    
    particlePositions.forEach((pos, i) => {
      dummy.position.copy(pos)
      
      // Add random rotation and irregular scale for asteroid shapes
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      
      // More varied scaling to simulate irregular asteroid shapes
      const scaleX = 0.6 + Math.random() * 0.8 // 0.6x to 1.4x
      const scaleY = 0.6 + Math.random() * 0.8
      const scaleZ = 0.6 + Math.random() * 0.8
      dummy.scale.set(scaleX, scaleY, scaleZ)
      
      dummy.updateMatrix()
      
      // Set matrix and color for asteroid
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix)
      instancedMeshRef.current!.setColorAt(i, asteroidColors[i])
    })
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true
    instancedMeshRef.current.instanceColor!.needsUpdate = true
  }, [particlePositions, asteroidColors])

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (beltRef.current && onSelect) {
      onSelect(object.id, beltRef.current, object.name)
    }
  }

  // Register ref for external access
  useEffect(() => {
    if (beltRef.current) {
      registerRef(object.id, beltRef.current)
    }
  }, [object.id, registerRef])

  // Asteroids are fully opaque
  const opacity = 1.0

  // Reduced emissive for realistic asteroid appearance
  const emissiveIntensity = useMemo(() => {
    return density === 'dense' ? 0.1 : density === 'moderate' ? 0.08 : 0.05
  }, [density])

  // Create asteroid material with custom shader
  const asteroidMaterial = useMemo(() => {
    const material = new AsteroidMaterial(tint, {
      metalness: 0.3,
      roughness: 0.9,
      emissiveIntensity: emissiveIntensity
    })
    
    // Update light direction based on star position
    const starPos = new THREE.Vector3(...starPosition)
    material.updateLightDirection(starPos)
    
    return material
  }, [tint, emissiveIntensity, starPosition])

  return (
    <group 
      ref={beltRef} 
      position={position}
      onClick={handleClick}
      onPointerEnter={() => onHover?.(object.id)}
      onPointerLeave={() => onHover?.(null)}
    >
      {/* Realistic asteroid field - opaque irregular shapes with custom shader */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, particleCount]}
      >
        <icosahedronGeometry args={[dotSize, 1]} />
        <meshBasicMaterial 
          color="#ff0000" 
          transparent={false}
        />
      </instancedMesh>

      {/* Optional: Add a subtle ring outline for reference */}
      {isSelected && (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[innerRadius, innerRadius + 0.01, 64]} />
            <meshBasicMaterial 
              color="#ffffff"
              opacity={0.3}
              transparent={true}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[outerRadius - 0.01, outerRadius, 64]} />
            <meshBasicMaterial 
              color="#ffffff"
              opacity={0.3}
              transparent={true}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

// Belt renderer doesn't support rings
;(BeltRenderer as any).supportsRings = false 