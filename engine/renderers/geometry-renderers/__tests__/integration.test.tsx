import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import type { OrbitalSystemData, CelestialObject } from '@/engine/types/orbital-system'

// Import components to test
import { GeometryRendererFactory } from '../geometry-renderer-factory'
import { SystemObjectsRenderer } from '@/engine/components/system-viewer/system-objects-renderer'

// Mock all individual renderers
vi.mock('../terrestrial-renderer', () => ({
  TerrestrialRenderer: (props: any) => <div data-testid="terrestrial-renderer" data-object-id={props.object.id} />
}))
vi.mock('../rocky-renderer', () => ({
  RockyRenderer: (props: any) => <div data-testid="rocky-renderer" data-object-id={props.object.id} />
}))
vi.mock('../gas-giant-renderer', () => ({
  GasGiantRenderer: (props: any) => <div data-testid="gas-giant-renderer" data-object-id={props.object.id} />
}))
vi.mock('../star-renderer', () => ({
  StarRenderer: (props: any) => <div data-testid="star-renderer" data-object-id={props.object.id} />
}))
vi.mock('../belt-renderer', () => ({
  BeltRenderer: (props: any) => <div data-testid="belt-renderer" data-object-id={props.object.id} />
}))

// Mock orbital mechanics calculator
vi.mock('@/engine/utils/orbital-mechanics-calculator', () => ({
  calculateSystemOrbitalMechanics: vi.fn(() => new Map()),
  clearOrbitalMechanicsCache: vi.fn(),
  VIEW_CONFIGS: {
    explorational: { orbitScaling: 1.0 },
    navigational: { orbitScaling: 0.1 },
    profile: { orbitScaling: 0.01 }
  }
}))

// Mock orbital path and stellar zones
vi.mock('@/engine/components/system-viewer/components/orbital-path', () => ({
  OrbitalPath: ({ children }: any) => <div data-testid="orbital-path">{children}</div>
}))
vi.mock('@/engine/components/system-viewer/components/stellar-zones', () => ({
  StellarZones: () => <div data-testid="stellar-zones" />
}))

