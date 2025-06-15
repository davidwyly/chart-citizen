"use client"

import React, { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { GeometryRendererProps } from "./types"

/**
 * Star renderer for stellar bodies with emissive materials and corona effects
 * Features: color temperature, luminosity, solar activity, variability, corona
 */
export function StarRenderer({
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
  const starRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const coronaRef = useRef<THREE.Mesh>(null)

  const { properties } = object
  const radius = scale

  // Star properties
  const colorTemperature = properties.color_temperature || 5778 // Sun's temperature
  const luminosity = (properties.luminosity || 50) / 100
  const solarActivity = (properties.solar_activity || 30) / 100
  const coronaThickness = (properties.corona_thickness || 20) / 100
  const variability = (properties.variability || 10) / 100

  // Convert color temperature to RGB color
  const starColor = useMemo(() => {
    // Simplified black body radiation color calculation
    const temp = Math.max(1000, Math.min(40000, colorTemperature))
    
    let r, g, b
    
    if (temp < 3500) {
      // Red dwarf
      r = 1.0
      g = 0.3 + (temp - 1000) / 2500 * 0.4
      b = 0.1
    } else if (temp < 5000) {
      // Orange/K-type
      r = 1.0
      g = 0.6 + (temp - 3500) / 1500 * 0.3
      b = 0.2 + (temp - 3500) / 1500 * 0.4
    } else if (temp < 6000) {
      // Yellow/G-type (like Sun)
      r = 1.0
      g = 0.9 + (temp - 5000) / 1000 * 0.1
      b = 0.6 + (temp - 5000) / 1000 * 0.3
    } else if (temp < 7500) {
      // White/F-type
      r = 0.9 + (temp - 6000) / 1500 * 0.1
      g = 0.9 + (temp - 6000) / 1500 * 0.1
      b = 1.0
    } else {
      // Blue/O-type
      r = 0.7 - (temp - 7500) / 32500 * 0.3
      g = 0.8 - (temp - 7500) / 32500 * 0.2
      b = 1.0
    }
    
    return new THREE.Color(r, g, b)
  }, [colorTemperature])

  // Create star surface texture with solar activity
  const starTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext("2d")!

    // Base stellar color
    ctx.fillStyle = `rgb(${starColor.r * 255}, ${starColor.g * 255}, ${starColor.b * 255})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add solar flares and activity
    if (solarActivity > 0.2) {
      const flareCount = Math.floor(solarActivity * 10)
      for (let i = 0; i < flareCount; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = 10 + Math.random() * 30
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
        gradient.addColorStop(0, `rgb(${Math.min(255, starColor.r * 255 + 100)}, ${Math.min(255, starColor.g * 255 + 50)}, ${starColor.b * 255})`)
        gradient.addColorStop(1, "transparent")
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Add granulation pattern
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const variation = (Math.random() - 0.5) * solarActivity * 30
      imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + variation))
      imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + variation * 0.5))
      imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + variation * 0.2))
    }
    ctx.putImageData(imageData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [starColor, solarActivity])

  // Variable brightness for variable stars
  const [currentLuminosity, setCurrentLuminosity] = React.useState(luminosity)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    // Handle variable star brightness
    if (variability > 0.1) {
      const variation = Math.sin(time * variability * 2) * variability * 0.3
      setCurrentLuminosity(luminosity + variation)
    }

    // Rotate star slowly
    if (starRef.current) {
      starRef.current.rotation.y += 0.001
    }

    // Animate corona
    if (coronaRef.current) {
      coronaRef.current.rotation.z += 0.002
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (starRef.current && onSelect) {
      onSelect(object.id, starRef.current, object.name)
    }
  }

  const handlePointerEnter = () => {
    onHover?.(object.id)
  }

  const handlePointerLeave = () => {
    onHover?.(null)
  }

  const handleFocus = () => {
    if (starRef.current && onFocus) {
      onFocus(starRef.current, object.name, scale, properties.radius, properties.mass, 0)
    }
  }

  // Register ref for external access
  React.useEffect(() => {
    if (starRef.current) {
      registerRef(object.id, starRef.current)
    }
  }, [object.id, registerRef])

  return (
    <group ref={starRef} position={position}>
      {/* Star core */}
      <mesh 
        ref={coreRef}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleFocus}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={starTexture}
          color={starColor}
          emissive={starColor}
          emissiveIntensity={currentLuminosity}
        />
      </mesh>

      {/* Corona effect */}
      {coronaThickness > 0 && (
        <mesh ref={coronaRef}>
          <sphereGeometry args={[radius * (1 + coronaThickness), 32, 32]} />
          <meshBasicMaterial
            color={starColor}
            transparent
            opacity={0.1 + coronaThickness * 0.2}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Stellar wind effect */}
      {solarActivity > 0.5 && (
        <mesh>
          <sphereGeometry args={[radius * 1.2, 16, 16]} />
          <meshBasicMaterial
            color={starColor}
            transparent
            opacity={0.05}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Point light source for illumination */}
      <pointLight
        color={starColor}
        intensity={currentLuminosity * 2}
        distance={1000}
        decay={2}
      />
    </group>
  )
}

// Stars don't support rings
;(StarRenderer as any).supportsRings = false 