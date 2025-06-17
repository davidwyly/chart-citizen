import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '../mode-system';
import type { Mode } from '../../../types/mode';
import type { ViewMode } from '../../../types/view-mode.types';

describe('Mode Features', () => {
  beforeEach(() => {
    // Reset store before each test
    useSystemStore.getState().reset();
  });

  describe('Feature Toggles', () => {
    it('should toggle features correctly', () => {
      const store = useSystemStore.getState();
      
      // Test each feature
      store.toggleFeature('scientificInfo');
      expect(store.getViewFeatures().scientificInfo).toBe(true);
      
      store.toggleFeature('educationalContent');
      expect(store.getViewFeatures().educationalContent).toBe(true);
      
      store.toggleFeature('gameInfo');
      expect(store.getViewFeatures().gameInfo).toBe(true);
      
      store.toggleFeature('jumpPointInfo');
      expect(store.getViewFeatures().jumpPointInfo).toBe(true);
    });

    it('should set appropriate features when switching modes', () => {
      const store = useSystemStore.getState();
      
      // Set up features in Realistic mode
      store.setMode('realistic');
      const realisticFeatures = store.getViewFeatures();
      expect(realisticFeatures.scientificInfo).toBe(true);
      expect(realisticFeatures.educationalContent).toBe(true);
      
      // Switch to Profile mode
      store.setMode('profile');
      const profileFeatures = store.getViewFeatures();
      
      // Verify profile mode features are set correctly
      expect(profileFeatures.gameInfo).toBe(true);
      expect(profileFeatures.jumpPointInfo).toBe(true);
      expect(profileFeatures.scientificInfo).toBe(false);
      expect(profileFeatures.educationalContent).toBe(false);
    });
  });

  describe('View Mode Features', () => {
    it('should apply correct features for each view mode', () => {
      const store = useSystemStore.getState();
      const viewModes: ViewMode[] = ['explorational', 'navigational', 'profile'];
      
      for (const mode of viewModes) {
        store.setViewMode(mode);
        const features = store.getViewFeatures();
        
        // Verify features are appropriate for the mode
        expect(features).toBeDefined();
        expect(typeof features.scientificInfo).toBe('boolean');
        expect(typeof features.educationalContent).toBe('boolean');
        expect(typeof features.gameInfo).toBe('boolean');
        expect(typeof features.jumpPointInfo).toBe('boolean');
      }
    });

    it('should set appropriate features for each view mode', () => {
      const store = useSystemStore.getState();
      const viewModes: ViewMode[] = ['explorational', 'navigational', 'profile'];
      
      for (const mode of viewModes) {
        store.setViewMode(mode);
        // Get fresh store state to check features
        const updatedStore = useSystemStore.getState();
        const features = updatedStore.getViewFeatures();
        
        // Verify each view mode has its expected feature set
        if (mode === 'explorational') {
          expect(features.scientificInfo).toBe(true);
          expect(features.educationalContent).toBe(true);
          expect(features.gameInfo).toBe(false);
          expect(features.jumpPointInfo).toBe(false);
        } else if (mode === 'navigational') {
          expect(features.scientificInfo).toBe(true);
          expect(features.educationalContent).toBe(false);
          expect(features.gameInfo).toBe(false);
          expect(features.jumpPointInfo).toBe(true);
        } else if (mode === 'profile') {
          expect(features.scientificInfo).toBe(false);
          expect(features.educationalContent).toBe(false);
          expect(features.gameInfo).toBe(true);
          expect(features.jumpPointInfo).toBe(true);
        }
      }
    });
  });

  describe('Data Management', () => {
    it('should handle data sources correctly', () => {
      const store = useSystemStore.getState();
      
      // Set data source for Realistic mode
      store.setDataSource({
        type: 'realistic',
        content: { test: 'data' }
      });
      
      // Verify data source
      const dataSource = store.getDataSource();
      expect(dataSource).toBeDefined();
      expect(dataSource?.type).toBe('realistic');
      expect(dataSource?.content).toEqual({ test: 'data' });
      
      // Switch to Profile mode
      store.setMode('profile');
      
      // Set data source for Profile mode
      store.setDataSource({
        type: 'profile',
        content: { profile: 'data' }
      });
      
      // Verify new data source
      const newDataSource = store.getDataSource();
      expect(newDataSource).toBeDefined();
      expect(newDataSource?.type).toBe('profile');
      expect(newDataSource?.content).toEqual({ profile: 'data' });
    });
  });

  describe('Realistic Mode Features', () => {
    it('should provide scientific information in realistic mode', () => {
      const store = useSystemStore.getState();
      store.setMode('realistic');
      
      const features = store.getViewFeatures();
      expect(features.scientificInfo).toBe(true);
      expect(features.educationalContent).toBe(true);
      expect(features.gameInfo).toBe(false);
      expect(features.jumpPointInfo).toBe(false);
    });

    it('should handle scientific data correctly', () => {
      const store = useSystemStore.getState();
      store.setMode('realistic');
      
      // Set up scientific data
      const scientificData = {
        id: 'scientific-data',
        type: 'realistic' as const,
        content: {
          spectralType: 'G2V',
          temperature: 5778,
          mass: 1.989e30,
          radius: 696340
        }
      };
      
      store.setDataSource(scientificData);
      expect(store.getDataSource()?.type).toBe('realistic');
      expect(store.getDataSource()?.content).toHaveProperty('spectralType');
    });

    it('should maintain scientific accuracy in view modes', () => {
      const store = useSystemStore.getState();
      store.setMode('realistic');
      
      // Test each view mode
      const viewModes = ['explorational', 'navigational', 'profile'] as const;
      
      for (const viewMode of viewModes) {
        store.setViewMode(viewMode);
        const scaling = store.getViewModeScaling();
        
        // Verify scaling values are positive
        expect(scaling.STAR_SCALE).toBeGreaterThan(0);
        expect(scaling.PLANET_SCALE).toBeGreaterThan(0);
        expect(scaling.MOON_SCALE).toBeGreaterThan(0);
        expect(scaling.ORBITAL_SCALE).toBeGreaterThan(0);
        
        // In non-explorational modes, verify hierarchical scaling
        if (viewMode !== 'explorational') {
          expect(scaling.STAR_SCALE).toBeGreaterThan(scaling.PLANET_SCALE);
          expect(scaling.PLANET_SCALE).toBeGreaterThan(scaling.MOON_SCALE);
        }
      }
    });
  });

  describe('Profile Mode Features', () => {
    it('should provide profile-specific information in profile mode', () => {
      const store = useSystemStore.getState();
      store.setMode('profile');
      
      const features = store.getViewFeatures();
      expect(features.gameInfo).toBe(true);
      expect(features.jumpPointInfo).toBe(true);
      expect(features.scientificInfo).toBe(false);
      expect(features.educationalContent).toBe(false);
    });

    it('should handle profile data correctly', () => {
      const store = useSystemStore.getState();
      store.setMode('profile');
      
      // Set up profile data
      const profileData = {
        id: 'profile-data',
        type: 'profile' as const,
        content: {
          systemName: 'Stanton',
          jumpPoints: ['Stanton-Terra', 'Stanton-Pyro'],
          securityLevel: 'High',
          population: 'High'
        }
      };
      
      store.setDataSource(profileData);
      expect(store.getDataSource()?.type).toBe('profile');
      expect(store.getDataSource()?.content).toHaveProperty('systemName');
    });
  });
}); 