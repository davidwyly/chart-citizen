export type ViewType = "realistic" | "navigational" | "profile"

export type EffectsLevel = "low" | "medium" | "high" | "ultra"

export const EFFECTS_LEVELS: EffectsLevel[] = ["low", "medium", "high", "ultra"]

export function isValidEffectsLevel(level: string): level is EffectsLevel {
  return EFFECTS_LEVELS.includes(level as EffectsLevel)
}

export function isValidViewType(type: string): type is ViewType {
  return ["realistic", "navigational", "profile"].includes(type)
} 