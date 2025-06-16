import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';
import type { Mode } from '@/engine/core/mode-system/types';
import type { ViewType } from '@/lib/types/effects-level';

describe('Setup System', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const store = useSystemStore.getState();
      
      expect(store.getMode()).toBe('realistic');
      expect(store.getViewMode()).toBe('explorational');
      expect(store.getViewFeatures()).toBeDefined();
      expect(store.getDataSource()).toBeNull();
    });
  });

  describe('Mode Management', () => {
    it('should handle mode switches correctly', () => {
      const store = useSystemStore.getState();
      
      store.setMode('realistic');
      expect(store.getMode()).toBe('realistic');
      
      store.setMode('navigational');
      expect(store.getMode()).toBe('navigational');
      
      store.setMode('profile');
      expect(store.getMode()).toBe('profile');
    });
  });

  describe('View Mode Management', () => {
    it('should handle view mode switches correctly', () => {
      const store = useSystemStore.getState();
      
      store.setViewMode('explorational');
      expect(store.getViewMode()).toBe('explorational');
      
      store.setViewMode('navigational');
      expect(store.getViewMode()).toBe('navigational');
      
      store.setViewMode('profile');
      expect(store.getViewMode()).toBe('profile');
    });
  });

  describe('Feature Management', () => {
    it('should toggle features correctly', () => {
      const store = useSystemStore.getState();
      
      store.toggleFeature('scientificInfo');
      expect(store.getViewFeatures().scientificInfo).toBe(true);
      
      store.toggleFeature('educationalContent');
      expect(store.getViewFeatures().educationalContent).toBe(true);
    });
  });

  describe('Data Management', () => {
    it('should handle data sources correctly', () => {
      const store = useSystemStore.getState();
      
      const testData = {
        type: 'realistic' as Mode,
        content: { test: 'data' }
      };
      
      store.setDataSource(testData);
      expect(store.getDataSource()).toEqual(testData);
    });
  });

  describe('Object Management', () => {
    it('should handle object creation and management', () => {
      const store = useSystemStore.getState();
      
      store.createStarObject({ type: 'star', position: { x: 0, y: 0, z: 0 } });
      store.createPlanetObject({ type: 'planet', position: { x: 1, y: 1, z: 1 } });
      
      const objects = Array.from(store.objects.values());
      expect(objects.length).toBe(2);
    });
  });

  describe('Performance', () => {
    it('should handle detail level changes', () => {
      const store = useSystemStore.getState();
      
      store.optimizeRendering('profile');
      expect(store.getDetailLevel()).toBe('low');
      
      store.optimizeRendering('explorational');
      expect(store.getDetailLevel()).toBe('medium');
    });
  });
}); 