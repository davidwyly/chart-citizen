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

export type SimulationMode = string

export class SystemLoader {
  private static instance: SystemLoader
  private currentMode: SimulationMode = "realistic"
  private loadedSystems: Map<string, SystemData> = new Map()
  private loadingPromises: Map<string, Promise<SystemData | null>> = new Map()
  private preloadQueue: Set<string> = new Set()
  private catalogCache: Map<string, CatalogObject> = new Map()
  private starmapData: StarmapData | null = null
  private starmapLoading: Promise<StarmapData | null> | null = null

  static getInstance(): SystemLoader {
    if (!SystemLoader.instance) {
      SystemLoader.instance = new SystemLoader()
    }
    return SystemLoader.instance
  }

  setMode(mode: SimulationMode): void {
    if (this.currentMode !== mode) {
      this.currentMode = mode
      this.clearCache()
    }
  }

  getMode(): SimulationMode {
    return this.currentMode
  }

  async loadStarmapData(): Promise<StarmapData | null> {
    if (this.starmapData) {
      return this.starmapData
    }

    if (this.starmapLoading) {
      return this.starmapLoading
    }

    this.starmapLoading = this.fetchStarmapData()
    const data = await this.starmapLoading
    this.starmapData = data
    return data
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
    console.log(`🔧 Using fallback starmap data for ${this.currentMode}`)

    return {
      systems: {
        "default-system": {
          id: "default-system",
          name: `Default ${this.currentMode} System`,
          position: [0, 0, 0],
          tags: ["fallback"],
          jump_routes: [],
          description: `Fallback system data for ${this.currentMode} mode`,
        },
      },
      metadata: {
        mode: this.currentMode,
        fallback: true,
      },
    }
  }

  async loadSystem(systemId: string): Promise<SystemData | null> {
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
        this.preloadJumpNeighbors(systemData.jump_points || [])
      }

