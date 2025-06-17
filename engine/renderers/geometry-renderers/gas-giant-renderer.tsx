"use client"

import React, { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import { GasGiantMaterial } from "../planets/materials/gas-giant-material"
import { PlanetRingsRenderer } from "../planets/planet-rings-renderer"
import { InteractiveObject } from "../../components/3d-ui/interactive-object"
import type { GeometryRendererProps } from "./types"

// Register the custom shader materials
extend({ GasGiantMaterial })

/**
 * Gas Giant renderer for Jupiter-like planets with atmospheric bands and rings
 * Features: atmospheric bands, storm systems, great red spot, dynamic lighting, rings
 */
export function GasGiantRenderer({
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
  const planetRef = useRef<THREE.Group>(null)
  const surfaceRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial | any>(null!)

  const { properties } = object
  const radius = scale

  // Calculate rotation rate - gas giants typically rotate faster
  const rotationRate = 0.0002 / (properties.rotation_period || 9.9)

  // Gas giant specific properties
  const stormIntensity = (properties.band_contrast || 50) / 100
  const bandCount = Math.floor(((properties.band_contrast || 50) / 100) * 12) + 4
  const cloudOpacity = (properties.cloud_opacity || 80) / 100
  const hueShift = (properties.hue_shift || 0) / 100

  // Create atmospheric texture
  const surfaceTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext("2d")!

    // Base atmospheric color
    const baseHue = hueShift * 360
    ctx.fillStyle = `hsl(${baseHue + 30}, 60%, 70%)`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Create atmospheric bands
    for (let i = 0; i < bandCount; i++) {
      const y = (i / bandCount) * canvas.height
      const bandHeight = canvas.height / bandCount
      const lightness = 50 + (i % 2) * 20
      const saturation = 40 + Math.random() * 30
      
      ctx.fillStyle = `hsl(${baseHue + Math.random() * 60}, ${saturation}%, ${lightness}%)`
      ctx.fillRect(0, y, canvas.width, bandHeight)
      
      // Add turbulence within bands
      for (let j = 0; j < 20; j++) {
        const x = Math.random() * canvas.width
        const yPos = y + Math.random() * bandHeight
        const size = 10 + Math.random() * 30
        
        ctx.fillStyle = `hsl(${baseHue + Math.random() * 40}, ${saturation + 20}%, ${lightness + 10}%)`
        ctx.beginPath()
        ctx.ellipse(x, yPos, size, size * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Add great spot if storm intensity is high
    if (stormIntensity > 0.6) {
      const spotX = canvas.width * 0.3
      const spotY = canvas.height * 0.6
      const spotRadius = 80
      
      const gradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotRadius)
      gradient.addColorStop(0, `hsl(${baseHue + 180}, 80%, 40%)`)
      gradient.addColorStop(0.7, `hsl(${baseHue + 200}, 60%, 60%)`)
      gradient.addColorStop(1, "transparent")
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(spotX, spotY, spotRadius, spotRadius * 0.6, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [stormIntensity, bandCount, hueShift])

  // Create normal map for atmospheric depth
  const normalTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext("2d")!

    // Create subtle normal variations for atmospheric depth
    const imageData = ctx.createImageData(canvas.width, canvas.height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random() * 0.2 + 0.4
      imageData.data[i] = noise * 255     // R
      imageData.data[i + 1] = noise * 255 // G  
      imageData.data[i + 2] = 255         // B (always up)
      imageData.data[i + 3] = 255         // A
    }
    ctx.putImageData(imageData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (materialRef.current) {
      // Handle both custom shader materials and gas giant materials
      if (materialRef.current.uniforms) {
        // Custom shader material - update uniforms (with safety checks)
        const uniforms = materialRef.current.uniforms
        if (uniforms.time) uniforms.time.value = time
        if (uniforms.stormIntensity) uniforms.stormIntensity.value = stormIntensity
        if (uniforms.bandCount) uniforms.bandCount.value = bandCount
        if (uniforms.intensity) uniforms.intensity.value = shaderParams?.intensity || 1.0
        if (uniforms.speed) uniforms.speed.value = shaderParams?.speed || 1.0
        if (uniforms.distortion) uniforms.distortion.value = shaderParams?.distortion || 1.0

        // Calculate light direction from star position for custom shaders
        if (uniforms.lightDirection) {
          const sunPosition = new THREE.Vector3(...starPosition)
          const planetPosition = new THREE.Vector3()
          if (planetRef.current) {
            planetRef.current.getWorldPosition(planetPosition)
          }
          const lightDirection = new THREE.Vector3().subVectors(sunPosition, planetPosition).normalize()
          uniforms.lightDirection.value = lightDirection
        }
      } else {
        // Default gas giant material - update properties directly
        if ('time' in materialRef.current) materialRef.current.time = time
        if ('stormIntensity' in materialRef.current) materialRef.current.stormIntensity = stormIntensity
        if ('bandCount' in materialRef.current) materialRef.current.bandCount = bandCount

        // Calculate light direction from star position for default material
        if ('lightDirection' in materialRef.current) {
          const sunPosition = new THREE.Vector3(...starPosition)
          const planetPosition = new THREE.Vector3()
          if (planetRef.current) {
            planetRef.current.getWorldPosition(planetPosition)
          }
          const lightDirection = new THREE.Vector3().subVectors(sunPosition, planetPosition).normalize()
          materialRef.current.lightDirection = lightDirection.toArray()
        }
      }
    }



    if (planetRef.current) {
      // Gas giants typically have fast rotation
      planetRef.current.rotation.y += rotationRate
    }
  })



  // Register ref for external access
  React.useEffect(() => {
    if (planetRef.current) {
      registerRef(object.id, planetRef.current)
    }
  }, [object.id, registerRef])

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
      <group ref={planetRef}>
        {/* Main gas giant surface */}
        <mesh ref={surfaceRef}>
          <sphereGeometry args={[radius, 128, 128]} />
          {/* Use custom shader if available, otherwise use default gas giant material */}
          {false ? (
            <shaderMaterial
              ref={materialRef}
              vertexShader={(object as any).customShaders.vertex}
              fragmentShader={(object as any).customShaders.fragment}
              uniforms={{
                time: { value: 0 },
                intensity: { value: 1.0 },
                speed: { value: 1.0 },
                distortion: { value: 1.0 },
                // Gas giant specific uniforms
                map: { value: surfaceTexture },
                normalMap: { value: normalTexture },
                stormIntensity: { value: stormIntensity },
                bandCount: { value: bandCount },
                atmosphereThickness: { value: 0.3 },
                lightDirection: { value: new THREE.Vector3(1.0, 1.0, 0.8) },
                atmosphereColor: { value: new THREE.Vector3(1.0, 0.7, 0.4) },
                rotationSpeed: { value: 0.02 }
              }}
              transparent
            />
          ) : (
            /* @ts-ignore */
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
          )}
        </mesh>

        {/* Atmospheric layers */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[radius * 1.01, 64, 64]} />
          <meshLambertMaterial
            color={`hsl(${hueShift * 360 + 30}, 50%, 70%)`}
            transparent
            opacity={cloudOpacity * 0.15}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Upper atmosphere haze */}
        <mesh>
          <sphereGeometry args={[radius * 1.03, 32, 32]} />
          <meshLambertMaterial
            color={`hsl(${hueShift * 360 + 30}, 50%, 70%)`}
            transparent
            opacity={cloudOpacity * 0.08}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Enhanced ring system - gas giants often have prominent rings */}
        {object.rings && object.rings.length > 0 && (
          <group>
            {object.rings.map((ring, index) => (
              <PlanetRingsRenderer
                key={ring.id}
                planetRadius={radius}
                innerRadius={ring.radius_start}
                outerRadius={ring.radius_end}
                color={ring.color || "#E6D3A7"}
                transparency={1 - (ring.opacity || 60) / 100}
                divisions={8}
                noiseScale={0.8}
                noiseStrength={0.4}
                dustDensity={ring.density === 'dense' ? 0.9 : ring.density === 'moderate' ? 0.7 : 0.4}
                shadowIntensity={0.6}
                rotation={planetRef.current?.rotation}
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
;(GasGiantRenderer as any).supportsRings = true 