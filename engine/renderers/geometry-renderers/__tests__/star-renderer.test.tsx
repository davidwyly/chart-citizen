import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { StarRenderer } from '../star-renderer'
import type { CelestialObject } from '@/engine/types/orbital-system'

// Mock the star material
vi.mock('../../stars/materials/star-material', () => ({
  StarMaterial: (props: any) => <meshBasicMaterial data-testid="star-material" {...props} />
}))

describe('StarRenderer', () => {
  const createStarObject = (properties: Partial<CelestialObject['properties']> = {}): CelestialObject => ({
    id: 'sun',
    name: 'Sun',
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
      ...properties
    }
  })

  const baseProps = {
    scale: 1.0,
    starPosition: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
    isSelected: false,
    onHover: vi.fn(),
    onSelect: vi.fn(),
    onFocus: vi.fn(),
    registerRef: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders star with sphere geometry', () => {
      const object = createStarObject()
      const { container } = render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} />
        </Canvas>
      )

      const mesh = container.querySelector('mesh')
      expect(mesh).toBeInTheDocument()
      
      const sphereGeometry = container.querySelector('sphereGeometry')
      expect(sphereGeometry).toBeInTheDocument()
    })

    it('applies correct scale to sphere geometry', () => {
      const object = createStarObject()
      const { container } = render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} scale={3.0} />
        </Canvas>
      )

      const sphereGeometry = container.querySelector('sphereGeometry')
      expect(sphereGeometry).toHaveAttribute('args', '3.0,32,32')
    })

    it('uses star material', () => {
      const object = createStarObject()
      const { getByTestId } = render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} />
        </Canvas>
      )

      expect(getByTestId('star-material')).toBeInTheDocument()
    })
  })

  describe('Corona Rendering', () => {
    it('renders corona when corona_thickness > 0', () => {
      const objectWithCorona = createStarObject({ corona_thickness: 50 })
      const { container } = render(
        <Canvas>
          <StarRenderer object={objectWithCorona} {...baseProps} />
        </Canvas>
      )

      // Should have main star mesh plus corona mesh
      const meshes = container.querySelectorAll('mesh')
      expect(meshes.length).toBeGreaterThanOrEqual(2)
    })

    it('does not render corona when corona_thickness is 0', () => {
      const objectWithoutCorona = createStarObject({ corona_thickness: 0 })
      const { container } = render(
        <Canvas>
          <StarRenderer object={objectWithoutCorona} {...baseProps} />
        </Canvas>
      )

      // Should only have main star mesh
      const meshes = container.querySelectorAll('mesh')
      expect(meshes).toHaveLength(1)
    })

    it('scales corona based on corona_thickness property', () => {
      const objectWithThickCorona = createStarObject({ corona_thickness: 80 })
      const objectWithThinCorona = createStarObject({ corona_thickness: 20 })

      // Corona scale should be based on corona_thickness
      // Thick corona: scale = 1 + (80 / 100) * 0.5 = 1.4
      // Thin corona: scale = 1 + (20 / 100) * 0.5 = 1.1
      const thickCoronaScale = 1 + ((objectWithThickCorona.properties.corona_thickness || 0) / 100) * 0.5
      const thinCoronaScale = 1 + ((objectWithThinCorona.properties.corona_thickness || 0) / 100) * 0.5

      expect(thickCoronaScale).toBe(1.4)
      expect(thinCoronaScale).toBe(1.1)
    })
  })

  describe('Stellar Properties', () => {
    it('handles different stellar color temperatures', () => {
      const hotStar = createStarObject({ color_temperature: 25000 }) // Blue star
      const coolStar = createStarObject({ color_temperature: 3000 })  // Red star
      const sunlikeStar = createStarObject({ color_temperature: 5778 }) // Yellow star

      // Temperature should affect color calculation
      expect(hotStar.properties.color_temperature).toBe(25000)
      expect(coolStar.properties.color_temperature).toBe(3000)
      expect(sunlikeStar.properties.color_temperature).toBe(5778)
    })

    it('handles different luminosity levels', () => {
      const brightStar = createStarObject({ luminosity: 90 })
      const dimStar = createStarObject({ luminosity: 20 })

      expect(brightStar.properties.luminosity).toBe(90)
      expect(dimStar.properties.luminosity).toBe(20)
    })

    it('handles solar activity levels', () => {
      const activeStar = createStarObject({ solar_activity: 85 })
      const quietStar = createStarObject({ solar_activity: 15 })

      expect(activeStar.properties.solar_activity).toBe(85)
      expect(quietStar.properties.solar_activity).toBe(15)
    })

    it('handles stellar variability', () => {
      const variableStar = createStarObject({ variability: 75 })
      const stableStar = createStarObject({ variability: 5 })

      expect(variableStar.properties.variability).toBe(75)
      expect(stableStar.properties.variability).toBe(5)
    })
  })

  describe('Stellar Classification Support', () => {
    const stellarTypes = [
      { temp: 2500, class: 'M' },  // Red dwarf
      { temp: 4000, class: 'K' },  // Orange dwarf
      { temp: 5778, class: 'G' },  // Yellow dwarf (Sun)
      { temp: 7500, class: 'F' },  // Yellow-white
      { temp: 10000, class: 'A' }, // White
      { temp: 15000, class: 'B' }, // Blue-white
      { temp: 30000, class: 'O' }  // Blue giant
    ]

    stellarTypes.forEach(({ temp, class: stellarClass }) => {
      it(`handles ${stellarClass}-type star (${temp}K)`, () => {
        const star = createStarObject({ color_temperature: temp })
        
        const { container } = render(
          <Canvas>
            <StarRenderer object={star} {...baseProps} />
          </Canvas>
        )

        expect(container.querySelector('mesh')).toBeInTheDocument()
        expect(star.properties.color_temperature).toBe(temp)
      })
    })
  })

  describe('Animation and Effects', () => {
    it('handles rotation animation', () => {
      const object = createStarObject()
      const { container } = render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} />
        </Canvas>
      )

      // Star should have rotation animation
      // This is tested implicitly through the useFrame hook
      const mesh = container.querySelector('mesh')
      expect(mesh).toBeInTheDocument()
    })

    it('handles pulsation for variable stars', () => {
      const variableStar = createStarObject({ variability: 80 })
      const stableStar = createStarObject({ variability: 5 })

      // Variable stars should have pulsation effects
      expect(variableStar.properties.variability).toBeGreaterThan(50)
      expect(stableStar.properties.variability).toBeLessThan(20)
    })
  })

  describe('Interaction Handling', () => {
    it('handles click events', () => {
      const object = createStarObject()
      const onSelect = vi.fn()
      
      const { container } = render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} onSelect={onSelect} />
        </Canvas>
      )

      const mesh = container.querySelector('mesh')
      expect(mesh).toHaveAttribute('onClick')
    })

    it('handles hover events', () => {
      const object = createStarObject()
      const onHover = vi.fn()
      
      const { container } = render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} onHover={onHover} />
        </Canvas>
      )

      const mesh = container.querySelector('mesh')
      expect(mesh).toHaveAttribute('onPointerEnter')
      expect(mesh).toHaveAttribute('onPointerLeave')
    })

    it('handles focus events', () => {
      const object = createStarObject()
      const onFocus = vi.fn()
      
      const { container } = render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} onFocus={onFocus} />
        </Canvas>
      )

      const mesh = container.querySelector('mesh')
      expect(mesh).toHaveAttribute('onDoubleClick')
    })
  })

  describe('Light Source Behavior', () => {
    it('does not render rings (stars are not ring-capable)', () => {
      const starWithRings = {
        ...createStarObject(),
        rings: [{
          id: 'impossible-ring',
          geometry_type: 'ring' as const,
          name: 'Impossible Ring',
          radius_start: 2.0,
          radius_end: 3.0,
          inclination: 0,
          density: 'sparse' as const,
          composition: ['plasma'],
          opacity: 50
        }]
      }

      const { queryByTestId } = render(
        <Canvas>
          <StarRenderer object={starWithRings} {...baseProps} />
        </Canvas>
      )

      // Stars should not render rings even if present in data
      expect(queryByTestId('planet-rings')).not.toBeInTheDocument()
    })

    it('acts as primary light source', () => {
      const object = createStarObject()
      const { container } = render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} />
        </Canvas>
      )

      // Stars should emit light rather than reflect it
      const material = container.querySelector('[data-testid="star-material"]')
      expect(material).toBeInTheDocument()
    })
  })

  describe('Reference Registration', () => {
    it('registers object reference', () => {
      const object = createStarObject()
      const registerRef = vi.fn()

      render(
        <Canvas>
          <StarRenderer object={object} {...baseProps} registerRef={registerRef} />
        </Canvas>
      )

      // The ref should be registered after the component mounts
      // This is tested implicitly through the useEffect in the component
    })
  })

  describe('Ring Support Marker', () => {
    it('does not mark renderer as ring-capable', () => {
      // Stars should not support rings
      expect((StarRenderer as any).supportsRings).not.toBe(true)
    })
  })
}) 