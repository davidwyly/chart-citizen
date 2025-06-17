import { render } from '@testing-library/react'
import { expect, describe, it, vi } from 'vitest'
import React from 'react'
import { ObjectFactory } from '../object-factory'
import type { CatalogObject } from '../system-loader'

// Mock all renderer components
vi.mock('@/engine/renderers/stars/star-renderer', () => ({
  StarRenderer: (props: any) => <div data-testid="star-renderer" {...props} />
}))
vi.mock('@/engine/renderers/planets/gas-giant-renderer', () => ({
  GasGiantRenderer: (props: any) => <div data-testid="gas-giant-renderer" {...props} />
}))
vi.mock('@/engine/renderers/planets/terrestrial-planet-renderer', () => ({
  TerrestrialPlanetRenderer: (props: any) => <div data-testid="terrestrial-planet-renderer" {...props} />
}))
vi.mock('@/engine/renderers/planets/planet-renderer', () => ({
  PlanetRenderer: (props: any) => <div data-testid="planet-renderer" {...props} />
}))

describe('ObjectFactory', () => {
  const baseCatalog: CatalogObject = {
    id: 'test-object',
    name: 'Test Object',
    engine_object: 'main-sequence-star',
    category: 'star',
    mass: 1.0,
    radius: 1.0,
    render: {
      shader: 'standard',
      color: '#ffffff',
      texture: 'star-texture.jpg'
    }
  }

  it('renders star renderer for star objects', () => {
    const { getByTestId } = render(<ObjectFactory catalogData={baseCatalog} />)
    expect(getByTestId('star-renderer')).toBeInTheDocument()
  })

  it('renders planet renderer for planet objects', () => {
    const catalogData = { ...baseCatalog, engine_object: 'terrestrial-planet', category: 'planet' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders gas giant correctly', () => {
    const catalogData = { ...baseCatalog, engine_object: 'gas-giant' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('gas-giant-renderer')).toBeInTheDocument()
  })

  it('renders TerrestrialPlanetRenderer for earth-like', () => {
    const catalogData = { ...baseCatalog, engine_object: 'earth-like' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('terrestrial-planet-renderer')).toBeInTheDocument()
  })

  it('renders TerrestrialPlanetRenderer for terrestrial-planet with earth_like feature', () => {
    const catalogData = { ...baseCatalog, engine_object: 'terrestrial-planet', features: { earth_like: true } }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('terrestrial-planet-renderer')).toBeInTheDocument()
  })

  it('renders TerrestrialPlanetRenderer for terrestrial-planet with ocean_coverage > 0.5', () => {
    const catalogData = { ...baseCatalog, engine_object: 'terrestrial-planet', features: { ocean_coverage: 0.8 } }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('terrestrial-planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for regular terrestrial-planet', () => {
    const catalogData = { ...baseCatalog, engine_object: 'terrestrial-planet' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for ice-planet', () => {
    const catalogData = { ...baseCatalog, engine_object: 'ice-planet' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for volcanic-planet', () => {
    const catalogData = { ...baseCatalog, engine_object: 'volcanic-planet' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for ocean-planet', () => {
    const catalogData = { ...baseCatalog, engine_object: 'ocean-planet' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for category terrestrial', () => {
    const catalogData = { ...baseCatalog, engine_object: 'terrestrial-planet', category: 'terrestrial' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for terrestrial-moon', () => {
    const catalogData = { ...baseCatalog, engine_object: 'terrestrial-moon' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for ice-moon', () => {
    const catalogData = { ...baseCatalog, engine_object: 'ice-moon' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for volcanic-moon', () => {
    const catalogData = { ...baseCatalog, engine_object: 'volcanic-moon' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for atmospheric-moon', () => {
    const catalogData = { ...baseCatalog, engine_object: 'atmospheric-moon' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders PlanetRenderer for category moon', () => {
    const catalogData = { ...baseCatalog, engine_object: 'terrestrial-moon', category: 'moon' }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders fallback for unknown object', () => {
    const catalogData = { ...baseCatalog, engine_object: 'unknown-type', category: 'unknown' }
    const { container } = render(<ObjectFactory catalogData={catalogData} />)
    expect(container.querySelector('group')).toBeInTheDocument()
  })

  it('logs a warning for unknown object', () => {
    const catalogData = { ...baseCatalog, engine_object: 'unknown-type', category: 'unknown' }
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ObjectFactory catalogData={catalogData} />)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('fallback renderer'), expect.any(Object))
    warnSpy.mockRestore()
  })

  it('handles missing features gracefully', () => {
    const catalogData = { ...baseCatalog, engine_object: 'terrestrial-planet', features: undefined }
    const { getByTestId } = render(<ObjectFactory catalogData={catalogData} />)
    expect(getByTestId('planet-renderer')).toBeInTheDocument()
  })

  it('renders fallback if engine_object and category are missing', () => {
    const catalogData = { ...baseCatalog, engine_object: undefined, category: undefined }
    const { container } = render(<ObjectFactory catalogData={catalogData} />)
    expect(container.querySelector('group')).toBeInTheDocument()
  })
}) 