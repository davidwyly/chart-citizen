export type Mode = 'explorational' | 'navigational' | 'profile';

export type ViewMode = 'explorational' | 'navigational' | 'profile';

export interface ModeFeatures {
  scientificInfo: boolean;
  educationalContent: boolean;
  gameInfo: boolean;
  jumpPointInfo: boolean;
}

export interface ModeState {
  currentMode: Mode;
  viewMode: ViewMode;
  features: ModeFeatures;
  dataSource: { type: Mode; content: Record<string, any> } | null;
  objects: Map<string, any>;
  selectedObject: string | null;
  hoveredObject: string | null;
  detailLevel: 'low' | 'medium' | 'high';
}

export interface ViewModeState {
  currentViewMode: string;
  scaling: {
    STAR_SCALE: number;
    PLANET_SCALE: number;
    MOON_SCALE: number;
    ORBITAL_SCALE: number;
    STAR_SHADER_SCALE: number;
  };
} 