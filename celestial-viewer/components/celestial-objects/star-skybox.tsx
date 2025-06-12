"use client"

import { useMemo } from "react"
import * as THREE from "three"

export function StarSkybox() {
  const starTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext("2d")!

    // Fill with black background
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Generate stars
    const numStars = 8000
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = Math.random() * 2 + 0.5
      const brightness = Math.random() * 0.8 + 0.2

      // Create different star colors
      let color = `rgba(255, 255, 255, ${brightness})`
      const colorRand = Math.random()
      if (colorRand < 0.1) {
        color = `rgba(255, 200, 150, ${brightness})` // Warm stars
      } else if (colorRand < 0.2) {
        color = `rgba(150, 200, 255, ${brightness})` // Cool stars
      } else if (colorRand < 0.25) {
        color = `rgba(255, 150, 150, ${brightness})` // Red stars
      }

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()

      // Add some brighter stars with a glow effect
      if (Math.random() < 0.02) {
        const glowSize = size * 3
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Add some nebula-like clouds
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = Math.random() * 200 + 50
      const opacity = Math.random() * 0.1 + 0.02

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      const colorChoice = Math.random()
      if (colorChoice < 0.33) {
        gradient.addColorStop(0, `rgba(100, 50, 200, ${opacity})`) // Purple
      } else if (colorChoice < 0.66) {
        gradient.addColorStop(0, `rgba(200, 100, 50, ${opacity})`) // Orange
      } else {
        gradient.addColorStop(0, `rgba(50, 100, 200, ${opacity})`) // Blue
      }
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    return texture
  }, [])

  return (
    <mesh scale={1000}>
      {" "}
      {/* Very large scale to encompass the entire scene */}
      <sphereGeometry args={[1, 64, 32]} />
      <meshBasicMaterial
        map={starTexture}
        side={THREE.BackSide} // Render on the inside of the sphere
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}
