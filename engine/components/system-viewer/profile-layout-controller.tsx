"use client"

import React, { useMemo, useCallback, useEffect } from "react"
import * as THREE from "three"
import { useThree } from "@react-three/fiber"
import type { CelestialObject, OrbitalSystemData } from "@/engine/types/orbital-system"

interface ProfileLayoutControllerProps {
  systemData: OrbitalSystemData
  focalObjectId: string | null
  isProfileView: boolean
  onLayoutCalculated?: (layout: ProfileLayoutData) => void
}

interface ProfileLayoutData {
  focalObject: {
    id: string
    position: [number, number, number]
    scale: number
  }
  orbitingBodies: Array<{
    id: string
    position: [number, number, number]
    scale: number
    index: number
  }>
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
}

export function ProfileLayoutController({
  systemData,
  focalObjectId,
  isProfileView,
  onLayoutCalculated
}: ProfileLayoutControllerProps) {
  const { camera, controls } = useThree()
  
  // Calculate profile layout when in profile view
  const profileLayout = useMemo(() => {
    if (!isProfileView || !focalObjectId || !systemData) return null
    
    // Find focal object
    const focalObject = systemData.objects.find(obj => obj.id === focalObjectId)
    if (!focalObject) return null
    
    // Find orbiting bodies (objects that have this as parent)
    const orbitingBodies = systemData.objects.filter(obj => 
      obj.orbit && 'parent' in obj.orbit && obj.orbit.parent === focalObjectId
    )
    
    // Profile view layout constants
    const FOCAL_SCALE = 2.0
    const ORBITING_SCALE = 0.8
    const SPACING = 4.0
    const FOCAL_X = -10
    const ORBITING_START_X = -2
    
    // Create layout data
    const layout: ProfileLayoutData = {
      focalObject: {
        id: focalObjectId,
        position: [FOCAL_X, 0, 0],
        scale: FOCAL_SCALE
      },
      orbitingBodies: orbitingBodies.map((body, index) => ({
        id: body.id,
        position: [ORBITING_START_X + (index * SPACING), 0, 0] as [number, number, number],
        scale: ORBITING_SCALE,
        index
      })),
      cameraPosition: [0, 0, 0], // Will be calculated
      cameraTarget: [0, 0, 0]
    }
    
    // Calculate camera position for proper framing
    if (layout.orbitingBodies.length > 0) {
      const rightmostX = layout.orbitingBodies[layout.orbitingBodies.length - 1].position[0]
      const totalWidth = rightmostX - FOCAL_X + 2
      const centerX = (FOCAL_X + rightmostX) / 2
      
      // 45-degree bird's eye view
      const distance = totalWidth * 0.8
      const elevation = distance * Math.tan(45 * Math.PI / 180)
      
      layout.cameraPosition = [centerX, elevation, distance]
      layout.cameraTarget = [centerX, 0, 0]
    } else {
      // No orbiting bodies, just frame the focal object
      const distance = 10
      const elevation = distance * Math.tan(45 * Math.PI / 180)
      
      layout.cameraPosition = [FOCAL_X, elevation, distance]
      layout.cameraTarget = [FOCAL_X, 0, 0]
    }
    
    return layout
  }, [isProfileView, focalObjectId, systemData])
  
  // Apply camera positioning for profile view
  useEffect(() => {
    if (!profileLayout || !camera || !controls) return
    
    // Animate camera to profile view position
    const startPos = camera.position.clone()
    const startTarget = (controls as any).target.clone()
    
    const targetPos = new THREE.Vector3(...profileLayout.cameraPosition)
    const targetLookAt = new THREE.Vector3(...profileLayout.cameraTarget)
    
    let animationFrame: number
    const startTime = Date.now()
    const duration = 800 // ms
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease in-out
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      camera.position.lerpVectors(startPos, targetPos, eased)
      if (controls && 'target' in controls) {
        (controls as any).target.lerpVectors(startTarget, targetLookAt, eased)
        controls.update()
      }
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        // Notify that layout has been applied
        onLayoutCalculated?.(profileLayout)
      }
    }
    
    animate()
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [profileLayout, camera, controls, onLayoutCalculated])
  
  // This component doesn't render anything, it just manages the layout
  return null
}