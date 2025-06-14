"use client"

import React, { useMemo, useState, useEffect, useCallback } from "react"
import * as THREE from "three"

import { InteractiveObject } from "../3d-ui/interactive-object"
import { OrbitalPath } from "../orbital-path"
import { CatalogObjectWrapper } from "./catalog-object-wrapper"
import { StellarZones } from "./components/stellar-zones"
import { calculateObjectSizing, shouldUseUnifiedCalculations } from "./view-mode-calculator"
import type { SystemData, CatalogObject, SystemObject } from "@/engine/system-loader"
import type { ViewType } from "@lib/types/effects-level"
import { engineSystemLoader } from "@/engine/system-loader"


// Memoized components
const MemoizedInteractiveObject = React.memo(InteractiveObject)
const MemoizedOrbitalPath = React.memo(OrbitalPath)
const MemoizedCatalogObjectWrapper = React.memo(CatalogObjectWrapper)

interface SystemObjectsRendererProps {
  systemData: SystemData
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

// Add this before the component
const getUniqueCatalogRefs = (systemData: SystemData): string[] => {
  const refs = new Set<string>();
  
  // Add star refs
  systemData.stars?.forEach(star => {
    if (star.catalog_ref) refs.add(star.catalog_ref);
  });
  
  // Add planet refs
  systemData.planets?.forEach(planet => {
    if (planet.catalog_ref) refs.add(planet.catalog_ref);
  });
  
  // Add moon refs (only for moons with valid parent)
  systemData.moons?.forEach(moon => {
    if (moon.catalog_ref && moon.orbit?.parent) refs.add(moon.catalog_ref);
  });
  
  return Array.from(refs);
};

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
  const [catalogObjects, setCatalogObjects] = useState<Record<string, CatalogObject>>({})
  // Performance monitoring would go here if available

  // Improved catalog object loading with error handling
  useEffect(() => {
    const loadCatalogObjects = async () => {
      try {
        const uniqueRefs = getUniqueCatalogRefs(systemData);
        if (uniqueRefs.length === 0) return;

        const promises = uniqueRefs.map(async (ref) => {
          try {
            const obj = await engineSystemLoader.getCatalogObject(ref);
            if (obj) {
              return [ref, obj];
            }
            return null;
          } catch (error) {
            console.error(`Failed to load catalog object ${ref}:`, error);
            return null;
          }
        });

        const results = await Promise.all(promises);
        const newObjects = Object.fromEntries(
          results.filter((result): result is [string, any] => result !== null)
        );

        setCatalogObjects(prev => ({
          ...prev,
          ...newObjects
        }));
      } catch (error) {
        console.error('Failed to load catalog objects:', error);
      }
    };

    loadCatalogObjects();
  }, [systemData]);

