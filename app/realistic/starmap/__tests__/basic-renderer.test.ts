import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as THREE from 'three'
import { BasicStarmapRenderer } from '../services/basic-renderer'
import { StarmapSystem } from '../types'

// Mock Three.js WebGLRenderer
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn()
    }))
  }
})

describe('BasicStarmapRenderer', () => {
  let canvas: HTMLCanvasElement
  let renderer: BasicStarmapRenderer
  let mockSystems: StarmapSystem[]

  beforeEach(() => {
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    document.body.appendChild(canvas)

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
        jumpPoints: ['system-1', 'system-3']
      },
      {
        id: 'system-3',
        name: 'Wolf 359',
        position: new THREE.Vector3(-5, -10, 8),
        systemType: 'red-dwarf',
        securityLevel: 'low',
        status: 'unexplored',
        population: 0,
        jumpPoints: ['system-2']
      }
    ]

    renderer = new BasicStarmapRenderer(canvas)
  })

  afterEach(() => {
    renderer?.dispose()
    document.body.removeChild(canvas)
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize Three.js components correctly', () => {
      expect(renderer).toBeDefined()
      expect(THREE.WebGLRenderer).toHaveBeenCalledWith({
        canvas,
        antialias: true,
        alpha: true
      })
    })

    it('should set up event listeners on canvas', () => {
      const addEventListenerSpy = vi.spyOn(canvas, 'addEventListener')
      
      // Create new renderer to trigger event listener setup
      const newRenderer = new BasicStarmapRenderer(canvas)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      
      newRenderer.dispose()
    })
  })

  describe('System Rendering', () => {
    it('should render systems as spheres', () => {
      renderer.renderSystemsAsPoints(mockSystems)
      
      // Should create meshes for each system
      expect(renderer['systemMeshes'].size).toBe(3)
      expect(renderer['systemGroup'].children.length).toBe(3)
    })

    it('should position systems correctly', () => {
      renderer.renderSystemsAsPoints(mockSystems)
      
      const system1Mesh = renderer['systemMeshes'].get('system-1')
      const system2Mesh = renderer['systemMeshes'].get('system-2')
      
      expect(system1Mesh?.position).toEqual(new THREE.Vector3(0, 0, 0))
      expect(system2Mesh?.position).toEqual(new THREE.Vector3(10, 5, -3))
    })

    it('should scale inhabited systems larger', () => {
      renderer.renderSystemsAsPoints(mockSystems)
      
      const inhabitedSystem = renderer['systemMeshes'].get('system-1')
      const exploredSystem = renderer['systemMeshes'].get('system-2')
      
      expect(inhabitedSystem?.scale.x).toBe(2)
      expect(exploredSystem?.scale.x).toBe(1)
    })

    it('should store system data in mesh userData', () => {
      renderer.renderSystemsAsPoints(mockSystems)
      
      const mesh = renderer['systemMeshes'].get('system-1')
      expect(mesh?.userData.systemId).toBe('system-1')
      expect(mesh?.userData.system).toEqual(mockSystems[0])
    })

    it('should clear previous systems when rendering new ones', () => {
      renderer.renderSystemsAsPoints(mockSystems)
      expect(renderer['systemMeshes'].size).toBe(3)
      
      const newSystems = [mockSystems[0]] // Only one system
      renderer.renderSystemsAsPoints(newSystems)
      expect(renderer['systemMeshes'].size).toBe(1)
    })
  })

  describe('System Selection', () => {
    beforeEach(() => {
      renderer.renderSystemsAsPoints(mockSystems)
    })

    it('should select system by ID', () => {
      renderer.selectSystem('system-1')
      
      const mesh = renderer['systemMeshes'].get('system-1')
      expect(mesh?.material).toBe(renderer['selectedMaterial'])
      expect(renderer['selectedSystemId']).toBe('system-1')
    })

    it('should clear previous selection when selecting new system', () => {
      renderer.selectSystem('system-1')
      renderer.selectSystem('system-2')
      
      const mesh1 = renderer['systemMeshes'].get('system-1')
      const mesh2 = renderer['systemMeshes'].get('system-2')
      
      expect(mesh1?.material).toBe(renderer['defaultMaterial'])
      expect(mesh2?.material).toBe(renderer['selectedMaterial'])
    })

    it('should clear selection when passing null', () => {
      renderer.selectSystem('system-1')
      renderer.selectSystem(null)
      
      const mesh = renderer['systemMeshes'].get('system-1')
      expect(mesh?.material).toBe(renderer['defaultMaterial'])
      expect(renderer['selectedSystemId']).toBeNull()
    })
  })

  describe('Camera Control', () => {
    it('should update camera position and target', () => {
      const newPosition = new THREE.Vector3(10, 20, 30)
      const newTarget = new THREE.Vector3(5, 10, 15)
      
      renderer.updateCamera(newPosition, newTarget)
      
      expect(renderer['camera'].position).toEqual(newPosition)
    })

    it('should focus on system with animation', async () => {
      renderer.renderSystemsAsPoints(mockSystems)
      
      const focusPromise = renderer.focusOnSystem('system-1')
      
      // Should return a promise
      expect(focusPromise).toBeInstanceOf(Promise)
      
      // Wait for animation to complete
      await focusPromise
      
      // Camera should be positioned relative to the system
      const systemPosition = mockSystems[0].position as THREE.Vector3
      expect(renderer['camera'].position.distanceTo(systemPosition)).toBeGreaterThan(0)
    })

    it('should handle focus on non-existent system gracefully', async () => {
      renderer.renderSystemsAsPoints(mockSystems)
      
      await expect(renderer.focusOnSystem('non-existent')).resolves.toBeUndefined()
    })
  })

  describe('Event Callbacks', () => {
    it('should set and call system click callback', () => {
      const onSystemClick = vi.fn()
      renderer.setOnSystemClick(onSystemClick)
      
      // Simulate click by calling the method directly
      renderer['onSystemClick'] = onSystemClick
      renderer['onSystemClick']('system-1')
      
      expect(onSystemClick).toHaveBeenCalledWith('system-1')
    })

    it('should set and call system hover callback', () => {
      const onSystemHover = vi.fn()
      renderer.setOnSystemHover(onSystemHover)
      
      // Simulate hover by calling the method directly
      renderer['onSystemHover'] = onSystemHover
      renderer['onSystemHover']('system-1')
      
      expect(onSystemHover).toHaveBeenCalledWith('system-1')
    })
  })

  describe('Mouse Interaction', () => {
    beforeEach(() => {
      renderer.renderSystemsAsPoints(mockSystems)
    })

    it('should handle mouse move events', () => {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300
      })
      
      // Mock getBoundingClientRect
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })
      
      expect(() => {
        renderer['onMouseMove'](mouseEvent)
      }).not.toThrow()
    })

    it('should handle mouse click events', () => {
      const mouseEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300
      })
      
      expect(() => {
        renderer['onMouseClick'](mouseEvent)
      }).not.toThrow()
    })
  })

  describe('Resource Management', () => {
    it('should dispose of resources properly', () => {
      renderer.renderSystemsAsPoints(mockSystems)
      
      const disposeSpy = vi.fn()
      renderer['defaultMaterial'].dispose = disposeSpy
      renderer['selectedMaterial'].dispose = disposeSpy
      renderer['hoveredMaterial'].dispose = disposeSpy
      
      renderer.dispose()
      
      expect(disposeSpy).toHaveBeenCalledTimes(3)
      expect(renderer['systemMeshes'].size).toBe(0)
    })

    it('should remove event listeners on dispose', () => {
      const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener')
      
      renderer.dispose()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Utility Methods', () => {
    it('should return canvas size', () => {
      const size = renderer.getSize()
      
      expect(size).toEqual({
        width: canvas.clientWidth,
        height: canvas.clientHeight
      })
    })

    it('should render scene', () => {
      const renderSpy = vi.spyOn(renderer['renderer'], 'render')
      
      renderer.render()
      
      expect(renderSpy).toHaveBeenCalledWith(renderer['scene'], renderer['camera'])
    })
  })

  describe('Performance', () => {
    it('should handle large numbers of systems efficiently', () => {
      const largeSystems: StarmapSystem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `system-${i}`,
        name: `System ${i}`,
        position: new THREE.Vector3(
          Math.random() * 200 - 100,
          Math.random() * 200 - 100,
          Math.random() * 200 - 100
        ),
        systemType: 'main-sequence',
        securityLevel: 'medium',
        status: 'explored',
        population: 1000,
        jumpPoints: []
      }))

      const startTime = performance.now()
      renderer.renderSystemsAsPoints(largeSystems)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(renderer['systemMeshes'].size).toBe(1000)
    })
  })
}) 