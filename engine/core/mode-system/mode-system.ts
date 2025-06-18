import { create } from 'zustand';
import { Mode, ModeState, ModeFeatures } from '../../types/mode';
import { ViewMode } from '../../types/view-mode.types';
import { viewModeRegistry } from '../view-modes/registry';

const DEFAULT_FEATURES: ModeFeatures = {
  scientificInfo: false,
  educationalContent: false,
  gameInfo: false,
  jumpPointInfo: false,
};

const EXPLORATIONAL_FEATURES: ModeFeatures = {
  scientificInfo: true,
  educationalContent: true,
  gameInfo: false,
  jumpPointInfo: false,
};

const NAVIGATIONAL_FEATURES: ModeFeatures = {
  scientificInfo: true,
  educationalContent: false,
  gameInfo: false,
  jumpPointInfo: true,
};

const PROFILE_FEATURES: ModeFeatures = {
  scientificInfo: false,
  educationalContent: false,
  gameInfo: true,
  jumpPointInfo: true,
};

interface SystemStore extends ModeState {
  // Mode Management
  setMode: (mode: Mode) => void;
  getMode: () => Mode;
  reset: () => void;
  
  // View Mode Management
  setViewMode: (mode: ViewMode) => void;
  getViewMode: () => ViewMode;
  transitionViewMode: (mode: ViewMode) => void;
  
  // Feature Management
  toggleFeature: (feature: keyof ModeFeatures) => void;
  getViewFeatures: () => ModeFeatures;
  
  // Data Management
  setDataSource: (data: { type: Mode; content: Record<string, any> }) => void;
  getDataSource: () => { type: Mode; content: Record<string, any> } | null;
  
  // Object Management
  createStarObject: (params: any) => void;
  createPlanetObject: (params: any) => void;
  getObjectProperties: (id: string) => Record<string, any> | undefined;
  updateObjectProperties: (id: string, properties: Record<string, any>) => void;
  removeObject: (id: string) => void;
  
  // Interaction Management
  selectObject: (id: string) => void;
  setHoveredObject: (id: string | null) => void;
  getHoveredObject: () => string | null;
  
  // View Mode Scaling
  getViewModeScaling: () => Record<string, number>;
  
  // Performance
  optimizeRendering: (mode: ViewMode) => void;
  getDetailLevel: () => 'low' | 'medium' | 'high';
  
  // Camera Control
  orbitCamera: (params: { target: { x: number; y: number; z: number }; radius: number }) => void;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  mode: 'realistic',
  viewMode: 'explorational',
  features: { ...DEFAULT_FEATURES },
  dataSource: null,
  objects: new Map(),
  selectedObject: null,
  hoveredObject: null,
  detailLevel: 'medium',
  systemData: null,

  setMode: (mode) => {
    set((state) => {
      const features = mode === 'realistic' ? EXPLORATIONAL_FEATURES :
                      mode === 'navigational' ? NAVIGATIONAL_FEATURES :
                      PROFILE_FEATURES;
      return {
        mode,
        features,
        dataSource: null
      };
    });
  },

  getMode: () => get().mode,

  reset: () => {
    set({
      mode: 'realistic',
      viewMode: 'explorational',
      features: { ...DEFAULT_FEATURES },
      dataSource: null,
      objects: new Map(),
      selectedObject: null,
      hoveredObject: null,
      detailLevel: 'medium',
      systemData: null
    });
  },

  setViewMode: (mode) => {
    set((state) => {
      const features = mode === 'explorational' ? EXPLORATIONAL_FEATURES :
                      mode === 'navigational' ? NAVIGATIONAL_FEATURES :
                      PROFILE_FEATURES;
      return {
        viewMode: mode,
        features
      };
    });
  },

  getViewMode: () => get().viewMode,

  transitionViewMode: (mode) => {
    set({ viewMode: mode });
  },

  toggleFeature: (feature) => {
    set((state) => ({
      features: {
        ...state.features,
        [feature]: !state.features[feature]
      }
    }));
  },

  getViewFeatures: () => get().features,

  setDataSource: (data) => {
    set({ dataSource: data });
  },

  getDataSource: () => get().dataSource,

  createStarObject: (params) => {
    const id = params.id || `star-${Date.now()}`;
    const state = get();
    const stars = Array.from(state.objects.values()).filter(obj => obj.type === 'star');
    
    // Calculate position based on binary/triple star system
    let position = params.position;
    if (!position) {
      if (stars.length === 1) {
        // Second star in binary system
        const separation = 5; // Default separation for binary stars
        position = { x: separation/2, y: 0, z: 0 };
      } else if (stars.length === 2) {
        // Third star in triple system
        const angle = (2 * Math.PI) / 3; // 120 degrees
        const separation = 5;
        position = {
          x: Math.cos(angle) * separation,
          y: 0,
          z: Math.sin(angle) * separation
        };
      } else {
        position = { x: 0, y: 0, z: 0 };
      }
    }
    
    set((state) => ({
      objects: new Map(state.objects).set(id, { 
        ...params, 
        id,
        type: 'star',
        position,
        properties: {
          ...params.properties,
          isBinary: stars.length === 1,
          isTertiary: stars.length === 2
        }
      })
    }));
  },

  createPlanetObject: (params) => {
    const id = params.id || `planet-${Date.now()}`;
    set((state) => ({
      objects: new Map(state.objects).set(id, { 
        ...params, 
        id,
        type: 'planet'
      })
    }));
  },

  getObjectProperties: (id) => get().objects.get(id),

  updateObjectProperties: (id, properties) => {
    set((state) => {
      const object = state.objects.get(id);
      if (!object) return state;
      return {
        objects: new Map(state.objects).set(id, { ...object, ...properties })
      };
    });
  },

  removeObject: (id) => {
    set((state) => {
      const newObjects = new Map(state.objects);
      newObjects.delete(id);
      return { objects: newObjects };
    });
  },

  selectObject: (id) => {
    const object = get().objects.get(id);
    if (!object) return;
    
    set({
      selectedObject: {
        id,
        type: object.type
      }
    });
  },

  setHoveredObject: (id) => {
    set({ hoveredObject: id });
  },

  getHoveredObject: () => get().hoveredObject,

  getViewModeScaling: () => {
    const viewMode = get().viewMode;
    const mode = viewModeRegistry.get(viewMode);
    if (!mode || !mode.objectScaling || !mode.orbital) {
      console.warn(`Failed to get view mode scaling for "${viewMode}", using fallback values`);
      return {
        ORBITAL_SCALE: 1.0,
        STAR_SCALE: 1.0,
        PLANET_SCALE: 1.0,
        MOON_SCALE: 1.0,
        STAR_SHADER_SCALE: 1.0
      };
    }
    
    return {
      ORBITAL_SCALE: mode.orbital.factor || 1.0,
      STAR_SCALE: mode.objectScaling.star || 1.0,
      PLANET_SCALE: mode.objectScaling.planet || 1.0,
      MOON_SCALE: mode.objectScaling.moon || 1.0,
      STAR_SHADER_SCALE: mode.objectScaling.star || 1.0
    } as Record<string, number>;
  },

  optimizeRendering: (mode) => {
    set((state) => ({
      detailLevel: mode === 'profile' ? 'low' : 'medium'
    }));
  },

  getDetailLevel: () => get().detailLevel,

  orbitCamera: (params) => {
    // Implementation depends on the rendering engine
  }
})); 