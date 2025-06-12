export interface SystemData {
  id: string
  name: string
  description: string
  barycenter: [number, number, number]
  stars: SystemObject[]
  planets?: SystemObject[]
  moons?: SystemObject[]
  belts?: SystemObject[]
  jump_points?: JumpPoint[]
  lighting: LightingConfig
}

export interface SystemObject {
  id: string
  catalog_ref: string
  name: string
  position?: [number, number, number]
  orbit?: OrbitData
}

export interface OrbitData {
  parent: string
  semi_major_axis: number
  eccentricity: number
  inclination: number
  orbital_period: number
  inner_radius?: number
  outer_radius?: number
}

export interface JumpPoint {
  id: string
  name: string
  position: [number, number, number]
  destination: string
  status: "active" | "inactive" | "unstable"
}

export interface LightingConfig {
  primary_star: string
  secondary_star?: string
  ambient_level: number
  stellar_influence_radius: number
}

export interface CatalogObject {
  id: string
  name: string
  mass: number
  radius: number
  render: RenderConfig
  [key: string]: any
}

export interface RenderConfig {
  shader: string
  [key: string]: any
}

export interface StarmapData {
  systems: Record<string, any>
  metadata: any
}

export class EngineSystemLoader {
  private loadedSystems: Map<string, SystemData> = new Map()
  private loadingPromises: Map<string, Promise<SystemData | null>> = new Map()
  private catalogCache: Map<string, CatalogObject> = new Map()
  private starmapCache: Map<string, StarmapData> = new Map()

  // Catalog reference aliases
  private catalogAliases: Record<string, string> = {
    "gas-giant": "gas-giant-standard",
    "terrestrial-planet": "terrestrial-rocky",
    "icy-moon": "ice-moon",
    "large-moon": "earth-moon-type",
    "rocky-moon": "rocky-moon",
    "volcanic-moon": "volcanic-moon"
  }

