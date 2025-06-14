// Orbital System JSON Specification TypeScript Interfaces
// Based on docs/architecture/orbital-system-json-spec.md

export type Classification = 
  | 'star' 
  | 'compact-object' 
  | 'planet' 
  | 'dwarf-planet' 
  | 'moon' 
  | 'belt' 
  | 'ring' 
  | 'barycenter'

export type GeometryType = 
  | 'terrestrial' 
  | 'rocky' 
  | 'gas_giant' 
  | 'star' 
  | 'compact' 
  | 'ring' 
  | 'belt' 
  | 'none'

export type RingDensity = 'sparse' | 'moderate' | 'dense'
export type ParticleSize = 'small' | 'medium' | 'large'

// Base orbit structure for planets, moons, stars
export interface OrbitData {
  parent: string
  semi_major_axis: number
  eccentricity: number
  inclination: number
  orbital_period: number
}

// Belt orbit structure
export interface BeltOrbitData {
  parent: string
  inner_radius: number
  outer_radius: number
  inclination: number
  eccentricity: number
}

// Unified properties interface
export interface CelestialProperties {
  // Shared Physical Properties
  mass: number // in Earth or solar units
  radius: number // in Earth or solar radii
  temperature: number // surface temperature (K)
  rotation_period?: number // in hours
  axial_tilt?: number // degrees
  axial_wobble?: number // degrees (optional, for visuals)
  geomagnetism?: number // 0–100 (affects auroras/magnetic fields)

  // Terrestrial Planet Properties
  water?: number // 0–100 (ocean/ice coverage)
  tectonics?: number // 0–100 (terrain roughness)
  flora?: number // 0–100 (vegetation tint)
  population?: number // 0–100 (city lights/urban sprawl)
  atmosphere?: number // 0–100 (visual shell thickness)

  // Rocky Body Properties
  albedo?: number // 0–100 (surface reflectivity)
  surface_variance?: number // 0–100 (bumpiness)
  crater_density?: number // 0–100
  regolith_depth?: number // 0–100
  surface_color?: string // hex (e.g. "#aaaaaa")

  // Gas Giant Properties
  band_contrast?: number // 0–100
  cloud_opacity?: number // 0–100
  hue_shift?: number // 0–100 (color offset)

  // Star Properties
  color_temperature?: number // 2000–40000 (Kelvin)
  luminosity?: number // 0–100
  solar_activity?: number // 0–100
  corona_thickness?: number // 0–100
  variability?: number // 0–100

  // Ring Properties
  ring_density?: RingDensity
  ring_opacity?: number // 0–100
  ring_composition?: string[] // ["ice", "rock", etc.]
  ring_color?: string // hex color
  ring_gap?: number // 0–100

  // Belt Properties
  belt_density?: RingDensity
  particle_size?: ParticleSize
  belt_composition?: string[] // ["rock", "ice", "metal"]
  brightness?: number // 0–100
  tint?: string // hex color

  // Extended properties for customization
  [key: string]: any
}

// Ring definition for planets
export interface RingDefinition {
  id: string
  geometry_type: 'ring'
  name: string
  radius_start: number
  radius_end: number
  inclination: number
  density: RingDensity
  composition: string[]
  color?: string
  opacity?: number
}

// Main celestial object interface
export interface CelestialObject {
  id: string
  name: string
  classification: Classification
  geometry_type: GeometryType
  orbit?: OrbitData | BeltOrbitData
  properties: CelestialProperties
  rings?: RingDefinition[]
  position?: [number, number, number] // For objects without orbits (like system center)
}

// System data interface
export interface OrbitalSystemData {
  id: string
  name: string
  description: string
  objects: CelestialObject[]
  lighting: LightingConfig
  metadata?: {
    version?: string
    last_updated?: string
    coordinate_system?: string
    distance_unit?: string
  }
}

// Lighting configuration
export interface LightingConfig {
  primary_star: string
  secondary_star?: string
  ambient_level: number
  stellar_influence_radius: number
}

// Jump point interface (keeping for compatibility)
export interface JumpPoint {
  id: string
  name: string
  position: [number, number, number]
  destination: string
  status: "active" | "inactive" | "unstable"
}

// Starmap data interface
export interface StarmapData {
  systems: Record<string, any>
  metadata: any
}

// Utility type guards
export function isOrbitData(orbit: OrbitData | BeltOrbitData): orbit is OrbitData {
  return 'semi_major_axis' in orbit
}

export function isBeltOrbitData(orbit: OrbitData | BeltOrbitData): orbit is BeltOrbitData {
  return 'inner_radius' in orbit
}

export function isStar(object: CelestialObject): boolean {
  return object.classification === 'star'
}

export function isPlanet(object: CelestialObject): boolean {
  return object.classification === 'planet' || object.classification === 'dwarf-planet'
}

export function isMoon(object: CelestialObject): boolean {
  return object.classification === 'moon'
}

export function isBelt(object: CelestialObject): boolean {
  return object.classification === 'belt'
}

export function isBarycenter(object: CelestialObject): boolean {
  return object.classification === 'barycenter'
}

// Helper function to determine geometry type from classification
export function getDefaultGeometryType(classification: Classification): GeometryType {
  switch (classification) {
    case 'star':
      return 'star'
    case 'compact-object':
      return 'compact'
    case 'planet':
      return 'terrestrial' // default, can be overridden
    case 'dwarf-planet':
      return 'rocky'
    case 'moon':
      return 'rocky'
    case 'belt':
      return 'belt'
    case 'ring':
      return 'ring'
    case 'barycenter':
      return 'none'
    default:
      return 'rocky'
  }
} 