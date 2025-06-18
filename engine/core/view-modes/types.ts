/**
 * Core Types for Extensible View Mode System
 * ==========================================
 * 
 * This file defines the foundational types for the new extensible view mode architecture.
 * View modes are now defined as complete configuration objects with behavior functions,
 * allowing for dynamic registration and true extensibility.
 */

import type { CelestialObject } from '@/engine/types/orbital-system'
import * as THREE from 'three'

// ============================================================================
// CORE CONFIGURATION INTERFACES
// ============================================================================

export interface ViewModeScaling {
  maxVisualSize: number
  minVisualSize: number
  orbitScaling: number
  safetyMultiplier: number
  minDistance: number
  fixedSizes?: {
    star: number
    planet: number
    moon: number
    asteroid: number
    belt: number
    barycenter: number
  }
}

export interface CameraConfig {
  radiusMultiplier: number
  minDistanceMultiplier: number
  maxDistanceMultiplier: number
  absoluteMinDistance: number
  absoluteMaxDistance: number
  nearPlane?: number  // Optional mode-specific near clipping
  farPlane?: number   // Optional mode-specific far clipping
  viewingAngles: {
    defaultElevation: number
    birdsEyeElevation: number
  }
  animation: {
    focusDuration: number
    birdsEyeDuration: number
    easingFunction: 'linear' | 'easeOut' | 'easeInOut' | 'leap'
  }
}

export interface OrbitalConfig {
  factor: number
  minDistance: number
  maxDistance: number
}

export interface ObjectScaling {
  star: number
  planet: number
  moon: number
  gasGiant: number
  asteroid: number
  default: number
}

export interface FeatureSet {
  orbitalPaths: boolean
  stellarZones: boolean
  scientificLabels: boolean
  atmosphericEffects: boolean
  particleEffects: boolean
  coronaEffects: boolean
  educationalContent: boolean
  debugInfo: boolean
}

export interface UIConfig {
  showDistances: boolean
  showMasses: boolean
  showOrbitalPeriods: boolean
  labelStyle: 'minimal' | 'detailed' | 'scientific'
  colorScheme: 'default' | 'scientific' | 'educational'
}

// ============================================================================
// CONTEXT INTERFACES
// ============================================================================

export interface CalculationContext {
  isPaused: boolean
  mode: ViewModeDefinition
  allObjects: CelestialObject[]
  systemScale: number
  sizeAnalysis: {
    logMinRadius: number
    logRange: number
  }
}

export interface RenderContext {
  viewMode: string
  camera: THREE.Camera
  scene: THREE.Scene
  isInteractive: boolean
  performanceLevel: 'low' | 'medium' | 'high'
}

export interface ObjectState {
  isSelected: boolean
  isHovered: boolean
  isFocused: boolean
  distance: number
  visibilityLevel: number
}

export interface StyleConfig {
  opacity: number
  wireframe?: boolean
  color?: THREE.Color
  emissive?: THREE.Color
  metalness?: number
  roughness?: number
}

// ============================================================================
// CORE VIEW MODE DEFINITION
// ============================================================================

export interface ViewModeDefinition {
  // Basic metadata
  id: string
  name: string
  description: string
  icon?: string
  category: 'scientific' | 'educational' | 'gaming' | 'navigation' | 'custom'
  
  // Configuration objects
  scaling: ViewModeScaling
  camera: CameraConfig
  orbital: OrbitalConfig
  objectScaling: ObjectScaling
  features: FeatureSet
  ui: UIConfig
  
  // Behavior functions (optional - will use defaults if not provided)
  calculateVisualRadius?: (object: CelestialObject, context: CalculationContext) => number
  shouldShowFeature?: (feature: keyof FeatureSet, context: RenderContext) => boolean
  getObjectStyle?: (object: CelestialObject, state: ObjectState) => StyleConfig
  getOrbitStyle?: (object: CelestialObject, context: RenderContext) => StyleConfig
  
  // Custom properties (for extensibility)
  custom?: Record<string, unknown>
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ViewModeId = string
export type ViewModeCategory = ViewModeDefinition['category']

// Legacy compatibility - these will be deprecated once migration is complete
export type ViewType = string
export type ViewMode = string

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

export interface ViewModeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ViewModeRegistrationOptions {
  replace?: boolean  // Allow replacing existing mode with same ID
  validate?: boolean // Validate mode definition before registration
}