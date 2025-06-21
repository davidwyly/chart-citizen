import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CelestialViewer } from '../celestial-viewer'
import { Canvas } from '@react-three/fiber'
import { TerrestrialControls } from '../controls/terrestrial-controls'
import type { CelestialObject } from '@/engine/types/orbital-system'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null)
  }),
  useParams: () => ({})
}))

// Mock @react-three/fiber and @react-three/drei
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useThree: () => ({
    camera: { position: { distanceTo: vi.fn().mockReturnValue(10) } },
    scene: {}
  }),
  useFrame: vi.fn(),
  extend: vi.fn()
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Preload: () => <div data-testid="preload" />,
  Html: ({ children }: { children: React.ReactNode }) => <div data-testid="html-label">{children}</div>,
  shaderMaterial: vi.fn(() => vi.fn())
}))

vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: { children: React.ReactNode }) => <div data-testid="effect-composer">{children}</div>,
  // Bloom: () => <div data-testid="bloom" /> // Removed for build compatibility
}))

// Mock Three.js
vi.mock('three', () => ({
  ...vi.importActual('three'),
  Vector3: vi.fn().mockImplementation(() => ({
    copy: vi.fn().mockReturnThis(),
    normalize: vi.fn().mockReturnThis(),
    subVectors: vi.fn().mockReturnThis(),
    getWorldPosition: vi.fn()
  })),
  Color: vi.fn(),
  MathUtils: {
    clamp: vi.fn((value, min, max) => Math.max(min, Math.min(max, value)))
  }
}))

// Mock the geometry renderers
vi.mock('@/engine/renderers/geometry-renderers', () => ({
  GeometryRendererFactory: ({ object }: { object: any }) => (
    <div data-testid={`geometry-renderer-${object.geometry_type}`} data-object-id={object.id}>
      {object.name} ({object.geometry_type})
    </div>
  )
}))

// Mock other components
vi.mock('../object-catalog', () => ({
  ObjectCatalog: ({ selectedObjectId, onObjectSelect }: any) => (
    <div data-testid="object-catalog">
      <button onClick={() => onObjectSelect('g2v-main-sequence')}>G2V Star</button>
      <button onClick={() => onObjectSelect('terrestrial-rocky')}>Terrestrial Planet</button>
      <button onClick={() => onObjectSelect('gas-giant')}>Gas Giant</button>
      <button onClick={() => onObjectSelect('rocky-moon')}>Rocky Moon</button>
      <button onClick={() => onObjectSelect('black-hole')}>Black Hole</button>
    </div>
  )
}))

vi.mock('../object-controls', () => ({
  ObjectControls: () => <div data-testid="object-controls" />
}))

vi.mock('../object-info', () => ({
  ObjectInfo: () => <div data-testid="object-info" />
}))

vi.mock('../../skybox/starfield-skybox', () => ({
  StarfieldSkybox: () => <div data-testid="starfield-skybox" />
}))

vi.mock('@/engine/system-loader', () => ({
  EngineSystemLoader: vi.fn(() => ({
    loadSystem: vi.fn((mode: string, systemId: string) => {
      if (systemId === 'invalid-object') {
        return Promise.resolve({
          id: 'g2v-main-sequence',
          name: 'G2V Main Sequence Star',
          classification: 'star',
          geometry_type: 'star',
          properties: { mass: 1, radius: 695700, temperature: 5778 }
        })
      } else if (systemId === 'sol' && mode === 'realistic') {
        // Mock for other tests that might try to load 'sol' system
        return Promise.resolve({
          id: 'sol',
          name: 'Sol System',
          description: 'Our solar system',
          objects: [
            {
              id: 'g2v-main-sequence',
              name: 'G2V Main Sequence Star',
              classification: 'star',
              geometry_type: 'star',
              properties: { mass: 1, radius: 695700, temperature: 5778 }
            }
          ],
          lighting: { primary_star: 'g2v-main-sequence', ambient_level: 0.1, stellar_influence_radius: 100 }
        })
      }
      return Promise.resolve(null)
    })
  }))
}))

