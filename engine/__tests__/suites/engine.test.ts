import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';

describe('Engine System', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
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