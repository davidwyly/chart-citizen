/**
 * Integration Tests for View Mode System
 * =====================================
 * 
 * Tests the integration between the new registry system and existing components
 * to ensure seamless operation and backward compatibility.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { viewModeRegistry } from '../index'
import { getOrbitalMechanicsConfig, getViewModeConfig, getLegacyViewConfigs } from '../compatibility'
import { useSystemStore } from '../../mode-system/mode-system'

describe('View Mode System Integration', () => {
  beforeEach(() => {
    // Reset system store
    useSystemStore.getState().reset()
  })

  describe('Registry-Component Integration', () => {
    it('should provide configs compatible with orbital mechanics calculator', () => {
      const exploratorialConfig = getOrbitalMechanicsConfig('explorational')
      
      expect(exploratorialConfig).toHaveProperty('maxVisualSize')
      expect(exploratorialConfig).toHaveProperty('minVisualSize')
      expect(exploratorialConfig).toHaveProperty('orbitScaling')
      expect(exploratorialConfig).toHaveProperty('safetyMultiplier')
      expect(exploratorialConfig).toHaveProperty('minDistance')
      
      expect(typeof exploratorialConfig.maxVisualSize).toBe('number')
      expect(exploratorialConfig.maxVisualSize).toBeGreaterThan(0)
    })

    it('should provide configs compatible with camera controller', () => {
      const exploratorialConfig = getViewModeConfig('explorational')
      
      expect(exploratorialConfig).toHaveProperty('cameraConfig')
      expect(exploratorialConfig.cameraConfig).toHaveProperty('radiusMultiplier')
      expect(exploratorialConfig.cameraConfig).toHaveProperty('viewingAngles')
      expect(exploratorialConfig.cameraConfig).toHaveProperty('animation')
      
      expect(typeof exploratorialConfig.cameraConfig.radiusMultiplier).toBe('number')
    })

    it('should generate complete legacy VIEW_CONFIGS format', () => {
      const legacyConfigs = getLegacyViewConfigs()
      
      // Should have all expected view modes
      expect(legacyConfigs).toHaveProperty('explorational')
      expect(legacyConfigs).toHaveProperty('navigational')
      expect(legacyConfigs).toHaveProperty('profile')
      expect(legacyConfigs).toHaveProperty('scientific')
      
      // Each config should have expected structure
      Object.values(legacyConfigs).forEach(config => {
        expect(config).toHaveProperty('maxVisualSize')
        expect(config).toHaveProperty('minVisualSize')
        expect(config).toHaveProperty('orbitScaling')
        expect(config).toHaveProperty('safetyMultiplier')
        expect(config).toHaveProperty('minDistance')
      })
    })
  })

  describe('Mode System Integration', () => {
    it('should integrate correctly with system store', () => {
      const store = useSystemStore.getState()
      
      // Test setting view modes from registry
      store.setViewMode('scientific')
      expect(store.getViewMode()).toBe('scientific')
      
      const features = store.getViewFeatures()
      expect(features.scientificInfo).toBe(true)
      expect(features.educationalContent).toBe(true)
    })

    it('should provide correct scaling values from registry', () => {
      const store = useSystemStore.getState()
      store.setViewMode('navigational')
      
      const scaling = store.getViewModeScaling()
      expect(scaling).toHaveProperty('ORBITAL_SCALE')
      expect(scaling).toHaveProperty('STAR_SCALE')
      expect(scaling).toHaveProperty('PLANET_SCALE')
      expect(scaling).toHaveProperty('MOON_SCALE')
      
      expect(typeof scaling.ORBITAL_SCALE).toBe('number')
      expect(scaling.ORBITAL_SCALE).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Fallbacks', () => {
    it('should handle missing view modes gracefully', () => {
      // Should return fallback config instead of throwing
      const fallbackConfig = getOrbitalMechanicsConfig('nonexistent-mode')
      expect(fallbackConfig).toBeDefined()
      expect(fallbackConfig.maxVisualSize).toBe(0.8) // Explorational fallback values
      expect(fallbackConfig.orbitScaling).toBe(8.0)
      
      // But compatibility layer should provide fallbacks where appropriate
      const legacyConfigs = getLegacyViewConfigs()
      expect(Object.keys(legacyConfigs).length).toBeGreaterThan(0)
    })

    it('should handle registry failures gracefully', () => {
      // Temporarily break the registry
      const originalGet = viewModeRegistry.get
      viewModeRegistry.get = vi.fn().mockReturnValue(undefined)
      
      const store = useSystemStore.getState()
      const scaling = store.getViewModeScaling()
      
      // Should return safe defaults
      expect(scaling.ORBITAL_SCALE).toBe(1.0)
      expect(scaling.STAR_SCALE).toBe(1.0)
      
      // Restore registry
      viewModeRegistry.get = originalGet
    })
  })

  describe('Performance and Caching', () => {
    it('should not recreate configs unnecessarily', () => {
      const config1 = getOrbitalMechanicsConfig('explorational')
      const config2 = getOrbitalMechanicsConfig('explorational')
      
      // Configs should have same values (testing consistency)
      expect(config1.maxVisualSize).toBe(config2.maxVisualSize)
      expect(config1.orbitScaling).toBe(config2.orbitScaling)
    })

    it('should handle multiple rapid mode switches', () => {
      const store = useSystemStore.getState()
      
      // Rapidly switch between modes
      const modes = ['explorational', 'navigational', 'profile', 'scientific'] as const
      
      for (let i = 0; i < 10; i++) {
        const mode = modes[i % modes.length]
        store.setViewMode(mode)
        expect(store.getViewMode()).toBe(mode)
        
        const features = store.getViewFeatures()
        expect(features).toBeDefined()
      }
    })
  })

  describe('Type Safety and Validation', () => {
    it('should maintain type safety across all integrations', () => {
      // Test that all registry operations maintain TypeScript safety
      const allModes = viewModeRegistry.getAll()
      
      allModes.forEach(mode => {
        expect(typeof mode.id).toBe('string')
        expect(typeof mode.name).toBe('string')
        expect(typeof mode.description).toBe('string')
        expect(['scientific', 'educational', 'gaming', 'navigation', 'custom']).toContain(mode.category)
        
        // Test config structure
        expect(mode.scaling).toBeDefined()
        expect(mode.camera).toBeDefined()
        expect(mode.features).toBeDefined()
        expect(mode.objectScaling).toBeDefined()
      })
    })

    it('should validate mode definitions correctly', () => {
      const validationResult = viewModeRegistry.validate({
        id: 'test-mode',
        name: 'Test Mode',
        description: 'A test mode',
        category: 'custom',
        scaling: {
          maxVisualSize: 1.0,
          minVisualSize: 0.1,
          orbitScaling: 1.0,
          safetyMultiplier: 2.0,
          minDistance: 0.1
        },
        camera: {
          radiusMultiplier: 4.0,
          minDistanceMultiplier: 2.0,
          maxDistanceMultiplier: 10.0,
          absoluteMinDistance: 0.1,
          absoluteMaxDistance: 100,
          viewingAngles: {
            defaultElevation: 30,
            birdsEyeElevation: 45
          },
          animation: {
            focusDuration: 1000,
            birdsEyeDuration: 1500,
            easingFunction: 'easeOut'
          }
        },
        orbital: {
          factor: 1.0,
          minDistance: 0.5,
          maxDistance: 50.0
        },
        objectScaling: {
          star: 1.0,
          planet: 1.0,
          moon: 1.0,
          gasGiant: 1.0,
          asteroid: 1.0,
          default: 1.0
        },
        features: {
          orbitalPaths: true,
          stellarZones: false,
          scientificLabels: true,
          atmosphericEffects: false,
          particleEffects: false,
          coronaEffects: false,
          educationalContent: true,
          debugInfo: false
        },
        ui: {
          showDistances: true,
          showMasses: false,
          showOrbitalPeriods: true,
          labelStyle: 'minimal',
          colorScheme: 'default'
        }
      })
      
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.errors).toHaveLength(0)
    })
  })
})

describe('Real-World Usage Scenarios', () => {
  it('should handle the typical user workflow', () => {
    const store = useSystemStore.getState()
    
    // User starts in explorational mode
    store.setViewMode('explorational')
    expect(store.getViewFeatures().educationalContent).toBe(true)
    
    // Switches to scientific for precise measurements
    store.setViewMode('scientific')
    expect(store.getViewFeatures().scientificInfo).toBe(true)
    
    // Switches to navigational for planning
    store.setViewMode('navigational')
    expect(store.getViewFeatures().jumpPointInfo).toBe(true)
    
    // Back to explorational for exploration
    store.setViewMode('explorational')
    expect(store.getViewFeatures().educationalContent).toBe(true)
  })

  it('should support feature customization', () => {
    const store = useSystemStore.getState()
    store.setViewMode('explorational')
    
    // User customizes features
    expect(store.getViewFeatures().scientificInfo).toBe(true)
    store.toggleFeature('scientificInfo')
    expect(store.getViewFeatures().scientificInfo).toBe(false)
    
    // Customization should persist within the session
    store.toggleFeature('scientificInfo')
    expect(store.getViewFeatures().scientificInfo).toBe(true)
  })

  it('should handle system data changes seamlessly', () => {
    const store = useSystemStore.getState()
    
    // Simulate loading different system data
    store.setViewMode('explorational')
    const initialFeatures = store.getViewFeatures()
    
    // Switch mode and back
    store.setViewMode('scientific')
    store.setViewMode('explorational')
    
    // Features should be consistent
    const finalFeatures = store.getViewFeatures()
    expect(finalFeatures.scientificInfo).toBe(initialFeatures.scientificInfo)
    expect(finalFeatures.educationalContent).toBe(initialFeatures.educationalContent)
  })
})