export interface EngineConfig {
  debug: boolean;
  maxFPS: number;
  antialias: boolean;
  shadows: boolean;
}

export interface Scene {
  id: string;
}

export interface EngineState {
  isInitialized: boolean;
  isRunning: boolean;
  config: EngineConfig;
  scenes: Record<string, Scene>;
  currentScene: string;
  error: string | null;
} 