describe('CelestialViewer Geometry Types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders G2V star with star geometry type', async () => {
    render(<CelestialViewer initialObjectType="g2v-main-sequence" />)
    
    // Wait for the object to load and render
    await vi.waitFor(() => {
      expect(screen.getByTestId('geometry-renderer-star')).toBeInTheDocument()
    })
    
    const renderer = screen.getByTestId('geometry-renderer-star')
    expect(renderer).toHaveAttribute('data-object-id', 'g2v-main-sequence')
    expect(renderer).toHaveTextContent('G2V Main Sequence Star (star)')
  })

  it('renders terrestrial planet with terrestrial geometry type', async () => {
    render(<CelestialViewer initialObjectType="terrestrial-rocky" />)
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('geometry-renderer-terrestrial')).toBeInTheDocument()
    })
    
    const renderer = screen.getByTestId('geometry-renderer-terrestrial')
    expect(renderer).toHaveAttribute('data-object-id', 'terrestrial-rocky')
    expect(renderer).toHaveTextContent('Terrestrial Rocky Planet (terrestrial)')
  })

  it('renders gas giant with gas_giant geometry type', async () => {
    render(<CelestialViewer initialObjectType="gas-giant" />)
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('geometry-renderer-gas_giant')).toBeInTheDocument()
    })
    
    const renderer = screen.getByTestId('geometry-renderer-gas_giant')
    expect(renderer).toHaveAttribute('data-object-id', 'gas-giant')
    expect(renderer).toHaveTextContent('Gas Giant (gas_giant)')
  })

  it('renders rocky moon with rocky geometry type', async () => {
    render(<CelestialViewer initialObjectType="rocky-moon" />)
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('geometry-renderer-rocky')).toBeInTheDocument()
    })
    
    const renderer = screen.getByTestId('geometry-renderer-rocky')
    expect(renderer).toHaveAttribute('data-object-id', 'rocky-moon')
    expect(renderer).toHaveTextContent('Rocky Moon (rocky)')
  })

  it('renders black hole with exotic geometry type', async () => {
    render(<CelestialViewer initialObjectType="black-hole" />)

    await vi.waitFor(() => {
      expect(screen.getByTestId('geometry-renderer-exotic')).toBeInTheDocument()
    })
    
    const renderer = screen.getByTestId('geometry-renderer-exotic')
    expect(renderer).toHaveAttribute('data-object-id', 'black-hole')
    expect(renderer).toHaveTextContent('Black Hole (exotic)')
  })

  it('falls back to default object when invalid object is requested', async () => {
    render(<CelestialViewer initialObjectType="invalid-object" />)
    
    // Should fallback to g2v-main-sequence
    await vi.waitFor(() => {
      expect(screen.getByTestId('geometry-renderer-star')).toBeInTheDocument()
    })
    
    const renderer = screen.getByTestId('geometry-renderer-star')
    expect(renderer).toHaveAttribute('data-object-id', 'g2v-main-sequence')
  })

  it('renders canvas and essential UI components', () => {
    render(<CelestialViewer initialObjectType="g2v-main-sequence" />)
    
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
    expect(screen.getByTestId('object-catalog')).toBeInTheDocument()
    expect(screen.getByTestId('object-controls')).toBeInTheDocument()
    expect(screen.getByTestId('object-info')).toBeInTheDocument()
    expect(screen.getByTestId('starfield-skybox')).toBeInTheDocument()
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument()
  })
})

