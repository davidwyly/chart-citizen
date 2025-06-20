import { Vector3 } from 'three'

/**
 * Hexagonal coordinate system using axial coordinates
 * Based on Red Blob Games implementation
 * q + r + s = 0 (s is derived)
 */
export interface HexCoordinate {
  q: number  // axial coordinate (column)
  r: number  // axial coordinate (row)
  s: number  // derived coordinate (q + r + s = 0)
}

/**
 * Security levels for systems and routes
 */
export type SecurityLevel = 'high' | 'medium' | 'low' | 'lawless'

/**
 * System types based on stellar classification
 */
export type SystemType = 'main-sequence' | 'red-giant' | 'white-dwarf' | 'neutron-star' | 'black-hole' | 'red-dwarf'

/**
 * System status for exploration/colonization
 */
export type SystemStatus = 'inhabited' | 'explored' | 'unexplored' | 'restricted' | 'hostile'

/**
 * Environmental hazards that can affect routes or systems
 */
export interface EnvironmentalHazard {
  id: string
  type: 'radiation' | 'asteroid-field' | 'solar-flare' | 'gravitational-anomaly' | 'pirate-activity'
  severity: 'low' | 'medium' | 'high' | 'extreme'
  description: string
  affectedRoutes?: string[]
}

/**
 * Economic data for trade route planning
 */
export interface EconomicData {
  tradeValue: number
  resources: string[]
  importNeeds: string[]
  exportGoods: string[]
  economicZone?: string
}

/**
 * Enhanced starmap system definition
 */
export interface StarmapSystem {
  id: string
  name: string
  description?: string
  position: Vector3 | [number, number, number]  // 3D galactic coordinates
  hexPosition?: HexCoordinate  // For arranged view mode
  systemType: SystemType
  securityLevel: SecurityLevel
  status: SystemStatus
  population: number
  jumpPoints: string[]  // IDs of connected systems
  economicData?: EconomicData
  environmentalHazards?: EnvironmentalHazard[]
  
  // Legacy compatibility
  metadata?: {
    stellarClass?: string
    habitableZone?: boolean
    knownPlanets?: number
  }
}

/**
 * Jump route connection between systems
 */
export interface JumpRoute {
  id: string
  fromSystem: string
  toSystem: string
  distance: number  // in light years
  travelTime: number  // in standard time units
  securityLevel: SecurityLevel
  hazards: EnvironmentalHazard[]
  bidirectional: boolean
  
  // Route characteristics
  routeType?: 'hyperspace' | 'wormhole' | 'jump-gate' | 'standard'
  fuelCost?: number
  tollCost?: number
}

/**
 * Complete starmap data structure
 */
export interface StarmapData {
  systems: Map<string, StarmapSystem>
  routes: Map<string, JumpRoute>
  metadata: StarmapMetadata
}

/**
 * Metadata for starmap data
 */
export interface StarmapMetadata {
  version: string
  lastUpdated: string
  totalSystems: number
  totalRoutes: number
  coordinateSystem: 'galactic' | 'local' | 'relative'
  distanceUnit: 'light_years' | 'parsecs' | 'astronomical_units'
  bounds?: {
    min: Vector3 | [number, number, number]
    max: Vector3 | [number, number, number]
  }
}

/**
 * Validation result for data integrity checks
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

/**
 * Validation error details
 */
export interface ValidationError {
  type: 'missing_field' | 'invalid_type' | 'invalid_reference' | 'constraint_violation'
  field: string
  message: string
  systemId?: string
  routeId?: string
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  type: 'deprecated_field' | 'missing_optional' | 'performance_concern' | 'data_inconsistency'
  field: string
  message: string
  systemId?: string
  routeId?: string
}

/**
 * Legacy system format for migration
 */
export interface LegacySystemData {
  id: string
  name: string
  description?: string
  position: [number, number, number]
  status: string
  [key: string]: any  // Allow additional legacy fields
}

/**
 * Legacy starmap format for migration
 */
export interface LegacyStarmapData {
  systems: Record<string, LegacySystemData>
  metadata: {
    version: string
    last_updated: string
    total_systems: number
    coordinate_system: string
    distance_unit: string
  }
} 