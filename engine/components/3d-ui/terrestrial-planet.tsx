import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { TerrestrialPlanetMaterial } from './materials/terrestrial-planet-material'
import type { EffectsLevel } from '@lib/types/effects-level'
import { extend } from '@react-three/fiber'

// Extend React Three Fiber with the custom material
extend({ TerrestrialPlanetMaterial })

interface TerrestrialPlanetProps {
  scale?: number
  shaderScale?: number
  qualityLevel?: EffectsLevel
  customizations?: {
    intensity?: number
    speed?: number
    distortion?: number
    topColor?: [number, number, number]
    middleColor?: [number, number, number]
    bottomColor?: [number, number, number]
  }
}

export function TerrestrialPlanet({
  scale = 1,
  shaderScale = 1,
  qualityLevel = 'high',
  customizations = {}
}: TerrestrialPlanetProps) {
  const materialRef = useRef<TerrestrialPlanetMaterial>(null)
  
  // Create material instance
  const material = useMemo(() => {
    return new TerrestrialPlanetMaterial(qualityLevel)
  }, [qualityLevel])
  
  // Update shader uniforms
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime()
      
      // Apply customizations if provided
      if (customizations.intensity !== undefined) {
        materialRef.current.uniforms.intensity.value = customizations.intensity
      }
      if (customizations.speed !== undefined) {
        materialRef.current.uniforms.speed.value = customizations.speed
      }
      if (customizations.distortion !== undefined) {
        materialRef.current.uniforms.distortion.value = customizations.distortion
      }
      if (customizations.topColor) {
        materialRef.current.uniforms.topColor.value.setRGB(...customizations.topColor)
      }
      if (customizations.middleColor) {
        materialRef.current.uniforms.middleColor.value.setRGB(...customizations.middleColor)
      }
      if (customizations.bottomColor) {
        materialRef.current.uniforms.bottomColor.value.setRGB(...customizations.bottomColor)
      }
    }
  })
  
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1 * shaderScale, 64, 64]} />
      <terrestrialPlanetMaterial ref={materialRef} />
    </mesh>
  )
} 