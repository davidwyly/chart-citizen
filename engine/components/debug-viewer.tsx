"use client"

import { useState, useRef, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Preload } from "@react-three/drei"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import { Suspense } from "react"
import * as THREE from "three"
import { CatalogObjectWrapper } from "./system-viewer/catalog-object-wrapper"
import { SceneLighting } from "./system-viewer/components/scene-lighting"
import { DebugControls } from "./debug-viewer/debug-controls"
import { objectCatalog, type ObjectConfig } from "./debug-viewer/object-catalog"
import { engineSystemLoader, type SystemData } from "@/engine/system-loader"
import { BlackHole } from "./3d-ui/black-hole"
import { SystemViewer } from "./system-viewer"

interface DebugViewerProps {
  objectType: string
}

export function DebugViewer({ objectType }: DebugViewerProps) {
  const [selectedObject, setSelectedObject] = useState<ObjectConfig | null>(null)
  const [shaderScale, setShaderScale] = useState(1.0)
  const [objectScale, setObjectScale] = useState(1.0)
  const [shaderParams, setShaderParams] = useState({
    intensity: 1.0,
    speed: 1.0,
    distortion: 1.0,
  })
  const objectRef = useRef<THREE.Object3D>(null)

  // Load object configuration when objectType changes
  useEffect(() => {
    const config = objectCatalog[objectType]
    if (config) {
      setSelectedObject(config)
      setObjectScale(config.defaultScale)
      setShaderScale(config.defaultShaderScale)
      setShaderParams(config.defaultShaderParams)
    }
  }, [objectType])

  // Mock system data for the debug viewer
  const mockSystemData: SystemData = {
    id: "debug-system",
    name: "Debug System",
    description: "Debug system for shader testing",
    barycenter: [0, 0, 0] as [number, number, number],
    stars: [{
      id: "debug-star",
      catalog_ref: "debug-star",
      name: "Debug Star",
      position: [0, 0, 0] as [number, number, number]
    }],
    lighting: {
      primary_star: "debug-star",
      ambient_level: 0.1,
      stellar_influence_radius: 1000
    }
  }

  if (!selectedObject) {
    return (
      <div className="w-full h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Object Not Found</h1>
          <p className="mb-4">Available objects:</p>
          <ul className="space-y-2">
            {Object.entries(objectCatalog).map(([key, config]) => (
              <li key={key}>
                <a
                  href={`/viewer/${key}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {config.name}
                </a>
                <p className="text-sm text-gray-400">{config.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{
          position: [0, 5, 15],
          fov: 60,
          near: 0.1,
          far: 100000,
        }}
      >
        <Suspense fallback={null}>
          {/* Basic scene setup */}
          <SceneLighting systemData={mockSystemData} viewType="realistic" />
          
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

          {/* Debug object */}
          {selectedObject.type === 'black-hole' ? (
            <BlackHole
              scale={objectScale}
              shaderScale={shaderScale}
              customizations={{
                shader: shaderParams
              }}
            />
          ) : (
            <CatalogObjectWrapper
              objectId="debug-object"
              catalogRef={objectType}
              position={[0, 0, 0]}
              scale={objectScale}
              shaderScale={shaderScale}
              customizations={{
                shader: {
                  ...shaderParams
                }
              }}
            />
          )}

          {/* Post-processing effects */}
          <EffectComposer>
            <Bloom intensity={0.5} luminanceThreshold={0.1} />
          </EffectComposer>

          <Preload all />
        </Suspense>
      </Canvas>

      {/* Debug controls overlay */}
      <DebugControls
        shaderScale={shaderScale}
        objectScale={objectScale}
        shaderParams={shaderParams}
        onShaderScaleChange={setShaderScale}
        onObjectScaleChange={setObjectScale}
        onShaderParamsChange={setShaderParams}
      />

      {/* Object info overlay */}
      <div className="absolute top-4 left-4 bg-black/80 p-4 rounded-lg text-white">
        <h2 className="text-xl font-bold mb-2">{selectedObject.name}</h2>
        <p className="text-sm text-gray-300 mb-4">{selectedObject.description}</p>
        <div className="space-y-2">
          <p>Type: {selectedObject.type}</p>
          <p>Scale: {objectScale.toFixed(2)}</p>
          <p>Shader Scale: {shaderScale.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
} 