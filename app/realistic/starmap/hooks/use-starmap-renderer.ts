import { useEffect, useRef, useState, useCallback } from 'react'
import { BasicStarmapRenderer } from '../services/basic-renderer'
import { StarmapSystem } from '../types'

interface UseStarmapRendererOptions {
  onSystemClick?: (systemId: string) => void
  onSystemHover?: (systemId: string | null) => void
}

interface UseStarmapRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  renderer: BasicStarmapRenderer | null
  renderSystems: (systems: StarmapSystem[]) => void
  selectSystem: (systemId: string | null) => void
  focusOnSystem: (systemId: string) => Promise<void>
  toggleHexGrid: () => void
  setHexGridVisible: (visible: boolean) => void
  toggleCameraMode: () => void
  getCameraMode: () => '2d' | '3d' | null
  setCameraMode: (mode: '2d' | '3d') => void
  isReady: boolean
}

/**
 * React hook for managing the BasicStarmapRenderer
 * Handles initialization, cleanup, and provides convenient methods
 */
export function useStarmapRenderer(options: UseStarmapRendererOptions = {}): UseStarmapRendererReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<BasicStarmapRenderer | null>(null)
  const animationFrameRef = useRef<number>(0)
  
  const [isReady, setIsReady] = useState(false)

  // Initialize renderer when canvas is available
  useEffect(() => {
    if (!canvasRef.current) return

    try {
      const renderer = new BasicStarmapRenderer(canvasRef.current)
      
      // Set up callbacks
      if (options.onSystemClick) {
        renderer.setOnSystemClick(options.onSystemClick)
      }
      
      if (options.onSystemHover) {
        renderer.setOnSystemHover(options.onSystemHover)
      }
      
      rendererRef.current = renderer
      setIsReady(true)
      
      // Start render loop
      const animate = () => {
        if (rendererRef.current) {
          rendererRef.current.render()
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }
      animate()
      
    } catch (error) {
      console.error('Failed to initialize starmap renderer:', error)
      setIsReady(false)
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      
      setIsReady(false)
    }
  }, [options.onSystemClick, options.onSystemHover])

  // Update callbacks when they change
  useEffect(() => {
    if (rendererRef.current && options.onSystemClick) {
      rendererRef.current.setOnSystemClick(options.onSystemClick)
    }
  }, [options.onSystemClick])

  useEffect(() => {
    if (rendererRef.current && options.onSystemHover) {
      rendererRef.current.setOnSystemHover(options.onSystemHover)
    }
  }, [options.onSystemHover])

  // Handle canvas resize with ResizeObserver for better quality
  useEffect(() => {
    if (!canvasRef.current || !rendererRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (rendererRef.current && canvasRef.current) {
        // Trigger resize with a small delay to ensure proper rendering
        setTimeout(() => {
          if (rendererRef.current) {
            const canvas = rendererRef.current.getSize()
            // Force re-render to update quality
            rendererRef.current.render()
          }
        }, 16) // Next frame
      }
    })

    resizeObserver.observe(canvasRef.current)

    const handleWindowResize = () => {
      if (rendererRef.current) {
        setTimeout(() => rendererRef.current?.render(), 16)
      }
    }

    window.addEventListener('resize', handleWindowResize)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [isReady])

  // Render systems
  const renderSystems = useCallback((systems: StarmapSystem[]) => {
    if (rendererRef.current) {
      rendererRef.current.renderSystemsAsPoints(systems)
    }
  }, [])

  // Select system
  const selectSystem = useCallback((systemId: string | null) => {
    if (rendererRef.current) {
      rendererRef.current.selectSystem(systemId)
    }
  }, [])

  // Focus on system
  const focusOnSystem = useCallback(async (systemId: string) => {
    if (rendererRef.current) {
      return rendererRef.current.focusOnSystem(systemId)
    }
  }, [])

  // Toggle hex grid
  const toggleHexGrid = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.toggleHexGrid()
    }
  }, [])

  // Set hex grid visibility
  const setHexGridVisible = useCallback((visible: boolean) => {
    if (rendererRef.current) {
      rendererRef.current.setHexGridVisible(visible)
    }
  }, [])
  
  // Toggle camera mode
  const toggleCameraMode = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.toggleCameraMode()
    }
  }, [])
  
  // Get camera mode
  const getCameraMode = useCallback((): '2d' | '3d' | null => {
    if (rendererRef.current) {
      return rendererRef.current.getCameraMode()
    }
    return null
  }, [])
  
  // Set camera mode
  const setCameraMode = useCallback((mode: '2d' | '3d') => {
    if (rendererRef.current) {
      rendererRef.current.setCameraMode(mode)
    }
  }, [])

  return {
    canvasRef,
    renderer: rendererRef.current,
    renderSystems,
    selectSystem,
    focusOnSystem,
    toggleHexGrid,
    setHexGridVisible,
    toggleCameraMode,
    getCameraMode,
    setCameraMode,
    isReady
  }
} 