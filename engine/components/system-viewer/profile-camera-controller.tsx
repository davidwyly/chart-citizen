"use client"

import { useEffect, useRef } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { ViewType } from "@lib/types/effects-level"
import type { SystemData } from "@/engine/system-loader"

interface ProfileCameraControllerProps {
  viewType: ViewType
  focusObject: THREE.Object3D | null
  focusName: string | null
  systemData?: SystemData | null
  selectedObjectId?: string | null
}

export function ProfileCameraController({
  viewType,
  systemData,
  selectedObjectId,
}: ProfileCameraControllerProps) {
  const { camera, set, size, controls } = useThree()
  const controlsRef = useRef<any>(null)
  const originalCameraRef = useRef<THREE.Camera | null>(null)
  const isProfileModeRef = useRef(false)

  // Keep controls ref in sync
  useEffect(() => {
    if (controls) controlsRef.current = controls
  }, [controls])

  // Enter profile mode
  useEffect(() => {
    if (
      viewType === 'profile' &&
      systemData &&
      !isProfileModeRef.current &&
      controlsRef.current
    ) {
      isProfileModeRef.current = true
      originalCameraRef.current = camera.clone()

      // Rough width estimate for ortho frustum
      const childObjects =
        selectedObjectId && selectedObjectId !== systemData.stars?.[0]?.id
          ? systemData.moons?.filter((m) => m.orbit?.parent === selectedObjectId) || []
          : systemData.planets || []

      const systemWidth = childObjects.length > 0 ? 800 : 400
      const aspect = size.width / size.height
      const frustumSize = systemWidth * 0.6

      const orthoCam = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        5000
      )
      // Top-down view: place the camera above the system along +Z looking down
      orthoCam.position.set(0, 0, 1000)
      orthoCam.up.set(0, 1, 0)
      orthoCam.lookAt(new THREE.Vector3(0, 0, 0))
      orthoCam.updateProjectionMatrix()

      // Apply slight zoom-in for better visibility
      orthoCam.zoom = 1.5
      orthoCam.updateProjectionMatrix()

      set(() => ({ camera: orthoCam } as any))

      // Re-wire OrbitControls
      const c = controlsRef.current
      c.object = orthoCam
      if ('camera' in c) c.camera = orthoCam
      c.target.set(0, 0, 0)
      c.enableRotate = false
      c.enableZoom = true
      c.enablePan = true
      c.screenSpacePanning = true
      c.minDistance = 100
      c.maxDistance = 2000
      c.update()
    }
  }, [viewType, systemData, selectedObjectId, size, camera, set])

  // Exit profile mode
  useEffect(() => {
    if (viewType !== 'profile' && isProfileModeRef.current && controlsRef.current) {
      isProfileModeRef.current = false
      const original = originalCameraRef.current
      if (original) {
        set(() => ({ camera: original } as any))
        const c = controlsRef.current
        c.object = original
        if ('camera' in c) c.camera = original
        c.enableRotate = true
        c.enableZoom = true
        c.enablePan = true
        c.update()
      }
    }
  }, [viewType, set])

  return null
} 