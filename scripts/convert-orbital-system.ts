#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { 
  OrbitalSystemData, 
  CelestialObject, 
  Classification, 
  GeometryType,
  CelestialProperties,
  getDefaultGeometryType 
} from '../engine/types/orbital-system'

// Old system interfaces (for conversion)
interface OldSystemData {
  id: string
  name: string
  description: string
  barycenter: [number, number, number]
  stars: OldSystemObject[]
  planets?: OldSystemObject[]
  moons?: OldSystemObject[]
  belts?: OldSystemObject[]
  jump_points?: any[]
  lighting: any
}

interface OldSystemObject {
  id: string
  catalog_ref: string
  name: string
  position?: [number, number, number]
  orbit?: {
    parent: string
    semi_major_axis: number
    eccentricity: number
    inclination: number
    orbital_period: number
    inner_radius?: number
    outer_radius?: number
  }
  customizations?: any
}

interface CatalogObject {
  id: string
  name: string
  category?: string
  subtype?: string
  physical?: any
  features?: any
  appearance?: any
  composition?: any
  [key: string]: any
}

class OrbitalSystemConverter {
  private catalogCache: Map<string, CatalogObject> = new Map()

  async loadCatalogs(): Promise<void> {
    const catalogDir = path.join(process.cwd(), 'public/data/engine/object-catalog')
    const catalogFiles = ['stars.json', 'planets.json', 'moons.json', 'belts.json', 'compact-objects.json']

    for (const catalogFile of catalogFiles) {
      try {
        const filePath = path.join(catalogDir, catalogFile)
        if (fs.existsSync(filePath)) {
          const catalogData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
          Object.entries(catalogData).forEach(([key, value]) => {
            this.catalogCache.set(key, value as CatalogObject)
          })
          console.log(`✅ Loaded catalog: ${catalogFile}`)
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load catalog ${catalogFile}:`, error)
      }
    }
  }

  private determineClassification(object: OldSystemObject, objectType: string): Classification {
    const name = object.name.toLowerCase()
    
    if (objectType === 'stars' || name.includes('star') || name.includes('sun')) {
      return 'star'
    }
    
    if (objectType === 'belts' || name.includes('belt')) {
      return 'belt'
    }
    
    if (objectType === 'moons' || name.includes('moon')) {
      return 'moon'
    }
    
    if (objectType === 'planets') {
      // Check if it's a dwarf planet
      if (name.includes('pluto') || name.includes('ceres') || name.includes('dwarf')) {
        return 'dwarf-planet'
      }
      return 'planet'
    }
    
    return 'planet' // default
  }

  private determineGeometryType(classification: Classification, catalogObject?: CatalogObject, customizations?: any): GeometryType {
    // Use customizations or catalog data to refine geometry type
    if (classification === 'planet') {
      const name = catalogObject?.name?.toLowerCase() || ''
      if (name.includes('gas') || name.includes('jupiter') || name.includes('saturn') || 
          name.includes('neptune') || name.includes('uranus')) {
        return 'gas_giant'
      }
      return 'terrestrial'
    }
    
    return getDefaultGeometryType(classification)
  }

  private convertProperties(
    catalogObject: CatalogObject | undefined, 
    customizations: any, 
    classification: Classification
  ): CelestialProperties {
    const properties: CelestialProperties = {
      mass: 1,
      radius: 1,
      temperature: 288
    }

    // Merge catalog physical properties
    if (catalogObject?.physical) {
      Object.assign(properties, catalogObject.physical)
    }

    // Merge catalog features
    if (catalogObject?.features) {
      Object.assign(properties, catalogObject.features)
    }

    // Merge catalog appearance
    if (catalogObject?.appearance) {
      Object.assign(properties, catalogObject.appearance)
    }

    // Apply customizations
    if (customizations?.physical) {
      Object.assign(properties, customizations.physical)
    }

    if (customizations?.features) {
      Object.assign(properties, customizations.features)
    }

    if (customizations?.appearance) {
      Object.assign(properties, customizations.appearance)
    }

    if (customizations?.habitability) {
      Object.assign(properties, customizations.habitability)
    }

    // Convert specific legacy properties to new format
    this.convertLegacyProperties(properties, customizations)

    return properties
  }

  private convertLegacyProperties(properties: CelestialProperties, customizations: any): void {
    // Convert atmosphere types to numeric values
    if (customizations?.features?.atmosphere) {
      const atm = customizations.features.atmosphere
      if (typeof atm === 'string') {
        switch (atm) {
          case 'breathable':
            properties.atmosphere = 80
            break
          case 'thick':
            properties.atmosphere = 90
            break
          case 'thin':
            properties.atmosphere = 30
            break
          default:
            properties.atmosphere = 50
        }
      }
    }

    // Convert surface types to appropriate properties
    if (customizations?.features?.surface_type) {
      const surface = customizations.features.surface_type
      switch (surface) {
        case 'rocky':
          properties.crater_density = properties.crater_density || 60
          properties.albedo = properties.albedo || 40
          break
        case 'volcanic':
          properties.tectonics = properties.tectonics || 80
          properties.temperature = Math.max(properties.temperature, 400)
          break
        case 'desert':
          properties.albedo = properties.albedo || 30
          properties.water = 5
          break
      }
      delete properties.surface_type
    }

    // Convert boolean flags to numeric values
    if (customizations?.features?.city_lights === true) {
      properties.population = properties.population || 80
    }

    if (customizations?.features?.vegetation === true) {
      properties.flora = properties.flora || 60
    }

    if (customizations?.features?.ocean_coverage) {
      properties.water = Math.round(customizations.features.ocean_coverage * 100)
    }

    if (customizations?.features?.cloud_coverage) {
      properties.atmosphere = Math.max(properties.atmosphere || 0, Math.round(customizations.features.cloud_coverage * 100))
    }
  }

  private convertObject(object: OldSystemObject, objectType: string): CelestialObject {
    const catalogObject = this.catalogCache.get(object.catalog_ref)
    const classification = this.determineClassification(object, objectType)
    const geometry_type = this.determineGeometryType(classification, catalogObject, object.customizations)
    
    const celestialObject: CelestialObject = {
      id: object.id,
      name: object.name,
      classification,
      geometry_type,
      properties: this.convertProperties(catalogObject, object.customizations, classification)
    }

    // Add orbit data if present
    if (object.orbit) {
      if (classification === 'belt' && object.orbit.inner_radius && object.orbit.outer_radius) {
        celestialObject.orbit = {
          parent: object.orbit.parent,
          inner_radius: object.orbit.inner_radius,
          outer_radius: object.orbit.outer_radius,
          inclination: object.orbit.inclination || 0,
          eccentricity: object.orbit.eccentricity || 0
        }
      } else {
        celestialObject.orbit = {
          parent: object.orbit.parent,
          semi_major_axis: object.orbit.semi_major_axis,
          eccentricity: object.orbit.eccentricity || 0,
          inclination: object.orbit.inclination || 0,
          orbital_period: object.orbit.orbital_period
        }
      }
    }

    // Add position for objects without orbits (usually stars at system center)
    if (object.position) {
      celestialObject.position = object.position
    }

    return celestialObject
  }

  async convertSystem(oldSystemPath: string): Promise<OrbitalSystemData> {
    const oldSystemData: OldSystemData = JSON.parse(fs.readFileSync(oldSystemPath, 'utf8'))
    
    console.log(`🔄 Converting system: ${oldSystemData.name}`)

    const objects: CelestialObject[] = []

    // Convert stars
    for (const star of oldSystemData.stars) {
      objects.push(this.convertObject(star, 'stars'))
    }

    // Convert planets
    if (oldSystemData.planets) {
      for (const planet of oldSystemData.planets) {
        objects.push(this.convertObject(planet, 'planets'))
      }
    }

    // Convert moons
    if (oldSystemData.moons) {
      for (const moon of oldSystemData.moons) {
        objects.push(this.convertObject(moon, 'moons'))
      }
    }

    // Convert belts
    if (oldSystemData.belts) {
      for (const belt of oldSystemData.belts) {
        objects.push(this.convertObject(belt, 'belts'))
      }
    }

    const newSystemData: OrbitalSystemData = {
      id: oldSystemData.id,
      name: oldSystemData.name,
      description: oldSystemData.description,
      objects,
      lighting: oldSystemData.lighting,
      metadata: {
        version: '2.0',
        last_updated: new Date().toISOString().split('T')[0],
        coordinate_system: 'heliocentric',
        distance_unit: 'au'
      }
    }

    console.log(`✅ Converted ${objects.length} objects in ${oldSystemData.name}`)
    return newSystemData
  }

  async convertAllSystems(): Promise<void> {
    await this.loadCatalogs()

    const modes = ['realistic', 'star-citizen']
    
    for (const mode of modes) {
      const systemsDir = path.join(process.cwd(), 'public/data', mode, 'systems')
      
      if (!fs.existsSync(systemsDir)) {
        console.warn(`⚠️ Systems directory not found: ${systemsDir}`)
        continue
      }

      const files = fs.readdirSync(systemsDir).filter(f => f.endsWith('.json'))
      
      for (const file of files) {
        try {
          const oldSystemPath = path.join(systemsDir, file)
          const newSystemData = await this.convertSystem(oldSystemPath)
          
          // Write converted data back to the same file
          fs.writeFileSync(oldSystemPath, JSON.stringify(newSystemData, null, 2))
          console.log(`💾 Updated: ${file}`)
        } catch (error) {
          console.error(`❌ Failed to convert ${file}:`, error)
        }
      }
    }

    console.log('🎉 Conversion complete!')
  }
}

// Run conversion if this script is executed directly
if (require.main === module) {
  const converter = new OrbitalSystemConverter()
  converter.convertAllSystems().catch(console.error)
}

export { OrbitalSystemConverter } 