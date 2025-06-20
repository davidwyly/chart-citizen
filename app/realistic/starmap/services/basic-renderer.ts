import * as THREE from 'three'
import { StarmapSystem, HexCoordinate } from '../types'
import { HexCoordinateUtils } from '../utils/hex-coordinate'
import { spiralGalaxyVertexShader, spiralGalaxyFragmentShader } from './spiral-galaxy-shader'

/**
 * Basic Three.js renderer for starmap systems
 * Phase 2 implementation - simple spheres with click detection
 */
export class BasicStarmapRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  
  // Camera controls
  private isRotating: boolean = false
  private lastMousePosition: THREE.Vector2 = new THREE.Vector2()
  private cameraTarget: THREE.Vector3 = new THREE.Vector3()
  private cameraDistance: number = 100
  private cameraMode: '2d' | '3d' = '3d'
  private isTransitioning: boolean = false
  
  // System rendering
  private systemMeshes: Map<string, THREE.Mesh> = new Map()
  private systemGroup: THREE.Group
  
  // Hexagonal grid rendering
  private hexGridGroup: THREE.Group
  private hexTiles: Map<string, THREE.Mesh> = new Map()
  private hexSize: number = 5 // Size of each hex tile
  private showHexGrid: boolean = true
  
  // Materials
  private defaultMaterial!: THREE.MeshBasicMaterial
  private selectedMaterial!: THREE.MeshBasicMaterial
  private hoveredMaterial!: THREE.MeshBasicMaterial
  private hexTileMaterial!: THREE.MeshBasicMaterial
  private hexOutlineMaterial!: THREE.LineBasicMaterial
  private galaxyMaterial!: THREE.ShaderMaterial
  private galaxyBackground!: THREE.Mesh
  
  // State
  private selectedSystemId: string | null = null
  private hoveredSystemId: string | null = null
  
  // Callbacks
  private onSystemClick?: (systemId: string) => void
  private onSystemHover?: (systemId: string | null) => void

  constructor(canvas: HTMLCanvasElement) {
    // Initialize Three.js components
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000)
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    
    // Set pixel ratio for crisp rendering on high-DPI displays
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Enable high-quality shadows and rendering
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    this.systemGroup = new THREE.Group()
    this.scene.add(this.systemGroup)
    
    this.hexGridGroup = new THREE.Group()
    this.scene.add(this.hexGridGroup)
    
    this.setupMaterials()
    this.setupBackground()
    this.setupLighting()
    this.setupEventListeners()
    this.setupCamera()
    
    // Force initial resize to ensure proper rendering quality
    this.onResize()
  }

  /**
   * Setup galaxy background
   */
  private setupBackground(): void {
    try {
      // Create galaxy shader material
      this.galaxyMaterial = new THREE.ShaderMaterial({
        vertexShader: spiralGalaxyVertexShader,
        fragmentShader: spiralGalaxyFragmentShader,
        uniforms: {
          time: { value: 0 },
          intensity: { value: 0.8 },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          cameraPosition: { value: new THREE.Vector3() }
        },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      })

      // Create large sphere for background
      const galaxyGeometry = new THREE.SphereGeometry(5000, 60, 40)
      this.galaxyBackground = new THREE.Mesh(galaxyGeometry, this.galaxyMaterial)
      this.scene.add(this.galaxyBackground)
      
      console.log('✅ Galaxy background created')
    } catch (error) {
      console.error('❌ Failed to create galaxy background:', error)
      // Fallback to black background
      this.scene.background = new THREE.Color(0x000000)
    }
  }

  /**
   * Initialize materials for different system states
   */
  private setupMaterials(): void {
    this.defaultMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4444ff,
      transparent: true,
      opacity: 0.8
    })
    
    this.selectedMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 1.0
    })
    
    this.hoveredMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.9
    })
    
    // Hexagonal grid materials
    this.hexTileMaterial = new THREE.MeshBasicMaterial({
      color: 0x111133,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    })
    
    this.hexOutlineMaterial = new THREE.LineBasicMaterial({
      color: 0x4466aa,
      transparent: true,
      opacity: 0.8,
      linewidth: 1
    })
  }


  /**
   * Setup basic lighting for the scene
   */
  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    this.scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    this.scene.add(directionalLight)
  }

  /**
   * Setup mouse event listeners for interaction
   */
  private setupEventListeners(): void {
    const canvas = this.renderer.domElement
    
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    canvas.addEventListener('click', this.onMouseClick.bind(this))
    canvas.addEventListener('wheel', this.onMouseWheel.bind(this))
    canvas.addEventListener('resize', this.onResize.bind(this))
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  /**
   * Setup initial camera position
   */
  private setupCamera(): void {
    // Set camera target to center of hex grid
    this.cameraTarget.set(0, 0, 0)
    this.cameraDistance = 100
    
    // Start in 3D mode: position camera at an angle to show the hex grid nicely
    this.camera.position.set(0, 50, 100)
    this.camera.lookAt(this.cameraTarget)
    
    // Set cursor style for interaction
    this.renderer.domElement.style.cursor = 'grab'
  }

  /**
   * Render systems as simple spheres with hex grid
   */
  renderSystemsAsPoints(systems: StarmapSystem[]): void {
    // Clear existing meshes
    this.clearSystems()
    
    // Generate hex positions for systems and create hex grid
    const systemsWithHex = this.generateHexPositions(systems)
    
    // Create hex grid if enabled
    if (this.showHexGrid) {
      this.createHexGrid(systemsWithHex)
    }
    
    const geometry = new THREE.SphereGeometry(1, 32, 16) // Higher resolution spheres
    
    systemsWithHex.forEach(system => {
      const mesh = new THREE.Mesh(geometry, this.defaultMaterial.clone())
      
      // Position based on hex coordinates if available, otherwise use 3D position
      if (system.hexPosition && this.showHexGrid) {
        const hexWorldPos = HexCoordinateUtils.toCartesian(system.hexPosition, this.hexSize)
        mesh.position.copy(hexWorldPos)
        mesh.position.y = 0.5 // Slightly above the hex grid
      } else {
        // Use 3D position
        const position = Array.isArray(system.position) 
          ? new THREE.Vector3(...system.position)
          : system.position
        mesh.position.copy(position)
      }
      
      // Scale based on system importance (inhabited systems are larger)
      const scale = system.status === 'inhabited' ? 2 : 1
      mesh.scale.setScalar(scale)
      
      // Store system ID for interaction
      mesh.userData = { systemId: system.id, system }
      
      this.systemGroup.add(mesh)
      this.systemMeshes.set(system.id, mesh)
    })
    
    // Adjust camera to fit all systems
    this.fitCameraToSystems()
  }

  /**
   * Generate hex positions for systems
   */
  private generateHexPositions(systems: StarmapSystem[]): StarmapSystem[] {
    console.log('🎯 Generating hex positions for realistic systems...')
    
    // Create a spiral pattern of hex positions starting from center
    const center = HexCoordinateUtils.create(0, 0)
    const spiralPositions = HexCoordinateUtils.spiral(center, Math.ceil(Math.sqrt(systems.length)))
    
    // Assign hex positions to systems
    const systemsWithHex = systems.map((system, index) => {
      if (index < spiralPositions.length) {
        const hexPosition = spiralPositions[index]
        console.log(`📍 Assigning hex position (${hexPosition.q}, ${hexPosition.r}) to system ${system.name}`)
        return {
          ...system,
          hexPosition
        }
      }
      return system
    })
    
    console.log(`✅ Generated ${Math.min(systems.length, spiralPositions.length)} hex positions`)
    return systemsWithHex
  }

  /**
   * Create hexagonal grid based on system positions
   */
  private createHexGrid(systems: StarmapSystem[]): void {
    // Clear existing hex grid
    this.clearHexGrid()
    
    // Find the bounds of all hex positions
    const hexPositions = systems
      .filter(s => s.hexPosition)
      .map(s => s.hexPosition!)
    
    if (hexPositions.length === 0) {
      console.log('No hex positions available, skipping hex grid creation')
      return
    }
    
    // Calculate bounds
    const minQ = Math.min(...hexPositions.map(h => h.q))
    const maxQ = Math.max(...hexPositions.map(h => h.q))
    const minR = Math.min(...hexPositions.map(h => h.r))
    const maxR = Math.max(...hexPositions.map(h => h.r))
    
    // Add padding
    const padding = 2
    
    // Create hex tiles in the bounded area
    for (let q = minQ - padding; q <= maxQ + padding; q++) {
      for (let r = minR - padding; r <= maxR + padding; r++) {
        const hexCoord = HexCoordinateUtils.create(q, r)
        const worldPos = HexCoordinateUtils.toCartesian(hexCoord, this.hexSize)
        
        // Create hex tile
        this.createHexTile(worldPos, hexCoord)
      }
    }
    
    console.log(`🎯 Created hex grid: ${this.hexTiles.size} tiles`)
  }

  /**
   * Create a single hexagonal tile
   */
  private createHexTile(position: THREE.Vector3, hexCoord: HexCoordinate): void {
    // Create hexagon geometry
    const hexGeometry = this.createHexagonGeometry(this.hexSize)
    
    // Create hex mesh
    const hexMesh = new THREE.Mesh(hexGeometry, this.hexTileMaterial.clone())
    hexMesh.position.copy(position)
    hexMesh.position.y = 0 // On the ground plane
    hexMesh.userData = { hexCoord, type: 'hex-tile' }
    
    // Create hex outline
    const outlineGeometry = this.createHexagonOutlineGeometry(this.hexSize)
    const outlineMesh = new THREE.LineLoop(outlineGeometry, this.hexOutlineMaterial)
    outlineMesh.position.copy(position)
    outlineMesh.position.y = 0.01 // Slightly above the tile to prevent z-fighting
    
    // Add to scene
    this.hexGridGroup.add(hexMesh)
    this.hexGridGroup.add(outlineMesh)
    
    // Store reference
    const hexKey = `${hexCoord.q},${hexCoord.r}`
    this.hexTiles.set(hexKey, hexMesh)
  }

  /**
   * Create hexagon geometry
   */
  private createHexagonGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    const indices = []
    
    // Center vertex
    vertices.push(0, 0, 0)
    
    // Hex vertices (flat-topped)
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const x = size * Math.cos(angle)
      const z = size * Math.sin(angle)
      vertices.push(x, 0, z)
    }
    
    // Create triangles from center to edges
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6
      indices.push(0, i + 1, next + 1)
    }
    
    geometry.setIndex(indices)
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    
    return geometry
  }

  /**
   * Create hexagon outline geometry
   */
  private createHexagonOutlineGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    
    // Hex vertices (flat-topped)
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const x = size * Math.cos(angle)
      const z = size * Math.sin(angle)
      vertices.push(x, 0, z)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    
    return geometry
  }

  /**
   * Clear hexagonal grid
   */
  private clearHexGrid(): void {
    this.hexGridGroup.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose())
        } else {
          child.material.dispose()
        }
      } else if (child instanceof THREE.LineLoop) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
    
    this.hexGridGroup.clear()
    this.hexTiles.clear()
  }

  /**
   * Toggle hex grid visibility
   */
  toggleHexGrid(): void {
    this.showHexGrid = !this.showHexGrid
    this.hexGridGroup.visible = this.showHexGrid
    console.log(`🎯 Hex grid ${this.showHexGrid ? 'enabled' : 'disabled'}`)
  }

  /**
   * Set hex grid visibility
   */
  setHexGridVisible(visible: boolean): void {
    this.showHexGrid = visible
    this.hexGridGroup.visible = visible
    console.log(`🎯 Hex grid ${visible ? 'enabled' : 'disabled'}`)
  }

  /**
   * Handle mouse movement for hover detection and rotation
   */
  private onMouseMove(event: MouseEvent): void {
    const canvas = this.renderer.domElement
    const rect = canvas.getBoundingClientRect()
    
    // Update normalized mouse coordinates for raycasting
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Handle camera rotation
    if (this.isRotating) {
      const currentMouse = new THREE.Vector2(
        event.clientX - rect.left,
        event.clientY - rect.top
      )
      
      const deltaX = currentMouse.x - this.lastMousePosition.x
      const deltaY = currentMouse.y - this.lastMousePosition.y
      
      this.rotateCamera(deltaX * 0.01, deltaY * 0.01)
      
      this.lastMousePosition.copy(currentMouse)
    } else {
      // Only update hover when not rotating
      this.updateHover()
    }
  }

  /**
   * Handle mouse down for rotation start
   */
  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // Left mouse button
      const canvas = this.renderer.domElement
      const rect = canvas.getBoundingClientRect()
      
      this.isRotating = true
      this.lastMousePosition.set(
        event.clientX - rect.left,
        event.clientY - rect.top
      )
      
      canvas.style.cursor = 'grabbing'
    }
  }

  /**
   * Handle mouse up for rotation end
   */
  private onMouseUp(event: MouseEvent): void {
    if (event.button === 0) { // Left mouse button
      this.isRotating = false
      this.renderer.domElement.style.cursor = 'grab'
    }
  }

  /**
   * Handle mouse wheel for zooming
   */
  private onMouseWheel(event: WheelEvent): void {
    event.preventDefault()
    
    const zoomSpeed = 0.1
    const zoomDelta = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed
    
    this.cameraDistance *= zoomDelta
    this.cameraDistance = Math.max(10, Math.min(500, this.cameraDistance))
    
    this.updateCameraPosition()
  }

  /**
   * Rotate camera around target
   */
  private rotateCamera(deltaX: number, deltaY: number): void {
    // Only allow rotation in 3D mode
    if (this.cameraMode === '2d') {
      return
    }
    
    // Get current camera position relative to target
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.cameraTarget)
    
    // Convert to spherical coordinates
    const spherical = new THREE.Spherical()
    spherical.setFromVector3(offset)
    
    // Apply rotation
    spherical.theta -= deltaX
    spherical.phi += deltaY
    
    // Constrain phi to prevent flipping
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
    
    // Convert back to cartesian and update camera
    offset.setFromSpherical(spherical)
    this.camera.position.copy(this.cameraTarget).add(offset)
    this.camera.lookAt(this.cameraTarget)
    
    // Update distance
    this.cameraDistance = offset.length()
  }

  /**
   * Update camera position based on current distance and target
   */
  private updateCameraPosition(): void {
    if (this.cameraMode === '2d') {
      // 2D mode: position camera directly above looking down
      this.camera.position.set(
        this.cameraTarget.x,
        this.cameraDistance,
        this.cameraTarget.z
      )
      this.camera.lookAt(this.cameraTarget)
    } else {
      // 3D mode: get current direction from target to camera
      const direction = new THREE.Vector3().subVectors(this.camera.position, this.cameraTarget).normalize()
      
      // Set new position at the desired distance
      this.camera.position.copy(this.cameraTarget).add(direction.multiplyScalar(this.cameraDistance))
      this.camera.lookAt(this.cameraTarget)
    }
  }

  /**
   * Handle mouse clicks for system selection
   */
  private onMouseClick(event: MouseEvent): void {
    const intersectedSystem = this.getIntersectedSystem()
    
    if (intersectedSystem) {
      this.selectSystem(intersectedSystem.userData.systemId)
      
      if (this.onSystemClick) {
        this.onSystemClick(intersectedSystem.userData.systemId)
      }
    } else {
      this.selectSystem(null)
    }
  }

  /**
   * Update hover state based on mouse position
   */
  private updateHover(): void {
    const intersectedSystem = this.getIntersectedSystem()
    const newHoveredId = intersectedSystem?.userData.systemId || null
    
    if (newHoveredId !== this.hoveredSystemId) {
      // Clear previous hover
      if (this.hoveredSystemId && this.hoveredSystemId !== this.selectedSystemId) {
        const prevMesh = this.systemMeshes.get(this.hoveredSystemId)
        if (prevMesh) {
          prevMesh.material = this.defaultMaterial
        }
      }
      
      // Set new hover
      if (newHoveredId && newHoveredId !== this.selectedSystemId) {
        const newMesh = this.systemMeshes.get(newHoveredId)
        if (newMesh) {
          newMesh.material = this.hoveredMaterial
        }
      }
      
      this.hoveredSystemId = newHoveredId
      
      if (this.onSystemHover) {
        this.onSystemHover(newHoveredId)
      }
    }
  }

  /**
   * Get the system under the mouse cursor
   */
  private getIntersectedSystem(): THREE.Mesh | null {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.systemGroup.children)
    
    return intersects.length > 0 ? intersects[0].object as THREE.Mesh : null
  }

  /**
   * Select a system by ID
   */
  selectSystem(systemId: string | null): void {
    // Clear previous selection
    if (this.selectedSystemId) {
      const prevMesh = this.systemMeshes.get(this.selectedSystemId)
      if (prevMesh) {
        prevMesh.material = this.defaultMaterial
      }
    }
    
    // Set new selection
    if (systemId) {
      const mesh = this.systemMeshes.get(systemId)
      if (mesh) {
        mesh.material = this.selectedMaterial
      }
    }
    
    this.selectedSystemId = systemId
  }

  /**
   * Update camera position and target
   */
  updateCamera(position: THREE.Vector3, target: THREE.Vector3): void {
    this.camera.position.copy(position)
    this.camera.lookAt(target)
  }

  /**
   * Animate camera to focus on a specific system
   */
  async focusOnSystem(systemId: string): Promise<void> {
    const mesh = this.systemMeshes.get(systemId)
    if (!mesh) return
    
    const targetPosition = mesh.position.clone()
    const cameraOffset = new THREE.Vector3(0, 20, 50)
    const newCameraPosition = targetPosition.clone().add(cameraOffset)
    
    // Simple animation - in production this would use a proper animation library
    return new Promise(resolve => {
      const startPosition = this.camera.position.clone()
      const startTime = Date.now()
      const duration = 1000 // 1 second
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Smooth easing
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        
        this.camera.position.lerpVectors(startPosition, newCameraPosition, easedProgress)
        this.camera.lookAt(targetPosition)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      animate()
    })
  }

  /**
   * Fit camera to show all systems
   */
  private fitCameraToSystems(): void {
    if (this.systemMeshes.size === 0) return
    
    const box = new THREE.Box3()
    this.systemGroup.children.forEach(child => {
      box.expandByObject(child)
    })
    
    if (box.isEmpty()) return
    
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    
    const distance = maxDim * 2
    this.camera.position.set(center.x, center.y + distance * 0.5, center.z + distance)
    this.camera.lookAt(center)
  }

     /**
    * Handle canvas resize
    */
   private onResize(): void {
     const canvas = this.renderer.domElement
     const width = canvas.clientWidth
     const height = canvas.clientHeight
     
     if (canvas.width !== width || canvas.height !== height) {
       // Set size with proper pixel ratio for crisp rendering
       this.renderer.setSize(width, height, false)
       this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
       
       this.camera.aspect = width / height
       this.camera.updateProjectionMatrix()
       
     }
   }

  /**
   * Clear all system meshes
   */
  private clearSystems(): void {
    this.systemGroup.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
    
    this.systemGroup.clear()
    this.systemMeshes.clear()
    this.selectedSystemId = null
    this.hoveredSystemId = null
  }

  /**
   * Render the scene
   */
  render(): void {
    // Update galaxy uniforms
    if (this.galaxyMaterial && this.galaxyMaterial.uniforms) {
      this.galaxyMaterial.uniforms.time.value = performance.now() * 0.001
      this.galaxyMaterial.uniforms.cameraPosition.value.copy(this.camera.position)
      
      const canvas = this.renderer.domElement
      this.galaxyMaterial.uniforms.resolution.value.set(canvas.width, canvas.height)
    }
    
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Set callback for system clicks
   */
  setOnSystemClick(callback: (systemId: string) => void): void {
    this.onSystemClick = callback
  }

  /**
   * Set callback for system hover
   */
  setOnSystemHover(callback: (systemId: string | null) => void): void {
    this.onSystemHover = callback
  }

  /**
   * Get current canvas size
   */
  getSize(): { width: number; height: number } {
    const canvas = this.renderer.domElement
    return {
      width: canvas.clientWidth,
      height: canvas.clientHeight
    }
  }

  /**
   * Toggle between 2D and 3D camera modes
   */
  toggleCameraMode(): void {
    if (this.isTransitioning) return
    
    this.isTransitioning = true
    const newMode = this.cameraMode === '2d' ? '3d' : '2d'
    
    // Store current camera state
    const startPosition = this.camera.position.clone()
    const startTarget = this.cameraTarget.clone()
    
    // Calculate target positions
    let targetPosition: THREE.Vector3
    
    if (newMode === '2d') {
      // Switch to 2D: position camera directly above looking down
      targetPosition = new THREE.Vector3(
        this.cameraTarget.x,
        this.cameraDistance,
        this.cameraTarget.z
      )
    } else {
      // Switch to 3D: position camera at an angle
      const angle = Math.PI / 4 // 45 degree angle
      const distance = this.cameraDistance
      targetPosition = new THREE.Vector3(
        this.cameraTarget.x + distance * Math.sin(angle),
        distance * 0.5,
        this.cameraTarget.z + distance * Math.cos(angle)
      )
    }
    
    // Animate transition
    const duration = 1000 // 1 second
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth easing
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      
      // Interpolate camera position
      this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress)
      this.camera.lookAt(this.cameraTarget)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        this.cameraMode = newMode
        this.isTransitioning = false
        console.log(`📷 Camera mode switched to ${newMode.toUpperCase()}`)
      }
    }
    
    animate()
  }
  
  /**
   * Get current camera mode
   */
  getCameraMode(): '2d' | '3d' {
    return this.cameraMode
  }
  
  /**
   * Set camera mode directly
   */
  setCameraMode(mode: '2d' | '3d'): void {
    if (mode === this.cameraMode) return
    this.toggleCameraMode()
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clearSystems()
    this.clearHexGrid()
    
    // Dispose materials
    this.defaultMaterial.dispose()
    this.selectedMaterial.dispose()
    this.hoveredMaterial.dispose()
    this.hexTileMaterial.dispose()
    this.hexOutlineMaterial.dispose()
    
    // Dispose galaxy background
    if (this.galaxyMaterial) {
      this.galaxyMaterial.dispose()
    }
    if (this.galaxyBackground) {
      this.galaxyBackground.geometry.dispose()
      this.scene.remove(this.galaxyBackground)
    }
    
    // Remove event listeners
    const canvas = this.renderer.domElement
    canvas.removeEventListener('mousemove', this.onMouseMove.bind(this))
    canvas.removeEventListener('mousedown', this.onMouseDown.bind(this))
    canvas.removeEventListener('mouseup', this.onMouseUp.bind(this))
    canvas.removeEventListener('click', this.onMouseClick.bind(this))
    canvas.removeEventListener('wheel', this.onMouseWheel.bind(this))
    canvas.removeEventListener('resize', this.onResize.bind(this))
    
    // Dispose renderer
    this.renderer.dispose()
  }
} 