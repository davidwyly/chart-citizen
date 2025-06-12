"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html, Preload } from "@react-three/drei"
import * as THREE from "three"
import { engineSystemLoader, type StarmapData } from "@/engine/system-loader"

interface StarmapViewerProps {
  mode: string
  onSystemSelect: (systemId: string) => void
}

/**
 * Renders an interactive galaxy starmap with 2-D / 3-D toggle and basic route-planning.
 */
export function StarmapViewer({ mode, onSystemSelect }: StarmapViewerProps) {
  const [starmap, setStarmap] = useState<StarmapData | null>(null)
  const [view3D, setView3D] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [route, setRoute] = useState<string[]>([])

  // Load starmap once
  useEffect(() => {
    engineSystemLoader.loadStarmap(mode).then((data) => setStarmap(data))
  }, [mode])

  // Memo of systems array
  const systems = useMemo(() => Object.values(starmap?.systems || {}), [starmap])

  // Derived map for quick lookup
  const systemMap = useMemo(() => starmap?.systems || {}, [starmap])

  // Toggle 2d/3d
  const toggleDim = () => setView3D((v) => !v)

  // Handle system click (with Shift for route)
  const handleSystemClick = useCallback(
    (id: string, event: MouseEvent) => {
      if (event.shiftKey) {
        setRoute((prev) => {
          // First entry is always allowed
          if (prev.length === 0) return [id]
          const last = prev[prev.length - 1]
          // Validate adjacency
          const lastSystem = systemMap[last]
          if (lastSystem?.jump_routes?.includes(id)) {
            return [...prev, id]
          }
          return prev // ignore invalid
        })
      } else {
        onSystemSelect(id)
      }
    },
    [onSystemSelect, systemMap]
  )

  // Build line segments for all jump routes
  const jumpLines = useMemo(() => {
    if (!starmap) return [] as [THREE.Vector3, THREE.Vector3][]
    const lines: [THREE.Vector3, THREE.Vector3][] = []
    Object.values(starmap.systems).forEach((sys: any) => {
      const from = new THREE.Vector3(...sys.position)
      sys.jump_routes?.forEach((toId: string) => {
        const toSys = starmap.systems[toId]
        if (toSys) lines.push([from, new THREE.Vector3(...toSys.position)])
      })
    })
    return lines
  }, [starmap])

  // Helper component for a single star node
  const StarNode = ({ sys }: { sys: any }) => {
    const pos = useMemo(() => {
      const [x, y, z] = sys.position
      return view3D ? [x, y, z] : [x, 0, z]
    }, [sys.position, view3D]) as [number, number, number]

    return (
      <mesh
        position={pos}
        onPointerOver={() => setHoveredId(sys.id)}
        onPointerOut={() => setHoveredId((id) => (id === sys.id ? null : id))}
        onClick={(e) => handleSystemClick(sys.id, e.nativeEvent)}
      >
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color={hoveredId === sys.id ? "#ffaa00" : "#ffffff"} />
        {/* Label */}
        {hoveredId === sys.id && (
          <Html distanceFactor={8} style={{ pointerEvents: "none" }}>
            <div className="px-2 py-1 bg-black/70 text-white text-xs rounded">
              {sys.name}
            </div>
          </Html>
        )}
      </mesh>
    )
  }

  if (!starmap) {
    return <div className="text-white p-4">Loading starmap...</div>
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 space-x-2">
        <button
          className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
          onClick={toggleDim}
        >
          {view3D ? "2-D" : "3-D"}
        </button>
        {route.length > 0 && (
          <button
            className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-600"
            onClick={() => setRoute([])}
          >
            Clear Route
          </button>
        )}
      </div>

      <Canvas camera={{ position: [0, 0, 40], fov: 45 }}>
        {/* Jump route lines */}
        {jumpLines.map(([a, b], idx) => (
          <line key={idx}>
            <bufferGeometry attach="geometry">
              {/* @ts-ignore */}
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array([...a.toArray(), ...b.toArray()])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              attach="material"
              color={"#4444ff"}
              linewidth={1}
              opacity={0.5}
              transparent
            />
          </line>
        ))}

        {/* Route lines */}
        {route.map((id, index) => {
          if (index === 0) return null
          const from = systemMap[route[index - 1]]
          const to = systemMap[id]
          if (!from || !to) return null
          const a = new THREE.Vector3(...from.position)
          const b = new THREE.Vector3(...to.position)
          if (!view3D) {
            a.y = 0
            b.y = 0
          }
          return (
            <line key={`route-${index}`}>
              <bufferGeometry attach="geometry">
                {/* @ts-ignore */}
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array([...a.toArray(), ...b.toArray()])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ff9900" linewidth={2} />
            </line>
          )
        })}

        {/* Star nodes */}
        {systems.map((sys: any) => (
          <StarNode key={sys.id} sys={sys} />
        ))}

        <OrbitControls makeDefault enablePan enableRotate enableZoom />
        <Preload all />
      </Canvas>
    </div>
  )
} 