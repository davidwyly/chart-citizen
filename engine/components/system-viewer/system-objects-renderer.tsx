"use client"

import React, { useMemo, useCallback, useRef, useEffect } from "react"
import * as THREE from "three"

import { InteractiveObject } from "../3d-ui/interactive-object"
import { OrbitalPath } from "./components/orbital-path"
import { StellarZones } from "./components/stellar-zones"
import { 
  calculateSystemOrbitalMechanics
} from "@/engine/utils/orbital-mechanics-calculator"
import { getOrbitalMechanicsConfig } from "@/engine/core/view-modes/compatibility"
// Import view modes to ensure they are registered
import "@/engine/core/view-modes"
import { GeometryRendererFactory } from "@/engine/renderers/geometry-renderers"
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
  viewType: ViewType
  objectRefsMap: React.MutableRefObject<Map<string, THREE.Object3D>>
  onObjectHover: (objectId: string | null) => void
  onObjectSelect?: (id: string, object: THREE.Object3D, name: string) => void
  onObjectFocus?: (object: THREE.Object3D, name: string, size: number, radius?: number, mass?: number, orbitRadius?: number) => void
  registerRef: (id: string, ref: THREE.Object3D | null) => void
}

// Celestial Object Component - renders any celestial object based on its geometry type
export const CelestialObjectRenderer = React.memo(({ 
  object, 
  scale, 
  starPosition,
  isSelected,
  planetSystemSelected = false,
  shaderParams,
  onHover,
  onSelect,
  onFocus,
  registerRef 
}: {
  object: CelestialObject
  scale: number
  starPosition: [number, number, number]
  isSelected: boolean
  planetSystemSelected?: boolean
  shaderParams?: {
    intensity?: number
    speed?: number
    distortion?: number
    diskSpeed?: number
    lensingStrength?: number
    diskBrightness?: number
  }
  onHover: (objectId: string | null) => void
  onSelect?: (id: string, object: THREE.Object3D, name: string) => void
  onFocus?: (object: THREE.Object3D, name: string, size: number, radius?: number, mass?: number, orbitRadius?: number) => void
  registerRef: (id: string, ref: THREE.Object3D | null) => void
}) => {
  const { geometry_type, classification, properties } = object

  // Use the new geometry renderer factory instead of basic geometry switching
  return (
    <GeometryRendererFactory
      object={object}
      scale={scale}
      starPosition={starPosition}
      position={[0, 0, 0]}
      isSelected={isSelected}
      planetSystemSelected={planetSystemSelected}
      shaderParams={shaderParams}
      onHover={onHover}
      onSelect={onSelect}
      onFocus={onFocus}
      registerRef={registerRef}
    />
  )
})

