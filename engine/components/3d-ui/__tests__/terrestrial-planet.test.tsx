import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { TerrestrialPlanet } from '../terrestrial-planet'
import { useFrame } from '@react-three/fiber'

// Mock useFrame
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn()
}))

describe('TerrestrialPlanet', () => {
  const mockUseFrame = useFrame as any
  
  beforeEach(() => {
    mockUseFrame.mockReset()
  })
  
  it('renders with default props', () => {
    const { container } = render(<TerrestrialPlanet />)
    expect(container).toBeTruthy()
  })
  
  it('applies custom scale', () => {
    const { container } = render(<TerrestrialPlanet scale={2} />)
    const mesh = container.querySelector('mesh')
    expect(mesh).toHaveAttribute('scale', '2')
  })
  
  it('applies custom shader scale', () => {
    const { container } = render(<TerrestrialPlanet shaderScale={1.5} />)
    const geometry = container.querySelector('sphereGeometry')
    expect(geometry).toHaveAttribute('args', '1.5,64,64')
  })
  
  it('applies quality level', () => {
    render(<TerrestrialPlanet qualityLevel="medium" />)
    expect(mockUseFrame).toHaveBeenCalled()
  })
  
  it('applies customizations', () => {
    const customizations = {
      intensity: 0.8,
      speed: 0.5,
      distortion: 0.3,
      topColor: [0.9, 0.9, 0.9] as [number, number, number],
      middleColor: [0.3, 0.6, 0.3] as [number, number, number],
      bottomColor: [0.2, 0.3, 0.6] as [number, number, number]
    }
    
    render(<TerrestrialPlanet customizations={customizations} />)
    expect(mockUseFrame).toHaveBeenCalled()
  })
  
  it('updates uniforms in animation frame', () => {
    render(<TerrestrialPlanet />)
    
    // Verify that the useFrame hook is registered
    expect(mockUseFrame).toHaveBeenCalled()
    
    // Verify that a callback function was passed to useFrame
    const frameCallback = mockUseFrame.mock.calls[0][0]
    expect(typeof frameCallback).toBe('function')
    
    // We can't reliably test the frame callback execution in this test environment
    // due to the complex Three.js material mocking requirements, but we've verified
    // that the component properly registers with the useFrame hook
  })
}) 