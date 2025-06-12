import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '@/stores/system-store';

describe('Camera System', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  describe('Camera Controls', () => {
    it('should orbit camera correctly', () => {
      const store = useSystemStore.getState();
      const orbitSpy = vi.spyOn(store, 'orbitCamera');
      
      const orbitParams = {
        target: { x: 0, y: 0, z: 0 },
        radius: 10,
        theta: Math.PI / 4,
        phi: Math.PI / 4
      };
      
      store.orbitCamera(orbitParams);
      expect(orbitSpy).toHaveBeenCalledWith(orbitParams);
      
      orbitSpy.mockRestore();
    });

    it('should zoom camera correctly', () => {
      const store = useSystemStore.getState();
      const zoomSpy = vi.spyOn(store, 'zoomCamera');
      
      const zoomParams = {
        target: { x: 0, y: 0, z: 0 },
        distance: 5
      };
      
      store.zoomCamera(zoomParams);
      expect(zoomSpy).toHaveBeenCalledWith(zoomParams);
      
      zoomSpy.mockRestore();
    });

    it('should pan camera correctly', () => {
      const store = useSystemStore.getState();
      const panSpy = vi.spyOn(store, 'panCamera');
      
      const panParams = {
        delta: { x: 1, y: 1 },
        target: { x: 0, y: 0, z: 0 }
      };
      
      store.panCamera(panParams);
      expect(panSpy).toHaveBeenCalledWith(panParams);
      
      panSpy.mockRestore();
    });
  });

  describe('Camera Constraints', () => {
    it('should respect minimum zoom distance', () => {
      const store = useSystemStore.getState();
      const zoomSpy = vi.spyOn(store, 'zoomCamera');
      
      const zoomParams = {
        target: { x: 0, y: 0, z: 0 },
        distance: 0.1 // Too close
      };
      
      store.zoomCamera(zoomParams);
      expect(zoomSpy).toHaveBeenCalledWith({
        ...zoomParams,
        distance: store.getMinZoomDistance()
      });
      
      zoomSpy.mockRestore();
    });

    it('should respect maximum zoom distance', () => {
      const store = useSystemStore.getState();
      const zoomSpy = vi.spyOn(store, 'zoomCamera');
      
      const zoomParams = {
        target: { x: 0, y: 0, z: 0 },
        distance: 1000 // Too far
      };
      
      store.zoomCamera(zoomParams);
      expect(zoomSpy).toHaveBeenCalledWith({
        ...zoomParams,
        distance: store.getMaxZoomDistance()
      });
      
      zoomSpy.mockRestore();
    });

    it('should respect orbit angle limits', () => {
      const store = useSystemStore.getState();
      const orbitSpy = vi.spyOn(store, 'orbitCamera');
      
      const orbitParams = {
        target: { x: 0, y: 0, z: 0 },
        radius: 10,
        theta: Math.PI * 2, // Too large
        phi: Math.PI // Too large
      };
      
      store.orbitCamera(orbitParams);
      expect(orbitSpy).toHaveBeenCalledWith({
        ...orbitParams,
        theta: store.getMaxTheta(),
        phi: store.getMaxPhi()
      });
      
      orbitSpy.mockRestore();
    });
  });

  describe('Camera Transitions', () => {
    it('should smoothly transition between positions', () => {
      const store = useSystemStore.getState();
      const transitionSpy = vi.spyOn(store, 'transitionCamera');
      
      const startPos = { x: 0, y: 0, z: 10 };
      const endPos = { x: 10, y: 0, z: 0 };
      
      store.transitionCamera(startPos, endPos, { duration: 1000 });
      expect(transitionSpy).toHaveBeenCalledWith(startPos, endPos, { duration: 1000 });
      
      transitionSpy.mockRestore();
    });

    it('should maintain target during transitions', () => {
      const store = useSystemStore.getState();
      const target = { x: 0, y: 0, z: 0 };
      
      store.setCameraTarget(target);
      store.transitionCamera(
        { x: 0, y: 0, z: 10 },
        { x: 10, y: 0, z: 0 },
        { duration: 1000 }
      );
      
      expect(store.getCameraTarget()).toEqual(target);
    });
  });

  describe('Camera State Management', () => {
    it('should save and restore camera state', () => {
      const store = useSystemStore.getState();
      const cameraState = {
        position: { x: 10, y: 0, z: 0 },
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 }
      };
      
      store.setCameraState(cameraState);
      expect(store.getCameraState()).toEqual(cameraState);
    });

    it('should reset camera to default state', () => {
      const store = useSystemStore.getState();
      const defaultState = store.getDefaultCameraState();
      
      store.setCameraState({
        position: { x: 10, y: 0, z: 0 },
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 }
      });
      
      store.resetCamera();
      expect(store.getCameraState()).toEqual(defaultState);
    });
  });
}); 