import { ViewModeScaling } from '../types/view-mode.types';

// Base scaling values for realistic view
const REALISTIC_SCALING: ViewModeScaling = {
  ORBITAL_SCALE: 1.0,
  STAR_SCALE: 1.0,
  PLANET_SCALE: 1.0,
  MOON_SCALE: 1.0,
  STAR_SHADER_SCALE: 1.0
};

// Scaling values for navigational view
const NAVIGATIONAL_SCALING: ViewModeScaling = {
  ORBITAL_SCALE: 1.5,
  STAR_SCALE: 2.0,
  PLANET_SCALE: 1.5,
  MOON_SCALE: 1.0,
  STAR_SHADER_SCALE: 0.5
};

// Scaling values for game view
const GAME_SCALING: ViewModeScaling = {
  ORBITAL_SCALE: 2.0,
  STAR_SCALE: 3.0,
  PLANET_SCALE: 2.0,
  MOON_SCALE: 1.5,
  STAR_SHADER_SCALE: 1.0
};

/**
 * Calculate the appropriate scaling values for a given view mode
 * @param viewMode The view mode to calculate scaling for
 * @returns The scaling values for the specified view mode
 */
export const calculateViewModeScaling = (viewMode: string): ViewModeScaling => {
  switch (viewMode) {
    case 'realistic':
      return REALISTIC_SCALING;
    case 'navigational':
      return NAVIGATIONAL_SCALING;
    case 'game':
      return GAME_SCALING;
    default:
      return REALISTIC_SCALING;
  }
}; 