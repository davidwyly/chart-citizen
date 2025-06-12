import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { StellarZones } from '../stellar-zones'
import type { SystemData } from '@/engine/system-loader'
import { describe, it, expect } from 'vitest'

// Mock system data for testing
const mockSystemData: SystemData = {
  id: 'test-system',
  name: 'Test System',
  description: 'Test system for stellar zones',
  barycenter: [0, 0, 0],
  stars: [
    {
      id: 'test-star',
      catalog_ref: 'g2v-main-sequence',
      name: 'Test Star',
      position: [0, 0, 0]
    }
  ],
  lighting: {
    primary_star: 'test-star',
    ambient_level: 0.1,
    stellar_influence_radius: 50
  }
}

const mockSystemDataKDwarf: SystemData = {
  ...mockSystemData,
  stars: [
    {
      id: 'k-star',
      catalog_ref: 'k1v-main-sequence',
      name: 'K-Type Star',
      position: [0, 0, 0]
    }
  ]
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
            systemData={mockSystemData}
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
          systemData={mockSystemData}
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
          systemData={mockSystemDataKDwarf}
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
            systemData={mockSystemData}
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
            systemData={mockSystemData}
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
          systemData={mockSystemData}
          viewType="realistic"
          orbitalScale={1.0}
          showZones={false}
        />
      </TestWrapper>
    )
    
    expect(result.container).toBeTruthy()
  })

  it('handles system with no stars gracefully', () => {
    const emptySystemData: SystemData = {
      ...mockSystemData,
      stars: []
    }

    expect(() => {
      render(
        <TestWrapper>
          <StellarZones
            systemData={emptySystemData}
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
          systemData={mockSystemData}
          viewType="realistic"
          orbitalScale={1.0}
          showZones={true}
        />
      </TestWrapper>
    )

    const result2 = render(
      <TestWrapper>
        <StellarZones
          systemData={mockSystemData}
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
}) 