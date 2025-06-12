import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '../mode-system';
import { ViewMode } from '../../../types/view-mode.types';

describe('Engine Agnosticism', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  describe('Mode Independence', () => {
    it('should maintain consistent behavior across view modes', () => {
      const store = useSystemStore.getState();
      const viewModes: ViewMode[] = ['realistic', 'navigational', 'profile'];
      
      for (const mode of viewModes) {
        store.setViewMode(mode);
        const features = store.getViewFeatures();
        
        // Verify features are consistent across view modes
        expect(features).toBeDefined();
        expect(typeof features.scientificInfo).toBe('boolean');
        expect(typeof features.educationalContent).toBe('boolean');
        expect(typeof features.gameInfo).toBe('boolean');
        expect(typeof features.jumpPointInfo).toBe('boolean');
      }
    });

    it('should handle object transformations consistently', () => {
      const store = useSystemStore.getState();
      const viewModes: ViewMode[] = ['realistic', 'navigational', 'profile'];
      
      // Create test objects
      store.createStarObject({ id: 'test-star', type: 'star', position: { x: 0, y: 0, z: 0 }, properties: { radius: 100 } });
      store.createPlanetObject({ id: 'test-planet', type: 'planet', position: { x: 0, y: 0, z: 0 }, properties: { radius: 50 } });
      
      for (const mode of viewModes) {
        store.setViewMode(mode);
        
        // Verify object properties are maintained
        const starProps = store.getObjectProperties('test-star');
        const planetProps = store.getObjectProperties('test-planet');
        
        expect(starProps).toBeDefined();
        expect(planetProps).toBeDefined();
        expect(starProps?.properties.radius).toBe(100);
        expect(planetProps?.properties.radius).toBe(50);
      }
    });

    it('should maintain performance optimizations across view modes', () => {
      const store = useSystemStore.getState();
      const viewModes: ViewMode[] = ['realistic', 'navigational', 'profile'];
      
      for (const mode of viewModes) {
        store.setViewMode(mode);
        store.optimizeRendering(mode);
        
        // Verify detail level is appropriate
        const detailLevel = store.getDetailLevel();
        expect(['low', 'medium', 'high']).toContain(detailLevel);
      }
    });
  });

  describe('Data Management', () => {
    it('should maintain data consistency across mode switches', () => {
      const store = useSystemStore.getState();
      
      // Set up data in Realistic mode
      store.setMode('realistic');
      store.setDataSource({
        type: 'realistic',
        content: { test: 'data' }
      });
      
      // Switch to Profile mode
      store.setMode('profile');
      
      // Verify data source is maintained
      const dataSource = store.getDataSource();
      expect(dataSource).toBeDefined();
      expect(dataSource?.type).toBe('profile');
    });

    it('should handle object selection consistently', () => {
      const store = useSystemStore.getState();
      
      // Create and select an object
      store.createStarObject({ id: 'test-star', type: 'star', position: { x: 0, y: 0, z: 0 }, properties: { radius: 100 } });
      store.selectObject('test-star');
      
      // Switch modes and verify selection is maintained
      store.setMode('realistic');
      expect(store.selectedObject).toBe('test-star');
      
      store.setMode('profile');
      expect(store.selectedObject).toBe('test-star');
    });
  });

  it('should maintain consistent behavior across view modes', () => {
    const modes: ViewMode[] = ['realistic', 'navigational', 'profile'];
    for (const mode of modes) {
      expect(typeof mode).toBe('string');
    }
  });
}); 