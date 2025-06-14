"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import { HabitablePlanetMaterial } from "./materials/habitable-planet-material"
import { height, randomPointOnUnitSphere } from "./materials/habitable-planet-utils"
import type { CatalogObject } from "@/engine/system-loader"
import type { EffectsLevel } from '@lib/types/effects-level'

// Register the custom shader material
extend({ HabitablePlanetMaterial })

// Pre-computed water level lookup table for different terrain/volcanism combinations
const WATER_LEVEL_CACHE = new Map<string, number[]>();

// Function to get or create water level lookup table for given terrain parameters
function getWaterLevelLookup(terrainScale: number): number[] {
  const key = `${terrainScale.toFixed(2)}`;
  
  if (WATER_LEVEL_CACHE.has(key)) {
    return WATER_LEVEL_CACHE.get(key)!;
  }

  const SAMPLE_COUNT = 5;
  const heights: number[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const dir = randomPointOnUnitSphere();
    heights.push(height(dir, terrainScale, 0));  // Set volcanism to 0 as a default since it's no longer a parameter
  }

  heights.sort((a, b) => a - b);
  
  const lookupTable: number[] = [];
  lookupTable[0] = heights[0] * 0.8;

  for (let humidity = 1; humidity < 100; humidity++) {
    const targetPercentile = humidity / 100;
    lookupTable[humidity] = heights[Math.floor(targetPercentile * (SAMPLE_COUNT - 1))];
  }

  lookupTable[100] = heights[heights.length - 1] * 1.2;
  WATER_LEVEL_CACHE.set(key, lookupTable);
  return lookupTable;
}

// Fast water level lookup using pre-computed table
function calculateWaterLevel(humidity: number, terrainScale: number): number {
  const lookupTable = getWaterLevelLookup(terrainScale);
  const humidityInt = Math.round(Math.max(0, Math.min(100, humidity)));
  return lookupTable[humidityInt];
}

interface HabitablePlanetRendererProps {
  catalogData: CatalogObject
  position?: [number, number, number]
  scale?: number
  starPosition?: [number, number, number]
  habitabilityParams?: {
    humidity: number
    temperature: number
    population: number
    volcanism?: number
    rotationSpeed?: number
    showTopographicLines?: boolean
  }
  onFocus?: (object: THREE.Object3D, name: string) => void
}

