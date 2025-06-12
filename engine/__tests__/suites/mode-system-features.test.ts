import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';

describe('Mode System Features', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  it('should switch between view modes correctly', () => {
    const store = useSystemStore.getState();
    
    // Test Realistic mode
    store.setViewMode('realistic');
    let features = store.getViewFeatures();
    expect(features.scientificInfo).toBe(true);
    expect(features.gameInfo).toBe(false);
    
    // Test Navigational mode
    store.setViewMode('navigational');
    features = store.getViewFeatures();
    expect(features.scientificInfo).toBe(true);
    expect(features.jumpPointInfo).toBe(true);
    
    // Test Profile mode
    store.setViewMode('profile');
    features = store.getViewFeatures();
    expect(features.scientificInfo).toBe(false);
    expect(features.gameInfo).toBe(true);
  });

  it('should handle mode-specific data correctly', () => {
    const store = useSystemStore.getState();
    
    // Test Realistic mode data
    store.setViewMode('realistic');
    const scientificData = {
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
    
    // Test Profile mode data
    store.setViewMode('profile');
    const gameData = {
      type: 'profile' as const,
      content: {
        systemName: 'Stanton',
        jumpPoints: ['Stanton-Terra', 'Stanton-Pyro'],
        securityLevel: 'High',
        population: 'High'
      }
    };
    store.setDataSource(gameData);
    expect(store.getDataSource()?.type).toBe('profile');
  });
}); 