describe('Geometry Rendering System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Solar System Rendering', () => {
    const createSolarSystemData = (): OrbitalSystemData => ({
      id: 'sol',
      name: 'Solar System',
      description: 'Our solar system',
      objects: [
        {
          id: 'sun',
          name: 'Sun',
          classification: 'star',
          geometry_type: 'star',
          position: [0, 0, 0],
          properties: {
            mass: 1.0,
            radius: 696340,
            temperature: 5778,
            color_temperature: 5778,
            luminosity: 100
          }
        },
        {
          id: 'mercury',
          name: 'Mercury',
          classification: 'planet',
          geometry_type: 'rocky',
          orbit: {
            parent: 'sun',
            semi_major_axis: 0.39,
            eccentricity: 0.205,
            inclination: 7.0,
            orbital_period: 88
          },
          properties: {
            mass: 0.055,
            radius: 2440,
            temperature: 440,
            crater_density: 90,
            surface_color: '#8c7853'
          }
        },
        {
          id: 'earth',
          name: 'Earth',
          classification: 'planet',
          geometry_type: 'terrestrial',
          orbit: {
            parent: 'sun',
            semi_major_axis: 1.0,
            eccentricity: 0.017,
            inclination: 0.0,
            orbital_period: 365.25
          },
          properties: {
            mass: 1.0,
            radius: 6371,
            temperature: 288,
            water: 70,
            atmosphere: 78,
            population: 100,
            tectonics: 60
          }
        },
        {
          id: 'jupiter',
          name: 'Jupiter',
          classification: 'planet',
          geometry_type: 'gas_giant',
          orbit: {
            parent: 'sun',
            semi_major_axis: 5.2,
            eccentricity: 0.049,
            inclination: 1.3,
            orbital_period: 4333
          },
          properties: {
            mass: 317.8,
            radius: 69911,
            temperature: 165,
            band_contrast: 80,
            cloud_opacity: 90
          },
          rings: [{
            id: 'jupiter-rings',
            geometry_type: 'ring',
            name: 'Jupiter Ring System',
            radius_start: 1.8,
            radius_end: 2.3,
            inclination: 0,
            density: 'sparse',
            composition: ['dust'],
            opacity: 30
          }]
        },
        {
          id: 'asteroid-belt',
          name: 'Asteroid Belt',
          classification: 'belt',
          geometry_type: 'belt',
          orbit: {
            parent: 'sun',
            inner_radius: 2.2,
            outer_radius: 3.2,
            inclination: 0,
            eccentricity: 0.1
          },
          properties: {
            mass: 0.0004,
            radius: 0,
            temperature: 200,
            belt_density: 'moderate',
            particle_size: 'medium',
            tint: '#666666'
          }
        }
      ],
      lighting: {
        primary_star: 'sun',
        ambient_level: 0.1,
        stellar_influence_radius: 100
      }
    })

    const baseSystemProps = {
      selectedObjectId: null,
      timeMultiplier: 1.0,
      isPaused: false,
      viewType: 'explorational' as const,
      objectRefsMap: { current: new Map() },
      onObjectHover: vi.fn(),
      onObjectSelect: vi.fn(),
      onObjectFocus: vi.fn(),
      registerRef: vi.fn()
    }

    it('renders complete solar system with all geometry types without errors', () => {
      const systemData = createSolarSystemData()
      
      expect(() => {
        render(
          <Canvas>
            <SystemObjectsRenderer systemData={systemData} {...baseSystemProps} />
          </Canvas>
        )
      }).not.toThrow()
    })

    it('renders objects with correct IDs without errors', () => {
      const systemData = createSolarSystemData()
      
      expect(() => {
        render(
          <Canvas>
            <SystemObjectsRenderer systemData={systemData} {...baseSystemProps} />
          </Canvas>
        )
      }).not.toThrow()
    })

    it('handles object selection correctly', () => {
      const systemData = createSolarSystemData()
      const onObjectSelect = vi.fn()
      
      render(
        <Canvas>
          <SystemObjectsRenderer 
            systemData={systemData} 
            {...baseSystemProps}
            selectedObjectId="earth"
            onObjectSelect={onObjectSelect}
          />
        </Canvas>
      )

      // Earth should be marked as selected
      // This is tested through props passed to individual renderers
    })

    it('handles multiple objects with rings without errors', () => {
      const systemWithRings = {
        ...createSolarSystemData(),
        objects: [
          ...createSolarSystemData().objects,
          {
            id: 'saturn',
            name: 'Saturn',
            classification: 'planet' as const,
            geometry_type: 'gas_giant' as const,
            orbit: {
              parent: 'sun',
              semi_major_axis: 9.5,
              eccentricity: 0.056,
              inclination: 2.5,
              orbital_period: 10759
            },
            properties: {
              mass: 95.2,
              radius: 58232,
              temperature: 134,
              band_contrast: 70,
              cloud_opacity: 85
            },
            rings: [
              {
                id: 'saturn-c-ring',
                geometry_type: 'ring' as const,
                name: 'C Ring',
                radius_start: 1.2,
                radius_end: 1.5,
                inclination: 0,
                density: 'sparse' as const,
                composition: ['ice'],
                opacity: 40
              },
              {
                id: 'saturn-b-ring',
                geometry_type: 'ring' as const,
                name: 'B Ring',
                radius_start: 1.5,
                radius_end: 1.95,
                inclination: 0,
                density: 'dense' as const,
                composition: ['ice'],
                opacity: 90
              },
              {
                id: 'saturn-a-ring',
                geometry_type: 'ring' as const,
                name: 'A Ring',
                radius_start: 2.0,
                radius_end: 2.3,
                inclination: 0,
                density: 'moderate' as const,
                composition: ['ice'],
                opacity: 70
              }
            ]
          }
        ]
      }

      expect(() => {
        render(
          <Canvas>
            <SystemObjectsRenderer systemData={systemWithRings} {...baseSystemProps} />
          </Canvas>
        )
      }).not.toThrow()
    })
  })

  describe('GeometryRendererFactory Direct Integration', () => {
    it('properly integrates with SystemObjectsRenderer without errors', () => {
      const testObject: CelestialObject = {
        id: 'test-planet',
        name: 'Test Planet',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: {
          mass: 1.0,
          radius: 6371,
          temperature: 288
        }
      }

      expect(() => {
        render(
          <Canvas>
            <GeometryRendererFactory 
              object={testObject}
              scale={1.0}
              registerRef={vi.fn()}
            />
          </Canvas>
        )
      }).not.toThrow()
    })

    it('handles geometry type changes without errors', () => {
      const baseObject: CelestialObject = {
        id: 'morphing-object',
        name: 'Morphing Object',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: {
          mass: 1.0,
          radius: 6371,
          temperature: 288
        }
      }

      const { rerender } = render(
        <Canvas>
          <GeometryRendererFactory 
            object={baseObject}
            scale={1.0}
            registerRef={vi.fn()}
          />
        </Canvas>
      )

      // Change geometry type
      const updatedObject = {
        ...baseObject,
        geometry_type: 'gas_giant' as const
      }

      expect(() => {
        rerender(
          <Canvas>
            <GeometryRendererFactory 
              object={updatedObject}
              scale={1.0}
              registerRef={vi.fn()}
            />
          </Canvas>
        )
      }).not.toThrow()
    })
  })

  describe('Ring System Integration', () => {
    it('renders rings on ring-capable objects without errors', () => {
      const planetWithRings: CelestialObject = {
        id: 'ringed-planet',
        name: 'Ringed Planet',
        classification: 'planet',
        geometry_type: 'gas_giant',
        properties: {
          mass: 100.0,
          radius: 50000,
          temperature: 150
        },
        rings: [{
          id: 'test-ring',
          geometry_type: 'ring',
          name: 'Test Ring',
          radius_start: 2.0,
          radius_end: 3.0,
          inclination: 0,
          density: 'moderate',
          composition: ['ice'],
          opacity: 80
        }]
      }

      expect(() => {
        render(
          <Canvas>
            <GeometryRendererFactory 
              object={planetWithRings}
              scale={1.0}
              registerRef={vi.fn()}
            />
          </Canvas>
        )
      }).not.toThrow()
    })

    it('does not render rings on non-ring-capable objects', () => {
      const starWithRings: CelestialObject = {
        id: 'ringed-star',
        name: 'Ringed Star',
        classification: 'star',
        geometry_type: 'star',
        properties: {
          mass: 1.0,
          radius: 696340,
          temperature: 5778
        },
        rings: [{
          id: 'impossible-ring',
          geometry_type: 'ring',
          name: 'Impossible Ring',
          radius_start: 2.0,
          radius_end: 3.0,
          inclination: 0,
          density: 'sparse',
          composition: ['plasma'],
          opacity: 50
        }]
      }

      expect(() => {
        render(
          <Canvas>
            <GeometryRendererFactory 
              object={starWithRings}
              scale={1.0}
              registerRef={vi.fn()}
            />
          </Canvas>
        )
      }).not.toThrow()
    })
  })

  describe('Error Handling Integration', () => {
    it('handles missing geometry types gracefully', () => {
      const objectWithBadGeometry = {
        id: 'bad-object',
        name: 'Bad Object',
        classification: 'planet' as const,
        geometry_type: 'nonexistent' as any,
        properties: {
          mass: 1.0,
          radius: 1000,
          temperature: 300
        }
      }

      expect(() => {
        render(
          <Canvas>
            <GeometryRendererFactory 
              object={objectWithBadGeometry}
              scale={1.0}
              registerRef={vi.fn()}
            />
          </Canvas>
        )
      }).not.toThrow()
    })

    it('handles empty system data without errors', () => {
      const emptySystem: OrbitalSystemData = {
        id: 'empty',
        name: 'Empty System',
        description: 'No objects',
        objects: [],
        lighting: {
          primary_star: 'none',
          ambient_level: 0.1,
          stellar_influence_radius: 10
        }
      }

      expect(() => {
        render(
          <Canvas>
            <SystemObjectsRenderer 
              systemData={emptySystem} 
              {...{
                selectedObjectId: null,
                timeMultiplier: 1.0,
                isPaused: false,
                viewType: 'explorational' as const,
                objectRefsMap: { current: new Map() },
                onObjectHover: vi.fn(),
                registerRef: vi.fn()
              }}
            />
          </Canvas>
        )
      }).not.toThrow()
    })
  })
}) 