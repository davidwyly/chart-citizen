import { Vector3 } from 'three'
import { 
  StarmapData, 
  StarmapSystem, 
  JumpRoute, 
  StarmapMetadata,
  LegacyStarmapData,
  LegacySystemData,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SystemType,
  SecurityLevel,
  SystemStatus
} from '../types'
import { StarmapValidator } from '../utils/validation'

/**
 * Service for loading and transforming starmap data
 */
export class StarmapDataLoader {
  private static readonly DEFAULT_SYSTEM_TYPE: SystemType = 'main-sequence'
  private static readonly DEFAULT_SECURITY_LEVEL: SecurityLevel = 'medium'
  private static readonly DEFAULT_POPULATION = 0

  /**
   * Load starmap data for a specific mode
   */
  async loadSystemData(mode: string): Promise<StarmapData> {
    try {
      const response = await fetch(`/data/${mode}/starmap-systems.json`)
      if (!response.ok) {
        throw new Error(`Failed to load starmap data: ${response.statusText}`)
      }
      
      const rawData = await response.json()
      return this.transformLegacyData(rawData)
    } catch (error) {
      console.error('Error loading starmap data:', error)
      throw new Error(`Failed to load starmap data for mode '${mode}': ${error}`)
    }
  }

  /**
   * Validate system data structure
   */
  validateSystemData(data: any): ValidationResult {
    // First check if it's in the expected format
    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: [{
          type: 'invalid_type',
          field: 'root',
          message: 'Data must be an object'
        }],
        warnings: []
      }
    }

    // Check if it's legacy format
    if (data.systems && typeof data.systems === 'object' && !data.systems.has) {
      // Legacy format - validate structure
      return this.validateLegacyData(data)
    }

    // Modern format - validate with full validator
    if (data.systems instanceof Map && data.routes instanceof Map && data.metadata) {
      return StarmapValidator.validateStarmapData(data as StarmapData)
    }

    return {
      isValid: false,
      errors: [{
        type: 'invalid_type',
        field: 'root',
        message: 'Data is not in recognized format (legacy or modern)'
      }],
      warnings: []
    }
  }

  /**
   * Transform legacy data format to modern format
   */
  transformLegacyData(legacyData: LegacyStarmapData): StarmapData {
    const systems = new Map<string, StarmapSystem>()
    const routes = new Map<string, JumpRoute>()

    // Transform systems
    Object.entries(legacyData.systems).forEach(([systemId, legacySystem]) => {
      const system = this.transformLegacySystem(legacySystem)
      systems.set(systemId, system)
    })

    // Generate jump routes based on proximity (for now)
    // In a real implementation, this would come from data or be calculated based on game rules
    const generatedRoutes = this.generateBasicRoutes(systems)
    generatedRoutes.forEach(route => {
      routes.set(route.id, route)
    })

    // Transform metadata
    const metadata: StarmapMetadata = {
      version: legacyData.metadata.version || '1.0',
      lastUpdated: legacyData.metadata.last_updated || new Date().toISOString(),
      totalSystems: systems.size,
      totalRoutes: routes.size,
      coordinateSystem: this.normalizeCoordinateSystem(legacyData.metadata.coordinate_system),
      distanceUnit: this.normalizeDistanceUnit(legacyData.metadata.distance_unit)
    }

    return {
      systems,
      routes,
      metadata
    }
  }

  /**
   * Transform a legacy system to modern format
   */
  private transformLegacySystem(legacySystem: LegacySystemData): StarmapSystem {
    // Convert position array to Vector3
    const position = Array.isArray(legacySystem.position) 
      ? new Vector3(...legacySystem.position)
      : new Vector3(0, 0, 0)

    // Infer system type from name or use default
    const systemType = this.inferSystemType(legacySystem.name, legacySystem.description)
    
    // Infer security level from status
    const securityLevel = this.inferSecurityLevel(legacySystem.status)
    
    // Normalize status
    const status = this.normalizeSystemStatus(legacySystem.status)
    
    // Infer population from status
    const population = this.inferPopulation(legacySystem.status)

    return {
      id: legacySystem.id,
      name: legacySystem.name,
      description: legacySystem.description,
      position,
      systemType,
      securityLevel,
      status,
      population,
      jumpPoints: [], // Will be populated when routes are generated
      metadata: {
        stellarClass: this.inferStellarClass(legacySystem.name),
        habitableZone: this.inferHabitableZone(legacySystem.description),
        knownPlanets: this.inferPlanetCount(legacySystem.description)
      }
    }
  }

  /**
   * Generate basic jump routes between systems based on proximity
   */
  private generateBasicRoutes(systems: Map<string, StarmapSystem>): JumpRoute[] {
    const routes: JumpRoute[] = []
    const systemArray = Array.from(systems.values())
    const maxJumpDistance = 50 // light years - configurable

    systemArray.forEach((fromSystem, i) => {
      systemArray.slice(i + 1).forEach(toSystem => {
        const distance = this.calculateDistance(fromSystem.position, toSystem.position)
        
        if (distance <= maxJumpDistance) {
          const route: JumpRoute = {
            id: `${fromSystem.id}-${toSystem.id}`,
            fromSystem: fromSystem.id,
            toSystem: toSystem.id,
            distance,
            travelTime: this.calculateTravelTime(distance),
            securityLevel: this.calculateRouteSecurityLevel(fromSystem, toSystem),
            hazards: [], // Could be populated based on route characteristics
            bidirectional: true,
            routeType: 'standard'
          }
          
          routes.push(route)
          
          // Update jump points in systems
          fromSystem.jumpPoints.push(toSystem.id)
          toSystem.jumpPoints.push(fromSystem.id)
        }
      })
    })

    return routes
  }

  /**
   * Calculate distance between two positions
   */
  private calculateDistance(pos1: Vector3 | [number, number, number], pos2: Vector3 | [number, number, number]): number {
    const p1 = pos1 instanceof Vector3 ? pos1 : new Vector3(...pos1)
    const p2 = pos2 instanceof Vector3 ? pos2 : new Vector3(...pos2)
    return p1.distanceTo(p2)
  }

  /**
   * Calculate travel time based on distance
   */
  private calculateTravelTime(distance: number): number {
    // Simple formula: assume 1 light year = 1 time unit
    // In a real implementation, this would be more sophisticated
    return Math.max(1, Math.round(distance))
  }

  /**
   * Calculate route security level based on connected systems
   */
  private calculateRouteSecurityLevel(system1: StarmapSystem, system2: StarmapSystem): SecurityLevel {
    const securityLevels: SecurityLevel[] = ['lawless', 'low', 'medium', 'high']
    const level1 = securityLevels.indexOf(system1.securityLevel)
    const level2 = securityLevels.indexOf(system2.securityLevel)
    
    // Route security is the minimum of the two systems
    const minLevel = Math.min(level1, level2)
    return securityLevels[minLevel]
  }

  /**
   * Infer system type from name and description
   */
  private inferSystemType(name: string, description?: string): SystemType {
    const lowerName = name.toLowerCase()
    const lowerDesc = (description || '').toLowerCase()
    
    if (lowerName.includes('wolf') || lowerDesc.includes('red dwarf')) {
      return 'red-dwarf'
    }
    if (lowerDesc.includes('white dwarf')) {
      return 'white-dwarf'
    }
    if (lowerDesc.includes('neutron')) {
      return 'neutron-star'
    }
    if (lowerDesc.includes('black hole')) {
      return 'black-hole'
    }
    if (lowerDesc.includes('giant')) {
      return 'red-giant'
    }
    
    return StarmapDataLoader.DEFAULT_SYSTEM_TYPE
  }

  /**
   * Infer security level from system status
   */
  private inferSecurityLevel(status: string): SecurityLevel {
    switch (status?.toLowerCase()) {
      case 'inhabited':
        return 'high'
      case 'explored':
        return 'medium'
      case 'restricted':
        return 'high'
      case 'hostile':
        return 'lawless'
      default:
        return StarmapDataLoader.DEFAULT_SECURITY_LEVEL
    }
  }

  /**
   * Normalize system status to valid enum value
   */
  private normalizeSystemStatus(status: string): SystemStatus {
    switch (status?.toLowerCase()) {
      case 'inhabited':
        return 'inhabited'
      case 'explored':
        return 'explored'
      case 'restricted':
        return 'restricted'
      case 'hostile':
        return 'hostile'
      default:
        return 'unexplored'
    }
  }

  /**
   * Infer population from system status
   */
  private inferPopulation(status: string): number {
    switch (status?.toLowerCase()) {
      case 'inhabited':
        return Math.floor(Math.random() * 10000000) + 1000000 // 1M - 11M
      case 'explored':
        return Math.floor(Math.random() * 1000) // 0 - 1000 (research stations)
      default:
        return StarmapDataLoader.DEFAULT_POPULATION
    }
  }

  /**
   * Normalize coordinate system name
   */
  private normalizeCoordinateSystem(coordSystem: string): 'galactic' | 'local' | 'relative' {
    switch (coordSystem?.toLowerCase()) {
      case 'galactic':
        return 'galactic'
      case 'local':
        return 'local'
      case 'relative':
        return 'relative'
      default:
        return 'galactic'
    }
  }

  /**
   * Normalize distance unit
   */
  private normalizeDistanceUnit(distanceUnit: string): 'light_years' | 'parsecs' | 'astronomical_units' {
    switch (distanceUnit?.toLowerCase()) {
      case 'light_years':
      case 'ly':
        return 'light_years'
      case 'parsecs':
      case 'pc':
        return 'parsecs'
      case 'astronomical_units':
      case 'au':
        return 'astronomical_units'
      default:
        return 'light_years'
    }
  }

  /**
   * Infer stellar class from system name
   */
  private inferStellarClass(name: string): string {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('sol')) return 'G2V'
    if (lowerName.includes('alpha')) return 'G2V'
    if (lowerName.includes('proxima')) return 'M5.5Ve'
    if (lowerName.includes('wolf')) return 'M6V'
    if (lowerName.includes('kepler')) return 'K5V'
    return 'G2V' // Default to Sun-like
  }

  /**
   * Infer if system has habitable zone from description
   */
  private inferHabitableZone(description?: string): boolean {
    if (!description) return false
    const lowerDesc = description.toLowerCase()
    return lowerDesc.includes('habitable') || lowerDesc.includes('earth') || lowerDesc.includes('life')
  }

  /**
   * Infer number of known planets from description
   */
  private inferPlanetCount(description?: string): number {
    if (!description) return 0
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('planet')) return 1
    if (lowerDesc.includes('system')) return Math.floor(Math.random() * 8) + 1
    return 0
  }

  /**
   * Validate legacy data structure
   */
  private validateLegacyData(data: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!data.systems || typeof data.systems !== 'object') {
      errors.push({
        type: 'missing_field' as const,
        field: 'systems',
        message: 'Systems object is required'
      })
    }

    if (!data.metadata || typeof data.metadata !== 'object') {
      errors.push({
        type: 'missing_field' as const,
        field: 'metadata',
        message: 'Metadata object is required'
      })
    }

    // Validate individual systems
    if (data.systems) {
      Object.entries(data.systems).forEach(([systemId, system]: [string, any]) => {
        if (!system.id) {
          errors.push({
            type: 'missing_field' as const,
            field: 'id',
            message: 'System ID is required',
            systemId
          })
        }
        if (!system.name) {
          errors.push({
            type: 'missing_field' as const,
            field: 'name',
            message: 'System name is required',
            systemId
          })
        }
        if (!system.position || !Array.isArray(system.position) || system.position.length !== 3) {
          errors.push({
            type: 'invalid_type' as const,
            field: 'position',
            message: 'Position must be an array of 3 numbers',
            systemId
          })
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
} 