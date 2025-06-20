"use client"

import React, { useMemo, useCallback, useRef, useEffect } from "react"
import * as THREE from "three"

import { InteractiveObject } from "../3d-ui/interactive-object"
import { OrbitalPath } from "./components/orbital-path"
import { StellarZones } from "./components/stellar-zones"
import { useOrbitalMechanicsWithDefault } from "./hooks/use-orbital-mechanics"
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
  timeMultiplier,
  isPaused,
  shaderParams,
  showLabel = true,
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
  timeMultiplier?: number
  isPaused?: boolean
  shaderParams?: {
    intensity?: number
    speed?: number
    distortion?: number
    diskSpeed?: number
    lensingStrength?: number
    diskBrightness?: number
  }
  showLabel?: boolean
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
      timeMultiplier={timeMultiplier}
      isPaused={isPaused}
      shaderParams={shaderParams}
      showLabel={showLabel}
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
  // Removed selectedObjectIdRef - using selectedObjectId prop directly for immediate updates

  // Get the primary star position for lighting calculations
  const primaryStarPosition: [number, number, number] = useMemo(() => {
    const primaryStar = systemData.objects.find(obj => 
      isStar(obj) && (obj.position || obj.id === systemData.lighting.primary_star)
    )
    return primaryStar?.position || [0, 0, 0]
  }, [systemData.objects, systemData.lighting.primary_star])

  // Calculate safe orbital mechanics for all objects using the async-aware hook
  const orbitalMechanics = useOrbitalMechanicsWithDefault(systemData.objects, viewType);

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
    const currentSelectedId = selectedObjectId; // Use actual prop instead of ref to avoid timing issues
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
  }, [systemData.objects, selectedObjectId]); // Include selectedObjectId for immediate updates

  // Helper function to determine if object should be visible in profile mode
  const shouldObjectBeVisible = useCallback((object: CelestialObject) => {
    if (viewType !== 'profile' || !selectedObjectId) {
      return true // Always visible in non-profile modes
    }
    
    const focalObject = systemData.objects.find(obj => obj.id === selectedObjectId)
    if (!focalObject) {
      return true // Fallback to visible if focal object not found
    }
    
    // In profile mode, show focal object and its entire orbital family
    if (object.id === selectedObjectId) {
      return true // Always show the focused object
    }
    
    // Show direct children of the focused object (like planets orbiting the sun)
    if (object.orbit?.parent === focalObject.name?.toLowerCase() || 
        object.orbit?.parent === focalObject.id) {
      return true
    }
    
    // Show grandchildren (like moons orbiting planets that orbit the sun)
    const isGrandchild = systemData.objects.some((parentObj: CelestialObject) => 
      (parentObj.orbit?.parent === focalObject.name?.toLowerCase() || 
       parentObj.orbit?.parent === focalObject.id) &&
      object.orbit?.parent === parentObj.name?.toLowerCase()
    )
    if (isGrandchild) {
      return true
    }
    
    // Special case: If the focal object has a parent that's not in the system (like barycenter),
    // show all objects that share the same parent
    if (focalObject.orbit?.parent) {
      const focalParentExists = systemData.objects.some(obj => 
        obj.id === focalObject.orbit?.parent || 
        obj.name?.toLowerCase() === focalObject.orbit?.parent
      )
      
      // If parent doesn't exist as an object (like "barycenter"), show siblings
      if (!focalParentExists && object.orbit?.parent === focalObject.orbit.parent) {
        return true
      }
    }
    
    // Show the parent of the focused object
    if (focalObject.orbit?.parent && 
        (object.id === focalObject.orbit.parent || 
         object.name?.toLowerCase() === focalObject.orbit.parent)) {
      return true
    }
    
    return false // Hide everything else in profile mode
  }, [viewType, selectedObjectId, systemData.objects])

  // Render a celestial object with its orbit
  const renderCelestialObject = useCallback((object: CelestialObject, parentPosition: [number, number, number] = [0, 0, 0]) => {
    const { visualSize } = getObjectSizing(object.id);
    const { isSelected, planetSystemSelected } = getHierarchicalSelectionInfo(object);
    const scale = visualSize;
    const isVisible = shouldObjectBeVisible(object);
    
    // In profile mode, only show labels for focal object and its children
    // In other modes, always show labels
    const shouldShowLabel = viewType !== 'profile' || isVisible;

    // Handle objects with orbits
    if (object.orbit && isOrbitData(object.orbit)) {
      const orbit = object.orbit;
      
      // Get safe orbital distance from our orbital mechanics calculator
      const mechanicsData = orbitalMechanics.get(object.id);
      const semiMajorAxis = mechanicsData?.orbitDistance || 0;
      
      // Debug: Log orbital distance for objects with non-existent parents
      if (object.orbit?.parent === 'barycenter' || object.classification === 'star') {
        console.log(`🌟 STAR/BARYCENTER DEBUG: ${object.name} (${object.id})`);
        console.log(`   📊 Parent: ${object.orbit?.parent}`);
        console.log(`   📏 Calculated distance: ${semiMajorAxis}`);
        console.log(`   📊 Mechanics data:`, mechanicsData);
      }
      
      // Skip rendering only if no orbital distance calculated AND it's not a star at origin
      if (semiMajorAxis === 0 && object.classification !== 'star') {
        console.warn(`No orbital distance calculated for ${object.name} (${object.id}), skipping`);
        return null;
      }
      
      // For stars at origin (single star systems), set distance to a small value for proper positioning
      const actualOrbitDistance = semiMajorAxis === 0 && object.classification === 'star' ? 0.1 : semiMajorAxis;

      // Detect binary stars for opposite positioning
      let binaryStarIndex: number | undefined = undefined;
      if (object.orbit?.parent === 'barycenter' && object.classification === 'star') {
        // Find all stars with the same parent (barycenter) to determine binary star order
        const binaryStars = systemData.objects.filter(obj => 
          obj.orbit?.parent === 'barycenter' && 
          obj.classification === 'star'
        ).sort((a, b) => {
          // Sort by semi_major_axis to maintain consistent ordering
          const aAU = a.orbit && isOrbitData(a.orbit) ? a.orbit.semi_major_axis : 0;
          const bAU = b.orbit && isOrbitData(b.orbit) ? b.orbit.semi_major_axis : 0;
          return aAU - bAU;
        });
        
        if (binaryStars.length >= 2) {
          binaryStarIndex = binaryStars.findIndex(star => star.id === object.id);
          console.log(`🌟 Binary star detected: ${object.name} is star ${binaryStarIndex} of ${binaryStars.length}`);
        }
      }

      return (
        <group key={object.id} visible={isVisible}>
          <MemoizedOrbitalPath
            semiMajorAxis={actualOrbitDistance}
            eccentricity={orbit.eccentricity}
            inclination={orbit.inclination}
            orbitalPeriod={
              // Always use the actual period from data when available
              // This ensures accurate orbital motion for all objects
              orbit.orbital_period || calculateOrbitalPeriod(orbit.semi_major_axis)
            }
            showOrbit={isVisible} // Only show orbits for visible objects
            timeMultiplier={timeMultiplier}
            isPaused={isPaused}
            parentObjectId={orbit.parent}
            objectRefsMap={objectRefsMap}
            viewType={viewType}
            binaryStarIndex={binaryStarIndex}
          >
            <CelestialObjectRenderer
              object={object}
              scale={scale}
              starPosition={primaryStarPosition}
              isSelected={isSelected}
              planetSystemSelected={planetSystemSelected}
              timeMultiplier={timeMultiplier}
              isPaused={isPaused}
              showLabel={shouldShowLabel}
              onHover={isVisible ? onObjectHover : undefined}
              onSelect={isVisible ? onObjectSelect : undefined}
              onFocus={isVisible ? onObjectFocus : undefined}
              registerRef={registerRef}
            />
          </MemoizedOrbitalPath>
        </group>
      )
    } else if (object.orbit && 'inner_radius' in object.orbit) {
      // Handle belt objects with BeltOrbitData - use the volumetric BeltRenderer
      const mechanicsData = orbitalMechanics.get(object.id);
      const beltData = mechanicsData?.beltData;
      
      if (!beltData) {
        console.warn(`No belt data calculated for ${object.name} (${object.id}), skipping`);
        return null;
      }
      
      const adjustedRadius = beltData.centerRadius;

      return (
        <group key={object.id} visible={isVisible}>
          <CelestialObjectRenderer
            object={{
              ...object,
              properties: {
                ...object.properties,
                // Pass the calculated belt dimensions to the renderer
                belt_inner_radius: beltData.innerRadius,
                belt_outer_radius: beltData.outerRadius,
                belt_center_radius: beltData.centerRadius
              }
            }}
            scale={adjustedRadius}
            starPosition={primaryStarPosition}
            isSelected={isSelected}
            planetSystemSelected={planetSystemSelected}
            timeMultiplier={timeMultiplier}
            isPaused={isPaused}
            showLabel={shouldShowLabel}
            onHover={isVisible ? onObjectHover : undefined}
            onSelect={isVisible ? onObjectSelect : undefined}
            onFocus={isVisible ? onObjectFocus : undefined}
            registerRef={registerRef}
          />
        </group>
      )
    } else {
      // Objects without orbits (stars, barycenters)
      return (
        <group key={object.id} position={object.position || [0, 0, 0]} visible={isVisible}>
          <CelestialObjectRenderer
            object={object}
            scale={scale}
            starPosition={primaryStarPosition}
            isSelected={isSelected}
            planetSystemSelected={planetSystemSelected}
            timeMultiplier={timeMultiplier}
            isPaused={isPaused}
            showLabel={shouldShowLabel}
            onHover={isVisible ? onObjectHover : undefined}
            onSelect={isVisible ? onObjectSelect : undefined}
            onFocus={isVisible ? onObjectFocus : undefined}
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
    getHierarchicalSelectionInfo, // Add this dependency since we call it
    shouldObjectBeVisible // Add visibility function dependency
  ])

  // Build object hierarchy for rendering
  const objectHierarchy = useMemo(() => {
    const hierarchy = new Map<string, CelestialObject[]>()
    const rootObjects: CelestialObject[] = []

    // Always render all objects to maintain object registration
    // In profile mode, we'll make irrelevant objects invisible instead of not rendering them
    const objectsToRender = systemData.objects

    for (const object of objectsToRender) {
      if (object.orbit?.parent) {
        const parent = object.orbit.parent
        // Check if the parent actually exists in the system
        const parentExists = objectsToRender.some(obj => 
          obj.id === parent || obj.name?.toLowerCase() === parent.toLowerCase()
        )
        
        if (parentExists) {
          // Normal case: parent exists, add to hierarchy
          if (!hierarchy.has(parent)) {
            hierarchy.set(parent, [])
          }
          hierarchy.get(parent)!.push(object)
        } else {
          // Special case: parent doesn't exist (like "barycenter"), treat as root object
          console.log(`Object ${object.name} has non-existent parent "${parent}", treating as root object`)
          rootObjects.push(object)
        }
      } else {
        rootObjects.push(object)
      }
    }

    return { hierarchy, rootObjects }
  }, [systemData.objects, viewType, selectedObjectId])

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
