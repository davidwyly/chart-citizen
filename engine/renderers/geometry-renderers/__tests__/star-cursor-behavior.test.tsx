import React from 'react'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { StarRenderer } from '../star-renderer'
import { describe, it, expect, vi } from 'vitest'
import type { CelestialObject } from '@/engine/types/orbital-system'

// Mock InteractiveObject to test the cursor behavior
vi.mock('../../components/3d-ui/interactive-object', () => ({
  InteractiveObject: ({ children, onHover, ...props }: any) => {
    return (
      <div
        data-testid="interactive-object"
        data-on-hover={onHover ? 'true' : 'false'}
        onPointerOver={() => {
          // Simulate InteractiveObject's cursor change behavior
          document.body.style.cursor = 'pointer'
          if (onHover) onHover(props.objectId, true)
        }}
        onPointerOut={() => {
          // Simulate InteractiveObject's cursor reset behavior  
          document.body.style.cursor = 'auto'
          if (onHover) onHover(props.objectId, false)
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
}))

describe('StarRenderer Cursor Behavior with InteractiveObject', () => {
  const mockStar: CelestialObject = {
    id: 'test-star',
    name: 'Test Star',
    classification: 'star',
    geometry_type: 'star',
    properties: {
      mass: 1.0,
      radius: 696340,
      temperature: 5778,
      color_temperature: 5778,
      luminosity: 100,
      solar_activity: 50,
      corona_thickness: 30,
      variability: 10,
    }
  }

  it('should use InteractiveObject for cursor handling', () => {
    const onHover = vi.fn()
    
    const { getByTestId } = render(
      <Canvas>
        <StarRenderer 
          object={mockStar}
          scale={1.0}
          onHover={onHover}
        />
      </Canvas>
    )

    // Should render with InteractiveObject
    const interactiveObject = getByTestId('interactive-object')
    expect(interactiveObject).toBeTruthy()
    expect(interactiveObject.getAttribute('data-on-hover')).toBe('true')
  })

  it('should change cursor through InteractiveObject', () => {
    const onHover = vi.fn()
    
    const { getByTestId } = render(
      <Canvas>
        <StarRenderer 
          object={mockStar}
          scale={1.0}
          onHover={onHover}
        />
      </Canvas>
    )

    const interactiveObject = getByTestId('interactive-object')
    
    // Initial cursor should be auto
    expect(document.body.style.cursor).toBe('auto')

    // Simulate hover
    interactiveObject.dispatchEvent(new Event('pointerover'))
    expect(document.body.style.cursor).toBe('pointer')
    expect(onHover).toHaveBeenCalledWith('test-star', true)

    // Simulate leave
    interactiveObject.dispatchEvent(new Event('pointerout'))
    expect(document.body.style.cursor).toBe('auto')
    expect(onHover).toHaveBeenCalledWith('test-star', false)
  })
})