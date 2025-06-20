/**
 * DYNAMIC CAMERA CALCULATOR
 * =========================
 * 
 * Provides optimal camera settings for each view mode.
 * No legacy dependencies - uses clean, predefined configurations.
 */

import type { CelestialObject } from '../types/orbital-system'
import type { ViewType } from '@lib/types/effects-level'

export interface DynamicCameraSettings {
  nearPlane: number
  farPlane: number
  absoluteMinDistance: number
  absoluteMaxDistance: number
  _metadata?: {
    minVisualSize: number
    maxVisualSize: number
    minOrbitDistance: number
    maxOrbitDistance: number
    minCameraDistance: number
    maxCameraDistance: number
    scaleRange: number
  }
}

/**
 * Calculate dynamic camera settings based on view type
 * Uses optimal predefined settings for each view mode
 */
export function calculateDynamicCameraSettings(
  systemData: CelestialObject[],
  viewType: ViewType
): DynamicCameraSettings {
  return getOptimalCameraSettingsForViewType(viewType);
}

/**
 * Get optimal camera settings for each view type
 */
function getOptimalCameraSettingsForViewType(viewType: ViewType): DynamicCameraSettings {
  switch (viewType) {
    case 'scientific':
      return {
        nearPlane: 0.001,
        farPlane: 50000,
        absoluteMinDistance: 0.01,
        absoluteMaxDistance: 1000,
        _metadata: {
          minVisualSize: 0.001,
          maxVisualSize: 10,
          minOrbitDistance: 1,
          maxOrbitDistance: 500,
          minCameraDistance: 0.01,
          maxCameraDistance: 1000,
          scaleRange: 1000
        }
      };
    case 'profile':
      return {
        nearPlane: 0.01,
        farPlane: 2000,
        absoluteMinDistance: 0.1,
        absoluteMaxDistance: 500,
        _metadata: {
          minVisualSize: 0.1,
          maxVisualSize: 20,
          minOrbitDistance: 5,
          maxOrbitDistance: 200,
          minCameraDistance: 0.1,
          maxCameraDistance: 500,
          scaleRange: 100
        }
      };
    case 'navigational':
      return {
        nearPlane: 0.1,
        farPlane: 5000,
        absoluteMinDistance: 1,
        absoluteMaxDistance: 2000,
        _metadata: {
          minVisualSize: 0.5,
          maxVisualSize: 50,
          minOrbitDistance: 10,
          maxOrbitDistance: 1000,
          minCameraDistance: 1,
          maxCameraDistance: 2000,
          scaleRange: 200
        }
      };
    case 'explorational':
    default:
      return {
        nearPlane: 0.1,
        farPlane: 10000,
        absoluteMinDistance: 1,
        absoluteMaxDistance: 5000,
        _metadata: {
          minVisualSize: 0.1,
          maxVisualSize: 100,
          minOrbitDistance: 5,
          maxOrbitDistance: 2000,
          minCameraDistance: 1,
          maxCameraDistance: 5000,
          scaleRange: 500
        }
      };
  }
}