"use client"

import React, { useMemo, useCallback } from "react"
import * as THREE from "three"

import { InteractiveObject } from "../3d-ui/interactive-object"
import { OrbitalPath } from "../orbital-path"
import { StellarZones } from "./components/stellar-zones"
import { calculateObjectSizing } from "./view-mode-calculator"
import { calculateVisualSize, calculateOrbitalDistance, calculateMoonOrbitDistance } from "@/engine/utils/view-mode-calculator-km"
import { 
  calculateSystemOrbitalMechanics, 
  convertLegacyToSafeOrbitalMechanics 
} from "@/engine/utils/orbital-mechanics-calculator"
import type { ViewType } from "@lib/types/effects-level"
import { 
  OrbitalSystemData, 
  CelestialObject, 
  isStar, 
  isPlanet, 
  isMoon, 
  isBelt,
  isOrbitData 
} from "@/engine/types/orbital-system"

// Memoized components
const MemoizedInteractiveObject = React.memo(InteractiveObject)
const MemoizedOrbitalPath = React.memo(OrbitalPath)

interface SystemObjectsRendererProps {
  systemData: OrbitalSystemData
  selectedObjectId: string | null
  timeMultiplier: number
  isPaused: boolean
  SYSTEM_SCALE: number
  STAR_SCALE: number
  PLANET_SCALE: number
  ORBITAL_SCALE: number
  STAR_SHADER_SCALE: number
  viewType: ViewType
  objectRefsMap: React.MutableRefObject<Map<string, THREE.Object3D>>
  onObjectHover: (objectId: string | null) => void
  onObjectSelect?: (id: string, object: THREE.Object3D, name: string) => void
  onObjectFocus?: (object: THREE.Object3D, name: string, size: number, radius?: number, mass?: number, orbitRadius?: number) => void
  registerRef: (id: string, ref: THREE.Object3D) => void
}

// Celestial Object Component - renders any celestial object based on its geometry type
export const CelestialObjectRenderer = React.memo(({ 
  object, 
  scale, 
  starPosition,
  isSelected,
  onHover,
  onSelect,
  onFocus,
  registerRef 
}: {
  object: CelestialObject
  scale: number
  starPosition: [number, number, number]
  isSelected: boolean
  onHover: (objectId: string | null) => void
  onSelect?: (id: string, object: THREE.Object3D, name: string) => void
  onFocus?: (object: THREE.Object3D, name: string, size: number, radius?: number, mass?: number, orbitRadius?: number) => void
  registerRef: (id: string, ref: THREE.Object3D) => void
}) => {
  const { geometry_type, classification, properties } = object

  // Store the visual size in a ref to pass to userData
  const visualSize = scale

  const renderConfig = useMemo(() => {
    switch (geometry_type) {
      case "star":
        return {
          geometry: <sphereGeometry args={[1, 32, 32]} />,
          material: <meshBasicMaterial color={properties.tint || "#FFD700"} />
        }
      
      case "terrestrial":
        return {
          geometry: <sphereGeometry args={[1, 24, 24]} />,
          material: <meshBasicMaterial color={properties.tint || "#8B4513"} />
        }
      
      case "gas_giant":
        return {
          geometry: <sphereGeometry args={[1, 24, 24]} />,
          material: <meshBasicMaterial color={properties.tint || "#FF6B35"} />
        }
      
      case "rocky":
        return {
          geometry: <sphereGeometry args={[1, 16, 16]} />,
          material: <meshBasicMaterial color={properties.tint || "#C0C0C0"} />
        }
      
      default:
        return {
          geometry: <sphereGeometry args={[1, 16, 16]} />,
          material: <meshBasicMaterial color="#888888" />
        }
    }
  }, [geometry_type, properties])

  return (
    <MemoizedInteractiveObject
      objectId={object.id}
      objectName={object.name}
      objectType={classification as any}
      radius={scale}
      isSelected={isSelected}
      onHover={onHover}
      onSelect={(id: string, obj: THREE.Object3D) => {
        // Store visual size in userData for camera calculations
        obj.userData.visualSize = visualSize
        onSelect?.(id, obj, object.name)
      }}
      onFocus={(obj: THREE.Object3D) => {
        // Store visual size in userData for camera calculations
        obj.userData.visualSize = visualSize
        // Pass the visual size as the size parameter instead of the real radius
        onFocus?.(obj, object.name, visualSize, properties.radius, properties.mass, 0)
      }}
      registerRef={(id: string, ref: THREE.Object3D) => {
        if (ref) {
          // Store visual size in userData for camera calculations
          ref.userData.visualSize = visualSize
        }
        registerRef(id, ref)
      }}
      showLabel={true}
      labelAlwaysVisible={false}
    >
      <mesh scale={[scale, scale, scale]}>
        {renderConfig.geometry}
        {renderConfig.material}
      </mesh>
    </MemoizedInteractiveObject>
  )
})

