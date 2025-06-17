"use client"

import React, { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import { TerrestrialPlanetMaterial } from "../planets/materials/terrestrial-planet-material"
import { PlanetRingsRenderer } from "../planets/planet-rings-renderer"
import { InteractiveObject } from "../../components/3d-ui/interactive-object"
import type { GeometryRendererProps, RingCapableRenderer } from "./types"

// Register the custom shader materials
extend({ TerrestrialPlanetMaterial })

/**
 * Terrestrial renderer for Earth-like planets with atmospheres
 * Supports: procedural terrain, oceans, clouds, night lights, rings
 */
export function TerrestrialRenderer({
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
  const materialRef = useRef<any>(null)
  const { scene } = useThree()

  const { properties } = object
  const radius = scale

  // Calculate rotation rate from orbital properties
  const rotationRate = 0.0002 / (properties.rotation_period || 24.0)

  // Extract all terrestrial properties with defaults
  const soilTint = (properties.soil_tint || 45) / 100
  const seed = (properties.seed || 0) / 1000         // Normalize 0-1000 to 0-1 range
  const waterCoverage = (properties.water || 50) / 100        // 0-1 range  
  const temperatureClass = (properties.temperature_class || 50) / 100  // 0-1 range
  const tectonics = (properties.tectonics || 50) / 100        // 0-1 range
  const geomagnetism = (properties.geomagnetism || 30) / 100  // 0-1 range
  const population = (properties.population || 0) / 100       // 0-1 range
  const flora = (properties.flora || 30) / 100               // 0-1 range

  // Determine planet features from properties
  const hasOceans = waterCoverage > 0.1 ? 1.0 : 0.0
  const hasAtmosphere = (properties.atmosphere || 0) > 10 ? 1.0 : 0.0
  const hasClouds = hasAtmosphere > 0 ? 1.0 : 0.0
  const hasNightLights = population > 0.1 ? 1.0 : 0.0

  // Use refs to store colors and parameters that need to be updated in real-time
  const landColorRef = useRef(new THREE.Color(0.4, 0.3, 0.2))
  const oceanColorRef = useRef(new THREE.Color(0.1, 0.6, 0.9))
  const sandColorRef = useRef(new THREE.Color(0.8, 0.7, 0.4))
  const floraColorRef = useRef(new THREE.Color(0.2, 0.5, 0.1))
  const atmosphereColorRef = useRef(new THREE.Color(0.5, 0.7, 0.9))
  const nightLightColorRef = useRef(new THREE.Color(1, 1, 0.6))
  const noiseScaleRef = useRef(2.0)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    // Recalculate colors based on current properties for real-time updates
    const calculateSoilColor = () => {
      // Base soil color affected by temperature and soil tint
      const hotness = temperatureClass
      const coolness = 1 - temperatureClass
      const tint = soilTint
      
      // Cold: more blue/grey, Hot: more red/brown, Tint: varies hue
      const r = 0.4 + hotness * 0.3 + tint * 0.2
      const g = 0.3 + coolness * 0.2 + tint * 0.3
      const b = 0.2 + coolness * 0.4 + (1 - tint) * 0.1
      
      return new THREE.Color(r, g, b)
    }

    const calculateOceanColor = () => {
      // Ocean color affected by temperature
      const hotness = temperatureClass
      if (hotness < 0.33) {
        // Cold = more ice-like
        return new THREE.Color(0.7, 0.8, 0.9) // Ice blue
      } else if (hotness > 0.66) {
        // Hot = more tropical
        return new THREE.Color(0.0, 0.5, 0.8) // Deep blue
      } else {
        // Temperate
        return new THREE.Color(0.1, 0.6, 0.9) // Normal blue
      }
    }

    const calculateFloraColor = () => {
      // Flora color affected by population and temperature
      const floraIntensity = flora * (1 - population * 0.5) // Less flora with more population
      const hotness = temperatureClass
      
      if (hotness < 0.33) {
        // Cold = more evergreen
        return new THREE.Color(0.1 + floraIntensity * 0.2, 0.3 + floraIntensity * 0.4, 0.1)
      } else if (hotness > 0.66) {
        // Hot = more desert-like
        return new THREE.Color(0.3 + floraIntensity * 0.3, 0.4 + floraIntensity * 0.3, 0.1)
      } else {
        // Temperate = lush green
        return new THREE.Color(0.2 + floraIntensity * 0.3, 0.5 + floraIntensity * 0.3, 0.1 + floraIntensity * 0.1)
      }
    }

    // Calculate colors and parameters for this frame
    const landColor = calculateSoilColor()
    const oceanColor = calculateOceanColor()
    const sandColor = new THREE.Color(0.8 + soilTint * 0.2, 0.7 + soilTint * 0.2, 0.4 + soilTint * 0.1)
    const floraColor = calculateFloraColor()
    const atmosphereColor = new THREE.Color(0.5, 0.7, 0.9)
    const nightLightColor = new THREE.Color(1, 1, 0.6)
    const noiseScale = tectonics * 2.0 // More dramatic scaling

    // Update refs for use in JSX
    landColorRef.current.copy(landColor)
    oceanColorRef.current.copy(oceanColor)
    sandColorRef.current.copy(sandColor)
    floraColorRef.current.copy(floraColor)
    atmosphereColorRef.current.copy(atmosphereColor)
    nightLightColorRef.current.copy(nightLightColor)
    noiseScaleRef.current = noiseScale

    if (materialRef.current) {
      // Update time for animations
      if (materialRef.current.uniforms) {
        // Custom shader material - update uniforms (with safety checks)
        const uniforms = materialRef.current.uniforms
        if (uniforms.time) uniforms.time.value = time
        if (uniforms.waterCoverage) uniforms.waterCoverage.value = waterCoverage
        if (uniforms.temperatureClass) uniforms.temperatureClass.value = temperatureClass
        if (uniforms.tectonics) uniforms.tectonics.value = tectonics
        if (uniforms.geomagnetism) uniforms.geomagnetism.value = geomagnetism
        if (uniforms.population) uniforms.population.value = population
        if (uniforms.flora) uniforms.flora.value = flora
        if (uniforms.soilTint) uniforms.soilTint.value = soilTint
        if (uniforms.seed) uniforms.seed.value = seed
        if (uniforms.landColor) uniforms.landColor.value = landColorRef.current
        if (uniforms.seaColor) uniforms.seaColor.value = oceanColorRef.current
        if (uniforms.floraColor) uniforms.floraColor.value = floraColorRef.current
        if (uniforms.atmosphereColor) uniforms.atmosphereColor.value = atmosphereColorRef.current
        if (uniforms.nightLightColor) uniforms.nightLightColor.value = nightLightColorRef.current
        if (uniforms.sandColor) uniforms.sandColor.value = sandColorRef.current
        if (uniforms.nightLightIntensity) uniforms.nightLightIntensity.value = hasNightLights
        if (uniforms.terrainScale) uniforms.terrainScale.value = noiseScaleRef.current
        if (uniforms.rotationSpeed) uniforms.rotationSpeed.value = 0.2
        if (uniforms.cloudScale) uniforms.cloudScale.value = 1.5
        if (uniforms.cloudOpacity) uniforms.cloudOpacity.value = hasClouds * 0.6
        
        // Debug: Check for NaN/Infinity values that could cause black squares
        if (isNaN(time) || !isFinite(time)) {
          console.warn('Invalid time value detected:', time)
        }
        if (isNaN(seed) || !isFinite(seed)) {
          console.warn('Invalid seed value detected:', seed)
        }
      } else {
        // Default terrestrial material - update properties directly (with safety checks)
        if ('time' in materialRef.current) materialRef.current.time = time
        if ('waterCoverage' in materialRef.current) materialRef.current.waterCoverage = waterCoverage
        if ('temperatureClass' in materialRef.current) materialRef.current.temperatureClass = temperatureClass
        if ('tectonics' in materialRef.current) materialRef.current.tectonics = tectonics
        if ('geomagnetism' in materialRef.current) materialRef.current.geomagnetism = geomagnetism
        if ('population' in materialRef.current) materialRef.current.population = population
        if ('flora' in materialRef.current) materialRef.current.flora = flora
        if ('soilTint' in materialRef.current) materialRef.current.soilTint = soilTint
        if ('landColor' in materialRef.current) materialRef.current.landColor = landColorRef.current
        if ('seaColor' in materialRef.current) materialRef.current.seaColor = oceanColorRef.current
        if ('floraColor' in materialRef.current) materialRef.current.floraColor = floraColorRef.current
        if ('nightLightIntensity' in materialRef.current) materialRef.current.nightLightIntensity = hasNightLights
        if ('terrainScale' in materialRef.current) materialRef.current.terrainScale = noiseScaleRef.current

        // Calculate light direction from star position for default material
        if ('lightDirection' in materialRef.current) {
          const sunPosition = new THREE.Vector3(...starPosition)
          const planetPosition = new THREE.Vector3()
          if (planetRef.current) {
            planetRef.current.getWorldPosition(planetPosition)
          }

          const lightDirection = new THREE.Vector3().subVectors(sunPosition, planetPosition).normalize()
          materialRef.current.lightDirection = lightDirection
        }
      }
    }

    if (planetRef.current) {
      // Handle rotation (including retrograde if specified)
      const direction = properties.axial_tilt && properties.axial_tilt > 90 ? -1 : 1
      planetRef.current.rotation.y += rotationRate * direction
    }
  })

  // Register ref for external access
  React.useEffect(() => {
    if (planetRef.current) {
      registerRef(object.id, planetRef.current)
    }
  }, [object.id, registerRef])

  // Debug: Check for WebGL errors that might cause rendering artifacts
  React.useEffect(() => {
    const checkWebGLErrors = () => {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
        if (gl) {
          const error = gl.getError()
          if (error !== gl.NO_ERROR) {
            console.warn('WebGL error detected:', error, 'for object:', object.id)
          }
        }
      }
    }
    
    // Check for errors periodically
    const interval = setInterval(checkWebGLErrors, 5000)
    return () => clearInterval(interval)
  }, [object.id])

  // Debug: Log when custom shaders are being used
  React.useEffect(() => {
    if ((object as any).customShaders) {
      console.log('Using custom shaders for object:', object.id)
      console.log('Vertex shader length:', (object as any).customShaders.vertex.length)
      console.log('Fragment shader length:', (object as any).customShaders.fragment.length)
    } else {
      console.log('Using default terrestrial material for object:', object.id)
    }
  }, [object.id, (object as any).customShaders])

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
        {/* Main planet surface */}
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          {/* Use custom shader if available, otherwise use default terrestrial material */}
          {(object as any).customShaders ? (
            <shaderMaterial
              ref={materialRef}
              vertexShader={(object as any).customShaders.vertex}
              fragmentShader={(object as any).customShaders.fragment}
              uniforms={{
                time: { value: 0 },
                landColor: { value: landColorRef.current },
                seaColor: { value: oceanColorRef.current },
                floraColor: { value: floraColorRef.current },
                atmosphereColor: { value: atmosphereColorRef.current },
                nightLightColor: { value: nightLightColorRef.current },
                sandColor: { value: sandColorRef.current },
                // Parameter uniforms
                waterCoverage: { value: waterCoverage },
                temperatureClass: { value: temperatureClass },
                tectonics: { value: tectonics },
                geomagnetism: { value: geomagnetism },
                population: { value: population },
                flora: { value: flora },
                soilTint: { value: soilTint },
                seed: { value: seed },
                rotationSpeed: { value: 0.2 },
                terrainScale: { value: noiseScaleRef.current },
                cloudScale: { value: 1.5 },
                nightLightIntensity: { value: hasNightLights },
                cloudOpacity: { value: hasClouds * 0.6 }
              }}
              transparent
            />
          ) : (
            /* @ts-ignore */
            <terrestrialPlanetMaterial
              ref={materialRef}
              landColor={landColorRef.current}
              seaColor={oceanColorRef.current}
              sandColor={sandColorRef.current}
              floraColor={floraColorRef.current}
              atmosphereColor={atmosphereColorRef.current}
              nightLightColor={nightLightColorRef.current}
              rotationSpeed={0.2}
              terrainScale={noiseScaleRef.current}
              cloudScale={1.5}
              // Use our calculated parameters
              waterCoverage={waterCoverage}
              temperatureClass={temperatureClass}
              tectonics={tectonics}
              geomagnetism={geomagnetism}
              population={population}
              flora={flora}
              soilTint={soilTint}
              nightLightIntensity={hasNightLights}
              cloudOpacity={hasClouds * 0.6}
            />
          )}
        </mesh>

        {/* Ring system if present */}
        {object.rings && object.rings.length > 0 && (
          <group>
            {object.rings.map((ring, index) => (
              <PlanetRingsRenderer
                key={ring.id}
                planetRadius={radius}
                innerRadius={ring.radius_start}
                outerRadius={ring.radius_end}
                color={ring.color || "#c0c0c0"}
                transparency={1 - (ring.opacity || 70) / 100}
                divisions={6}
                noiseScale={0.5}
                noiseStrength={0.3}
                dustDensity={ring.density === 'dense' ? 0.9 : ring.density === 'moderate' ? 0.6 : 0.3}
                shadowIntensity={0.5}
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
;(TerrestrialRenderer as any).supportsRings = true 