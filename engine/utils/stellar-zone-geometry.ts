import * as THREE from 'three'
import type { StellarZoneType, ZoneCalculationResult } from '@/engine/types/stellar-zones'

/**
 * Geometry cache for reusing zone geometries
 */
const geometryCache = new Map<string, THREE.BufferGeometry>()

/**
 * Generate a cache key for geometry memoization
 */
function generateGeometryKey(
  type: StellarZoneType,
  innerRadius: number,
  outerRadius?: number,
  segments = 64
): string {
  return `${type}-${innerRadius.toFixed(3)}-${outerRadius?.toFixed(3) || 'none'}-${segments}`
}

/**
 * Create a ring geometry for zones like habitable zones
 * Uses shape geometry with holes for better performance than ring geometry
 */
export function createZoneRingGeometry(
  innerRadius: number,
  outerRadius: number,
  segments = 64
): THREE.ShapeGeometry {
  const cacheKey = generateGeometryKey('habitable', innerRadius, outerRadius, segments)
  
  // Check cache first
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey) as THREE.ShapeGeometry
  }

  // Create new geometry
  const shape = new THREE.Shape()
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
  
  const hole = new THREE.Path()
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  
  const geometry = new THREE.ShapeGeometry(shape, segments)
  geometry.rotateX(-Math.PI / 2) // Make it horizontal (XZ plane)
  
  // Cache the geometry
  geometryCache.set(cacheKey, geometry)
  
  return geometry
}

/**
 * Create a line geometry for zones like frost lines
 * Uses thin ring geometry for better visibility
 */
export function createZoneLineGeometry(
  radius: number,
  lineWidth = 0.01,
  segments = 64
): THREE.RingGeometry {
  const cacheKey = generateGeometryKey('frost', radius, lineWidth, segments)
  
  // Check cache first
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey) as THREE.RingGeometry
  }

  // Create new geometry
  const geometry = new THREE.RingGeometry(
    radius - lineWidth,
    radius + lineWidth,
    segments
  )
  geometry.rotateX(-Math.PI / 2) // Make it horizontal (XZ plane)
  
  // Cache the geometry
  geometryCache.set(cacheKey, geometry)
  
  return geometry
}

/**
 * Create geometry for a zone based on its calculation result
 */
export function createZoneGeometry(
  zoneData: ZoneCalculationResult,
  segments = 64
): THREE.BufferGeometry {
  switch (zoneData.type) {
    case 'habitable':
    case 'sublimation':
      if (zoneData.outerRadius === undefined) {
        throw new Error(`Zone type ${zoneData.type} requires outerRadius`)
      }
      return createZoneRingGeometry(zoneData.innerRadius, zoneData.outerRadius, segments)
    
    case 'frost':
      return createZoneLineGeometry(zoneData.innerRadius, 0.01, segments)
    
    case 'custom':
      // For custom zones, default to ring if outerRadius provided, otherwise line
      if (zoneData.outerRadius !== undefined) {
        return createZoneRingGeometry(zoneData.innerRadius, zoneData.outerRadius, segments)
      } else {
        return createZoneLineGeometry(zoneData.innerRadius, 0.01, segments)
      }
    
    default:
      throw new Error(`Unknown zone type: ${zoneData.type}`)
  }
}

/**
 * Create material for a zone based on its type and configuration
 */
export function createZoneMaterial(
  zoneType: StellarZoneType,
  color: number | string,
  opacity: number,
  wireframe = false
): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    wireframe: wireframe
  })

  // Add zone type as metadata for debugging
  material.userData = { zoneType }
  
  return material
}

/**
 * Batch create geometries for multiple zones
 * Useful for systems with multiple zone types
 */
export function createZoneGeometries(
  zones: ZoneCalculationResult[],
  segments = 64
): Map<string, THREE.BufferGeometry> {
  const geometries = new Map<string, THREE.BufferGeometry>()
  
  for (const zone of zones) {
    try {
      const geometry = createZoneGeometry(zone, segments)
      geometries.set(`${zone.type}-${zone.innerRadius}`, geometry)
    } catch (error) {
      console.warn(`Failed to create geometry for zone ${zone.type}:`, error)
    }
  }
  
  return geometries
}

/**
 * Clear the geometry cache
 * Useful for memory management in long-running applications
 */
export function clearGeometryCache(): void {
  geometryCache.forEach(geometry => geometry.dispose())
  geometryCache.clear()
}

/**
 * Get cache statistics for debugging
 */
export function getGeometryCacheStats(): {
  size: number
  keys: string[]
} {
  return {
    size: geometryCache.size,
    keys: Array.from(geometryCache.keys())
  }
}

/**
 * Dispose of a specific geometry from cache
 */
export function disposeGeometry(
  type: StellarZoneType,
  innerRadius: number,
  outerRadius?: number,
  segments = 64
): boolean {
  const key = generateGeometryKey(type, innerRadius, outerRadius, segments)
  const geometry = geometryCache.get(key)
  
  if (geometry) {
    geometry.dispose()
    geometryCache.delete(key)
    return true
  }
  
  return false
}

/**
 * Validate zone calculation result for geometry creation
 */
export function validateZoneData(zone: ZoneCalculationResult): boolean {
  if (!zone.type || !['habitable', 'frost', 'sublimation', 'custom'].includes(zone.type)) {
    console.warn(`Invalid zone type: ${zone.type}`)
    return false
  }
  
  if (typeof zone.innerRadius !== 'number' || zone.innerRadius < 0) {
    console.warn(`Invalid innerRadius: ${zone.innerRadius}`)
    return false
  }
  
  if (zone.outerRadius !== undefined && (typeof zone.outerRadius !== 'number' || zone.outerRadius <= zone.innerRadius)) {
    console.warn(`Invalid outerRadius: ${zone.outerRadius}`)
    return false
  }
  
  return true
}

/**
 * Calculate level of detail (LOD) segments based on zone size and camera distance
 * Useful for performance optimization in large systems
 */
export function calculateLODSegments(
  zoneRadius: number,
  cameraDistance: number,
  baseSegments = 64
): number {
  const sizeFactor = Math.max(0.25, Math.min(2, zoneRadius / 10))
  const distanceFactor = Math.max(0.25, Math.min(2, 100 / cameraDistance))
  
  const lodSegments = Math.round(baseSegments * sizeFactor * distanceFactor)
  
  // Clamp to reasonable range
  return Math.max(8, Math.min(128, lodSegments))
} 