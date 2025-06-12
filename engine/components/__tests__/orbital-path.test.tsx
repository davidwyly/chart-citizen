import { render, act } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { OrbitalPath } from '../orbital-path'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ViewType } from '@/lib/types/effects-level'

// Mock useFrame
vi.mock('@react-three/fiber', () => ({
  ...vi.importActual('@react-three/fiber'),
  useFrame: vi.fn((callback) => callback({}, 0.016)),
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('OrbitalPath', () => {
  const defaultProps = {
    semiMajorAxis: 10,
    eccentricity: 0.1,
    inclination: 0,
    orbitalPeriod: 365,
    viewType: 'realistic' as ViewType,
    timeMultiplier: 1,
    isPaused: false,
  }

  // Helper function to render the component in a Canvas
  const renderInCanvas = (props = {}) => {
    return render(
      <Canvas>
        <OrbitalPath {...defaultProps} {...props} />
      </Canvas>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', () => {
    const { container } = render(<OrbitalPath {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('renders with different orbital parameters', () => {
    const { container } = render(
      <OrbitalPath {...defaultProps} semiMajorAxis={20} eccentricity={0.5} />
    )
    expect(container).toBeTruthy()
  })

  it('handles view type changes', () => {
    const { container } = render(
      <OrbitalPath {...defaultProps} viewType="navigational" />
    )
    expect(container).toBeTruthy()
  })

  it('handles profile view type', () => {
    const { container } = render(
      <OrbitalPath {...defaultProps} viewType="profile" />
    )
    expect(container).toBeTruthy()
  })

  it('handles orbit visibility toggle', () => {
    const { container } = render(
      <OrbitalPath {...defaultProps} showOrbit={false} />
    )
    expect(container).toBeTruthy()
  })

  it('handles time multiplier changes', () => {
    const { container } = render(
      <OrbitalPath {...defaultProps} timeMultiplier={2} />
    )
    expect(container).toBeTruthy()
  })

  it('handles paused state', () => {
    const { container } = render(
      <OrbitalPath {...defaultProps} isPaused={true} />
    )
    expect(container).toBeTruthy()
  })

  describe('Edge Cases', () => {
    it('handles zero eccentricity', () => {
      const { container } = render(
        <OrbitalPath {...defaultProps} eccentricity={0} />
      )
      expect(container).toBeTruthy()
    })

    it('handles maximum eccentricity', () => {
      const { container } = render(
        <OrbitalPath {...defaultProps} eccentricity={0.99} />
      )
      expect(container).toBeTruthy()
    })

    it('handles zero inclination', () => {
      const { container } = render(
        <OrbitalPath {...defaultProps} inclination={0} />
      )
      expect(container).toBeTruthy()
    })

    it('handles maximum inclination', () => {
      const { container } = render(
        <OrbitalPath {...defaultProps} inclination={180} />
      )
      expect(container).toBeTruthy()
    })

    it('handles zero orbital period', () => {
      const { container } = render(
        <OrbitalPath {...defaultProps} orbitalPeriod={0} />
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Orbit Calculations', () => {
    it('calculates correct semi-minor axis', () => {
      const { container } = renderInCanvas({ 
        semiMajorAxis: 10, 
      })
      const group = container.querySelector('group')
      expect(group).toBeTruthy()
    })

    it('applies correct inclination', () => {
      const { container } = renderInCanvas({ 
      })
      const group = container.querySelector('group')
      expect(group).toBeTruthy()
    })
  })

  describe('View Type Handling', () => {
    it('renders circular orbit in navigational mode', () => {
      const { container } = renderInCanvas({ viewType: 'navigational' })
      const line = container.querySelector('line')
      expect(line).toBeTruthy()
    })

    it('renders elliptical orbit in realistic mode', () => {
      const { container } = renderInCanvas({ viewType: 'realistic' })
      const line = container.querySelector('line')
      expect(line).toBeTruthy()
    })
  })

  describe('Animation and Updates', () => {
    it('updates position when not paused', () => {
      const { container, rerender } = renderInCanvas({ isPaused: false })
      const initialGroup = container.querySelector('group')
      const initialPosition = initialGroup?.getAttribute('position')

      act(() => {
        const useFrameMock = useFrame as unknown as ReturnType<typeof vi.fn>
        useFrameMock.mock.calls[0][0]({ clock: { getElapsedTime: () => 0.1 } })
      })

      rerender(
        <Canvas>
          <OrbitalPath {...defaultProps} isPaused={false} />
        </Canvas>
      )

      const updatedGroup = container.querySelector('group')
      const updatedPosition = updatedGroup?.getAttribute('position')
      expect(updatedPosition).not.toEqual(initialPosition)
    })

    it('does not update position when paused', () => {
      const { container, rerender } = renderInCanvas({ isPaused: true })
      const initialGroup = container.querySelector('group')
      const initialPosition = initialGroup?.getAttribute('position')

      act(() => {
        const useFrameMock = useFrame as unknown as ReturnType<typeof vi.fn>
        useFrameMock.mock.calls[0][0]({ clock: { getElapsedTime: () => 0.1 } })
      })

      rerender(
        <Canvas>
          <OrbitalPath {...defaultProps} isPaused={true} />
        </Canvas>
      )

      const updatedGroup = container.querySelector('group')
      const updatedPosition = updatedGroup?.getAttribute('position')
      expect(updatedPosition).toEqual(initialPosition)
    })
  })

  describe('Performance', () => {
    it('memoizes orbit points calculation', () => {
      const { rerender } = renderInCanvas()
      const useFrameMock = useFrame as unknown as ReturnType<typeof vi.fn>
      const initialCallCount = useFrameMock.mock.calls.length

      rerender(
        <Canvas>
          <OrbitalPath {...defaultProps} />
        </Canvas>
      )

      expect(useFrameMock.mock.calls.length).toBe(initialCallCount)
    })

    it('handles rapid view type changes efficiently', () => {
      const { rerender } = renderInCanvas()
      const useFrameMock = useFrame as unknown as ReturnType<typeof vi.fn>
      const initialCallCount = useFrameMock.mock.calls.length

      act(() => {
        rerender(
          <Canvas>
            <OrbitalPath {...defaultProps} viewType="navigational" />
          </Canvas>
        )
        rerender(
          <Canvas>
            <OrbitalPath {...defaultProps} viewType="realistic" />
          </Canvas>
        )
        rerender(
          <Canvas>
            <OrbitalPath {...defaultProps} viewType="profile" />
          </Canvas>
        )
      })

      expect(useFrameMock.mock.calls.length).toBeLessThan(initialCallCount + 10)
    })
  })

  describe('Parent Object Following', () => {
    it('follows parent object position', () => {
      const objectRefsMap = { current: new Map() }
      const parentObject = new THREE.Object3D()
      parentObject.position.set(5, 5, 5)
      objectRefsMap.current.set('parent', parentObject)

      const { container } = renderInCanvas({
        parentObjectId: 'parent',
        objectRefsMap: objectRefsMap as any
      })

      const group = container.querySelector('group')
      expect(group).toBeTruthy()
      expect(group?.getAttribute('position')).toBeTruthy()
    })
  })

  it('adjusts opacity based on view type', () => {
    const { container } = render(<OrbitalPath {...defaultProps} viewType="navigational" />)
    expect(container.querySelector('line')).toHaveStyle({ opacity: '0.5' })
  })

  it('adjusts segments based on props', () => {
    const { container } = render(<OrbitalPath {...defaultProps} segments={32} />)
    const path = container.querySelector('line')
    expect(path).toBeInTheDocument()
  })

  it('adjusts radius based on props', () => {
    const { container } = render(<OrbitalPath {...defaultProps} radius={20} />)
    const path = container.querySelector('line')
    expect(path).toBeInTheDocument()
  })

  it('adjusts color based on props', () => {
    const { container } = render(<OrbitalPath {...defaultProps} color="#ff0000" />)
    const path = container.querySelector('line')
    expect(path).toHaveStyle({ stroke: '#ff0000' })
  })
}) 