export type Mode = 'realistic' | 'navigational' | 'profile';

export interface ModeFeatures {
  scientificInfo: boolean;
  educationalContent: boolean;
  gameInfo: boolean;
  jumpPointInfo: boolean;
}

export interface ModeState {
  mode: Mode;
  dataSource: DataSource | null;
  selectedObject: SelectedObject | null;
  systemData: SystemData | null;
  features: ModeFeatures;
  viewMode: Mode;
  objects: Map<string, any>;
  hoveredObject: string | null;
  detailLevel: 'low' | 'medium' | 'high';
}

export interface DataSource {
  type: Mode;
  content: Record<string, unknown>;
}

export interface SelectedObject {
  id: string;
  type: 'star' | 'planet' | 'moon' | 'jump-point';
}

export interface SystemData {
  name: string;
  objects: CelestialObject[];
}

export interface CelestialObject {
  id: string;
  type: 'star' | 'planet' | 'moon' | 'jump-point';
  name: string;
  position: [number, number, number];
  radius: number;
  mass: number;
  orbit?: {
    parentId: string;
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
  };
} 