      return systemData
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  private async fetchSystemData(systemId: string): Promise<SystemData | null> {
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

      const systemData: SystemData = await response.json()

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

  private getFallbackSystemData(systemId: string): SystemData {
    console.log(`🔧 Using fallback system data for ${systemId}`)

    return {
      id: systemId,
      name: `${systemId.charAt(0).toUpperCase() + systemId.slice(1)} System`,
      description: `Fallback system data for ${systemId} in ${this.currentMode} mode`,
      barycenter: [0, 0, 0],
      stars: [
        {
          id: `${systemId}-star`,
          catalog_ref: "g2v-main-sequence",
          name: `${systemId.charAt(0).toUpperCase() + systemId.slice(1)} Star`,
          position: [0, 0, 0],
        },
      ],
      lighting: {
        primary_star: `${systemId}-star`,
        ambient_level: 0.1,
        stellar_influence_radius: 100,
      },
    }
  }

  private async preloadJumpNeighbors(jumpPoints: JumpPoint[]) {
    const availableSystems = await this.getStarmapSystems()

    jumpPoints.forEach((jumpPoint) => {
      const neighborId = jumpPoint.destination

      if (!availableSystems[neighborId]) {
        console.log(`⚠️ Skipping preload of ${neighborId} - not available in ${this.currentMode} mode`)
        return
      }

      const cacheKey = `${this.currentMode}:${neighborId}`
      if (
        !this.loadedSystems.has(cacheKey) &&
        !this.loadingPromises.has(cacheKey) &&
        !this.preloadQueue.has(neighborId)
      ) {
        this.preloadQueue.add(neighborId)

        setTimeout(() => {
          this.loadSystem(neighborId)
            .then(() => {
              console.log(`🔄 Preloaded neighbor system: ${neighborId}`)
              this.preloadQueue.delete(neighborId)
            })
            .catch((error) => {
              console.warn(`⚠️ Failed to preload ${neighborId}:`, error)
              this.preloadQueue.delete(neighborId)
            })
        }, 1000)
      }
    })
  }

  async getCatalogObject(catalogRef: string): Promise<CatalogObject | null> {
    if (this.catalogCache.has(catalogRef)) {
      return this.catalogCache.get(catalogRef)!
    }

    const catalogFiles = [
      "stars",
      "planets",
      "moons",
      "belts",
      "compact-objects",
      "artificial-satellites",
      "exotic",
      "space-stations",
    ]

    for (const catalogFile of catalogFiles) {
      try {
        const url = `/data/engine/object-catalog/${catalogFile}.json?t=${Date.now()}`
        const response = await fetch(url)
        if (response.ok) {
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            console.warn(`⚠️ Invalid content type for catalog ${catalogFile}: ${contentType}`)
            continue
          }

          const catalogData = await response.json()

          Object.entries(catalogData).forEach(([key, value]) => {
            this.catalogCache.set(key, value as CatalogObject)
          })

          if (catalogData[catalogRef]) {
            return catalogData[catalogRef] as CatalogObject
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load catalog ${catalogFile}:`, error)
      }
    }

    console.warn(`⚠️ Catalog object not found: ${catalogRef}, using fallback`)
    return this.getFallbackCatalogObject(catalogRef)
  }

  private getFallbackCatalogObject(catalogRef: string): CatalogObject {
    return {
      id: catalogRef,
      name: `Fallback ${catalogRef}`,
      mass: 1.0,
      radius: 1.0,
      render: {
        shader: "basic",
        surfaceColor: "#888888",
        rotation_rate: 0.01,
      },
    }
  }

  async getStarmapSystems() {
    const starmapData = await this.loadStarmapData()
    return starmapData?.systems || {}
  }

  async getSystemMetadata() {
    const starmapData = await this.loadStarmapData()
    return starmapData?.metadata || {}
  }

  async getAvailableSystems(): Promise<string[]> {
    const systems = await this.getStarmapSystems()
    return Object.keys(systems)
  }

  isSystemLoaded(systemId: string): boolean {
    return this.loadedSystems.has(`${this.currentMode}:${systemId}`)
  }

  isSystemLoading(systemId: string): boolean {
    return this.loadingPromises.has(`${this.currentMode}:${systemId}`)
  }

  getLoadingStatus(systemId: string): "loaded" | "loading" | "not-loaded" {
    if (this.isSystemLoaded(systemId)) return "loaded"
    if (this.isSystemLoading(systemId)) return "loading"
    return "not-loaded"
  }

  preloadSystem(systemId: string): void {
    if (!this.isSystemLoaded(systemId) && !this.isSystemLoading(systemId)) {
      this.loadSystem(systemId).catch((error) => {
        console.warn(`⚠️ Failed to preload system ${systemId}:`, error)
      })
    }
  }

  clearCache(): void {
    console.log(`🧹 Clearing cache for mode switch to ${this.currentMode}`)
    this.loadedSystems.clear()
    this.loadingPromises.clear()
    this.preloadQueue.clear()
    this.starmapData = null
    this.starmapLoading = null
  }

  clearAllCaches(): void {
    this.clearCache()
    this.catalogCache.clear()
  }

  private validateSystemData(systemData: SystemData): boolean {
    if (!systemData.id || !systemData.name || !systemData.stars || systemData.stars.length === 0) {
      return false
    }
    return true
  }

  calculateBarycenter(stars: SystemObject[]): [number, number, number] {
    if (stars.length === 1) {
      return [0, 0, 0]
    }

    let totalX = 0,
      totalY = 0,
      totalZ = 0

    for (const star of stars) {
      const pos = star.position || [0, 0, 0]
      totalX += pos[0]
      totalY += pos[1]
      totalZ += pos[2]
    }

    return [totalX / stars.length, totalY / stars.length, totalZ / stars.length]
  }

  async getSystemsInRange(centerPosition: [number, number, number], maxDistance: number) {
    const systems = await this.getStarmapSystems()
    const inRange = []

    for (const [systemId, systemInfo] of Object.entries(systems)) {
      const distance = this.calculateDistance(centerPosition, systemInfo.position)
      if (distance <= maxDistance) {
        inRange.push({ ...systemInfo, distance })
      }
    }

    return inRange.sort((a, b) => a.distance - b.distance)
  }

  private calculateDistance(pos1: [number, number, number], pos2: [number, number, number]): number {
    const dx = pos1[0] - pos2[0]
    const dy = pos1[1] - pos2[1]
    const dz = pos1[2] - pos2[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}

export const systemLoader = SystemLoader.getInstance()

export function getActiveMode(): SimulationMode {
  if (typeof window === "undefined") return "realistic"

  const mode = new URLSearchParams(window.location.search).get("mode")
  return mode || "realistic"
}
