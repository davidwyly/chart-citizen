import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Preload } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { usePerformanceMonitor } from '@/lib/performance-monitor'
import { SceneLighting } from './components/scene-lighting'
import { OrbitalSystemData, CelestialObject } from '@/engine/types/orbital-system'
import { CelestialObjectRenderer } from '@/engine/components/system-viewer/system-objects-renderer'

interface PlanetViewerProps {
  systemData: OrbitalSystemData
  planetId: string
  onBack: () => void
}

export function PlanetViewer({ systemData, planetId, onBack }: PlanetViewerProps) {
  const { fps } = usePerformanceMonitor()
  
  // Calculate if performance is low based on FPS
  const isLowPerformance = fps < 30

  const planet = systemData.objects?.find(obj => obj.id === planetId)
  
  if (!planet) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Planet not found</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to System
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ alpha: true, antialias: !isLowPerformance }}
      >
        <Suspense fallback={null}>
          <SceneLighting systemData={systemData} viewType="explorational" />
          
          <CelestialObjectRenderer
            object={planet}
            scale={5} // Scale for the individual planet viewer
            starPosition={[0, 0, 0]} // Assuming no other stars in this isolated view
            isSelected={false}
            onHover={() => {}}
            onSelect={() => {}}
            onFocus={() => {}}
            registerRef={() => {}} // No ref registration needed in this isolated viewer
          />

          <OrbitControls enablePan={true} maxDistance={50} minDistance={1} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {!isLowPerformance && (
            <EffectComposer>
              <Bloom intensity={0.5} luminanceThreshold={0.9} />
            </EffectComposer>
          )}
          
          <Preload all />
        </Suspense>
      </Canvas>
      
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-3 py-2 bg-black/50 text-white rounded hover:bg-black/70"
      >
        ← Back to System
      </button>
    </div>
  )
} 