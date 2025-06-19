import { render, screen } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { SystemViewer } from '../system-viewer'
import React from 'react'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber')
  return {
    ...actual,
    Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  }
})

// Mock Three.js to prevent WebGL errors in test environment
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      setClearColor: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    })),
    Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
    Object3D: vi.fn().mockImplementation(() => ({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      userData: {},
      children: [],
      parent: null,
      add: vi.fn(),
      remove: vi.fn(),
      traverse: vi.fn(),
      getWorldPosition: vi.fn(),
    })),
  }
})

describe('SystemViewer', () => {
  const defaultProps = {
    mode: 'realistic',
    systemId: 'sol',
    onFocus: vi.fn(),
    onSystemChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock fetch responses
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('starmap-systems.json')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            systems: {
              sol: {
                id: 'sol',
                name: 'Sol System',
                position: [0, 0, 0],
                description: 'Test solar system'
              }
            },
            metadata: {
              version: '1.0',
              last_updated: '2024-01-01'
            }
          })
        }
      }
      
      if (url.includes('/sol.json')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            id: 'sol',
            name: 'Sol System',
            description: 'Test solar system',
            objects: [
              {
                id: 'sun',
                name: 'Sun',
                classification: 'star',
                geometry_type: 'star',
                properties: { mass: 1.0, radius: 695700, temperature: 5778 }
              }
            ],
            lighting: {
              primary_star: 'sun',
              ambient_level: 0.1
            },
            metadata: {
              version: '1.0',
              last_updated: '2024-01-01'
            }
          })
        }
      }
      
      return {
        ok: false,
        status: 404,
        headers: { get: () => 'text/plain' },
        text: async () => 'Not found'
      }
    })
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SystemViewer {...defaultProps} />)
      expect(screen.getByText(/Loading sol/)).toBeInTheDocument()
    })
  })

  // Additional tests for context, state, and performance would require more setup or mocking
  // For now, focus on prop validation and rendering
}) 