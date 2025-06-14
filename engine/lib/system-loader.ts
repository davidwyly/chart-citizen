import { 
  OrbitalSystemData, 
  CelestialObject, 
  StarmapData,
  isStar,
  isPlanet,
  isMoon,
  isBelt
} from '../types/orbital-system'

// Simulation mode type
export type SimulationMode = "realistic" | "star-citizen"

export class SystemLoader {
  private static instance: SystemLoader
  private currentMode: SimulationMode = "realistic"
  private loadedSystems: Map<string, OrbitalSystemData> = new Map()
  private loadingPromises: Map<string, Promise<OrbitalSystemData | null>> = new Map()
  private preloadQueue: Set<string> = new Set()
  private starmapData: StarmapData | null = null
  private starmapLoading: Promise<StarmapData | null> | null = null

  static getInstance(): SystemLoader {
    if (!SystemLoader.instance) {
      SystemLoader.instance = new SystemLoader()
    }
    return SystemLoader.instance
  }

  setCurrentMode(mode: SimulationMode): void {
    if (this.currentMode !== mode) {
      this.currentMode = mode
      // Clear cache when switching modes
      this.clearCache()
    }
  }

  getCurrentMode(): SimulationMode {
    return this.currentMode
  }

  async loadStarmapData(): Promise<StarmapData | null> {
    if (this.starmapData && this.currentMode) {
      return this.starmapData
    }

    if (this.starmapLoading) {
      return this.starmapLoading
    }

    this.starmapLoading = this.fetchStarmapData()
    this.starmapData = await this.starmapLoading
    this.starmapLoading = null

    return this.starmapData
  }

  private async fetchStarmapData(): Promise<StarmapData | null> {
    try {
      console.log(`🗺️ Loading starmap data for mode: ${this.currentMode}`)

      const url = `/data/${this.currentMode}/starmap-systems.json`
      console.log(`📡 Fetching starmap from: ${url}`)

      const cacheBustUrl = `${url}?t=${Date.now()}`
      const response = await fetch(cacheBustUrl)

      if (!response.ok) {
        console.error(`❌ Starmap fetch failed: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch starmap: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error(`❌ Invalid content type: ${contentType}`)

        if (text.includes("<!DOCTYPE html>")) {
          console.error(`🚨 Received HTML instead of JSON - file doesn't exist`)
        }

        throw new Error(`Invalid content type for starmap: expected JSON, got ${contentType}`)
      }

      const data = await response.json()
      console.log(`✅ Starmap data loaded successfully for ${this.currentMode} mode`)
      return data
    } catch (error) {
      console.error("❌ Failed to load starmap data:", error)
      return this.getFallbackStarmapData()
    }
  }

  private getFallbackStarmapData(): StarmapData {
    const fallbackSystems: Record<string, any> = {}
    
    if (this.currentMode === "realistic") {
      fallbackSystems["sol"] = {
        id: "sol",
        name: "Sol System",
        description: "Our home solar system",
        position: [0, 0, 0],
        status: "inhabited"
      }
    } else if (this.currentMode === "star-citizen") {
      fallbackSystems["stanton"] = {
        id: "stanton",
        name: "Stanton System",
        position: [0, 0, 0],
        tags: ["inhabited", "commercial", "core-system"],
        description: "A corporate-controlled system featuring four planets."
      }
    }

    return {
      systems: fallbackSystems,
      metadata: {
        version: "fallback",
        mode: this.currentMode
      }
    }
  }

  async loadSystem(systemId: string): Promise<OrbitalSystemData | null> {
    const cacheKey = `${this.currentMode}:${systemId}`

    if (this.loadedSystems.has(cacheKey)) {
      return this.loadedSystems.get(cacheKey)!
    }

    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!
    }

    const loadPromise = this.fetchSystemData(systemId)
    this.loadingPromises.set(cacheKey, loadPromise)

