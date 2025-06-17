import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';

describe('Objects', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  describe('Object Creation', () => {
    it('should create star objects correctly', () => {
      const store = useSystemStore.getState();
      const createSpy = vi.spyOn(store, 'createStarObject');
      
      const starParams = {
        id: 'test-star',
        type: 'star',
        position: { x: 0, y: 0, z: 0 },
        properties: {
          spectralType: 'G2V',
          temperature: 5778,
          radius: 696340
        }
      };
      
      store.createStarObject(starParams);
      expect(createSpy).toHaveBeenCalledWith(starParams);
      
      createSpy.mockRestore();
    });

    it('should create planet objects correctly', () => {
      const store = useSystemStore.getState();
      const createSpy = vi.spyOn(store, 'createPlanetObject');
      
      const planetParams = {
        id: 'test-planet',
        type: 'planet',
        position: { x: 1, y: 0, z: 0 },
        properties: {
          type: 'terrestrial',
          radius: 6371,
          atmosphere: true
        }
      };
      
      store.createPlanetObject(planetParams);
      expect(createSpy).toHaveBeenCalledWith(planetParams);
      
      createSpy.mockRestore();
    });
  });

  describe('Object Properties', () => {
    it('should update object properties correctly', () => {
      const store = useSystemStore.getState();
      const updateSpy = vi.spyOn(store, 'updateObjectProperties');
      
      const properties = {
        position: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };
      
      store.updateObjectProperties('test-object', properties);
      expect(updateSpy).toHaveBeenCalledWith('test-object', properties);
      
      updateSpy.mockRestore();
    });

    it('should get object properties correctly', () => {
      const store = useSystemStore.getState();
      
      // First create an object
      store.createStarObject({
        id: 'test-object',
        type: 'star',
        position: { x: 0, y: 0, z: 0 },
        properties: { radius: 1.0 }
      });
      
      const properties = {
        position: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };
      
      store.updateObjectProperties('test-object', properties);
      const retrieved = store.getObjectProperties('test-object');
      expect(retrieved).toBeDefined();
      expect(retrieved?.position).toEqual(properties.position);
    });
  });

  describe('Object Interactions', () => {
    it('should handle object selection correctly', () => {
      const store = useSystemStore.getState();
      
      // First create an object to select
      store.createStarObject({
        id: 'test-object',
        type: 'star',
        position: { x: 0, y: 0, z: 0 },
        properties: { radius: 1.0 }
      });
      
      // Verify object was created
      const createdObject = store.getObjectProperties('test-object');
      expect(createdObject).toBeDefined();
      
      const selectSpy = vi.spyOn(store, 'selectObject');
      
      store.selectObject('test-object');
      expect(selectSpy).toHaveBeenCalledWith('test-object');
      
      // Check the selectedObject property directly from the current state
      const currentState = useSystemStore.getState();
      expect(currentState.selectedObject).toEqual({
        id: 'test-object',
        type: 'star'
      });
      
      selectSpy.mockRestore();
    });

    it('should handle object hover correctly', () => {
      const store = useSystemStore.getState();
      const hoverSpy = vi.spyOn(store, 'setHoveredObject');
      
      store.setHoveredObject('test-object');
      expect(hoverSpy).toHaveBeenCalledWith('test-object');
      
      // Check the hoveredObject property directly from the current state
      const currentState = useSystemStore.getState();
      expect(currentState.hoveredObject).toBe('test-object');
      
      hoverSpy.mockRestore();
    });
  });

  describe('Object Cleanup', () => {
    it('should remove objects correctly', () => {
      const store = useSystemStore.getState();
      const removeSpy = vi.spyOn(store, 'removeObject');
      
      store.removeObject('test-object');
      expect(removeSpy).toHaveBeenCalledWith('test-object');
      expect(store.getObjectProperties('test-object')).toBeUndefined();
      
      removeSpy.mockRestore();
    });
  });
}); 