import { Vector3 } from 'three'
import { StarmapDataLoader } from '../services/data-loader'
import { LegacyStarmapData, StarmapData } from '../types'

// Mock fetch for testing
global.fetch = jest.fn()

describe('StarmapDataLoader', () => {
  let dataLoader: StarmapDataLoader
  
  beforeEach(() => {
    dataLoader = new StarmapDataLoader()
    jest.clearAllMocks()
  })

  const mockLegacyData: LegacyStarmapData = {
    systems: {
      'sol': {
        id: 'sol',
        name: 'Sol System',
        description: 'Our home solar system',
        position: [0, 0, 0],
        status: 'inhabited'
      },
      'alpha-centauri': {
        id: 'alpha-centauri',
        name: 'Alpha Centauri System',
        description: 'Nearest star system to Sol',
        position: [4.37, 0, 0],
        status: 'unexplored'
      }
    },
    metadata: {
      version: '1.0',
      last_updated: '2024-01-01',
      total_systems: 2,
      coordinate_system: 'galactic',
      distance_unit: 'light_years'
    }
  }

  describe('loadSystemData', () => {
    it('should load and transform data successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLegacyData
      })

      const result = await dataLoader.loadSystemData('realistic')

      expect(fetch).toHaveBeenCalledWith('/data/realistic/starmap-systems.json')
      expect(result).toBeDefined()
      expect(result.systems.size).toBe(2)
      expect(result.routes.size).toBeGreaterThan(0)
      expect(result.metadata).toBeDefined()
    })

    it('should handle fetch errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      })

      await expect(dataLoader.loadSystemData('invalid-mode'))
        .rejects
        .toThrow('Failed to load starmap data for mode \'invalid-mode\'')
    })

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(dataLoader.loadSystemData('realistic'))
        .rejects
        .toThrow('Failed to load starmap data for mode \'realistic\'')
    })
  })

  describe('validateSystemData', () => {
    it('should validate legacy data successfully', () => {
      const result = dataLoader.validateSystemData(mockLegacyData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject null data', () => {
      const result = dataLoader.validateSystemData(null)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Data must be an object')
    })

    it('should reject data without systems', () => {
      const invalidData = {
        metadata: mockLegacyData.metadata
      }
      const result = dataLoader.validateSystemData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'systems')).toBe(true)
    })

    it('should reject data without metadata', () => {
      const invalidData = {
        systems: mockLegacyData.systems
      }
      const result = dataLoader.validateSystemData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'metadata')).toBe(true)
    })

    it('should validate individual systems', () => {
      const invalidData = {
        systems: {
          'invalid-system': {
            // Missing required fields
            name: 'Invalid System'
          }
        },
        metadata: mockLegacyData.metadata
      }
      const result = dataLoader.validateSystemData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'id')).toBe(true)
      expect(result.errors.some(e => e.field === 'position')).toBe(true)
    })
  })

  describe('transformLegacyData', () => {
    it('should transform legacy data to modern format', () => {
      const result = dataLoader.transformLegacyData(mockLegacyData)

      expect(result.systems).toBeInstanceOf(Map)
      expect(result.routes).toBeInstanceOf(Map)
      expect(result.metadata).toBeDefined()
      
      // Check systems transformation
      expect(result.systems.size).toBe(2)
      const solSystem = result.systems.get('sol')
      expect(solSystem).toBeDefined()
      expect(solSystem!.name).toBe('Sol System')
      expect(solSystem!.position).toBeInstanceOf(Vector3)
      expect(solSystem!.systemType).toBeDefined()
      expect(solSystem!.securityLevel).toBeDefined()
      expect(solSystem!.status).toBeDefined()
      expect(typeof solSystem!.population).toBe('number')
    })

    it('should generate routes between nearby systems', () => {
      const result = dataLoader.transformLegacyData(mockLegacyData)
      
      // Sol and Alpha Centauri are 4.37 light years apart, should have a route
      expect(result.routes.size).toBeGreaterThan(0)
      
      const route = Array.from(result.routes.values())[0]
      expect(route.fromSystem).toBeDefined()
      expect(route.toSystem).toBeDefined()
      expect(route.distance).toBeGreaterThan(0)
      expect(route.bidirectional).toBe(true)
    })

    it('should update jump points in systems', () => {
      const result = dataLoader.transformLegacyData(mockLegacyData)
      
      const solSystem = result.systems.get('sol')
      const alphaSystem = result.systems.get('alpha-centauri')
      
      expect(solSystem!.jumpPoints).toContain('alpha-centauri')
      expect(alphaSystem!.jumpPoints).toContain('sol')
    })

    it('should infer system properties correctly', () => {
      const wolfData: LegacyStarmapData = {
        systems: {
          'wolf-359': {
            id: 'wolf-359',
            name: 'Wolf 359 System',
            description: 'Red dwarf star system',
            position: [7.86, 0, 0],
            status: 'unexplored'
          }
        },
        metadata: mockLegacyData.metadata
      }

      const result = dataLoader.transformLegacyData(wolfData)
      const wolfSystem = result.systems.get('wolf-359')
      
      expect(wolfSystem!.systemType).toBe('red-dwarf')
      expect(wolfSystem!.securityLevel).toBe('medium')
      expect(wolfSystem!.status).toBe('unexplored')
      expect(wolfSystem!.population).toBe(0)
    })

    it('should handle inhabited systems correctly', () => {
      const result = dataLoader.transformLegacyData(mockLegacyData)
      const solSystem = result.systems.get('sol')
      
      expect(solSystem!.status).toBe('inhabited')
      expect(solSystem!.securityLevel).toBe('high')
      expect(solSystem!.population).toBeGreaterThan(0)
    })

    it('should normalize metadata correctly', () => {
      const result = dataLoader.transformLegacyData(mockLegacyData)
      
      expect(result.metadata.version).toBe('1.0')
      expect(result.metadata.coordinateSystem).toBe('galactic')
      expect(result.metadata.distanceUnit).toBe('light_years')
      expect(result.metadata.totalSystems).toBe(2)
      expect(result.metadata.totalRoutes).toBeGreaterThan(0)
    })

    it('should handle systems too far apart', () => {
      const distantData: LegacyStarmapData = {
        systems: {
          'sol': {
            id: 'sol',
            name: 'Sol System',
            position: [0, 0, 0],
            status: 'inhabited'
          },
          'distant-system': {
            id: 'distant-system',
            name: 'Distant System',
            position: [1000, 0, 0], // 1000 light years away
            status: 'unexplored'
          }
        },
        metadata: mockLegacyData.metadata
      }

      const result = dataLoader.transformLegacyData(distantData)
      
      // Should not create routes between very distant systems
      expect(result.routes.size).toBe(0)
      expect(result.systems.get('sol')!.jumpPoints).toHaveLength(0)
      expect(result.systems.get('distant-system')!.jumpPoints).toHaveLength(0)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle empty systems object', () => {
      const emptyData: LegacyStarmapData = {
        systems: {},
        metadata: mockLegacyData.metadata
      }

      const result = dataLoader.transformLegacyData(emptyData)
      expect(result.systems.size).toBe(0)
      expect(result.routes.size).toBe(0)
    })

    it('should handle missing optional fields', () => {
      const minimalData: LegacyStarmapData = {
        systems: {
          'minimal-system': {
            id: 'minimal-system',
            name: 'Minimal System',
            position: [0, 0, 0],
            status: 'unexplored'
          }
        },
        metadata: {
          version: '1.0',
          last_updated: '2024-01-01',
          total_systems: 1,
          coordinate_system: 'galactic',
          distance_unit: 'light_years'
        }
      }

      const result = dataLoader.transformLegacyData(minimalData)
      const system = result.systems.get('minimal-system')
      
      expect(system).toBeDefined()
      expect(system!.description).toBeUndefined()
      expect(system!.metadata).toBeDefined()
    })

    it('should handle invalid position arrays', () => {
      const invalidPositionData = {
        systems: {
          'invalid-system': {
            id: 'invalid-system',
            name: 'Invalid System',
            position: [0, 0], // Only 2 coordinates
            status: 'unexplored'
          }
        },
        metadata: mockLegacyData.metadata
      }

      const result = dataLoader.validateSystemData(invalidPositionData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'position')).toBe(true)
    })
  })

  describe('performance considerations', () => {
    it('should handle large datasets efficiently', () => {
      // Create a larger dataset
      const largeSystems: any = {}
      for (let i = 0; i < 100; i++) {
        largeSystems[`system-${i}`] = {
          id: `system-${i}`,
          name: `System ${i}`,
          position: [i * 10, 0, 0],
          status: 'unexplored'
        }
      }

      const largeData: LegacyStarmapData = {
        systems: largeSystems,
        metadata: {
          ...mockLegacyData.metadata,
          total_systems: 100
        }
      }

      const startTime = performance.now()
      const result = dataLoader.transformLegacyData(largeData)
      const endTime = performance.now()

      expect(result.systems.size).toBe(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
    })
  })
}) 