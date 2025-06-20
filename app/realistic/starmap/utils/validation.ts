import { Vector3 } from 'three'
import { 
  StarmapSystem, 
  JumpRoute, 
  StarmapData, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  SystemType,
  SecurityLevel,
  SystemStatus
} from '../types'

/**
 * Validation utilities for starmap data integrity
 */
export class StarmapValidator {
  private static readonly VALID_SYSTEM_TYPES: SystemType[] = [
    'main-sequence', 'red-giant', 'white-dwarf', 'neutron-star', 'black-hole', 'red-dwarf'
  ]
  
  private static readonly VALID_SECURITY_LEVELS: SecurityLevel[] = [
    'high', 'medium', 'low', 'lawless'
  ]
  
  private static readonly VALID_SYSTEM_STATUSES: SystemStatus[] = [
    'inhabited', 'explored', 'unexplored', 'restricted', 'hostile'
  ]

  /**
   * Validate a complete starmap data structure
   */
  static validateStarmapData(data: StarmapData): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate systems
    data.systems.forEach((system, systemId) => {
      const systemValidation = this.validateSystem(system)
      errors.push(...systemValidation.errors)
      warnings.push(...systemValidation.warnings)
    })

    // Validate routes
    data.routes.forEach((route, routeId) => {
      const routeValidation = this.validateRoute(route, data.systems)
      errors.push(...routeValidation.errors)
      warnings.push(...routeValidation.warnings)
    })

