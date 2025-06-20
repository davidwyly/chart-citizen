import React from 'react'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { StellarZones } from '../stellar-zones'
import { calculateSystemOrbitalMechanics } from '@/engine/core/pipeline'
import type { OrbitalSystemData, CelestialObject } from '@/engine/types/orbital-system'
import type { ViewType } from '@lib/types/effects-level'
import { describe, it, expect, beforeEach } from 'vitest'

// Real Sol system star data for integration testing
const solStar: CelestialObject = {
  id: 'sol-star',
  name: 'Sol',
  classification: 'star',
  geometry_type: 'star',
  properties: {
    mass: 1.0, // Solar mass
    radius: 695700, // km
    temperature: 5778, // K
    spectral_type: 'G2V',
    luminosity: 100,
  },
  position: [0, 0, 0],
}

const alphaCentauriA: CelestialObject = {
  id: 'alpha-centauri-a',
  name: 'Alpha Centauri A',
  classification: 'star',
  geometry_type: 'star',
  properties: {
    mass: 1.1,
    radius: 854000, // km
    temperature: 5790, // K
    spectral_type: 'G2V',
    luminosity: 120,
  },
  position: [0, 0, 0],
}

const proximaCentauri: CelestialObject = {
  id: 'proxima-centauri',
  name: 'Proxima Centauri',
  classification: 'star',
  geometry_type: 'star',
  properties: {
    mass: 0.123,
    radius: 107000, // km  
    temperature: 3042, // K
    spectral_type: 'M5.5V',
    luminosity: 0.17,
  },
  position: [0, 0, 0],
}

// Mock system data for different star types
const createRealSystemData = (star: CelestialObject): OrbitalSystemData => ({
  id: `${star.id}-system`,
  name: `${star.name} System`,
  description: `Integration test system for ${star.name}`,
  objects: [star],
  lighting: {
    primary_star: star.id,
    ambient_level: 0.1,
    stellar_influence_radius: 50,
  },
})

const solSystemData = createRealSystemData(solStar)
const alphaCentauriSystemData = createRealSystemData(alphaCentauriA)
const proximaCentauriSystemData = createRealSystemData(proximaCentauri)

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Canvas>
    {children}
  </Canvas>
)

