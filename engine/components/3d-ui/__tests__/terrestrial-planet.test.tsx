import { render } from '@testing-library/react'
import { TerrestrialPlanet } from '../terrestrial-planet'
import { useFrame } from '@react-three/fiber'

// Mock useFrame
jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn()
}))

describe('TerrestrialPlanet', () => {
  const mockUseFrame = useFrame as jest.Mock
  
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
    expect(geometry).toHaveAttribute('args', '1,1.5,64,64')
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
      topColor: [0.9, 0.9, 0.9],
      middleColor: [0.3, 0.6, 0.3],
      bottomColor: [0.2, 0.3, 0.6]
    }
    
    render(<TerrestrialPlanet customizations={customizations} />)
    expect(mockUseFrame).toHaveBeenCalled()
  })
  
  it('updates uniforms in animation frame', () => {
    const mockCallback = jest.fn()
    mockUseFrame.mockImplementation(mockCallback)
    
    render(<TerrestrialPlanet />)
    
    expect(mockCallback).toHaveBeenCalled()
    const frameCallback = mockCallback.mock.calls[0][0]
    
    // Simulate frame update
    const mockClock = { getElapsedTime: () => 1.0 }
    frameCallback({ clock: mockClock })
  })
}) 