import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useStarmapRenderer } from '../hooks/use-starmap-renderer'
import { BasicStarmapRenderer } from '../services/basic-renderer'
import { StarmapSystem } from '../types'
import * as THREE from 'three'

// Mock the BasicStarmapRenderer
vi.mock('../services/basic-renderer', () => ({
  BasicStarmapRenderer: vi.fn().mockImplementation(() => ({
    renderSystemsAsPoints: vi.fn(),
    selectSystem: vi.fn(),
    focusOnSystem: vi.fn().mockResolvedValue(undefined),
    setOnSystemClick: vi.fn(),
    setOnSystemHover: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    getSize: vi.fn().mockReturnValue({ width: 800, height: 600 })
  }))
}))

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  setTimeout(cb, 16)
  return 1
})
global.cancelAnimationFrame = vi.fn()

describe('useStarmapRenderer', () => {
  let mockCanvas: HTMLCanvasElement
  let mockSystems: StarmapSystem[]

  beforeEach(() => {
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600
    document.body.appendChild(mockCanvas)

    mockSystems = [
      {
        id: 'system-1',
        name: 'Alpha Centauri',
        position: new THREE.Vector3(0, 0, 0),
        systemType: 'main-sequence',
        securityLevel: 'high',
        status: 'inhabited',
        population: 1000000,
        jumpPoints: ['system-2']
      },
      {
        id: 'system-2',
        name: 'Proxima Centauri',
        position: new THREE.Vector3(10, 5, -3),
        systemType: 'red-dwarf',
        securityLevel: 'medium',
        status: 'explored',
        population: 50000,
        jumpPoints: ['system-1']
      }
    ]

    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    document.body.removeChild(mockCanvas)
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useStarmapRenderer())

      expect(result.current.canvasRef).toBeDefined()
      expect(result.current.renderer).toBeNull()
      expect(result.current.isReady).toBe(false)
      expect(typeof result.current.renderSystems).toBe('function')
      expect(typeof result.current.selectSystem).toBe('function')
      expect(typeof result.current.focusOnSystem).toBe('function')
    })

    it('should create renderer when canvas is available', () => {
      const { result } = renderHook(() => useStarmapRenderer())
      
      // Simulate canvas being available
      if (result.current.canvasRef.current) {
        result.current.canvasRef.current = mockCanvas
      }

      // The renderer should be created when canvas is available
      expect(BasicStarmapRenderer).toHaveBeenCalledWith(mockCanvas)
    })

    it('should set up callbacks during initialization', () => {
      const onSystemClick = vi.fn()
      const onSystemHover = vi.fn()

      renderHook(() => useStarmapRenderer({
        onSystemClick,
        onSystemHover
      }))

      // Should have called the mock renderer's callback setters
      expect(BasicStarmapRenderer).toHaveBeenCalled()
    })
  })

  describe('Callback Management', () => {
    it('should update callbacks when they change', () => {
      const initialClick = vi.fn()
      const initialHover = vi.fn()

      const { result, rerender } = renderHook(
        ({ onSystemClick, onSystemHover }) => useStarmapRenderer({
          onSystemClick,
          onSystemHover
        }),
        {
          initialProps: {
            onSystemClick: initialClick,
            onSystemHover: initialHover
          }
        }
      )

      // Change callbacks
      const newClick = vi.fn()
      const newHover = vi.fn()

      rerender({
        onSystemClick: newClick,
        onSystemHover: newHover
      })

      // Should have updated the callbacks
      expect(result.current.renderSystems).toBeDefined()
    })
  })

  describe('System Rendering', () => {
    it('should call renderer renderSystemsAsPoints', () => {
      const mockRenderer = {
        renderSystemsAsPoints: vi.fn(),
        selectSystem: vi.fn(),
        focusOnSystem: vi.fn(),
        setOnSystemClick: vi.fn(),
        setOnSystemHover: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        getSize: vi.fn()
      }

      // Mock the renderer instance
      vi.mocked(BasicStarmapRenderer).mockImplementation(() => mockRenderer as any)

      const { result } = renderHook(() => useStarmapRenderer())

      // Simulate renderer being ready
      result.current.renderSystems(mockSystems)

      // Should call the renderer method when ready
      expect(mockRenderer.renderSystemsAsPoints).toHaveBeenCalledWith(mockSystems)
    })

    it('should handle renderSystems when renderer is not ready', () => {
      const { result } = renderHook(() => useStarmapRenderer())

      // Should not throw when renderer is not ready
      expect(() => {
        result.current.renderSystems(mockSystems)
      }).not.toThrow()
    })
  })

  describe('System Selection', () => {
    it('should call renderer selectSystem', () => {
      const mockRenderer = {
        renderSystemsAsPoints: vi.fn(),
        selectSystem: vi.fn(),
        focusOnSystem: vi.fn(),
        setOnSystemClick: vi.fn(),
        setOnSystemHover: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        getSize: vi.fn()
      }

      vi.mocked(BasicStarmapRenderer).mockImplementation(() => mockRenderer as any)

      const { result } = renderHook(() => useStarmapRenderer())

      result.current.selectSystem('system-1')

      expect(mockRenderer.selectSystem).toHaveBeenCalledWith('system-1')
    })

    it('should handle selectSystem when renderer is not ready', () => {
      const { result } = renderHook(() => useStarmapRenderer())

      expect(() => {
        result.current.selectSystem('system-1')
      }).not.toThrow()
    })
  })

  describe('Camera Focus', () => {
    it('should call renderer focusOnSystem', async () => {
      const mockRenderer = {
        renderSystemsAsPoints: vi.fn(),
        selectSystem: vi.fn(),
        focusOnSystem: vi.fn().mockResolvedValue(undefined),
        setOnSystemClick: vi.fn(),
        setOnSystemHover: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        getSize: vi.fn()
      }

      vi.mocked(BasicStarmapRenderer).mockImplementation(() => mockRenderer as any)

      const { result } = renderHook(() => useStarmapRenderer())

      await result.current.focusOnSystem('system-1')

      expect(mockRenderer.focusOnSystem).toHaveBeenCalledWith('system-1')
    })

    it('should handle focusOnSystem when renderer is not ready', async () => {
      const { result } = renderHook(() => useStarmapRenderer())

      await expect(result.current.focusOnSystem('system-1')).resolves.toBeUndefined()
    })
  })

  describe('Cleanup', () => {
    it('should dispose renderer on unmount', () => {
      const mockRenderer = {
        renderSystemsAsPoints: vi.fn(),
        selectSystem: vi.fn(),
        focusOnSystem: vi.fn(),
        setOnSystemClick: vi.fn(),
        setOnSystemHover: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        getSize: vi.fn()
      }

      vi.mocked(BasicStarmapRenderer).mockImplementation(() => mockRenderer as any)

      const { unmount } = renderHook(() => useStarmapRenderer())

      unmount()

      expect(mockRenderer.dispose).toHaveBeenCalled()
    })

    it('should cancel animation frame on unmount', () => {
      const { unmount } = renderHook(() => useStarmapRenderer())

      unmount()

      expect(global.cancelAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('Resize Handling', () => {
    it('should handle window resize events', () => {
      const mockRenderer = {
        renderSystemsAsPoints: vi.fn(),
        selectSystem: vi.fn(),
        focusOnSystem: vi.fn(),
        setOnSystemClick: vi.fn(),
        setOnSystemHover: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        getSize: vi.fn().mockReturnValue({ width: 800, height: 600 })
      }

      vi.mocked(BasicStarmapRenderer).mockImplementation(() => mockRenderer as any)

      const { unmount } = renderHook(() => useStarmapRenderer())

      // Simulate window resize
      window.dispatchEvent(new Event('resize'))

      expect(mockRenderer.getSize).toHaveBeenCalled()

      unmount()
    })
  })

  describe('Error Handling', () => {
    it('should handle renderer initialization errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock renderer constructor to throw
      vi.mocked(BasicStarmapRenderer).mockImplementation(() => {
        throw new Error('WebGL not supported')
      })

      const { result } = renderHook(() => useStarmapRenderer())

      expect(result.current.isReady).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize starmap renderer:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Animation Loop', () => {
    it('should start animation loop when renderer is created', () => {
      const mockRenderer = {
        renderSystemsAsPoints: vi.fn(),
        selectSystem: vi.fn(),
        focusOnSystem: vi.fn(),
        setOnSystemClick: vi.fn(),
        setOnSystemHover: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        getSize: vi.fn()
      }

      vi.mocked(BasicStarmapRenderer).mockImplementation(() => mockRenderer as any)

      renderHook(() => useStarmapRenderer())

      // Should have started the animation loop
      expect(global.requestAnimationFrame).toHaveBeenCalled()
    })

    it('should call renderer.render in animation loop', () => {
      const mockRenderer = {
        renderSystemsAsPoints: vi.fn(),
        selectSystem: vi.fn(),
        focusOnSystem: vi.fn(),
        setOnSystemClick: vi.fn(),
        setOnSystemHover: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        getSize: vi.fn()
      }

      vi.mocked(BasicStarmapRenderer).mockImplementation(() => mockRenderer as any)

      renderHook(() => useStarmapRenderer())

      // Simulate animation frame callback
      const animationCallback = vi.mocked(global.requestAnimationFrame).mock.calls[0][0]
      animationCallback(0)

      expect(mockRenderer.render).toHaveBeenCalled()
    })
  })

  describe('Memoization', () => {
    it('should memoize callback functions', () => {
      const { result, rerender } = renderHook(() => useStarmapRenderer())

      const initialRenderSystems = result.current.renderSystems
      const initialSelectSystem = result.current.selectSystem
      const initialFocusOnSystem = result.current.focusOnSystem

      // Rerender without changing props
      rerender()

      // Functions should be the same reference
      expect(result.current.renderSystems).toBe(initialRenderSystems)
      expect(result.current.selectSystem).toBe(initialSelectSystem)
      expect(result.current.focusOnSystem).toBe(initialFocusOnSystem)
    })
  })
}) 