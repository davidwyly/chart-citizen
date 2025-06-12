import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePerformanceMonitor } from '@/lib/performance-monitor'
import { createTerrestrialPlanetMaterial } from '@/engine/renderers/planets/materials/terrestrial-planet-material'
import type { EffectsLevel } from '@lib/types/effects-level'

interface PlanetViewerProps {
  qualityLevel: EffectsLevel
  onQualityChange?: (level: EffectsLevel) => void
}

export function PlanetViewer({ qualityLevel, onQualityChange }: PlanetViewerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { fps, isLowPerformance } = usePerformanceMonitor()
  
  // Create material with initial quality level
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.dispose()
    }
    materialRef.current = createTerrestrialPlanetMaterial(qualityLevel)
  }, [qualityLevel])
  
  // Monitor performance and adjust quality if needed
  useEffect(() => {
    if (!onQualityChange) return
    
    const newQuality = isLowPerformance ? 'low' 
      : fps < 30 ? 'medium' 
      : 'high'
      
    if (newQuality !== qualityLevel) {
      onQualityChange(newQuality)
    }
  }, [fps, isLowPerformance, qualityLevel, onQualityChange])
  
  // Update shader uniforms
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime()
    }
  })
  
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      {materialRef.current && <primitive object={materialRef.current} />}
    </mesh>
  )
} 