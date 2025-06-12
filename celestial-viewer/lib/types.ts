export type CelestialObjectType = "star" | "terrestrial" | "gasGiant" | "special"
export type TerrestrialSubtype = "rocky" | "oceanic" | "smog" | "moon"
export type GasGiantSubtype = "jovian" | "iceGiant"
export type SpecialSubtype = "blackHole" | "nebula" | "protostar" // Added protostar

export interface Property {
  id: string
  label: string
  type: "slider" | "select"
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
  unit?: string
  value: number | string
}

export interface CelestialObject {
  id: string
  name: string
  type: CelestialObjectType
  subtype: TerrestrialSubtype | GasGiantSubtype | SpecialSubtype
  description: string
  properties: Property[]
}
