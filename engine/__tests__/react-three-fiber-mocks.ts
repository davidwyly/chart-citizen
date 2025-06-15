import { vi } from 'vitest'
import React from 'react'

// Mock @react-three/fiber components
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children, // Render children directly
  extend: vi.fn(),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    scene: {},
    camera: {},
    gl: {},
    size: { width: 1024, height: 768 }
  }))
}))

// Mock Three.js primitives that are used as JSX elements
// These will be rendered as simple divs with data-attributes for testing-library to query
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // Use React.forwardRef for components that might receive refs
    Mesh: React.forwardRef(({ children, ...props }: any, ref) => <div data-three-type="Mesh" {...props} ref={ref}>{children}</div>),
    Group: React.forwardRef(({ children, ...props }: any, ref) => <div data-three-type="Group" {...props} ref={ref}>{children}</div>),
    
    // Mock geometries and materials to render as simple divs
    SphereGeometry: ({ args, ...props }: any) => <div data-three-type="SphereGeometry" data-args={JSON.stringify(args)} {...props} />,
    TorusGeometry: ({ args, ...props }: any) => <div data-three-type="TorusGeometry" data-args={JSON.stringify(args)} {...props} />,
    MeshBasicMaterial: (props: any) => <div data-three-type="MeshBasicMaterial" {...props} />,

    // Keep original functions/classes for non-JSX usage where actual logic might be needed
    Vector3: actual.Vector3,
    Color: actual.Color,
    Object3D: actual.Object3D,
    // Add other actual THREE objects if needed for non-JSX logic within components
    // e.g., Clock, TextureLoader, etc.
    Clock: actual.Clock,
    TextureLoader: actual.TextureLoader,
    DoubleSide: actual.DoubleSide, // Assuming this is a constant, keep actual
    ShaderMaterial: actual.ShaderMaterial,
    UniformsUtils: actual.UniformsUtils,
    RawShaderMaterial: actual.RawShaderMaterial,
    DataTexture: actual.DataTexture,
    RGBFormat: actual.RGBFormat,
    NearestFilter: actual.NearestFilter,
    UnsignedByteType: actual.UnsignedByteType,
    CustomBlending: actual.CustomBlending,
    AdditiveBlending: actual.AdditiveBlending,
    NormalBlending: actual.NormalBlending,
    NoBlending: actual.NoBlending,
    VertexColors: actual.VertexColors,
    UniformsGroup: actual.UniformsGroup,
    Matrix4: actual.Matrix4,
    Vector2: actual.Vector2,
    CylinderGeometry: actual.CylinderGeometry,
    BufferAttribute: actual.BufferAttribute,
    Float32BufferAttribute: actual.Float32BufferAttribute,
    DynamicDrawUsage: actual.DynamicDrawUsage,
    LineSegments: actual.LineSegments,
    LineBasicMaterial: actual.LineBasicMaterial,
    BufferGeometry: actual.BufferGeometry,
    InstancedMesh: actual.InstancedMesh,
    InstancedBufferAttribute: actual.InstancedBufferAttribute,
    Raycaster: actual.Raycaster,
    Quaternion: actual.Quaternion,
    AxesHelper: actual.AxesHelper,
    GridHelper: actual.GridHelper,
    PlaneGeometry: actual.PlaneGeometry,
    MeshLambertMaterial: actual.MeshLambertMaterial,
    Fog: actual.Fog,
    PointLightHelper: actual.PointLightHelper,
    RectAreaLight: actual.RectAreaLight,
    RectAreaLightHelper: actual.RectAreaLightHelper,
    SRGBColorSpace: actual.SRGBColorSpace,
    ACESFilmicToneMapping: actual.ACESFilmicToneMapping,
    TangentSpaceNormalMap: actual.TangentSpaceNormalMap,
    WebGLCubeRenderTarget: actual.WebGLCubeRenderTarget,
    CubeCamera: actual.CubeCamera,
    LinearMipmapLinearFilter: actual.LinearMipmapLinearFilter,
    LinearFilter: actual.LinearFilter,
    RGBADepthPacking: actual.RGBADepthPacking,
    BasicShadowMap: actual.BasicShadowMap,
    PCFShadowMap: actual.PCFShadowMap,
    PCFSoftShadowMap: actual.PCFSoftShadowMap,
    VSMShadowMap: actual.VSMShadowMap,
    MeshDepthMaterial: actual.MeshDepthMaterial,
    MeshDistanceMaterial: actual.MeshDistanceMaterial,
    PerspectiveCamera: actual.PerspectiveCamera,
    OrthographicCamera: actual.OrthographicCamera,
    BoxGeometry: actual.BoxGeometry,
    LOD: actual.LOD,
  }
})

// Mock custom materials that are imported and used as components
vi.mock('../../planets/materials/terrestrial-planet-material', () => ({
  TerrestrialPlanetMaterial: (props: any) => <div data-testid="terrestrial-material" {...props} />
}))

vi.mock('../../stars/materials/star-material', () => ({
  StarMaterial: (props: any) => <div data-testid="star-material" {...props} />
}))

// Mock PlanetRingsRenderer
vi.mock('../../planets/planet-rings-renderer', () => ({
  PlanetRingsRenderer: (props: any) => <div data-testid="planet-rings" {...props} />
})) 