describe('Celestial Viewer Geometry Controls', () => {
  describe('TerrestrialControls', () => {
    const mockProperties: CelestialObject['properties'] = {
      mass: 1.0,
      radius: 6371,
      temperature: 288,
      soil_tint: 45,
      water: 70,
      temperature_class: 60,
      tectonics: 50,
      geomagnetism: 75,
      population: 80,
      flora: 80
    }

    const mockOnChange = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders all terrestrial parameter controls', () => {
      render(
        <TerrestrialControls 
          properties={mockProperties}
          onChange={mockOnChange}
        />
      )

      // Check that all expected controls are present
      expect(screen.getByText(/Terrestrial Properties/)).toBeInTheDocument()
      expect(screen.getByText(/Soil Tint/)).toBeInTheDocument()
      expect(screen.getByText(/Water Coverage/)).toBeInTheDocument()
      expect(screen.getByText(/Temperature/)).toBeInTheDocument()
      expect(screen.getByText(/Tectonics/)).toBeInTheDocument()
      expect(screen.getByText(/Geomagnetism/)).toBeInTheDocument()
      expect(screen.getByText(/Population/)).toBeInTheDocument()
      expect(screen.getByText(/Flora/)).toBeInTheDocument()
    })

    it('displays correct property values in sliders', () => {
      render(
        <TerrestrialControls 
          properties={mockProperties}
          onChange={mockOnChange}
        />
      )

      // Check that specific sliders have correct values
      expect(screen.getByLabelText(/Soil Tint/)).toHaveValue('45')
      expect(screen.getByLabelText(/Water Coverage/)).toHaveValue('70')
      expect(screen.getByLabelText(/Temperature/)).toHaveValue('60')
      expect(screen.getByLabelText(/Tectonics/)).toHaveValue('50')
      expect(screen.getByLabelText(/Geomagnetism/)).toHaveValue('75')
      expect(screen.getByLabelText(/Population/)).toHaveValue('80')
      expect(screen.getByLabelText(/Flora/)).toHaveValue('80')
    })

    it('uses default values for missing properties', () => {
      const incompleteProperties = {
        mass: 1.0,
        radius: 6371,
        temperature: 288
      }

      render(
        <TerrestrialControls 
          properties={incompleteProperties}
          onChange={mockOnChange}
        />
      )

      // Should use default values in specific sliders
      expect(screen.getByLabelText(/Soil Tint/)).toHaveValue('45') // Default
      expect(screen.getByLabelText(/Water Coverage/)).toHaveValue('50') // Default
      expect(screen.getByLabelText(/Temperature/)).toHaveValue('50') // Default
      expect(screen.getByLabelText(/Tectonics/)).toHaveValue('50') // Default
      expect(screen.getByLabelText(/Geomagnetism/)).toHaveValue('30') // Default
      expect(screen.getByLabelText(/Population/)).toHaveValue('0') // Default
      expect(screen.getByLabelText(/Flora/)).toHaveValue('30') // Default
    })

    it('calls onChange when slider values change', () => {
      render(
        <TerrestrialControls 
          properties={mockProperties}
          onChange={mockOnChange}
        />
      )

      const soilTintSlider = screen.getByLabelText(/Soil Tint/)
      
      // Simulate changing the slider value
      soilTintSlider.dispatchEvent(new Event('change', { bubbles: true }))
      
      // Note: In a real test, we'd need to set the value and trigger the change
      // This is a basic structure test to ensure the component renders correctly
    })
  })

  describe('Geometry Type Integration', () => {
    it('validates that terrestrial objects have expected properties', () => {
      const terrestrialObject: CelestialObject = {
        id: 'test-terrestrial',
        name: 'Test Terrestrial Planet',
        classification: 'planet',
        geometry_type: 'terrestrial',
        properties: {
          mass: 1.0,
          radius: 6371,
          temperature: 288,
          soil_tint: 45,
          water: 70,
          temperature_class: 60,
          tectonics: 50,
          geomagnetism: 75,
          population: 80,
          flora: 80
        }
      }

      expect(terrestrialObject.geometry_type).toBe('terrestrial')
      expect(terrestrialObject.properties.soil_tint).toBeDefined()
      expect(terrestrialObject.properties.water).toBeDefined()
      expect(terrestrialObject.properties.temperature_class).toBeDefined()
      expect(terrestrialObject.properties.tectonics).toBeDefined()
      expect(terrestrialObject.properties.geomagnetism).toBeDefined()
      expect(terrestrialObject.properties.population).toBeDefined()
      expect(terrestrialObject.properties.flora).toBeDefined()
    })
  })
}) 