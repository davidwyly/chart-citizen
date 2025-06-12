import { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { CatalogObjectWrapper } from '../system-viewer/catalog-object-wrapper'
import { RaymarchedBlackHole } from '../3d-ui/raymarched-black-hole'
import { ObjectControls } from './object-controls'
import { ObjectInfo } from './object-info'
import { ObjectCatalog } from './object-catalog'
import type { CatalogObject } from '@/engine/system-loader'

interface ObjectViewerProps {
  initialObjectType?: string
}

export function ObjectViewer({ initialObjectType }: ObjectViewerProps) {
  const [selectedObjectId, setSelectedObjectId] = useState(initialObjectType || 'g2v-main-sequence')
  const [catalogObject, setCatalogObject] = useState<CatalogObject | null>(null)
  const [objectScale, setObjectScale] = useState(1.0)
  const [shaderScale, setShaderScale] = useState(1.0)
  const [shaderParams, setShaderParams] = useState<Record<string, number>>({})

  // Load catalog object data when selected object changes
  useEffect(() => {
    // This would be replaced with actual catalog data loading
    const loadCatalogObject = async (id: string) => {
      // Placeholder for catalog object loading
      const object = {} as CatalogObject // Replace with actual loading
      setCatalogObject(object)
    }

    loadCatalogObject(selectedObjectId)
  }, [selectedObjectId])

  return (
    <div className="w-full h-full flex">
      {/* Left sidebar - Object selection */}
      <div className="w-64 bg-gray-900 p-4 overflow-y-auto">
        <ObjectCatalog
          selectedObjectId={selectedObjectId}
          onObjectSelect={setSelectedObjectId}
        />
      </div>

      {/* Main viewer area */}
      <div className="flex-1 relative">
        <Canvas
          camera={{
            position: [0, 5, 15],
            fov: 60,
            near: 0.1,
            far: 100000,
          }}
        >
          <Suspense fallback={null}>
            {/* Scene lighting */}
            <ambientLight intensity={0.1} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} />
            
            {/* Orbit controls */}
            <OrbitControls
              makeDefault
              enablePan={true}
              maxDistance={1000}
              minDistance={0.1}
              enableDamping={true}
              dampingFactor={0.05}
              rotateSpeed={0.5}
              zoomSpeed={0.8}
            />

            {/* Selected object */}
            {selectedObjectId === 'raymarched-black-hole' ? (
              <RaymarchedBlackHole
                scale={objectScale}
                shaderScale={shaderScale}
                customizations={{
                  shader: shaderParams
                }}
              />
            ) : catalogObject && (
              <CatalogObjectWrapper
                objectId={selectedObjectId}
                catalogRef={selectedObjectId}
                position={[0, 0, 0]}
                scale={objectScale}
                shaderScale={shaderScale}
                customizations={{
                  shader: shaderParams
                }}
              />
            )}

            {/* Post-processing */}
            <EffectComposer>
              <Bloom intensity={0.5} luminanceThreshold={0.1} />
            </EffectComposer>

            <Preload all />
          </Suspense>
        </Canvas>

        {/* Right sidebar - Controls and info */}
        <div className="absolute top-0 right-0 w-80 bg-gray-900 bg-opacity-90 h-full p-4 overflow-y-auto">
          {(catalogObject || selectedObjectId === 'raymarched-black-hole') && (
            <>
              <ObjectControls
                catalogObject={catalogObject || {
                  id: selectedObjectId,
                  name: 'Raymarched Black Hole',
                  mass: 1000,
                  radius: 1,
                  category: 'compact_object',
                  subtype: 'raymarched_black_hole',
                  render: { shader: 'raymarched_black_hole' },
                  physical: { mass: 1000, radius: 1 }
                } as CatalogObject}
                shaderScale={shaderScale}
                objectScale={objectScale}
                shaderParams={shaderParams}
                onShaderScaleChange={setShaderScale}
                onObjectScaleChange={setObjectScale}
                onShaderParamsChange={setShaderParams}
              />
              <ObjectInfo catalogObject={catalogObject || {
                id: selectedObjectId,
                name: 'Raymarched Black Hole',
                mass: 1000,
                radius: 1,
                category: 'compact_object',
                subtype: 'raymarched_black_hole',
                render: { shader: 'raymarched_black_hole' },
                physical: { mass: 1000, radius: 1 }
              } as CatalogObject} />
            </>
          )}
        </div>
      </div>
    </div>
  )
} 