/**
 * View Mode Registry Tests
 * ========================
 * 
 * Tests for the new extensible view mode registry system.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ViewModeRegistry } from '../registry'
import type { ViewModeDefinition } from '../types'

describe('ViewModeRegistry', () => {
  let registry: ViewModeRegistry
  
  beforeEach(() => {
    registry = new ViewModeRegistry()
  })
  
  const createTestMode = (id: string): ViewModeDefinition => ({
    id,
    name: `Test Mode ${id}`,
    description: `Test mode for ${id}`,
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
  
  describe('Registration', () => {
    it('should register a valid view mode', () => {
      const testMode = createTestMode('test1')
      const result = registry.register(testMode)
      
      expect(result).toBe(true)
      expect(registry.has('test1')).toBe(true)
      expect(registry.get('test1')).toEqual(expect.objectContaining({
        id: 'test1',
        name: 'Test Mode test1'
      }))
    })
    
    it('should not register a mode with missing required fields', () => {
      const invalidMode = {
        id: 'invalid',
        // Missing required fields
      } as ViewModeDefinition
      
      const result = registry.register(invalidMode)
      expect(result).toBe(false)
      expect(registry.has('invalid')).toBe(false)
    })
    
    it('should not register duplicate modes without replace flag', () => {
      const testMode = createTestMode('test1')
      
      expect(registry.register(testMode)).toBe(true)
      expect(registry.register(testMode)).toBe(false)
      expect(registry.getCount()).toBe(1)
    })
    
    it('should replace existing mode when replace flag is true', () => {
      const testMode1 = createTestMode('test1')
      const testMode2 = { ...createTestMode('test1'), name: 'Updated Test Mode' }
      
      expect(registry.register(testMode1)).toBe(true)
      expect(registry.register(testMode2, { replace: true })).toBe(true)
      expect(registry.get('test1')?.name).toBe('Updated Test Mode')
    })
  })
  
  describe('Retrieval', () => {
    beforeEach(() => {
      registry.register(createTestMode('test1'))
      registry.register(createTestMode('test2'))
      registry.register({ ...createTestMode('test3'), category: 'scientific' })
    })
    
    it('should get all registered modes', () => {
      const allModes = registry.getAll()
      expect(allModes).toHaveLength(3)
      expect(allModes.map(m => m.id)).toEqual(['test1', 'test2', 'test3'])
    })
    
    it('should get modes by category', () => {
      const customModes = registry.getByCategory('custom')
      const scientificModes = registry.getByCategory('scientific')
      
      expect(customModes).toHaveLength(2)
      expect(scientificModes).toHaveLength(1)
      expect(scientificModes[0].id).toBe('test3')
    })
    
    it('should get mode IDs', () => {
      const ids = registry.getIds()
      expect(ids).toEqual(['test1', 'test2', 'test3'])
    })
    
    it('should return undefined for non-existent mode', () => {
      expect(registry.get('nonexistent')).toBeUndefined()
    })
  })
  
  describe('Management', () => {
    it('should unregister modes', () => {
      const testMode = createTestMode('test1')
      registry.register(testMode)
      
      expect(registry.has('test1')).toBe(true)
      expect(registry.unregister('test1')).toBe(true)
      expect(registry.has('test1')).toBe(false)
      expect(registry.unregister('test1')).toBe(false) // Already removed
    })
    
    it('should clear all modes', () => {
      registry.register(createTestMode('test1'))
      registry.register(createTestMode('test2'))
      
      expect(registry.getCount()).toBe(2)
      registry.clear()
      expect(registry.getCount()).toBe(0)
      expect(registry.getAll()).toEqual([])
    })
    
    it('should provide accurate statistics', () => {
      registry.register(createTestMode('test1'))
      registry.register({ ...createTestMode('test2'), category: 'scientific' })
      
      const stats = registry.getStats()
      expect(stats.totalModes).toBe(2)
      expect(stats.byCategory.custom).toBe(1)
      expect(stats.byCategory.scientific).toBe(1)
      expect(stats.modeList).toHaveLength(2)
    })
  })
  
  describe('Validation', () => {
    it('should validate mode definitions', () => {
      const validMode = createTestMode('valid')
      const validation = registry.validate(validMode)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toEqual([])
    })
    
    it('should detect invalid mode definitions', () => {
      const invalidMode = {
        // Missing required fields
        id: '',
        name: '',
        category: 'invalid'
      } as ViewModeDefinition
      
      const validation = registry.validate(invalidMode)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })
  
  describe('Event System', () => {
    it('should notify listeners of registration events', () => {
      const events: Array<{ type: string; modeId: string }> = []
      const listener = (eventType: string, modeId: string) => {
        events.push({ type: eventType, modeId })
      }
      
      registry.addListener(listener)
      
      const testMode = createTestMode('test1')
      registry.register(testMode)
      registry.unregister('test1')
      
      expect(events).toEqual([
        { type: 'registered', modeId: 'test1' },
        { type: 'unregistered', modeId: 'test1' }
      ])
      
      registry.removeListener(listener)
    })
  })
})

describe('Registry Auto-initialization', () => {
  it('should auto-register built-in modes when imported', async () => {
    // Import the main module which should auto-register modes
    const { viewModeRegistry } = await import('../index')
    
    // Check that built-in modes are registered
    expect(viewModeRegistry.has('explorational')).toBe(true)
    expect(viewModeRegistry.has('navigational')).toBe(true)
    expect(viewModeRegistry.has('profile')).toBe(true)
    expect(viewModeRegistry.has('scientific')).toBe(true)
    
    const stats = viewModeRegistry.getStats()
    expect(stats.totalModes).toBeGreaterThanOrEqual(4)
  })
})