import { describe, it, expect, beforeEach } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';

describe('View Mode Features', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  it('should have correct features for realistic mode', () => {
    const store = useSystemStore.getState();
    store.setMode('realistic');
    
    const features = store.getViewFeatures();
    expect(features).toEqual({
      scientificInfo: true,
      educationalContent: true,
      gameInfo: false,
      jumpPointInfo: false
    });
  });

  it('should have correct features for navigational mode', () => {
    const store = useSystemStore.getState();
    store.setMode('navigational');
    
    const features = store.getViewFeatures();
    expect(features).toEqual({
      scientificInfo: true,
      educationalContent: false,
      gameInfo: false,
      jumpPointInfo: true
    });
  });

  it('should have correct features for profile mode', () => {
    const store = useSystemStore.getState();
    store.setMode('profile');
    
    const features = store.getViewFeatures();
    expect(features).toEqual({
      scientificInfo: false,
      educationalContent: false,
      gameInfo: true,
      jumpPointInfo: true
    });
  });

  it('should have correct features for scientific view mode', () => {
    const store = useSystemStore.getState();
    store.setViewMode('scientific');
    
    const features = store.getViewFeatures();
    expect(features).toEqual({
      scientificInfo: true,
      educationalContent: true,
      gameInfo: false,
      jumpPointInfo: false
    });
  });
  
  it('should allow toggling individual features', () => {
    const store = useSystemStore.getState();
    store.setMode('realistic');
    
    // Toggle scientific info off
    store.toggleFeature('scientificInfo');
    expect(store.getViewFeatures().scientificInfo).toBe(false);
    
    // Toggle it back on
    store.toggleFeature('scientificInfo');
    expect(store.getViewFeatures().scientificInfo).toBe(true);
  });
  
  it('should maintain view mode consistency when switching modes', () => {
    const store = useSystemStore.getState();
    
    // Test scientific mode maintains correct features
    store.setViewMode('scientific');
    let features = store.getViewFeatures();
    expect(features.scientificInfo).toBe(true);
    expect(features.educationalContent).toBe(true);
    expect(features.gameInfo).toBe(false);
    
    // Switch to navigational and back
    store.setViewMode('navigational');
    store.setViewMode('scientific');
    features = store.getViewFeatures();
    expect(features.scientificInfo).toBe(true);
    expect(features.educationalContent).toBe(true);
  });
}); 