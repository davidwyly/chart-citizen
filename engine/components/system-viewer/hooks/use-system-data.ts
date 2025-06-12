"use client"

import { useState, useEffect } from "react"
import { engineSystemLoader, type SystemData } from "@/engine/system-loader"

export function useSystemData(mode: string, systemId: string) {
  const [systemData, setSystemData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<string>("")
  const [availableSystems, setAvailableSystems] = useState<string[]>([])

  useEffect(() => {
    const loadSystemData = async () => {
      setLoading(true)
      setError(null)
      setLoadingProgress(`Loading ${systemId}...`)

      try {
        // Clear any existing data when switching systems
        setSystemData(null)

        // First, get available systems from starmap
        setLoadingProgress(`Checking available systems...`)
        const systems = await engineSystemLoader.getAvailableSystems(mode)
        setAvailableSystems(systems)

        console.log(`🔄 Switching to system: ${systemId} in mode: ${mode}`)
        console.log(`Available systems for mode ${mode}:`, systems)

        // Define fallback systems for each mode
        const fallbackSystems: Record<string, string[]> = {
          realistic: ["sol", "proxima-centauri", "alpha-centauri", "wolf-359", "kepler-442"],
          "star-citizen": ["stanton", "sol", "terra", "pyro", "magnus", "nyx"],
        }

        let systemToLoad = systemId
        let isUsingFallback = false

        // If the requested system is not in the available list, try fallbacks
        if (!systems.includes(systemId)) {
          console.warn(`System ${systemId} not found in starmap. Trying fallbacks...`)

          const fallbacks = fallbackSystems[mode] || []
          let foundFallback = false

          // Try each fallback system
          for (const fallback of fallbacks) {
            if (systems.includes(fallback)) {
              systemToLoad = fallback
              isUsingFallback = true
              foundFallback = true
              console.log(`Using fallback system: ${fallback}`)
              break
            }
          }

          // If no fallback found in starmap, try the first available system
          if (!foundFallback && systems.length > 0) {
            systemToLoad = systems[0]
            isUsingFallback = true
            console.log(`Using first available system: ${systemToLoad}`)
          }

          // If still no system available, create a minimal default
          if (!foundFallback && systems.length === 0) {
            console.warn(`No systems available. Creating minimal default system.`)
            const defaultSystem: SystemData = {
              id: "default",
              name: "Default System",
              description: "A minimal default system",
              barycenter: [0, 0, 0],
              stars: [
                {
                  id: "default-star",
                  catalog_ref: "sol-type-star",
                  name: "Default Star",
                  position: [0, 0, 0],
                },
              ],
              lighting: {
                primary_star: "default-star",
                ambient_level: 0.1,
                stellar_influence_radius: 1000,
              },
            }
            setSystemData(defaultSystem)
            setError(`No systems available for mode "${mode}". Showing default system.`)
            setLoading(false)
            return
          }
        }

        // Load the determined system
        setLoadingProgress(`Loading system: ${systemToLoad}...`)
        const data = await engineSystemLoader.loadSystem(mode, systemToLoad)

        if (data) {
          setLoadingProgress(`System loaded successfully`)
          setSystemData(data)
          if (isUsingFallback) {
            setError(`System "${systemId}" not found. Showing "${systemToLoad}" instead.`)
          }
        } else {
          throw new Error(`Failed to load system: ${systemToLoad}`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to load system: ${err}`
        setError(errorMessage)
        console.error("System loading error:", err)

        // As a last resort, create a minimal system
        const emergencySystem: SystemData = {
          id: "emergency",
          name: "Emergency System",
          description: "Emergency fallback system",
          barycenter: [0, 0, 0],
          stars: [
            {
              id: "emergency-star",
              catalog_ref: "sol-type-star",
              name: "Emergency Star",
              position: [0, 0, 0],
            },
          ],
          lighting: {
            primary_star: "emergency-star",
            ambient_level: 0.1,
            stellar_influence_radius: 1000,
          },
        }
        setSystemData(emergencySystem)
      } finally {
        setLoading(false)
        setTimeout(() => setLoadingProgress(""), 2000)
      }
    }

    loadSystemData()
  }, [mode, systemId])

  return {
    systemData,
    loading,
    error,
    loadingProgress,
    availableSystems,
  }
}
