"use client"

import * as THREE from "three"
import type { CelestialObject } from "@/engine/types/orbital-system"

// Base props for all geometry renderers
export interface GeometryRendererProps {
  object: CelestialObject
  scale: number
  starPosition?: [number, number, number]
  position?: [number, number, number]
  isSelected?: boolean
  planetSystemSelected?: boolean
  timeMultiplier?: number
  isPaused?: boolean
  // Shader parameters for visual effects
  shaderParams?: {
    intensity?: number
    speed?: number
    distortion?: number
    diskSpeed?: number
    lensingStrength?: number
    diskBrightness?: number
  }
  showLabel?: boolean
  onHover?: (objectId: string | null) => void
  onSelect?: (id: string, object: THREE.Object3D, name: string) => void
  onFocus?: (object: THREE.Object3D, name: string, size: number, radius?: number, mass?: number, orbitRadius?: number) => void
  registerRef: (id: string, ref: THREE.Object3D | null) => void
}

// Component type for geometry renderers
export type GeometryRendererComponent = React.ComponentType<GeometryRendererProps>

// Ring attachment interface for renderers that support rings
export interface RingCapableRenderer {
  supportsRings: true
}

// Ring attachment props
export interface RingAttachmentProps {
  rings: CelestialObject["rings"]
  planetRadius: number
  lightDirection?: THREE.Vector3
} 