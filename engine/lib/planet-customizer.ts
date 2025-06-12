import type { CatalogObject } from "./system-loader"

export interface PlanetCustomizations {
  // Physical properties
  mass?: number
  radius?: number
  density?: number
  gravity?: number
  temperature?: number
  atmospheric_pressure?: number

  // Composition overrides
  composition?: {
    core?: string
    mantle?: string
    crust?: string
    atmosphere?: string
  }

  // Customizable properties (from the catalog)
  [key: string]: any

  // Render overrides
  render_overrides?: {
    [key: string]: any
  }
}

export interface CustomizedPlanet {
  id: string
  catalog_ref: string
  name: string
  orbit?: any
  customizations?: PlanetCustomizations
}

export class PlanetCustomizer {
  static applyCustomizations(basePlanet: CatalogObject, customizations?: PlanetCustomizations): CatalogObject {
    if (!customizations) {
      return basePlanet
    }

    // Deep clone the base planet to avoid mutations
    const customizedPlanet = JSON.parse(JSON.stringify(basePlanet))

    // Apply direct property overrides
    Object.keys(customizations).forEach((key) => {
      if (key === "render_overrides" || key === "composition") {
        return // Handle these separately
      }

      // Check if this property is customizable
      if (basePlanet.customizable && basePlanet.customizable[key]) {
        const limits = basePlanet.customizable[key]
        const value = customizations[key]

        // Validate against limits if they exist
        if (typeof value === "number" && limits.min !== undefined && limits.max !== undefined) {
          customizedPlanet[key] = Math.max(limits.min, Math.min(limits.max, value))
        } else {
          customizedPlanet[key] = value
        }
      } else {
        // Allow override even if not explicitly customizable
        customizedPlanet[key] = customizations[key]
      }
    })

    // Apply composition overrides
    if (customizations.composition) {
      customizedPlanet.composition = {
        ...customizedPlanet.composition,
        ...customizations.composition,
      }
    }

    // Apply render overrides
    if (customizations.render_overrides) {
      customizedPlanet.render = {
        ...customizedPlanet.render,
        ...customizations.render_overrides,
      }
    }

    // Recalculate dependent properties
    this.recalculateDependentProperties(customizedPlanet)

    return customizedPlanet
  }

  private static recalculateDependentProperties(planet: CatalogObject): void {
    // Recalculate gravity if mass or radius changed
    if (planet.mass !== undefined && planet.radius !== undefined) {
      // g = GM/r² (simplified, assuming Earth = 1.0)
      planet.gravity = planet.mass / (planet.radius * planet.radius)
    }

    // Recalculate density if mass or radius changed
    if (planet.mass !== undefined && planet.radius !== undefined) {
      // ρ = M/V, where V = (4/3)πr³
      const volume = (4 / 3) * Math.PI * Math.pow(planet.radius, 3)
      planet.density = planet.mass / volume
    }

    // Adjust render properties based on physical properties
    if (planet.temperature !== undefined) {
      this.adjustRenderForTemperature(planet)
    }

    if (planet.atmospheric_pressure !== undefined) {
      this.adjustRenderForAtmosphere(planet)
    }
  }

  private static adjustRenderForTemperature(planet: CatalogObject): void {
    const temp = planet.temperature

    if (temp > 1000) {
      // Very hot - adjust colors toward red/orange
      planet.render.surfaceColor = this.blendColors(planet.render.surfaceColor, "#ff4500", 0.3)
    } else if (temp < 200) {
      // Very cold - adjust colors toward blue/white
      planet.render.surfaceColor = this.blendColors(planet.render.surfaceColor, "#e0f6ff", 0.3)
    }
  }

  private static adjustRenderForAtmosphere(planet: CatalogObject): void {
    const pressure = planet.atmospheric_pressure

    if (pressure > 5.0) {
      // Thick atmosphere - increase atmospheric effects
      planet.render.atmosphereOpacity = Math.min(1.0, pressure / 10.0)
    } else if (pressure < 0.1) {
      // Thin atmosphere - reduce atmospheric effects
      planet.render.atmosphereOpacity = pressure * 2.0
      planet.render.hasAtmosphere = pressure > 0.01
    }
  }

  private static blendColors(color1: string, color2: string, ratio: number): string {
    // Simple color blending - in a real implementation, you'd want proper color space blending
    return color1 // Placeholder - implement proper color blending
  }

  static validateCustomizations(basePlanet: CatalogObject, customizations: PlanetCustomizations): string[] {
    const errors: string[] = []

    Object.keys(customizations).forEach((key) => {
      if (basePlanet.customizable && basePlanet.customizable[key]) {
        const limits = basePlanet.customizable[key]
        const value = customizations[key]

        if (typeof value === "number" && limits.min !== undefined && limits.max !== undefined) {
          if (value < limits.min || value > limits.max) {
            errors.push(`${key} value ${value} is outside allowed range [${limits.min}, ${limits.max}]`)
          }
        }
      }
    })

    return errors
  }

  static getCustomizableProperties(basePlanet: CatalogObject): Record<string, any> {
    return basePlanet.customizable || {}
  }
}