  async loadStarmap(mode: string): Promise<StarmapData | null> {
    // Check cache first
    if (this.starmapCache.has(mode)) {
      return this.starmapCache.get(mode)!
    }

    try {
      console.log(`🗺️ Loading starmap for mode: ${mode}`)

      const url = `/data/${mode}/starmap-systems.json`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch starmap for mode ${mode}: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Invalid content type for starmap: expected JSON, got ${contentType}`)
      }

      const data = await response.json()

      // Cache the result
      this.starmapCache.set(mode, data)

      console.log(`✅ Starmap loaded for mode: ${mode}`)
      return data
    } catch (error) {
      console.error(`❌ Failed to load starmap for mode ${mode}:`, error)
      return null
    }
  }

  async loadSystem(mode: string, systemId: string): Promise<SystemData | null> {
    const cacheKey = `${mode}:${systemId}`

    // Check if already loaded
    if (this.loadedSystems.has(cacheKey)) {
      return this.loadedSystems.get(cacheKey)!
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!
    }

    // Start loading
    const loadPromise = this.fetchSystemData(mode, systemId)
    this.loadingPromises.set(cacheKey, loadPromise)

    try {
      const systemData = await loadPromise

      if (systemData) {
        // Cache the loaded system
        this.loadedSystems.set(cacheKey, systemData)
      }

      return systemData
    } finally {
      // Clean up loading promise
      this.loadingPromises.delete(cacheKey)
    }
  }

  private async fetchSystemData(mode: string, systemId: string): Promise<SystemData | null> {
    try {
      console.log(`🚀 Loading system: ${systemId} (mode: ${mode})`)

      const url = `/data/${mode}/systems/${systemId}.json`
      console.log(`📁 Fetching from URL: ${url}`)

      const response = await fetch(url)

      if (!response.ok) {
        console.error(`❌ HTTP Error ${response.status}: ${response.statusText} for ${url}`)

        // Try to get more details about the error
        const errorText = await response.text()
        console.error(`❌ Error response body:`, errorText.substring(0, 200))

        throw new Error(`System not found: ${systemId} in mode ${mode} (HTTP ${response.status})`)
      }

      const contentType = response.headers.get("content-type")
      console.log(`📄 Content-Type: ${contentType}`)

      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error(`❌ Invalid content type. Expected JSON but got: ${contentType}`)
        console.error(`❌ Response body (first 500 chars):`, responseText.substring(0, 500))

        // Check if it's a 404 HTML page
        if (responseText.includes("<html") || responseText.includes("<!DOCTYPE")) {
          throw new Error(`System file not found: ${url}. The server returned an HTML page instead of JSON.`)
        }

        throw new Error(`Invalid content type for system: expected JSON, got ${contentType}`)
      }

      const systemData: SystemData = await response.json()

      // Validate system data
      if (!this.validateSystemData(systemData)) {
        throw new Error(`Invalid system data for ${systemId}`)
      }

      console.log(`✅ Successfully loaded system: ${systemId} (${mode})`)
      return systemData
    } catch (error) {
      console.error(`❌ Failed to load system ${systemId} in mode ${mode}:`, error)
      return null
    }
  }

  private validateSystemData(systemData: SystemData): boolean {
    return !!(systemData.id && systemData.name && systemData.stars && systemData.stars.length > 0)
  }

  async getCatalogObject(catalogRef: string): Promise<CatalogObject | null> {
    // Resolve alias to canonical catalog reference if applicable
    const canonicalRef = this.catalogAliases[catalogRef] || catalogRef

    // Check cache first using canonical reference
    if (this.catalogCache.has(canonicalRef)) {
      return this.catalogCache.get(canonicalRef)!
    }

    // If alias differs from canonical, also check cache keyed by alias (for completeness)
    if (canonicalRef !== catalogRef && this.catalogCache.has(catalogRef)) {
      return this.catalogCache.get(catalogRef)!
    }

    // Determine which catalog file contains this object
    const catalogFiles = [
      "stars",
      "planets",
      "moons",
      "belts",
      "compact-objects",
      "artificial-satellites",
      "exotic",
      "space-stations"
    ]

    for (const catalogFile of catalogFiles) {
      try {
        const response = await fetch(`/data/engine/object-catalog/${catalogFile}.json`)
        if (response.ok) {
          const catalogData = await response.json()

          // Cache all objects from this catalog
          Object.entries(catalogData).forEach(([key, value]) => {
            this.catalogCache.set(key, value as CatalogObject)
          })

          // Return the requested object if found (check canonical and alias keys)
          if (catalogData[canonicalRef]) {
            // Map alias to canonical object in cache for faster lookup next time
            if (canonicalRef !== catalogRef) {
              this.catalogCache.set(catalogRef, catalogData[canonicalRef] as CatalogObject)
            }
            return catalogData[canonicalRef] as CatalogObject
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load catalog ${catalogFile}:`, error)
      }
    }

    console.error(`❌ Failed to load catalog object: ${catalogRef}`)
    return null
  }

  async getAvailableSystems(mode: string): Promise<string[]> {
    try {
      const starmap = await this.loadStarmap(mode)
      if (starmap && starmap.systems) {
        return Object.keys(starmap.systems)
      }

      // If starmap fails, return known systems for each mode
      const knownSystems: Record<string, string[]> = {
        realistic: ["sol", "proxima-centauri", "alpha-centauri", "wolf-359", "kepler-442"],
        "star-citizen": ["stanton", "sol", "terra", "pyro", "magnus", "nyx"],
      }

      console.warn(`Starmap failed to load for mode ${mode}, using known systems`)
      return knownSystems[mode] || []
    } catch (error) {
      console.error(`Failed to get available systems for mode ${mode}:`, error)
      return []
    }
  }

  isSystemLoaded(mode: string, systemId: string): boolean {
    return this.loadedSystems.has(`${mode}:${systemId}`)
  }

  isSystemLoading(mode: string, systemId: string): boolean {
    return this.loadingPromises.has(`${mode}:${systemId}`)
  }

  getLoadingStatus(mode: string, systemId: string): "loaded" | "loading" | "not-loaded" {
    if (this.isSystemLoaded(mode, systemId)) return "loaded"
    if (this.isSystemLoading(mode, systemId)) return "loading"
    return "not-loaded"
  }

  clearCache(mode?: string): void {
    if (mode) {
      // Clear cache for specific mode
      const keysToDelete = Array.from(this.loadedSystems.keys()).filter((key) => key.startsWith(`${mode}:`))
      keysToDelete.forEach((key) => this.loadedSystems.delete(key))

      const promisesToDelete = Array.from(this.loadingPromises.keys()).filter((key) => key.startsWith(`${mode}:`))
      promisesToDelete.forEach((key) => this.loadingPromises.delete(key))

      this.starmapCache.delete(mode)
    } else {
      // Clear all caches
      this.loadedSystems.clear()
      this.loadingPromises.clear()
      this.starmapCache.clear()
    }
  }
}

// Export singleton instance
export const engineSystemLoader = new EngineSystemLoader()