    try {
      const systemData = await loadPromise

      if (systemData) {
        this.loadedSystems.set(cacheKey, systemData)
        // Note: Jump point preloading removed as it's now handled differently
      }

      return systemData
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  private async fetchSystemData(systemId: string): Promise<OrbitalSystemData | null> {
    try {
      console.log(`🚀 Loading system: ${systemId} (mode: ${this.currentMode})`)

      const url = `/data/${this.currentMode}/systems/${systemId}.json`
      const cacheBustUrl = `${url}?t=${Date.now()}`
      const response = await fetch(cacheBustUrl)

      if (!response.ok) {
        console.error(`❌ System fetch failed: ${response.status} ${response.statusText}`)
        return this.getFallbackSystemData(systemId)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error(`❌ Invalid content type: ${contentType}`)

        if (text.includes("<!DOCTYPE html>")) {
          console.error(`🚨 Received HTML instead of JSON - file doesn't exist`)
        }

        return this.getFallbackSystemData(systemId)
      }

      const systemData: OrbitalSystemData = await response.json()

      if (!this.validateSystemData(systemData)) {
        console.error(`❌ Invalid system data for ${systemId}`)
        return this.getFallbackSystemData(systemId)
      }

      console.log(`✅ Successfully loaded system: ${systemId} (${this.currentMode})`)
      return systemData
    } catch (error) {
      console.error(`❌ Failed to load system ${systemId}:`, error)
      return this.getFallbackSystemData(systemId)
    }
  }

  private validateSystemData(systemData: OrbitalSystemData): boolean {
    return !!(
      systemData.id && 
      systemData.name && 
      systemData.objects && 
      systemData.objects.length > 0 &&
      systemData.objects.some(obj => isStar(obj))
    )
  }

  private getFallbackSystemData(systemId: string): OrbitalSystemData {
    return {
      id: systemId,
      name: `${systemId} System (Fallback)`,
      description: `Fallback system data for ${systemId}`,
      objects: [
        {
          id: `${systemId}-star`,
          name: `${systemId} Star`,
          classification: 'star',
          geometry_type: 'star',
          properties: {
            mass: 1.0,
            radius: 1.0,
            temperature: 5778,
            color_temperature: 5778,
            luminosity: 100,
            solar_activity: 50,
            corona_thickness: 50,
            variability: 10
          },
          position: [0, 0, 0]
        }
      ],
      lighting: {
        primary_star: `${systemId}-star`,
        ambient_level: 0.1,
        stellar_influence_radius: 100
      },
      metadata: {
        version: "fallback",
        last_updated: new Date().toISOString().split('T')[0],
        coordinate_system: "heliocentric",
        distance_unit: "au"
      }
    }
  }

  // Preload adjacent systems (simplified without jump points for now)
  async preloadAdjacentSystems(systemId: string): Promise<void> {
    const starmapData = await this.loadStarmapData()
    if (!starmapData?.systems) return

    const currentSystem = starmapData.systems[systemId]
    if (!currentSystem?.jump_routes) return

    for (const adjacentSystemId of currentSystem.jump_routes) {
      if (!this.preloadQueue.has(adjacentSystemId)) {
        this.preloadQueue.add(adjacentSystemId)
        // Background preload
        this.loadSystem(adjacentSystemId).then(() => {
          this.preloadQueue.delete(adjacentSystemId)
        }).catch(() => {
          this.preloadQueue.delete(adjacentSystemId)
        })
      }
    }
  }

  async getStarmapSystems() {
    const starmapData = await this.loadStarmapData()
    return starmapData?.systems || {}
  }

  isSystemLoaded(systemId: string): boolean {
    const cacheKey = `${this.currentMode}:${systemId}`
    return this.loadedSystems.has(cacheKey)
  }

  clearCache(): void {
    this.loadedSystems.clear()
    this.loadingPromises.clear()
    this.starmapData = null
    this.starmapLoading = null
  }

  // Helper methods for backward compatibility
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

  getObjectsByParent(systemData: OrbitalSystemData, parentId: string): CelestialObject[] {
    return systemData.objects.filter(obj => obj.orbit?.parent === parentId)
  }

  findObject(systemData: OrbitalSystemData, objectId: string): CelestialObject | undefined {
    return systemData.objects.find(obj => obj.id === objectId)
  }
}

export const systemLoader = SystemLoader.getInstance()

export function getActiveMode(): SimulationMode {
  if (typeof window === "undefined") return "realistic"

  const mode = new URLSearchParams(window.location.search).get("mode")
  return (mode === "star-citizen" ? "star-citizen" : "realistic") as SimulationMode
}
