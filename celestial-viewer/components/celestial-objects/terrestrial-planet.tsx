"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere } from "@react-three/drei"
import * as THREE from "three"

interface TerrestrialPlanetProps {
  scale: number
  landWaterRatio: number // 0 (all water) to 1 (all land)
  temperature: number // 0 (cold) to 100 (hot) -> maps to e.g., -50C to 50C
  atmosphereDensity: number // 0 (none) to 1 (dense)
  atmosphereComposition: string // "nitrogen-oxygen", "carbon-dioxide", "methane"
  volcanismLevel: number // 0 (none) to 1 (high)
  civilizationPresence: number // 0 (none) to 1 (high)
}

// Helper to create a simple procedural texture for land/water/ice
const createPlanetTexture = (
  size: number,
  landWaterRatio: number,
  temperature: number,
  volcanismLevel: number,
  civilizationPresence: number,
) => {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!

  // Base colors
  const waterColor = "#3B82F6" // Blue-500
  const landColor = "#854d0e" // Amber-800
  const desertColor = "#f59e0b" // Amber-500
  const iceColor = "#ffffff"
  const lavaColor = "rgba(255, 69, 0, 0.7)" // OrangeRed with alpha
  const cityLightColor = "rgba(255, 255, 224, 0.8)" // LightYellow

  // Temperature mapping: 0-20 (Frozen), 21-40 (Cold), 41-60 (Temperate), 61-80 (Warm), 81-100 (Hot)
  const isFrozen = temperature <= 20
  const isCold = temperature > 20 && temperature <= 40
  const isTemperate = temperature > 40 && temperature <= 60
  const isWarm = temperature > 60 && temperature <= 80
  const isHot = temperature > 80

  // Fill with base water color
  ctx.fillStyle = waterColor
  ctx.fillRect(0, 0, size, size)

  // Procedural "continents"
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = (Math.random() * size) / 5 + size / 20 // Varying continent sizes

    let continentColor = landColor
    if (isHot) continentColor = desertColor
    if (isFrozen && landWaterRatio < 0.3) continentColor = iceColor // If mostly water and frozen, land becomes ice too

    ctx.fillStyle = continentColor
    ctx.beginPath()
    ctx.arc(x, y, r * landWaterRatio, 0, Math.PI * 2) // landWaterRatio affects continent size
    ctx.fill()

    // Add some volcanism visuals
    if (volcanismLevel > 0.3 && Math.random() < volcanismLevel * 0.5) {
      ctx.fillStyle = lavaColor
      ctx.beginPath()
      ctx.arc(x + (Math.random() - 0.5) * r, y + (Math.random() - 0.5) * r, r * 0.1 * volcanismLevel, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Ice caps based on temperature
  const iceCapSize = Math.max(0, (40 - temperature) / 40) * (size / 2) // Larger caps for colder temps
  if (iceCapSize > 0) {
    ctx.fillStyle = iceColor
    // Top cap
    ctx.beginPath()
    ctx.arc(size / 2, 0, iceCapSize * 1.5, 0, Math.PI * 2) // Make it wider than tall
    ctx.fill()
    // Bottom cap
    ctx.beginPath()
    ctx.arc(size / 2, size, iceCapSize * 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // If very hot, oceans evaporate (show more desert)
  if (isHot && temperature > 90) {
    const evaporationFactor = (temperature - 90) / 10
    ctx.globalAlpha = evaporationFactor * 0.5 // Make water semi-transparent
    ctx.fillStyle = desertColor
    ctx.fillRect(0, 0, size, size)
    ctx.globalAlpha = 1.0
  }

  // City lights on "dark side" (simulated by random placement)
  if (civilizationPresence > 0.1) {
    const numLights = Math.floor(civilizationPresence * 500 * (landWaterRatio > 0.1 ? 1 : 0.1)) // More lights on land
    ctx.fillStyle = cityLightColor
    for (let i = 0; i < numLights; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      // Simple check to avoid placing lights directly on pure water areas (heuristic)
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
      const isWater = pixel[0] < 100 && pixel[1] < 150 && pixel[2] > 150 // Heuristic for blueish water
      if (!isWater || landWaterRatio > 0.8) {
        // Allow lights on small water bodies if mostly land
        ctx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1)
      }
    }
  }

  return new THREE.CanvasTexture(canvas)
}

// Cloud texture
const createCloudTexture = (size: number, atmosphereDensity: number, temperature: number) => {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!

  // Cloud coverage affected by density and temperature (less clouds if very hot)
  const coverage = atmosphereDensity * (1 - Math.max(0, (temperature - 70) / 30) * 0.8)

  if (coverage < 0.05) {
    // If very low coverage, make it almost transparent
    ctx.fillStyle = "rgba(255, 255, 255, 0.01)"
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)" // Semi-transparent white clouds
  for (let i = 0; i < 100 * coverage; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = (Math.random() * size) / 8 + size / 30
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return new THREE.CanvasTexture(canvas)
}

export function TerrestrialPlanet({
  scale,
  landWaterRatio,
  temperature,
  atmosphereDensity,
  atmosphereComposition,
  volcanismLevel,
  civilizationPresence,
}: TerrestrialPlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null!)
  const cloudsRef = useRef<THREE.Mesh>(null!)

  const planetTexture = useMemo(
    () => createPlanetTexture(512, landWaterRatio, temperature, volcanismLevel, civilizationPresence),
    [landWaterRatio, temperature, volcanismLevel, civilizationPresence],
  )

  const cloudTexture = useMemo(
    () => createCloudTexture(512, atmosphereDensity, temperature),
    [atmosphereDensity, temperature],
  )

  const atmosphereColor = useMemo(() => {
    const color = new THREE.Color(0xadd8e6) // Light blue (Nitrogen-Oxygen default)
    if (atmosphereComposition === "carbon-dioxide") {
      color.set(0xffa07a) // Light salmon (Venus-like)
    } else if (atmosphereComposition === "methane") {
      color.set(0x98fb98) // Pale green (Titan-like)
    }
    // Thicker atmosphere from volcanism
    color.lerp(new THREE.Color(0x808080), volcanismLevel * 0.3) // Lerp towards grey for volcanic haze
    return color
  }, [atmosphereComposition, volcanismLevel])

  useFrame((state, delta) => {
    planetRef.current.rotation.y += delta * 0.1
    cloudsRef.current.rotation.y += delta * 0.12 // Clouds rotate slightly faster
  })

  return (
    <>
      <Sphere ref={planetRef} args={[1, 64, 64]} scale={scale}>
        <meshStandardMaterial
          map={planetTexture}
          roughness={0.8}
          metalness={0.1}
          emissiveMap={planetTexture} // Use same texture for emissive city lights
          emissive={0xffffff} // White emissive color, intensity controlled by texture
          emissiveIntensity={civilizationPresence > 0.1 ? 1.5 * civilizationPresence : 0}
        />
      </Sphere>
      {/* Clouds / Atmosphere Shell */}
      <Sphere ref={cloudsRef} args={[1.02, 64, 64]} scale={scale}>
        <meshPhongMaterial
          map={cloudTexture}
          transparent
          opacity={Math.min(0.8, atmosphereDensity * 1.2)} // Cap opacity
          depthWrite={false}
          color={atmosphereColor} // Tint clouds with atmosphere color
        />
      </Sphere>
    </>
  )
}
