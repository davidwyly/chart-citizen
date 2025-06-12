import { describe, expect, it } from 'vitest';
import { getViewModeScaling } from '@/engine/core/mode-system/view-mode.constants';
import { ViewMode } from '@/engine/types/view-mode.types';

describe('View Modes', () => {
  it('should return correct scaling for realistic mode', () => {
    const scaling = getViewModeScaling('realistic');
    expect(scaling).toEqual({
      STAR_SCALE: 1.0,
      PLANET_SCALE: 1.0,
      MOON_SCALE: 1.0,
      ORBITAL_SCALE: 200.0,
      STAR_SHADER_SCALE: 1.0
    });
  });

  it('should return correct scaling for navigational mode', () => {
    const scaling = getViewModeScaling('navigational');
    expect(scaling).toEqual({
      STAR_SCALE: 4.0,
      PLANET_SCALE: 3.0,
      MOON_SCALE: 2.0,
      ORBITAL_SCALE: 300.0,
      STAR_SHADER_SCALE: 0.5
    });
  });

  it('should return correct scaling for profile mode', () => {
    const scaling = getViewModeScaling('profile');
    expect(scaling).toEqual({
      STAR_SCALE: 6.0,
      PLANET_SCALE: 4.0,
      MOON_SCALE: 3.0,
      ORBITAL_SCALE: 400.0,
      STAR_SHADER_SCALE: 1.0
    });
  });

  it('should default to realistic scaling for invalid mode', () => {
    // @ts-expect-error - Testing invalid mode
    const scaling = getViewModeScaling('invalid');
    expect(scaling).toEqual(getViewModeScaling('realistic'));
  });
}); 