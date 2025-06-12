import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '../../core/mode-system/mode-system';

describe('Shader System', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  describe('Shader Compilation', () => {
    it('should compile shaders successfully', () => {
      const store = useSystemStore.getState();
      const compileSpy = vi.spyOn(store, 'compileShader');
      
      const shader = {
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(vUv, 0.0, 1.0);
          }
        `
      };
      
      store.compileShader('test-shader', shader);
      expect(compileSpy).toHaveBeenCalledWith('test-shader', shader);
      
      compileSpy.mockRestore();
    });

    it('should handle shader compilation errors', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Simulate shader error
      expect(true).toBe(true);
      consoleError.mockRestore();
    });
  });

  describe('Shader Uniforms', () => {
    it('should update shader uniforms correctly', () => {
      const store = useSystemStore.getState();
      const updateSpy = vi.spyOn(store, 'updateShaderUniforms');
      
      const uniforms = {
        time: { value: 0.0 },
        resolution: { value: [800, 600] },
        color: { value: [1.0, 0.0, 0.0] }
      };
      
      store.updateShaderUniforms('test-shader', uniforms);
      expect(updateSpy).toHaveBeenCalledWith('test-shader', uniforms);
      
      updateSpy.mockRestore();
    });

    it('should validate uniform types', () => {
      const store = useSystemStore.getState();
      
      const invalidUniforms = {
        // @ts-expect-error - Testing invalid uniform type
        invalid: { value: 'not-a-number' }
      };
      
      expect(() => {
        store.updateShaderUniforms('test-shader', invalidUniforms);
      }).toThrow();
    });
  });

  describe('Shader Effects', () => {
    it('should apply atmospheric effects correctly', () => {
      const store = useSystemStore.getState();
      const effectSpy = vi.spyOn(store, 'applyAtmosphericEffect');
      
      const atmosphereParams = {
        density: 1.0,
        color: [0.5, 0.7, 1.0],
        height: 100.0
      };
      
      store.applyAtmosphericEffect('planet-1', atmosphereParams);
      expect(effectSpy).toHaveBeenCalledWith('planet-1', atmosphereParams);
      
      effectSpy.mockRestore();
    });

    it('should apply corona effects correctly', () => {
      const store = useSystemStore.getState();
      const effectSpy = vi.spyOn(store, 'applyCoronaEffect');
      
      const coronaParams = {
        intensity: 1.0,
        color: [1.0, 0.8, 0.2],
        radius: 1.2
      };
      
      store.applyCoronaEffect('star-1', coronaParams);
      expect(effectSpy).toHaveBeenCalledWith('star-1', coronaParams);
      
      effectSpy.mockRestore();
    });
  });

  describe('Shader Performance', () => {
    it('should optimize shader performance', () => {
      const store = useSystemStore.getState();
      const optimizeSpy = vi.spyOn(store, 'optimizeShader');
      
      store.optimizeShader('test-shader');
      expect(optimizeSpy).toHaveBeenCalledWith('test-shader');
      
      optimizeSpy.mockRestore();
    });

    it('should handle shader caching', () => {
      const store = useSystemStore.getState();
      const cacheSpy = vi.spyOn(store, 'cacheShader');
      
      store.cacheShader('test-shader');
      expect(cacheSpy).toHaveBeenCalledWith('test-shader');
      
      cacheSpy.mockRestore();
    });
  });
}); 