export function SystemObjectsRenderer({
  systemData,
  selectedObjectId,
  timeMultiplier,
  isPaused,
  SYSTEM_SCALE,
  STAR_SCALE,
  PLANET_SCALE,
  ORBITAL_SCALE,
  STAR_SHADER_SCALE,
  viewType,
  objectRefsMap,
  onObjectHover,
  onObjectSelect,
  onObjectFocus,
  registerRef,
}: SystemObjectsRendererProps) {

  // Get the primary star position for lighting calculations
  const primaryStarPosition: [number, number, number] = useMemo(() => {
    const primaryStar = systemData.objects.find(obj => 
      isStar(obj) && (obj.position || obj.id === systemData.lighting.primary_star)
    )
    return primaryStar?.position || [0, 0, 0]
  }, [systemData.objects, systemData.lighting.primary_star])

  // Calculate safe orbital mechanics for all objects
  const orbitalMechanics = useMemo(() => {
    return calculateSystemOrbitalMechanics(systemData.objects, viewType);
  }, [systemData.objects, viewType]);

  // Legacy compatibility helper
  const legacyHelper = useMemo(() => {
    return convertLegacyToSafeOrbitalMechanics(systemData.objects, viewType, {
      STAR_SCALE,
      PLANET_SCALE,
      ORBITAL_SCALE,
    });
  }, [systemData.objects, viewType, STAR_SCALE, PLANET_SCALE, ORBITAL_SCALE]);

  // Memoize getObjectSizing function - now uses safe orbital mechanics
  const getObjectSizing = useCallback((objectType: string, baseRadiusKm: number, objectName?: string, orbitRadius?: number, mass?: number, objectId?: string) => {
    // Use new safe orbital mechanics calculation
    const mechanicsData = orbitalMechanics.get(objectId || '');
    const visualSize = mechanicsData?.visualRadius || legacyHelper.getObjectVisualSize(objectId || '');
    
    // Maintain backward compatibility by returning the expected structure
    return {
      actualSize: baseRadiusKm * SYSTEM_SCALE,
      visualSize: visualSize,
      dualProperties: {
        realRadius: baseRadiusKm,
        visualRadius: visualSize,
        objectType: objectType
      }
    }
  }, [viewType, SYSTEM_SCALE, orbitalMechanics, legacyHelper])

  // Calculate orbital period for objects
  const calculateOrbitalPeriod = useCallback((semiMajorAxis: number) => {
    return Math.sqrt(Math.pow(semiMajorAxis, 3)) * 2.0
  }, [])

  // Get navigational orbital radius for evenly spaced orbits
  const getNavigationalOrbitalRadius = useCallback((index: number): number => {
    const baseSpacing = ORBITAL_SCALE * 1.5
    return baseSpacing * (index + 1)
  }, [ORBITAL_SCALE])

  // Render a celestial object with its orbit
  const renderCelestialObject = useCallback((object: CelestialObject, parentPosition: [number, number, number] = [0, 0, 0]) => {
    const baseRadius = object.properties.radius || 1
    const mass = object.properties.mass || 1
    const orbitRadius = object.orbit && isOrbitData(object.orbit) ? object.orbit.semi_major_axis : 0
    
    const { visualSize } = getObjectSizing(
      object.classification, 
      baseRadius, 
      object.name, 
      orbitRadius, 
      mass,
      object.id
    )

    const isSelected = selectedObjectId === object.id
    
    // Use the visualSize directly - it's already properly scaled by the safe orbital mechanics system
    const scale = visualSize

    // Handle objects with orbits
    if (object.orbit && isOrbitData(object.orbit)) {
      const orbit = object.orbit
      
      // Get safe orbital distance from our orbital mechanics calculator
      const mechanicsData = orbitalMechanics.get(object.id);
      let semiMajorAxis = mechanicsData?.orbitDistance || legacyHelper.getObjectOrbitDistance(object.id);
      
      // Fallback to basic calculation if no mechanics data available
      if (!semiMajorAxis) {
        semiMajorAxis = calculateOrbitalDistance(orbit.semi_major_axis, viewType);
      }

      return (
        <MemoizedOrbitalPath
          key={object.id}
          semiMajorAxis={semiMajorAxis}
          eccentricity={orbit.eccentricity}
          inclination={orbit.inclination}
          orbitalPeriod={calculateOrbitalPeriod(orbit.semi_major_axis)}
          showOrbit={true}
          timeMultiplier={timeMultiplier}
          isPaused={isPaused}
          parentObjectId={orbit.parent}
          objectRefsMap={objectRefsMap}
          viewType={viewType}
        >
          <CelestialObjectRenderer
            object={object}
            scale={scale}
            starPosition={primaryStarPosition}
            isSelected={isSelected}
            onHover={onObjectHover}
            onSelect={onObjectSelect}
            onFocus={onObjectFocus}
            registerRef={registerRef}
          />
        </MemoizedOrbitalPath>
      )
    } else if (object.orbit && 'inner_radius' in object.orbit) {
      // Handle belt objects with BeltOrbitData
      const orbit = object.orbit
      
      // Get safe belt orbital data from our orbital mechanics calculator
      const mechanicsData = orbitalMechanics.get(object.id);
      const beltData = mechanicsData?.beltData;
      
      let adjustedRadius, adjustedWidth;
      
      if (beltData) {
        adjustedRadius = beltData.centerRadius;
        adjustedWidth = (beltData.outerRadius - beltData.innerRadius) / 2;
      } else {
        // Fallback to basic calculation
        const beltRadius = (orbit.inner_radius + orbit.outer_radius) / 2
        const beltWidth = (orbit.outer_radius - orbit.inner_radius) / 2
        adjustedRadius = calculateOrbitalDistance(beltRadius, viewType)
        adjustedWidth = calculateOrbitalDistance(beltWidth, viewType)
      }

      return (
        <group key={object.id} position={[0, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[adjustedRadius, adjustedWidth, 16, 64]} />
            <meshBasicMaterial 
              color={object.properties.tint || "#666666"}
              opacity={0.2}
              transparent={true}
            />
          </mesh>
          {/* Invisible interaction object for selection */}
          <group position={[adjustedRadius, 0, 0]}>
            <CelestialObjectRenderer
              object={object}
              scale={0.01} // Very small invisible object for interaction
              starPosition={primaryStarPosition}
              isSelected={isSelected}
              onHover={onObjectHover}
              onSelect={onObjectSelect}
              onFocus={onObjectFocus}
              registerRef={registerRef}
            />
          </group>
        </group>
      )
    } else {
      // Objects without orbits (stars, barycenters)
      return (
        <group key={object.id} position={object.position || [0, 0, 0]}>
          <CelestialObjectRenderer
            object={object}
            scale={scale}
            starPosition={primaryStarPosition}
            isSelected={isSelected}
            onHover={onObjectHover}
            onSelect={onObjectSelect}
            onFocus={onObjectFocus}
            registerRef={registerRef}
          />
        </group>
      )
    }
  }, [
    systemData.objects,
    selectedObjectId,
    primaryStarPosition,
    getObjectSizing,
    calculateOrbitalPeriod,
    getNavigationalOrbitalRadius,
    timeMultiplier,
    isPaused,
    objectRefsMap,
    viewType,
    STAR_SCALE,
    PLANET_SCALE,
    ORBITAL_SCALE,
    onObjectHover,
    onObjectSelect,
    onObjectFocus,
    registerRef
  ])

  // Build object hierarchy for rendering
  const objectHierarchy = useMemo(() => {
    const hierarchy = new Map<string, CelestialObject[]>()
    const rootObjects: CelestialObject[] = []

    for (const object of systemData.objects) {
      if (object.orbit?.parent) {
        const parent = object.orbit.parent
        if (!hierarchy.has(parent)) {
          hierarchy.set(parent, [])
        }
        hierarchy.get(parent)!.push(object)
      } else {
        rootObjects.push(object)
      }
    }

    return { hierarchy, rootObjects }
  }, [systemData.objects])

  // Render object hierarchy recursively
  const renderObjectWithChildren = useCallback((object: CelestialObject): React.ReactNode => {
    const children = objectHierarchy.hierarchy.get(object.id) || []
    
    return (
      <React.Fragment key={object.id}>
        {renderCelestialObject(object)}
        {children.map(child => renderObjectWithChildren(child))}
      </React.Fragment>
    )
  }, [objectHierarchy.hierarchy, renderCelestialObject])

  // Render all objects
  const renderedObjects = useMemo(() => {
    return objectHierarchy.rootObjects.map(rootObject => 
      renderObjectWithChildren(rootObject)
    )
  }, [objectHierarchy.rootObjects, renderObjectWithChildren])

  return (
    <group>
      {/* Render stellar zones first so they appear behind other objects */}
      <StellarZones 
        systemData={systemData}
        viewType={viewType}
        orbitalScale={ORBITAL_SCALE}
        showZones={viewType !== "profile"} // Hide zones in profile mode for clarity
      />
      {renderedObjects}
    </group>
  )
}
