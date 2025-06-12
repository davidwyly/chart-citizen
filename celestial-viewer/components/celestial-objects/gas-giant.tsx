"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, Ring } from "@react-three/drei"
import * as THREE from "three"

interface GasGiantProps {
  scale: number
  ringDensity: number // 0 (none) to 1 (dense)
  ringInnerRadius: number // Multiplier for base radius
  ringOuterRadius: number // Multiplier for base radius
  gasComposition: string // "ammonia", "water", "cloudless", "alkali-metal", "silicate"
  temperatureClass: string // "cold", "temperate", "hot"
}

// Helper to create a procedural texture for gas giants
const createGasGiantTexture = (size: number, gasComposition: string, temperatureClass: string) => {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!

  let baseColor1 = new THREE.Color(0xd2b48c) // Tan
  let baseColor2 = new THREE.Color(0xb8860b) // DarkGoldenrod

  // Gas composition affects color
  switch (gasComposition) {
    case "ammonia": // Jupiter-like
      baseColor1 = new THREE.Color(0xd2b48c) // Tan
      baseColor2 = new THREE.Color(0xb8860b) // DarkGoldenrod
      break
    case "water": // Neptune/Uranus-like
      baseColor1 = new THREE.Color(0x87ceeb) // SkyBlue
      baseColor2 = new THREE.Color(0x4682b4) // SteelBlue
      break
    case "cloudless": // Deeper blue/purple
      baseColor1 = new THREE.Color(0x4682b4) // SteelBlue
      baseColor2 = new THREE.Color(0x483d8b) // DarkSlateBlue
      break
    case "alkali-metal": // Hot Jupiter - reddish/orange
      baseColor1 = new THREE.Color(0xffa07a) // LightSalmon
      baseColor2 = new THREE.Color(0xff4500) // OrangeRed
      break
    case "silicate": // Even hotter - brownish/grey
      baseColor1 = new THREE.Color(0xcd853f) // Peru
      baseColor2 = new THREE.Color(0xa0522d) // Sienna
      break
  }

  // Temperature class affects cloud visibility/structure (simulated by slight color variation or texture)
  if (temperatureClass === "hot") {
    baseColor1.lerp(new THREE.Color(0x333333), 0.3) // Darker for hot jupiters
    baseColor2.lerp(new THREE.Color(0x111111), 0.3)
  } else if (temperatureClass === "cold") {
    baseColor1.lerp(new THREE.Color(0xffffff), 0.2) // Lighter for cold giants
    baseColor2.lerp(new THREE.Color(0xdddddd), 0.2)
  }

  // Create bands
  const numBands = 10 + Math.floor(Math.random() * 5)
  const bandHeight = size / numBands
  for (let i = 0; i < numBands; i++) {
    ctx.fillStyle = i % 2 === 0 ? baseColor1.getStyle() : baseColor2.getStyle()
    ctx.fillRect(0, i * bandHeight, size, bandHeight)

    // Add some turbulence/swirls
    for (let j = 0; j < 5; j++) {
      const swirlX = Math.random() * size
      const swirlY = i * bandHeight + Math.random() * bandHeight
      const swirlR = (Math.random() * bandHeight) / 3 + 5
      const swirlColor = new THREE.Color()
        .lerpColors(baseColor1, baseColor2, Math.random())
        .lerp(new THREE.Color(0xffffff), Math.random() * 0.2)
        .getStyle()
      ctx.fillStyle = swirlColor
      ctx.beginPath()
      ctx.arc(swirlX, swirlY, swirlR, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return new THREE.CanvasTexture(canvas)
}

const createRingTexture = (size: number, density: number) => {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size / 8 // Rings are wide, not tall
  const ctx = canvas.getContext("2d")!

  const baseRingColor = new THREE.Color(0x999999) // Light grey
  const darkRingColor = new THREE.Color(0x666666)

  for (let i = 0; i < size; i += 2) {
    const alpha = (Math.random() * 0.5 + 0.2) * density // Density affects alpha
    const color = Math.random() > 0.3 ? baseRingColor : darkRingColor
    ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${alpha})`
    ctx.fillRect(i, 0, 1 + Math.random(), canvas.height)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 1) // Repeat texture for finer detail
  return texture
}

export function GasGiant({
  scale,
  ringDensity,
  ringInnerRadius,
  ringOuterRadius,
  gasComposition,
  temperatureClass,
}: GasGiantProps) {
  const planetRef = useRef<THREE.Mesh>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)

  const planetTexture = useMemo(
    () => createGasGiantTexture(512, gasComposition, temperatureClass),
    [gasComposition, temperatureClass],
  )

  const ringTexture = useMemo(() => (ringDensity > 0.01 ? createRingTexture(256, ringDensity) : null), [ringDensity])

  useFrame((state, delta) => {
    planetRef.current.rotation.y += delta * 0.05
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.02 // Rings typically rotate around planet's axis
    }
  })

  const baseRadius = 1

  return (
    <>
      <Sphere ref={planetRef} args={[baseRadius, 64, 64]} scale={scale}>
        <meshStandardMaterial map={planetTexture} roughness={0.9} metalness={0.05} />
      </Sphere>
      {ringDensity > 0.01 && ringTexture && (
        <Ring
          ref={ringRef}
          args={[baseRadius * ringInnerRadius, baseRadius * ringOuterRadius, 128]} // Increased segments for smoother rings
          rotation={[Math.PI / 2.2, 0, 0]} // Slight tilt for better visibility
          scale={scale}
        >
          <meshStandardMaterial
            map={ringTexture}
            side={THREE.DoubleSide}
            transparent
            opacity={Math.min(0.8, ringDensity * 1.5)} // Cap opacity, allow denser look
            depthWrite={false} // Important for transparency
          />
        </Ring>
      )}
    </>
  )
}
