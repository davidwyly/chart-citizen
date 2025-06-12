import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Mode, ModeState, ModeFeatures } from '../../../types/mode';

describe('Mode System', () => {
  let modeState: ModeState;

  beforeEach(() => {
    modeState = {
      mode: 'realistic',
      dataSource: null,
      selectedObject: null,
      systemData: null,
      features: {
        scientificInfo: true,
        educationalContent: true,
        gameInfo: false,
        jumpPointInfo: false
      },
      viewMode: 'realistic',
      objects: new Map(),
      hoveredObject: null,
      detailLevel: 'medium'
    };
  });

  it('should initialize with realistic mode by default', () => {
    expect(modeState.mode).toBe('realistic');
    expect(modeState.features.scientificInfo).toBe(true);
    expect(modeState.features.educationalContent).toBe(true);
    expect(modeState.features.gameInfo).toBe(false);
    expect(modeState.features.jumpPointInfo).toBe(false);
  });

  it('should switch modes correctly', () => {
    modeState.mode = 'navigational';
    modeState.features = {
      scientificInfo: true,
      educationalContent: false,
      gameInfo: false,
      jumpPointInfo: true
    };
    expect(modeState.mode).toBe('navigational');
    expect(modeState.features.jumpPointInfo).toBe(true);
    
    modeState.mode = 'profile';
    modeState.features = {
      scientificInfo: false,
      educationalContent: false,
      gameInfo: true,
      jumpPointInfo: true
    };
    expect(modeState.mode).toBe('profile');
    expect(modeState.features.gameInfo).toBe(true);
  });

  it('should maintain state properties when switching modes', () => {
    modeState.mode = 'navigational';
    expect(modeState.selectedObject).toBe(null);
    expect(modeState.systemData).toBe(null);
    expect(modeState.objects.size).toBe(0);
    expect(modeState.hoveredObject).toBe(null);
    expect(modeState.detailLevel).toBe('medium');
  });
}); 