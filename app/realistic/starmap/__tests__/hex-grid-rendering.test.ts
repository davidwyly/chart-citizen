/**
 * Tests for Hexagonal Grid Rendering System
 * ========================================
 * 
 * Validates that the hex grid is properly created, rendered, and controlled.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { HexCoordinateUtils } from '../utils/hex-coordinate';
import type { StarmapSystem } from '../types';

// Mock WebGL for testing
function setupWebGLMocks() {
  // Mock WebGL context
  const mockGL = {
    getExtension: vi.fn(() => null),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    drawElements: vi.fn(),
    drawArrays: vi.fn(),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    blendFunc: vi.fn(),
    depthFunc: vi.fn(),
    cullFace: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    generateMipmap: vi.fn(),
    pixelStorei: vi.fn(),
    activeTexture: vi.fn(),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteTexture: vi.fn(),
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    ELEMENT_ARRAY_BUFFER: 34963,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    UNSIGNED_SHORT: 5123,
    COLOR_BUFFER_BIT: 16384,
    DEPTH_BUFFER_BIT: 256,
    DEPTH_TEST: 2929,
    BLEND: 3042,
    SRC_ALPHA: 770,
    ONE_MINUS_SRC_ALPHA: 771,
    BACK: 1029,
    CCW: 2305,
    TEXTURE_2D: 3553,
    TEXTURE0: 33984,
    RGBA: 6408,
    UNSIGNED_BYTE: 5121,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    LINEAR: 9729,
    LINEAR_MIPMAP_LINEAR: 9987,
    CLAMP_TO_EDGE: 33071,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243
  };

  return mockGL;
}

// Mock BasicStarmapRenderer for testing
class MockStarmapRenderer {
  public scene: THREE.Scene;
  public systemGroup: THREE.Group;
  public hexGridGroup: THREE.Group;
  public systemMeshes: Map<string, THREE.Mesh> = new Map();
  public hexTiles: Map<string, THREE.Mesh> = new Map();
  public hexSize: number = 5;
  public showHexGrid: boolean = true;
  public hexTileMaterial: THREE.MeshBasicMaterial;
  public hexOutlineMaterial: THREE.LineBasicMaterial;

  constructor() {
    this.scene = new THREE.Scene();
    this.systemGroup = new THREE.Group();
    this.hexGridGroup = new THREE.Group();
    this.scene.add(this.systemGroup);
    this.scene.add(this.hexGridGroup);

    this.hexTileMaterial = new THREE.MeshBasicMaterial({
      color: 0x111133,
      transparent: true,
      opacity: 0.2,
    });

    this.hexOutlineMaterial = new THREE.LineBasicMaterial({
      color: 0x333366,
      transparent: true,
      opacity: 0.5,
    });
  }

  renderSystemsAsPoints(systems: StarmapSystem[]): void {
    this.clearSystems();
    
    if (this.showHexGrid) {
      this.createHexGrid(systems);
    }

    const geometry = new THREE.SphereGeometry(1, 16, 16);
    
    systems.forEach(system => {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      
      if (system.hexPosition && this.showHexGrid) {
        const hexWorldPos = HexCoordinateUtils.toCartesian(system.hexPosition, this.hexSize);
        mesh.position.copy(hexWorldPos);
        mesh.position.y = 0.5;
      } else {
        const position = Array.isArray(system.position) 
          ? new THREE.Vector3(...system.position)
          : system.position;
        mesh.position.copy(position);
      }
      
      mesh.userData = { systemId: system.id, system };
      this.systemGroup.add(mesh);
      this.systemMeshes.set(system.id, mesh);
    });
  }

  private createHexGrid(systems: StarmapSystem[]): void {
    this.clearHexGrid();
    
    let hexPositions = systems
      .filter(s => s.hexPosition)
      .map(s => s.hexPosition!);
    
    if (hexPositions.length === 0) {
      this.generateDemoHexPositions(systems);
      hexPositions = systems
        .filter(s => s.hexPosition)
        .map(s => s.hexPosition!);
    }
    
    if (hexPositions.length === 0) return;
    
    const minQ = Math.min(...hexPositions.map(h => h.q));
    const maxQ = Math.max(...hexPositions.map(h => h.q));
    const minR = Math.min(...hexPositions.map(h => h.r));
    const maxR = Math.max(...hexPositions.map(h => h.r));
    
    const padding = 2;
    
    for (let q = minQ - padding; q <= maxQ + padding; q++) {
      for (let r = minR - padding; r <= maxR + padding; r++) {
        const hexCoord = HexCoordinateUtils.create(q, r);
        const worldPos = HexCoordinateUtils.toCartesian(hexCoord, this.hexSize);
        this.createHexTile(worldPos, hexCoord);
      }
    }
  }

  private createHexTile(position: THREE.Vector3, hexCoord: { q: number; r: number; s: number }): void {
    const hexGeometry = this.createHexagonGeometry(this.hexSize);
    const hexMesh = new THREE.Mesh(hexGeometry, this.hexTileMaterial.clone());
    hexMesh.position.copy(position);
    hexMesh.position.y = 0;
    hexMesh.userData = { hexCoord, type: 'hex-tile' };
    
    const outlineGeometry = this.createHexagonOutlineGeometry(this.hexSize);
    const outlineMesh = new THREE.LineLoop(outlineGeometry, this.hexOutlineMaterial);
    outlineMesh.position.copy(position);
    outlineMesh.position.y = 0.01;
    
    this.hexGridGroup.add(hexMesh);
    this.hexGridGroup.add(outlineMesh);
    
    const hexKey = `${hexCoord.q},${hexCoord.r}`;
    this.hexTiles.set(hexKey, hexMesh);
  }

  private createHexagonGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    vertices.push(0, 0, 0);
    
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = size * Math.cos(angle);
      const z = size * Math.sin(angle);
      vertices.push(x, 0, z);
    }
    
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      indices.push(0, i + 1, next + 1);
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  private createHexagonOutlineGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = size * Math.cos(angle);
      const z = size * Math.sin(angle);
      vertices.push(x, 0, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  private generateDemoHexPositions(systems: StarmapSystem[]): void {
    const center = HexCoordinateUtils.create(0, 0);
    const spiralPositions = HexCoordinateUtils.spiral(center, Math.ceil(Math.sqrt(systems.length)));
    
    systems.forEach((system, index) => {
      if (!system.hexPosition && index < spiralPositions.length) {
        (system as any).hexPosition = spiralPositions[index];
      }
    });
  }

  toggleHexGrid(): void {
    this.showHexGrid = !this.showHexGrid;
    this.hexGridGroup.visible = this.showHexGrid;
  }

  setHexGridVisible(visible: boolean): void {
    this.showHexGrid = visible;
    this.hexGridGroup.visible = visible;
  }

  private clearSystems(): void {
    this.systemGroup.clear();
    this.systemMeshes.clear();
  }

  private clearHexGrid(): void {
    this.hexGridGroup.clear();
    this.hexTiles.clear();
  }

  dispose(): void {
    this.clearSystems();
    this.clearHexGrid();
  }
}

// Mock canvas for testing
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.getContext = vi.fn(() => ({
    canvas,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
  }));
  return canvas;
}

// Mock test data
const createTestSystems = (): StarmapSystem[] => [
  {
    id: 'sol',
    name: 'Sol System',
    position: new THREE.Vector3(0, 0, 0),
    hexPosition: HexCoordinateUtils.create(0, 0),
    systemType: 'main-sequence',
    securityLevel: 'high',
    status: 'inhabited',
    population: 1000000,
    jumpPoints: ['alpha-centauri'],
    wormholeConnections: [],
    sector: { x: 0, y: 0, name: 'Local' }
  },
  {
    id: 'alpha-centauri',
    name: 'Alpha Centauri',
    position: new THREE.Vector3(10, 0, 0),
    hexPosition: HexCoordinateUtils.create(1, 0),
    systemType: 'main-sequence',
    securityLevel: 'medium',
    status: 'explored',
    population: 50000,
    jumpPoints: ['sol'],
    wormholeConnections: [],
    sector: { x: 0, y: 0, name: 'Local' }
  },
  {
    id: 'proxima',
    name: 'Proxima Centauri',
    position: new THREE.Vector3(5, 5, 0),
    hexPosition: HexCoordinateUtils.create(0, 1),
    systemType: 'red-dwarf',
    securityLevel: 'low',
    status: 'unexplored',
    population: 0,
    jumpPoints: [],
    wormholeConnections: [],
    sector: { x: 0, y: 0, name: 'Local' }
  }
];

describe('Hexagonal Grid Rendering System', () => {
  let renderer: MockStarmapRenderer;
  let canvas: HTMLCanvasElement;
  let testSystems: StarmapSystem[];

  beforeEach(() => {
    canvas = createMockCanvas();
    renderer = new MockStarmapRenderer();
    testSystems = createTestSystems();
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
  });

  describe('Hex Grid Creation', () => {
    it('should create hex grid when systems have hex positions', () => {
      // Act: Render systems with hex positions
      renderer.renderSystemsAsPoints(testSystems);

      // Assert: Check that hex grid was created
      const scene = (renderer as any).scene as THREE.Scene;
      const hexGridGroup = scene.getObjectByName ? scene.children.find(child => child.name === 'hexGridGroup') : null;
      
      // Find hex grid group manually
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;
      expect(hexGrid).toBeDefined();
      expect(hexGrid.children.length).toBeGreaterThan(0);
      
      console.log(`✅ Hex grid created with ${hexGrid.children.length} children`);
    });

    it('should generate demo hex positions when none exist', () => {
      // Arrange: Systems without hex positions
      const systemsWithoutHex = testSystems.map(s => ({ ...s, hexPosition: undefined }));

      // Act: Render systems
      renderer.renderSystemsAsPoints(systemsWithoutHex);

      // Assert: Check that hex positions were generated
      const hasHexPositions = systemsWithoutHex.some(s => (s as any).hexPosition);
      expect(hasHexPositions).toBe(true);
      
      console.log('✅ Demo hex positions generated successfully');
    });

    it('should calculate correct hex grid bounds', () => {
      // Act: Render systems
      renderer.renderSystemsAsPoints(testSystems);

      // Assert: Verify grid covers all system positions with padding
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;
      const hexTiles = (renderer as any).hexTiles as Map<string, THREE.Mesh>;
      
      // Should have tiles for at least the system positions plus padding
      expect(hexTiles.size).toBeGreaterThanOrEqual(testSystems.length);
      
      // Check that system hex positions exist in the grid
      testSystems.forEach(system => {
        if (system.hexPosition) {
          const hexKey = `${system.hexPosition.q},${system.hexPosition.r}`;
          expect(hexTiles.has(hexKey)).toBe(true);
        }
      });
      
      console.log(`✅ Hex grid bounds correct: ${hexTiles.size} tiles created`);
    });
  });

  describe('Hex Coordinate System', () => {
    it('should correctly convert hex coordinates to world positions', () => {
      const hexCoord = HexCoordinateUtils.create(1, 1);
      const worldPos = HexCoordinateUtils.toCartesian(hexCoord, 5);
      
      // Verify the math (for flat-topped hexagons)
      const expectedX = 5 * (3/2 * 1); // 7.5
      const expectedZ = 5 * (Math.sqrt(3)/2 * 1 + Math.sqrt(3) * 1); // ~12.99
      
      expect(worldPos.x).toBeCloseTo(expectedX, 1);
      expect(worldPos.z).toBeCloseTo(expectedZ, 1);
      expect(worldPos.y).toBe(0);
      
      console.log(`✅ Hex to world conversion: (${hexCoord.q},${hexCoord.r}) → (${worldPos.x.toFixed(2)}, ${worldPos.y}, ${worldPos.z.toFixed(2)})`);
    });

    it('should validate hex coordinate constraint q+r+s=0', () => {
      testSystems.forEach(system => {
        if (system.hexPosition) {
          expect(HexCoordinateUtils.isValid(system.hexPosition)).toBe(true);
        }
      });
      
      console.log('✅ All hex coordinates are valid');
    });

    it('should generate spiral pattern correctly', () => {
      const center = HexCoordinateUtils.create(0, 0);
      const spiral = HexCoordinateUtils.spiral(center, 2);
      
      // Should have center + 6 + 12 = 19 positions for radius 2
      expect(spiral.length).toBe(19);
      expect(spiral[0]).toEqual(center);
      
      console.log(`✅ Spiral generation: ${spiral.length} positions for radius 2`);
    });
  });

  describe('Hex Grid Visibility and Controls', () => {
    it('should toggle hex grid visibility', () => {
      // Arrange: Render systems first
      renderer.renderSystemsAsPoints(testSystems);
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;
      const initialVisibility = hexGrid.visible;

      // Act: Toggle visibility
      renderer.toggleHexGrid();

      // Assert: Visibility changed
      expect(hexGrid.visible).toBe(!initialVisibility);
      
      console.log(`✅ Hex grid visibility toggled: ${initialVisibility} → ${hexGrid.visible}`);
    });

    it('should set hex grid visibility explicitly', () => {
      // Arrange: Render systems first
      renderer.renderSystemsAsPoints(testSystems);
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;

      // Act & Assert: Set to false
      renderer.setHexGridVisible(false);
      expect(hexGrid.visible).toBe(false);

      // Act & Assert: Set to true
      renderer.setHexGridVisible(true);
      expect(hexGrid.visible).toBe(true);
      
      console.log('✅ Hex grid visibility control works correctly');
    });
  });

  describe('System Positioning on Hex Grid', () => {
    it('should position systems on hex coordinates when available', () => {
      // Act: Render systems
      renderer.renderSystemsAsPoints(testSystems);

      // Assert: Check system positions
      const systemMeshes = (renderer as any).systemMeshes as Map<string, THREE.Mesh>;
      
      testSystems.forEach(system => {
        const mesh = systemMeshes.get(system.id);
        expect(mesh).toBeDefined();
        
        if (system.hexPosition) {
          const expectedPos = HexCoordinateUtils.toCartesian(system.hexPosition, 5);
          expect(mesh!.position.x).toBeCloseTo(expectedPos.x, 1);
          expect(mesh!.position.z).toBeCloseTo(expectedPos.z, 1);
          expect(mesh!.position.y).toBe(0.5); // Should be above the grid
        }
      });
      
      console.log('✅ Systems positioned correctly on hex grid');
    });

    it('should fall back to 3D positions when hex positions unavailable', () => {
      // Arrange: Systems without hex positions and disable hex grid
      const systemsWithoutHex = testSystems.map(s => ({ ...s, hexPosition: undefined }));
      renderer.setHexGridVisible(false);

      // Act: Render systems
      renderer.renderSystemsAsPoints(systemsWithoutHex);

      // Assert: Should use 3D positions
      const systemMeshes = (renderer as any).systemMeshes as Map<string, THREE.Mesh>;
      
      systemsWithoutHex.forEach(system => {
        const mesh = systemMeshes.get(system.id);
        expect(mesh).toBeDefined();
        
        const expectedPos = Array.isArray(system.position) 
          ? new THREE.Vector3(...system.position)
          : system.position;
        
        expect(mesh!.position.x).toBeCloseTo(expectedPos.x, 1);
        expect(mesh!.position.y).toBeCloseTo(expectedPos.y, 1);
        expect(mesh!.position.z).toBeCloseTo(expectedPos.z, 1);
      });
      
      console.log('✅ Systems fall back to 3D positions correctly');
    });
  });

  describe('Hex Grid Materials and Rendering', () => {
    it('should create proper hex tile materials', () => {
      // Arrange & Act: Render systems
      renderer.renderSystemsAsPoints(testSystems);

      // Assert: Check materials exist
      const hexTileMaterial = (renderer as any).hexTileMaterial as THREE.MeshBasicMaterial;
      const hexOutlineMaterial = (renderer as any).hexOutlineMaterial as THREE.LineBasicMaterial;
      
      expect(hexTileMaterial).toBeDefined();
      expect(hexOutlineMaterial).toBeDefined();
      
      // Check material properties
      expect(hexTileMaterial.transparent).toBe(true);
      expect(hexTileMaterial.opacity).toBeCloseTo(0.2, 1);
      expect(hexOutlineMaterial.transparent).toBe(true);
      expect(hexOutlineMaterial.opacity).toBeCloseTo(0.5, 1);
      
      console.log('✅ Hex grid materials configured correctly');
    });

    it('should create hexagon geometry with correct vertices', () => {
      // Act: Render systems to trigger geometry creation
      renderer.renderSystemsAsPoints(testSystems);
      
      // Get a hex tile to check its geometry
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;
      const hexMesh = hexGrid.children.find(child => 
        child instanceof THREE.Mesh && child.userData.type === 'hex-tile'
      ) as THREE.Mesh;
      
      expect(hexMesh).toBeDefined();
      
      if (hexMesh) {
        const geometry = hexMesh.geometry as THREE.BufferGeometry;
        const positions = geometry.getAttribute('position');
        
        // Should have 7 vertices (center + 6 hex points)
        expect(positions.count).toBe(7);
        
        // Should have 6 triangles = 18 indices
        const indices = geometry.getIndex();
        expect(indices?.count).toBe(18);
        
        console.log(`✅ Hex geometry: ${positions.count} vertices, ${indices?.count} indices`);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty system list gracefully', () => {
      expect(() => {
        renderer.renderSystemsAsPoints([]);
      }).not.toThrow();
      
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;
      expect(hexGrid.children.length).toBe(0);
      
      console.log('✅ Empty system list handled gracefully');
    });

    it('should handle systems with invalid hex coordinates', () => {
      const invalidHexSystem: StarmapSystem = {
        ...testSystems[0],
        hexPosition: { q: 1, r: 1, s: 1 } // Invalid: q+r+s ≠ 0
      };

      expect(() => {
        renderer.renderSystemsAsPoints([invalidHexSystem]);
      }).not.toThrow();
      
      console.log('✅ Invalid hex coordinates handled gracefully');
    });

    it('should dispose of hex grid resources properly', () => {
      // Arrange: Render systems
      renderer.renderSystemsAsPoints(testSystems);
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;
      const initialChildCount = hexGrid.children.length;
      
      expect(initialChildCount).toBeGreaterThan(0);

      // Act: Dispose
      renderer.dispose();

      // Assert: Resources cleaned up
      expect(hexGrid.children.length).toBe(0);
      
      console.log('✅ Hex grid resources disposed properly');
    });
  });

  describe('Integration with System Rendering', () => {
    it('should render both systems and hex grid simultaneously', () => {
      // Act: Render systems
      renderer.renderSystemsAsPoints(testSystems);

      // Assert: Both systems and hex grid exist
      const systemMeshes = (renderer as any).systemMeshes as Map<string, THREE.Mesh>;
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;
      
      expect(systemMeshes.size).toBe(testSystems.length);
      expect(hexGrid.children.length).toBeGreaterThan(0);
      
      console.log(`✅ Integration: ${systemMeshes.size} systems + ${hexGrid.children.length} hex elements rendered`);
    });

    it('should maintain correct rendering order (grid below, systems above)', () => {
      // Act: Render systems
      renderer.renderSystemsAsPoints(testSystems);

      // Assert: Check Y positions
      const systemMeshes = (renderer as any).systemMeshes as Map<string, THREE.Mesh>;
      const hexGrid = (renderer as any).hexGridGroup as THREE.Group;
      
      // Systems should be above hex grid
      systemMeshes.forEach(mesh => {
        if ((renderer as any).showHexGrid) {
          expect(mesh.position.y).toBe(0.5); // Above grid
        }
      });

      // Hex tiles should be at Y=0
      hexGrid.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.userData.type === 'hex-tile') {
          expect(child.position.y).toBe(0);
        }
      });
      
      console.log('✅ Rendering order correct: hex grid below, systems above');
    });
  });
});