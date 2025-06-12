export interface ViewModeScaling {
  SYSTEM_SCALE: number;
  STAR_SCALE: number;
  PLANET_SCALE: number;
  ORBITAL_SCALE: number;
  STAR_SHADER_SCALE: number;
}

export interface ViewMode {
  id: string;
  name: string;
  description: string;
  scaling: ViewModeScaling;
  features: {
    [key: string]: boolean;
  };
}

export const DEFAULT_SCALING: ViewModeScaling = {
  SYSTEM_SCALE: 1.0,
  STAR_SCALE: 1.0,
  PLANET_SCALE: 1.0,
  ORBITAL_SCALE: 1.0,
  STAR_SHADER_SCALE: 1.0
}; 