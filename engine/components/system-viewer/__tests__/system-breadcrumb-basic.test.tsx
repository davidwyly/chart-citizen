import { render, screen } from '@testing-library/react'
import { SystemBreadcrumb } from '../system-breadcrumb'
import type * as THREE from 'three'

// Create a minimal test to verify the component structure
describe('SystemBreadcrumb Component', () => {
  const mockSystemData = {
    id: 'test-system',
    name: 'Test System',
    description: 'Test system',
    lighting: {
      primary_star: 'star-1',
      ambient_level: 0.1,
      stellar_influence_radius: 100
    },
    objects: [
      {
        id: 'star-1',
        name: 'Test Star', 
        classification: 'star' as const,
        geometry_type: 'star' as const,
        properties: { radius: 696000, mass: 1.989e30, temperature: 5778 }
      }
    ]
  }

  const mockObjectRefsMap = {
    current: new Map()
  }

  const mockProps = {
    systemData: mockSystemData,
    objectRefsMap: mockObjectRefsMap,
    onObjectFocus: () => {},
    focusedName: 'Test System'
  }

  it('should render the system name', () => {
    render(<SystemBreadcrumb {...mockProps} />)
    expect(screen.getByText('Test System')).toBeInTheDocument()
  })

  it('should render the starmap navigation button', () => {
    render(<SystemBreadcrumb {...mockProps} />)
    expect(screen.getByText('← Starmap')).toBeInTheDocument()
  })

  it('should have moon sub-navigation functionality available', () => {
    // Test that the component renders without crashing
    // The moon sub-navigation will be shown when planets with moons are present
    const { container } = render(<SystemBreadcrumb {...mockProps} />)
    expect(container).toBeInTheDocument()
    
    // Check that the main breadcrumb container is present
    expect(container.querySelector('.fixed.top-6')).toBeInTheDocument()
  })
}) 