/**
 * Backward Compatibility Tests
 * ============================
 * 
 * Ensures that the new registry system maintains 100% backward compatibility
 * with existing code and doesn't break any legacy functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { viewModeRegistry } from '../index'
import { 
  getOrbitalMechanicsConfig, 
  getViewModeConfig, 
  getLegacyViewConfigs,
  getLegacyViewModeConfigs,
  validateMigration,
  logMigrationStatus
} from '../compatibility'
import { useSystemStore } from '@/engine/core/mode-system/mode-system'

describe('Backward Compatibility', () => {
  
  describe('Legacy Config Format Compatibility', () => {
    it('should generate VIEW_CONFIGS in exact legacy format', () => {
      const legacyConfigs = getLegacyViewConfigs()
      
      // Test explorational mode structure matches legacy expectations
      const explorational = legacyConfigs.explorational
      expect(explorational).toEqual({
        maxVisualSize: 0.8,
        minVisualSize: 0.02,
        orbitScaling: 8.0,
        safetyMultiplier: 2.5,
        minDistance: 0.1,
      })
      
      // Test navigational mode includes fixedSizes
      const navigational = legacyConfigs.navigational
      expect(navigational).toHaveProperty('fixedSizes')
      expect(navigational.fixedSizes).toEqual({
        star: 2.0,
        planet: 1.2,
        moon: 0.6,
        asteroid: 0.3,
        belt: 0.8,
        barycenter: 0.0,
      })
      
      // Test scientific mode has minimal values
      const scientific = legacyConfigs.scientific
      expect(scientific.maxVisualSize).toBe(0.001)
      expect(scientific.minVisualSize).toBe(0.00001)
    })

    it('should generate VIEW_MODE_CONFIGS in exact legacy format', () => {
      const legacyConfigs = getLegacyViewModeConfigs()
      
      // Test structure matches legacy VIEW_MODE_CONFIGS
      const explorational = legacyConfigs.explorational
      expect(explorational).toHaveProperty('objectScaling')
      expect(explorational).toHaveProperty('orbitScaling')
      expect(explorational).toHaveProperty('cameraConfig')
      
      // Test object scaling structure
      expect(explorational.objectScaling).toEqual({
        star: 2.5,
        planet: 1.8,
        moon: 1.2,
        gasGiant: 2.2,
        asteroid: 0.8,
        default: 1.0
      })
      
      // Test camera config structure
      expect(explorational.cameraConfig).toHaveProperty('radiusMultiplier')
      expect(explorational.cameraConfig).toHaveProperty('viewingAngles')
      expect(explorational.cameraConfig).toHaveProperty('animation')
    })
  })

  describe('API Compatibility', () => {
    it('should support all legacy function signatures', () => {
      // These functions should work exactly as before
      expect(() => getOrbitalMechanicsConfig('explorational')).not.toThrow()
      expect(() => getViewModeConfig('navigational')).not.toThrow()
      expect(() => getLegacyViewConfigs()).not.toThrow()
      expect(() => getLegacyViewModeConfigs()).not.toThrow()
      
      // Results should have expected types
      const orbitalConfig = getOrbitalMechanicsConfig('profile')
      expect(typeof orbitalConfig.orbitScaling).toBe('number')
      
      const viewConfig = getViewModeConfig('scientific')
      expect(typeof viewConfig.cameraConfig.radiusMultiplier).toBe('number')
    })

    it('should maintain exact numeric values from legacy system', () => {
      // These values must match exactly what the old system provided
      const exploratorialOrbital = getOrbitalMechanicsConfig('explorational')
      expect(exploratorialOrbital.orbitScaling).toBe(8.0)
      expect(exploratorialOrbital.safetyMultiplier).toBe(2.5)
      
      const navigationalOrbital = getOrbitalMechanicsConfig('navigational')
      expect(navigationalOrbital.orbitScaling).toBe(0.6)
      expect(navigationalOrbital.safetyMultiplier).toBe(3.0)
      
      const profileOrbital = getOrbitalMechanicsConfig('profile')
      expect(profileOrbital.orbitScaling).toBe(0.3)
      expect(profileOrbital.safetyMultiplier).toBe(3.5)
      
      const scientificOrbital = getOrbitalMechanicsConfig('scientific')
      expect(scientificOrbital.orbitScaling).toBe(1.0)
      expect(scientificOrbital.safetyMultiplier).toBe(1.1)
    })

    it('should handle realistic mode aliasing correctly', () => {
      // The old system had 'realistic' as an alias for 'explorational'
      const realisticConfig = getOrbitalMechanicsConfig('realistic')
      const exploratorialConfig = getOrbitalMechanicsConfig('explorational')
      
      // Should be identical
      expect(realisticConfig).toEqual(exploratorialConfig)
    })
  })

  describe('Migration Validation', () => {
    it('should pass migration validation', () => {
      const validation = validateMigration()
      
      expect(validation.success).toBe(true)
      expect(validation.missing).toHaveLength(0)
      
      // Should have all expected modes
      const registry = viewModeRegistry
      expect(registry.has('explorational')).toBe(true)
      expect(registry.has('navigational')).toBe(true)
      expect(registry.has('profile')).toBe(true)
      expect(registry.has('scientific')).toBe(true)
    })

    it('should maintain registry statistics consistency', () => {
      const stats = viewModeRegistry.getStats()
      
      expect(stats.totalModes).toBeGreaterThanOrEqual(4)
      expect(stats.byCategory.educational).toBeGreaterThanOrEqual(2) // explorational + profile
      expect(stats.byCategory.navigation).toBeGreaterThanOrEqual(1) // navigational
      expect(stats.byCategory.scientific).toBeGreaterThanOrEqual(1) // scientific
    })

    it('should log migration status without errors', () => {
      expect(() => logMigrationStatus()).not.toThrow()
    })
  })

  describe('Feature Flag Compatibility', () => {
    it('should maintain exact legacy feature mappings', () => {
      // Use the imported mode system to test feature mapping
      const store = useSystemStore.getState()
      
      // Test explorational (realistic) mode features
      store.setMode('realistic')
      let features = store.getViewFeatures()
      expect(features).toEqual({
        scientificInfo: true,
        educationalContent: true,
        gameInfo: false,
        jumpPointInfo: false
      })
      
      // Test navigational mode features
      store.setMode('navigational')
      features = store.getViewFeatures()
      expect(features).toEqual({
        scientificInfo: true,
        educationalContent: false,
        gameInfo: false,
        jumpPointInfo: true
      })
      
      // Test profile mode features
      store.setMode('profile')
      features = store.getViewFeatures()
      expect(features).toEqual({
        scientificInfo: false,
        educationalContent: false,
        gameInfo: true,
        jumpPointInfo: true
      })
    })

    it('should handle view mode switching correctly', () => {
      const store = useSystemStore.getState()
      
      // Test direct view mode setting
      store.setViewMode('scientific')
      const features = store.getViewFeatures()
      expect(features).toEqual({
        scientificInfo: true,
        educationalContent: true,
        gameInfo: false,
        jumpPointInfo: false
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined or null mode IDs gracefully', () => {
      expect(() => {
        // @ts-ignore - Testing runtime error handling
        getOrbitalMechanicsConfig(null)
      }).toThrow()
      
      expect(() => {
        // @ts-ignore - Testing runtime error handling  
        getOrbitalMechanicsConfig(undefined)
      }).toThrow()
    })

    it('should handle empty string mode IDs', () => {
      expect(() => {
        getOrbitalMechanicsConfig('')
      }).toThrow()
    })

    it('should provide meaningful error messages', () => {
      try {
        getOrbitalMechanicsConfig('invalid-mode')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.message).toContain('View mode "invalid-mode" not found')
        expect(error.message).toContain('Available modes:')
      }
    })
  })

  describe('Performance Parity', () => {
    it('should not degrade performance compared to legacy system', () => {
      const iterations = 1000
      
      // Time the new system
      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        getOrbitalMechanicsConfig('explorational')
        getViewModeConfig('navigational')
      }
      const newSystemTime = performance.now() - start
      
      // Should be reasonably fast (less than 100ms for 1000 iterations)
      expect(newSystemTime).toBeLessThan(100)
    })

    it('should handle rapid mode switching without performance issues', () => {
      const store = useSystemStore.getState()
      const modes = ['explorational', 'navigational', 'profile', 'scientific'] as const
      
      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        const mode = modes[i % modes.length]
        store.setViewMode(mode)
        store.getViewFeatures()
        store.getViewModeScaling()
      }
      const switchTime = performance.now() - start
      
      // Should be very fast (less than 50ms for 100 switches)
      expect(switchTime).toBeLessThan(50)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain consistent data across multiple calls', () => {
      // Call the same function multiple times
      const configs = Array.from({ length: 10 }, () => 
        getOrbitalMechanicsConfig('explorational')
      )
      
      // All results should be identical
      configs.forEach(config => {
        expect(config).toEqual(configs[0])
      })
    })

    it('should maintain consistency between related functions', () => {
      const orbitalConfig = getOrbitalMechanicsConfig('navigational')
      const viewConfig = getViewModeConfig('navigational')
      const legacyConfigs = getLegacyViewConfigs()
      
      // Related values should be consistent
      expect(orbitalConfig.orbitScaling).toBe(0.6)
      expect(viewConfig.orbitScaling.factor).toBe(1.0) // Different property in view config
      expect(legacyConfigs.navigational.orbitScaling).toBe(0.6)
    })
  })
})