export function HabitablePlanetRenderer({
  catalogData,
  position = [0, 0, 0],
  scale = 1,
  starPosition = [0, 0, 0],
  habitabilityParams,
  onFocus,
}: HabitablePlanetRendererProps) {
  const planetRef = useRef<THREE.Group>(null)
  const materialRef = useRef<any>(null)
  const { camera, mouse, size } = useThree()
  const [mousePosition, setMousePosition] = useState(new THREE.Vector2(0.5, 0.5))

  // Extract data from catalog
  const physical = catalogData.physical || {}
  const features = catalogData.features || {}
  const appearance = catalogData.appearance || {}
  const habitability = catalogData.habitability || {}

  // Calculate rendering parameters
  const radius = (physical.radius || 1.0) * scale
  const rotationRate = 0.0002 / (features.rotation_period || 24.0)

  // Extract habitability parameters (0-100 scale) - use dynamic params if available
  const humidity = habitabilityParams?.humidity ?? habitability.humidity ?? 50
  const temperature = habitabilityParams?.temperature ?? habitability.temperature ?? 50
  const population = habitabilityParams?.population ?? habitability.population ?? 30
  const volcanism = habitabilityParams?.volcanism ?? features.volcanism ?? 0
  const rotationSpeedMultiplier = habitabilityParams?.rotationSpeed ?? 0.2
  const showTopographicLines = habitabilityParams?.showTopographicLines ?? false

  // Determine quality level based on effects settings
  // TODO: Get this from user settings/context
  const qualityLevel: EffectsLevel = 'high' // For now, default to high quality

  // Calculate water level when humidity, terrain scale, or volcanism changes
  const waterLevel = useMemo(() => {
    return calculateWaterLevel(humidity, features.terrain_roughness || 1.0);
  }, [humidity, features.terrain_roughness])

  // Get colors from appearance or use defaults
  const oceanColor = new THREE.Color(appearance.ocean_color || "#1e90ff")
  const landColor = new THREE.Color(appearance.land_color || "#8fbc8f")
  const sandColor = new THREE.Color(appearance.sand_color || "#daa520")
  const snowColor = new THREE.Color(appearance.snow_color || "#ffffff")
  const cloudColor = new THREE.Color(appearance.cloud_color || "#ffffff")
  const atmosphereColor = new THREE.Color(appearance.atmosphere_color || "#87ceeb")
  const cityLightColor = new THREE.Color(appearance.city_light_color || "#ffff99")

  // Calculate noise scale based on planet type
  const terrainScale = features.terrain_roughness || 1.0
  const cloudScale = features.cloud_coverage ? features.cloud_coverage * 2.0 : 1.5

  // Quality settings based on level
  const iterations = qualityLevel === 'high' ? 8 : 4 // Default to medium quality for now
  const showClouds = true // Always show clouds for now
  const showNightLights = population > 0 // Show night lights if population exists

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (materialRef.current) {
      materialRef.current.time = time

      // For object viewer, simulate a star at a fixed position
      // Place the star at a distance that provides good lighting
      const starPos = (starPosition && (starPosition[0] !== 0 || starPosition[1] !== 0 || starPosition[2] !== 0)) ? 
        new THREE.Vector3(starPosition[0], starPosition[1], starPosition[2]) :
        new THREE.Vector3(10, 5, 10); // Default star position for object viewer

      // Get planet position in world space
      const planetPosition = new THREE.Vector3()
      if (planetRef.current) {
        planetRef.current.getWorldPosition(planetPosition)
      }

      // Calculate light direction from planet toward the star (normalized)
      // The shader expects this to be the direction FROM surface pixel TOWARD the sun
      const lightDirection = new THREE.Vector3().subVectors(starPos, planetPosition).normalize()

      // Set the light direction in the shader
      materialRef.current.lightDirection = lightDirection

      // Update planet radius for proper scaling calculations
      materialRef.current.planetRadius = radius

      // Update habitability parameters if they changed
      materialRef.current.humidity = humidity
      materialRef.current.temperature = temperature
      materialRef.current.population = population
      materialRef.current.volcanism = volcanism
      materialRef.current.rotationSpeed = rotationSpeedMultiplier
      materialRef.current.showTopographicLines = showTopographicLines
      materialRef.current.waterLevel = waterLevel
    }

    if (planetRef.current) {
      // Handle retrograde rotation for Venus-like planets
      const direction = features.retrograde_rotation ? -1 : 1
      planetRef.current.rotation.y += rotationRate * direction
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    if (planetRef.current && onFocus) {
      onFocus(planetRef.current, catalogData.name)
    }
  }

  return (
    <group ref={planetRef} position={position}>
      <mesh onClick={handleClick}>
        <sphereGeometry args={[radius, 32, 32]} />
        {/* @ts-ignore */}
        <habitablePlanetMaterial
          ref={materialRef}
          planetRadius={radius}
          landColor={landColor}
          seaColor={oceanColor}
          sandColor={sandColor}
          snowColor={snowColor}
          cloudColor={cloudColor}
          atmosphereColor={atmosphereColor}
          cityLightColor={cityLightColor}
          rotationSpeed={rotationSpeedMultiplier}
          terrainScale={terrainScale}
          cloudScale={cloudScale}
          humidity={humidity}
          temperature={temperature}
          population={population}
          qualityLevel={iterations}
          showClouds={showClouds}
          showNightLights={showNightLights}
          volcanism={volcanism}
          showTopographicLines={showTopographicLines}
          waterLevel={waterLevel}
        />
      </mesh>
    </group>
  )
} 