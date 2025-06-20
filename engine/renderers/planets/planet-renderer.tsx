"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { RendererProps } from "../renderer-props"

export function PlanetRenderer({ catalogData, position = [0, 0, 0], scale = 1, onFocus }: RendererProps) {
  const planetRef = useRef<THREE.Group>(null)
  const surfaceRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  // Extract data from catalog
  const physical = catalogData.physical || {}
  const features = catalogData.features || {}
  const appearance = catalogData.appearance || {}

  // Calculate rendering parameters
  const radius = (physical.radius || 1.0) * scale

  // Significantly slow down rotation rate - divide by 100 to make it much more manageable
  // This makes planets rotate at a reasonable speed that allows interaction
  const rotationRate = 0.0002 / (features.rotation_period || 24.0)

  const hasAtmosphere = (physical.atmospheric_pressure || 0) > 0.01
  const hasRings = features.has_rings || false
  const hasClouds = features.cloud_coverage && features.cloud_coverage > 0.1

  // Create realistic surface texture
  const surfaceTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext("2d")!

    // Base color
    const baseColor = appearance.base_color || "#6b93d6"
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add terrain features based on planet type
    if (features.ocean_coverage && features.ocean_coverage > 0.5) {
      // Earth-like planet with oceans and continents
      const oceanColor = appearance.ocean_color || "#1e90ff"
      const landColor = appearance.land_color || "#8fbc8f"

      // Create continents
      for (let i = 0; i < 7; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = 80 + Math.random() * 120

        ctx.fillStyle = landColor
        ctx.beginPath()
        ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()

        // Add coastal details
        ctx.strokeStyle = oceanColor
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Add ice caps if present
      if (features.ice_caps) {
        const iceColor = appearance.ice_color || "#f0f8ff"
        ctx.fillStyle = iceColor
        // North pole
        ctx.fillRect(0, 0, canvas.width, 40)
        // South pole
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40)
      }
    } else if (features.crater_density && features.crater_density > 0.5) {
      // Cratered world like Mercury/Moon
      const craterColor = appearance.crater_color || "#696969"
      const craterCount = Math.floor(features.crater_density * 200)

      for (let i = 0; i < craterCount; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = 5 + Math.random() * 25

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
        gradient.addColorStop(0, craterColor)
        gradient.addColorStop(0.7, baseColor)
        gradient.addColorStop(1, baseColor)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (features.sand_coverage && features.sand_coverage > 0.5) {
      // Desert world like Mars
      const sandColor = appearance.sand_color || "#daa520"
      const dustColor = appearance.dust_color || "#f4a460"

      // Add sand dunes
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const width = 30 + Math.random() * 60
        const height = 10 + Math.random() * 20

        ctx.fillStyle = sandColor
        ctx.beginPath()
        ctx.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }

      // Add polar ice caps if present
      if (features.polar_ice_caps) {
        const iceColor = appearance.ice_color || "#e0f6ff"
        ctx.fillStyle = iceColor
        ctx.fillRect(0, 0, canvas.width, 30)
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30)
      }
    }

    // Add surface noise for realism
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20
      imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise))
      imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise))
      imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise))
    }
    ctx.putImageData(imageData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    return texture
  }, [features, appearance])

  // Create cloud texture
  const cloudTexture = useMemo(() => {
    if (!hasClouds) return null

    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext("2d")!

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const cloudColor = appearance.cloud_color || "#ffffff"

    // Generate cloud patterns
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = 20 + Math.random() * 40
      const opacity = 0.3 + Math.random() * 0.4

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    return texture
  }, [hasClouds, appearance.cloud_color])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (planetRef.current) {
      // Handle retrograde rotation for Venus
      const direction = features.retrograde_rotation ? -1 : 1
      planetRef.current.rotation.y += rotationRate * direction
    }

    // Animate clouds slightly faster than surface
    if (cloudsRef.current && hasClouds) {
      cloudsRef.current.rotation.y += rotationRate * 1.2
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (planetRef.current && onFocus) {
      onFocus(planetRef.current, catalogData.name)
    }
  }

  const getAtmosphereColor = () => {
    return appearance.atmosphere_color || "#87ceeb"
  }

  const getAtmosphereOpacity = () => {
    if (!hasAtmosphere) return 0
    const pressure = physical.atmospheric_pressure || 1.0
    if (features.thick_atmosphere) return Math.min(0.9, pressure * 0.1)
    return Math.min(0.6, pressure * 0.3)
  }

  return (
    <group ref={planetRef}>
      {/* Planet surface */}
      <mesh ref={surfaceRef} scale={radius}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshLambertMaterial map={surfaceTexture} />
      </mesh>

      {/* City lights for inhabited worlds */}
      {features.city_lights && (
        <mesh scale={radius * 1.001}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={appearance.city_light_color || "#ffff99"}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Cloud layer */}
      {hasClouds && cloudTexture && (
        <mesh ref={cloudsRef} scale={radius * 1.005}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshLambertMaterial map={cloudTexture} transparent opacity={0.8} alphaMap={cloudTexture} />
        </mesh>
      )}

      {/* Atmosphere */}
      {hasAtmosphere && (
        <mesh ref={atmosphereRef} scale={radius * 1.02}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshLambertMaterial
            color={getAtmosphereColor()}
            transparent
            opacity={getAtmosphereOpacity()}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Atmospheric glow */}
      {hasAtmosphere && (
        <mesh scale={radius * 1.05}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={getAtmosphereColor()}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Ring system */}
      {hasRings && (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 1.2, radius * 2.0, 128]} />
            <meshLambertMaterial
              color={appearance.ring_color || "#c0c0c0"}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Ring shadow on planet */}
          {appearance.ring_shadow && (
            <mesh>
              <sphereGeometry args={[radius * 1.001, 32, 32]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.2} blending={THREE.MultiplyBlending} />
            </mesh>
          )}
        </group>
      )}
    </group>
  )
}
