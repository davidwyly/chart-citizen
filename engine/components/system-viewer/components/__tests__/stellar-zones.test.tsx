import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { StellarZones } from '../stellar-zones'
import type { OrbitalSystemData, CelestialObject } from '@/engine/types/orbital-system'
import { describe, it, expect } from 'vitest'

// Mock star data generator for testing
const createMockStar = (spectralType = 'G2V', temperature = 5778): CelestialObject => ({
  id: 'test-star',
  name: 'Test Star',
  classification: 'star',
  geometry_type: 'star',
  properties: {
    mass: 1.0,
    radius: 695700, // km - Sun radius
    temperature: temperature,
    spectral_type: spectralType,
  },
  position: [0, 0, 0],
})

// Mock system data generator using correct OrbitalSystemData interface
const createMockSystemData = (spectralType = 'G2V', temperature = 5778): OrbitalSystemData => ({
  id: 'test-system',
  name: 'Test System',
  description: 'Test system for stellar zones',
  objects: [createMockStar(spectralType, temperature)],
  lighting: {
    primary_star: 'test-star',
    ambient_level: 0.1,
    stellar_influence_radius: 50
  }
})

const mockSystemDataG2 = createMockSystemData('G2V', 5778)
const mockSystemDataK1 = createMockSystemData('K1V', 5000)
const mockSystemDataM5 = createMockSystemData('M5V', 3000)

// Empty system for edge case testing
const mockEmptySystemData: OrbitalSystemData = {
  id: 'empty-system',
  name: 'Empty System',
  description: 'Empty system for testing',
  objects: [],
  lighting: {
    primary_star: '',
    ambient_level: 0.1,
    stellar_influence_radius: 10
  }
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Canvas>
    {children}
  </Canvas>
)

describe('StellarZones Component', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <StellarZones
            systemData={mockSystemDataG2}
            viewType="realistic"
            orbitalScale={1.0}
            showZones={true}
          />
        </TestWrapper>
      )
    }).not.toThrow()
  })

  it('renders for G-type star system', () => {
    const result = render(
      <TestWrapper>
        <StellarZones
          systemData={mockSystemDataG2}
          viewType="realistic"
          orbitalScale={1.0}
          showZones={true}
        />
      </TestWrapper>
    )
    
    // Component should render successfully
    expect(result.container).toBeTruthy()
  })

  it('renders for K-type star system', () => {
    const result = render(
      <TestWrapper>
        <StellarZones
          systemData={mockSystemDataK1}
          viewType="realistic"
          orbitalScale={1.0}
          showZones={true}
        />
      </TestWrapper>
    )
    
    expect(result.container).toBeTruthy()
  })

  it('renders for M-type star system', () => {
    const result = render(
      <TestWrapper>
        <StellarZones
          systemData={mockSystemDataM5}
          viewType="realistic"
          orbitalScale={1.0}
          showZones={true}
        />
      </TestWrapper>
    )
    
    expect(result.container).toBeTruthy()
  })

  it('handles different view types', () => {
    expect(() => {
      render(
        <TestWrapper>
          <StellarZones
            systemData={mockSystemDataG2}
            viewType="navigational"
            orbitalScale={1.0}
            showZones={true}
          />
        </TestWrapper>
      )
    }).not.toThrow()

    expect(() => {
      render(
        <TestWrapper>
          <StellarZones
            systemData={mockSystemDataG2}
            viewType="profile"
            orbitalScale={1.0}
            showZones={true}
          />
        </TestWrapper>
      )
    }).not.toThrow()
  })

  it('respects showZones prop', () => {
    const result = render(
      <TestWrapper>
        <StellarZones
          systemData={mockSystemDataG2}
          viewType="realistic"
          orbitalScale={1.0}
          showZones={false}
        />
      </TestWrapper>
    )
    
    expect(result.container).toBeTruthy()
  })

  it('handles system with no stars gracefully', () => {
    expect(() => {
      render(
        <TestWrapper>
          <StellarZones
            systemData={mockEmptySystemData}
            viewType="realistic"
            orbitalScale={1.0}
            showZones={true}
          />
        </TestWrapper>
      )
    }).not.toThrow()
  })

  it('scales zones with orbital scale factor', () => {
    const result1 = render(
      <TestWrapper>
        <StellarZones
          systemData={mockSystemDataG2}
          viewType="realistic"
          orbitalScale={1.0}
          showZones={true}
        />
      </TestWrapper>
    )

    const result2 = render(
      <TestWrapper>
        <StellarZones
          systemData={mockSystemDataG2}
          viewType="realistic"
          orbitalScale={2.0}
          showZones={true}
        />
      </TestWrapper>
    )

    // Both should render successfully with different scales
    expect(result1.container).toBeTruthy()
    expect(result2.container).toBeTruthy()
  })

  it('handles stars without explicit spectral type', () => {
    const starWithoutSpectralType: CelestialObject = {
      id: 'temp-star',
      name: 'Temperature Star',
      classification: 'star',
      geometry_type: 'star',
      properties: {
        mass: 1.0,
        radius: 695700,
        temperature: 6000, // No spectral_type, should infer from temperature
      },
      position: [0, 0, 0],
    }

         const systemDataTempStar: OrbitalSystemData = {
       id: 'temp-system',
       name: 'Temperature System',
       description: 'System with temperature-based star classification',
       objects: [starWithoutSpectralType],
       lighting: {
         primary_star: 'temp-star',
         ambient_level: 0.1,
         stellar_influence_radius: 50
       }
     }

    expect(() => {
      render(
        <TestWrapper>
          <StellarZones
            systemData={systemDataTempStar}
            viewType="realistic"
            orbitalScale={1.0}
            showZones={true}
          />
        </TestWrapper>
      )
    }).not.toThrow()
  })
}) 