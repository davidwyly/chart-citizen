"use client"

import React, { useRef, useMemo, useEffect, useCallback } from "react"
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
  binaryStarIndex?: number // Index for binary star positioning (0 = primary, 1 = secondary)
}

// Calculate the true anomaly from mean anomaly using Kepler's equation
// This provides realistic orbital mechanics with variable angular velocity
const solveKeplersEquation = (meanAnomaly: number, eccentricity: number): number => {
  // Solve Kepler's equation: M = E - e*sin(E) for eccentric anomaly E
  let eccentricAnomaly = meanAnomaly // Initial guess
  const tolerance = 1e-6
  let iterations = 0
  const maxIterations = 10
  
  // Newton-Raphson method
  while (iterations < maxIterations) {
    const f = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly
    const df = 1 - eccentricity * Math.cos(eccentricAnomaly)
    const correction = f / df
    eccentricAnomaly -= correction
    
    if (Math.abs(correction) < tolerance) break
    iterations++
  }
  
  // Convert eccentric anomaly to true anomaly
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
  )
  
  return trueAnomaly
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

  if (viewType === 'profile') {
    // Profile mode: Use fixed circular orbits at the exact calculated distance
    // Ignore eccentricity and inclination for clean diagrammatic layout
    x = semiMajorAxis * Math.cos(angle)
    y = 0 // Keep all objects in the same plane for profile view
    z = semiMajorAxis * Math.sin(angle)
  } else if (viewType === 'navigational') {
    // Navigational mode: Use clean circular orbits for better navigation UX
    // Ignore eccentricity and inclination for a clean, readable layout
    x = semiMajorAxis * Math.cos(angle)
    y = 0 // Keep all objects in the same plane for easy navigation
    z = semiMajorAxis * Math.sin(angle)
  } else {
    // Elliptical orbit for explorational and scientific modes with proper Kepler mechanics
    
    // For realistic orbital mechanics, treat the input angle as mean anomaly
    // and solve Kepler's equation to get the true anomaly
    const trueAnomaly = eccentricity > 0.001 ? solveKeplersEquation(angle, eccentricity) : angle
    
    // Calculate position in orbital plane using true anomaly
    // This gives correct variable orbital velocity (faster at periapsis, slower at apoapsis)
    const r = (semiMajorAxis * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(trueAnomaly))
    x = r * Math.cos(trueAnomaly)
    const yFlat = r * Math.sin(trueAnomaly)

    // Apply inclination rotation
    z = yFlat * Math.cos((inclination * Math.PI) / 180)
    y = yFlat * Math.sin((inclination * Math.PI) / 180)
  }

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
  viewType = "explorational",
  children,
  binaryStarIndex,
}: OrbitalPathProps) {
  const groupRef = useRef<THREE.Group>(null)
  const lineRef = useRef<THREE.Line>(null)
  const timeRef = useRef<number>(0)
  
  // Calculate starting angle based on binary star positioning or view mode
  const calculateStartAngle = useCallback(() => {
    if (binaryStarIndex !== undefined) {
      // Binary star system: position stars opposite each other
      return binaryStarIndex * Math.PI // 0° for primary (index 0), 180° for secondary (index 1)
    } else if (viewType === 'profile' || viewType === 'navigational') {
      return 0 // Clean layout modes start at 0°
    } else {
      return Math.random() * Math.PI * 2 // Random start for other modes
    }
  }, [binaryStarIndex, viewType])
  
  const startAngleRef = useRef<number>(calculateStartAngle())

  // Update starting angle when view mode changes or binary star configuration changes
  useEffect(() => {
    const newStartAngle = calculateStartAngle();
    startAngleRef.current = newStartAngle;
    timeRef.current = 0; // Reset time to ensure consistent positioning
    
    // Force immediate position update
    if (groupRef.current) {
      const position = calculateOrbitalPosition(
        newStartAngle,
        semiMajorAxis,
        eccentricity,
        inclination,
        viewType
      )
      
      if (binaryStarIndex !== undefined) {
        console.log(`🌟 BINARY STAR UPDATE: Star ${binaryStarIndex} positioned at angle ${newStartAngle} (${newStartAngle * 180 / Math.PI}°):`, position)
      } else {
        console.log(`🔄 LAYOUT UPDATE (${viewType.toUpperCase()}): Object with semiMajorAxis ${semiMajorAxis} positioned at:`, position)
      }
      
      // Apply position to the orbiting object immediately
      if (groupRef.current.children && typeof groupRef.current.children.find === 'function') {
        const orbitingObject = groupRef.current.children.find((child) => child.type === "Group")
        if (orbitingObject) {
          orbitingObject.position.copy(position)
          console.log(`✅ Updated object position to`, orbitingObject.position)
        }
      }
    }
  }, [viewType, semiMajorAxis, eccentricity, inclination, binaryStarIndex, calculateStartAngle]);

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
    if (!groupRef.current) return;

    // If we have a parent object, follow its position
    if (parentObjectId && objectRefsMap?.current) {
      const parent = objectRefsMap.current.get(parentObjectId)
      if (parent) {
        // Get the parent's world position
        const parentWorldPos = new THREE.Vector3()
        parent.getWorldPosition(parentWorldPos)
        
        // Use smooth interpolation instead of threshold-based updates to prevent jitter
        groupRef.current.position.lerp(parentWorldPos, 0.1)
      }
      // If parent not found, don't update position to prevent jumps
    }

    // Skip dynamic orbital motion if paused or when in static profile view mode
    if (isPaused || viewType === 'profile') return;

    // Update time – use a consistent time step to avoid jitter
    // Scale time based on orbital period (in days) to radians per frame
    // 1 day = 1 unit of time at 1x speed
    // Additional 0.1x multiplier to make everything 10x slower
    const timeStep = delta * (timeMultiplier || 1) * (2 * Math.PI / Math.max(1, orbitalPeriod)) * 0.1
    timeRef.current += timeStep

    // Calculate position on orbit
    const angle = timeRef.current + startAngleRef.current
    const position = calculateOrbitalPosition(angle, semiMajorAxis, eccentricity, inclination, viewType)

    // Apply position to the orbiting object (children)
    // Safety check for test environments
    if (groupRef.current.children && typeof groupRef.current.children.find === 'function') {
      const orbitingObject = groupRef.current.children.find((child) => child.type === "Group")
      if (orbitingObject) {
        orbitingObject.position.copy(position)
      }
    }
  })

  // Set initial position relative to parent when parent becomes available
  useEffect(() => {
    if (!groupRef.current || !parentObjectId || !objectRefsMap?.current) return;

    const parent = objectRefsMap.current.get(parentObjectId)
    if (parent && groupRef.current.position) {
      const parentWorldPos = new THREE.Vector3()
      parent.getWorldPosition(parentWorldPos)
      groupRef.current.position.copy(parentWorldPos)
    }
  }, [parentObjectId, objectRefsMap])

  // Update orbital position immediately when view mode or orbital parameters change
  // This ensures correct positioning even when paused
  useEffect(() => {
    if (!groupRef.current) return;

    const position = calculateOrbitalPosition(
      timeRef.current + startAngleRef.current,
      semiMajorAxis,
      eccentricity,
      inclination,
      viewType
    )

    // Apply position to the orbiting object immediately
    // Safety check for test environments
    if (groupRef.current.children && typeof groupRef.current.children.find === 'function') {
      const orbitingObject = groupRef.current.children.find((child) => child.type === "Group")
      if (orbitingObject) {
        orbitingObject.position.copy(position)
      }
    }
  }, [semiMajorAxis, eccentricity, inclination, viewType])

  // Set initial position only once when component mounts
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
    // Safety check for test environments
    if (groupRef.current.children && typeof groupRef.current.children.find === 'function') {
      const orbitingObject = groupRef.current.children.find((child) => child.type === "Group")
      if (orbitingObject) {
        orbitingObject.position.copy(position)
      }
    }
  }, []) // Empty dependency array - only run on mount

  return (
    <group ref={groupRef}>
      {/* Orbit visualization */}
      {showOrbit && <primitive object={orbitLine} />}

      {/* Object group that moves along the orbit */}
      <group>{children}</group>
    </group>
  )
} 