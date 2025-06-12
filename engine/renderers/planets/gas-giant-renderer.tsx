"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { useFrame, extend } from "@react-three/fiber"
import * as THREE from "three"
import { GasGiantMaterial } from "./materials/gas-giant-material"
import { StormMaterial } from "./materials/storm-material"
import { AtmosphericStorms } from "./effects/atmospheric-storms"
import { PlanetRingsRenderer } from "./planet-rings-renderer"
import type { CatalogObject } from "@/engine/system-loader"

// Extend Three.js with our custom material
extend({ GasGiantMaterial, StormMaterial })

interface GasGiantRendererProps {
  catalogData: CatalogObject
  position?: [number, number, number]
  scale?: number
  radius?: number
  onFocus?: (object: THREE.Object3D, name: string) => void
}

export function GasGiantRenderer({
  catalogData,
  position = [0, 0, 0],
  scale = 1,
  radius = 1,
  onFocus,
}: GasGiantRendererProps) {
  const planetRef = useRef<THREE.Group>(null)
  const surfaceRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  // Extract data from catalog
  const physical = catalogData.physical || {}
  const features = catalogData.features || {}
  const appearance = catalogData.appearance || {}

  // Calculate rendering parameters
  const rotationRate = 0.0002 / (features.rotation_period || 9.9)
  const hasRings = features.ring_system !== undefined ? features.ring_system > 0 : false
  const ringProminence = features.ring_system || 0.5
  const stormIntensity = features.storm_intensity || 0.5
  const bandCount = features.band_count || 6

  // Generate enhanced gas giant texture with better banding
  const { surfaceTexture, normalTexture } = useMemo(() => {
    // Create canvas for texture generation
    const canvas = document.createElement("canvas")
    const normalCanvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    normalCanvas.width = 1024
    normalCanvas.height = 512
    const ctx = canvas.getContext("2d")!
    const normalCtx = normalCanvas.getContext("2d")!

    // Fill with solid background
    ctx.fillStyle = appearance.primary_color || "#e0c068"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw banded structure
    const bandColors = appearance.band_colors || [
      "#e0c068", // Primary
      "#a06820", // Secondary
      "#c89848", // Band
    ]

    // Draw atmospheric bands
    for (let y = 0; y < canvas.height; y++) {
      // Calculate normalized y position
      const normY = y / canvas.height
      
      // Calculate band position
      const bandPos = Math.sin(normY * bandCount * Math.PI * 2) * 0.5 + 0.5
      
      // Determine color based on band position
      let bandColor
      if (bandPos < 0.3) {
        bandColor = bandColors[0]
      } else if (bandPos > 0.7) {
        bandColor = bandColors[1]
      } else {
        bandColor = bandColors[2]
      }
      
      // Draw horizontal band line
      ctx.fillStyle = bandColor
      ctx.fillRect(0, y, canvas.width, 1)
      
      // Generate normal map data for the band
      const normalValue = Math.sin(normY * bandCount * Math.PI * 2) * 128 + 128
      normalCtx.fillStyle = `rgb(128, ${normalValue}, 128)`
      normalCtx.fillRect(0, y, canvas.width, 1)
    }

    // Add storm features if intensity > 0
    if (stormIntensity > 0) {
      // Create great spot
      const spotX = canvas.width * 0.3
      const spotY = canvas.height * 0.6
      const spotRadiusX = canvas.width * 0.15
      const spotRadiusY = canvas.height * 0.06

      const gradient = ctx.createRadialGradient(
        spotX, spotY, 0,
        spotX, spotY, spotRadiusX
      )
      
      gradient.addColorStop(0, appearance.storm_color || "#ff4400")
      gradient.addColorStop(0.7, appearance.storm_color || "#ff4400")
      gradient.addColorStop(1, "transparent")

      ctx.save()
      ctx.scale(1, spotRadiusY / spotRadiusX)
      ctx.beginPath()
      ctx.ellipse(spotX, spotY * (spotRadiusX / spotRadiusY), spotRadiusX, spotRadiusX, 0, 0, Math.PI * 2)
      ctx.restore()
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Add normal map bump for the spot
      const normalGradient = normalCtx.createRadialGradient(
        spotX, spotY, 0,
        spotX, spotY, spotRadiusX
      )
      
      normalGradient.addColorStop(0, "rgb(180, 180, 255)")
      normalGradient.addColorStop(0.7, "rgb(150, 150, 200)")
      normalGradient.addColorStop(1, "rgb(128, 128, 128)")
      
      normalCtx.save()
      normalCtx.scale(1, spotRadiusY / spotRadiusX)
      normalCtx.beginPath()
      normalCtx.ellipse(spotX, spotY * (spotRadiusX / spotRadiusY), spotRadiusX, spotRadiusX, 0, 0, Math.PI * 2)
      normalCtx.restore()
      normalCtx.fillStyle = normalGradient
      normalCtx.fill()
      
      // Add smaller storm systems
      const stormCount = Math.floor(stormIntensity * 12)
      for (let i = 0; i < stormCount; i++) {
        const size = 5 + Math.random() * 30
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        
        const stormGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
        stormGradient.addColorStop(0, appearance.storm_color || "#ff4400")
        stormGradient.addColorStop(0.6, appearance.storm_color || "#ff4400")
        stormGradient.addColorStop(1, "transparent")
        
        ctx.beginPath()
        ctx.ellipse(x, y, size, size * 0.4, 0, 0, Math.PI * 2)
        ctx.fillStyle = stormGradient
        ctx.fill()
        
        // Add normal map bump for the small storm
        const smallStormGradient = normalCtx.createRadialGradient(x, y, 0, x, y, size)
        smallStormGradient.addColorStop(0, "rgb(170, 170, 230)")
        smallStormGradient.addColorStop(0.6, "rgb(140, 140, 180)")
        smallStormGradient.addColorStop(1, "rgb(128, 128, 128)")
        
        normalCtx.beginPath()
        normalCtx.ellipse(x, y, size, size * 0.4, 0, 0, Math.PI * 2)
        normalCtx.fillStyle = smallStormGradient
        normalCtx.fill()
      }
    }

    // Create textures from canvas
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    const normalTexture = new THREE.CanvasTexture(normalCanvas)
    normalTexture.wrapS = THREE.RepeatWrapping
    normalTexture.wrapT = THREE.ClampToEdgeWrapping

    return { surfaceTexture: texture, normalTexture }
  }, [bandCount, appearance.band_colors, stormIntensity, appearance.storm_color, appearance.primary_color])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (planetRef.current) {
      planetRef.current.rotation.y += rotationRate
    }

    if (materialRef.current?.uniforms) {
      materialRef.current.uniforms.time.value = time
      materialRef.current.uniforms.stormIntensity.value = stormIntensity
      materialRef.current.uniforms.bandCount.value = bandCount
      materialRef.current.uniforms.atmosphereThickness.value = 0.3
      materialRef.current.uniforms.lightDirection.value = [1.0, 1.0, 0.8]
      materialRef.current.uniforms.atmosphereColor.value = appearance.atmosphere_color
        ? [
            Number.parseInt(appearance.atmosphere_color.slice(1, 3), 16) / 255,
            Number.parseInt(appearance.atmosphere_color.slice(3, 5), 16) / 255,
            Number.parseInt(appearance.atmosphere_color.slice(5, 7), 16) / 255,
          ]
        : [1.0, 0.7, 0.4]
      materialRef.current.uniforms.rotationSpeed.value = rotationRate * 100
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (planetRef.current && onFocus) {
      onFocus(planetRef.current, catalogData.name)
    }
  }

  return (
    <group ref={planetRef}>
      {/* Gas giant surface with enhanced shader */}
      <mesh ref={surfaceRef} onClick={handleClick}>
        <sphereGeometry args={[radius, 128, 128]} />
        {/* @ts-ignore */}
        <gasGiantMaterial
          ref={materialRef}
          map={surfaceTexture}
          normalMap={normalTexture}
          time={0}
          stormIntensity={stormIntensity}
          bandCount={bandCount}
          atmosphereThickness={0.3}
          lightDirection={[1.0, 1.0, 0.8]}
          atmosphereColor={[1.0, 0.7, 0.4]}
          rotationSpeed={0.02}
        />
      </mesh>

      {/* Atmospheric layers */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[radius * 1.01, 64, 64]} />
        <meshLambertMaterial
          color={appearance.atmosphere_color || "#fad5a5"}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Upper atmosphere haze */}
      <mesh>
        <sphereGeometry args={[radius * 1.03, 32, 32]} />
        <meshLambertMaterial
          color={appearance.atmosphere_color || "#fad5a5"}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Enhanced ring system using PlanetRingsRenderer */}
      {hasRings && (
        <PlanetRingsRenderer
          planetRadius={radius}
          innerRadius={1.3}
          outerRadius={2.5}
              color={appearance.ring_color || "#c0c0c0"}
          transparency={ringProminence * 0.7}
          divisions={bandCount}
          noiseScale={0.5}
          noiseStrength={0.3}
          dustDensity={ringProminence}
          shadowIntensity={0.5}
          rotation={planetRef.current?.rotation}
          lightPosition={[1.0, 1.0, 0.8]}
        />
      )}

      {/* Dynamic atmospheric storms */}
      {stormIntensity > 0.3 && (
        <AtmosphericStorms
          radius={radius}
          stormCount={Math.floor(stormIntensity * 8)}
          intensity={stormIntensity}
          planetRotation={planetRef}
            />
      )}
    </group>
  )
}