  // Memoize orbital path geometries with optimized segments
  const orbitalPathGeometries = useMemo(() => {
    const geometries: Record<number, THREE.BufferGeometry> = {};
    const maxRadius = ORBITAL_SCALE * 10;
    const segments = Math.min(64, Math.max(32, Math.floor(maxRadius / 100))); // Adjust segments based on radius

    // Pre-compute geometries for common radii
    for (let radius = 1; radius <= maxRadius; radius *= 2) {
      try {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(
            Math.cos(theta) * radius,
            0,
            Math.sin(theta) * radius
          ));
        }
        geometries[radius] = new THREE.BufferGeometry().setFromPoints(points);
      } catch (error) {
        console.error(`Failed to create orbital path geometry for radius ${radius}:`, error);
      }
    }
    return geometries;
  }, [ORBITAL_SCALE]);

  // Memoize getOrbitalPathGeometry function with error handling
  const getOrbitalPathGeometry = useCallback((radius: number): THREE.BufferGeometry | null => {
    try {
      const keys = Object.keys(orbitalPathGeometries).map(Number);
      if (keys.length === 0) return null;

      const closestRadius = keys.reduce((prev, curr) => 
        Math.abs(curr - radius) < Math.abs(prev - radius) ? curr : prev
      );
      
      return orbitalPathGeometries[closestRadius] || null;
    } catch (error) {
      console.error(`Failed to get orbital path geometry for radius ${radius}:`, error);
      return null;
    }
  }, [orbitalPathGeometries]);

  // Memoize getNavigationalOrbitalRadius function
  const getNavigationalOrbitalRadius = useCallback((index: number): number => {
    if (viewType !== "navigational" && viewType !== "profile") {
      const baseSpacing = ORBITAL_SCALE * 0.5;
      return baseSpacing * (index + 1);
    }

    if (systemData.planets && systemData.planets.length > 0 && systemData.planets[index]) {
      return systemData.planets[index].orbit?.semi_major_axis || (ORBITAL_SCALE * 0.5 * (index + 1));
    }
    return ORBITAL_SCALE * 0.5 * (index + 1);
  }, [ORBITAL_SCALE, viewType, systemData.planets]);

  // Memoize getObjectSizing function using unified system
  const getObjectSizing = useCallback((objectType: string, baseRadius: number, objectName?: string, orbitRadius?: number, mass?: number) => {
    return calculateObjectSizing(objectType, baseRadius, viewType, SYSTEM_SCALE, objectName, orbitRadius, mass)
  }, [viewType, SYSTEM_SCALE])

  // Memoize validateScale function
  const validateScale = useCallback((value: number, fallback: number = 0): number => {
    return isNaN(value) ? fallback : value
  }, [])

  // Memoize isPlanetSelected function
  const isPlanetSelected = useCallback((planetId: string): boolean => {
    return selectedObjectId === planetId
  }, [selectedObjectId])

  // Memoize calculateOrbitalPeriod function
  const calculateOrbitalPeriod = useCallback((semiMajorAxis: number) => {
    return Math.sqrt(Math.pow(semiMajorAxis, 3)) * 2.0
  }, [])

  // Memoize getParentPosition function
  const getParentPosition = useCallback((parentId: string): [number, number, number] => {
    const parent = objectRefsMap.current.get(parentId)
    if (parent) {
      return [parent.position.x, parent.position.y, parent.position.z]
    }
    return [0, 0, 0]
  }, [objectRefsMap])

  // Memoize registerObjectRef function
  const registerObjectRef = useCallback((id: string, ref: THREE.Object3D) => {
    objectRefsMap.current.set(id, ref)
  }, [objectRefsMap])

  // Memoize game layout calculations with error handling
  const gameLayout = useMemo(() => {
    try {
      const layout: {
        starPosition: [number, number, number];
        planetPositions: [number, number, number][];
        moonPositions: [number, number, number][];
      } = {
        starPosition: [0, 0, 0],
        planetPositions: [],
        moonPositions: []
      }

      // Calculate star position
      const starCatalog = catalogObjects[systemData.stars[0].catalog_ref]
      const starSizing = getObjectSizing("star", starCatalog?.radius || 1, systemData.stars[0].name, 0, starCatalog?.mass)
      layout.starPosition = [0, 0, 0]

      // Calculate planet positions
      systemData.planets?.forEach((planet, index) => {
        const planetCatalog = catalogObjects[planet.catalog_ref]
        const planetSizing = getObjectSizing("planet", planetCatalog?.radius || 1, planet.name, planet.orbit?.semi_major_axis, planetCatalog?.mass)
        const orbitalRadius = getNavigationalOrbitalRadius(index)
        const angle = (index / (systemData.planets?.length || 1)) * Math.PI * 2
        layout.planetPositions.push([
          Math.cos(angle) * orbitalRadius,
          0,
          Math.sin(angle) * orbitalRadius
        ])
      })

      // Calculate moon positions
      systemData.moons?.forEach((moon, index) => {
        const moonCatalog = catalogObjects[moon.catalog_ref]
        const moonSizing = getObjectSizing("moon", moonCatalog?.radius || 1, moon.name, moon.orbit?.semi_major_axis, moonCatalog?.mass)
        const parentIndex = systemData.planets?.findIndex(p => p.id === moon.orbit?.parent) ?? -1
        if (parentIndex !== -1) {
          const parentPosition = layout.planetPositions[parentIndex]
          const moonOffset = moonSizing.visualSize * 2
          const angle = (index / (systemData.moons?.length || 1)) * Math.PI * 2
          layout.moonPositions.push([
            parentPosition[0] + Math.cos(angle) * moonOffset,
            parentPosition[1],
            parentPosition[2] + Math.sin(angle) * moonOffset
          ])
        }
      })

      return layout
    } catch (error) {
      console.error('Failed to calculate game layout:', error)
      return {
        starPosition: [0, 0, 0],
        planetPositions: [],
        moonPositions: []
      }
    }
  }, [systemData, catalogObjects, getObjectSizing, getNavigationalOrbitalRadius])

  // In game mode, position star at the calculated position
  const starPosition = viewType === "profile"
    ? [
        validateScale(gameLayout.starPosition[0], 0),
        validateScale(gameLayout.starPosition[1], 0),
        validateScale(gameLayout.starPosition[2], 0)
      ] as [number, number, number]
    : [0, 0, 0] as [number, number, number] // Stars are always at origin in non-game modes

  // Memoize star rendering
  const renderedStars = useMemo(() => {
    // In profile view we still render stars regardless of selection
    
    if (!systemData.stars) return null;
    
    // Calculate barycenter for binary systems
    const barycenter = systemData.stars.length > 1 
      ? [0, 0, 0] // Use system barycenter for multiple stars
      : [0, 0, 0]; // Single star at origin
    
    return systemData.stars.map((star, index) => {
      const catalogObject = catalogObjects[star.catalog_ref];
      const baseRadius = catalogObject?.radius || 1;
      const mass = catalogObject?.mass || 100; // Default star mass
      
      const { visualSize, dualProperties } = getObjectSizing("star", baseRadius, star.name, 0, mass);
      const isSelected = selectedObjectId === star.id;
      
      // Calculate star position based on orbital parameters or binary separation
      let starPosition: [number, number, number];
      if (star.position) {
        // Use the position defined in the system JSON file
        starPosition = star.position;
      } else if (systemData.stars.length > 1) {
        const separation = 5; // Default separation for binary stars
        const angle = (2 * Math.PI * index) / systemData.stars.length;
        starPosition = [
          Math.cos(angle) * separation,
          0,
          Math.sin(angle) * separation
        ];
      } else {
        starPosition = [0, 0, 0];
      }
      
      return (
        <MemoizedInteractiveObject
          key={star.id}
          objectId={star.id}
          objectName={star.name}
          objectType="star"
          radius={visualSize * STAR_SCALE}
          position={starPosition}
          isSelected={isSelected}
          onHover={onObjectHover}
          onSelect={(id, object) => onObjectSelect?.(id, object, star.name)}
          onFocus={(object: THREE.Object3D) => onObjectFocus?.(object, star.name, visualSize, dualProperties.realRadius, mass, 0)}
          registerRef={registerRef}
          showLabel={true}
          labelAlwaysVisible={viewType === "profile"}
        >
          <CatalogObjectWrapper
            objectId={star.id}
            catalogRef={star.catalog_ref}
            position={starPosition}
            scale={visualSize * STAR_SCALE}
            shaderScale={STAR_SHADER_SCALE}
            isPrimaryStar={systemData.stars.length === 1}
            onFocus={(object: THREE.Object3D) => onObjectFocus?.(object, star.name, visualSize, dualProperties.realRadius, mass, 0)}
            onSelect={(id: string, object: THREE.Object3D) => onObjectSelect?.(id, object, star.name)}
            registerRef={registerRef}
          />
        </MemoizedInteractiveObject>
      );
    });
  }, [systemData.stars, catalogObjects, viewType, SYSTEM_SCALE, STAR_SCALE, STAR_SHADER_SCALE, selectedObjectId, ORBITAL_SCALE, timeMultiplier, getObjectSizing]);

  // Calculate primary star position for lighting
  const primaryStarPosition = useMemo(() => {
    if (!systemData.stars || systemData.stars.length === 0) return [0, 0, 0] as [number, number, number];
    
    const primaryStar = systemData.stars[0]; // Use first star as primary
    let position: [number, number, number];
    if (primaryStar.position) {
      position = primaryStar.position;
    } else {
      position = [0, 0, 0]; // Default to origin
    }
    
    return position;
  }, [systemData.stars]);

  // Memoize planet rendering
  const renderedPlanets = useMemo(() => {
    if (!systemData.planets) return null;

    return systemData.planets.map((planet, index) => {
      const catalogObject = catalogObjects[planet.catalog_ref];
      const baseRadius = catalogObject?.radius || 1;
      const mass = catalogObject?.mass || 1; // Default planet mass
      const orbitRadius = planet.orbit?.semi_major_axis || 0;
      
      const { visualSize, dualProperties } = getObjectSizing("planet", baseRadius, planet.name, orbitRadius, mass);
      const semiMajorAxis = (viewType === "navigational" || viewType === "profile")
        ? getNavigationalOrbitalRadius(index)
        : (planet.orbit?.semi_major_axis || getNavigationalOrbitalRadius(index));
      const isSelected = selectedObjectId === planet.id;

      const object3D = new THREE.Object3D();  // Assuming or creating the object here for userData
      object3D.userData.orbitRadius = planet.orbit?.semi_major_axis || 0;

      return (
        <React.Fragment key={planet.id}>
          <MemoizedOrbitalPath
            semiMajorAxis={semiMajorAxis * ORBITAL_SCALE}
            eccentricity={planet.orbit?.eccentricity || 0}
            inclination={planet.orbit?.inclination || 0}
            orbitalPeriod={calculateOrbitalPeriod(semiMajorAxis)}
            showOrbit={true}
            timeMultiplier={timeMultiplier}
            isPaused={isPaused}
            parentObjectId={systemData.stars[0]?.id}
            objectRefsMap={objectRefsMap}
            viewType={viewType}
          >
            <MemoizedInteractiveObject
              objectId={planet.id}
              objectName={planet.name}
              objectType="planet"
              radius={visualSize * PLANET_SCALE}
              isSelected={isSelected}
              onHover={onObjectHover}
              onSelect={(id: string, object: THREE.Object3D) => onObjectSelect?.(id, object, planet.name)}
              onFocus={(object: THREE.Object3D) => onObjectFocus?.(object, planet.name, visualSize, dualProperties.realRadius, mass, orbitRadius)}
              registerRef={registerRef}
              showLabel={true}
              labelAlwaysVisible={viewType === "profile"}
            >
              <CatalogObjectWrapper
                objectId={planet.id}
                catalogRef={planet.catalog_ref}
                position={[0, 0, 0]}
                scale={visualSize * PLANET_SCALE}
                starPosition={primaryStarPosition}
                onFocus={(object: THREE.Object3D) => onObjectFocus?.(object, planet.name, visualSize, dualProperties.realRadius, mass, orbitRadius)}
                onSelect={(id: string, object: THREE.Object3D) => onObjectSelect?.(id, object, planet.name)}
                registerRef={registerRef}
              />
            </MemoizedInteractiveObject>
          </MemoizedOrbitalPath>
        </React.Fragment>
      );
    });
  }, [systemData.planets, catalogObjects, viewType, SYSTEM_SCALE, ORBITAL_SCALE, PLANET_SCALE, selectedObjectId, getObjectSizing]);

  // Memoize moon rendering
  const renderedMoons = useMemo(() => {
    if (!systemData.moons) return null;

    return systemData.moons.map(moon => {
      if (!moon.orbit?.parent) return null;

      const catalogObject = catalogObjects[moon.catalog_ref];
      const baseRadius = catalogObject?.radius || 1;
      const mass = catalogObject?.mass || 0.1; // Default moon mass
      const orbitRadius = moon.orbit?.semi_major_axis || 0;
      
      const { visualSize, dualProperties } = getObjectSizing("moon", baseRadius, moon.name, orbitRadius, mass);
      const semiMajorAxis = (viewType === "navigational" || viewType === "profile") 
        ? Math.max(2.0, moon.orbit.semi_major_axis * 2.5) // Ensure minimum visible distance and scale up
        : moon.orbit.semi_major_axis;
      const parentPos = getParentPosition(moon.orbit.parent);
      const isSelected = selectedObjectId === moon.id;

      const object3D = new THREE.Object3D();  // Assuming or creating the object here for userData
      object3D.userData.orbitRadius = moon.orbit?.semi_major_axis || 0;

      return (
        <React.Fragment key={moon.id}>
          <MemoizedOrbitalPath
            semiMajorAxis={semiMajorAxis * ORBITAL_SCALE}
            eccentricity={moon.orbit.eccentricity}
            inclination={moon.orbit.inclination}
            orbitalPeriod={calculateOrbitalPeriod(semiMajorAxis)}
            showOrbit={true}
            timeMultiplier={timeMultiplier}
            isPaused={isPaused}
            parentObjectId={moon.orbit.parent}
            objectRefsMap={objectRefsMap}
            viewType={viewType}
          >
            <MemoizedInteractiveObject
              objectId={moon.id}
              objectName={moon.name}
              objectType="moon"
              radius={visualSize * PLANET_SCALE}
              isSelected={isSelected}
              onHover={onObjectHover}
              onSelect={(id: string, object: THREE.Object3D) => onObjectSelect?.(id, object, moon.name)}
              onFocus={(object: THREE.Object3D) => onObjectFocus?.(object, moon.name, visualSize, dualProperties.realRadius, mass, orbitRadius)}
              registerRef={registerRef}
              showLabel={true}
              labelAlwaysVisible={viewType === "profile"}
            >
              <CatalogObjectWrapper
                objectId={moon.id}
                catalogRef={moon.catalog_ref}
                position={[0, 0, 0]}
                scale={visualSize * PLANET_SCALE}
                starPosition={primaryStarPosition}
                onFocus={(object: THREE.Object3D) => onObjectFocus?.(object, moon.name, visualSize, dualProperties.realRadius, mass, orbitRadius)}
                onSelect={(id: string, object: THREE.Object3D) => onObjectSelect?.(id, object, moon.name)}
                registerRef={registerRef}
              />
            </MemoizedInteractiveObject>
          </MemoizedOrbitalPath>
        </React.Fragment>
      );
    });
  }, [systemData.moons, catalogObjects, viewType, SYSTEM_SCALE, ORBITAL_SCALE, PLANET_SCALE, selectedObjectId, getObjectSizing]);

  return (
    <group>
      {/* Render stellar zones first so they appear behind other objects */}
      <StellarZones 
        systemData={systemData}
        viewType={viewType}
        orbitalScale={ORBITAL_SCALE}
        showZones={viewType !== "profile"} // Hide zones in profile mode for clarity
      />
      {renderedStars}
      {renderedPlanets}
      {renderedMoons}
    </group>
  );
}
