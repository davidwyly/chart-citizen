import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ShaderEditor } from '../controls/shader-editor'
import { ObjectControls } from '../object-controls'
import type { CelestialObject } from '@/engine/types/orbital-system'

// Mock the ShaderEditor to capture the props it receives
vi.mock('../controls/shader-editor', () => ({
  ShaderEditor: vi.fn(({ currentVertexShader, currentFragmentShader, onShaderUpdate, objectType }) => (
    <div data-testid="shader-editor">
      <div data-testid="vertex-shader">{currentVertexShader}</div>
      <div data-testid="fragment-shader">{currentFragmentShader}</div>
      <div data-testid="object-type">{objectType}</div>
    </div>
  ))
}))

describe('Shader Loading Tests', () => {
  const mockProps = {
    selectedObjectId: 'test-object',
    objectScale: 1,
    shaderScale: 1,
    shaderParams: {
      intensity: 1,
      speed: 1,
      distortion: 1,
      diskSpeed: 1,
      lensingStrength: 1,
      diskBrightness: 1
    },
    onObjectScaleChange: vi.fn(),
    onShaderScaleChange: vi.fn(),
    onShaderParamChange: vi.fn(),
    onShaderUpdate: vi.fn(),
    showStats: false,
    onToggleStats: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads terrestrial planet shader by default for terrestrial objects', () => {
    const terrestrialObject: CelestialObject = {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 1,
        radius: 1,
        temperature: 288
      }
    }

    render(
      <ObjectControls
        {...mockProps}
        celestialObject={terrestrialObject}
      />
    )

    const vertexShader = screen.getByTestId('vertex-shader')
    const fragmentShader = screen.getByTestId('fragment-shader')
    const objectType = screen.getByTestId('object-type')

    // Check that the object type is passed correctly
    expect(objectType.textContent).toBe('terrestrial')

    // Check that the vertex shader contains expected terrestrial shader code
    expect(vertexShader.textContent).toContain('varying vec2 vUv')
    expect(vertexShader.textContent).toContain('varying vec3 vNormal')
    expect(vertexShader.textContent).toContain('varying vec3 vPosition')

    // Check that the fragment shader contains terrestrial-specific code
    expect(fragmentShader.textContent).toContain('uniform vec3 landColor')
    expect(fragmentShader.textContent).toContain('uniform vec3 seaColor')
    expect(fragmentShader.textContent).toContain('uniform float waterCoverage')
    expect(fragmentShader.textContent).toContain('fbm((uv + seedOffset) * terrainScale * (1.0 + tectonics))')
  })

  it('loads gas giant shader by default for gas giant objects', () => {
    const gasGiantObject: CelestialObject = {
      id: 'jupiter',
      name: 'Jupiter',
      classification: 'planet',
      geometry_type: 'gas_giant',
      properties: {
        mass: 317.8,
        radius: 11.2,
        temperature: 165
      }
    }

    render(
      <ObjectControls
        {...mockProps}
        celestialObject={gasGiantObject}
      />
    )

    const fragmentShader = screen.getByTestId('fragment-shader')
    const objectType = screen.getByTestId('object-type')

    // Check that the object type is passed correctly
    expect(objectType.textContent).toBe('gas_giant')

    // Check that the fragment shader contains gas giant-specific code
    expect(fragmentShader.textContent).toContain('Create horizontal bands')
    expect(fragmentShader.textContent).toContain('sin(uv.y * 12.0 + time * speed * 0.5)')
    expect(fragmentShader.textContent).toContain('Storm spots')
  })

  it('loads star shader by default for star objects', () => {
    const starObject: CelestialObject = {
      id: 'sun',
      name: 'Sun',
      classification: 'star',
      geometry_type: 'star',
      properties: {
        mass: 333000,
        radius: 109,
        temperature: 5778
      }
    }

    render(
      <ObjectControls
        {...mockProps}
        celestialObject={starObject}
      />
    )

    const fragmentShader = screen.getByTestId('fragment-shader')
    const objectType = screen.getByTestId('object-type')

    // Check that the object type is passed correctly
    expect(objectType.textContent).toBe('star')

    // Check that the fragment shader contains star-specific code
    expect(fragmentShader.textContent).toContain('Solar flares')
    expect(fragmentShader.textContent).toContain('fbm(p * 1.5 + vec3(time * speed * 0.1, 0.0, 0.0))')
    expect(fragmentShader.textContent).toContain('Corona effect')
  })

  it('loads default shader for unknown object types', () => {
    const unknownObject: CelestialObject = {
      id: 'asteroid',
      name: 'Asteroid',
      classification: 'belt',
      geometry_type: 'rocky',
      properties: {
        mass: 0.001,
        radius: 0.01,
        temperature: 200
      }
    }

    render(
      <ObjectControls
        {...mockProps}
        celestialObject={unknownObject}
      />
    )

    const fragmentShader = screen.getByTestId('fragment-shader')
    const objectType = screen.getByTestId('object-type')

    // Check that the object type is passed correctly
    expect(objectType.textContent).toBe('rocky')

    // Check that the fragment shader contains default shader code
    expect(fragmentShader.textContent).toContain('Simple procedural surface')
    expect(fragmentShader.textContent).toContain('sin(vUv.x * 10.0 + time)')
  })

  it('handles null celestial object gracefully', () => {
    render(
      <ObjectControls
        {...mockProps}
        celestialObject={null}
      />
    )

    // Should not render ShaderEditor when celestial object is null
    expect(screen.queryByTestId('shader-editor')).not.toBeInTheDocument()
  })

  it('provides correct uniforms for different object types', () => {
    const terrestrialObject: CelestialObject = {
      id: 'earth',
      name: 'Earth',
      classification: 'planet',
      geometry_type: 'terrestrial',
      properties: {
        mass: 1,
        radius: 1,
        temperature: 288
      }
    }

    render(
      <ObjectControls
        {...mockProps}
        celestialObject={terrestrialObject}
      />
    )

    // Verify that ShaderEditor was called with the correct props
    const calls = (ShaderEditor as any).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    
    const firstCall = calls[0][0]
    expect(firstCall.objectType).toBe('terrestrial')
    expect(firstCall.currentVertexShader).toContain('varying vec2 vUv')
    expect(firstCall.currentFragmentShader).toContain('uniform vec3 landColor')
    expect(typeof firstCall.onShaderUpdate).toBe('function')
  })
}) 