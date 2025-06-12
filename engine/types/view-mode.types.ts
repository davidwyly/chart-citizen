export type ViewMode = 'realistic' | 'navigational' | 'profile';

export interface ViewModeScaling {
  ORBITAL_SCALE: number;
  STAR_SCALE: number;
  PLANET_SCALE: number;
  MOON_SCALE: number;
  STAR_SHADER_SCALE: number;
}

export interface ViewFeatures {
  scientificInfo: boolean;
  educationalContent: boolean;
  gameInfo: boolean;
  jumpPointInfo: boolean;
}

export interface ViewModeState {
  currentViewMode: ViewMode;
  scaling: ViewModeScaling;
} 