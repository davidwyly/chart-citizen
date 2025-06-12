import { render, fireEvent } from '@testing-library/react'
import { InteractiveObject } from '../3d-ui/interactive-object'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

// Mock Three.js and react-three-fiber
jest.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: new THREE.PerspectiveCamera(),
    controls: { enabled: true }
  }),
  useFrame: (callback: any) => callback({ clock: { elapsedTime: 0 } }),
  extend: () => {}
}))

describe('InteractiveObject Selection', () => {
  const mockObject3D = new THREE.Object3D()
  const mockProps = {
    objectId: 'test-planet',
    objectName: 'Test Planet',
    objectType: 'planet' as const,
    radius: 1,
    position: [0, 0, 0] as [number, number, number],
    onSelect: jest.fn(),
    onHover: jest.fn(),
    children: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should trigger selection when clicking the object mesh', () => {
    const { container } = render(<InteractiveObject {...mockProps} />)
    const mesh = container.querySelector('mesh')
    
    // Simulate click on the mesh
    if (mesh) {
      fireEvent.click(mesh, {
        stopPropagation: () => {},
        target: mockObject3D
      } as unknown as ThreeEvent<MouseEvent>)
    }

    expect(mockProps.onSelect).toHaveBeenCalledWith(
      'test-planet',
      expect.any(THREE.Object3D),
      'Test Planet'
    )
  })

  it('should trigger selection when clicking the label', () => {
    const { getByText } = render(<InteractiveObject {...mockProps} />)
    const label = getByText('TEST PLANET')
    
    fireEvent.click(label)

    expect(mockProps.onSelect).toHaveBeenCalledWith(
      'test-planet',
      expect.any(THREE.Object3D),
      'Test Planet'
    )
  })

  it('should show gravity well effect when selected', () => {
    const { container } = render(<InteractiveObject {...mockProps} isSelected={true} />)
    
    // Check for the gravity well mesh (space curvature effect)
    const gravityWellMesh = container.querySelector('mesh[userData.selectable=false]')
    expect(gravityWellMesh).toBeTruthy()
    
    // Verify the material properties
    const material = gravityWellMesh?.querySelector('spaceCurvatureMaterial')
    expect(material).toBeTruthy()
    expect(material).toHaveAttribute('transparent', 'true')
    expect(material).toHaveAttribute('depthWrite', 'false')
  })
}) 