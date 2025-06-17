/**
 * Realistic View Mode (Alias for Explorational)
 * =============================================
 * 
 * This is an alias for the explorational mode to maintain backward compatibility.
 * In the old system, 'realistic' was used as an alias for 'explorational'.
 */

import type { ViewModeDefinition } from '../types'
import { explorationalMode } from './explorational-mode'

// Create realistic mode as an exact copy of explorational mode but with different ID
export const realisticMode: ViewModeDefinition = {
  ...explorationalMode,
  id: 'realistic',
  name: 'Realistic',
  description: 'Alias for explorational mode - educational content with real astronomical data'
}