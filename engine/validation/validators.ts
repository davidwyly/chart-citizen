import { ValidationError, DataParsingError, UserInputError } from '../types/errors';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationRule<T> {
  name: string;
  validate: (value: T) => ValidationResult;
  required?: boolean;
}

export class Validator {
  static validateSystemId(systemId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!systemId || typeof systemId !== 'string') {
      errors.push('System ID must be a non-empty string');
      return { isValid: false, errors, warnings };
    }

    if (systemId.trim() !== systemId) {
      warnings.push('System ID has leading or trailing whitespace');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(systemId)) {
      errors.push('System ID contains invalid characters (only alphanumeric, hyphens, and underscores allowed)');
    }

    if (systemId.length > 50) {
      errors.push('System ID is too long (max 50 characters)');
    }

    if (systemId.length < 2) {
      errors.push('System ID is too short (min 2 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateSystemData(data: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('System data must be an object');
      return { isValid: false, errors, warnings };
    }

    const systemData = data as any;

    // Required fields validation
    if (!systemData.id || typeof systemData.id !== 'string') {
      errors.push('System data must have a valid ID');
    } else {
      const idValidation = this.validateSystemId(systemData.id);
      if (!idValidation.isValid) {
        errors.push(...idValidation.errors.map(e => `System ID: ${e}`));
      }
      if (idValidation.warnings) {
        warnings.push(...idValidation.warnings.map(w => `System ID: ${w}`));
      }
    }

    if (!systemData.name || typeof systemData.name !== 'string') {
      errors.push('System data must have a valid name');
    } else if (systemData.name.length > 100) {
      errors.push('System name is too long (max 100 characters)');
    }

    if (!Array.isArray(systemData.objects)) {
      errors.push('System data must have an objects array');
    } else {
      // Validate each object in the system
      systemData.objects.forEach((obj: any, index: number) => {
        const objValidation = this.validateSystemObject(obj);
        if (!objValidation.isValid) {
          errors.push(...objValidation.errors.map(e => `Object ${index}: ${e}`));
        }
        if (objValidation.warnings) {
          warnings.push(...objValidation.warnings.map(w => `Object ${index}: ${w}`));
        }
      });
    }

    // Optional fields validation
    if (systemData.description && typeof systemData.description !== 'string') {
      warnings.push('System description should be a string');
    }

    if (systemData.version && typeof systemData.version !== 'string') {
      warnings.push('System version should be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateSystemObject(obj: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!obj || typeof obj !== 'object') {
      errors.push('System object must be an object');
      return { isValid: false, errors, warnings };
    }

    const systemObj = obj as any;

    // Required fields
    if (!systemObj.id || typeof systemObj.id !== 'string') {
      errors.push('Object must have a valid ID');
    }

    if (!systemObj.name || typeof systemObj.name !== 'string') {
      errors.push('Object must have a valid name');
    }

    if (!systemObj.type || typeof systemObj.type !== 'string') {
      errors.push('Object must have a valid type');
    } else {
      const validTypes = ['star', 'planet', 'moon', 'asteroid', 'comet', 'black-hole', 'neutron-star'];
      if (!validTypes.includes(systemObj.type)) {
        warnings.push(`Unknown object type: ${systemObj.type}`);
      }
    }

    // Numerical validations
    if (systemObj.mass !== undefined) {
      if (typeof systemObj.mass !== 'number' || systemObj.mass < 0) {
        errors.push('Object mass must be a non-negative number');
      }
    }

    if (systemObj.radius !== undefined) {
      if (typeof systemObj.radius !== 'number' || systemObj.radius <= 0) {
        errors.push('Object radius must be a positive number');
      }
    }

    // Orbital parameters validation
    if (systemObj.orbit) {
      const orbitValidation = this.validateOrbitData(systemObj.orbit);
      if (!orbitValidation.isValid) {
        errors.push(...orbitValidation.errors.map(e => `Orbit: ${e}`));
      }
      if (orbitValidation.warnings) {
        warnings.push(...orbitValidation.warnings.map(w => `Orbit: ${w}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateOrbitData(orbit: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!orbit || typeof orbit !== 'object') {
      errors.push('Orbit data must be an object');
      return { isValid: false, errors, warnings };
    }

    const orbitData = orbit as any;

    if (typeof orbitData.semiMajorAxis !== 'number' || orbitData.semiMajorAxis <= 0) {
      errors.push('Semi-major axis must be a positive number');
    }

    if (orbitData.eccentricity !== undefined) {
      if (typeof orbitData.eccentricity !== 'number' || orbitData.eccentricity < 0 || orbitData.eccentricity >= 1) {
        errors.push('Eccentricity must be a number between 0 and 1 (exclusive)');
      }
    }

    if (orbitData.inclination !== undefined) {
      if (typeof orbitData.inclination !== 'number') {
        errors.push('Inclination must be a number');
      } else if (Math.abs(orbitData.inclination) > 180) {
        warnings.push('Inclination is outside typical range (-180 to 180 degrees)');
      }
    }

    if (orbitData.period !== undefined) {
      if (typeof orbitData.period !== 'number' || orbitData.period <= 0) {
        errors.push('Orbital period must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateViewMode(viewMode: string): ValidationResult {
    const errors: string[] = [];
    const validModes = ['star-citizen', 'profile'];

    if (!viewMode || typeof viewMode !== 'string') {
      errors.push('View mode must be a non-empty string');
    } else if (!validModes.includes(viewMode)) {
      errors.push(`Invalid view mode: ${viewMode}. Valid modes are: ${validModes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateNumericRange(
    value: unknown, 
    min: number, 
    max: number, 
    fieldName: string
  ): ValidationResult {
    const errors: string[] = [];

    if (typeof value !== 'number') {
      errors.push(`${fieldName} must be a number`);
    } else if (isNaN(value) || !isFinite(value)) {
      errors.push(`${fieldName} must be a valid finite number`);
    } else if (value < min || value > max) {
      errors.push(`${fieldName} must be between ${min} and ${max}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];

    if (!url || typeof url !== 'string') {
      errors.push('URL must be a non-empty string');
      return { isValid: false, errors };
    }

    try {
      new URL(url);
    } catch {
      errors.push('URL is not valid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || typeof email !== 'string') {
      errors.push('Email must be a non-empty string');
    } else if (!emailRegex.test(email)) {
      errors.push('Email format is invalid');
    } else if (email.length > 254) {
      errors.push('Email is too long (max 254 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generic validator that applies multiple rules
  static validateWithRules<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      const result = rule.validate(value);
      if (!result.isValid) {
        errors.push(...result.errors.map(e => `${rule.name}: ${e}`));
      }
      if (result.warnings) {
        warnings.push(...result.warnings.map(w => `${rule.name}: ${w}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Utility functions for throwing validation errors
export function assertValidSystemId(systemId: string): void {
  const result = Validator.validateSystemId(systemId);
  if (!result.isValid) {
    throw new UserInputError(`Invalid system ID: ${result.errors.join(', ')}`, { systemId });
  }
}

export function assertValidSystemData(data: unknown): void {
  const result = Validator.validateSystemData(data);
  if (!result.isValid) {
    throw new DataParsingError(`Invalid system data: ${result.errors.join(', ')}`, { data });
  }
}

export function assertValidViewMode(viewMode: string): void {
  const result = Validator.validateViewMode(viewMode);
  if (!result.isValid) {
    throw new UserInputError(`Invalid view mode: ${result.errors.join(', ')}`, { viewMode });
  }
}

// Sanitization utilities
export class Sanitizer {
  static sanitizeSystemId(systemId: string): string {
    if (typeof systemId !== 'string') return '';
    
    return systemId
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .substring(0, 50);
  }

  static sanitizeString(str: string, maxLength = 1000): string {
    if (typeof str !== 'string') return '';
    
    return str
      .trim()
      .substring(0, maxLength)
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }

  static sanitizeNumber(value: unknown, defaultValue = 0): number {
    if (typeof value === 'number' && isFinite(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isFinite(parsed)) {
        return parsed;
      }
    }
    
    return defaultValue;
  }

  static sanitizeBoolean(value: unknown, defaultValue = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    return defaultValue;
  }
} 