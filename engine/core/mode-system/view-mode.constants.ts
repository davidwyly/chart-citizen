import { ViewModeState, ViewMode, ViewModeScaling } from '../../types/view-mode.types';

export const EXPLORATIONAL_VIEW_MODE: ViewModeState = {
  currentViewMode: 'explorational',
  scaling: {
    STAR_SCALE: 1.0,
    PLANET_SCALE: 1.0,
    MOON_SCALE: 1.0,
    ORBITAL_SCALE: 200.0,
    STAR_SHADER_SCALE: 1.0
  }
};

export const NAVIGATIONAL_VIEW_MODE: ViewModeState = {
  currentViewMode: 'navigational',
  scaling: {
    STAR_SCALE: 4.0,
    PLANET_SCALE: 3.0,
    MOON_SCALE: 2.0,
    ORBITAL_SCALE: 300.0,
    STAR_SHADER_SCALE: 0.5
  }
};

export const PROFILE_VIEW_MODE: ViewModeState = {
  currentViewMode: 'profile',
  scaling: {
    STAR_SCALE: 6.0,
    PLANET_SCALE: 4.0,
    MOON_SCALE: 3.0,
    ORBITAL_SCALE: 400.0,
    STAR_SHADER_SCALE: 1.0
  }
};

export const SCIENTIFIC_VIEW_MODE: ViewModeState = {
  currentViewMode: 'scientific',
  scaling: {
    STAR_SCALE: 1.0,
    PLANET_SCALE: 1.0,
    MOON_SCALE: 1.0,
    ORBITAL_SCALE: 1.0,
    STAR_SHADER_SCALE: 1.0
  }
};

export const getViewMode = (mode: string): ViewModeState => {
  switch (mode) {
    case 'explorational':
      return EXPLORATIONAL_VIEW_MODE;
    case 'navigational':
      return NAVIGATIONAL_VIEW_MODE;
    case 'profile':
      return PROFILE_VIEW_MODE;
    case 'scientific':
      return SCIENTIFIC_VIEW_MODE;
    default:
      return EXPLORATIONAL_VIEW_MODE;
  }
};

export const getViewModeScaling = (mode: ViewMode): ViewModeScaling => {
  switch (mode) {
    case 'explorational':
      return EXPLORATIONAL_VIEW_MODE.scaling;
    case 'navigational':
      return NAVIGATIONAL_VIEW_MODE.scaling;
    case 'profile':
      return PROFILE_VIEW_MODE.scaling;
    case 'scientific':
      return SCIENTIFIC_VIEW_MODE.scaling;
    default:
      return EXPLORATIONAL_VIEW_MODE.scaling;
  }
}; 