"use client"

import { useEffect } from "react"
import { useThree } from "@react-three/fiber"

interface ZoomTrackerProps {
  onZoomChange: (zoom: number) => void
}

export function ZoomTracker({ onZoomChange }: ZoomTrackerProps) {
  const { camera } = useThree()

  useEffect(() => {
    const updateZoom = () => {
      // Calculate zoom based on camera distance from origin
      const distance = camera.position.length()
      const zoom = 50 / distance // Normalize to a reasonable scale
      onZoomChange(zoom)
    }

    updateZoom()

    // Update zoom when camera moves
    const interval = setInterval(updateZoom, 100)
    return () => clearInterval(interval)
  }, [camera, onZoomChange])

  return null
}
