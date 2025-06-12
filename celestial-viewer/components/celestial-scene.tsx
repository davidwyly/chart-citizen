"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stats } from "@react-three/drei"
import { Suspense, useState } from "react"
import { TerrestrialPlanet } from "./celestial-objects/terrestrial-planet"
import { GasGiant } from "./celestial-objects/gas-giant"
import { BlackHole } from "./celestial-objects/black-hole"
import { Protostar } from "./celestial-objects/protostar" // Import Protostar
import { StarSkybox } from "./celestial-objects/star-skybox"
import type { CelestialObject, CelestialObjectType } from "@/lib/types"

interface CelestialSceneProps {
  selectedObject: CelestialObject | null
}

export function CelestialScene({ selectedObject }: CelestialSceneProps) {
  const [showStats, setShowStats] = useState(false)

  const getProp = (id: string, defaultValue: any) => {
    if (!selectedObject?.properties) return defaultValue
    const prop = selectedObject.properties.find((p) => p?.id === id)
    return prop?.value !== undefined ? prop.value : defaultValue
  }

  if (!selectedObject) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <p className="text-gray-400">Select a celestial object to view</p>
      </div>
    )
  }

  const objectScale = getProp("objectScale", 1) as number

  const renderObject = (type: CelestialObjectType) => {
    try {
      switch (type) {
        case "terrestrial":
          return (
            <TerrestrialPlanet
              scale={objectScale}
              landWaterRatio={getProp("landWaterRatio", 0.7) as number}
              temperature={getProp("temperature", 50) as number}
              atmosphereDensity={getProp("atmosphereDensity", 0.5) as number}
              atmosphereComposition={getProp("atmosphereComposition", "nitrogen-oxygen") as string}
              volcanismLevel={getProp("volcanismLevel", 0.1) as number}
              civilizationPresence={getProp("civilizationPresence", 0.3) as number}
            />
          )
        case "gasGiant":
          return (
            <GasGiant
              scale={objectScale}
              ringDensity={getProp("ringDensity", 0.5) as number}
              ringInnerRadius={getProp("ringInnerRadius", 1.8) as number}
              ringOuterRadius={getProp("ringOuterRadius", 4) as number}
              gasComposition={getProp("gasComposition", "ammonia") as string}
              temperatureClass={getProp("temperatureClass", "temperate") as string}
            />
          )
        case "star":
          return (
            <mesh scale={objectScale}>
              <sphereGeometry args={[1, 64, 64]} />
              <meshBasicMaterial color={0xffd700} emissive={0xffd700} emissiveIntensity={1} />
            </mesh>
          )
        case "special":
          if (selectedObject.subtype === "blackHole") {
            return <BlackHole scale={objectScale} />
          } else if (selectedObject.subtype === "protostar") {
            return (
              <Protostar
                scale={objectScale}
                density={getProp("density", 0.185) as number}
                starBrightness={getProp("starBrightness", 30) as number}
                starHue={getProp("starHue", 0.08) as number}
                nebulaHue={getProp("nebulaHue", 0.6) as number}
                rotationSpeed={getProp("rotationSpeed", 0.1) as number}
              />
            )
          }
          return (
            <mesh scale={objectScale}>
              <sphereGeometry args={[1, 64, 64]} />
              <meshBasicMaterial color={0x000000} /> {/* Default for unknown special */}
            </mesh>
          )
        default:
          return null
      }
    } catch (error) {
      console.error("Error rendering celestial object:", error)
      return (
        <mesh scale={1}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color={0xff0000} /> {/* Error fallback */}
        </mesh>
      )
    }
  }

  return (
    <div className="relative w-full h-full bg-black">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        {" "}
        {/* Adjusted camera for potentially larger protostar */}
        <StarSkybox />
        <ambientLight intensity={0.1} /> {/* Lower ambient for nebula to pop */}
        {/* No strong directional light, let the protostar be the main source for itself */}
        <Suspense fallback={null}>{renderObject(selectedObject.type)}</Suspense>
        <OrbitControls />
        {showStats && <Stats />}
      </Canvas>
      <button
        className="absolute bottom-4 left-4 px-3 py-1 bg-gray-800 text-gray-200 text-xs rounded-md z-10 hover:bg-gray-700"
        onClick={() => setShowStats(!showStats)}
      >
        {showStats ? "Hide Stats" : "Show Stats"}
      </button>
    </div>
  )
}
