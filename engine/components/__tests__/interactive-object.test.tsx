import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import { InteractiveObject } from '../3d-ui/interactive-object'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Three.js objects and behaviors
vi.mock('three', () => {
  const actualThree = vi.importActual('three')
  return {
    ...actualThree,
    Group: class MockGroup {
      position = { x: 0, y: 0, z: 0 }
      getWorldPosition(target: THREE.Vector3) {
        target.set(0, 0, 0)
        return target
      }
    },
    Vector3: class MockVector3 {
      set(x: number, y: number, z: number) { return this }
      copy() { return this }
      normalize() { return this }
      multiplyScalar() { return this }
      lerp() { return this }
      add() { return this }
      sub() { return this }
      negate() { return this }
      crossVectors() { return this }
    }
  }
})

// Mock @react-three/drei Html component
vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <div data-testid="html-label">{children}</div>
}))

describe('InteractiveObject', () => {
  const defaultProps = {
    objectId: 'test-object',
    objectName: 'Test Object',
    objectType: 'planet' as const,
    radius: 1,
    position: [0, 0, 0] as [number, number, number],
    children: <mesh />
  }

  const renderWithCanvas = (ui: React.ReactElement) => {
    return render(
      <Canvas>
        {ui}
      </Canvas>
    )
  }

  it('calls onSelect when object is clicked', () => {
    const onSelect = vi.fn()
    const { container } = renderWithCanvas(
      <InteractiveObject
        {...defaultProps}
        onSelect={onSelect}
      />
    )

    // Find and click the collision mesh
    const mesh = container.querySelector('mesh')
    if (mesh) {
      act(() => {
        fireEvent.click(mesh)
      })
    }

    expect(onSelect).toHaveBeenCalledWith(
      'test-object',
      expect.any(THREE.Group),
      'Test Object'
    )
  })

  it('calls onSelect when label is clicked', () => {
    const onSelect = vi.fn()
    const { getByTestId } = renderWithCanvas(
      <InteractiveObject
        {...defaultProps}
        onSelect={onSelect}
        showLabel={true}
      />
    )

    // Find and click the label
    const label = getByTestId('html-label')
    act(() => {
      fireEvent.click(label)
    })

    expect(onSelect).toHaveBeenCalledWith(
      'test-object',
      expect.any(THREE.Group),
      'Test Object'
    )
  })

  it('shows label based on object type and selection state', () => {
    const { getByTestId, rerender } = renderWithCanvas(
      <InteractiveObject
        {...defaultProps}
        showLabel={true}
      />
    )

    // Planet should always show label
    expect(getByTestId('html-label')).toBeDefined()

    // Moon should only show label when selected or parent selected
    rerender(
      <Canvas>
        <InteractiveObject
          {...defaultProps}
          objectType="moon"
          showLabel={true}
        />
      </Canvas>
    )
    expect(() => getByTestId('html-label')).toThrow()

    rerender(
      <Canvas>
        <InteractiveObject
          {...defaultProps}
          objectType="moon"
          showLabel={true}
          isSelected={true}
        />
      </Canvas>
    )
    expect(getByTestId('html-label')).toBeDefined()
  })

  it('shows moon label when its parent planet is selected', () => {
    const { getByTestId, rerender } = renderWithCanvas(
      <InteractiveObject
        {...defaultProps}
        objectType="moon"
        showLabel={true}
        planetSystemSelected={true}
      />
    )
    expect(getByTestId('html-label')).toBeDefined()

    rerender(
      <Canvas>
        <InteractiveObject
          {...defaultProps}
          objectType="moon"
          showLabel={true}
          planetSystemSelected={false}
        />
      </Canvas>
    )
    expect(() => getByTestId('html-label')).toThrow()
  })

  it('handles hover states correctly', () => {
    const onHover = vi.fn()
    const { container } = renderWithCanvas(
      <InteractiveObject
        {...defaultProps}
        onHover={onHover}
      />
    )

    const mesh = container.querySelector('mesh')
    if (mesh) {
      // Test pointer over
      act(() => {
        fireEvent.pointerOver(mesh)
      })
      expect(onHover).toHaveBeenCalledWith('test-object', true)

      // Test pointer out
      act(() => {
        fireEvent.pointerOut(mesh)
      })
      expect(onHover).toHaveBeenCalledWith('test-object', false)
    }
  })
}) 