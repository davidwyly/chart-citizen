"use client"

import type React from "react"
import { useRef, useMemo, useEffect, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { ViewType } from "@/lib/types/effects-level"

export interface OrbitalPathProps {
  semiMajorAxis: number
  eccentricity: number
  inclination: number
  orbitalPeriod: number
  showOrbit?: boolean
  timeMultiplier?: number
  isPaused?: boolean
  parentObjectId?: string
  objectRefsMap?: React.MutableRefObject<Map<string, THREE.Object3D>>
  viewType?: ViewType
  children?: React.ReactNode
}

// Calculate orbital position based on angle and parameters
const calculateOrbitalPosition = (
  angle: number,
  semiMajorAxis: number,
  eccentricity: number,
  inclination: number,
  viewType: ViewType
): THREE.Vector3 => {
  let x, y, z

  // Elliptical orbit for realistic mode
  // Calculate semi-minor axis from semi-major axis and eccentricity
  const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity)

  // Calculate position in orbital plane
  const r = (semiMajorAxis * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(angle))
  x = r * Math.cos(angle)
  const yFlat = r * Math.sin(angle)

  // Apply inclination rotation
  z = yFlat * Math.cos((inclination * Math.PI) / 180)
  y = yFlat * Math.sin((inclination * Math.PI) / 180)

  return new THREE.Vector3(x, y, z)
}

export function OrbitalPath({
  semiMajorAxis,
  eccentricity,
  inclination,
  orbitalPeriod,
  showOrbit = true,
  timeMultiplier = 1,
  isPaused = false,
  parentObjectId,
  objectRefsMap,
  viewType = "realistic",
  children,
}: OrbitalPathProps) {
  const groupRef = useRef<THREE.Group>(null)
  const lineRef = useRef<THREE.Line>(null)
  const timeRef = useRef<number>(0)
  const startAngleRef = useRef<number>(Math.random() * Math.PI * 2) // Random starting position

  // Calculate orbit points for visualization
  const orbitPoints = useMemo(() => {
    const points = []
    const segments = 128

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(calculateOrbitalPosition(angle, semiMajorAxis, eccentricity, inclination, viewType))
    }

    return points
  }, [semiMajorAxis, eccentricity, inclination, viewType])

  // Create orbit geometry
  const orbitGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        orbitPoints.flatMap((p) => [p.x, p.y, p.z]),
        3,
      ),
    )
    return geometry
  }, [orbitPoints])

  // Calculate orbit color and opacity
  const { orbitColor, orbitOpacity } = useMemo(() => ({
    orbitColor: viewType === "navigational" ? "#00aaff" : viewType === "profile" ? "#ff6600" : "#ffffff",
    orbitOpacity: viewType === "navigational" ? 0.5 : viewType === "profile" ? 0.6 : 0.3
  }), [viewType])

  // Create orbit line object
  const orbitLine = useMemo(() => {
    return new THREE.Line(
      orbitGeometry,
      new THREE.LineBasicMaterial({
        color: orbitColor,
        opacity: orbitOpacity,
        transparent: true
      })
    )
  }, [orbitGeometry, orbitColor, orbitOpacity])

  // Update position based on time
  useFrame((_, delta) => {
    if (!groupRef.current || isPaused) return;

    // If we have a parent object, follow its position
    if (parentObjectId && objectRefsMap?.current) {
      const parent = objectRefsMap.current.get(parentObjectId)
      if (parent) {
        // Get the parent's world position
        const parentWorldPos = new THREE.Vector3()
        parent.getWorldPosition(parentWorldPos)
        
        // Only update if position has changed significantly to avoid jitter
        if (groupRef.current.position.distanceTo(parentWorldPos) > 0.001) {
          groupRef.current.position.copy(parentWorldPos)
        }
      }
    }

    // Update time - use a consistent time step to avoid jitter
    const timeStep = delta * (timeMultiplier || 1) * (1 / Math.max(0.1, orbitalPeriod)) * 0.1
    timeRef.current += timeStep

    // Calculate position on orbit
    const angle = timeRef.current + startAngleRef.current
    const position = calculateOrbitalPosition(angle, semiMajorAxis, eccentricity, inclination, viewType)

    // Apply position to the orbiting object (children)
    const orbitingObject = groupRef.current.children.find((child) => child.type === "Group")
    if (orbitingObject) {
      orbitingObject.position.copy(position)
    }
  })

  // Set initial position relative to parent when parent becomes available
  useEffect(() => {
    if (!groupRef.current || !parentObjectId || !objectRefsMap?.current) return;

    const parent = objectRefsMap.current.get(parentObjectId)
    if (parent) {
      const parentWorldPos = new THREE.Vector3()
      parent.getWorldPosition(parentWorldPos)
      groupRef.current.position.copy(parentWorldPos)
    }
  }, [parentObjectId, objectRefsMap])

  // Set initial position
  useEffect(() => {
    if (!groupRef.current) return;

    const position = calculateOrbitalPosition(
      startAngleRef.current,
      semiMajorAxis,
      eccentricity,
      inclination,
      viewType
    )

    // Apply initial position to the orbiting object
    const orbitingObject = groupRef.current.children.find((child) => child.type === "Group")
    if (orbitingObject) {
      orbitingObject.position.copy(position)
    }
  }, [semiMajorAxis, eccentricity, inclination, viewType])

  return (
    <group ref={groupRef}>
      {/* Orbit visualization */}
      {showOrbit && <primitive object={orbitLine} />}

      {/* Object group that moves along the orbit */}
      <group>{children}</group>
    </group>
  )
}
