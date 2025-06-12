import { create } from 'zustand';
import { EngineConfig, EngineState, Scene } from '../types/engine';

interface EngineStore extends EngineState {
  setConfig: (config: Partial<EngineConfig>) => void;
  addScene: (scene: Scene) => void;
  removeScene: (id: string) => void;
  setCurrentScene: (id: string) => void;
  initialize: () => Promise<void>;
  start: () => void;
  stop: () => void;
  setError: (error: string | null) => void;
}

export const useEngineStore = create<EngineStore>((set, get) => ({
  isInitialized: false,
  isRunning: false,
  config: {
    debug: false,
    maxFPS: 60,
    antialias: true,
    shadows: true,
  },
  scenes: {},
  currentScene: '',
  error: null,

  setConfig: (config) => {
    set((state) => ({
      config: { ...state.config, ...config },
    }));
  },

  addScene: (scene) => {
    set((state) => ({
      scenes: { ...state.scenes, [scene.id]: scene },
    }));
  },

  removeScene: (id) => {
    set((state) => {
      const { [id]: removed, ...remaining } = state.scenes;
      return { scenes: remaining };
    });
  },

  setCurrentScene: (id) => {
    const state = get();
    if (!state.scenes[id]) {
      set({ error: `Scene "${id}" not found` });
      return;
    }
    set({ currentScene: id, error: null });
  },

  initialize: async () => {
    try {
      // Initialize engine components here
      set({ isInitialized: true, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Initialization failed' });
      throw error;
    }
  },

  start: () => {
    const state = get();
    if (!state.isInitialized) {
      set({ error: 'Engine must be initialized before starting' });
      return;
    }
    set({ isRunning: true, error: null });
  },

  stop: () => {
    set({ isRunning: false });
  },

  setError: (error) => {
    set({ error });
  },
})); 