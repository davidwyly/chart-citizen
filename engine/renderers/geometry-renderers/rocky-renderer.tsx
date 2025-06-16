"use client"

import React, { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { PlanetRingsRenderer } from "../planets/planet-rings-renderer"
import { InteractiveObject } from "../../components/3d-ui/interactive-object"
import type { GeometryRendererProps } from "./types"

/**
 * Rocky renderer for moons, Mercury-like bodies, and other rocky celestial objects
 * Features: realistic surface textures, crater generation, basic materials, optional rings
 */
export function RockyRenderer({
  object,
  scale,
  starPosition = [0, 0, 0],
  position = [0, 0, 0],
  isSelected,
  planetSystemSelected = false,
  shaderParams,
  onHover,
  onSelect,
  onFocus,
  registerRef,
}: GeometryRendererProps) {
  const bodyRef = useRef<THREE.Group>(null)
  const surfaceRef = useRef<THREE.Mesh>(null)

  const { properties } = object
  const radius = scale

  // Calculate rotation rate from properties
  const rotationRate = 0.0002 / (properties.rotation_period || 24.0)

  // Create surface texture based on properties
  const surfaceTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext("2d")!

    // Base surface color
    const baseColor = properties.surface_color || "#C0C0C0"
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add craters based on crater_density
    const craterDensity = properties.crater_density || 50
    const numCraters = Math.floor((craterDensity / 100) * 100)
    
    for (let i = 0; i < numCraters; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = 3 + Math.random() * 15
      
      // Create crater shadow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      gradient.addColorStop(0, "#666666")
      gradient.addColorStop(0.5, "#888888")
      gradient.addColorStop(1, baseColor)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    // Add surface variance (bumpiness)
    const surfaceVariance = properties.surface_variance || 30
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * (surfaceVariance / 100) * 30
      imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise))
      imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise))
      imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise))
    }
    ctx.putImageData(imageData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [properties.surface_color, properties.crater_density, properties.surface_variance])

  useFrame(({ clock }) => {
    if (bodyRef.current) {
      // Handle rotation
      const direction = properties.axial_tilt && properties.axial_tilt > 90 ? -1 : 1
      bodyRef.current.rotation.y += rotationRate * direction
    }
  })



  // Register ref for external access
  React.useEffect(() => {
    if (bodyRef.current) {
      registerRef(object.id, bodyRef.current)
    }
  }, [object.id, registerRef])

  // Calculate surface material properties
  const albedo = (properties.albedo || 30) / 100
  const roughness = 1 - albedo // Higher albedo = smoother surface
  const metalness = 0.1 // Rocky bodies are typically not very metallic

  return (
    <InteractiveObject
      objectId={object.id}
      objectName={object.name}
      objectType={object.classification === 'star' ? 'star' : object.classification === 'planet' ? 'planet' : object.classification === 'moon' ? 'moon' : 'planet'}
      radius={radius}
      position={position}
      isSelected={isSelected}
      planetSystemSelected={planetSystemSelected}
      onHover={(id, hovered) => onHover?.(hovered ? id : null)}
      onSelect={onSelect}
      onFocus={(obj, name, visualSize) => onFocus?.(obj, name, visualSize || scale, properties.radius, properties.mass, 0)}
      registerRef={registerRef}
      showLabel={true}
    >
      <group ref={bodyRef}>
        {/* Main rocky surface */}
        <mesh ref={surfaceRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            map={surfaceTexture}
            roughness={roughness}
            metalness={metalness}
            color={properties.surface_color || "#C0C0C0"}
          />
        </mesh>

        {/* Ring system if present (rare but possible for large moons) */}
        {object.rings && object.rings.length > 0 && (
          <group>
            {object.rings.map((ring, index) => (
              <PlanetRingsRenderer
                key={ring.id}
                planetRadius={radius}
                innerRadius={ring.radius_start}
                outerRadius={ring.radius_end}
                color={ring.color || "#888888"}
                transparency={1 - (ring.opacity || 50) / 100}
                divisions={4}
                noiseScale={0.3}
                noiseStrength={0.2}
                dustDensity={ring.density === 'dense' ? 0.7 : ring.density === 'moderate' ? 0.4 : 0.2}
                shadowIntensity={0.3}
                rotation={bodyRef.current?.rotation}
                lightPosition={starPosition}
              />
            ))}
          </group>
        )}
      </group>
    </InteractiveObject>
  )
}

// Mark this renderer as ring-capable
;(RockyRenderer as any).supportsRings = true 