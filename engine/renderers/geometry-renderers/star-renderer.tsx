"use client"

import React, { useRef, useMemo } from "react"
import { extend, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { InteractiveObject } from "../../components/3d-ui/interactive-object"
import { SunMaterial } from "./materials/sun-material"
import type { GeometryRendererProps } from "./types"

extend({ SunMaterial })

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
  timeMultiplier,
  isPaused,
  showLabel = true,
  onHover,
  onSelect,
  onFocus,
  registerRef,
}: GeometryRendererProps) {
  const starRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const coronaRef = useRef<THREE.Mesh>(null)
  const sunMatRef = useRef<THREE.ShaderMaterial>(null!)

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

  // No longer need canvas texture - using SunMaterial shader instead

  // Variable brightness for variable stars
  const [currentLuminosity, setCurrentLuminosity] = React.useState(luminosity)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    // Handle variable star brightness
    if (variability > 0.1) {
      const variation = Math.sin(time * variability * 2) * variability * 0.3
      setCurrentLuminosity(luminosity + variation)
    }

    // Update SunMaterial shader uniforms
    if (sunMatRef.current) {
      sunMatRef.current.uniforms.time.value = time
      sunMatRef.current.uniforms.coreColor.value = starColor
      sunMatRef.current.uniforms.variableStar.value = variability > 0.3
      sunMatRef.current.uniforms.variablePeriod.value = 4.0 / (variability + 0.1)
      sunMatRef.current.uniforms.variableAmplitude.value = variability * 0.4
      sunMatRef.current.uniforms.flowSpeed.value = solarActivity + 0.5
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


  // Register ref for external access
  React.useEffect(() => {
    if (starRef.current) {
      registerRef(object.id, starRef.current)
    }
  }, [object.id, registerRef])

  return (
    <InteractiveObject
      objectId={object.id}
      objectName={object.name}
      objectType="star"
      radius={radius}
      position={position}
      visualSize={scale}
      isSelected={isSelected}
      timeMultiplier={timeMultiplier}
      isPaused={isPaused}
      onHover={(id, hovered) => onHover?.(hovered ? id : null)}
      onSelect={onSelect}
      onFocus={(obj, name, visualSize) => onFocus?.(obj, name, visualSize || scale, properties.radius, properties.mass, 0)}
      registerRef={registerRef}
      showLabel={showLabel}
    >
      <group ref={starRef}>
        {/* Star core with advanced SunMaterial shader */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[radius, 64, 64]} />
          <sunMaterial
            ref={sunMatRef}
            time={0}
            coreColor={starColor}
            variableStar={variability > 0.3}
            variablePeriod={4.0 / (variability + 0.1)}
            variableAmplitude={variability * 0.4}
            flowSpeed={solarActivity + 0.5}
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
    </InteractiveObject>
  )
}

// Stars don't support rings
;(StarRenderer as any).supportsRings = false 