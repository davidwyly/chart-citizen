import { describe, it, expect, vi } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';
import type { ViewType } from '@/engine/lib/types/effects-level';

describe('Mode System', () => {
  describe('View Mode Management', () => {
    it('should handle view mode changes correctly', () => {
      const store = useSystemStore.getState();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test realistic mode
      store.setViewMode('realistic' as ViewType);
      expect(store.getViewMode()).toBe('realistic');
      expect(store.getViewFeatures().scientificInfo).toBe(true);
      expect(store.getViewFeatures().educationalContent).toBe(true);
      
      // Test navigational mode
      store.setViewMode('navigational' as ViewType);
      expect(store.getViewMode()).toBe('navigational');
      expect(store.getViewFeatures().scientificInfo).toBe(true);
      expect(store.getViewFeatures().jumpPointInfo).toBe(true);
      
      // Test profile mode
      store.setViewMode('profile' as ViewType);
      expect(store.getViewMode()).toBe('profile');
      expect(store.getViewFeatures().gameInfo).toBe(true);
      expect(store.getViewFeatures().jumpPointInfo).toBe(true);
      
      consoleError.mockRestore();
    });
  });
}); 