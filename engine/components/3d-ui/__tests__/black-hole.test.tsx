import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { BlackHole } from '../black-hole'
import { describe, it, expect } from 'vitest'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Canvas>
    {children}
  </Canvas>
)

describe('BlackHole Component', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <BlackHole />
        </TestWrapper>
      )
    }).not.toThrow()
  })

  it('renders with custom scale', () => {
    expect(() => {
      render(
        <TestWrapper>
          <BlackHole
            scale={2.0}
            shaderScale={1.5}
          />
        </TestWrapper>
      )
    }).not.toThrow()
  })

  it('renders with shader customizations', () => {
    expect(() => {
      render(
        <TestWrapper>
          <BlackHole
            customizations={{
              shader: {
                intensity: 1.5,
                speed: 2.0,
                distortion: 0.8,
                diskSpeed: 1.2,
                lensingStrength: 1.8,
                diskBrightness: 1.3
              }
            }}
          />
        </TestWrapper>
      )
    }).not.toThrow()
  })

  it('handles missing customizations gracefully', () => {
    expect(() => {
      render(
        <TestWrapper>
          <BlackHole
            customizations={{}}
          />
        </TestWrapper>
      )
    }).not.toThrow()
  })
}) 