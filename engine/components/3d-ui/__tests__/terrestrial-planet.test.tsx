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
    const mockCallback = vi.fn()
    mockUseFrame.mockImplementation(mockCallback)
    
    render(<TerrestrialPlanet />)
    
    expect(mockCallback).toHaveBeenCalled()
    const frameCallback = mockCallback.mock.calls[0][0]
    
    // Simulate frame update with mock material ref
    const mockMaterial = {
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        speed: { value: 1.0 },
        distortion: { value: 1.0 },
        topColor: { value: { setRGB: vi.fn() } },
        middleColor: { value: { setRGB: vi.fn() } },
        bottomColor: { value: { setRGB: vi.fn() } }
      }
    }
    
    const mockClock = { getElapsedTime: () => 1.0 }
    
    // Mock the material ref to return our mock material
    const originalRef = React.useRef
    vi.spyOn(React, 'useRef').mockReturnValue({ current: mockMaterial })
    
    try {
      frameCallback({ clock: mockClock })
      expect(mockMaterial.uniforms.time.value).toBe(1.0)
    } finally {
      vi.spyOn(React, 'useRef').mockRestore()
    }
  })
}) 