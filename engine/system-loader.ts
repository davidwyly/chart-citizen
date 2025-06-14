import { 
  OrbitalSystemData, 
  CelestialObject, 
  StarmapData,
  LightingConfig,
  JumpPoint,
  isStar,
  isPlanet,
  isMoon,
  isBelt
} from './types/orbital-system'

export class EngineSystemLoader {
  private loadedSystems: Map<string, OrbitalSystemData> = new Map()
  private loadingPromises: Map<string, Promise<OrbitalSystemData | null>> = new Map()
  private starmapCache: Map<string, StarmapData> = new Map()

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

  async loadSystem(mode: string, systemId: string): Promise<OrbitalSystemData | null> {
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

  private async fetchSystemData(mode: string, systemId: string): Promise<OrbitalSystemData | null> {
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

      const systemData: OrbitalSystemData = await response.json()

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

  private validateSystemData(systemData: OrbitalSystemData): boolean {
    return !!(
      systemData.id && 
      systemData.name && 
      systemData.objects && 
      systemData.objects.length > 0 &&
      systemData.objects.some(obj => isStar(obj)) // At least one star
    )
  }

  async getAvailableSystems(mode: string): Promise<string[]> {
    try {
      const starmapData = await this.loadStarmap(mode)
      if (!starmapData?.systems) {
        return []
      }

      return Object.keys(starmapData.systems)
    } catch (error) {
      console.error(`❌ Failed to get available systems for mode ${mode}:`, error)
      return []
    }
  }

  isSystemLoaded(mode: string, systemId: string): boolean {
    const cacheKey = `${mode}:${systemId}`
    return this.loadedSystems.has(cacheKey)
  }

  isSystemLoading(mode: string, systemId: string): boolean {
    const cacheKey = `${mode}:${systemId}`
    return this.loadingPromises.has(cacheKey)
  }

  getLoadingStatus(mode: string, systemId: string): "loaded" | "loading" | "not-loaded" {
    if (this.isSystemLoaded(mode, systemId)) return "loaded"
    if (this.isSystemLoading(mode, systemId)) return "loading"
    return "not-loaded"
  }

  clearCache(mode?: string): void {
    if (mode) {
      // Clear specific mode
      const keysToDelete = Array.from(this.loadedSystems.keys()).filter(key => key.startsWith(`${mode}:`))
      keysToDelete.forEach(key => this.loadedSystems.delete(key))
      this.starmapCache.delete(mode)
    } else {
      // Clear all
      this.loadedSystems.clear()
      this.starmapCache.clear()
    }
  }

  // Helper methods for backward compatibility and easy access
  getStars(systemData: OrbitalSystemData): CelestialObject[] {
    return systemData.objects.filter(isStar)
  }

  getPlanets(systemData: OrbitalSystemData): CelestialObject[] {
    return systemData.objects.filter(isPlanet)
  }

  getMoons(systemData: OrbitalSystemData): CelestialObject[] {
    return systemData.objects.filter(isMoon)
  }

  getBelts(systemData: OrbitalSystemData): CelestialObject[] {
    return systemData.objects.filter(isBelt)
  }

  // Get objects by parent (for hierarchical rendering)
  getObjectsByParent(systemData: OrbitalSystemData, parentId: string): CelestialObject[] {
    return systemData.objects.filter(obj => obj.orbit?.parent === parentId)
  }

  // Get root objects (no parent - typically stars or system barycenters)
  getRootObjects(systemData: OrbitalSystemData): CelestialObject[] {
    return systemData.objects.filter(obj => !obj.orbit || obj.position !== undefined)
  }

  // Find object by ID
  findObject(systemData: OrbitalSystemData, objectId: string): CelestialObject | undefined {
    return systemData.objects.find(obj => obj.id === objectId)
  }

  // Build object hierarchy tree
  buildObjectHierarchy(systemData: OrbitalSystemData): Map<string, CelestialObject[]> {
    const hierarchy = new Map<string, CelestialObject[]>()
    
    for (const object of systemData.objects) {
      if (object.orbit?.parent) {
        const parent = object.orbit.parent
        if (!hierarchy.has(parent)) {
          hierarchy.set(parent, [])
        }
        hierarchy.get(parent)!.push(object)
      }
    }

    return hierarchy
  }
}

// Export singleton instance
export const engineSystemLoader = new EngineSystemLoader()