export function SystemObjectsRenderer({
  systemData,
  selectedObjectId,
  timeMultiplier,
  isPaused,
  viewType,
  objectRefsMap,
  onObjectHover,
  onObjectSelect,
  onObjectFocus,
  registerRef,
}: SystemObjectsRendererProps) {
  // PERFORMANCE FIX: Use a ref to store selectedObjectId to avoid dependency issues
  const selectedObjectIdRef = useRef(selectedObjectId);
  
  // Update the ref when selectedObjectId changes
  useEffect(() => {
    selectedObjectIdRef.current = selectedObjectId;
  }, [selectedObjectId]);

  // Get the primary star position for lighting calculations
  const primaryStarPosition: [number, number, number] = useMemo(() => {
    const primaryStar = systemData.objects.find(obj => 
      isStar(obj) && (obj.position || obj.id === systemData.lighting.primary_star)
    )
    return primaryStar?.position || [0, 0, 0]
  }, [systemData.objects, systemData.lighting.primary_star])

  // Calculate safe orbital mechanics for all objects
  const orbitalMechanics = useMemo(() => {
    // Cache is managed automatically - only clear when system data or view type changes
    return calculateSystemOrbitalMechanics(systemData.objects, viewType);
  }, [systemData.objects, viewType]);

  // Get object sizing from orbital mechanics calculator
  const getObjectSizing = useCallback((objectId: string) => {
    const mechanicsData = orbitalMechanics.get(objectId);
    const visualSize = mechanicsData?.visualRadius || 1.0;
    
    return {
      visualSize: visualSize,
    }
  }, [orbitalMechanics])

  // Calculate orbital period for objects
  const calculateOrbitalPeriod = useCallback((semiMajorAxis: number) => {
    return Math.sqrt(Math.pow(semiMajorAxis, 3)) * 2.0
  }, [])

  // PERFORMANCE FIX: Create a stable selection info function using ref instead of dependency
  const getHierarchicalSelectionInfo = useCallback((object: CelestialObject) => {
    const currentSelectedId = selectedObjectIdRef.current;
    const isSelected = currentSelectedId === object.id;
    
    // For moons, check if parent planet or sibling moon is selected
    let planetSystemSelected = false;
    if (object.classification === 'moon' && object.orbit?.parent) {
      const parentId = object.orbit.parent;
      
      // Check if parent planet is selected
      if (currentSelectedId === parentId) {
        planetSystemSelected = true;
      }
      
      // Check if any sibling moon is selected
      if (!planetSystemSelected && currentSelectedId) {
        const selectedObject = systemData.objects.find(obj => obj.id === currentSelectedId);
        if (selectedObject?.classification === 'moon' && selectedObject.orbit?.parent === parentId) {
          planetSystemSelected = true;
        }
      }
    }
    
    return { isSelected, planetSystemSelected };
  }, [systemData.objects]); // Only depends on systemData.objects, selectedObjectId accessed via ref

  // Render a celestial object with its orbit
  const renderCelestialObject = useCallback((object: CelestialObject, parentPosition: [number, number, number] = [0, 0, 0]) => {
    const { visualSize } = getObjectSizing(object.id);
    const { isSelected, planetSystemSelected } = getHierarchicalSelectionInfo(object);
    const scale = visualSize;

    // Handle objects with orbits
    if (object.orbit && isOrbitData(object.orbit)) {
      const orbit = object.orbit;
      
      // Get safe orbital distance from our orbital mechanics calculator
      const mechanicsData = orbitalMechanics.get(object.id);
      const semiMajorAxis = mechanicsData?.orbitDistance || 0;
      
      // If no orbital distance calculated, skip rendering this object
      if (semiMajorAxis === 0) {
        console.warn(`No orbital distance calculated for ${object.name} (${object.id}), skipping`);
        return null;
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
            planetSystemSelected={planetSystemSelected}
            onHover={onObjectHover}
            onSelect={onObjectSelect}
            onFocus={onObjectFocus}
            registerRef={registerRef}
          />
        </MemoizedOrbitalPath>
      )
    } else if (object.orbit && 'inner_radius' in object.orbit) {
      // Handle belt objects with BeltOrbitData
      const mechanicsData = orbitalMechanics.get(object.id);
      const beltData = mechanicsData?.beltData;
      
      if (!beltData) {
        console.warn(`No belt data calculated for ${object.name} (${object.id}), skipping`);
        return null;
      }
      
      const adjustedRadius = beltData.centerRadius;
      const adjustedWidth = (beltData.outerRadius - beltData.innerRadius) / 2;

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
              planetSystemSelected={planetSystemSelected}
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
            planetSystemSelected={planetSystemSelected}
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
    // selectedObjectId removed - handled by getHierarchicalSelectionInfo
    primaryStarPosition,
    getObjectSizing,
    calculateOrbitalPeriod,
    timeMultiplier,
    isPaused,
    objectRefsMap,
    viewType,
    onObjectHover,
    onObjectSelect,
    onObjectFocus,
    registerRef,
    orbitalMechanics,
    getHierarchicalSelectionInfo // Add this dependency since we call it
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

  // Get the orbital scaling from the new registry system
  const orbitalScaling = useMemo(() => {
    try {
      const viewConfig = getOrbitalMechanicsConfig(viewType);
      return viewConfig?.orbitScaling || 1.0;
    } catch (error) {
      console.warn(`Failed to get orbital scaling for ${viewType}, using fallback:`, error);
      return 1.0;
    }
  }, [viewType]);

  return (
    <group>
      {/* Render stellar zones first so they appear behind other objects */}
      <StellarZones 
        systemData={systemData}
        viewType={viewType}
        orbitalScale={orbitalScaling}
        showZones={viewType !== "profile"} // Hide zones in profile mode for clarity
      />
      {renderedObjects}
    </group>
  )
}