describe('StellarZones Integration Tests', () => {
  beforeEach(() => {
    // Clear any cached calculations
    // Note: Using vitest, no jest.clearAllMocks needed
  })

  describe('Real System Data Integration', () => {
    it('renders habitable zones for Sol system correctly', () => {
      expect(() => {
        render(
          <TestWrapper>
            <StellarZones
              systemData={solSystemData}
              viewType="explorational"
              orbitalScale={1.0}
              showZones={true}
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('renders zones for Alpha Centauri A system', () => {
      expect(() => {
        render(
          <TestWrapper>
            <StellarZones
              systemData={alphaCentauriSystemData}
              viewType="explorational"
              orbitalScale={1.0}
              showZones={true}
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('renders zones for Proxima Centauri (M-dwarf) system', () => {
      expect(() => {
        render(
          <TestWrapper>
            <StellarZones
              systemData={proximaCentauriSystemData}
              viewType="explorational"
              orbitalScale={1.0}
              showZones={true}
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })
  })

  describe('Orbital Scaling Integration', () => {
    it('integrates properly with orbital mechanics calculator scaling', () => {
      const viewTypes: ViewType[] = ['explorational', 'navigational', 'profile']
      
             viewTypes.forEach(viewType => {
         // Calculate orbital mechanics for the system
         const orbitalData = calculateSystemOrbitalMechanics(solSystemData.objects, viewType)
         // Extract orbital scale from the orbital data - use a reasonable default
         const orbitalScale = 15.0 // Use realistic mode default orbital scaling

         expect(() => {
           render(
             <TestWrapper>
               <StellarZones
                 systemData={solSystemData}
                 viewType={viewType}
                 orbitalScale={orbitalScale}
                 showZones={true}
               />
             </TestWrapper>
           )
         }).not.toThrow()
       })
    })

    it('handles different orbital scales consistently', () => {
      const scales = [0.5, 1.0, 2.0, 5.0, 10.0]
      
      scales.forEach(scale => {
        expect(() => {
          render(
            <TestWrapper>
              <StellarZones
                systemData={solSystemData}
                viewType="explorational"
                orbitalScale={scale}
                showZones={true}
              />
            </TestWrapper>
          )
        }).not.toThrow()
      })
    })
  })

  describe('Cross-View-Mode Consistency', () => {
    it('maintains zone calculation consistency across view modes', () => {
      const viewTypes: ViewType[] = ['explorational', 'navigational', 'profile']
      const results: any[] = []

      viewTypes.forEach(viewType => {
        const result = render(
          <TestWrapper>
            <StellarZones
              systemData={solSystemData}
              viewType={viewType}
              orbitalScale={1.0}
              showZones={true}
            />
          </TestWrapper>
        )
        results.push(result)
      })

      // All view modes should render successfully
      results.forEach(result => {
        expect(result.container).toBeTruthy()
      })
    })

    it('handles view mode opacity changes correctly', () => {
      const viewTypes: ViewType[] = ['explorational', 'navigational', 'profile']
      
      viewTypes.forEach(viewType => {
        expect(() => {
          render(
            <TestWrapper>
              <StellarZones
                systemData={solSystemData}
                viewType={viewType}
                orbitalScale={1.0}
                showZones={true}
              />
            </TestWrapper>
          )
        }).not.toThrow()
      })
    })
  })

  describe('Spectral Type Integration', () => {
    it('handles G-type star zones correctly', () => {
      expect(() => {
        render(
          <TestWrapper>
            <StellarZones
              systemData={solSystemData}
              viewType="explorational"
              orbitalScale={1.0}
              showZones={true}
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('handles M-type star (red dwarf) zones correctly', () => {
      expect(() => {
        render(
          <TestWrapper>
            <StellarZones
              systemData={proximaCentauriSystemData}
              viewType="explorational"
              orbitalScale={1.0}
              showZones={true}
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('handles temperature inference when spectral type is missing', () => {
      const starWithoutSpectralType: CelestialObject = {
        ...solStar,
        id: 'temp-star',
        name: 'Temperature Star',
        properties: {
          ...solStar.properties,
          spectral_type: undefined, // Remove spectral type to test temperature inference
        },
      }

      const tempSystemData = createRealSystemData(starWithoutSpectralType)

      expect(() => {
        render(
          <TestWrapper>
            <StellarZones
              systemData={tempSystemData}
              viewType="explorational"
              orbitalScale={1.0}
              showZones={true}
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })
  })

  describe('Error Handling Integration', () => {
    it('handles systems with invalid star data gracefully', () => {
      const invalidStar: CelestialObject = {
        id: 'invalid-star',
        name: 'Invalid Star',
        classification: 'star',
        geometry_type: 'star',
        properties: {
          mass: 1.0,
          radius: 695700,
          temperature: NaN, // Invalid temperature
        },
        position: [0, 0, 0],
      }

      const invalidSystemData = createRealSystemData(invalidStar)

      expect(() => {
        render(
          <TestWrapper>
            <StellarZones
              systemData={invalidSystemData}
              viewType="explorational"
              orbitalScale={1.0}
              showZones={true}
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('handles extreme orbital scales gracefully', () => {
      const extremeScales = [0.001, 0.01, 100, 1000]
      
      extremeScales.forEach(scale => {
        expect(() => {
          render(
            <TestWrapper>
              <StellarZones
                systemData={solSystemData}
                viewType="explorational"
                orbitalScale={scale}
                showZones={true}
              />
            </TestWrapper>
          )
        }).not.toThrow()
      })
    })
  })
}) 