    // Validate metadata consistency
    const metadataValidation = this.validateMetadata(data)
    errors.push(...metadataValidation.errors)
    warnings.push(...metadataValidation.warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate a single system
   */
  static validateSystem(system: StarmapSystem): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields
    if (!system.id) {
      errors.push({
        type: 'missing_field',
        field: 'id',
        message: 'System ID is required',
        systemId: system.id
      })
    }

    if (!system.name) {
      errors.push({
        type: 'missing_field',
        field: 'name',
        message: 'System name is required',
        systemId: system.id
      })
    }

    // Position validation
    if (!system.position) {
      errors.push({
        type: 'missing_field',
        field: 'position',
        message: 'System position is required',
        systemId: system.id
      })
    } else {
      const positionValidation = this.validatePosition(system.position)
      if (!positionValidation.isValid) {
        errors.push(...positionValidation.errors.map(error => ({
          ...error,
          systemId: system.id
        })))
      }
    }

    // System type validation
    if (!system.systemType) {
      errors.push({
        type: 'missing_field',
        field: 'systemType',
        message: 'System type is required',
        systemId: system.id
      })
    } else if (!this.VALID_SYSTEM_TYPES.includes(system.systemType)) {
      errors.push({
        type: 'invalid_type',
        field: 'systemType',
        message: `Invalid system type: ${system.systemType}`,
        systemId: system.id
      })
    }

    // Security level validation
    if (!system.securityLevel) {
      errors.push({
        type: 'missing_field',
        field: 'securityLevel',
        message: 'Security level is required',
        systemId: system.id
      })
    } else if (!this.VALID_SECURITY_LEVELS.includes(system.securityLevel)) {
      errors.push({
        type: 'invalid_type',
        field: 'securityLevel',
        message: `Invalid security level: ${system.securityLevel}`,
        systemId: system.id
      })
    }

    // Status validation
    if (!system.status) {
      errors.push({
        type: 'missing_field',
        field: 'status',
        message: 'System status is required',
        systemId: system.id
      })
    } else if (!this.VALID_SYSTEM_STATUSES.includes(system.status)) {
      errors.push({
        type: 'invalid_type',
        field: 'status',
        message: `Invalid system status: ${system.status}`,
        systemId: system.id
      })
    }

    // Population validation
    if (typeof system.population !== 'number') {
      errors.push({
        type: 'invalid_type',
        field: 'population',
        message: 'Population must be a number',
        systemId: system.id
      })
    } else if (system.population < 0) {
      errors.push({
        type: 'constraint_violation',
        field: 'population',
        message: 'Population cannot be negative',
        systemId: system.id
      })
    }

    // Jump points validation
    if (!Array.isArray(system.jumpPoints)) {
      errors.push({
        type: 'invalid_type',
        field: 'jumpPoints',
        message: 'Jump points must be an array',
        systemId: system.id
      })
    }

    // Optional field warnings
    if (!system.description) {
      warnings.push({
        type: 'missing_optional',
        field: 'description',
        message: 'System description is recommended for better UX',
        systemId: system.id
      })
    }

    if (!system.economicData && system.status === 'inhabited') {
      warnings.push({
        type: 'missing_optional',
        field: 'economicData',
        message: 'Economic data recommended for inhabited systems',
        systemId: system.id
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate a jump route
   */
  static validateRoute(route: JumpRoute, systems: Map<string, StarmapSystem>): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required fields
    if (!route.id) {
      errors.push({
        type: 'missing_field',
        field: 'id',
        message: 'Route ID is required',
        routeId: route.id
      })
    }

    if (!route.fromSystem) {
      errors.push({
        type: 'missing_field',
        field: 'fromSystem',
        message: 'From system is required',
        routeId: route.id
      })
    } else if (!systems.has(route.fromSystem)) {
      errors.push({
        type: 'invalid_reference',
        field: 'fromSystem',
        message: `Referenced system '${route.fromSystem}' does not exist`,
        routeId: route.id
      })
    }

    if (!route.toSystem) {
      errors.push({
        type: 'missing_field',
        field: 'toSystem',
        message: 'To system is required',
        routeId: route.id
      })
    } else if (!systems.has(route.toSystem)) {
      errors.push({
        type: 'invalid_reference',
        field: 'toSystem',
        message: `Referenced system '${route.toSystem}' does not exist`,
        routeId: route.id
      })
    }

    // Distance validation
    if (typeof route.distance !== 'number') {
      errors.push({
        type: 'invalid_type',
        field: 'distance',
        message: 'Distance must be a number',
        routeId: route.id
      })
    } else if (route.distance <= 0) {
      errors.push({
        type: 'constraint_violation',
        field: 'distance',
        message: 'Distance must be positive',
        routeId: route.id
      })
    }

    // Travel time validation
    if (typeof route.travelTime !== 'number') {
      errors.push({
        type: 'invalid_type',
        field: 'travelTime',
        message: 'Travel time must be a number',
        routeId: route.id
      })
    } else if (route.travelTime <= 0) {
      errors.push({
        type: 'constraint_violation',
        field: 'travelTime',
        message: 'Travel time must be positive',
        routeId: route.id
      })
    }

    // Security level validation
    if (!route.securityLevel) {
      errors.push({
        type: 'missing_field',
        field: 'securityLevel',
        message: 'Security level is required',
        routeId: route.id
      })
    } else if (!this.VALID_SECURITY_LEVELS.includes(route.securityLevel)) {
      errors.push({
        type: 'invalid_type',
        field: 'securityLevel',
        message: `Invalid security level: ${route.securityLevel}`,
        routeId: route.id
      })
    }

    // Hazards validation
    if (!Array.isArray(route.hazards)) {
      errors.push({
        type: 'invalid_type',
        field: 'hazards',
        message: 'Hazards must be an array',
        routeId: route.id
      })
    }

    // Bidirectional validation
    if (typeof route.bidirectional !== 'boolean') {
      errors.push({
        type: 'invalid_type',
        field: 'bidirectional',
        message: 'Bidirectional must be a boolean',
        routeId: route.id
      })
    }

    // Self-reference check
    if (route.fromSystem === route.toSystem) {
      errors.push({
        type: 'constraint_violation',
        field: 'fromSystem,toSystem',
        message: 'Route cannot connect a system to itself',
        routeId: route.id
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate position data (Vector3 or array)
   */
  private static validatePosition(position: Vector3 | [number, number, number]): ValidationResult {
    const errors: ValidationError[] = []

    if (position instanceof Vector3) {
      if (!isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
        errors.push({
          type: 'invalid_type',
          field: 'position',
          message: 'Position coordinates must be finite numbers'
        })
      }
    } else if (Array.isArray(position)) {
      if (position.length !== 3) {
        errors.push({
          type: 'constraint_violation',
          field: 'position',
          message: 'Position array must have exactly 3 elements'
        })
      } else {
        for (let i = 0; i < 3; i++) {
          if (typeof position[i] !== 'number' || !isFinite(position[i])) {
            errors.push({
              type: 'invalid_type',
              field: 'position',
              message: `Position coordinate at index ${i} must be a finite number`
            })
          }
        }
      }
    } else {
      errors.push({
        type: 'invalid_type',
        field: 'position',
        message: 'Position must be a Vector3 or [x, y, z] array'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  /**
   * Validate metadata consistency
   */
  private static validateMetadata(data: StarmapData): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const actualSystemCount = data.systems.size
    const actualRouteCount = data.routes.size

    if (data.metadata.totalSystems !== actualSystemCount) {
      warnings.push({
        type: 'data_inconsistency',
        field: 'metadata.totalSystems',
        message: `Metadata reports ${data.metadata.totalSystems} systems but found ${actualSystemCount}`
      })
    }

    if (data.metadata.totalRoutes !== actualRouteCount) {
      warnings.push({
        type: 'data_inconsistency',
        field: 'metadata.totalRoutes',
        message: `Metadata reports ${data.metadata.totalRoutes} routes but found ${actualRouteCount}`
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Quick validation for performance-critical scenarios
   */
  static quickValidate(system: StarmapSystem): boolean {
    return !!(
      system.id &&
      system.name &&
      system.position &&
      system.systemType &&
      system.securityLevel &&
      system.status &&
      typeof system.population === 'number' &&
      Array.isArray(system.jumpPoints)
    )
  }
} 