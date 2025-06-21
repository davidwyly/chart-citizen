/**
 * Catalog object interface for celestial body definitions
 * Used for loading object properties from catalog files
 */
export interface CatalogObject {
  id: string
  name: string
  category?: string
  subtype?: string
  physical?: {
    mass?: number
    radius?: number
    temperature?: number
    density?: number
    gravity?: number
    [key: string]: any
  }
  features?: {
    atmosphere?: number | string
    water?: number
    tectonics?: number
    flora?: number
    population?: number
    [key: string]: any
  }
  appearance?: {
    color?: string
    albedo?: number
    surface_color?: string
    [key: string]: any
  }
  composition?: {
    primary?: string
    secondary?: string[]
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Catalog data structure for organizing celestial objects by type
 */
export interface CatalogData {
  stars?: Record<string, CatalogObject>
  planets?: Record<string, CatalogObject>
  moons?: Record<string, CatalogObject>
  belts?: Record<string, CatalogObject>
  'compact-objects'?: Record<string, CatalogObject>
  [key: string]: Record<string, CatalogObject> | undefined
}

/**
 * Catalog loader interface for loading and caching catalog data
 */
export interface CatalogLoader {
  loadCatalog(catalogType: string): Promise<Record<string, CatalogObject>>
  getCatalogObject(id: string): CatalogObject | undefined
  getAllCatalogObjects(): Map<string, CatalogObject>
  clearCache(): void
} 